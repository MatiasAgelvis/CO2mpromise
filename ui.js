import {
  state,
  SOURCE_BY_ID,
  buySource,
  validateBuy,
  researchUpgrade,
  validateUpgrade,
  expandLand,
  landCost,
  handCrank,
  drainEvents,
  sourceCost,
  sourceStats,
  isUnlocked,
  resetGame,
} from "./state.js";
import { SOURCES, UPGRADES, OBJECTIVES, LAND_PER_EXPANSION } from "./tech.js";
import * as fmt from "./format.js";

function h(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

function makeStat(label, tip) {
  const el = h("div", "stat");
  const lab = h("div", "stat-label", label);
  if (tip) lab.title = tip;
  const value = h("div", "stat-value", "—");
  const sub = h("div", "stat-sub");
  el.append(lab, value, sub);
  return { el, value, sub };
}

function makeCoverageStat() {
  const el = h("div", "stat stat-coverage");
  const lab = h("div", "stat-label", "Production / Demand");
  lab.title =
    "How much power you make compared with what your customers want. Near 100% keeps prices high.";
  const value = h("div", "stat-value", "—");
  const sub = h("div", "stat-sub");
  const subText = h("span", "sub-text");
  const bar = h("div", "mini-bar");
  const fill = h("div", "mini-bar-fill");
  bar.appendChild(fill);
  sub.append(subText, bar);
  el.append(lab, value, sub);
  return { el, value, subText, fill };
}

function makeMeterStat(label, tip) {
  const el = h("div", "stat stat-meter");
  const lab = h("div", "stat-label", label);
  if (tip) lab.title = tip;
  const value = h("div", "stat-value", "—");
  const sub = h("div", "stat-sub");
  const subText = h("span", "sub-text");
  const bar = h("div", "mini-bar plain");
  const fill = h("div", "mini-bar-fill");
  bar.appendChild(fill);
  sub.append(subText, bar);
  el.append(lab, value, sub);
  return { el, value, sub, subText, fill };
}

export function createUI() {
  const root = h("div", "app-shell");

  // -------------------------------------------------------------------------
  // Top bar
  // -------------------------------------------------------------------------
  const topbar = h("header", "topbar");

  const brand = h("div", "brand");
  const mark = h("div", "brand-mark", "CO₂");
  const brandText = h("div", "brand-text");
  brandText.append(
    h("h1", "", "CO2mpromise"),
    h("p", "", "Build a grid. Keep the air clean.")
  );
  brand.append(mark, brandText);

  const stats = h("div", "top-stats");
  const moneyStat = makeStat("Money", "Cash on hand. Earned by selling electricity.");
  moneyStat.el.classList.add("stat-money");
  const incomeStat = makeStat("Net income", "Money per second after the carbon penalty.");
  const coverageStat = makeCoverageStat();
  const priceStat = makeStat("Market price", "Price per kWh. High when demand outruns supply.");
  const co2Stat = makeMeterStat(
    "CO₂ stock",
    "Total CO₂ in the air. It applies a carbon penalty to income. Scrubbers and research clean it up."
  );
  const landStat = makeStat("Free land", "Every structure needs one plot. Expand when you run out.");

  stats.append(
    moneyStat.el,
    incomeStat.el,
    coverageStat.el,
    priceStat.el,
    co2Stat.el,
    landStat.el
  );

  const topActions = h("div", "top-actions");
  const resetBtn = h("button", "icon-btn", "↺");
  resetBtn.title = "Reset save";
  topActions.appendChild(resetBtn);

  topbar.append(brand, stats, topActions);

  // -------------------------------------------------------------------------
  // Event banner
  // -------------------------------------------------------------------------
  const eventBanner = h("div", "event-banner hidden");

  // -------------------------------------------------------------------------
  // Layout
  // -------------------------------------------------------------------------
  const layout = h("main", "layout");

  const leftCol = h("section", "col col-left");
  const centerCol = h("section", "col col-center");
  const rightCol = h("section", "col col-right");

  // Hand crank --------------------------------------------------------------
  const crankPanel = h("div", "panel crank-panel");
  const crankHead = h("div", "panel-head");
  crankHead.append(
    h("h2", "", "Manual Generator"),
    h("span", "hint", "Tap for quick cash")
  );
  const crankBtn = h("button", "crank-btn");
  const crankIcon = h("span", "crank-icon", "⚡");
  const crankLabel = h("span", "crank-label", "Hand Crank");
  const crankAmount = h("small", "crank-amount", "+$5");
  crankBtn.append(crankIcon, crankLabel, crankAmount);
  const crankMeta = h("div", "crank-meta");
  crankMeta.append(h("span", "", "Clicks: "), (() => {
    const b = h("b", "", "0");
    crankMeta._clicks = b;
    return b;
  })());
  crankPanel.append(crankHead, crankBtn, crankMeta);

  // Objectives --------------------------------------------------------------
  const objPanel = h("div", "panel objectives-panel");
  const objHead = h("div", "panel-head");
  const objCount = h("span", "pill", "0/0");
  objHead.append(h("h2", "", "Contracts"), objCount);
  const objList = h("div", "obj-list");
  objPanel.append(objHead, objList);

  // Help --------------------------------------------------------------------
  const help = h("details", "panel help");
  const helpSummary = h("summary", "", "How it works");
  const helpBody = h("div", "help-body");
  helpBody.innerHTML = `
    <p><b>Money</b> comes from selling all the electricity you produce at the market price.</p>
    <p><b>Demand</b> is what your customers want. Keep production near demand: overproducing pushes the price per kWh down, underproducing leaves sales on the table.</p>
    <p><b>CO₂</b> accumulates from dirty plants. The more in the air, the bigger the carbon penalty on income. Scrubbers and research clean it up.</p>
    <p><b>Land</b> limits how many structures you can own. <b>Crews</b> limit how many can be under construction at once.</p>
    <p><b>Contracts</b> give cash rewards for hitting milestones. Research makes each structure stronger.</p>
  `;
  help.append(helpSummary, helpBody);

  leftCol.append(crankPanel, objPanel, help);

  // Site --------------------------------------------------------------------
  const sitePanel = h("div", "panel site-panel");
  const siteHead = h("div", "panel-head site-head");
  const siteTitleWrap = h("div", "site-title");
  siteTitleWrap.append(h("h2", "", "Power Site"), (() => {
    const s = h("span", "hint", "");
    siteTitleWrap._hint = s;
    return s;
  })());
  const expandBtn = h("button", "ghost-btn", "Expand");
  const expandStatus = h("span", "expand-status", "");
  const expandWrap = h("div", "expand-wrap");
  expandWrap.append(expandStatus, expandBtn);
  siteHead.append(siteTitleWrap, expandWrap);
  const siteGrid = h("div", "site-grid");
  const siteFooter = h("div", "site-footer");
  sitePanel.append(siteHead, siteGrid, siteFooter);

  // Construction ------------------------------------------------------------
  const conPanel = h("div", "panel construction-panel");
  const conHead = h("div", "panel-head");
  const crewPill = h("span", "pill", "0 / 2 crews");
  conHead.append(h("h2", "", "Construction"), crewPill);
  const conList = h("div", "con-list");
  conPanel.append(conHead, conList);

  // Market chart ------------------------------------------------------------
  const marketPanel = h("div", "panel market-panel");
  const marketHead = h("div", "panel-head");
  const marketLegacy = h("div", "legend");
  marketLegacy.innerHTML = `<span class="dot dot-prod"></span> Production <span class="dot dot-dem"></span> Demand`;
  marketHead.append(h("h2", "", "Market"), marketLegacy);
  const chart = h("canvas", "market-chart");
  marketPanel.append(marketHead, chart);

  centerCol.append(sitePanel, conPanel, marketPanel);

  // Build / research tabs ---------------------------------------------------
  const rightPanel = h("div", "panel build-panel");
  const tabsEl = h("div", "tabs");
  const buildTabBtn = h("button", "tab active", "Build");
  const researchTabBtn = h("button", "tab", "Research");
  tabsEl.append(buildTabBtn, researchTabBtn);

  const buildList = h("div", "list tab-body");
  const researchList = h("div", "list tab-body hidden");
  rightPanel.append(tabsEl, buildList, researchList);

  rightCol.append(rightPanel);

  layout.append(leftCol, centerCol, rightCol);

  // Toasts
  const toastWrap = h("div", "toasts");

  root.append(topbar, eventBanner, layout, toastWrap);

  // -------------------------------------------------------------------------
  // Static rows
  // -------------------------------------------------------------------------
  const buildRows = new Map();
  for (const def of SOURCES) {
    const card = h("div", "build-card");

    const thumbWrap = h("div", "build-thumb");
    if (def.img) {
      const img = h("img");
      img.src = `./sprites/${def.img}`;
      img.alt = def.name;
      img.loading = "lazy";
      thumbWrap.appendChild(img);
    } else {
      thumbWrap.appendChild(h("div", "thumb-glyph", "CO₂"));
    }

    const main = h("div", "build-main");
    const titleRow = h("div", "build-title-row");
    const name = h("div", "build-name", def.name);
    const count = h("span", "build-count", "");
    titleRow.append(name, count);
    const desc = h("p", "build-desc", def.blurb);
    const statRow = h("div", "build-stats");
    const powerChip = h("span", "chip chip-power");
    const co2Chip = h("span", "chip chip-co2");
    const timeChip = h("span", "chip chip-time");
    statRow.append(powerChip, co2Chip, timeChip);
    main.append(titleRow, desc, statRow);

    const side = h("div", "build-side");
    const cost = h("div", "build-cost", "");
    const btn = h("button", "buy-btn", "Build");
    const status = h("div", "build-status", "");
    side.append(cost, btn, status);

    card.append(thumbWrap, main, side);
    buildList.appendChild(card);

    function attemptBuild() {
      const res = buySource(def.id);
      if (!res.ok) {
        toast("!", res.reason || "Can't build right now", "warning");
        card.classList.remove("shake");
        void card.offsetWidth;
        card.classList.add("shake");
      } else {
        card.classList.remove("flash");
        void card.offsetWidth;
        card.classList.add("flash");
        spawnBuildFloater(card, res.cost);
      }
      update();
    }

    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      attemptBuild();
    });
    card.addEventListener("click", attemptBuild);

    buildRows.set(def.id, { card, count, powerChip, co2Chip, timeChip, cost, btn, status });
  }

  const researchRows = new Map();
  for (const up of UPGRADES) {
    const card = h("div", "research-card");
    const top = h("div", "research-top");
    const name = h("div", "research-name", up.name);
    const cost = h("div", "research-cost", fmt.money(up.cost));
    top.append(name, cost);
    const desc = h("p", "research-desc", up.desc);
    const foot = h("div", "research-foot");
    const req = h("span", "research-req", "");
    const btn = h("button", "buy-btn research-btn", "Research");
    foot.append(req, btn);
    card.append(top, desc, foot);
    researchList.appendChild(card);

    function attemptResearch() {
      if (state.upgrades[up.id]) return;
      const res = researchUpgrade(up.id);
      if (!res.ok) {
        toast("!", res.reason || "Can't research right now", "warning");
        card.classList.remove("shake");
        void card.offsetWidth;
        card.classList.add("shake");
      } else {
        card.classList.remove("flash");
        void card.offsetWidth;
        card.classList.add("flash");
        spawnBuildFloater(card, up.cost);
      }
      update();
    }

    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      attemptResearch();
    });
    card.addEventListener("click", attemptResearch);

    researchRows.set(up.id, { card, cost, req, btn });
  }

  // -------------------------------------------------------------------------
  // Tabs
  // -------------------------------------------------------------------------
  function setTab(name) {
    buildTabBtn.classList.toggle("active", name === "build");
    researchTabBtn.classList.toggle("active", name === "research");
    buildList.classList.toggle("hidden", name !== "build");
    researchList.classList.toggle("hidden", name !== "research");
  }
  buildTabBtn.addEventListener("click", () => setTab("build"));
  researchTabBtn.addEventListener("click", () => setTab("research"));

  // -------------------------------------------------------------------------
  // Plot grid
  // -------------------------------------------------------------------------
  const plotEls = [];

  function makePlotCell(index) {
    const cell = h("div", "plot empty");
    cell.addEventListener("click", () => {
      if (!state.plots[index]) {
        setTab("build");
        rightPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
    return cell;
  }

  function syncPlots() {
    while (plotEls.length < state.plots.length) {
      const cell = makePlotCell(plotEls.length);
      plotEls.push(cell);
      siteGrid.appendChild(cell);
    }
    while (plotEls.length > state.plots.length) {
      plotEls.pop().remove();
    }

    state.plots.forEach((plot, i) => {
      const cell = plotEls[i];
      if (!cell) return;
      const sig = plot ? `${plot.id}:${plot.status}` : "empty";
      if (cell.dataset.sig !== sig) {
        cell.dataset.sig = sig;
        cell.className = "plot " + (plot ? plot.status : "empty");
        cell.innerHTML = "";
        if (plot) {
          const def = SOURCE_BY_ID[plot.id];
          if (def && def.img) {
            const img = h("img");
            img.src = `./sprites/${def.img}`;
            img.alt = def.name;
            cell.appendChild(img);
          } else {
            cell.appendChild(h("div", "thumb-glyph", "CO₂"));
          }
          if (plot.status === "building") {
            const prog = h("div", "plot-progress");
            const fill = h("div", "plot-progress-fill");
            prog.appendChild(fill);
            cell.appendChild(prog);
          }
          cell.title = def ? def.name : "";
        } else {
          cell.appendChild(h("span", "plot-plus", "+"));
          cell.title = "Empty plot — click to build";
        }
      }

      if (plot && plot.status === "building") {
        const fill = cell.querySelector(".plot-progress-fill");
        if (fill) {
          const done = 1 - plot.remaining / Math.max(0.001, plot.total);
          fill.style.width = `${Math.max(0, Math.min(1, done)) * 100}%`;
        }
      }
    });
  }

  // -------------------------------------------------------------------------
  // Construction list
  // -------------------------------------------------------------------------
  let conSig = "__init__";
  let conEls = [];

  function renderConstruction() {
    const entries = [];
    state.plots.forEach((p, i) => {
      if (p && p.status === "building") entries.push({ p, i });
    });

    crewPill.textContent = `${entries.length} / ${state.crew} crews`;
    const sig = entries.map((e) => `${e.i}:${e.p.id}`).join("|");

    if (sig !== conSig) {
      conSig = sig;
      conList.innerHTML = "";
      conEls = [];

      if (!entries.length) {
        conList.appendChild(
          h("div", "empty small", "No active construction. Pick a project from the Build tab.")
        );
      }

      for (const { p } of entries) {
        const def = SOURCE_BY_ID[p.id];
        const row = h("div", "con-row");

        const thumb = h("div", "con-thumb");
        if (def.img) {
          const img = h("img");
          img.src = `./sprites/${def.img}`;
          img.alt = def.name;
          thumb.appendChild(img);
        } else {
          thumb.appendChild(h("div", "thumb-glyph", "CO₂"));
        }

        const body = h("div", "con-body");
        const top = h("div", "con-top");
        const nm = h("div", "con-name", def.name);
        const time = h("div", "con-time", "");
        top.append(nm, time);
        const bar = h("div", "bar");
        const fill = h("div", "bar-fill");
        bar.appendChild(fill);
        body.append(top, bar);

        row.append(thumb, body);
        conList.appendChild(row);

        const done = 1 - p.remaining / Math.max(0.001, p.total);
        fill.style.width = `${Math.max(0, Math.min(1, done)) * 100}%`;
        time.textContent = `${fmt.secs(p.remaining)} left`;
        conEls.push({ fill, time, p });
      }
    } else {
      entries.forEach((e, idx) => {
        const el = conEls[idx];
        if (!el) return;
        const done = 1 - e.p.remaining / Math.max(0.001, e.p.total);
        el.fill.style.width = `${Math.max(0, Math.min(1, done)) * 100}%`;
        el.time.textContent = `${fmt.secs(e.p.remaining)} left`;
      });
    }
  }

  // -------------------------------------------------------------------------
  // Objectives
  // -------------------------------------------------------------------------
  let objSig = "__init__";

  function renderObjectives() {
    const active = OBJECTIVES.filter((o) => !state.objectives[o.id]);
    const completed = OBJECTIVES.length - active.length;
    objCount.textContent = `${completed}/${OBJECTIVES.length}`;
    const sig = active.map((o) => o.id).join("|");
    if (sig === objSig) return;
    objSig = sig;
    objList.innerHTML = "";

    if (!active.length) {
      objList.appendChild(h("div", "empty small", "All contracts complete. The grid is yours."));
      return;
    }

    for (const o of active) {
      const row = h("div", "obj");
      const icon = h("div", "obj-icon", "◇");
      const body = h("div", "obj-body");
      body.append(h("div", "obj-title", o.name), h("div", "obj-desc", o.desc));
      const reward = h("div", "obj-reward", "+" + fmt.money(o.reward));
      row.append(icon, body, reward);
      objList.appendChild(row);
    }
  }

  // -------------------------------------------------------------------------
  // Build / research rows
  // -------------------------------------------------------------------------
  function buildStatus(check, cost) {
    const reason = check.reason || "";
    if (/money/i.test(reason)) {
      return `Need ${fmt.money(Math.max(0, cost - state.money))}`;
    }
    if (/crews/i.test(reason)) return "Crews busy";
    if (/land/i.test(reason)) return "No free land";
    return reason;
  }

  function updateBuildRows() {
    const nextLocked = SOURCES.filter((s) => !isUnlocked(s.id)).sort(
      (a, b) => a.unlockAt - b.unlockAt
    )[0];

    for (const def of SOURCES) {
      const row = buildRows.get(def.id);
      if (!row) continue;
      const unlocked = isUnlocked(def.id);
      const visible = unlocked || def === nextLocked;
      row.card.classList.toggle("hidden", !visible);
      if (!visible) continue;

      const stats = sourceStats(def.id);
      const cost = sourceCost(def.id);
      const check = validateBuy(def.id);
      const count = state.purchases[def.id] || 0;

      row.count.textContent = count ? `×${count}` : "";
      row.powerChip.textContent =
        def.power === 0 ? "no power" : `${fmt.num(stats.power)} kWh/s`;
      row.powerChip.classList.toggle("hidden", def.power === 0);

      if (stats.co2 > 0) {
        row.co2Chip.textContent = `${fmt.num(stats.co2)} kg CO₂/s`;
        row.co2Chip.className = "chip chip-co2 bad";
      } else if (stats.co2 < 0) {
        row.co2Chip.textContent = `−${fmt.num(Math.abs(stats.co2))} kg CO₂/s`;
        row.co2Chip.className = "chip chip-co2 good";
      } else {
        row.co2Chip.textContent = "0 kg CO₂/s";
        row.co2Chip.className = "chip chip-co2 clean";
      }

      row.timeChip.textContent =
        def.buildTime > 0 ? `${fmt.secs(def.buildTime)} build` : "instant";

      row.cost.textContent = unlocked ? fmt.money(cost) : "";

      row.btn.textContent = unlocked ? "Build" : "Locked";
      row.btn.disabled = false;
      row.btn.setAttribute("aria-disabled", (!unlocked || !check.ok).toString());
      row.btn.setAttribute(
        "aria-label",
        check.reason ? `${def.name}: ${check.reason}` : `Build ${def.name}`
      );
      row.btn.classList.toggle("blocked", !unlocked || !check.ok);

      let statusText = "";
      if (!unlocked) {
        statusText = `Unlock at ${fmt.money(def.unlockAt)}`;
      } else if (!check.ok) {
        statusText = buildStatus(check, cost);
      }
      row.status.textContent = statusText;
      row.status.className =
        "build-status" + (unlocked && !check.ok ? " warn" : "");

      row.card.classList.toggle("affordable", check.ok);
      row.card.classList.toggle("locked", !unlocked);
    }
  }

  function updateResearchRows() {
    for (const up of UPGRADES) {
      const row = researchRows.get(up.id);
      if (!row) continue;
      const purchased = !!state.upgrades[up.id];
      const check = validateUpgrade(up.id);

      row.card.classList.toggle("done", purchased);
      row.cost.textContent = purchased ? "" : fmt.money(up.cost);

      let reqText = "";
      let reqClass = "research-req";
      if (purchased) {
        reqText = "✓ Researched";
      } else if (!check.ok && /money/i.test(check.reason)) {
        reqText = `Need ${fmt.money(Math.max(0, up.cost - state.money))}`;
        reqClass += " warn";
      } else if (!check.ok) {
        reqText = check.reason;
        reqClass += " warn";
      } else {
        reqText = "Ready";
        reqClass += " ready";
      }
      row.req.textContent = reqText;
      row.req.className = reqClass;
      row.btn.disabled = purchased;
      row.btn.setAttribute("aria-disabled", (!purchased && !check.ok).toString());
      row.btn.setAttribute(
        "aria-label",
        check.reason ? `${up.name}: ${check.reason}` : `Research ${up.name}`
      );
      row.btn.classList.toggle("blocked", !purchased && !check.ok);
      row.btn.textContent = purchased ? "Done" : "Research";
      row.card.classList.toggle("affordable", check.ok);
    }
  }

  // -------------------------------------------------------------------------
  // Market chart
  // -------------------------------------------------------------------------
  let chartCtx = null;
  let lastChartAt = 0;

  function drawChart(now) {
    if (now - lastChartAt < 350) return;
    lastChartAt = now;

    const rect = chart.getBoundingClientRect();
    const w = Math.max(60, Math.floor(rect.width));
    const height = 118;
    const dpr = window.devicePixelRatio || 1;

    if (chart.width !== Math.floor(w * dpr) || chart.height !== Math.floor(height * dpr)) {
      chart.width = Math.floor(w * dpr);
      chart.height = Math.floor(height * dpr);
      chartCtx = chart.getContext("2d");
    }
    if (!chartCtx) chartCtx = chart.getContext("2d");
    if (!chartCtx) return;

    const ctx = chartCtx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, height);

    const hist = state.history;
    if (hist.length < 2) {
      ctx.fillStyle = "#5b7189";
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("collecting market data…", w / 2, height / 2);
      return;
    }

    const pad = { l: 4, r: 4, t: 10, b: 12 };
    const maxV = Math.max(1, ...hist.map((d) => Math.max(d.power, d.demand)));
    const x = (i) => pad.l + (i / (hist.length - 1)) * (w - pad.l - pad.r);
    const y = (v) => height - pad.b - (v / maxV) * (height - pad.t - pad.b);

    ctx.strokeStyle = "rgba(120, 180, 255, 0.10)";
    ctx.lineWidth = 1;
    for (let g = 0; g <= 3; g++) {
      const yy = pad.t + (g * (height - pad.t - pad.b)) / 3;
      ctx.beginPath();
      ctx.moveTo(pad.l, yy);
      ctx.lineTo(w - pad.r, yy);
      ctx.stroke();
    }

    const line = (key, color, width) => {
      ctx.beginPath();
      hist.forEach((d, i) => {
        const px = x(i);
        const py = y(d[key]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      ctx.stroke();
    };

    line("demand", "#ffb347", 1.5);
    line("power", "#39d98a", 2);
  }

  // -------------------------------------------------------------------------
  // Toasts
  // -------------------------------------------------------------------------
  function toast(icon, message, kind = "info", sub = "") {
    const t = h("div", "toast " + kind);
    const ic = h("span", "toast-icon", icon);
    const body = h("div", "toast-body");
    body.appendChild(h("div", "toast-msg", message));
    if (sub) body.appendChild(h("div", "toast-sub", sub));
    t.append(ic, body);
    toastWrap.appendChild(t);

    setTimeout(() => {
      t.classList.add("out");
      setTimeout(() => t.remove(), 300);
    }, 3800);

    while (toastWrap.children.length > 4) {
      toastWrap.firstElementChild.remove();
    }
  }

  function handleEvents() {
    for (const ev of drainEvents()) {
      switch (ev.type) {
        case "built":
          toast("✓", `${ev.name} is online`, "good");
          break;
        case "buildStart":
          toast("⚙", `${ev.name} — construction started`, "info", fmt.secs(ev.time));
          break;
        case "research":
          toast("🔬", `${ev.name} researched`, "good");
          break;
        case "objective":
          toast("★", `Contract complete: ${ev.name}`, "gold", "+" + fmt.money(ev.reward));
          break;
        case "land":
          toast("▦", `Site expanded by ${ev.plots} plots`, "info");
          break;
        case "event":
          toast(
            ev.kind === "good" ? "★" : ev.kind === "danger" ? "⚠" : "◆",
            ev.name,
            ev.kind,
            ev.detail || ""
          );
          break;
        case "offline":
          toast("◆", "Welcome back!", "info", `+${fmt.money(ev.amount)} offline income`);
          break;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Click feedback
  // -------------------------------------------------------------------------
  function spawnFloater(amount) {
    const f = h("span", "floater", "+" + fmt.money(amount));
    f.style.left = `${28 + Math.random() * 44}%`;
    crankBtn.appendChild(f);
    setTimeout(() => f.remove(), 900);
  }

  function spawnBuildFloater(card, cost) {
    const f = h("span", "build-floater", "−" + fmt.money(cost));
    card.appendChild(f);
    setTimeout(() => f.remove(), 900);
  }

  function updateEventBanner() {
    const e = state.event;
    if (!e) {
      eventBanner.classList.add("hidden");
      eventBanner.innerHTML = "";
      return;
    }

    eventBanner.classList.remove("hidden");
    eventBanner.className = "event-banner " + (e.kind || "info");
    eventBanner.innerHTML = "";

    const icon = h("span", "event-icon", e.kind === "good" ? "★" : e.kind === "danger" ? "⚠" : "◆");
    const body = h("div", "event-body");
    body.append(h("strong", "", e.name), h("span", "event-desc", e.desc));
    const timer = h("span", "event-timer", fmt.secs(e.remaining));
    eventBanner.append(icon, body, timer);
  }

  // -------------------------------------------------------------------------
  // Main update
  // -------------------------------------------------------------------------
  function update(now = performance.now()) {
    const m = state.metrics;
    if (!m) return;

    // Top stats
    moneyStat.value.textContent = fmt.money(state.money);
    moneyStat.sub.textContent = `earned ${fmt.money(state.totalEarned)} total`;

    incomeStat.value.textContent = "+" + fmt.rate(m.income);
    const penaltyPct = Math.max(0, (1 - m.pollutionPenalty) * 100);
    incomeStat.sub.textContent =
      penaltyPct >= 1 ? `penalty −${penaltyPct.toFixed(0)}%` : "no penalty";
    incomeStat.el.classList.toggle("bad", penaltyPct >= 1);

    coverageStat.value.textContent = `${fmt.num(m.power)} / ${fmt.num(m.demand)} kWh/s`;
    let covText;
    let covClass;
    if (m.power <= 0) {
      covText = "no production yet";
      covClass = "neutral";
    } else if (m.coverage < 0.9) {
      covText = `${fmt.pct(m.coverage)} covered — shortage`;
      covClass = "bad";
    } else if (m.coverage <= 1.15) {
      covText = `${fmt.pct(m.coverage)} covered — balanced`;
      covClass = "good";
    } else {
      covText = `${fmt.pct(m.coverage)} covered — overproducing`;
      covClass = "warn";
    }
    coverageStat.subText.textContent = covText;
    coverageStat.subText.className = "sub-text " + covClass;
    coverageStat.fill.style.width = `${Math.max(2, Math.min(1, m.coverage / 2) * 100)}%`;
    coverageStat.fill.className = "mini-bar-fill " + covClass;

    priceStat.value.textContent = fmt.price(m.price);
    const hist = state.history;
    const refPrice =
      hist.length >= 6 ? hist[hist.length - 6].price : hist.length ? hist[0].price : state.price;
    const trend = state.price - refPrice;
    if (trend > 0.004) {
      priceStat.sub.textContent = "▲ rising";
      priceStat.sub.className = "stat-sub good";
    } else if (trend < -0.004) {
      priceStat.sub.textContent = "▼ falling";
      priceStat.sub.className = "stat-sub bad";
    } else {
      priceStat.sub.textContent = "• steady";
      priceStat.sub.className = "stat-sub";
    }

    co2Stat.value.textContent = fmt.kg(state.co2);
    const co2Class = state.co2 < 200 ? "good" : state.co2 < 1500 ? "warn" : "bad";
    co2Stat.subText.textContent = `${fmt.sign(m.netEmissions)} kg/s · penalty −${penaltyPct.toFixed(0)}%`;
    co2Stat.subText.className = "sub-text " + co2Class;
    co2Stat.fill.style.width = `${Math.max(0, Math.min(100, penaltyPct))}%`;
    co2Stat.fill.className = "mini-bar-fill " + co2Class;
    co2Stat.el.classList.toggle("bad", co2Class === "bad");

    landStat.value.textContent = `${m.freePlots} free`;
    landStat.sub.textContent = `of ${state.plots.length} plots`;

    // Crank
    crankAmount.textContent = "+" + fmt.money(m.clickIncome);
    if (crankMeta._clicks) crankMeta._clicks.textContent = String(state.clicks);

    // Site
    siteTitleWrap._hint.textContent = `${m.freePlots} free / ${state.plots.length} plots`;
    const lc = landCost();
    const shortfall = Math.max(0, lc - state.money);
    expandBtn.textContent = `Expand +${LAND_PER_EXPANSION} · ${fmt.money(lc)}`;
    expandBtn.disabled = false;
    expandBtn.setAttribute("aria-disabled", (shortfall > 0).toString());
    expandBtn.setAttribute(
      "aria-label",
      shortfall > 0
        ? `Expand site: need ${fmt.money(shortfall)} more`
        : "Expand site"
    );
    expandBtn.classList.toggle("blocked", shortfall > 0);
    expandStatus.textContent = shortfall > 0 ? `Need ${fmt.money(shortfall)} more` : "";
    expandStatus.className = "expand-status" + (shortfall > 0 ? " warn" : "");
    siteFooter.textContent =
      m.builtCount === 0
        ? "Your site is empty. Build a Hamster Wheel to start generating power."
        : `${m.builtCount} structures · ${fmt.num(m.power)} kWh/s · ${fmt.sign(
            m.netEmissions
          )} kg CO₂/s net`;

    // Dynamic panels
    updateBuildRows();
    updateResearchRows();
    renderObjectives();
    syncPlots();
    renderConstruction();
    updateEventBanner();
    drawChart(now);
    handleEvents();
  }

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------
  crankBtn.addEventListener("click", () => {
    const amount = handCrank();
    spawnFloater(amount);
    crankBtn.classList.remove("cranked");
    void crankBtn.offsetWidth;
    crankBtn.classList.add("cranked");
    update();
  });

  expandBtn.addEventListener("click", () => {
    const res = expandLand();
    if (!res.ok) {
      toast("!", res.reason, "warning");
      expandBtn.classList.remove("shake");
      void expandBtn.offsetWidth;
      expandBtn.classList.add("shake");
    } else {
      expandBtn.classList.remove("flash");
      void expandBtn.offsetWidth;
      expandBtn.classList.add("flash");
      spawnBuildFloater(expandWrap, res.cost);
    }
    update();
  });

  resetBtn.addEventListener("click", () => {
    if (!confirm("Reset all progress? This cannot be undone.")) return;
    resetGame();
    for (const el of plotEls) el.remove();
    plotEls.length = 0;
    siteGrid.innerHTML = "";
    conSig = "__reset__";
    objSig = "__reset__";
    toast("↺", "New game started", "info");
    update();
  });

  return { root, update };
}
