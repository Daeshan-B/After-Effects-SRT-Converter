#target aftereffects
/*
 * AE-Captioner v2
 * Converts an .srt caption file into timecode-synced text layers in After Effects.
 *
 * Fixes vs v1:
 *  - Robust regex-based SRT parser (handles BOM, CRLF/LF, zero-start cues, blank lines)
 *  - No stray blank lines appended to caption text
 *  - <i>/<b>/<font> tags stripped, cue index lines dropped
 *  - Real styling options: font size, hex color, positioning
 *  - Comp duration padded with one second after the last caption
 *
 * Usage: File > Scripts > Run Script File… then click "Import SRT".
 */

(function (thisObj) {

    // ExtendScript (ES3) polyfill for String.trim
    if (!String.prototype.trim) {
        String.prototype.trim = function () { return this.replace(/^\s+|\s+$/g, ""); };
    }

    // ---------- Dockable window helpers ----------
    function createDockableUI(host) {
        var w = (host instanceof Panel) ? host : new Window("palette", "AE-Captioner", undefined, {
            resizeable: true,
            closeButton: true
        });
        w.onResizing = w.onResize = function () { this.layout.resize(); };
        return w;
    }

    function showWindow(w) {
        if (w instanceof Window) { w.center(); w.show(); }
        if (w instanceof Panel) { w.layout.layout(true); w.layout.resize(); }
    }

    // ---------- SRT parsing ----------
    // Returns array of cues: [{ start: seconds, end: seconds, text: string }]
    function parseSRT(file) {
        file.open("r");
        var content = file.read();
        file.close();

        content = content.replace(/^\uFEFF/, "");                       // UTF-8 BOM
        content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n"); // CRLF -> LF

        var timecodeRe = /\b(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\b/;
        var blocks = content.split(/\n{2,}/);
        var cues = [];
        var i;

        for (i = 0; i < blocks.length; i++) {
            var m = blocks[i].match(timecodeRe);
            if (!m) { continue; }

            var start = toSeconds(m[1], m[2], m[3], m[4]);
            var end = toSeconds(m[5], m[6], m[7], m[8]);
            if (end <= start) { continue; }

            var text = blocks[i].replace(timecodeRe, "\n").trim(); // keep only the text part
            text = text.replace(/^\d+\s*/, "");                     // drop cue index line
            text = text.replace(/<[^>]*>/g, "");                     // strip <i> <b> <font>...
            text = text.replace(/&nbsp;/g, " ");
            text = text.trim();

            if (text === "") { continue; }
            cues.push({ start: start, end: end, text: text });
        }
        return cues;
    }

    function toSeconds(h, m, s, ms) {
        return (+h) * 3600 + (+m) * 60 + (+s) + (+ms) / 1000;
    }

    // ---------- Caption layer creation ----------
    function addCaption(comp, cue, opts) {
        var layer = comp.layers.addText(cue.text);
        var doc = layer.sourceText.value;

        doc.justification = ParagraphJustification.CENTER_JUSTIFY;
        doc.fontSize = opts.fontSize;
        doc.leading = Math.round(opts.fontSize * 1.2);
        doc.fillColor = opts.fillColor;

        layer.sourceText.setValue(doc);

        layer.inPoint = cue.start;
        layer.outPoint = cue.end;

        var multiline = cue.text.indexOf("\n") !== -1;
        var anchorExpr;

        if (opts.position === 0) {        // Bottom
            anchorExpr = "var r = thisLayer.sourceRectAtTime(thisLayer.inPoint, false);" +
                         "x = r.left + r.width / 2; y = r.top; [x, y];";
            layer.position.setValue([comp.width / 2,
                multiline ? comp.height * 0.85 : comp.height * 0.905]);
        } else if (opts.position === 1) { // Middle
            anchorExpr = "var r = thisLayer.sourceRectAtTime(thisLayer.inPoint, false);" +
                         "x = r.left + r.width / 2; y = r.top + r.height / 2; [x, y];";
            layer.position.setValue([comp.width / 2, comp.height / 2]);
        } else {                          // Top
            anchorExpr = "var r = thisLayer.sourceRectAtTime(thisLayer.inPoint, false);" +
                         "x = r.left + r.width / 2; y = r.top; [x, y];";
            layer.position.setValue([comp.width / 2, comp.height * 0.4814]);
        }

        layer.anchorPoint.expression = anchorExpr;
        return layer;
    }

    // "#FFFFFF" (or #FFF) -> [r,g,b] floats in 0..1 for AE
    function hexToRGB(hex) {
        hex = String(hex).replace(/[^0-9a-fA-F]/g, "");
        if (hex.length === 3) {
            hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) +
                  hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
        }
        var n = parseInt(hex, 16);
        if (isNaN(n)) { n = 0xFFFFFF; }
        return [((n >> 16) & 0xFF) / 255, ((n >> 8) & 0xFF) / 255, (n & 0xFF) / 255];
    }

    // ---------- Import handler ----------
    function importSRT() {
        if (app.project === null) {
            alert("Please open a project first.");
            return;
        }

        var file = File.openDialog("Import an .srt caption file:", "*.srt");
        if (!file) { alert("No file selected. Import cancelled."); return; }

        var cues = parseSRT(file);
        if (cues.length === 0) {
            alert("No valid captions found in: " + file.name);
            return;
        }

        var frameRate = parseFloat(FrameRateValue.text);
        var width  = parseInt(WidthValue.text, 10);
        var height = parseInt(HeightValue.text, 10);
        if (!frameRate || isNaN(frameRate)) { frameRate = 23.976; }
        if (!width || isNaN(width))   { width = 1920; }
        if (!height || isNaN(height)) { height = 1080; }

        var comp = app.project.items.addComp(
            file.name.replace(/\.srt$/i, ""),
            width, height, 1, 1, frameRate
        );

        var sel = PositioningList.selection;
        var position = (sel && typeof sel.index === "number") ? sel.index : 0;

        var opts = {
            fontSize: parseFloat(FontSizeValue.text) || 60,
            fillColor: hexToRGB(TextColorValue.text),
            position: position
        };

        var i, lastEnd = 0;
        for (i = 0; i < cues.length; i++) {
            addCaption(comp, cues[i], opts);
            if (cues[i].end > lastEnd) { lastEnd = cues[i].end; }
        }
        comp.duration = lastEnd + 1; // one second of tail room

        comp.openInViewer();
        alert(cues.length + " captions created in \"" + comp.name + "\".");
    }


    // ---------- UI ----------
    var dock = createDockableUI(thisObj);
    dock.text = "Captioner";
    dock.orientation = "column";
    dock.alignChildren = ["center", "top"];
    dock.spacing = 10;
    dock.margins = 18;

    // Import options
    var importPanel = dock.add("panel", undefined, undefined, { name: "ImportOptionsPanel" });
    importPanel.text = "Import Options";
    importPanel.orientation = "column";
    importPanel.alignChildren = ["left", "top"];
    importPanel.spacing = 8;
    importPanel.margins = 12;

    var frameGroup = importPanel.add("group");
    frameGroup.orientation = "row";
    frameGroup.spacing = 10;
    frameGroup.add("statictext", undefined, "Framerate:");
    var FrameRateValue = frameGroup.add("edittext", undefined, "23.976");
    FrameRateValue.characters = 8;

    var sizeGroup = importPanel.add("group");
    sizeGroup.orientation = "row";
    sizeGroup.spacing = 10;
    sizeGroup.add("statictext", undefined, "Composition:");
    var WidthValue = sizeGroup.add("edittext", undefined, "1920");
    WidthValue.characters = 6;
    sizeGroup.add("statictext", undefined, "x");
    var HeightValue = sizeGroup.add("edittext", undefined, "1080");
    HeightValue.characters = 6;

    // Styling
    var stylePanel = dock.add("panel", undefined, undefined, { name: "StylingPanel" });
    stylePanel.text = "Styling";
    stylePanel.orientation = "column";
    stylePanel.alignChildren = ["left", "top"];
    stylePanel.spacing = 8;
    stylePanel.margins = 12;

    var fontGroup = stylePanel.add("group");
    fontGroup.orientation = "row";
    fontGroup.spacing = 10;
    fontGroup.add("statictext", undefined, "Font size:");
    var FontSizeValue = fontGroup.add("edittext", undefined, "60");
    FontSizeValue.characters = 6;

    var colorGroup = stylePanel.add("group");
    colorGroup.orientation = "row";
    colorGroup.spacing = 10;
    colorGroup.add("statictext", undefined, "Color (hex):");
    var TextColorValue = colorGroup.add("edittext", undefined, "FFFFFF");
    TextColorValue.characters = 8;

    var posGroup = stylePanel.add("group");
    posGroup.orientation = "row";
    posGroup.spacing = 10;
    posGroup.add("statictext", undefined, "Position:");
    var PositioningList = posGroup.add("dropdownlist", undefined, undefined, {
        name: "PositioningList",
        items: ["Bottom", "Middle", "Top"]
    });
    PositioningList.selection = 0;

    var importButton = dock.add("button", undefined, "Import SRT");
    importButton.onClick = importSRT;

    showWindow(dock);

})(this);

