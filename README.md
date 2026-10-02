# Faith Builder
Faith Builder is a high-performance, cross-platform Bible study suite designed for speed and local data ownership. It features a PocketBase SQLite backend containing over 31,000 verses, a Go-based terminal user interface (TUI) for distraction-free study, a React web frontend, and an automated Markdown ingestion pipeline for syncing local study notes.
## 🚀 Features
    Lightning-Fast Go TUI: Built with Charm's Bubble Tea, offering keyboard-driven navigation, local authentication persistence, and instantaneous scripture search.
    Live NLT API Integration: Query the NLT API directly from the terminal (using the nlt  prefix) with automatic HTML stripping and entity parsing.
    Markdown Note Ingestion: A Node.js script that recursively scans local directories, parses YAML frontmatter (titles, tags, and related verses), and immediately syncs notes to the database.
    Smart Cross-Referencing: Instantly view related verses or user-generated study materials attached to specific scriptures.
    Automated Build Pipeline: A local Bash script that automatically pulls the latest Git tag, cross-compiles binaries for Linux/Windows/macOS, injects version strings, and applies UPX compression.
    React Web App: A Vite + React + Tailwind frontend for rich dashboard management.

## 🛠 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [Go](https://go.dev/) + [Bubble Tea](https://github.com/charmbracelet/bubbletea) | A modular, state-driven terminal interface. |
| **Styling** | [Lipgloss](https://github.com/charmbracelet/lipgloss) | Terminal styling, layouts, and colors. |
| **Backend** | [PocketBase](https://pocketbase.io/) | Self-hosted backend powered by embedded SQLite. |

---

## 📂 Project Structure

Faith Builder is organized into a modular architecture to separate UI rendering, API calls, and data ingestion.

    faith-builder/
    ├── main.go                 # Entry point and Bubble Tea model initialization
    ├── models.go               # Struct definitions (Material, Verse, PbListResult)
    ├── api.go                  # HTTP client functions communicating with PocketBase
    ├── styles.go               # Global Lipgloss styles and color definitions
    ├── ui_reader.go            # UI component for reading materials
    ├── ui_linker.go            # UI component for searching and linking verses
    ├── scripts/                # Data ingestion and database utility scripts
    │   ├── verses.json         # Source verse payload
    │   ├── cross_references.csv# Raw OpenBible cross-reference data
    │   ├── seed.go             # Basic verse JSON importer
    │   ├── backfill_keys.go    # Generates verse_keys (e.g., GEN.1.1) from relations
    │   └── import_xrefs.go     # High-concurrency CSV worker pool for cross-references
    ├── Faith_Builder-backend/  # PocketBase instance
    │   ├── pocketbase          # PocketBase executable
    │   └── pb_data/            # SQLite database (Git ignored to prevent bloat)
    └── go.mod / go.sum         # Go module dependencies

## ⌨️ TUI Keybindings
The terminal client is designed to keep your hands on the keyboard.
    Key     Action      Context 
    Tab     Switch      focus / toggle inputs
    Global  Enter     Search / Read / 
    SelectGlobal m
    View saved Study MaterialsSearch List   b
    View saved Bookmarks
    Search List x
    View Cross-ReferencesSelected 
    Verse Ctrl+B Bookmark selected verse Selected Verse Ctrl+S Save a new study material
    Editor Mode Esc / Ctrl+C 
    Go back / Quit

## Global⚙️ Getting Started
1. Start the PocketBase BackendEnsure you have PocketBase downloaded and your database initialized with your collections (verses, materials, bookmarks, cross_references).
2. Bash    
     cd pocketbase
     ./pocketbase serve
     # API runs locally at [http://127.0.0.1:8090](http://127.0.0.1:8090).    
2. Compile the TUI
3.     The build script automatically detects the latest Git tag and packages the binaries into the build/ directory.(Requires Go and UPX installed on your system).Bashcd faith-builder-tui
chmod +x build.sh
./build.sh
Run the compiled binary for your system:Bash./build/fb-linux-amd64
4. Sync Markdown NotesTo sync your local markdown files, ensure they contain YAML frontmatter like this:YAML---
title: Romans 8 Study
tags: [paul, grace, spirit]
verses: ["Romans 8:1", "Romans 8:28"]
---
Install the parser and run the script:Bashcd notes
npm install gray-matter
node ingest-md.js
4. Run the Web Dashboard
# Bash
cd faith-builder-web
npm install
npm run dev

## 📦 Importing Data
Faith Builder relies on a highly normalized relational schema. To populate your database from scratch and ingest massive datasets (like the 350,000+ cross-references from OpenBible), run the utility scripts in the scripts/ directory in this exact order:
Step 1: Import Verses
Import your base Bible verses into PocketBase using a JSON file payload.
Bash
    cd scripts
    go run seed.go

Step 2: Backfill Verse Keys
To enable instantaneous TUI search, verses use a compiled verse_key text field (e.g., GEN.1.1). Run the backfill script to generate these keys automatically from the books abbreviation relation.
Bash
    go run backfill_keys.go

Step 3: Import Cross-References
Once verse_key strings are populated, you can import the OpenBible CSV. This script caches the database relations in memory and uses a 50-worker pool to ingest hundreds of records per second.
Bash
    go run import_xrefs.go

🚢 Deployment Roadmap
Phase 1 (Complete): Local SQLite DB, local TUI cross-compilation, local web dashboard.
Phase 2 (Next): Deploy PocketBase to a live Linux VPS via systemd to allow remote access.
Phase 3: Deploy the React frontend to Vercel/Netlify.

cat << 'EOF' > README.md
