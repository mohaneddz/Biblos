<h1 style="font-family: Arial, sans-serif; font-size: 36px; color: #4F46E5; display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #4F46E5; padding-bottom: 8px;">
  Biblos — Interactive Biodiversity Explorer
</h1>

Biblos is a Tauri desktop application for exploring species, ecosystems, taxonomy, and natural-history media. It combines curated local data with optional live species services and interactive visual tools.

---

## Tech Used

![Tauri](https://img.shields.io/badge/Tauri-24C8DB?style=for-the-badge&logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)

---

## Features

- Explore curated species, ecosystems, and the tree of life
- Species search, detailed profiles, classification tree, and comparison view
- Personal collections and folders
- Optional live data and media services, including GBIF, iNaturalist, Wikipedia, and YouTube
- AI Naturalist workspace and natural-language species tooling
- Rust index-seeding command for local data setup, bundled with a pre-seeded species database

---

## Screenshots

<img src="screenshots/home.avif" alt="Biblos species explorer home screen" width="88%"/>

**Home:** Search the species directory, access quick portal actions, and view daily animal highlights and recently explored records.

---

<img src="screenshots/species.avif" alt="Biblos species directory view" width="88%"/>

**Species:** Search and filter thousands of indexed species records using real-time taxonomy, habitat, diet, and conservation status filters.

---

<img src="screenshots/tree-of-life.avif" alt="Biblos tree of life view" width="88%"/>

**Tree of Life:** Navigate global biological classification and animal classes through an interactive hierarchical taxonomy tree.

---

<img src="screenshots/explorer.avif" alt="Biblos explorer view" width="88%"/>

**Explorer:** Discover Earth's wildlife across biomes, dietary patterns, activity rhythms, conservation tiers, and geographic regions.

---

<img src="screenshots/ecosystem.avif" alt="Biblos ecosystems view" width="88%"/>

**Ecosystems:** Browse global biomes and detailed habitat records alongside their representative species.

---

<img src="screenshots/chatbot.avif" alt="Biblos AI naturalist chatbot view" width="88%"/>

**AI Naturalist:** Consult an intelligent conversational AI assistant for natural-history insights and detailed species analysis.

---

<img src="screenshots/compare.avif" alt="Biblos species comparison view" width="88%"/>

**Compare:** Perform side-by-side comparative analysis of species physical traits, habitats, diets, and taxonomy.

---

<img src="screenshots/collection.avif" alt="Biblos collection and folders view" width="88%"/>

**Collection:** Organize starred favorites, bookmarked species records, and custom research folders.

---

<img src="screenshots/settings.avif" alt="Biblos settings view" width="88%"/>

**Settings:** Manage application caching, local storage, API keys, error logs, and user preferences.

---

## Project Structure

```text
src/
|-- assets/                 # Brand graphics
|-- components/             # Search, species, taxonomy, collection, and modal UI
|-- data/                   # Curated animals, discovery, ecosystems, tree-of-life data
|-- pages/                  # Explorer, species, ecosystems, compare, collection, settings
|-- services/               # Live data, media, cache, AI, and search services
|-- hooks/                  # Species-media hooks
|-- App.tsx                 # Main application and routes
`-- main.tsx                # React entry point

src-tauri/
|-- src/                    # Tauri backend and seed binary
|-- tauri.conf.json         # Desktop window and bundle configuration
`-- Cargo.toml              # Rust dependencies
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Rust toolchain
- Tauri system dependencies for your operating system

### Install and run

```bash
pnpm install
pnpm tauri dev
```

For frontend-only development:

```bash
pnpm dev
```

The Vite server is configured for `http://localhost:8668`.

---

## Available Scripts

```bash
pnpm dev           # Start Vite
pnpm build         # Type-check and build frontend assets
pnpm preview       # Preview the production frontend build
pnpm tauri dev     # Run the desktop app
pnpm tauri build   # Build the production desktop bundle
pnpm seed:index    # Run the Biblos Rust index seeder
```

---

## Exploration Modes

- **Species:** Search the directory and open detailed species records.
- **Explorer:** Browse discovery data and filter the natural world by topic.
- **Tree of Life:** Follow classification relationships from broad groups to individual species.
- **Ecosystems:** Explore ecosystem records and their species context.
- **Compare:** Place species side by side for a focused comparison.
- **Collection:** Save records into personal folders.

---

## Data and Media Notes

- Curated data is bundled under `src/data` so the core experience is immediately explorable.
- Service modules provide optional live species, taxonomy, media, and video enrichment.
- The app includes caching, error reporting, confirmation, and toast services to support long-running exploration workflows.
- Some advanced features, such as 3D viewing and AI Naturalist tools, rely on their respective frontend service modules and available external providers.
