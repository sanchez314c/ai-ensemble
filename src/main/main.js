const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const Store = require('electron-store');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// ── Platform-specific Chromium flags ──
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
  app.commandLine.appendSwitch('disable-gpu-compositing');
  app.commandLine.appendSwitch('no-sandbox');
}

// ── Environment Variable Mapping ──
const ENV_KEY_MAP = {
  anthropic: ['ANTHROPIC_API_KEY'],
  openai: ['OPENAI_API_KEY'],
  deepseek: ['DEEPSEEK_API_KEY'],
  google: ['GEMINI_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY'],
  xai: ['XAI_API_KEY'],
  openrouter: ['OPENROUTER_API_KEY'],
  groq: ['GROQ_API_KEY'],
  mistral: ['MISTRAL_API_KEY'],
  perplexity: ['PERPLEXITY_API_KEY'],
  together: ['TOGETHER_AI_API_KEY']
};

const OLLAMA_ENV_VARS = ['OLLAMA_HOST', 'OLLAMA_ENDPOINT'];

function getEnvApiKey(provider) {
  const envVars = ENV_KEY_MAP[provider];
  if (!envVars) return '';
  for (const envVar of envVars) {
    const val = process.env[envVar];
    if (val && val.trim().length > 0) return val.trim();
  }
  return '';
}

function getEnvOllamaUrl() {
  for (const envVar of OLLAMA_ENV_VARS) {
    const val = process.env[envVar];
    if (val && val.trim().length > 0) return val.trim();
  }
  return 'http://localhost:11434';
}

function getEffectiveApiKey(provider, settings) {
  const saved = settings.apiKeys[provider];
  if (saved && saved.trim().length > 0) return saved.trim();
  return getEnvApiKey(provider);
}

function getEffectiveOllamaUrl(settings) {
  const saved = settings.apiKeys.ollamaUrl;
  if (saved && saved.trim().length > 0 && saved !== 'http://localhost:11434') return saved.trim();
  return getEnvOllamaUrl();
}

function getEnvKeys() {
  const envKeys = {};
  for (const provider of Object.keys(ENV_KEY_MAP)) {
    const envVal = getEnvApiKey(provider);
    if (envVal) envKeys[provider] = true;
  }
  const ollamaEnv = OLLAMA_ENV_VARS.find(v => process.env[v] && process.env[v].trim().length > 0);
  if (ollamaEnv) envKeys.ollamaUrl = true;
  return envKeys;
}

let mainWindow;
let db;
const store = new Store({
  defaults: {
    apiKeys: {
      anthropic: '',
      openai: '',
      deepseek: '',
      google: '',
      xai: '',
      openrouter: '',
      groq: '',
      mistral: '',
      perplexity: '',
      together: '',
      ollamaUrl: 'http://localhost:11434'
    },
    models: {
      claude: 'claude-sonnet-4-5-20250929',
      gpt: 'gpt-4o',
      deepseek: 'deepseek-reasoner',
      gemini: 'gemini-2.5-flash',
      ollama: 'llama3.2',
      grok: 'grok-3',
      openrouter: 'anthropic/claude-sonnet-4-5-20250929',
      groq: 'llama-3.3-70b-versatile',
      mistral: 'mistral-large-latest',
      perplexity: 'sonar-pro',
      together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo'
    },
    synthesis: {
      enabled: true,
      provider: 'claude'
    },
    defaultModels: ['claude', 'gpt'],
    theme: 'dark'
  }
});

function initializeDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'ensemble.db');
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT,
      is_synthesis INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
  `);

  console.log('Database initialized at:', dbPath);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: true,
    roundedCorners: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  const indexPath = path.join(__dirname, '../renderer/index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window control IPC handlers
ipcMain.handle('window-minimize', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.handle('window-maximize', () => {
  if (mainWindow) mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.handle('window-close', () => { if (mainWindow) mainWindow.close(); });
ipcMain.handle('open-external', async (event, url) => {
  const parsed = new URL(url);
  if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
    await shell.openExternal(url);
  }
});

app.whenReady().then(() => {
  initializeDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  if (db) {
    try { db.close(); } catch (e) { console.error('Error closing database:', e); }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ── AI Provider Functions ──

async function queryClaude(messages, settings) {
  const apiKey = getEffectiveApiKey('anthropic', settings);
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: settings.models.claude,
      max_tokens: 4096,
      messages: messages
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      timeout: 60000
    }
  );

  return response.data.content[0].text;
}

async function queryGPT(messages, settings) {
  const apiKey = getEffectiveApiKey('openai', settings);
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: settings.models.gpt,
      messages: messages
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      timeout: 60000
    }
  );

  return response.data.choices[0].message.content;
}

async function queryDeepSeek(messages, settings) {
  const apiKey = getEffectiveApiKey('deepseek', settings);
  if (!apiKey) {
    throw new Error('DeepSeek API key not configured');
  }

  const response = await axios.post(
    'https://api.deepseek.com/v1/chat/completions',
    {
      model: settings.models.deepseek,
      messages: messages
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      timeout: 60000
    }
  );

  return response.data.choices[0].message.content;
}

async function queryGemini(messages, settings) {
  const apiKey = getEffectiveApiKey('google', settings);
  if (!apiKey) {
    throw new Error('Google API key not configured');
  }

  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${settings.models.gemini}:generateContent?key=${apiKey}`,
    {
      contents: contents
    },
    {
      headers: {
        'content-type': 'application/json'
      },
      timeout: 60000
    }
  );

  return response.data.candidates[0].content.parts[0].text;
}

async function queryOllama(messages, settings) {
  const ollamaUrl = getEffectiveOllamaUrl(settings);

  // Validate Ollama URL - only allow localhost and private network
  try {
    const parsed = new URL(ollamaUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Ollama URL must use http or https protocol');
    }
    const hostname = parsed.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    const isPrivate = hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.match(/^172\.(1[6-9]|2\d|3[01])\./);
    if (!isLocalhost && !isPrivate) {
      throw new Error('Ollama URL must point to localhost or private network');
    }
  } catch (e) {
    if (e.message.includes('Ollama URL')) throw e;
    throw new Error(`Invalid Ollama URL: ${ollamaUrl}`);
  }

  const response = await axios.post(
    `${ollamaUrl}/api/chat`,
    {
      model: settings.models.ollama,
      messages: messages,
      stream: false
    },
    {
      headers: {
        'content-type': 'application/json'
      },
      timeout: 120000
    }
  );

  return response.data.message.content;
}

async function queryGrok(messages, settings) {
  const apiKey = getEffectiveApiKey('xai', settings);
  if (!apiKey) {
    throw new Error('xAI API key not configured');
  }

  const response = await axios.post(
    'https://api.x.ai/v1/chat/completions',
    {
      model: settings.models.grok,
      messages: messages
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      timeout: 60000
    }
  );

  return response.data.choices[0].message.content;
}

async function queryOpenRouter(messages, settings) {
  const apiKey = getEffectiveApiKey('openrouter', settings);
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: settings.models.openrouter,
      messages: messages
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'HTTP-Referer': 'https://github.com/sanchez314c/ai-ensemble',
        'X-Title': 'AI Ensemble'
      },
      timeout: 60000
    }
  );

  return response.data.choices[0].message.content;
}

async function queryGroq(messages, settings) {
  const apiKey = getEffectiveApiKey('groq', settings);
  if (!apiKey) {
    throw new Error('Groq API key not configured');
  }

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: settings.models.groq,
      messages: messages
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      timeout: 60000
    }
  );

  return response.data.choices[0].message.content;
}

async function queryMistral(messages, settings) {
  const apiKey = getEffectiveApiKey('mistral', settings);
  if (!apiKey) {
    throw new Error('Mistral API key not configured');
  }

  const response = await axios.post(
    'https://api.mistral.ai/v1/chat/completions',
    {
      model: settings.models.mistral,
      messages: messages
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      timeout: 60000
    }
  );

  return response.data.choices[0].message.content;
}

async function queryPerplexity(messages, settings) {
  const apiKey = getEffectiveApiKey('perplexity', settings);
  if (!apiKey) {
    throw new Error('Perplexity API key not configured');
  }

  const response = await axios.post(
    'https://api.perplexity.ai/chat/completions',
    {
      model: settings.models.perplexity,
      messages: messages
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      timeout: 60000
    }
  );

  return response.data.choices[0].message.content;
}

async function queryTogether(messages, settings) {
  const apiKey = getEffectiveApiKey('together', settings);
  if (!apiKey) {
    throw new Error('Together AI API key not configured');
  }

  const response = await axios.post(
    'https://api.together.xyz/v1/chat/completions',
    {
      model: settings.models.together,
      messages: messages
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      timeout: 60000
    }
  );

  return response.data.choices[0].message.content;
}

const providerMap = {
  claude: queryClaude,
  gpt: queryGPT,
  deepseek: queryDeepSeek,
  gemini: queryGemini,
  ollama: queryOllama,
  grok: queryGrok,
  openrouter: queryOpenRouter,
  groq: queryGroq,
  mistral: queryMistral,
  perplexity: queryPerplexity,
  together: queryTogether
};

async function queryModel(provider, messages, settings) {
  const queryFn = providerMap[provider];
  if (!queryFn) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const startTime = Date.now();
  try {
    const content = await queryFn(messages, settings);
    const duration = Date.now() - startTime;
    return {
      provider,
      success: true,
      content,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      provider,
      success: false,
      error: error.message,
      duration
    };
  }
}

async function synthesizeResponses(query, responses, settings) {
  const successfulResponses = responses.filter(r => r.success);
  if (successfulResponses.length === 0) {
    return null;
  }

  const responsesText = successfulResponses
    .map(r => `[${r.provider.toUpperCase()}] Response:\n${r.content}\n`)
    .join('\n');

  const synthesisPrompt = `You are an AI synthesis engine. Below are responses from multiple AI models to the same query. Analyze all responses, identify points of agreement and disagreement, resolve contradictions, and produce a comprehensive synthesized answer that represents the best thinking from all models.

Original Query: ${query}

${responsesText}
Provide your synthesized response:`;

  const synthesisProvider = settings.synthesis.provider || 'claude';
  const messages = [{ role: 'user', content: synthesisPrompt }];

  try {
    const result = await queryModel(synthesisProvider, messages, settings);
    if (result.success) {
      return {
        provider: synthesisProvider,
        content: result.content,
        duration: result.duration
      };
    }
  } catch (error) {
    console.error('Synthesis failed:', error);
  }

  return null;
}

function getConversationMessages(conversationId) {
  const messages = db
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .all(conversationId);

  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

function saveMessage(conversationId, role, content, model = null, isSynthesis = 0) {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  db.prepare(
    'INSERT INTO messages (id, conversation_id, role, content, model, is_synthesis, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, conversationId, role, content, model, isSynthesis, createdAt);

  db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(createdAt, conversationId);

  return { id, conversationId, role, content, model, isSynthesis, createdAt };
}

// ── Dynamic Model Fetching ──

const PROVIDER_MODEL_ENDPOINTS = {
  openai: { url: 'https://api.openai.com/v1/models', keyProvider: 'openai' },
  grok: { url: 'https://api.x.ai/v1/models', keyProvider: 'xai' },
  groq: { url: 'https://api.groq.com/openai/v1/models', keyProvider: 'groq' },
  mistral: { url: 'https://api.mistral.ai/v1/models', keyProvider: 'mistral' },
  together: { url: 'https://api.together.xyz/v1/models', keyProvider: 'together' },
  openrouter: { url: 'https://openrouter.ai/api/v1/models', keyProvider: 'openrouter' },
  perplexity: { url: 'https://api.perplexity.ai/models', keyProvider: 'perplexity' },
  deepseek: { url: 'https://api.deepseek.com/v1/models', keyProvider: 'deepseek' }
};

const ANTHROPIC_MODELS = [
  'claude-opus-4-5-20250929',
  'claude-sonnet-4-5-20250929',
  'claude-haiku-4-5-20251001'
];

async function fetchOpenAICompatibleModels(provider, settings) {
  const config = PROVIDER_MODEL_ENDPOINTS[provider];
  if (!config) {
    return { provider, models: [], error: `No model endpoint configured for ${provider}` };
  }

  const apiKey = getEffectiveApiKey(config.keyProvider, settings);
  if (!apiKey) {
    return { provider, models: [], error: `No API key for ${provider}` };
  }

  try {
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json'
    };
    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://github.com/sanchez314c/ai-ensemble';
      headers['X-Title'] = 'AI Ensemble';
    }

    const response = await axios.get(config.url, { headers, timeout: 15000 });
    const data = response.data.data || response.data;
    const models = Array.isArray(data)
      ? data.map(m => m.id || m.name).filter(Boolean).sort()
      : [];
    return { provider, models };
  } catch (error) {
    return { provider, models: [], error: error.message };
  }
}

async function fetchGeminiModels(settings) {
  const apiKey = getEffectiveApiKey('google', settings);
  if (!apiKey) {
    return { provider: 'gemini', models: [], error: 'No Google API key' };
  }

  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { timeout: 15000 }
    );
    const models = (response.data.models || [])
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
      .map(m => m.name.replace('models/', ''))
      .sort();
    return { provider: 'gemini', models };
  } catch (error) {
    return { provider: 'gemini', models: [], error: error.message };
  }
}

async function fetchOllamaModels(settings) {
  const ollamaUrl = getEffectiveOllamaUrl(settings);

  try {
    const response = await axios.get(`${ollamaUrl}/api/tags`, { timeout: 10000 });
    const models = (response.data.models || [])
      .map(m => m.name)
      .filter(Boolean)
      .sort();
    return { provider: 'ollama', models };
  } catch (error) {
    return { provider: 'ollama', models: [], error: error.message };
  }
}

// ── IPC Handlers ──

ipcMain.handle('query-models', async (event, { query, models, conversationId, synthesize }) => {
  // Input validation
  if (typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Query must be a non-empty string');
  }
  if (!Array.isArray(models) || models.length === 0) {
    throw new Error('Models must be a non-empty array');
  }
  const validProviders = Object.keys(providerMap);
  for (const m of models) {
    if (!validProviders.includes(m)) {
      throw new Error(`Unknown provider: ${m}`);
    }
  }

  const settings = store.store;
  let messages = [];

  if (conversationId) {
    messages = getConversationMessages(conversationId);
  }

  messages.push({ role: 'user', content: query });

  const queryPromises = models.map(provider => queryModel(provider, messages, settings));
  const results = await Promise.allSettled(queryPromises);

  const responses = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        provider: models[index],
        success: false,
        error: result.reason.message,
        duration: 0
      };
    }
  });

  let synthesisResult = null;
  if (synthesize && settings.synthesis.enabled) {
    synthesisResult = await synthesizeResponses(query, responses, settings);
  }

  if (conversationId) {
    saveMessage(conversationId, 'user', query);

    for (const response of responses) {
      if (response.success) {
        saveMessage(conversationId, 'assistant', response.content, response.provider, 0);
      }
    }

    if (synthesisResult) {
      saveMessage(conversationId, 'assistant', synthesisResult.content, synthesisResult.provider, 1);
    }
  }

  return {
    responses,
    synthesis: synthesisResult
  };
});

ipcMain.handle('get-conversations', async () => {
  const conversations = db
    .prepare('SELECT * FROM conversations ORDER BY updated_at DESC')
    .all();

  return conversations.map(conv => ({
    id: conv.id,
    title: conv.title,
    createdAt: conv.created_at,
    updatedAt: conv.updated_at
  }));
});

ipcMain.handle('get-conversation', async (event, conversationId) => {
  const conversation = db
    .prepare('SELECT * FROM conversations WHERE id = ?')
    .get(conversationId);

  if (!conversation) {
    return null;
  }

  const messages = db
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .all(conversationId);

  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    messages: messages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      role: msg.role,
      content: msg.content,
      model: msg.model,
      isSynthesis: Boolean(msg.is_synthesis),
      createdAt: msg.created_at
    }))
  };
});

ipcMain.handle('create-conversation', async (event, title) => {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;

  db.prepare(
    'INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)'
  ).run(id, title || 'New Conversation', createdAt, updatedAt);

  return {
    id,
    title: title || 'New Conversation',
    createdAt,
    updatedAt
  };
});

ipcMain.handle('delete-conversation', async (event, conversationId) => {
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(conversationId);
  db.prepare('DELETE FROM conversations WHERE id = ?').run(conversationId);

  return { success: true };
});

ipcMain.handle('get-settings', async () => {
  const saved = store.store;
  const envKeys = getEnvKeys();

  // Merge env vars as fallbacks into the returned apiKeys so the renderer
  // sees effective values, but do NOT persist env vars into the store.
  const effectiveApiKeys = { ...saved.apiKeys };
  for (const provider of Object.keys(ENV_KEY_MAP)) {
    if (!effectiveApiKeys[provider] || effectiveApiKeys[provider].trim().length === 0) {
      const envVal = getEnvApiKey(provider);
      if (envVal) effectiveApiKeys[provider] = envVal;
    }
  }
  // Ollama URL fallback
  if (!effectiveApiKeys.ollamaUrl || effectiveApiKeys.ollamaUrl === 'http://localhost:11434') {
    effectiveApiKeys.ollamaUrl = getEffectiveOllamaUrl(saved);
  }

  return {
    ...saved,
    apiKeys: effectiveApiKeys,
    envKeys
  };
});

ipcMain.handle('save-settings', async (event, settings) => {
  // Validate settings structure - only allow known top-level keys
  const allowedKeys = ['apiKeys', 'models', 'synthesis', 'defaultModels', 'theme'];
  const validated = {};
  for (const key of allowedKeys) {
    if (settings[key] !== undefined) {
      if (key === 'apiKeys') {
        // Only allow known apiKeys fields
        const allowedApiKeys = [
          'anthropic', 'openai', 'deepseek', 'google', 'xai',
          'openrouter', 'groq', 'mistral', 'perplexity', 'together',
          'ollamaUrl'
        ];
        const validatedApiKeys = {};
        for (const ak of allowedApiKeys) {
          if (settings.apiKeys[ak] !== undefined) {
            validatedApiKeys[ak] = settings.apiKeys[ak];
          }
        }
        validated.apiKeys = validatedApiKeys;
      } else {
        validated[key] = settings[key];
      }
    }
  }
  store.store = validated;
  return { success: true };
});

ipcMain.handle('fetch-provider-models', async (event, provider) => {
  const settings = store.store;

  switch (provider) {
    case 'claude':
      return { provider: 'claude', models: ANTHROPIC_MODELS };

    case 'gemini':
      return await fetchGeminiModels(settings);

    case 'ollama':
      return await fetchOllamaModels(settings);

    case 'gpt':
    case 'openai':
      return await fetchOpenAICompatibleModels('openai', settings);

    case 'deepseek':
      return await fetchOpenAICompatibleModels('deepseek', settings);

    case 'grok':
      return await fetchOpenAICompatibleModels('grok', settings);

    case 'openrouter':
      return await fetchOpenAICompatibleModels('openrouter', settings);

    case 'groq':
      return await fetchOpenAICompatibleModels('groq', settings);

    case 'mistral':
      return await fetchOpenAICompatibleModels('mistral', settings);

    case 'perplexity':
      return await fetchOpenAICompatibleModels('perplexity', settings);

    case 'together':
      return await fetchOpenAICompatibleModels('together', settings);

    default:
      return { provider, models: [], error: `Unknown provider: ${provider}` };
  }
});

ipcMain.handle('export-conversation', async (event, { conversationId, format }) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
  const messages = db
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .all(conversationId);

  if (!conv) {
    throw new Error('Conversation not found');
  }

  if (format === 'json') {
    return JSON.stringify(
      {
        id: conv.id,
        title: conv.title,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          model: msg.model,
          isSynthesis: Boolean(msg.is_synthesis),
          createdAt: msg.created_at
        }))
      },
      null,
      2
    );
  } else {
    let markdown = `# ${conv.title}\n\n`;
    markdown += `Created: ${new Date(conv.created_at).toLocaleString()}\n`;
    markdown += `Updated: ${new Date(conv.updated_at).toLocaleString()}\n\n`;
    markdown += '---\n\n';

    for (const msg of messages) {
      const role = msg.role === 'user' ? 'User' : msg.model ? `${msg.model.toUpperCase()}${msg.is_synthesis ? ' (Synthesis)' : ''}` : 'Assistant';
      markdown += `## ${role}\n\n`;
      markdown += `${msg.content}\n\n`;
      markdown += `*${new Date(msg.created_at).toLocaleString()}*\n\n`;
      markdown += '---\n\n';
    }

    return markdown;
  }
});

console.log('AI Ensemble Main Process initialized (11 providers)');
