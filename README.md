<div align="center">

# After Effects SRT Converter

**Drop an `.srt` in. Get timed text layers out.**

A tiny ExtendScript panel that turns subtitle files into timecode-synced, fully editable text layers in Adobe After Effects — no plugins, no dependencies, no fuss.

[![After Effects](https://img.shields.io/badge/%F0%9F%8E%AC_After_Effects-9999FF?style=for-the-badge)](https://www.adobe.com/products/aftereffects.html)
![ExtendScript](https://img.shields.io/badge/%F0%9F%A7%A9_ExtendScript-ES3-8A6D3B?style=for-the-badge)
![SRT](https://img.shields.io/badge/%F0%9F%93%84_Input-.srt-4CAF50?style=for-the-badge)
[![License](https://img.shields.io/badge/%E2%9A%96%EF%B8%8F_License-GPLv3-2C6BED?style=for-the-badge)](LICENSE)
![Platform](https://img.shields.io/badge/%F0%9F%92%BB_Platform-macOS_%2B_Windows-333333?style=for-the-badge)

</div>

---

## ✨ What it does

Point the panel at a subtitle file and it builds a fresh composition where every caption becomes its own text layer, trimmed to the exact in/out points from the `.srt`. Everything stays native — edit the words, swap the font, animate the layers. Nothing is baked in.

```text
captions.srt  ──▶  [ AE-Captioner ]  ──▶  "captions" comp
                                           ├─ 00:00:01:00 → 00:00:03:12  "Hello there"
                                           ├─ 00:00:04:02 → 00:00:06:20  "This is a caption"
                                           └─ 00:00:07:00 → 00:00:09:08  "And another one"
```

## 🫧 Features

- 🎯 **Frame-accurate timing** — in/out points land on the source timecodes
- 🧼 **Forgiving parser** — handles BOM, CRLF/LF, zero-start cues, blank lines and cue numbering
- 🏷️ **Tag stripping** — `<i>`, `<b>`, `<font>` and friends are removed cleanly
- 🎨 **Real styling** — font size, hex color and bottom/middle/top placement
- 📐 **Auto-anchored** — expression-driven anchor points keep text centered as it wraps
- 🧩 **Dockable UI** — behaves like a normal AE panel, resizable and all
- 🪶 **Zero dependencies** — one `.jsx` file, ES3-safe

## 🚀 Install

1. Download or clone this repo.
2. Drop `Captioner.jsx` wherever you keep scripts, e.g.:
   - **macOS** — `Applications/Adobe After Effects <version>/Scripts/ScriptUI Panels/`
   - **Windows** — `Program Files\Adobe\Adobe After Effects <version>\Support Files\Scripts\ScriptUI Panels\`
3. In After Effects, enable **Preferences → Scripting & Expressions → Allow Scripts to Write Files and Access Network**.
4. Restart AE. The panel shows up under **Window → Captioner**.

> No install? Run it straight from **File → Scripts → Run Script File…** and pick `Captioner.jsx`.

## 🎬 Usage

1. Open (or create) a project in After Effects.
2. Launch the **Captioner** panel from the **Window** menu.
3. Set your framerate and composition size.
4. Pick a font size, text color and position.
5. Hit **Import SRT** and choose your subtitle file.

The new comp opens automatically and reports how many captions were created.

## ⚙️ Options

| Option | Default | Notes |
| --- | --- | --- |
| Framerate | `23.976` | Used for the new composition |
| Composition | `1920 × 1080` | Width × height in pixels |
| Font size | `60` | Points |
| Color | `FFFFFF` | Hex, with or without `#` |
| Position | `Bottom` | `Bottom`, `Middle` or `Top` |

## 🧠 Good to know

- The generated composition runs one second past the last caption, so there's tail room to work with.
- Captions are centered horizontally and use an expression-based anchor point, so multi-line text stays put when you edit it.
- Layer names inherit the caption text, which makes the timeline easy to scan.
- The source `.srt` is never modified.

## 🩹 Troubleshooting

| Symptom | Fix |
| --- | --- |
| Nothing happens on import | Make sure a project is open and scripting is allowed in Preferences |
| "No valid captions found" | Check the file is real SRT (numbered cues with `-->` timecodes) |
| Panel missing from Window menu | Confirm the file lives in the **ScriptUI Panels** folder and restart AE |
| Text looks off-center | Adjust the anchor point expression or set position manually |

## 📄 License

[GPLv3](LICENSE) — do what you like, keep it open.

<div align="center">

Made for people who would rather not keyframe subtitles by hand. 🫡

</div>
