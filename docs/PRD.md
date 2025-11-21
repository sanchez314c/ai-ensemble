# Product Requirements Document

## Product Name

AI Ensemble

## Problem Statement

When working with AI models, each model has different strengths, knowledge gaps, and reasoning styles. Users who want the best possible answer often query multiple models manually, compare results, and mentally synthesize the outputs. This is slow and tedious.

## Solution

A desktop application that queries 2-5 AI models simultaneously with a single prompt, displays each model's response in a color-coded card, and optionally produces a synthesized answer that merges the best insights from all models.

## Target Users

Developers, researchers, and power users who:
- Use multiple AI providers and want to compare responses
- Need higher confidence in AI-generated answers by cross-referencing models
- Want a single interface for all their AI providers instead of switching between tabs

## Core Features

### Multi-Model Parallel Query
- Send one prompt to any combination of: Claude, GPT-4o, DeepSeek, Gemini, Ollama
- Toggle active models per query from the top bar
- Minimum one model must be active

### Response Synthesis
- Configurable synthesis provider (Claude, GPT-4o, or Gemini)
- Synthesis prompt asks the provider to identify agreements, resolve contradictions, and produce a merged answer
- Toggle synthesis on/off per query
- Only runs when 2+ models are active

### Conversation Persistence
- SQLite database stores all conversations and messages locally
- Sidebar shows conversation history sorted by last update
- Search conversations by title
- Delete individual conversations
- Resume past conversations with full message history

### Export
- Export any conversation as Markdown or JSON
- Download as a file to the user's machine

### Voice Input
- Browser-native speech recognition (Web Speech API)
- Click microphone button to start, click again to stop

### Reason Mode
- Prepends "Think step by step. " to prompts for more detailed responses
- Toggle on/off via button in the input area

## Non-Functional Requirements

### Security
- API keys stored locally, never transmitted except to the respective provider
- Renderer process has no direct access to keys (contextIsolation + preload bridge)
- CSP restricts script execution to self only
- All database queries use parameterized statements

### Privacy
- No telemetry, no analytics, no data sent to any third party
- All data stored locally in the Electron user data directory

### Performance
- Parallel queries via Promise.allSettled (total time = slowest provider)
- Synchronous SQLite for fast local data access
- No build step for development (source loaded directly)

## Out of Scope (v1.0)

- Streaming responses (preload wiring exists but main process doesn't emit chunks)
- File/image attachments
- Auto-update mechanism
- Prompt templates or saved prompts
- Response comparison/diff view
- Token usage tracking or cost estimation
- Multi-user support
- Cloud sync
