# AI Ensemble

Multi-model AI query engine with collaborative synthesis. Send a single prompt to Claude, GPT-4o, DeepSeek, Gemini, and Ollama simultaneously, then get a synthesized response that combines the best insights from all models.

Built as an Electron desktop app with a dark glassmorphism UI, local SQLite conversation storage, and per-model API key management.

## What It Does

- **Parallel Querying**: Send one prompt to 2-5 AI models at the same time. Toggle which models are active per query.
- **Response Synthesis**: A configurable synthesis provider (default: Claude) reads all model responses, identifies agreements and contradictions, and produces a merged answer.
- **Conversation History**: Conversations persist in a local SQLite database. Search, resume, or delete past conversations from the sidebar.
- **Export**: Export any conversation as Markdown or JSON.
- **Voice Input**: Browser-native speech recognition for hands-free prompting.
- **Reason Mode**: Prepends "Think step by step" to prompts for deeper analysis.
- **Frameless Window**: Custom title bar with minimize/maximize/close controls.

## Supported Providers

| Provider | API | Default Model |
|----------|-----|---------------|
| Anthropic | Messages API v1 | claude-sonnet-4-5-20250929 |
| OpenAI | Chat Completions | gpt-4o |
| DeepSeek | Chat Completions | deepseek-reasoner |
| Google | Generative Language API | gemini-2.5-flash |
| Ollama | Local REST API | llama3.2 |

## Quick Start

```bash
npm install
npm start
```

Open Settings (gear icon in sidebar) and add your API keys. Select which models to query from the top bar, type a prompt, and hit Enter.

## Tech Stack

- **Runtime**: Electron 33.x (Node.js main process + Chromium renderer)
- **Database**: better-sqlite3 for conversation/message persistence
- **Settings**: electron-store (JSON file in user data directory)
- **HTTP Client**: axios for all provider API calls
- **Rendering**: Vanilla JS with custom markdown parser, Inter + JetBrains Mono fonts
- **Styling**: Hand-written CSS with glassmorphism design system

## Project Structure

```
ai-ensemble/
  package.json
  src/
    main/
      main.js          # Electron main process, DB init, AI provider functions, IPC handlers
      preload.js        # Context bridge exposing API to renderer
    renderer/
      index.html        # App shell with sidebar, chat area, settings/export modals
      scripts/app.js    # Renderer logic: state management, message rendering, settings UI
      styles/main.css   # Full dark theme stylesheet (~1600 lines)
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line in input |
| `Ctrl+N` | New conversation |
| `Ctrl+E` | Export conversation |
| `Ctrl+,` | Open settings |
| `Ctrl+1-5` | Toggle model 1-5 |
| `Escape` | Close modal |

## Author

**J. Michaels** - [github.com/sanchez314c](https://github.com/sanchez314c)

## License

MIT - see [LICENSE](LICENSE) for details.
