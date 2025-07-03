# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a Vulnerability

If you find a security issue, please report it privately via GitHub: [sanchez314c](https://github.com/sanchez314c)

Do not open a public issue for security vulnerabilities.

## Security Architecture

### API Key Storage
- API keys are stored locally via `electron-store` in the user's app data directory
- Keys are never transmitted to any server other than the respective AI provider's API endpoint
- The renderer process cannot access keys directly; all API calls go through the main process via IPC

### Content Security Policy
The app enforces a CSP header that restricts:
- Scripts to `'self'` only (no inline scripts, no external script sources)
- Styles to `'self'` and `'unsafe-inline'` plus Google Fonts
- Fonts to Google Fonts CDN only
- Connections to any origin (required for multiple AI provider endpoints)

### Process Isolation
- `nodeIntegration` is disabled in the renderer
- `contextIsolation` is enabled
- The preload script exposes a limited `window.api` surface via `contextBridge`

### Database
- SQLite database is stored in the Electron `userData` directory
- No remote database connections
- All queries use parameterized statements (no SQL injection vectors)

## Known Considerations

- The Gemini API key is passed as a URL query parameter (this is Google's API design, not a local leak)
- The `kernel.unprivileged_userns_clone` sysctl is set on startup for Linux Electron sandbox compatibility
