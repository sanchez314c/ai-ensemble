# Architecture

## Overview

AI Ensemble is an Electron desktop app with a three-layer architecture: main process, preload bridge, and renderer process. There is no build step for the application code itself; Electron loads the source files directly.

## Process Model

```
┌─────────────────────────────────────────────┐
│                  Electron                    │
│                                             │
│  ┌──────────────────┐  IPC  ┌────────────┐ │
│  │   Main Process   │◄────►│  Renderer   │ │
│  │   (main.js)      │       │  (app.js)   │ │
│  │                  │       │             │ │
│  │  - SQLite DB     │       │  - DOM/UI   │ │
│  │  - HTTP clients  │       │  - State    │ │
│  │  - electron-store│       │  - Events   │ │
│  │  - Window mgmt   │       │             │ │
│  └──────────────────┘       └────────────┘ │
│           │                      ▲         │
│           │    ┌──────────┐      │         │
│           └───►│ Preload  │──────┘         │
│                │(preload.js)               │
│                │ contextBridge              │
│                └──────────┘                │
└─────────────────────────────────────────────┘
```

## Main Process (`src/main/main.js`)

Handles everything that needs Node.js access:

- **Database**: Initializes a SQLite database in Electron's `userData` directory with two tables: `conversations` and `messages`. All queries are synchronous via better-sqlite3.
- **AI Providers**: Five async functions (`queryClaude`, `queryGPT`, `queryDeepSeek`, `queryGemini`, `queryOllama`) each make HTTP requests to their respective APIs via axios. All registered in a `providerMap` object for dynamic dispatch.
- **Synthesis**: The `synthesizeResponses` function collects successful model responses, builds a meta-prompt asking the synthesis provider to analyze and merge them, then calls the chosen provider.
- **IPC Handlers**: 8 handlers exposed via `ipcMain.handle`:
  - `query-models`: Parallel query execution + optional synthesis
  - `get-conversations`, `get-conversation`, `create-conversation`, `delete-conversation`
  - `get-settings`, `save-settings`
  - `export-conversation` (Markdown or JSON format)
- **Window Controls**: 3 `ipcMain.on` listeners for minimize/maximize/close

## Preload (`src/main/preload.js`)

Uses `contextBridge.exposeInMainWorld` to create a `window.api` object with methods that map to IPC calls. This is the only communication channel between main and renderer.

Exposed methods: `queryModels`, `getConversations`, `getConversation`, `createConversation`, `deleteConversation`, `getSettings`, `saveSettings`, `exportConversation`, `windowMinimize`, `windowMaximize`, `windowClose`, `onStreamChunk`, `removeStreamListeners`.

## Renderer (`src/renderer/`)

Single-page app with no framework:

- **State**: A plain object tracks `currentConversationId`, `activeModels` (Set), `synthesizeEnabled`, `isLoading`, `conversations`, `reasonMode`, and `recognition` (voice).
- **DOM**: Elements are cached on init. Event listeners are attached in `setupListeners()`.
- **Message Rendering**: Four render functions (`renderUserMessage`, `renderAIResponse`, `renderSynthesis`, `renderErrorMessage`) create DOM elements directly.
- **Markdown Parser**: Custom regex-based parser handles code blocks, inline code, bold, italic, links, headers, tables, lists, blockquotes, and paragraphs.
- **Settings**: Read from and written to electron-store via IPC. Settings modal has fields for all 5 provider API keys, model selectors, and synthesis provider.

## Data Flow: Query Lifecycle

1. User types prompt and hits Enter
2. Renderer creates conversation (if new) via IPC
3. Renderer calls `queryModels` IPC with prompt, active model list, conversation ID, and synthesis flag
4. Main process builds message history from DB, appends new user message
5. Main process fires `Promise.allSettled` across all selected providers
6. If synthesis enabled and 2+ models active, main process calls `synthesizeResponses`
7. All messages (user, responses, synthesis) are saved to SQLite
8. Results returned to renderer, which renders each response card with model-specific styling

## Database Schema

```sql
conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)

messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  role TEXT NOT NULL,         -- 'user' or 'assistant'
  content TEXT NOT NULL,
  model TEXT,                 -- provider name (claude, gpt, etc.)
  is_synthesis INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
)
```

## Security Model

- `nodeIntegration: false`, `contextIsolation: true`
- CSP restricts scripts to `'self'`, connections to `*` (needed for multiple API endpoints)
- API keys stored locally via electron-store, never exposed to renderer
- All database queries use parameterized statements
