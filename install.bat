@echo off
echo 🚀 Starting FluxPlayer Installation for Windows...

:: 0. Pre-checks for essential tools
echo 🔍 Checking for essential tools...
where winget >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ winget not found. winget is required for automated dependency installation.
    echo Please install it from the Microsoft Store or https://github.com/microsoft/winget-cli
    pause
    exit /b
)

:: 1. Check/Get Project Files
if not exist server.js (
    echo 📂 Project files not found. Attempting to download...
    where git >nul 2>nul
    if %errorlevel% equ 0 (
        echo 🌐 Cloning repository...
        git clone https://github.com/DenisVargaeu/FluxPlayer.git .
    ) else (
        echo ❌ Git not found. Please download the project files manually or install git.
        pause
        exit /b
    )
)

:: 2. Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please download and install from https://nodejs.org/
    pause
    exit /b
)

:: 3. Try to install mpv and ffmpeg via winget
echo 📦 Attempting to install system dependencies (mpv, ffmpeg) via winget...
winget install -e --id mpv.mpv
winget install -e --id Gyan.FFmpeg

:: 4. Install npm dependencies
echo 📦 Installing npm dependencies...
call npm install --no-audit --no-fund

:: 5. Final Setup
if not exist music mkdir music

echo ✅ Installation complete!
echo.
echo 💖 If FluxPlayer improves your listening experience, please consider supporting development:
echo    Donate:  https://denisvarga.eu/donate (PayPal)
echo    GitHub:  https://github.com/DenisVargaeu/FluxPlayer (Star us!)
echo.
echo ▶️ To start the server, run: node server.js
echo 🌐 Then open http://localhost:7763 in your browser.
pause
