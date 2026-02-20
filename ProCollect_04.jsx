//
// ProCollect_04.jsx
//
// Move listed comps to the Project Root OR a destination folder with better UX and safety.
// - Modularized version using includes
// - Added UI Banner support
//

// Include modules
//@include "lib/utils.jsxinc"
//@include "lib/model.jsxinc"
//@include "lib/ui.jsxinc"

(function () {

    // -------- Guards --------
    if (!(app && app.project)) {
        alert("Please open a project first.");
        return;
    }
    var project = app.project;
    var rootFolder = project.rootFolder;
    
    // Initialize Model
    ProCollect_Model.init(project);

    // -------- UI --------
    var ui = ProCollect_UI.buildDialog();
    var dlg = ui.window;
    var refs = ui.refs;

    refs.cancelBtn.onClick = function () { dlg.close(); };

    if (dlg.show() !== 1) return;

    // -------- Parse Names --------
    var names = ProCollect_Utils.parseNames(refs.input.text, { stripExt: refs.chkStrip.value });
    if (names.length === 0) {
        alert("No comp names entered.");
        return;
    }

    // -------- Resolve Destination --------
    var destFolder = rootFolder;
    var destLabel = "Project Root";
    if (refs.chkUseDest.value) {
        var path = ProCollect_Utils.trim(refs.destEdit.text);
        if (!path) {
            alert("Destination path is empty. Either uncheck 'Move to a destination folder' or provide a path.");
            return;
        }
        destFolder = ProCollect_Model.resolveDestinationFolder(path, refs.chkCreate.value);
        if (!destFolder) {
            alert("Destination folder path not found in Project: \"" + path + "\".\nEnable 'Create destination folder path if missing' or adjust the path.");
            return;
        }
        destLabel = ProCollect_Model.folderPathString(destFolder);
    }

    // -------- Index Comps --------
    var idx = ProCollect_Model.buildCompIndex();

    // -------- Dry Run Summary --------
    var caseInsensitive = refs.chkCase.value;
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
    if (refs.chkSelect.value) {
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
    if (refs.chkCollapse.value) {
        try { ProCollect_Model.collapseProjectFoldersBestEffort(); } catch (eCollapse) { /* ignore */ }
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

    ProCollect_UI.showReportDialog("Move Comps Report", rep.join("\n"));

})();
