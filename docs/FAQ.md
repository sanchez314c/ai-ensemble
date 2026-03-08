# FAQ

## General

### What is AI Ensemble?

A desktop app that sends your prompt to multiple AI models at the same time (Claude, GPT-4o, DeepSeek, Gemini, Ollama), shows you each response side by side, and optionally produces a synthesized answer that combines the best parts of all responses.

### Do I need API keys for all providers?

No. You need at least one. Toggle which models are active from the top bar before sending a query. Models without configured API keys will return an error if selected.

### Where are my API keys stored?

Locally on your machine in the Electron user data directory (`~/.config/ai-ensemble/config.json` on Linux). Keys are never sent anywhere except the respective provider's API endpoint.

### Is there a cost to using this?

The app itself is free. Each AI provider charges per their own API pricing. Ollama is free and runs locally.

## Setup

### Why does `npm install` fail on better-sqlite3?

`better-sqlite3` compiles native C++ code. You need build tools installed:

```bash
# Ubuntu/Debian
sudo apt-get install build-essential python3

# macOS
xcode-select --install
```

### The app crashes on Linux with "credentials.cc: Permission denied"

Run this once:
```bash
sudo sysctl -w kernel.unprivileged_userns_clone=1
```

Or launch Electron with `--no-sandbox`. The app tries to set this automatically on startup.

### How do I use Ollama?

Install Ollama from [ollama.com](https://ollama.com/), pull a model (`ollama pull llama3.2`), and make sure it's running. The app connects to `http://localhost:11434` by default. You can change this URL in Settings.

## Usage

### What does "Synthesize" do?

When enabled and two or more models are active, the app takes all successful responses, sends them to a synthesis provider (default: Claude), and asks it to analyze agreements, resolve contradictions, and produce a merged answer. The synthesis appears as a gradient-bordered card below the individual responses.

### What does "Reason" mode do?

It prepends "Think step by step. " to your prompt before sending it to the models. This tends to produce more detailed, structured responses.

### Can I use voice input?

Yes. Click the microphone button next to the text input. It uses the browser's built-in Web Speech API (Chromium's implementation in Electron). Requires a working microphone.

### How do I export a conversation?

Click the download icon in the top-right corner while a conversation is active. Choose Markdown (.md) or JSON (.json). The file downloads to your default downloads directory.

### Can I change which model does the synthesis?

Yes. Open Settings and change the "Synthesis Provider" dropdown. Options are Claude, GPT-4o, or Gemini.

## Technical

### Why are `marked` and `highlight.js` in package.json but not used?

They were included during initial setup but the app uses a custom regex-based markdown parser and CSS-based code styling instead. They can be safely removed from dependencies if desired.

### Where is the database?

SQLite file at `{userData}/ensemble.db`. Contains two tables: `conversations` and `messages`. You can inspect it with any SQLite browser.

### Does the app support streaming responses?

The preload script has `onStreamChunk` and `removeStreamListeners` wired up, but the main process does not emit streaming events yet. All provider calls currently wait for the full response.
