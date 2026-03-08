# Development Guide

## Running in Development

```bash
npm run dev
```

This sets `NODE_ENV=development` and launches Electron. Open DevTools with `Ctrl+Shift+I` to debug the renderer process. Main process logs go to the terminal.

## Project Structure

```
src/
  main/
    main.js       # Main process: DB, providers, IPC handlers
    preload.js    # Context bridge (window.api)
  renderer/
    index.html    # App shell
    scripts/
      app.js      # Renderer logic
    styles/
      main.css    # Theme stylesheet
```

## How the Code is Organized

### Main Process (main.js)

The file is structured top-to-bottom as:
1. Imports and initialization (electron-store with defaults)
2. `initializeDatabase()` - SQLite schema creation
3. `createWindow()` - BrowserWindow setup (frameless, transparent)
4. Window control IPC listeners (minimize/maximize/close)
5. App lifecycle (`whenReady`, `window-all-closed`)
6. AI provider functions (one per provider)
7. `providerMap` and `queryModel` wrapper
8. `synthesizeResponses` - multi-model synthesis logic
9. Database helper functions (`getConversationMessages`, `saveMessage`)
10. IPC handlers for all renderer operations

### Renderer (app.js)

Wrapped in an IIFE with `'use strict'`. Structured as:
1. `MODEL_COLORS` constant (name, color, background per provider)
2. `state` object (current conversation, active models, loading flag, etc.)
3. `init()` -> `cacheElements()` -> `setupListeners()` -> `loadSettings()` -> `loadConversations()`
4. Modal helpers, model toggle handlers
5. Voice input (Web Speech API)
6. `handleSend()` - main query flow
7. Message rendering functions (user, AI, synthesis, error)
8. Custom markdown parser (`parseMarkdown`)
9. Conversation management (load, select, new, delete, search)
10. Settings load/save
11. Export handler

## Adding a New AI Provider

1. **main.js**: Write an async function following this pattern:
```javascript
async function queryNewProvider(messages, settings) {
  const apiKey = settings.apiKeys.newprovider;
  if (!apiKey) throw new Error('New Provider API key not configured');
  const response = await axios.post('https://api.newprovider.com/v1/chat', {
    model: settings.models.newprovider,
    messages: messages
  }, {
    headers: { 'Authorization': `Bearer ${apiKey}`, 'content-type': 'application/json' },
    timeout: 60000
  });
  return response.data.choices[0].message.content;
}
```

2. **main.js**: Add to `providerMap`:
```javascript
const providerMap = {
  // ... existing providers
  newprovider: queryNewProvider
};
```

3. **main.js**: Add defaults to electron-store:
```javascript
apiKeys: { /* ... */ newprovider: '' },
models: { /* ... */ newprovider: 'default-model-name' }
```

4. **index.html**: Add model toggle in `.model-selector`:
```html
<div class="model-toggle" data-model="newprovider">
  <div class="model-dot" style="background: #COLOR"></div>
  <span>Provider Name</span>
</div>
```

5. **app.js**: Add to `MODEL_COLORS`:
```javascript
newprovider: { name: 'Provider Name', color: '#COLOR', bg: 'rgba(R,G,B,0.15)' }
```

6. **index.html**: Add settings fields in the settings modal for API key and model selector.

7. **app.js**: Add `setVal`/`getVal` calls in `loadSettings` and `saveSettings`.

## CSS Organization

The stylesheet uses numbered section comments:
1. Reset & Base
2. App Layout
3. Sidebar
4. Top Bar
5. Chat Area
6. Welcome Screen
7. Messages
8. Loading States
9. Input Area
10. Modal
11. Buttons
13. Animations
15. Responsive

## Dependencies

| Package | Purpose |
|---------|---------|
| electron | Desktop app runtime |
| electron-builder | Packaging (AppImage, deb, etc.) |
| axios | HTTP client for provider APIs |
| better-sqlite3 | Local SQLite database |
| electron-store | JSON settings persistence |
| marked | Listed but unused (custom parser used instead) |
| highlight.js | Listed but unused (custom code block styling in CSS) |
| uuid | UUID generation for conversation and message IDs |

## Database

The SQLite database is at `{userData}/ensemble.db`. Two tables:
- `conversations` (id, title, created_at, updated_at)
- `messages` (id, conversation_id, role, content, model, is_synthesis, created_at)

All operations are synchronous. The database is initialized on app startup.
