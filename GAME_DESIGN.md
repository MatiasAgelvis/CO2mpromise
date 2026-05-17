# Game Design Document — CO2mpromise

## 1. Game Overview

**Title:** CO2mpromise  
**Genre:** Idle / Incremental Clicker with Educational Elements  
**Platform:** PC / Web (LÖVE 2D or Web tech TBD)  
**Core Concept:**  
Players build and manage a portfolio of energy production sources, balancing output, pollution, and market prices to grow their energy empire sustainably.

---

## 2. Core Gameplay Loop

1. Produce energy (kWh) from owned sources every second.
2. Earn money based on current market price ($/kWh).
3. Use money to buy new energy sources or research upgrades.
4. Manage pollution, which increases with fossil fuel usage.
5. Research unlocks cleaner tech and efficiencies.
6. Dynamic market price affects profitability.
7. Strategic trade-offs between building fast but polluting, or slow but clean.
8. Optional lose condition if pollution exceeds threshold.

---

## 3. Core Mechanics

| Mechanic                | Description                                                    |
|-------------------------|----------------------------------------------------------------|
| Energy Production       | Each source produces kWh/s; cumulative production converts to income |
| Market Price            | Fluctuates with Brownian motion; determines $/kWh for income. May increase if production is below quota, decrease if above. |
| Pollution               | Sources generate g CO₂/s; tracked cumulatively                |
| Pollution Limit         | Crossing limit restricts fossil fuel builds or triggers game over |
| Build Time              | Certain sources (e.g., nuclear) have long build durations      |
| Research Tree           | Unlocks tech, efficiency, and pollution reduction             |
| Events/Weather          | Optional modifiers affecting output and price                  |
| Energy Production Quota | Player must maintain a minimum production rate (quota) that increases over time. Failing to meet the quota for too long results in penalties or game over. |

---

## 4. Units and Resources

| Resource         | Unit           | Notes                        |
|------------------|----------------|------------------------------|
| Energy           | kWh            | Core resource                |
| Production Rate  | kWh/s          | Output rate per source       |
| Pollution        | grams CO₂/sec  | Emission rate, tracked cumulatively |
| Money            | $ or €         | Earned from selling energy   |
| Time             | Seconds        | Game tick and build timers   |

---

## 5. Energy Sources (Initial Examples)

| Source         | Output (kWh/s) | Pollution (g CO₂/s) | Cost ($) | Build Time (s) | Notes                        |
|----------------|----------------|---------------------|----------|----------------|------------------------------|
| Hamster Wheel  | 0.002          | 0                   | 1        | Instant        | Educational starter          |
| Coal Plant     | 500            | 1000                | 5000     | Instant        | Cheap but polluting          |
| Wind Turbine   | 150            | 0                   | 7500     | Instant        | Weather dependent (future)   |
| Solar Panel    | 80             | 0                   | 6000     | Instant        | Daytime production (future)  |
| Nuclear Plant  | 1000           | 0                   | 100000   | 300            | Clean, high output, slow     |

---

## 6. Win/Lose Conditions

- **Lose:** Pollution exceeds threshold (soft or hard mode)
- **Lose:** Energy production stays below the required quota for too long
- **Win:** Achieve sustainable energy production goal or reach a milestone (TBD)
- **Sandbox:** Infinite play mode to experiment and learn

---

## 7. UI Elements (Ideas)

- Energy output display (total kWh/s) and current quota
- Market price ticker ($/kWh) with trend arrow
- Pollution meter with threshold indicator
- Build queue/progress for long builds
- Research tree panel (future)
- Event notifications (weather, price spikes)

---

## 8. Educational Objectives

- Teach players the trade-offs between energy production speed, cost, and pollution
- Demonstrate market-driven energy economics with price fluctuations
- Introduce the time lag in building infrastructure
- Encourage strategic thinking balancing growth and sustainability
