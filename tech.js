// ---------------------------------------------------------------------------
// CO2mpromise — content definitions
// All balance numbers live here so the simulation and UI stay in sync.
// ---------------------------------------------------------------------------

// Economy tuning ------------------------------------------------------------
export const BASE_PRICE = 0.5;          // $/kWh at supply = demand
export const START_MONEY = 30;
export const START_PLOTS = 12;
export const START_DEMAND = 6;          // kWh/s of local demand at t=0
export const DEMAND_TAU = 240;          // seconds; floor growth of demand over time
export const DEMAND_FOLLOW = 0.9;       // demand tracks 90% of current production
export const DEMAND_LAG = 45;           // seconds for customers to catch up
export const PRICE_TAU = 1.2;           // seconds for price to settle
export const BASE_ABSORPTION = 1.0;     // kg CO2/s removed naturally
export const CO2_HALF = 2000;           // kg CO2 that halves income
export const START_CREW = 2;
export const MAX_CREW = 3;
export const CLICK_BASE = 5;            // $ per hand-crank click
export const COST_GROWTH = 1.15;        // cost multiplier per unit built
export const LAND_BASE_COST = 500;
export const LAND_COST_GROWTH = 1.3;
export const LAND_PER_EXPANSION = 10;
export const OFFLINE_EFFICIENCY = 0.5;
export const MAX_OFFLINE = 2 * 60 * 60; // seconds

// Energy sources ------------------------------------------------------------
// power: kWh/s per unit, co2: kg/s per unit (negative = removes CO2)
export const SOURCES = [
  {
    id: "hamster_wheel",
    name: "Hamster Wheel",
    blurb: "A tireless rodent on a wheel. Tiny, free, and a classic garage start.",
    cost: 12,
    power: 1,
    co2: 0,
    buildTime: 0,
    unlockAt: 0,
    img: "hamster.png",
    tags: ["renewable"],
  },
  {
    id: "bicycle",
    name: "Stationary Bicycle",
    blurb: "Human pedal power hooked to a generator. Labor-intensive but clean.",
    cost: 100,
    power: 8,
    co2: 0,
    buildTime: 3,
    unlockAt: 40,
    img: "bycicle.png",
    tags: ["renewable"],
  },
  {
    id: "steam_generator",
    name: "Steam Generator",
    blurb: "Cheap and reliable, but every unit vents a little CO₂.",
    cost: 375,
    power: 30,
    co2: 0.8,
    buildTime: 6,
    unlockAt: 500,
    img: "steam_generator.png",
    tags: ["fossil"],
  },
  {
    id: "waterwheel",
    name: "Waterwheel",
    blurb: "A steady stream turns a heavy wheel. Reliable, clean baseload power.",
    cost: 1500,
    power: 120,
    co2: 0,
    buildTime: 10,
    unlockAt: 5000,
    img: "waterwheel.png",
    tags: ["renewable"],
  },
  {
    id: "solar_panel",
    name: "Solar Panel",
    blurb: "Silent daytime power. Output drops when clouds roll in.",
    cost: 5000,
    power: 400,
    co2: 0,
    buildTime: 18,
    unlockAt: 30000,
    img: "solar.png",
    tags: ["renewable"],
  },
  {
    id: "carbon_scrubber",
    name: "Carbon Scrubber",
    blurb: "Filters CO₂ straight out of the air. Costs a plot, not a crew slot.",
    cost: 12000,
    power: 0,
    co2: -3,
    buildTime: 12,
    unlockAt: 50000,
    img: null,
    kind: "cleanup",
    tags: ["cleanup"],
  },
  {
    id: "wind_turbine",
    name: "Wind Turbine",
    blurb: "Tall rotors harvest the sky. Clean, but expensive per kWh.",
    cost: 15000,
    power: 1200,
    co2: 0,
    buildTime: 25,
    unlockAt: 150000,
    img: "wind_generator.png",
    tags: ["renewable"],
  },
  {
    id: "coal_plant",
    name: "Coal Plant",
    blurb: "Huge output for the price — and a huge plume of CO₂ with it.",
    cost: 60000,
    power: 4500,
    co2: 4,
    buildTime: 35,
    unlockAt: 500000,
    img: "coal.png",
    tags: ["fossil"],
  },
  {
    id: "nuclear_plant",
    name: "Nuclear Plant",
    blurb: "Enormous low-carbon output, but very slow and expensive to build.",
    cost: 250000,
    power: 20000,
    co2: 0,
    buildTime: 90,
    unlockAt: 3000000,
    img: "nuclear.png",
    tags: ["lowcarbon"],
  },
];

// Research ------------------------------------------------------------------
// effects: sourceMult / sourceCo2Mult (per source id), absorption, priceMult,
// crew, click
export const UPGRADES = [
  {
    id: "turbo_feed",
    name: "Turbo Feed",
    desc: "Hamster Wheels produce 2.5× more.",
    cost: 350,
    requires: { source: "hamster_wheel", count: 3 },
    effects: { sourceMult: { hamster_wheel: 2.5 } },
  },
  {
    id: "better_gears",
    name: "Better Gearing",
    desc: "Stationary Bicycles produce 2× more.",
    cost: 1500,
    requires: { source: "bicycle", count: 2 },
    effects: { sourceMult: { bicycle: 2 } },
  },
  {
    id: "second_crew",
    name: "Second Crew",
    desc: "One more construction crew can work at once (max 3).",
    cost: 2000,
    requires: { source: "bicycle", count: 1 },
    effects: { crew: 1 },
  },
  {
    id: "efficient_boiler",
    name: "Efficient Boiler",
    desc: "Steam Generators: +60% output and −40% CO₂.",
    cost: 6000,
    requires: { source: "steam_generator", count: 2 },
    effects: {
      sourceMult: { steam_generator: 1.6 },
      sourceCo2Mult: { steam_generator: 0.6 },
    },
  },
  {
    id: "long_blades",
    name: "Long Blades",
    desc: "Waterwheels produce 2× more.",
    cost: 20000,
    requires: { source: "waterwheel", count: 3 },
    effects: { sourceMult: { waterwheel: 2 } },
  },
  {
    id: "catalytic",
    name: "Catalytic Scrubbers",
    desc: "Passively absorbs +3 kg CO₂/s across your whole site.",
    cost: 40000,
    requires: { source: "steam_generator", count: 3 },
    effects: { absorption: 3 },
  },
  {
    id: "perovskite",
    name: "Perovskite Panels",
    desc: "Solar Panels produce 2× more.",
    cost: 80000,
    requires: { source: "solar_panel", count: 3 },
    effects: { sourceMult: { solar_panel: 2 } },
  },
  {
    id: "tall_rotors",
    name: "Tall Rotors",
    desc: "Wind Turbines produce 1.8× more.",
    cost: 300000,
    requires: { source: "wind_turbine", count: 3 },
    effects: { sourceMult: { wind_turbine: 1.8 } },
  },
  {
    id: "smart_grid",
    name: "Smart Grid",
    desc: "Every kWh sells for 15% more.",
    cost: 1000000,
    requires: { source: "wind_turbine", count: 4 },
    effects: { priceMult: 0.15 },
  },
];

// Contracts (objectives) ----------------------------------------------------
// check(state, metrics) -> boolean
export const OBJECTIVES = [
  {
    id: "first_spark",
    name: "First Spark",
    desc: "Reach 1 kWh/s of production.",
    reward: 60,
    check: (_s, m) => m.power >= 1,
  },
  {
    id: "off_the_grid",
    name: "Off the Grid",
    desc: "Build 3 renewable sources.",
    reward: 200,
    check: (_s, m) => m.renewables >= 3,
  },
  {
    id: "meet_demand",
    name: "Meet the Demand",
    desc: "Cover 100% of local demand.",
    reward: 350,
    check: (_s, m) => m.power > 0 && m.coverage >= 1,
  },
  {
    id: "room_to_grow",
    name: "Room to Grow",
    desc: "Expand your site once.",
    reward: 400,
    check: (s) => s.expansions >= 1,
  },
  {
    id: "warming_up",
    name: "Warming Up",
    desc: "Reach 100 kWh/s of production.",
    reward: 1200,
    check: (_s, m) => m.power >= 100,
  },
  {
    id: "fossil_era",
    name: "Fossil Era",
    desc: "Build a Coal Plant.",
    reward: 25000,
    check: (_s, m) => (m.counts.coal_plant || 0) >= 1,
  },
  {
    id: "clean_machine",
    name: "Clean Machine",
    desc: "Produce 1,000 kWh/s while keeping CO₂ below 100 kg.",
    reward: 50000,
    check: (_s, m) => m.power >= 1000 && m.co2 < 100,
  },
  {
    id: "atomic_age",
    name: "Atomic Age",
    desc: "Build a Nuclear Plant.",
    reward: 150000,
    check: (_s, m) => (m.counts.nuclear_plant || 0) >= 1,
  },
  {
    id: "grid_master",
    name: "Grid Master",
    desc: "Reach 10,000 kWh/s of production.",
    reward: 1000000,
    check: (_s, m) => m.power >= 10000,
  },
];

// Random events -------------------------------------------------------------
export const EVENTS = [
  {
    id: "heatwave",
    name: "Heat Wave",
    desc: "Air conditioners everywhere: demand +30% for 45s.",
    duration: 45,
    mods: { demandMult: 1.3 },
    kind: "warning",
  },
  {
    id: "grant",
    name: "Green Grant",
    desc: "A sustainability grant lands in your account.",
    instant: true,
    grantFactor: 30,
    kind: "good",
  },
  {
    id: "clouds",
    name: "Cloud Cover",
    desc: "Solar output −50% for 40s.",
    duration: 40,
    mods: { solarMult: 0.5 },
    kind: "warning",
  },
  {
    id: "inspection",
    name: "Carbon Inspection",
    desc: "Pollution penalties are harsher for 40s.",
    duration: 40,
    mods: { pollutionMult: 0.5 },
    kind: "danger",
    condition: (st) => st.co2 > 100,
  },
  {
    id: "boom",
    name: "Energy Boom",
    desc: "Market prices +30% for 45s.",
    duration: 45,
    mods: { priceMult: 1.3 },
    kind: "good",
  },
];
