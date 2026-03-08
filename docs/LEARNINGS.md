# Learnings

Technical decisions, tradeoffs, and lessons from building AI Ensemble.

## Custom Markdown Parser vs. marked.js

The app includes `marked` (v15) and `highlight.js` (v11) in `package.json`, but neither is actually used. A custom regex-based markdown parser in `app.js` handles rendering instead.

**Why:** The custom parser is about 60 lines and handles the patterns that actually appear in AI model responses (code blocks, inline code, bold, italic, links, headers, tables, lists, blockquotes). It avoids the overhead of loading two full libraries and gives precise control over output HTML and XSS handling. The downside is that edge cases (nested lists, complex table layouts, raw HTML in markdown) are not fully covered.

**Takeaway:** For a controlled input domain (AI model output follows predictable patterns), a lightweight custom parser can be simpler than a full library.

## Synchronous SQLite via better-sqlite3

All database operations are synchronous (`db.prepare().all()`, `db.prepare().run()`). This is unusual for Node.js applications but works well in this context.

**Why:** better-sqlite3 is faster than async alternatives for single-connection desktop use. The database operations are fast (< 1ms for typical reads/writes) and blocking the main process for that duration is not noticeable. Async queries would add complexity (callbacks/promises) without meaningful benefit.

**Takeaway:** In Electron main process with a local database, synchronous access is simpler and fast enough.

## Promise.allSettled for Multi-Model Queries

The app uses `Promise.allSettled` instead of `Promise.all` for parallel model queries.

**Why:** `Promise.all` rejects on the first failure. If one provider is down or has an expired key, all other successful responses would be lost. `Promise.allSettled` lets every provider complete (or fail) independently, so the user always sees whichever models succeeded.

**Takeaway:** Always use `Promise.allSettled` when you want partial results from parallel operations.

## Frameless Window with Custom Title Bar

The Electron window uses `frame: false` and `transparent: true` with custom minimize/maximize/close buttons.

**Why:** Standard window chrome looks different on every OS and doesn't match the dark glassmorphism design. Custom controls give visual consistency. The tradeoff is implementing drag regions (`-webkit-app-region: drag`) and window control IPC manually.

**Takeaway:** Frameless Electron windows look better but add maintenance cost for window management, especially on Linux where behavior varies across desktop environments.

## electron-store for Settings

Settings (API keys, model selections, synthesis config) are stored via `electron-store`, which writes a JSON file in the Electron `userData` directory.

**Why:** It's simpler than adding another SQLite table. Settings are a flat key-value structure that rarely changes. electron-store handles atomic writes and default values out of the box.

**Takeaway:** Use the right tool for the data shape. SQLite for relational data (conversations/messages), JSON file for configuration.

## CSP with connect-src: *

The Content Security Policy allows `connect-src *` (connections to any origin).

**Why:** The app connects to five different API endpoints across four domains (Anthropic, OpenAI, DeepSeek, Google) plus a configurable Ollama URL. Listing them all individually would be fragile and break when providers change domains or users configure custom Ollama endpoints.

**Takeaway:** For multi-provider apps, wildcard `connect-src` is pragmatic. Lock down `script-src` and `default-src` instead.

## Synthesis as Meta-Prompting

The synthesis feature works by taking all model responses, formatting them into a single prompt, and sending that prompt to one model (the synthesis provider).

**Why:** This is the simplest possible architecture for response synthesis. No embeddings, no vector DB, no custom ML model. The synthesis provider just reads the responses and produces a merged answer. The quality depends entirely on the synthesis provider's ability to analyze and reconcile multiple viewpoints.

**Tradeoff:** Synthesis adds one extra API call and its associated latency/cost. The synthesis prompt is also long (it includes the full text of every response), which can hit token limits on complex queries.
