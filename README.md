# 💿 FluxPlayer - Ultimate Music Experience

DexPlayer is a modern, high-performance music player built with Node.js and a sleek glassmorphic UI. It features advanced metadata extraction, interactive visualizers, and cross-platform support.

![FluxPlayer Preview](public/preview.png)

## ✨ Features

- **Premium UI**: Modern dark theme with glassmorphism and smooth animations.
- **Smart Metadata**: Automatically extracts title, artist, album, and artwork. Fallback to `ffprobe` for accurate durations.
- **Visualizers**: Immersive frequency bar animations in fullscreen mode.
- **Integrated Playback**: Full control (Play/Pause/Stop, Next/Prev, Shuffle, Repeat).
- **Library Management**: Search, sort, upload, and delete songs directly from the UI.
- **Stability**: Robust backend with explicit state management.

## 🚀 Quick Start

### 🐧 Linux & Raspberry Pi (One-Liner)
Run this command in your terminal to install everything automatically:
```bash
curl -sSL https://raw.githubusercontent.com/DenisVargaeu/FluxPlayer/main/install.sh | bash
```

*OR manual installation:*
1. Open terminal in the project folder.
2. Run the installation script:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
3. Start the server:
   ```bash
   node server.js
   ```

### 🪟 Windows
1. Open the project folder.
2. Double-click `install.bat` (or run it in Command Prompt).
3. Start the server:
   ```cmd
   node server.js
   ```

## 🛠️ Requirements

- **Node.js** (v14+)
- **MPV**: Used for backend audio playback.
- **FFmpeg**: Used for duration extraction.

*The installation scripts will attempt to install these for you!*

## 🌐 Usage

1. Start the server as shown above.
2. Open `http://localhost:7763` in any modern browser.
3. Upload music files using the sidebar.
4. Click songs to add to playlist, drag to reorder.
5. Hit the **Expand** icon for the Fullscreen Visualizer mode!

## 📜 License
MIT
