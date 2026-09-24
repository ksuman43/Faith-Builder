Faith BuilderFaith Builder is a high-performance, cross-platform Bible study suite designed for speed and local data ownership. It features a PocketBase SQLite backend containing over 31,000 verses, a Go-based terminal user interface (TUI) for distraction-free study, a React web frontend, and an automated Markdown ingestion pipeline for syncing local study notes.🚀 FeaturesLightning-Fast Go TUI: Built with Charm's Bubble Tea, offering keyboard-driven navigation, local authentication persistence, and instantaneous scripture search.Live NLT API Integration: Query the NLT API directly from the terminal (using the nlt  prefix) with automatic HTML stripping and entity parsing.Markdown Note Ingestion: A Node.js script that recursively scans local directories, parses YAML frontmatter (titles, tags, and related verses), and idempotently syncs notes to the database.Smart Cross-Referencing: Instantly view related verses or user-generated study materials attached to specific scriptures.Automated Build Pipeline: A local Bash script that automatically pulls the latest Git tag, cross-compiles binaries for Linux/Windows/macOS, injects version strings, and applies UPX compression.React Web App: A Vite + React + Tailwind frontend for rich dashboard management.🛠 Tech StackBackend: PocketBase (SQLite, Go)CLI/TUI Client: Go, Bubble Tea, Lipgloss, BubblesWeb Client: React, Vite, Tailwind CSSIngestion Script: Node.js, gray-matterBuild Tools: Bash, Git, UPX📂 Project StructurePlaintextfaith-builder/
├── pocketbase/             # PocketBase executable and pb_data (SQLite database)
├── faith-builder-tui/      # Go Bubble Tea terminal application
│   ├── main.go             # TUI source code
│   └── build.sh            # Cross-compilation and UPX compression script
├── faith-builder-web/      # Vite + React web application
└── notes/                  # Local directory for Markdown study notes
    └── ingest-md.js        # Node.js sync script
⌨️ TUI KeybindingsThe terminal client is designed to keep your hands on the keyboard.KeyActionContextTabSwitch focus / toggle inputsGlobalEnterSearch / Read / SelectGlobalmView saved Study MaterialsSearch ListbView saved BookmarksSearch ListxView Cross-ReferencesSelected VerseCtrl+BBookmark selected verseSelected VerseCtrl+SSave a new study materialEditor ModeEsc / Ctrl+CGo back / QuitGlobal⚙️ Getting Started1. Start the PocketBase BackendEnsure you have PocketBase downloaded and your database initialized with your collections (verses, materials, bookmarks, cross_references).Bashcd pocketbase
./pocketbase serve
API runs locally at [http://127.0.0.1:8090](http://127.0.0.1:8090).2. Compile the TUIThe build script automatically detects the latest Git tag and packages the binaries into the build/ directory.(Requires Go and UPX installed on your system).Bashcd faith-builder-tui
chmod +x build.sh
./build.sh
Run the compiled binary for your system:Bash./build/fb-linux-amd64
3. Sync Markdown NotesTo sync your local markdown files, ensure they contain YAML frontmatter like this:YAML---
title: Romans 8 Study
tags: [paul, grace, spirit]
verses: ["Romans 8:1", "Romans 8:28"]
---
Install the parser and run the script:Bashcd notes
npm install gray-matter
node ingest-md.js
4. Run the Web DashboardBashcd faith-builder-web
npm install
npm run dev
🚢 Deployment RoadmapPhase 1 (Complete): Local SQLite DB, local TUI cross-compilation, local web dashboard.Phase 2 (Next): Deploy PocketBase to a live Linux VPS via systemd to allow remote access.Phase 3: Deploy the React frontend to Vercel/Netlify.