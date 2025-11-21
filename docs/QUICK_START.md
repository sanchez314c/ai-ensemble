# Quick Start

## 1. Install

```bash
git clone https://github.com/sanchez314c/ai-ensemble.git
cd ai-ensemble
npm install
```

## 2. Run

```bash
npm start
```

## 3. Configure API Keys

Click the gear icon in the bottom-left sidebar, or press `Ctrl+,`.

Enter at least one API key:

| Provider | Where to Get a Key |
|----------|--------------------|
| Anthropic (Claude) | [console.anthropic.com](https://console.anthropic.com/) |
| OpenAI (GPT) | [platform.openai.com](https://platform.openai.com/) |
| DeepSeek | [platform.deepseek.com](https://platform.deepseek.com/) |
| Google (Gemini) | [aistudio.google.com](https://aistudio.google.com/) |
| Ollama | No key needed, just install and run [ollama.com](https://ollama.com/) |

Click **Save Settings**.

## 4. Query

1. Toggle which models to use from the top bar (click to activate/deactivate)
2. Type your prompt in the text box at the bottom
3. Press **Enter** to send
4. View each model's response in color-coded cards
5. If "Synthesize" is enabled and 2+ models are active, a synthesized answer appears at the bottom

## 5. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `Ctrl+N` | New conversation |
| `Ctrl+E` | Export conversation |
| `Ctrl+,` | Open settings |
| `Ctrl+1-5` | Toggle model 1-5 |
| `Escape` | Close modal |

## What's Next

- Read [docs/INSTALLATION.md](INSTALLATION.md) for platform-specific setup details
- Read [docs/DEVELOPMENT.md](DEVELOPMENT.md) to add new providers or modify the UI
- Read [docs/ARCHITECTURE.md](ARCHITECTURE.md) for the full system design
