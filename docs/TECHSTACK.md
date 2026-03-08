# Tech Stack

## Runtime

| Component | Technology | Version |
|-----------|-----------|---------|
| Desktop Framework | Electron | ^33.3.1 |
| JavaScript Runtime | Node.js | 18+ (bundled with Electron) |
| Browser Engine | Chromium | ~128 (bundled with Electron) |

## Application Code

| Layer | Language | Framework |
|-------|----------|-----------|
| Main Process | JavaScript (CommonJS) | None (vanilla Node.js + Electron APIs) |
| Preload | JavaScript (CommonJS) | Electron contextBridge |
| Renderer | JavaScript (IIFE, strict mode) | None (vanilla DOM manipulation) |
| Markup | HTML5 | No templating engine |
| Styling | CSS3 | Hand-written, no preprocessor |

## Dependencies

### Production

| Package | Version | Role |
|---------|---------|------|
| axios | ^1.7.9 | HTTP client for all AI provider API calls |
| better-sqlite3 | ^11.7.0 | SQLite database for conversation/message persistence |
| electron-store | ^8.2.0 | JSON-based settings persistence in user data directory |
| marked | ^15.0.6 | Markdown parser (listed but unused; custom parser used instead) |
| highlight.js | ^11.11.1 | Syntax highlighting (listed but unused; CSS-based styling used) |
| uuid | ^11.0.5 | UUID v4 generation for conversation and message IDs |

### Development

| Package | Version | Role |
|---------|---------|------|
| electron | ^33.3.1 | Desktop app runtime |
| electron-builder | ^25.1.8 | Packaging (AppImage, deb, exe, dmg) |

## AI Providers

| Provider | Protocol | Auth Method |
|----------|----------|-------------|
| Anthropic (Claude) | REST / Messages API | `x-api-key` header |
| OpenAI (GPT) | REST / Chat Completions | Bearer token |
| DeepSeek | REST / Chat Completions | Bearer token |
| Google (Gemini) | REST / Generative Language API | API key in query string |
| Ollama | REST / Local API | None (local only) |

## Data Storage

| Data | Technology | Location |
|------|-----------|----------|
| Conversations & Messages | SQLite via better-sqlite3 | `{userData}/ensemble.db` |
| Settings & API Keys | JSON via electron-store | `{userData}/config.json` |

## UI Design

| Aspect | Implementation |
|--------|---------------|
| Design System | Dark glassmorphism ("OpenCode GLM 5") |
| Primary Font | Inter (Google Fonts CDN) |
| Monospace Font | JetBrains Mono (Google Fonts CDN) |
| Color Palette | Purple (#6C63FF), Teal (#00D4AA), Pink (#FF6B9D), Amber (#FFAA33), Cyan (#33DDFF) |
| Window Chrome | Frameless with custom title bar controls |
| CSS Architecture | Single file (~1600 lines), organized by numbered section comments |
| Responsive | Media queries at 900px and 600px breakpoints |

## Build & Package

| Tool | Output |
|------|--------|
| electron-builder | AppImage, .deb (Linux); configurable for Windows/macOS |
| No bundler | Source files loaded directly by Electron |
| No TypeScript | Plain JavaScript throughout |
| No test framework | Manual testing only |
