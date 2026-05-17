# CO2mpromise

CO2mpromise is an idle/incremental clicker game with educational elements, where you build and manage a portfolio of energy sources, balancing output, pollution, and market prices to grow your energy empire sustainably.

## Game Overview

- **Genre:** Idle / Incremental Clicker with Educational Elements
- **Platform:** PC (LÖVE 2D)
- **Core Concept:**  
  Players build and manage energy production sources, balancing output, pollution, and market prices to grow their energy empire sustainably.

## Project Structure

```
CO2mpromise
├── src
│   ├── main.lua        # Entry point of the game (LÖVE callbacks)
│   └── utils.lua       # Utility functions
├── assets
│   └── sounds          # Directory for sound files
├── GAME_DESIGN.md      # Game design document
└── README.md           # Project documentation
```

## Getting Started

You can install LÖVE using [Homebrew](https://brew.sh/) on macOS:

```sh
brew install --cask love
```

Or download it from [the official LÖVE website](https://love2d.org/).


### Running the Game

1. Clone the repository or download the project files.
2. Navigate to the project directory in your terminal.
3. Run the game using the following command:

   ```
   love .
   ```

## Features

- Energy production and management
- Dynamic market price simulation
- Pollution tracking and limits
- Build queue for long-construction sources
- Research and upgrades (planned)
- Event system (planned)
- Educational feedback and stats

## Contributing

Feel free to contribute to this project by submitting issues or pull requests. Your feedback and suggestions are welcome!

For the full game design, see [GAME_DESIGN.md](./GAME_DESIGN.md).
