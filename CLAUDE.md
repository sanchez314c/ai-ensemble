# AI Ensemble - Claude Code Context

## Project Overview
Electron desktop app that queries multiple AI models in parallel and synthesizes their responses. Vanilla JS frontend, no framework.

## Architecture
- **Main process** (`src/main/main.js`): Electron app lifecycle, SQLite database (better-sqlite3), HTTP calls to 5 AI providers (Anthropic, OpenAI, DeepSeek, Google, Ollama), IPC handlers for all renderer requests
- **Preload** (`src/main/preload.js`): Context bridge exposing `window.api` with methods for querying, conversations, settings, export, and window controls
- **Renderer** (`src/renderer/`): Single-page app with `index.html` (sidebar + chat + modals), `app.js` (state management, DOM rendering, event handling), `main.css` (dark glassmorphism theme)

## Key Patterns
- IPC: `invoke`/`handle` for request-response, `send`/`on` for window controls
- Database: Synchronous better-sqlite3 with `conversations` and `messages` tables
- Settings: electron-store with defaults for API keys, model selections, synthesis config
- Provider functions: Each provider has a dedicated async function (`queryClaude`, `queryGPT`, etc.) registered in `providerMap`
- Synthesis: Takes successful responses, builds a meta-prompt, sends to the configured synthesis provider

## Build & Run
```bash
npm install
npm start          # production
npm run dev        # development (NODE_ENV=development)
npm run build      # electron-builder for Linux
npm run build:all  # Linux + Windows + Mac
```

## Database Schema
- `conversations`: id (TEXT PK), title, created_at, updated_at
- `messages`: id (TEXT PK), conversation_id (FK), role, content, model, is_synthesis, created_at

## Adding Providers
Add query function in main.js, register in providerMap, add UI toggle in index.html, add color in MODEL_COLORS in app.js, add settings fields.
