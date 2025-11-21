# Troubleshooting

## Installation Issues

### `npm install` fails on better-sqlite3

**Symptom:** Error during `npm install` mentioning `node-gyp`, `better-sqlite3`, or compilation errors.

**Fix:** Install build tools:
```bash
# Ubuntu/Debian
sudo apt-get install build-essential python3

# macOS
xcode-select --install

# Windows
npm install -g windows-build-tools
```

If you recently changed Node.js versions, run:
```bash
npx electron-rebuild
```

### Electron crashes on startup (Linux)

**Symptom:** `credentials.cc: Permission denied` or sandbox-related error.

**Fix:**
```bash
sudo sysctl -w kernel.unprivileged_userns_clone=1
```

The app attempts this automatically on startup, but it requires passwordless sudo or a pre-set sysctl value.

## Provider Errors

### "Anthropic API key not configured" (or similar for other providers)

**Fix:** Open Settings (gear icon in sidebar or `Ctrl+,`), enter your API key for the provider, and click Save.

### Claude returns 401 or 403

**Cause:** Invalid or expired API key, or insufficient credits on your Anthropic account.

**Fix:** Verify your key at [console.anthropic.com](https://console.anthropic.com/). Regenerate if needed. Check that your account has available credits.

### Gemini returns 400 Bad Request

**Cause:** The API key may be invalid, or the selected model may not be available in your region.

**Fix:** Verify your key at [aistudio.google.com](https://aistudio.google.com/). Try switching to a different Gemini model in Settings.

### Ollama returns "connect ECONNREFUSED"

**Cause:** Ollama is not running or is on a different URL.

**Fix:**
1. Make sure Ollama is running: `ollama serve`
2. Check the URL in Settings (default: `http://localhost:11434`)
3. Verify you have at least one model pulled: `ollama list`

### DeepSeek times out

**Cause:** DeepSeek Reasoner (R1) can take a long time for complex queries. The app has a 60-second timeout.

**Fix:** For faster responses, switch to the `deepseek-chat` model in Settings.

### All providers fail simultaneously

**Cause:** Network issue, or the app can't reach external APIs.

**Fix:** Check your internet connection. If you're behind a proxy or firewall, make sure HTTPS traffic to the provider endpoints is allowed.

## UI Issues

### Sidebar is missing on mobile/narrow window

**Fix:** Click the hamburger menu icon in the top-left of the top bar. The sidebar slides in as an overlay on narrow screens.

### Messages are not rendering markdown correctly

**Cause:** The custom markdown parser handles most common patterns but may struggle with deeply nested or unusual constructs.

**Known limitations:**
- Nested lists are not fully supported
- Complex table layouts may not render correctly
- HTML in markdown is escaped (by design, for security)

### Copy button does nothing

**Cause:** Clipboard API may be blocked by the browser context.

**Fix:** Check DevTools console (`Ctrl+Shift+I`) for clipboard permission errors. This is rare in Electron but can happen with certain security configurations.

## Data Issues

### Conversations disappeared

**Cause:** The SQLite database may have been deleted or corrupted.

**Location:** `~/.config/ai-ensemble/ensemble.db` (Linux)

**Fix:** If the file is missing, the app will recreate it (empty) on next startup. There is no automatic backup mechanism.

### Settings reset after update

**Cause:** Settings are stored in `config.json` in the user data directory. If this file was deleted during an update, settings reset to defaults.

**Fix:** Re-enter your API keys in Settings. The settings file persists across normal updates.

## Performance

### App is slow to respond

**Cause:** AI provider response times vary. DeepSeek Reasoner and Ollama (depending on hardware) tend to be slower.

**Tip:** The app uses `Promise.allSettled` to query all selected models in parallel, so total wait time equals the slowest provider. Deselect slow providers if you want faster results.

### High memory usage

**Cause:** Electron bundles a full Chromium instance. Base memory usage is typically 200-400MB. Long conversations with many rendered messages will increase this.

**Fix:** Start a new conversation periodically to clear rendered DOM nodes.
