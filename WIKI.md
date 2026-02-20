# Pro-Collect v4 Documentation

Pro-Collect is an advanced After Effects project consolidation tool designed to help you quickly move and organize multiple compositions into specific destination folders, with built-in cleanup and validation features.

## Table of Contents
1. [Installation](#installation)
2. [Features](#features)
3. [Usage](#usage)
4. [Architecture Output](#architecture-output)

---

## Installation
The tool relies on a modular file structure as of version 4. 

1. Download the `ProCollect_04.jsx` main script.
2. Download the `lib` directory containing the application components (`model.jsxinc`, `ui.jsxinc`, and `utils.jsxinc`).
3. Place the `lib/` directory in the **exact same folder** as your main `ProCollect_04.jsx` script.
4. Download the `ProCollectBanner.png` image and place it directly next to your main script file. If absent, the interface will simply load without the banner.
5. In After Effects, run the tool via `File > Scripts > Run Script File...` and select `ProCollect_04.jsx`.

---

## Features

### Bulk Composition Moving
Instead of manually hunting for compositions across a messy project panel, simply paste a list of composition names (one per line) into the interface. The tool processes the text block and moves every matched composition to a specified destination all at once.

### Smart Matching & Cleaning
Often, asset names are provided with file extensions (`.mp4`, `.mov`, `.png`, etc.) or version suffixes (e.g., `.new.`). 
- **Strip Common File Extensions:** Enable this option to automatically ignore common extensions attached to pasted names.
- **Case-Insensitive Match:** Toggle this to ensure the tool finds "Comp_01" even if you pasted "comp_01".

### Dynamic Custom Destinations
Rather than just moving compositions to the Project Root, you can stipulate nested destination folder paths (e.g., `Delivery/VFX/Finals`). 
- If the target folder path doesn't exist, the tool can automatically create the nested structure for you.

### Dry Run Verification
Before anything actually moves, the script indexes your project and displays a comprehensive **Dry Run Summary**. This breakdown tells you exactly how many comps matched, which ones are missing, which ones are already at the destination, and exactly what will be moved. You can cancel if the results aren't what you expected.

### Clean Workspaces
After a successful run, the tool can do two things:
1. Automatically select all the moved compositions in your Project panel.
2. Collapse all folders in the Project panel to leave your workspace feeling tidy.

### Post-Run Reporting
Need a receipt? At the end of the script execution, a comprehensive summary report will be generated. You can review the outcome and optionally save this log out to a `.txt` file.

---

## Architecture Output

For those modifying the code, the repository structure is broken up as follows:

* `ProCollect_04.jsx`: The main script that binds everything together. It initializes the model and UI, handles user confirmation during dry runs, and initiates the AE Undo Group when executing the move operation.
* `/lib/ui.jsxinc`: Defines the visual dialog interface components, loads the top branding banner image, and defines the post-run report modal.
* `/lib/model.jsxinc`: Contains the core project-specific After Effects operations. Built-in functions manage parsing item indices, resolving/creating nested destination folder paths, and the "best-effort" collapsing algorithm for the Project panel. 
* `/lib/utils.jsxinc`: Contains general, clean string manipulation helper patterns such as trailing space trimming, carriage-return parsing, and file extension stripping logic.
