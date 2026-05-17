import { tech as techList } from "./tech.js";

export const state = {
  // Simplified: `gold` is the main currency (money).
  gold: 250,
  // Max achieved gold for tracking progress milestones
  maxGold: 250,

  contamination: 0,

  // clickIncome is gold awarded per click
  clickIncome: 1,

  // marketPrice in $/kWh used to convert power -> money
  marketPrice: 0.5,
  minMarketPrice: 0.05,
  maxMarketPrice: 2.5,

  // Demand model: if production is below demand, prices trend up; above demand, trend down.
  demandPerSec: 200,

  // Natural cleanup reduces cumulative contamination every second.
  cleanupPerSec: 2,


  // sources derived from tech definitions; sorted by ascending power
  sources: techList
    .slice()
    .sort((a, b) => a.power - b.power)
    .map((t) => ({
    id: t.name.toLowerCase().replace(/\s+/g, "_"),
    name: t.name,
    cost: t.cost,
    baseCost: t.cost,
    power: t.power, // kWh/s per unit
    contamination: t.contamination, // g CO2/s per unit
    img_filename: t.img_filename,
    count: 0,
    unlocked: !!t.unlocked
  }))
};

function updateUnlocksFromProgress() {
  for (const s of state.sources) {
    if (s.unlocked) continue;
    // Reveal source once player has reached 75% of its starting price.
    if (state.maxGold >= s.baseCost * 0.75) {
      s.unlocked = true;
    }
  }
}

// Apply initial unlocks from starting gold.
updateUnlocksFromProgress();

// Compute totals from owned sources
export function totals() {
  const acc = {
    powerPerSec: 0,
    pollutionPerSec: 0,
    grossMoneyPerSec: 0,
    netMoneyPerSec: 0,
    penaltyMultiplier: 1
  };
  for (const s of state.sources) {
    acc.powerPerSec += s.power * s.count;
    acc.pollutionPerSec += s.contamination * s.count;
  }

  acc.grossMoneyPerSec = acc.powerPerSec * state.marketPrice;
  acc.penaltyMultiplier = pollutionPenaltyMultiplier(state.contamination);
  acc.netMoneyPerSec = acc.grossMoneyPerSec * acc.penaltyMultiplier;
  return acc;
}

function pollutionPenaltyMultiplier(contamination) {
  // No penalty up to 2k contamination.
  if (contamination <= 2000) return 1;
  // Linear drop from 100% to 55% between 2k and 20k.
  if (contamination <= 20000) {
    const t = (contamination - 2000) / 18000;
    return 1 - t * 0.45;
  }
  // Linear drop from 55% to 15% between 20k and 100k.
  if (contamination <= 100000) {
    const t = (contamination - 20000) / 80000;
    return 0.55 - t * 0.4;
  }
  return 0.15;
}

function updateMarketPrice(powerPerSec, dt) {
  const demandGap = (state.demandPerSec - powerPerSec) / Math.max(1, state.demandPerSec);
  // Supply pressure (trend) + light noise (volatility)
  const drift = demandGap * 0.05 * dt;
  const noise = (Math.random() - 0.5) * 0.01 * dt;
  state.marketPrice += drift + noise;
  state.marketPrice = Math.min(state.maxMarketPrice, Math.max(state.minMarketPrice, state.marketPrice));
}

function updateMaxGold() {
  if (state.gold > state.maxGold) {
    state.maxGold = state.gold;
  }
  updateUnlocksFromProgress();
}

// dt is seconds; default to 1 second when called without argument.
export function tick(dt = 1) {
  // price responds to current supply/demand before settling this tick's revenue
  const currentPower = state.sources.reduce((acc, s) => acc + s.power * s.count, 0);
  updateMarketPrice(currentPower, dt);

  const t = totals();
  state.gold += t.netMoneyPerSec * dt;
  state.contamination += t.pollutionPerSec * dt;
  state.contamination = Math.max(0, state.contamination - state.cleanupPerSec * dt);
  updateMaxGold();
}

export function mine() {
  state.gold += state.clickIncome;
  updateMaxGold();
}

export function buy(id) {
  const s = state.sources.find((x) => x.id === id);
  if (!s) return false;
  // use current cost; if affordable, deduct and increase count
  if (state.gold < s.cost) return false;
  state.gold -= s.cost;
  s.count += 1;
  // apply exponential cost scaling for next purchase (15% increase)
  s.cost = Math.max(1, Math.ceil(s.cost * 1.15));
  // mark source as unlocked
  s.unlocked = true;
  return true;
}