# Changelog

All notable changes to AI Ensemble are documented here.

## [1.2.0] - 2026-03-08 19:30 — Multi-Provider Expansion

### New Providers (6 added)
- Added Grok/xAI provider (XAI_API_KEY, api.x.ai)
- Added OpenRouter provider (OPENROUTER_API_KEY, openrouter.ai)
- Added Groq provider (GROQ_API_KEY, api.groq.com)
- Added Mistral provider (MISTRAL_API_KEY, api.mistral.ai)
- Added Perplexity provider (PERPLEXITY_API_KEY, api.perplexity.ai)
- Added Together AI provider (TOGETHER_AI_API_KEY, api.together.xyz)

### Environment Auto-Detection
- All 11 providers auto-source API keys from bash environment variables
- Priority: saved settings > environment variables
- Visual ENV badge in settings when environment key detected
- API keys displayed masked (••••• from environment) in settings fields

### Dynamic Model Fetching
- Per-provider model list fetch from live APIs
- Refresh button per provider to re-fetch available models
- Models sorted alphabetically within each provider
- Fallback to defaults when API unreachable

### UI Updates
- 11 model toggle buttons in model bar (was 5)
- 11 API key fields in settings with ENV indicators
- 11 model select dropdowns with refresh capability
- Synthesis provider selector includes all cloud providers
- CSP connect-src updated for all 11 API endpoints
- Color palette extended: Grok=rose, OpenRouter=indigo, Groq=lime, Mistral=orange, Perplexity=sky, Together=fuchsia

## [1.1.0] - 2026-03-08 17:45 — Neo-Noir Glass Monitor Restyle

### Visual Overhaul
- Applied Neo-Noir Glass Monitor design system (complete UI restyle)
- Added frameless floating window with 16px body padding (desktop visible behind)
- Added canonical title bar: icon, name, tagline, flat About/Settings icons, circular window controls
- Added About modal with app info, version, GitHub badge, MIT License, email
- Added status bar footer (status dot + conversation count left, version-only right)
- Applied glass card system with layered shadows, inner highlights, and hover escalation
- Applied complete design token system (60+ CSS custom properties)
- Themed all inputs, buttons, scrollbars, status indicators, model toggles
- Removed sidebar logo section — conversation list starts directly at top
- Added ambient radial-gradient mesh on synthesis messages
- Added dot particle grid overlay on welcome screen
- Changed model color palette: Claude=teal, GPT=cyan, DeepSeek=purple, Gemini=amber, Ollama=green
- Scrollbars invisible at rest, visible on hover (6px, dark thumb)
- Selection color uses teal accent

### Structural Changes
- Restructured HTML to canonical layout: drag-handle → title-bar → app-body (sidebar + main) → status-bar
- Separated model bar from top header area
- Moved new-chat button to sidebar footer
- Added CSP img-src 'self' data: directive
- Generated placeholder app icon (teal circle with multi-model dots)
- Window controls wired via IPC invoke/handle pattern
- About modal GitHub link opens via shell.openExternal with protocol validation

## [1.0.1] - 2026-03-08 -- Phase 2 Security Audit & Remediation

### Security Fixes (CRITICAL)
- Fixed SSRF vulnerability in Ollama URL handling — now validates URL scheme and restricts to localhost/private networks
- Replaced `connect-src *` in CSP with explicit API endpoint allowlist
- Added allowlist validation on `save-settings` IPC handler to prevent arbitrary config injection

### Security Fixes (HIGH)
- Fixed potential XSS via markdown links — `parseMarkdown()` now validates URL schemes, blocking `javascript:` and `data:` URIs
- Corrected false "encrypted" claim for API key storage to "stored locally on your machine"
- Added input validation on `query-models` IPC handler (type checks, provider whitelist)

### Bug Fixes (MEDIUM)
- Added `PRAGMA foreign_keys = ON` for SQLite foreign key enforcement
- Added `before-quit` handler to close database connection gracefully
- Removed unused `marked` and `highlight.js` dependencies
- Removed external Google Fonts CDN dependency — app now uses system font fallbacks

## [1.0.0] - 2026-03-08 16:37 — Repo-Prep Compliance Audit (Full Mode)

### Added
- `.gitignore` — full pattern coverage (node_modules, dist, build, env, OS junk, IDE, archive, legacy)
- `.nvmrc` — pinned to Node 24
- `.editorconfig` — 2-space indent, LF line endings, UTF-8
- `run-source-linux.sh` — sandbox fix, zombie cleanup, port management, dev launch
- `run-source-macos.sh` — zombie cleanup, port management, dev launch
- `run-source-windows.bat` — dev launch with debug/inspect ports
- `archive/` directory with .gitkeep (backup storage)
- `resources/icons/` directory with .gitkeep (app icon storage)
- `tests/` directory with .gitkeep (future test framework)

### Changed
- `src/main/main.js` — replaced `sudo sysctl` execSync hack with proper `app.commandLine.appendSwitch` Chromium flags (enable-transparent-visuals, disable-gpu-compositing, no-sandbox)
- `package.json` — version reset to 1.0.0, author set to "J. Michaels", added repository/bugs/homepage URLs, start/dev scripts now include `--no-sandbox`
- `AGENTS.md` — synced with CLAUDE.md
- `VERSION_MAP.md` — version aligned to 1.0.0

### Port Assignments
- Electron Debug: 60416
- Electron Inspect: 57514
- Electron Fallback: 56897

## [1.0.0-beta.3] - 2026-03-08 — Documentation Audit & Alignment

### Changed
- `VERSION_MAP.md` — updated current version tracking
- `AGENTS.md` — expanded to match CLAUDE.md content (added architecture overview, key patterns, conventions, database schema, build commands, provider addition guide)
- `CHANGELOG.md` — added audit entry

## [1.0.0-beta.2] - 2026-03-07 — Full Documentation Standardization (27/27)

### Added
- `VERSION_MAP.md` — dependency versions, API version matrix, default models
- `docs/API.md` — full IPC API reference and AI provider endpoint details
- `docs/BUILD_COMPILE.md` — electron-builder config, native dependencies, packaging
- `docs/DEPLOYMENT.md` — distribution formats, data locations, update process
- `docs/FAQ.md` — common questions about setup, usage, and technical behavior
- `docs/TROUBLESHOOTING.md` — common errors and their fixes
- `docs/TECHSTACK.md` — full technology inventory and design choices
- `docs/WORKFLOW.md` — user and developer workflows, data flow diagram
- `docs/QUICK_START.md` — 5-minute install-to-first-query guide
- `docs/LEARNINGS.md` — technical decisions, tradeoffs, and lessons
- `docs/PRD.md` — product requirements, target users, feature scope
- `docs/TODO.md` — planned features, technical debt, UI polish tasks

### Changed
- `docs/README.md` — expanded to index all 15 docs files plus all root-level files

## [1.0.0-beta.1] - 2026-03-07 — Documentation Standardization

### Added
- `.github/ISSUE_TEMPLATE/bug_report.md` — structured bug report template
- `.github/ISSUE_TEMPLATE/feature_request.md` — feature request template
- `.github/PULL_REQUEST_TEMPLATE.md` — PR checklist template
- `docs/README.md` — documentation index linking all guides and root-level files

## [1.0.0] - 2026-03-07

### Added
- Multi-model parallel querying across Claude, GPT-4o, DeepSeek, Gemini, and Ollama
- Collaborative synthesis engine that merges responses from all active models
- Conversation persistence with SQLite (better-sqlite3)
- Settings management via electron-store with per-provider API key storage
- Conversation export in Markdown and JSON formats
- Voice input via Web Speech API
- Reason mode for step-by-step prompting
- Custom frameless window with minimize/maximize/close controls
- Dark glassmorphism UI with Inter and JetBrains Mono typography
- Sidebar with conversation search, history, and delete
- Custom markdown parser with code blocks, tables, lists, blockquotes, and headers
- Quick action chips on welcome screen for common prompt types
- Keyboard shortcuts for conversation management (Ctrl+N, Ctrl+E, Ctrl+,, Ctrl+1-5)
- Responsive layout with mobile sidebar toggle
- Per-model color coding and loading indicators
- Copy-to-clipboard on AI responses
- Model selection toggles with minimum one model enforced
- Configurable synthesis provider (Claude, GPT, or Gemini)
- 15-file documentation standardization
