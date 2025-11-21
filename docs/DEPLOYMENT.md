# Deployment

## Distribution Formats

AI Ensemble is an Electron desktop app. It runs locally on the user's machine. There is no server-side deployment.

### Linux

Build with:
```bash
npm run build
```

This produces:
- **AppImage**: Self-contained executable, no installation needed. Users download and run it directly.
- **.deb**: Debian package for Ubuntu/Debian-based distributions. Install with `sudo dpkg -i ai-ensemble_1.0.0_amd64.deb`.

### Cross-Platform

```bash
npm run build:all
```

Builds for Linux, Windows, and macOS in one pass. Windows builds on Linux require Wine. macOS builds require a Mac or a CI runner with macOS.

## Output Directory

All build artifacts go to `dist/`.

## Requirements for End Users

- No Node.js installation needed (Electron bundles its own Node.js and Chromium)
- At least one AI provider API key, or a local Ollama instance
- Linux users may need to set `kernel.unprivileged_userns_clone=1` for the sandbox (the app tries to set this automatically)

## Data Locations

The app stores its data in the Electron `userData` directory:

| OS | Path |
|----|------|
| Linux | `~/.config/ai-ensemble/` |
| macOS | `~/Library/Application Support/ai-ensemble/` |
| Windows | `%APPDATA%/ai-ensemble/` |

Contents:
- `config.json` - settings (API keys, model selections, synthesis config)
- `ensemble.db` - SQLite database with conversation history

## Updating

No auto-update mechanism is configured. Users download and replace the AppImage, or install the new .deb over the old one.

## CI/CD

No CI/CD pipeline is configured. Builds are manual via `npm run build`.
