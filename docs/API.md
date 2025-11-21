# API Reference

## IPC API (Main Process Handlers)

All communication between the renderer and main process goes through Electron IPC via the `window.api` object exposed by the preload script.

### `queryModels(data)`

Sends a prompt to multiple AI models in parallel and optionally synthesizes the results.

**Parameters:**
```javascript
{
  query: string,           // The user's prompt text
  models: string[],        // Array of provider keys: 'claude', 'gpt', 'deepseek', 'gemini', 'ollama'
  conversationId: string,  // UUID of the current conversation (null for new)
  synthesize: boolean      // Whether to run synthesis on the results
}
```

**Returns:**
```javascript
{
  responses: [
    {
      provider: string,    // Provider key
      success: boolean,
      content: string,     // Response text (if success)
      error: string,       // Error message (if failure)
      duration: number     // Time in ms
    }
  ],
  synthesis: {
    provider: string,      // Which provider ran synthesis
    content: string,       // Synthesized response text
    duration: number
  } | null
}
```

### `getConversations()`

Returns all conversations ordered by most recently updated.

**Returns:** `Array<{ id, title, createdAt, updatedAt }>`

### `getConversation(id)`

Returns a single conversation with all its messages.

**Parameters:** `id` (string) - conversation UUID

**Returns:**
```javascript
{
  id: string,
  title: string,
  createdAt: string,
  updatedAt: string,
  messages: [
    {
      id: string,
      conversationId: string,
      role: 'user' | 'assistant',
      content: string,
      model: string | null,
      isSynthesis: boolean,
      createdAt: string
    }
  ]
}
```

### `createConversation(title)`

Creates a new conversation.

**Parameters:** `title` (string) - conversation title (defaults to "New Conversation")

**Returns:** `{ id, title, createdAt, updatedAt }`

### `deleteConversation(id)`

Deletes a conversation and all its messages.

**Parameters:** `id` (string) - conversation UUID

**Returns:** `{ success: true }`

### `getSettings()`

Returns the full settings object from electron-store.

**Returns:**
```javascript
{
  apiKeys: {
    anthropic: string,
    openai: string,
    deepseek: string,
    google: string,
    ollamaUrl: string     // Default: 'http://localhost:11434'
  },
  models: {
    claude: string,       // Default: 'claude-sonnet-4-5-20250929'
    gpt: string,          // Default: 'gpt-4o'
    deepseek: string,     // Default: 'deepseek-reasoner'
    gemini: string,       // Default: 'gemini-2.5-flash'
    ollama: string        // Default: 'llama3.2'
  },
  synthesis: {
    enabled: boolean,
    provider: string      // Default: 'claude'
  },
  defaultModels: string[],  // Default: ['claude', 'gpt']
  theme: string             // Default: 'dark'
}
```

### `saveSettings(settings)`

Overwrites the full settings object.

**Parameters:** `settings` (object) - same shape as `getSettings()` return value

**Returns:** `{ success: true }`

### `exportConversation(id, format)`

Exports a conversation in the specified format.

**Parameters:**
- `id` (string) - conversation UUID
- `format` (string) - `'json'` or `'markdown'`

**Returns:** `string` - the formatted conversation content

### Window Controls (Fire-and-Forget)

These use `ipcRenderer.send` (no return value):

- `windowMinimize()` - minimizes the window
- `windowMaximize()` - toggles maximize/unmaximize
- `windowClose()` - closes the window

### Stream Events (Unused)

The preload exposes `onStreamChunk(callback)` and `removeStreamListeners()` for future streaming support. These are wired up but the main process does not currently emit `stream-chunk` events.

## AI Provider API Details

### Anthropic (Claude)

- Endpoint: `POST https://api.anthropic.com/v1/messages`
- Auth: `x-api-key` header
- Required header: `anthropic-version: 2023-06-01`
- Body: `{ model, max_tokens: 4096, messages }`
- Response path: `response.data.content[0].text`
- Timeout: 60s

### OpenAI (GPT)

- Endpoint: `POST https://api.openai.com/v1/chat/completions`
- Auth: `Authorization: Bearer {key}`
- Body: `{ model, messages }`
- Response path: `response.data.choices[0].message.content`
- Timeout: 60s

### DeepSeek

- Endpoint: `POST https://api.deepseek.com/v1/chat/completions`
- Auth: `Authorization: Bearer {key}`
- Body: `{ model, messages }`
- Response path: `response.data.choices[0].message.content`
- Timeout: 60s

### Google (Gemini)

- Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}`
- Auth: API key as query parameter
- Body: `{ contents }` (messages mapped to `{ role, parts: [{ text }] }`)
- Response path: `response.data.candidates[0].content.parts[0].text`
- Timeout: 60s

### Ollama

- Endpoint: `POST {ollamaUrl}/api/chat` (default: `http://localhost:11434`)
- Auth: None
- Body: `{ model, messages, stream: false }`
- Response path: `response.data.message.content`
- Timeout: 120s (longer for local inference)
