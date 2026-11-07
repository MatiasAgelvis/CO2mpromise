# CO2mpromise

A small **clean-energy tycoon** prototype: build power sources on a limited site,
keep production in line with demand, and stop your carbon output from eating
your profits. Vanilla ES modules, no build step.

## Run it

Serve the folder with any static server, then open the page:

```bash
python -m http.server 8000
# http://localhost:8000
```

ES modules need to be served over HTTP (opening `index.html` directly with
`file://` will be blocked by the browser).

## The loop

1. **Hand Crank** for starting cash, then buy your first Hamster Wheel.
2. **Build** structures from the right-hand panel. Every structure occupies one
   plot, and most take real time to construct — watch them in the
   **Construction** panel.
3. **Match demand.** Electricity sells at the market price. Keep production near
   demand: underproducing leaves sales on the table, overproducing pushes the
   price per kWh down.
4. **Watch CO₂.** Dirty plants raise the CO₂ stock, which applies a carbon
   penalty to all income. Carbon Scrubbers and research clean it up.
5. **Expand land** when the site is full, and **research** upgrades to get more
   out of each structure.
6. **Complete contracts** for cash rewards and a sense of direction.

The economy runs while you are away (offline income is capped and credited at
50% efficiency). Progress auto-saves to `localStorage` every few seconds.

## What is in the prototype

- 9 buildable structures with per-unit costs, output, emissions, and build times
- A construction queue with limited crews and visible progress bars
- Land/plot management with escalating expansion costs
- 9 one-time research upgrades (output, emissions, crews, sale price)
- A supply/demand market with a live production-vs-demand chart
- A cumulative CO₂ model with scrubbers, absorption, and a carbon penalty
- 9 contracts with cash rewards
- Random events (heat waves, cloud cover, carbon inspections, grants, price booms)
- Persistent saves, offline income, and a reset button

## Project layout

```
CO2mpromise/
├── game.js         # bootstrap + real-time simulation loop
├── state.js        # economy, market, pollution, actions, save/load
├── ui.js           # dashboard DOM, plot grid, build/research/contracts
├── tech.js         # all balance numbers and content definitions
├── format.js       # shared number formatting
├── sprites/        # PNG sprites
├── style.css       # dashboard styling
├── index.html
├── README.md
└── GAME_DESIGN.md  # original design notes / vision
```

## Tuning

Almost every balance knob lives at the top of `tech.js`:

- `BASE_PRICE`, `START_MONEY`, `START_PLOTS`, `START_DEMAND`
- `DEMAND_FOLLOW` / `DEMAND_LAG` — how closely customers track your capacity
- `CO2_HALF`, `BASE_ABSORPTION` — how punishing pollution is
- `COST_GROWTH`, `LAND_*` — cost curves
- `SOURCES`, `UPGRADES`, `OBJECTIVES`, `EVENTS` — content

## Notes

- This is a prototype, not a balanced live game. Tune freely.
- The original LÖVE-era design notes live in `GAME_DESIGN.md`.
