# Pro-Collect
A More advanced After Effects Project Collector

![Pro-Collect Banner](ProCollectBanner.png)

## Version 4 (Modular)
`ProCollect_04.jsx` is the main entry point for the script. It uses a modular architecture to separate concerns, making the codebase easier to maintain.

### Structure
- **`ProCollect_04.jsx`**: Main executable script. Run this from After Effects via `File > Scripts > Run Script File...`
- **`lib/ui.jsxinc`**: Contains the user interface definitions and dialog window code. Loads the banner image `ProCollectBanner.png`.
- **`lib/model.jsxinc`**: Contains the core logic for parsing project items, resolving folder paths, and moving comps.
- **`lib/utils.jsxinc`**: Contains helper string manipulation functions.

### Requirements
- Ensure `ProCollectBanner.png` is located in the root repository folder next to `ProCollect_04.jsx` so the script can load it in the UI.

## ⚠️ Liability & Warranty Disclaimer

**USE AT YOUR OWN RISK.**
Asset Assassin is a powerful tool that moves and standardizes hundreds of items within your After Effects project hierarchy. While designed with a safe 'Dry Run' mode, unforeseen plugin conflicts or interrupted executions can result in missing links or confused project structures if run directly on an active master without saving.

*   **No Warranty:** This software is provided "as is" without warranty of any kind, express or implied.
*   **No Liability:** The authors or copyright holders shall not be liable for any claim, damages, lost project files, missed deadlines, or other liability arising from the use of this software.
*   **Best Practice:** ALWAYS save a distinct incremental version of your `.aep` project file before executing a live `Scan & Organize`.
