# Contributing to AI Ensemble

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start in development mode

## Project Layout

The app has three layers:

- **Main process** (`src/main/main.js`): Electron lifecycle, SQLite database, AI provider HTTP calls, IPC handlers
- **Preload** (`src/main/preload.js`): Context bridge that exposes `window.api` methods to the renderer
- **Renderer** (`src/renderer/`): HTML shell, vanilla JS app logic, CSS theme

## How to Add a New AI Provider

1. Add the provider's API call function in `main.js` (follow the pattern of `queryClaude`, `queryGPT`, etc.)
2. Register it in the `providerMap` object
3. Add default API key and model fields to the `electron-store` defaults
4. Add a model toggle button in `index.html` (with a unique `data-model` attribute and color)
5. Add the color entry in `MODEL_COLORS` in `app.js`
6. Add settings fields (API key input + model selector) in the settings modal HTML
7. Wire up `loadSettings` and `saveSettings` in `app.js` to read/write the new fields

## Code Style

- Vanilla JavaScript, no framework
- CSS organized by numbered sections (reset, layout, sidebar, top bar, etc.)
- IPC communication uses `invoke`/`handle` for request-response and `send`/`on` for fire-and-forget
- All database operations are synchronous (better-sqlite3)

## Pull Requests

- One feature or fix per PR
- Test with at least two providers enabled
- Include before/after screenshots for UI changes
- Update CHANGELOG.md with your changes

## Reporting Issues

Use the GitHub issue templates for bug reports and feature requests.
