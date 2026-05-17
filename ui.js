import { state, mine, buy, totals } from "./state.js";

function formatRate(value) {
  if (value >= 1000) return `${value.toFixed(0)} /s`;
  if (value >= 100) return `${value.toFixed(1)} /s`;
  if (value >= 1) return `${value.toFixed(2)} /s`;
  if (value >= 0.01) return `${value.toFixed(4)} /s`;
  return `${value.toFixed(6)} /s`;
}

export function createUI() {
  const root = document.createElement("div");
  root.className = "container panel-root";

  const title = document.createElement("h1");
  title.textContent = "CO2mpromise";
  title.className = "test";

  const hud = document.createElement("div");
  hud.className = "hud panel";

  const gold = document.createElement("div");
  gold.className = "gold";

  const income = document.createElement("div");
  income.className = "income";

  const pollution = document.createElement("div");
  pollution.className = "pollution";
  
  const power = document.createElement("div");
  power.className = "power";

  const market = document.createElement("div");
  market.className = "market";

  const owned = document.createElement("div");
  owned.className = "owned";

  const button = document.createElement("button");
  button.textContent = "Hand Crank";
  button.onclick = () => {
    mine();
    update();
  };

  hud.append(gold, income, pollution, power, market, owned, button);

  const list = document.createElement("div");
  list.className = "sources panel";

  // central game area for sprites
  const gameArea = document.createElement("div");
  gameArea.className = "game-area panel";
  
//   const spriteSlot = document.createElement("div");
//   spriteSlot.className = "sprite-slot";
//   gameArea.appendChild(spriteSlot);
  // spriteSlot left empty — placed sprites will be appended into `gameArea`

  // store placed sprites so we can manage them later if needed
  const placedSprites = [];

  // create UI rows for each source
  const sourceRows = {};
  for (const s of state.sources) {
    const row = document.createElement("div");
    row.className = "source";

    const thumb = document.createElement("img");
    thumb.className = "thumb";
    if (s.img_filename) thumb.src = `./sprites/${s.img_filename}`;
    thumb.width = 40;
    thumb.height = 40;
    thumb.alt = s.name;

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = s.name;

    const info = document.createElement("span");
    info.className = "info";
    info.textContent = `${s.power} kWh/s`;

    const pollution = document.createElement("span");
    pollution.className = "pollution";
    pollution.textContent = `${s.contamination} g/s`;

    const count = document.createElement("span");
    count.className = "count";

    const cost = document.createElement("span");
    cost.className = "cost";
    cost.textContent = `Cost: ${s.cost}`;

    const statsContainer = document.createElement("div");
    statsContainer.className = "stats-container";
    statsContainer.append(info, pollution, count, cost);

    const buyBtn = document.createElement("button");
    buyBtn.textContent = "Buy";
    buyBtn.onclick = () => {
      if (buy(s.id)) {
        update();
        spawnSprite(s);
        placePersistentSprite(s);
      }
    };
    row.append(thumb, name, statsContainer, buyBtn);
    list.appendChild(row);
    sourceRows[s.id] = { row, count, cost, buyBtn, info, pollution };
  }

  // left: HUD, center: game area, right: sources
  const leftCol = document.createElement("div");
  leftCol.className = "panel";
  leftCol.appendChild(title);
  leftCol.appendChild(hud);

  root.append(leftCol, gameArea, list);

  function updateHUD() {
    const t = totals();
    gold.textContent = `Gold: ${state.gold.toFixed(2)}`;
    const penaltyPct = (1 - t.penaltyMultiplier) * 100;
    income.textContent = `Income: ${formatRate(t.netMoneyPerSec)} (gross ${formatRate(t.grossMoneyPerSec)})`;
    pollution.textContent = `Pollution: ${state.contamination.toFixed(1)} total, +${t.pollutionPerSec.toFixed(2)} g/s, -${state.cleanupPerSec.toFixed(2)} g/s (${penaltyPct.toFixed(1)}% penalty)`;
    power.textContent = `Power: ${t.powerPerSec.toFixed(3)} kWh/s`;
    market.textContent = `Market: $${state.marketPrice.toFixed(4)}/kWh`;
    const totalOwned = state.sources.reduce((acc, s) => acc + s.count, 0);
    owned.textContent = `Owned: ${totalOwned}`;
  }

  function updateSources() {
    for (const s of state.sources) {
      const el = sourceRows[s.id];
      if (!el) continue;
      
      if (!s.unlocked && s.count === 0) {
        el.row.style.display = "none";
        continue;
      } else {
        el.row.style.display = "flex";
      }

      el.count.textContent = ` x${s.count}`;
      el.cost.textContent = `Cost: ${s.cost}`;
      // per-unit income
      const perUnitIncome = s.power * state.marketPrice;
      el.info.textContent = `${s.power} kWh/s (${formatRate(perUnitIncome)})`;
      // disable buy button if unaffordable
      el.buyBtn.disabled = state.gold < s.cost;
    }
  }

  function spawnSprite(s) {
    if (!s.img_filename) return;
    const img = document.createElement('img');
    img.src = `./sprites/${s.img_filename}`;
    img.className = 'sprite-instance';
    // random x inside game area
    const rect = gameArea.getBoundingClientRect();
    const x = Math.random() * (rect.width - 80) + 40;
    const y = rect.height - 40; // start near bottom
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    gameArea.appendChild(img);
    // remove after animation
    setTimeout(() => img.remove(), 1800);
  }

  // removed: central main sprite is not used anymore

  function placePersistentSprite(s) {
    if (!s.img_filename) return;
    const img = document.createElement('img');
    img.src = `./sprites/${s.img_filename}`;
    img.className = 'placed-sprite';
    // pick a random position inside game area, keeping sprite fully inside
    const rect = gameArea.getBoundingClientRect();
    const w = 64, h = 64;
    const x = Math.random() * (Math.max(0, rect.width - w)) + w/2;
    const y = Math.random() * (Math.max(0, rect.height - h)) + h/2;
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    img.style.position = 'absolute';
    gameArea.appendChild(img);
    placedSprites.push(img);
  }

  function update() {
    updateHUD();
    updateSources();
  }

  // expose update and root
  return { root, update };
}