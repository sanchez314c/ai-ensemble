# Installation

## Prerequisites

- **Node.js** 18.x or later
- **npm** 9.x or later
- API keys for at least one provider (Anthropic, OpenAI, DeepSeek, or Google), or a running Ollama instance

## Install from Source

```bash
git clone https://github.com/sanchez314c/ai-ensemble.git
cd ai-ensemble
npm install
```

### Linux Note

Electron on Linux may require the unprivileged user namespace clone sysctl. The app attempts to set this automatically on startup, but if it fails you can run:

```bash
sudo sysctl -w kernel.unprivileged_userns_clone=1
```

Or launch with the `--no-sandbox` flag.

## Run

```bash
# Production mode
npm start

# Development mode (enables DevTools)
npm run dev
```

## Build Distributable

```bash
# Linux only (AppImage + .deb)
npm run build

# All platforms
npm run build:all
```

Output goes to the `dist/` directory.

## Configuration

On first launch, click the gear icon in the sidebar to open Settings. Add your API keys:

| Provider | Key Format | Where to Get It |
|----------|-----------|-----------------|
| Anthropic (Claude) | `sk-ant-...` | [console.anthropic.com](https://console.anthropic.com/) |
| OpenAI (GPT) | `sk-...` | [platform.openai.com](https://platform.openai.com/) |
| DeepSeek | `sk-...` | [platform.deepseek.com](https://platform.deepseek.com/) |
| Google (Gemini) | `AIza...` | [aistudio.google.com](https://aistudio.google.com/) |
| Ollama | No key needed | [ollama.com](https://ollama.com/) - runs locally |

Settings are stored in your OS user data directory via electron-store.

## Data Storage

- **Settings**: `~/.config/ai-ensemble/config.json` (Linux), `~/Library/Application Support/ai-ensemble/config.json` (macOS), `%APPDATA%/ai-ensemble/config.json` (Windows)
- **Database**: `ensemble.db` in the same directory as settings
