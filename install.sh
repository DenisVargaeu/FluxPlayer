#!/bin/bash

# DexPlayer One-Liner Installer
echo "🚀 Starting DexPlayer Installation..."

# 0. Pre-checks for basic tools
echo "🔍 Checking for essential tools..."
for tool in curl git; do
    if ! command -v $tool &> /dev/null; then
        echo "⚠️  $tool is not installed. Attempting to install..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update && sudo apt-get install -y $tool
        else
            echo "❌ $tool is required but not found. Please install it manually."
            exit 1
        fi
    fi
done

# 1. Check/Get Project Files
if [ ! -f "server.js" ]; then
    echo "📂 Project files not found. Attempting to download..."
    # In a real scenario, this would be: git clone https://github.com/user/dexplayer.git .
    # For now, we assume the user might be running this script in a fresh folder.
    if command -v git &> /dev/null; then
        echo "🌐 Cloning repository..."
        git clone https://github.com/DenisVargaeu/FluxPlayer.git .
    else
        echo "❌ Git not found. Please download the project files manually or install git."
        exit 1
    fi
fi

# 2. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Node.js not found. Installing via nodesource (Linux)..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "❌ Please install Node.js manually: https://nodejs.org/"
        exit 1
    fi
fi

# 3. Determine OS and install system dependencies
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📦 Detected Linux/RPi. Installing system dependencies (mpv, ffmpeg)..."
    sudo apt-get update
    sudo apt-get install -y mpv ffmpeg
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📦 Detected macOS. Installing dependencies via Homebrew..."
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Please install it first."
    else
        brew install mpv ffmpeg
    fi
fi

# 4. Install npm dependencies
echo "📦 Installing npm dependencies (this may take a minute)..."
npm install --no-audit --no-fund

# 5. Final Setup
mkdir -p music
echo "✅ Installation complete!"
echo "▶️  To start the server, run: node server.js"
echo "🌐 Then open http://localhost:7763 in your browser."
