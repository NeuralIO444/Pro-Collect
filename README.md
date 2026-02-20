# Pro-Collect
![Pro-Collect Banner](ProCollectBanner.png)

A More advanced After Effects Project Collector

## Version 4 (Modular)
`ProCollect_04.jsx` is the main entry point for the script. It uses a modular architecture to separate concerns, making the codebase easier to maintain.

### Structure
- **`ProCollect_04.jsx`**: Main executable script. Run this from After Effects via `File > Scripts > Run Script File...`
- **`lib/ui.jsxinc`**: Contains the user interface definitions and dialog window code. Loads the banner image `ProCollectBanner.png`.
- **`lib/model.jsxinc`**: Contains the core logic for parsing project items, resolving folder paths, and moving comps.
- **`lib/utils.jsxinc`**: Contains helper string manipulation functions.

### Requirements
- Ensure `ProCollectBanner.png` is located in the root repository folder next to `ProCollect_04.jsx` so the script can load it in the UI.
