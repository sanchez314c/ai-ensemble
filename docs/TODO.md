# TODO

## Planned Features

- [ ] **Streaming responses** - The preload bridge has `onStreamChunk` and `removeStreamListeners` wired up, but the main process doesn't emit streaming events yet. Implement streaming for each provider to show responses as they arrive.
- [ ] **Remove unused dependencies** - `marked` (v15) and `highlight.js` (v11) are in `package.json` but never imported. Remove them to reduce install size.
- [ ] **Token usage tracking** - Track token counts per request and display cost estimates based on provider pricing.
- [ ] **Response diff view** - Side-by-side comparison of model responses with highlighted differences.
- [ ] **Prompt templates** - Saved prompt templates for common query patterns (code review, explanation, comparison, etc.).
- [ ] **Auto-update** - Implement Electron auto-updater for AppImage/deb distributions.
- [ ] **File attachments** - Support attaching files or images to prompts for models that accept multimodal input (Claude, GPT-4o, Gemini).

## Technical Debt

- [ ] **Synthesis token limits** - The synthesis prompt includes the full text of every model response. For long responses from 5 models, this can exceed provider token limits. Add truncation or summarization before synthesis.
- [ ] **Markdown parser edge cases** - The custom parser doesn't handle nested lists, complex table layouts, or numbered list continuation. Consider switching to `marked` (already a dependency) if edge cases become a problem.
- [ ] **Error handling in provider functions** - Provider functions catch errors at the `queryModel` wrapper level but don't distinguish between network errors, auth errors, and rate limits. More granular error handling would improve UX.
- [ ] **Database migrations** - No migration system exists. Schema changes would require manual migration scripts or a fresh database.
- [ ] **Test suite** - No tests exist. Add at minimum: unit tests for the markdown parser, integration tests for provider functions (with mocked HTTP), and E2E tests for the IPC flow.

## UI Polish

- [ ] **Conversation rename** - Currently conversations take their title from the first 50 characters of the first prompt. Add an inline rename option.
- [ ] **Model response timing** - Show response duration on each model's card (the data is returned from the main process but not displayed).
- [ ] **Dark/light theme toggle** - The settings store has a `theme` field defaulting to `'dark'` but no light theme is implemented.
- [ ] **Keyboard navigation** - Add keyboard navigation for conversation list and model toggles.
