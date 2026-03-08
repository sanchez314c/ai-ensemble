# Workflow

## User Workflow

### Basic Query

1. Launch the app (`npm start` or run the AppImage)
2. Toggle which AI models to query from the top bar (at least one must be active)
3. Type a prompt in the text input at the bottom
4. Press Enter or click the send button
5. Wait for responses from each model (loading indicators show per-model status)
6. Read individual model responses (color-coded cards with model badges)
7. If synthesis is enabled and 2+ models were active, read the synthesized response at the bottom

### Conversation Management

- **New conversation**: Click the `+` button in the sidebar header, or press `Ctrl+N`
- **Switch conversation**: Click any conversation in the sidebar list
- **Search conversations**: Type in the search box at the top of the sidebar
- **Delete conversation**: Hover over a conversation item and click the X button
- **Export conversation**: Click the download icon in the top bar, choose Markdown or JSON

### Settings

Open Settings via the gear icon in the sidebar footer, or press `Ctrl+,`.

- Enter API keys for each provider you want to use
- Select which model variant to use per provider
- Choose the synthesis provider (Claude, GPT-4o, or Gemini)

Settings persist between sessions via electron-store.

## Development Workflow

### Running Locally

```bash
npm install        # First time only
npm run dev        # Development mode with NODE_ENV=development
```

Use `Ctrl+Shift+I` to open DevTools in the renderer. Main process logs appear in the terminal.

### Making Changes

1. Edit source files in `src/`
2. Restart the app to see changes (no hot reload)
3. For CSS-only changes, `Ctrl+Shift+I` > Elements panel shows live DOM

### Adding a Provider

See `docs/DEVELOPMENT.md` for the full 7-step process. Summary:
1. Add query function in `main.js`
2. Register in `providerMap`
3. Add electron-store defaults
4. Add UI toggle in `index.html`
5. Add color in `MODEL_COLORS` in `app.js`
6. Add settings fields in the modal
7. Wire up load/save in `app.js`

### Building for Distribution

```bash
npm run build       # Linux (AppImage + .deb)
npm run build:all   # All platforms
```

Output goes to `dist/`.

## Data Flow

```
User Input
    |
    v
Renderer (app.js)
    |-- Creates conversation (if new) via IPC
    |-- Calls queryModels IPC
    |
    v
Main Process (main.js)
    |-- Loads message history from SQLite
    |-- Appends new user message
    |-- Promise.allSettled across selected providers
    |-- Each provider: HTTP POST to external API
    |-- If synthesis: synthesizeResponses()
    |-- Saves all messages to SQLite
    |-- Returns results
    |
    v
Renderer (app.js)
    |-- Renders user message card
    |-- Renders per-model response cards
    |-- Renders synthesis card (if present)
    |-- Updates conversation list in sidebar
```
