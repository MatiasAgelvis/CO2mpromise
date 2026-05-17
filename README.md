# CO2mpromise

CO2mpromise is an incremental/idle game about building energy sources, balancing power production, pollution, and market dynamics. This repository currently contains a lightweight web prototype (ES modules + vanilla JS) alongside original LÖVE-era assets and design notes.

Status: web prototype — playable in the browser (no build tooling required).

## Quick start (web prototype)

Serve the folder from a local static server and open it in your browser. Example using Python 3:

```bash
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

The prototype is intentionally zero-install — it uses ES modules and loads assets from the `sprites/` and `assets/` folders.

## Project layout (high level)

```
CO2mpromise/
├── game.js         # app bootstrap + main loop
├── ui.js           # DOM UI + sprite placement
├── state.js        # simulation, tick, buy, totals
├── tech.js         # definitions for energy sources
├── sprites/        # sprite PNGs used by the UI
├── style.css       # stylesheet
├── index.html
├── README.md
└── GAME_DESIGN.md
```

## How to play (prototype)

- Click the `Hand Crank` button to get immediate gold.
- Buy sources from the right-hand panel; each purchase spawns a visual sprite in the main area and increases passive income.
- Watch `Pollution` and `Market` — pollution reduces income via a penalty curve; market price floats with supply/demand.

## Development notes

- Sprites are in `sprites/` and referenced from `tech.js` via `img_filename`.
- The `state` object is serialized only in-memory for now; add `localStorage` save/load if you want persistence.
- UI layout is in `style.css` with a responsive grid that stacks on narrow screens.

## Contributing

PRs, issues and suggestions are welcome. If you want to contribute small UI/UX improvements or balancing changes, open a PR against the `main` branch.

## .gitignore

A `.gitignore` has been added to exclude editor, OS, and build artifacts — please follow it when committing.

For design rationale and older LÖVE code references, see `GAME_DESIGN.md`.
