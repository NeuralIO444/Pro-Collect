//
// AE_MoveComps_Pro_DestAndCollapse.jsx
//
// Move listed comps to the Project Root OR a destination folder with better UX and safety.
// - Paste names (one per line)
// - Optional: case-insensitive match
// - Optional: strip extensions (.mov, .mp4, .tif, .png, .jpg, .psd, .exr, etc.) and trailing ".new."
// - Dry run confirmation with clear summary (shows destination)
// - Final report lists NOT FOUND and ALREADY IN DESTINATION
// - Save Report... and Select moved comps
// - Optional: collapse (twirl closed) all folders in the Project panel after the run (best-effort; see notes)

(function () {

    // -------- Guards --------
    if (!(app && app.project)) {
        alert("Please open a project first.");
        return;
    }
    var project = app.project;
    var rootFolder = project.rootFolder;

    // -------- Helpers --------
    function trim(s) { return s.replace(/^\s+|\s+$/g, ""); }

    function normalizeLines(raw) {
        return raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    }

    function endsWith(str, suffix) {
        var idx = str.length - suffix.length;
        return idx >= 0 && str.indexOf(suffix, idx) === idx;
    }

    function parseNames(raw, opts) {
        // Dedup by lowercase key
        var lines = normalizeLines(raw);
        var out = [];
        var seen = {};
        var exts = [".mov",".mp4",".mxf",".wav",".aif",".aiff",".tif",".tiff",".png",".jpg",".jpeg",".psd",".exr",".gif"];
        var i, n, key, ln, ext;
        for (i = 0; i < lines.length; i++) {
            n = trim(lines[i]);
            if (!n) continue;
            if (opts.stripExt) {
                ln = n.toLowerCase();
                // strip extensions
                for (var e = 0; e < exts.length; e++) {
                    ext = exts[e];
                    if (endsWith(ln, ext)) {
                        n = n.substring(0, n.length - ext.length);
                        ln = n.toLowerCase();
                        break;
                    }
                }
                // special case: trailing ".new."
                if (endsWith(ln, ".new.")) {
                    n = n.substring(0, n.length - 5);
                    ln = n.toLowerCase();
                }
            }
            key = n.toLowerCase();
            if (!seen[key]) {
                out.push(n);
                seen[key] = true;
            }
        }
        return out;
    }

    function buildCompIndex() {
        // Return both exact and lowercase maps for fast lookup
        var exact = {}; // name -> [CompItem...]
        var lower = {}; // lname -> [CompItem...]
        var all = [];
        for (var i = 1; i <= project.numItems; i++) {
            var it = project.item(i);
            if (it instanceof CompItem) {
                all.push(it);
                var nm = it.name;
                var ln = nm.toLowerCase();
                if (!exact[nm]) exact[nm] = [];
                exact[nm].push(it);
                if (!lower[ln]) lower[ln] = [];
                lower[ln].push(it);
            }
        }
        return { all: all, exact: exact, lower: lower };
    }

    // --- Destination helpers (folder lookup/creation using nested paths like "Parent/Child") ---

    function findChildFolderByName(parentFolderItem, name) {
        // Safe and simple: scan the whole project and match by parentFolder & name
        for (var i = 1; i <= project.numItems; i++) {
            var it = project.item(i);
            if (it instanceof FolderItem && it.parentFolder === parentFolderItem && it.name === name) {
                return it;
            }
        }
        return null;
    }

    function createFolderChild(parentFolderItem, name) {
        var fol = project.items.addFolder(name);
        fol.parentFolder = parentFolderItem;
        return fol;
    }

    function resolveDestinationFolder(pathStr, createIfMissing) {
        // Empty path -> root
        if (!pathStr || !trim(pathStr)) return rootFolder;

        var path = pathStr.replace(/\\/g, "/").split("/");
        var parent = rootFolder;
        for (var i = 0; i < path.length; i++) {
            var seg = trim(path[i]);
            if (!seg) continue;
            var existing = findChildFolderByName(parent, seg);
            if (!existing) {
                if (!createIfMissing) return null;
                existing = createFolderChild(parent, seg);
            }
            parent = existing;
        }
        return parent;
    }

    function folderPathString(folder) {
        if (folder === rootFolder) return "Project Root";
        var names = [];
        var f = folder;
        while (f && f !== rootFolder) {
            names.unshift(f.name);
            f = f.parentFolder;
        }
        return names.join("/");
    }

    // --- Best-effort collapse of Project panel folders ---
    function collapseProjectFoldersBestEffort() {
        // NOTE: There is no official public API to twirl-close Project panel folders.
        // The only potential route is app.executeCommand(ID), where the ID is an internal,
        // version-dependent menu command for “Collapse All Folders” in the Project panel.
        // If you know the command ID for your AE version, add it below.
        var candidateIds = []; // e.g., [12345];
        for (var i = 0; i < candidateIds.length; i++) {
            try { app.executeCommand(candidateIds[i]); } catch (e) { /* ignore */ }
        }
        // If no IDs are defined or they fail, this function is a no-op by design.
    }

    function showReportDialog(title, text) {
        var w = new Window("dialog", title);
        w.orientation = "column";
        w.alignChildren = ["fill", "top"];
        w.margins = 12;
        w.spacing = 8;
        w.add("statictext", undefined, "Summary (read-only):");
        var box = w.add("edittext", undefined, text, { multiline: true, scrolling: true, readonly: true });
        box.preferredSize = [600, 340];
        var row = w.add("group");
        row.orientation = "row";
        row.alignment = "right";
        var saveBtn = row.add("button", undefined, "Save Report...");
        var closeBtn = row.add("button", undefined, "Close");
        saveBtn.onClick = function () {
            var defaultFile = File(Folder.desktop.fsName + "/AE_MoveComps_Report.txt");
            var file = defaultFile.saveDlg("Save report as", "*.txt");
            if (!file) return;
            try {
                if (file.exists) file.remove();
                if (file.open("w")) {
                    file.write(text);
                    file.close();
                    alert("Report saved:\n" + file.fsName);
                } else {
                    alert("Could not open file for writing.");
                }
            } catch (e) {
                alert("Save failed: " + e.toString());
            }
        };
        closeBtn.onClick = function () { w.close(); };
        w.center();
        w.show();
    }

    // -------- UI --------
    var dlg = new Window("dialog", "Move Comps");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.margins = 15;
    dlg.spacing = 10;

    dlg.add("statictext", undefined, "Paste list of composition names (one per line):");
    var input = dlg.add("edittext", undefined, "", { multiline: true, scrolling: true });
    input.preferredSize = [520, 240];

    var optsPanel = dlg.add("panel", undefined, "Options");
    optsPanel.orientation = "column";
    optsPanel.alignChildren = ["left", "top"];
    optsPanel.margins = 10;

    var chkCase   = optsPanel.add("checkbox", undefined, "Case-insensitive match");
    chkCase.value = false;

    var chkStrip  = optsPanel.add("checkbox", undefined, "Strip common file extensions (.mov, .mp4, .tif, .png, .jpg, .psd, .exr, etc.) and trailing \".new.\"");
    chkStrip.value = true;

    var chkSelect = optsPanel.add("checkbox", undefined, "Select moved comps after run");
    chkSelect.value = true;

    // --- New: Destination options ---
    var chkUseDest = optsPanel.add("checkbox", undefined, "Move to a destination folder (instead of Project Root)");
    chkUseDest.value = false;

    var destGroup = optsPanel.add("group");
    destGroup.orientation = "column";
    destGroup.alignChildren = ["left", "top"];

    var destRow1 = destGroup.add("group");
    destRow1.orientation = "row";
    destRow1.add("statictext", undefined, "Destination path (e.g., Delivery/VFX):");
    var destEdit = destRow1.add("edittext", undefined, "");
    destEdit.characters = 30;
    destEdit.enabled = chkUseDest.value;

    var chkCreate = destGroup.add("checkbox", undefined, "Create destination folder path if missing");
    chkCreate.value = true;
    chkCreate.enabled = chkUseDest.value;

    // --- New: Collapse Project panel after run ---
    var chkCollapse = optsPanel.add("checkbox", undefined, "Collapse all folders in Project panel after run (best-effort)");
    chkCollapse.value = true;

    // Enable/disable destination controls
    chkUseDest.onClick = function () {
        destEdit.enabled = chkUseDest.value;
        chkCreate.enabled = chkUseDest.value;
    };

    var btnRow = dlg.add("group");
    btnRow.orientation = "row";
    btnRow.alignment = "right";
    var okBtn = btnRow.add("button", undefined, "OK");
    var cancelBtn = btnRow.add("button", undefined, "Cancel");
    cancelBtn.onClick = function () { dlg.close(); };

    if (dlg.show() !== 1) return;

    // -------- Parse Names --------
    var names = parseNames(input.text, { stripExt: chkStrip.value });
    if (names.length === 0) {
        alert("No comp names entered.");
        return;
    }

    // -------- Resolve Destination --------
    var destFolder = rootFolder;
    var destLabel = "Project Root";
    if (chkUseDest.value) {
        var path = trim(destEdit.text);
        if (!path) {
            alert("Destination path is empty. Either uncheck 'Move to a destination folder' or provide a path.");
            return;
        }
        destFolder = resolveDestinationFolder(path, chkCreate.value);
        if (!destFolder) {
            alert("Destination folder path not found in Project: \"" + path + "\".\nEnable 'Create destination folder path if missing' or adjust the path.");
            return;
        }
        destLabel = folderPathString(destFolder);
    }

    // -------- Index Comps --------
    var idx = buildCompIndex();

    // -------- Dry Run Summary --------
    var caseInsensitive = chkCase.value;
    var foundComps = [];      // all comps that match any name (duplicates allowed)
    var missing = [];         // names with zero matches
    var alreadyInDest = [];   // comps already at destination
    var movedCandidates = []; // comps that would actually move

    var i, j, target, pool, c;
    for (i = 0; i < names.length; i++) {
        target = names[i];
        pool = caseInsensitive ? idx.lower[target.toLowerCase()] : idx.exact[target];
        if (pool && pool.length) {
            // Accumulate pools; decide later whether they need moving
            for (j = 0; j < pool.length; j++) {
                c = pool[j];
                foundComps.push(c);
                if (c.parentFolder === destFolder) {
                    alreadyInDest.push(c);
                } else {
                    movedCandidates.push(c);
                }
            }
        } else {
            missing.push(target);
        }
    }

    // Build dry-run message
    var pre = [];
    pre.push("Dry Run — Move Comps");
    pre.push("--------------------------------------------");
    pre.push("Destination: " + destLabel);
    pre.push("Names entered: " + names.length);
    pre.push("Matched comps: " + foundComps.length);
    pre.push("Would move: " + movedCandidates.length);
    pre.push("Already in destination: " + alreadyInDest.length);
    pre.push("");
    if (movedCandidates.length > 0) {
        pre.push("Will move these comps:");
        var maxShow = Math.min(20, movedCandidates.length);
        for (i = 0; i < maxShow; i++) pre.push(" - " + movedCandidates[i].name);
        if (movedCandidates.length > maxShow) pre.push(" ... and " + (movedCandidates.length - maxShow) + " more");
        pre.push("");
    }
    pre.push("Not found (" + missing.length + "):");
    if (missing.length) {
        for (i = 0; i < missing.length; i++) pre.push(" - " + missing[i]);
    } else {
        pre.push(" - None");
    }
    pre.push("");
    pre.push("Proceed with moving matched comps to the destination?");

    // Confirm
    var proceed = confirm(pre.join("\n"), true, "Confirm Move");
    if (!proceed) return;

    // -------- Execute --------
    app.beginUndoGroup("Move Comps");
    var movedCount = 0;
    try {
        for (i = 0; i < movedCandidates.length; i++) {
            var comp = movedCandidates[i];
            if (comp.parentFolder !== destFolder) {
                comp.parentFolder = destFolder;
                movedCount++;
            }
        }
    } catch (e) {
        alert("Error during move: " + e.toString());
    } finally {
        app.endUndoGroup();
    }

    // Optional selection
    if (chkSelect.value) {
        // Clear all selections
        for (i = 1; i <= project.numItems; i++) {
            try { project.item(i).selected = false; } catch (eSelClear) {}
        }
        // Select moved comps
        for (i = 0; i < movedCandidates.length; i++) {
            try { movedCandidates[i].selected = true; } catch (eSel) {}
        }
    }

    // Optional: collapse (best-effort)
    if (chkCollapse.value) {
        try { collapseProjectFoldersBestEffort(); } catch (eCollapse) { /* ignore */ }
    }

    // -------- Final Report --------
    var rep = [];
    rep.push("Move Comps — Completed");
    rep.push("--------------------------------------------");
    rep.push("Destination: " + destLabel);
    rep.push("Names entered: " + names.length);
    rep.push("Matched comps: " + foundComps.length);
    rep.push("Moved to destination: " + movedCount);
    rep.push("Already in destination: " + alreadyInDest.length);
    rep.push("");
    rep.push("Not found (" + missing.length + "):");
    if (missing.length) {
        for (i = 0; i < missing.length; i++) rep.push(" - " + missing[i]);
    } else {
        rep.push(" - None");
    }

    showReportDialog("Move Comps Report", rep.join("\n"));

})();
