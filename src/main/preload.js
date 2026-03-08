const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // AI Query
  queryModels: (data) => ipcRenderer.invoke('query-models', data),

  // Conversations
  getConversations: () => ipcRenderer.invoke('get-conversations'),
  getConversation: (id) => ipcRenderer.invoke('get-conversation', id),
  createConversation: (title) => ipcRenderer.invoke('create-conversation', title),
  deleteConversation: (id) => ipcRenderer.invoke('delete-conversation', id),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // Export
  exportConversation: (id, format) => ipcRenderer.invoke('export-conversation', { conversationId: id, format }),

  // Provider Models
  fetchProviderModels: (provider) => ipcRenderer.invoke('fetch-provider-models', provider),

  // Window controls (frameless)
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),

  // Shell
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Streaming support - listen for partial responses
  onStreamChunk: (callback) => {
    ipcRenderer.on('stream-chunk', (event, data) => callback(data));
  },
  removeStreamListeners: () => {
    ipcRenderer.removeAllListeners('stream-chunk');
  }
});
