#!/bin/bash

echo "🏗️ Building Faith Builder Full Package..."

# 1. Safety check: Ensure PocketBase is not running
if pgrep -x "pocketbase" > /dev/null
then
    echo "🚨 ERROR: PocketBase is currently running!"
    echo "Please stop the server (Ctrl+C) before building to prevent database corruption."
    exit 1
fi

# 2. Create clean release directory structure
rm -rf release
mkdir -p release/Faith_Builder-backend
mkdir -p release/Faith_Builder-tui
mkdir -p release/Faith_Builder-web

# 3. Package the Backend
echo "Copying Backend & Database..."
rsync -av Faith_Builder-backend/ release/Faith_Builder-backend/

# 4. Package the TUI
echo "Compiling and copying TUI..."
# Build the binary directly into the release folder
cd Faith_Builder-tui
go build -o ../release/Faith_Builder-tui/faith-builder .
cd ..
# Sync the TUI source files (excluding any local binaries)
rsync -av Faith_Builder-tui/ release/Faith_Builder-tui/ --exclude 'faith-builder'

# 5. Package the Web Directory
echo "Copying Web directory..."
# Excluding node_modules and build caches prevents massive archive bloat
rsync -av Faith_Builder-web/ release/Faith_Builder-web/ --exclude 'node_modules' --exclude '.next' --exclude 'dist'

# 6. Compress into a deployable archive
echo "Zipping package..."
tar -czvf faith-builder-full-release.tar.gz -C release .

echo "✅ Build complete! Archive saved as faith-builder-full-release.tar.gz"