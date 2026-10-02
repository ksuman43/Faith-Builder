# Faith Builder Installation Guide

This guide covers how to extract and run the Faith Builder release archive (`faith-builder-full-release.tar.gz`). 

## ⚙️ Prerequisites

Because the Backend (PocketBase) and TUI are pre-compiled binaries, they run natively without any extra dependencies. However, the Web frontend requires a JavaScript runtime to install its packages and serve the UI.

* **Node.js** (v18 or higher) and **npm**: Required to run the web frontend.
* **Linux/macOS Terminal**: For executing the binaries and bash commands.

---

## 🚀 Installation & Setup

### 1. Extract the Archive
Move the `faith-builder-full-release.tar.gz` file to your desired installation folder and extract it:
```bash
tar -xzvf faith-builder-full-release.tar.gz
cd release

### 2. Start the Backend (PocketBase)
# The backend must be running first so the TUI and Web apps can connect to the database.
    cd Faith_Builder-backend
    ./pocketbase serve
# Leave this terminal window open. The backend runs locally on http://127.0.0.1:8090.

### 3. Start the Web Frontend
# Open a second terminal window. The release archive excludes the heavy node_modules folder, so you must install the dependencies before starting the development server.
    cd release/Faith_Builder-web

# Install dependencies
    npm install

# Approve and rebuild esbuild (required for Vite)
    npm install-scripts approve esbuild
    npm rebuild esbuild

# Start the frontend
    npm run dev

# Leave this terminal window open. Access the web app in your browser at http://localhost:5173.

### 4. Launch the Terminal UI (TUI)
# Open a third terminal window. The Go application is already compiled into an executable binary, so you can run it instantly.
    cd release/Faith_Builder-tui
    ./faith-builder