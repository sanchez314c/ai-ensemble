# Build & Compile

## Development Mode

No build step is needed for development. Electron loads the source files directly.

```bash
npm run dev
```

This sets `NODE_ENV=development` and launches Electron. DevTools can be opened with `Ctrl+Shift+I`.

## Production Mode

```bash
npm start
```

Runs Electron in production mode (no DevTools shortcut, no development flags).

## Packaging with electron-builder

### Linux Only

```bash
npm run build
```

Produces AppImage and .deb packages in the `dist/` directory.

### All Platforms

```bash
npm run build:all
```

Builds for Linux, Windows, and macOS. Cross-platform builds may require additional tooling (Wine for Windows builds on Linux, etc.).

## electron-builder Configuration

From `package.json`:

```json
{
  "build": {
    "appId": "com.mastercontrol.ai-ensemble",
    "productName": "AI Ensemble",
    "linux": {
      "target": ["AppImage", "deb"],
      "category": "Utility"
    },
    "directories": {
      "output": "dist"
    },
    "files": [
      "src/**/*",
      "node_modules/**/*",
      "package.json"
    ]
  }
}
```

## Build Output

| Platform | Format | Location |
|----------|--------|----------|
| Linux | AppImage | `dist/AI Ensemble-1.0.0.AppImage` |
| Linux | .deb | `dist/ai-ensemble_1.0.0_amd64.deb` |

## Native Dependencies

`better-sqlite3` is a native Node.js addon that compiles C++ code during `npm install`. It requires:

- Python 3.x
- A C++ compiler (gcc/g++ on Linux, Xcode on macOS, MSVC on Windows)
- `node-gyp` (installed automatically as a dependency)

If `npm install` fails on `better-sqlite3`, check that your build tools are installed:

```bash
# Ubuntu/Debian
sudo apt-get install build-essential python3

# macOS
xcode-select --install
```

## Rebuilding Native Modules

If you switch Node.js versions, rebuild native modules:

```bash
npx electron-rebuild
```
