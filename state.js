import {
  SOURCES,
  UPGRADES,
  OBJECTIVES,
  EVENTS,
  BASE_PRICE,
  START_MONEY,
  START_PLOTS,
  START_DEMAND,
  DEMAND_TAU,
  DEMAND_FOLLOW,
  DEMAND_LAG,
  PRICE_TAU,
  BASE_ABSORPTION,
  CO2_HALF,
  START_CREW,
  MAX_CREW,
  CLICK_BASE,
  COST_GROWTH,
  LAND_BASE_COST,
  LAND_COST_GROWTH,
  LAND_PER_EXPANSION,
  OFFLINE_EFFICIENCY,
  MAX_OFFLINE,
} from "./tech.js";
import { money as fmtMoney } from "./format.js";

const SAVE_KEY = "co2mpromise.save.v2";
const SAVE_VERSION = 2;

export const SOURCE_BY_ID = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

function initialPlots() {
  return Array.from({ length: START_PLOTS }, () => null);
}

function createInitialState() {
  return {
    money: START_MONEY,
    totalEarned: 0,
    clicks: 0,
    co2: 0,
    time: 0,
    demand: START_DEMAND,
    price: BASE_PRICE,

    // Each entry is null (empty land) or a structure:
    //   { id, status: "building" | "built", remaining, total }
    plots: initialPlots(),
    purchases: {},
    upgrades: {},
    objectives: {},
    expansions: 0,
    crew: START_CREW,

    event: null,
    nextEventIn: 90,
    history: [],
    _histAcc: 0,

    metrics: null,
    events: [],
  };
}

export const state = createInitialState();

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

export function timeDemandAt(t = state.time) {
  return START_DEMAND * Math.pow(1 + t / DEMAND_TAU, 1.3);
}

export function sourceCost(id) {
  const def = SOURCE_BY_ID[id];
  if (!def) return Infinity;
  const built = state.purchases[id] || 0;
  return Math.ceil(def.cost * Math.pow(COST_GROWTH, built));
}

export function landCost() {
  return Math.ceil(LAND_BASE_COST * Math.pow(LAND_COST_GROWTH, state.expansions));
}

export function isUnlocked(id) {
  const def = SOURCE_BY_ID[id];
  if (!def) return false;
  return state.totalEarned >= def.unlockAt || (state.purchases[id] || 0) > 0;
}

export function sourcePowerMult(id) {
  let mult = 1;
  for (const u of UPGRADES) {
    if (state.upgrades[u.id] && u.effects.sourceMult && u.effects.sourceMult[id]) {
      mult *= u.effects.sourceMult[id];
    }
  }
  return mult;
}

export function sourceCo2Mult(id) {
  let mult = 1;
  for (const u of UPGRADES) {
    if (state.upgrades[u.id] && u.effects.sourceCo2Mult && u.effects.sourceCo2Mult[id]) {
      mult *= u.effects.sourceCo2Mult[id];
    }
  }
  return mult;
}

function upgradeSum(key) {
  let sum = 0;
  for (const u of UPGRADES) {
    if (state.upgrades[u.id] && u.effects[key]) sum += u.effects[key];
  }
  return sum;
}

export function clickIncome() {
  return CLICK_BASE + upgradeSum("click");
}

export function sourceStats(id) {
  const def = SOURCE_BY_ID[id];
  if (!def) return { power: 0, co2: 0 };
  return {
    power: (def.power || 0) * sourcePowerMult(id),
    co2: (def.co2 || 0) * sourceCo2Mult(id),
  };
}

// Recomputes everything the UI reads. Cheap enough to call several times a tick.
export function recomputeMetrics() {
  const counts = {};
  let power = 0;
  let grossEmissions = 0;
  let builtCount = 0;
  let renewables = 0;

  const solarEventMult = state.event && state.event.mods ? (state.event.mods.solarMult || 1) : 1;

  for (const plot of state.plots) {
    if (!plot || plot.status !== "built") continue;
    const def = SOURCE_BY_ID[plot.id];
    if (!def) continue;

    builtCount++;
    counts[plot.id] = (counts[plot.id] || 0) + 1;
    if ((def.tags || []).includes("renewable")) renewables++;

    let p = (def.power || 0) * sourcePowerMult(plot.id);
    if (plot.id === "solar_panel") p *= solarEventMult;
    power += p;

    grossEmissions += (def.co2 || 0) * sourceCo2Mult(plot.id);
  }

  const freePlots = state.plots.reduce((n, p) => n + (p ? 0 : 1), 0);
  const buildingPlots = state.plots.reduce(
    (n, p) => n + (p && p.status === "building" ? 1 : 0),
    0
  );

  const absorption = BASE_ABSORPTION + upgradeSum("absorption");
  const netEmissions = grossEmissions - absorption;

  const mods = state.event && state.event.mods ? state.event.mods : {};
  const demand = state.demand * (mods.demandMult || 1);
  const coverage = demand > 0 ? power / demand : 0;

  const pollutionPenalty =
    (0.3 + 0.7 / (1 + state.co2 / CO2_HALF)) * (mods.pollutionMult || 1);
  const priceMult = (1 + upgradeSum("priceMult")) * (mods.priceMult || 1);

  const priceTarget = clamp(
    BASE_PRICE * Math.pow(demand / Math.max(power, 0.1), 0.25) * priceMult,
    BASE_PRICE * 0.5,
    BASE_PRICE * 2
  );

  const income = power * state.price * pollutionPenalty;
  const carbonIntensity = power > 0 ? Math.max(0, grossEmissions) / power : 0;

  state.metrics = {
    counts,
    power,
    builtCount,
    renewables,
    grossEmissions,
    absorption,
    netEmissions,
    demand,
    coverage,
    pollutionPenalty,
    priceTarget,
    income,
    carbonIntensity,
    freePlots,
    buildingPlots,
    co2: state.co2,
    price: state.price,
    clickIncome: clickIncome(),
  };
  return state.metrics;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

function emit(event) {
  state.events.push(event);
  if (state.events.length > 60) state.events.shift();
}

export function drainEvents() {
  const drained = state.events;
  state.events = [];
  return drained;
}

function triggerEvent() {
  const eligible = EVENTS.filter((e) => !e.condition || e.condition(state));
  if (!eligible.length) return;
  const def = eligible[Math.floor(Math.random() * eligible.length)];
  if (!def) return;

  if (def.instant) {
    const gain = Math.max(500, (state.metrics ? state.metrics.income : 0) * (def.grantFactor || 30));
    state.money += gain;
    state.totalEarned += gain;
    emit({ type: "event", kind: "good", name: def.name, detail: `+${fmtMoney(gain)}` });
    return;
  }

  state.event = {
    id: def.id,
    name: def.name,
    desc: def.desc,
    duration: def.duration,
    remaining: def.duration,
    mods: def.mods || {},
    kind: def.kind || "info",
  };
  emit({ type: "event", kind: state.event.kind, name: def.name, detail: def.desc });
}

function updateEvents(dt) {
  if (state.event) {
    state.event.remaining -= dt;
    if (state.event.remaining <= 0) {
      emit({ type: "eventEnd", name: state.event.name });
      state.event = null;
    }
    return;
  }

  state.nextEventIn -= dt;
  if (state.time > 60 && state.nextEventIn <= 0) {
    triggerEvent();
    state.nextEventIn = 90 + Math.random() * 60;
  }
}

function checkObjectives() {
  const m = state.metrics;
  if (!m) return;
  for (const obj of OBJECTIVES) {
    if (state.objectives[obj.id]) continue;
    let done = false;
    try {
      done = !!obj.check(state, m);
    } catch {
      done = false;
    }
    if (!done) continue;

    state.objectives[obj.id] = true;
    state.money += obj.reward;
    state.totalEarned += obj.reward;
    emit({ type: "objective", name: obj.name, reward: obj.reward, id: obj.id });
  }
}

export function tick(dt = 0) {
  if (!(dt > 0)) return;
  state.time += dt;

  // Finish construction.
  for (const plot of state.plots) {
    if (plot && plot.status === "building") {
      plot.remaining -= dt;
      if (plot.remaining <= 0) {
        plot.status = "built";
        plot.remaining = 0;
        const def = SOURCE_BY_ID[plot.id];
        emit({ type: "built", name: def ? def.name : "Structure", id: plot.id });
      }
    }
  }

  updateEvents(dt);
  recomputeMetrics();

  // Demand is a smoothed mix of a growing customer base and your capacity.
  const targetDemand = Math.max(timeDemandAt(), state.metrics.power * DEMAND_FOLLOW);
  state.demand += (targetDemand - state.demand) * (1 - Math.exp(-dt / DEMAND_LAG));

  recomputeMetrics();
  const m = state.metrics;

  // Market price settles toward the supply/demand target with a little noise.
  const k = 1 - Math.exp(-dt / PRICE_TAU);
  state.price += (m.priceTarget - state.price) * k;
  state.price += (Math.random() - 0.5) * 0.01 * Math.min(1, dt);
  state.price = clamp(state.price, BASE_PRICE * 0.5, BASE_PRICE * 2);

  const income = m.power * state.price * m.pollutionPenalty;
  state.money += income * dt;
  state.totalEarned += income * dt;

  state.co2 = Math.max(0, state.co2 + m.netEmissions * dt);

  // Chart history, one sample per second.
  state._histAcc += dt;
  if (state._histAcc >= 1) {
    state._histAcc -= 1;
    state.history.push({ power: m.power, demand: m.demand, price: state.price });
    if (state.history.length > 150) state.history.shift();
  }

  checkObjectives();
  recomputeMetrics();
}

// ---------------------------------------------------------------------------
// Player actions
// ---------------------------------------------------------------------------

export function validateBuy(id) {
  const def = SOURCE_BY_ID[id];
  const cost = sourceCost(id);
  if (!def) return { ok: false, reason: "Unknown structure", cost };
  if (!isUnlocked(id)) {
    return { ok: false, reason: `Unlocks at ${fmtMoney(def.unlockAt)} earned`, cost };
  }
  if (state.money < cost) return { ok: false, reason: "Not enough money", cost };
  if (!state.plots.some((p) => !p)) {
    return { ok: false, reason: "No free land — expand your site", cost };
  }
  if (def.buildTime > 0 && state.metrics.buildingPlots >= state.crew) {
    return { ok: false, reason: "All construction crews are busy", cost };
  }
  return { ok: true, reason: "", cost };
}

export function buySource(id) {
  const check = validateBuy(id);
  if (!check.ok) return check;

  const def = SOURCE_BY_ID[id];
  const plotIndex = state.plots.findIndex((p) => !p);
  if (plotIndex < 0) return { ok: false, reason: "No free land", cost: check.cost };

  state.money -= check.cost;
  state.purchases[id] = (state.purchases[id] || 0) + 1;

  if (def.buildTime > 0) {
    state.plots[plotIndex] = {
      id,
      status: "building",
      remaining: def.buildTime,
      total: def.buildTime,
    };
    emit({ type: "buildStart", name: def.name, time: def.buildTime });
  } else {
    state.plots[plotIndex] = { id, status: "built" };
    emit({ type: "built", name: def.name, id });
  }

  recomputeMetrics();
  return check;
}

export function validateUpgrade(id) {
  const up = UPGRADE_BY_ID[id];
  if (!up) return { ok: false, reason: "Unknown research" };
  if (state.upgrades[id]) return { ok: false, reason: "Already researched" };

  const m = state.metrics || recomputeMetrics();
  if (up.requires && (m.counts[up.requires.source] || 0) < up.requires.count) {
    const def = SOURCE_BY_ID[up.requires.source];
    return {
      ok: false,
      reason: `Requires ${up.requires.count}× ${def ? def.name : up.requires.source}`,
    };
  }
  if (state.money < up.cost) return { ok: false, reason: "Not enough money" };
  return { ok: true, reason: "" };
}

export function researchUpgrade(id) {
  const check = validateUpgrade(id);
  if (!check.ok) return check;

  const up = UPGRADE_BY_ID[id];
  state.money -= up.cost;
  state.upgrades[id] = true;
  if (up.effects.crew) state.crew = Math.min(MAX_CREW, state.crew + up.effects.crew);
  emit({ type: "research", name: up.name });
  recomputeMetrics();
  return check;
}

export function expandLand() {
  const cost = landCost();
  if (state.money < cost) return { ok: false, reason: "Not enough money", cost };
  state.money -= cost;
  state.expansions++;
  for (let i = 0; i < LAND_PER_EXPANSION; i++) state.plots.push(null);
  emit({ type: "land", plots: LAND_PER_EXPANSION });
  recomputeMetrics();
  return { ok: true, cost };
}

export function handCrank() {
  const amount = clickIncome();
  state.money += amount;
  state.totalEarned += amount;
  state.clicks++;
  recomputeMetrics();
  return amount;
}

// ---------------------------------------------------------------------------
// Save / load / reset
// ---------------------------------------------------------------------------

function sanitizePlot(p) {
  if (!p || !SOURCE_BY_ID[p.id]) return null;
  if (p.status === "building") {
    const total = Number(p.total) || SOURCE_BY_ID[p.id].buildTime || 1;
    const remaining = Math.max(0, Number(p.remaining) || 0);
    return { id: p.id, status: "building", total, remaining };
  }
  return { id: p.id, status: "built" };
}

export function saveGame() {
  if (typeof localStorage === "undefined") return false;
  try {
    const data = {
      v: SAVE_VERSION,
      savedAt: Date.now(),
      money: state.money,
      totalEarned: state.totalEarned,
      clicks: state.clicks,
      co2: state.co2,
      time: state.time,
      demand: state.demand,
      price: state.price,
      plots: state.plots,
      purchases: state.purchases,
      upgrades: state.upgrades,
      objectives: state.objectives,
      expansions: state.expansions,
      crew: state.crew,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadGame() {
  if (typeof localStorage === "undefined") return false;

  let data;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    data = JSON.parse(raw);
  } catch {
    return false;
  }
  if (!data || data.v !== SAVE_VERSION) return false;

  state.money = Number.isFinite(data.money) ? data.money : START_MONEY;
  state.totalEarned = Number.isFinite(data.totalEarned) ? data.totalEarned : 0;
  state.clicks = Number.isFinite(data.clicks) ? data.clicks : 0;
  state.co2 = Number.isFinite(data.co2) ? data.co2 : 0;
  state.time = Number.isFinite(data.time) ? data.time : 0;
  state.demand = Number.isFinite(data.demand) ? data.demand : START_DEMAND;
  state.price = Number.isFinite(data.price) ? data.price : BASE_PRICE;
  state.expansions = Number.isFinite(data.expansions) ? data.expansions : 0;
  state.crew = Number.isFinite(data.crew) ? data.crew : START_CREW;
  state.purchases = data.purchases && typeof data.purchases === "object" ? data.purchases : {};
  state.upgrades = data.upgrades && typeof data.upgrades === "object" ? data.upgrades : {};
  state.objectives =
    data.objectives && typeof data.objectives === "object" ? data.objectives : {};

  state.plots = Array.isArray(data.plots)
    ? data.plots.map(sanitizePlot)
    : initialPlots();
  while (state.plots.length < START_PLOTS) state.plots.push(null);

  state.event = null;
  state.nextEventIn = 90;
  state.history = [];
  state._histAcc = 0;
  state.events = [];

  const offline = Math.min(
    MAX_OFFLINE,
    Math.max(0, (Date.now() - (Number(data.savedAt) || Date.now())) / 1000)
  );

  // Structures finish while you are away.
  for (const plot of state.plots) {
    if (plot && plot.status === "building") {
      plot.remaining -= offline;
      if (plot.remaining <= 0) {
        plot.status = "built";
        plot.remaining = 0;
      }
    }
  }

  recomputeMetrics();

  if (offline >= 60) {
    const gain = state.metrics.income * offline * OFFLINE_EFFICIENCY;
    if (gain > 0) {
      state.money += gain;
      state.totalEarned += gain;
      emit({ type: "offline", amount: gain, seconds: offline });
      recomputeMetrics();
    }
  }

  return true;
}

export function resetGame() {
  const fresh = createInitialState();
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, fresh);
  recomputeMetrics();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
  }
}

// Make sure the UI has metrics to read before the first tick.
recomputeMetrics();
