# Version Map

## Current Version

**1.0.0** (2026-03-08)

## Dependency Versions

| Package | Version | Purpose |
|---------|---------|---------|
| electron | ^33.3.1 | Desktop app runtime (Chromium + Node.js) |
| electron-builder | ^25.1.8 | Packaging for AppImage, deb, exe, dmg |
| axios | ^1.7.9 | HTTP client for all AI provider API calls |
| better-sqlite3 | ^11.7.0 | Local SQLite database for conversations/messages |
| electron-store | ^8.2.0 | JSON settings persistence in user data directory |
| marked | ^15.0.6 | Listed but unused (custom markdown parser used) |
| highlight.js | ^11.11.1 | Listed but unused (CSS-based code styling used) |
| uuid | ^11.0.5 | UUID v4 generation for conversation and message IDs |

## Node.js Compatibility

- Minimum: Node.js 18.x
- Recommended: Node.js 20.x or later
- npm 9.x or later

## Electron Version Details

- Electron 33.x ships with Chromium ~128 and Node.js ~20
- Uses `contextIsolation: true` and `nodeIntegration: false`
- Frameless window with custom title bar controls

## AI Provider API Versions

| Provider | API Version | Endpoint |
|----------|-------------|----------|
| Anthropic | 2023-06-01 | `https://api.anthropic.com/v1/messages` |
| OpenAI | v1 | `https://api.openai.com/v1/chat/completions` |
| DeepSeek | v1 | `https://api.deepseek.com/v1/chat/completions` |
| Google | v1beta | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` |
| Ollama | Local | `http://localhost:11434/api/chat` |

## Default Models

| Provider | Default Model |
|----------|---------------|
| Claude | claude-sonnet-4-5-20250929 |
| GPT | gpt-4o |
| DeepSeek | deepseek-reasoner |
| Gemini | gemini-2.5-flash |
| Ollama | llama3.2 |
