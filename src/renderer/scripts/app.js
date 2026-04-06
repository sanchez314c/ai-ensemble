/**
 * AI Ensemble Renderer Application
 * Neo-Noir Glass Monitor Design System
 */

(function() {
  'use strict';

  const MODEL_COLORS = {
    claude: { name: 'Claude', color: '#14b8a6', bg: 'rgba(20,184,166,0.15)' },
    gpt: { name: 'GPT', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
    deepseek: { name: 'DeepSeek', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    gemini: { name: 'Gemini', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    ollama: { name: 'Ollama', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    grok: { name: 'Grok', color: '#e74c3c', bg: 'rgba(231,76,60,0.15)' },
    openrouter: { name: 'OpenRouter', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
    groq: { name: 'Groq', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
    mistral: { name: 'Mistral', color: '#ff7000', bg: 'rgba(255,112,0,0.15)' },
    perplexity: { name: 'Perplexity', color: '#22d3ee', bg: 'rgba(34,211,238,0.15)' },
    together: { name: 'Together', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' }
  };

  const state = {
    currentConversationId: null,
    activeModels: new Set(['claude', 'gpt']),
    synthesizeEnabled: true,
    isLoading: false,
    conversations: [],
    reasonMode: false,
    recognition: null
  };

  const el = {};

  function init() {
    cacheElements();
    setupListeners();
    loadSettings();
    loadConversations();
    updateActiveModelCount();
    updateStatusBar();
    initVoice();
  }

  function cacheElements() {
    el.chatArea = document.getElementById('chat-area');
    el.queryInput = document.getElementById('query-input');
    el.sendBtn = document.getElementById('send-btn');
    el.charCount = document.getElementById('char-count');
    el.modelToggles = document.querySelectorAll('.model-toggle');
    el.activeModelCount = document.getElementById('active-model-count');
    el.synthesisCheckbox = document.getElementById('synthesis-checkbox');
    el.reasonBtn = document.getElementById('reason-btn');
    el.voiceBtn = document.getElementById('voice-btn');
    el.conversationList = document.getElementById('conversation-list');
    el.searchInput = document.getElementById('search-conversations');
    el.newChatBtn = document.getElementById('new-chat-btn');
    el.settingsBtn = document.getElementById('settings-btn');
    el.exportBtn = document.getElementById('export-btn');
    el.welcomeScreen = document.getElementById('welcome-screen');
    el.messagesContainer = document.getElementById('messages-container');
    el.quickChips = document.querySelectorAll('.quick-action-chip');
    el.settingsModal = document.getElementById('settings-modal');
    el.exportModal = document.getElementById('export-modal');
    el.saveSettingsBtn = document.getElementById('save-settings-btn');
    el.closeSettingsBtn = document.getElementById('close-settings');
    el.closeExportBtn = document.getElementById('close-export');
    el.exportOptions = document.querySelectorAll('.export-option');
    el.aboutBtn = document.getElementById('about-btn');
    el.aboutOverlay = document.getElementById('aboutOverlay');
    el.aboutCloseBtn = document.getElementById('about-close-btn');
    el.aboutGithubLink = document.getElementById('aboutGithubLink');
    el.statusBarText = document.getElementById('statusBarText');
    el.statusBarItems = document.getElementById('statusBarItems');
    el.statusBarIndicator = document.getElementById('statusBarIndicator');
  }

  function setupListeners() {
    el.sendBtn.addEventListener('click', handleSend);
    el.queryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });
    el.queryInput.addEventListener('input', handleResize);

    el.modelToggles.forEach(t => t.addEventListener('click', handleModelToggle));

    if (el.synthesisCheckbox) {
      el.synthesisCheckbox.addEventListener('change', () => {
        state.synthesizeEnabled = el.synthesisCheckbox.checked;
      });
    }

    el.reasonBtn.addEventListener('click', () => {
      state.reasonMode = !state.reasonMode;
      el.reasonBtn.classList.toggle('active');
    });

    el.voiceBtn.addEventListener('click', handleVoiceToggle);

    el.quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        el.queryInput.value = chip.dataset.query;
        handleResize();
        handleSend();
      });
    });

    el.newChatBtn.addEventListener('click', newConversation);
    el.searchInput.addEventListener('input', handleSearch);

    // Settings modal
    el.settingsBtn.addEventListener('click', function() {
      showModal(el.settingsModal);
      // Fetch models for all configured providers
      var allProviders = ['claude', 'gpt', 'deepseek', 'gemini', 'ollama', 'grok', 'openrouter', 'groq', 'mistral', 'perplexity', 'together'];
      allProviders.forEach(function(p) { fetchModelsForProvider(p); });
      // Re-apply saved model values after fetches complete
      setTimeout(function() {
        if (state.savedModels) {
          Object.keys(state.savedModels).forEach(function(key) {
            setVal('model-' + key, state.savedModels[key]);
          });
        }
      }, 1500);
    });
    el.saveSettingsBtn.addEventListener('click', saveSettings);
    el.closeSettingsBtn.addEventListener('click', () => hideModal(el.settingsModal));

    // Export modal
    el.exportBtn.addEventListener('click', () => {
      if (state.currentConversationId) showModal(el.exportModal);
      else notify('No conversation selected', 'error');
    });
    el.closeExportBtn.addEventListener('click', () => hideModal(el.exportModal));
    el.exportOptions.forEach(opt => opt.addEventListener('click', handleExport));

    // About modal
    el.aboutBtn.addEventListener('click', openAboutModal);
    el.aboutCloseBtn.addEventListener('click', closeAboutModal);
    el.aboutOverlay.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeAboutModal();
    });
    el.aboutGithubLink.addEventListener('click', (e) => {
      e.preventDefault();
      const url = 'https://github.com/sanchez314c/ai-ensemble';
      if (window.api && window.api.openExternal) {
        window.api.openExternal(url);
      }
    });

    // Modal overlay close
    el.settingsModal.addEventListener('click', (e) => {
      if (e.target === el.settingsModal) hideModal(el.settingsModal);
    });
    el.exportModal.addEventListener('click', (e) => {
      if (e.target === el.exportModal) hideModal(el.exportModal);
    });

    // Refresh model buttons
    document.querySelectorAll('.btn-refresh-models').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var provider = btn.dataset.provider;
        btn.classList.add('spinning');
        fetchModelsForProvider(provider).then(function() {
          btn.classList.remove('spinning');
        });
      });
    });

    // Window controls
    const winMin = document.getElementById('win-minimize');
    const winMax = document.getElementById('win-maximize');
    const winClose = document.getElementById('win-close');
    if (winMin) winMin.addEventListener('click', () => window.api.windowMinimize());
    if (winMax) winMax.addEventListener('click', () => window.api.windowMaximize());
    if (winClose) winClose.addEventListener('click', () => window.api.windowClose());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAboutModal();
        hideModal(el.settingsModal);
        hideModal(el.exportModal);
      }
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'n': e.preventDefault(); newConversation(); break;
          case 'e': e.preventDefault(); if (state.currentConversationId) showModal(el.exportModal); break;
          case ',': e.preventDefault(); showModal(el.settingsModal); break;
          case '1': case '2': case '3': case '4': case '5':
            e.preventDefault();
            const toggles = Array.from(el.modelToggles);
            if (toggles[parseInt(e.key) - 1]) toggles[parseInt(e.key) - 1].click();
            break;
        }
      }
    });
  }

  // About modal
  function openAboutModal() {
    if (el.aboutOverlay) el.aboutOverlay.classList.add('active');
  }

  function closeAboutModal() {
    if (el.aboutOverlay) el.aboutOverlay.classList.remove('active');
  }

  // Status bar
  function updateStatusBar() {
    const count = state.conversations ? state.conversations.length : 0;
    if (el.statusBarItems) {
      el.statusBarItems.textContent = count + ' conversation' + (count !== 1 ? 's' : '');
    }
    if (el.statusBarText) {
      el.statusBarText.textContent = state.isLoading ? 'Status: Querying...' : 'Status: Ready';
    }
    if (el.statusBarIndicator) {
      el.statusBarIndicator.classList.toggle('offline', state.isLoading);
    }
  }

  // Modal helpers
  function showModal(modal) { modal.style.display = 'flex'; }
  function hideModal(modal) { modal.style.display = 'none'; }

  // Model selection
  function handleModelToggle(e) {
    const toggle = e.currentTarget;
    const model = toggle.dataset.model;
    if (state.activeModels.has(model)) {
      if (state.activeModels.size > 1) {
        state.activeModels.delete(model);
        toggle.classList.remove('active');
      }
    } else {
      state.activeModels.add(model);
      toggle.classList.add('active');
    }
    updateActiveModelCount();
  }

  function updateActiveModelCount() {
    if (el.activeModelCount) el.activeModelCount.textContent = state.activeModels.size;
  }

  // Voice
  function initVoice() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      state.recognition = new SpeechRecognition();
      state.recognition.continuous = false;
      state.recognition.interimResults = false;
      state.recognition.lang = 'en-US';
      state.recognition.onresult = (ev) => {
        el.queryInput.value += (el.queryInput.value ? ' ' : '') + ev.results[0][0].transcript;
        handleResize();
        stopVoice();
      };
      state.recognition.onerror = () => stopVoice();
      state.recognition.onend = () => stopVoice();
    } else {
      if (el.voiceBtn) el.voiceBtn.style.display = 'none';
    }
  }

  function handleVoiceToggle() {
    if (el.voiceBtn.classList.contains('recording')) stopVoice();
    else startVoice();
  }

  function startVoice() {
    if (state.recognition) { state.recognition.start(); el.voiceBtn.classList.add('recording', 'active'); }
  }

  function stopVoice() {
    if (state.recognition) { try { state.recognition.stop(); } catch(e) {} el.voiceBtn.classList.remove('recording', 'active'); }
  }

  // Textarea
  function handleResize() {
    el.queryInput.style.height = 'auto';
    el.queryInput.style.height = Math.min(el.queryInput.scrollHeight, 200) + 'px';
    if (el.charCount) el.charCount.textContent = el.queryInput.value.length;
  }

  // Send message
  async function handleSend() {
    const query = el.queryInput.value.trim();
    if (!query || state.isLoading) return;

    state.isLoading = true;
    el.sendBtn.disabled = true;
    updateStatusBar();

    try {
      if (!state.currentConversationId) {
        const title = query.substring(0, 50) + (query.length > 50 ? '...' : '');
        const conv = await window.api.createConversation(title);
        state.currentConversationId = conv.id;
        await loadConversations();
      }

      let finalQuery = query;
      if (state.reasonMode) finalQuery = 'Think step by step. ' + query;

      el.queryInput.value = '';
      handleResize();

      el.welcomeScreen.style.display = 'none';
      el.messagesContainer.style.display = 'flex';

      renderUserMessage(query);

      const loadingEl = createLoadingIndicators();
      el.messagesContainer.appendChild(loadingEl);
      scrollToBottom();

      const result = await window.api.queryModels({
        query: finalQuery,
        models: Array.from(state.activeModels),
        conversationId: state.currentConversationId,
        synthesize: state.synthesizeEnabled && state.activeModels.size > 1
      });

      loadingEl.remove();

      if (result.responses && result.responses.length > 0) {
        const now = new Date().toISOString();
        result.responses.forEach(resp => {
          if (resp.success === false || resp.error) {
            renderErrorMessage(resp.provider, resp.error || 'Unknown error', now);
          } else {
            renderAIResponse(resp.provider, resp.content, now);
          }
        });

        if (result.synthesis && result.synthesis.content) {
          renderSynthesis(result.synthesis.content, new Date().toISOString());
        }
      } else {
        renderGeneralError('No responses received from models');
      }

      scrollToBottom();
      await loadConversations();

    } catch (error) {
      console.error('Send error:', error);
      const loader = el.messagesContainer.querySelector('.loading-indicators');
      if (loader) loader.remove();
      renderGeneralError(error.message || 'Failed to send message');
    } finally {
      state.isLoading = false;
      el.sendBtn.disabled = false;
      updateStatusBar();
      el.queryInput.focus();
    }
  }

  function createLoadingIndicators() {
    const group = document.createElement('div');
    group.className = 'message-group loading-indicators';
    state.activeModels.forEach(modelId => {
      const c = MODEL_COLORS[modelId];
      const div = document.createElement('div');
      div.className = 'model-loading';
      div.innerHTML = '<div class="spinner" style="border-top-color: ' + c.color + ';"></div><span style="color: ' + c.color + ';">' + c.name + ' is thinking...</span>';
      group.appendChild(div);
    });
    return group;
  }

  // Message rendering
  function renderUserMessage(text) {
    const group = document.createElement('div');
    group.className = 'message-group';
    const msg = document.createElement('div');
    msg.className = 'message-user';
    msg.textContent = text;
    group.appendChild(msg);
    el.messagesContainer.appendChild(group);
  }

  function renderAIResponse(modelId, text, timestamp) {
    const c = MODEL_COLORS[modelId] || { name: modelId, color: '#9a9aa6', bg: 'rgba(154,154,166,0.15)' };
    const group = document.createElement('div');
    group.className = 'message-group';
    const msg = document.createElement('div');
    msg.className = 'message-ai';
    msg.dataset.model = modelId;
    msg.innerHTML =
      '<div class="message-header">' +
        '<span class="model-badge" style="background:' + c.bg + ';color:' + c.color + ';">' + c.name + '</span>' +
        '<span class="message-timestamp">' + formatTime(timestamp) + '</span>' +
      '</div>' +
      '<div class="message-body">' + parseMarkdown(text) + '</div>' +
      '<div class="message-actions">' +
        '<button class="message-action-btn copy-btn" title="Copy">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>' +
          '<span>Copy</span>' +
        '</button>' +
      '</div>';
    msg.querySelector('.copy-btn').addEventListener('click', function() { copyText(text, this); });
    group.appendChild(msg);
    el.messagesContainer.appendChild(group);
  }

  function renderSynthesis(text, timestamp) {
    const group = document.createElement('div');
    group.className = 'message-group';
    const msg = document.createElement('div');
    msg.className = 'message-synthesis';
    msg.innerHTML =
      '<div class="message-header">' +
        '<span class="model-badge">SYNTHESIZED</span>' +
        '<span class="message-timestamp">' + formatTime(timestamp) + '</span>' +
      '</div>' +
      '<div class="message-body">' + parseMarkdown(text) + '</div>' +
      '<div class="message-actions">' +
        '<button class="message-action-btn copy-btn" title="Copy">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>' +
          '<span>Copy</span>' +
        '</button>' +
      '</div>';
    msg.querySelector('.copy-btn').addEventListener('click', function() { copyText(text, this); });
    group.appendChild(msg);
    el.messagesContainer.appendChild(group);
  }

  function renderErrorMessage(modelId, error, timestamp) {
    const c = MODEL_COLORS[modelId] || { name: modelId, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
    const group = document.createElement('div');
    group.className = 'message-group';
    const msg = document.createElement('div');
    msg.className = 'message-ai';
    msg.dataset.model = modelId;
    msg.style.opacity = '0.6';
    msg.innerHTML =
      '<div class="message-header">' +
        '<span class="model-badge" style="background:' + c.bg + ';color:' + c.color + ';">' + c.name + '</span>' +
        '<span class="message-timestamp">' + formatTime(timestamp) + '</span>' +
      '</div>' +
      '<div class="message-body" style="color:#ef4444;">Error: ' + escapeHtml(error) + '</div>';
    group.appendChild(msg);
    el.messagesContainer.appendChild(group);
  }

  function renderGeneralError(message) {
    const group = document.createElement('div');
    group.className = 'message-group';
    const div = document.createElement('div');
    div.className = 'message-ai';
    div.style.borderLeftColor = '#ef4444';
    div.innerHTML = '<div class="message-body" style="color:#ef4444;"><strong>Error:</strong> ' + escapeHtml(message) + '</div>';
    group.appendChild(div);
    el.messagesContainer.appendChild(group);
  }

  // Markdown parser
  function parseMarkdown(text) {
    let html = escapeHtml(text);

    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, function(m, lang, code) {
      return '<pre><code class="language-' + (lang || 'text') + '">' + code.trim() + '</code></pre>';
    });

    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
    html = html.replace(/(?<!_)_([^_]+?)_(?!_)/g, '<em>$1</em>');

    html = html.replace(/\[(.+?)\]\((.+?)\)/g, function(match, text, url) {
      if (/^(https?:\/\/|mailto:|#)/.test(url)) {
        return '<a href="' + url + '" target="_blank" rel="noopener">' + text + '</a>';
      }
      return text;
    });

    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');

    html = html.replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, function(m, header, rows) {
      var ths = header.split('|').filter(function(c) { return c.trim(); }).map(function(c) { return '<th>' + c.trim() + '</th>'; }).join('');
      var trs = rows.trim().split('\n').map(function(r) {
        var tds = r.split('|').filter(function(c) { return c.trim(); }).map(function(c) { return '<td>' + c.trim() + '</td>'; }).join('');
        return '<tr>' + tds + '</tr>';
      }).join('');
      return '<table><thead><tr>' + ths + '</tr></thead><tbody>' + trs + '</tbody></table>';
    });

    html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    var blocks = html.split('\n\n');
    html = blocks.map(function(block) {
      var trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|pre|ul|ol|table|blockquote|hr|li)/.test(trimmed)) return trimmed;
      return '<p>' + trimmed.replace(/\n/g, '<br>') + '</p>';
    }).join('\n');

    return html;
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Clipboard
  async function copyText(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      var orig = btn.innerHTML;
      btn.innerHTML = '<span style="color:#14b8a6;font-size:12px;">Copied!</span>';
      setTimeout(function() { btn.innerHTML = orig; }, 2000);
    } catch(e) { console.error('Copy failed:', e); }
  }

  // Conversations
  async function loadConversations() {
    try {
      state.conversations = await window.api.getConversations();
      renderConversationList(state.conversations);
      updateStatusBar();
    } catch(e) { console.error('Load conversations:', e); }
  }

  function renderConversationList(convos) {
    el.conversationList.innerHTML = '';
    if (!convos || convos.length === 0) {
      el.conversationList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-dim);font-size:12px;">No conversations yet</div>';
      return;
    }
    var sorted = convos.slice().sort(function(a, b) { return new Date(b.updatedAt || b.updated_at) - new Date(a.updatedAt || a.updated_at); });
    sorted.forEach(function(conv) {
      var item = document.createElement('div');
      item.className = 'conversation-item' + (conv.id === state.currentConversationId ? ' active' : '');
      item.innerHTML =
        '<div class="conv-title">' + escapeHtml(conv.title) + '</div>' +
        '<div class="conv-meta">' +
          '<span class="conv-date">' + formatDate(conv.updatedAt || conv.updated_at) + '</span>' +
          '<button class="conv-delete" title="Delete">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
          '</button>' +
        '</div>';
      item.addEventListener('click', function(e) {
        if (!e.target.closest('.conv-delete')) selectConversation(conv.id);
      });
      item.querySelector('.conv-delete').addEventListener('click', function(e) {
        e.stopPropagation();
        deleteConversation(conv.id);
      });
      el.conversationList.appendChild(item);
    });
  }

  async function selectConversation(id) {
    try {
      var conv = await window.api.getConversation(id);
      if (!conv) return;
      state.currentConversationId = id;

      el.messagesContainer.innerHTML = '';
      el.welcomeScreen.style.display = 'none';
      el.messagesContainer.style.display = 'flex';

      if (conv.messages && conv.messages.length > 0) {
        conv.messages.forEach(function(msg) {
          if (msg.role === 'user') renderUserMessage(msg.content);
          else if (msg.isSynthesis || msg.is_synthesis) renderSynthesis(msg.content, msg.createdAt || msg.created_at);
          else renderAIResponse(msg.model, msg.content, msg.createdAt || msg.created_at);
        });
      }
      scrollToBottom();
      renderConversationList(state.conversations);
    } catch(e) { console.error('Select conversation:', e); }
  }

  function newConversation() {
    state.currentConversationId = null;
    el.messagesContainer.innerHTML = '';
    el.messagesContainer.style.display = 'none';
    el.welcomeScreen.style.display = '';
    el.queryInput.focus();
    renderConversationList(state.conversations);
  }

  async function deleteConversation(id) {
    if (!confirm('Delete this conversation?')) return;
    try {
      await window.api.deleteConversation(id);
      if (state.currentConversationId === id) newConversation();
      await loadConversations();
    } catch(e) { console.error('Delete conversation:', e); }
  }

  function handleSearch(e) {
    var q = e.target.value.toLowerCase().trim();
    if (!q) { renderConversationList(state.conversations); return; }
    renderConversationList(state.conversations.filter(function(c) { return c.title.toLowerCase().includes(q); }));
  }

  // Settings
  async function loadSettings() {
    try {
      var s = await window.api.getSettings();
      if (s.apiKeys) {
        setVal('key-anthropic', s.apiKeys.anthropic);
        setVal('key-openai', s.apiKeys.openai);
        setVal('key-deepseek', s.apiKeys.deepseek);
        setVal('key-google', s.apiKeys.google);
        setVal('key-xai', s.apiKeys.xai);
        setVal('key-openrouter', s.apiKeys.openrouter);
        setVal('key-groq', s.apiKeys.groq);
        setVal('key-mistral', s.apiKeys.mistral);
        setVal('key-perplexity', s.apiKeys.perplexity);
        setVal('key-together', s.apiKeys.together);
        setVal('key-ollama-url', s.apiKeys.ollamaUrl || 'http://localhost:11434');
      }
      if (s.envKeys) {
        var envMap = {
          anthropic: 'env-badge-anthropic',
          openai: 'env-badge-openai',
          deepseek: 'env-badge-deepseek',
          google: 'env-badge-google',
          xai: 'env-badge-xai',
          openrouter: 'env-badge-openrouter',
          groq: 'env-badge-groq',
          mistral: 'env-badge-mistral',
          perplexity: 'env-badge-perplexity',
          together: 'env-badge-together'
        };
        var keyInputMap = {
          anthropic: 'key-anthropic',
          openai: 'key-openai',
          deepseek: 'key-deepseek',
          google: 'key-google',
          xai: 'key-xai',
          openrouter: 'key-openrouter',
          groq: 'key-groq',
          mistral: 'key-mistral',
          perplexity: 'key-perplexity',
          together: 'key-together'
        };
        Object.keys(envMap).forEach(function(key) {
          var badge = document.getElementById(envMap[key]);
          if (badge) {
            if (s.envKeys[key]) badge.classList.remove('hidden');
            else badge.classList.add('hidden');
          }
          // Show placeholder if env key available but field empty
          if (s.envKeys[key]) {
            var input = document.getElementById(keyInputMap[key]);
            if (input && !input.value) {
              input.placeholder = '\u2022\u2022\u2022\u2022\u2022 (from environment)';
            }
          }
        });
      }
      if (s.models) {
        state.savedModels = s.models;
        setVal('model-claude', s.models.claude);
        setVal('model-gpt', s.models.gpt);
        setVal('model-deepseek', s.models.deepseek);
        setVal('model-gemini', s.models.gemini);
        setVal('model-ollama', s.models.ollama);
        setVal('model-grok', s.models.grok);
        setVal('model-openrouter', s.models.openrouter);
        setVal('model-groq', s.models.groq);
        setVal('model-mistral', s.models.mistral);
        setVal('model-perplexity', s.models.perplexity);
        setVal('model-together', s.models.together);
      }
      if (s.synthesis) {
        setVal('synthesis-provider', s.synthesis.provider);
      }
      if (s.defaultModels) {
        state.activeModels = new Set(s.defaultModels);
        el.modelToggles.forEach(function(t) {
          if (state.activeModels.has(t.dataset.model)) t.classList.add('active');
          else t.classList.remove('active');
        });
        updateActiveModelCount();
      }
    } catch(e) { console.error('Load settings:', e); }
  }

  async function saveSettings() {
    try {
      var settings = {
        apiKeys: {
          anthropic: getVal('key-anthropic'),
          openai: getVal('key-openai'),
          deepseek: getVal('key-deepseek'),
          google: getVal('key-google'),
          xai: getVal('key-xai'),
          openrouter: getVal('key-openrouter'),
          groq: getVal('key-groq'),
          mistral: getVal('key-mistral'),
          perplexity: getVal('key-perplexity'),
          together: getVal('key-together'),
          ollamaUrl: getVal('key-ollama-url') || 'http://localhost:11434'
        },
        models: {
          claude: getVal('model-claude'),
          gpt: getVal('model-gpt'),
          deepseek: getVal('model-deepseek'),
          gemini: getVal('model-gemini'),
          ollama: getVal('model-ollama'),
          grok: getVal('model-grok'),
          openrouter: getVal('model-openrouter'),
          groq: getVal('model-groq'),
          mistral: getVal('model-mistral'),
          perplexity: getVal('model-perplexity'),
          together: getVal('model-together')
        },
        synthesis: {
          enabled: true,
          provider: getVal('synthesis-provider') || 'claude'
        },
        defaultModels: Array.from(state.activeModels),
        theme: 'dark'
      };

      await window.api.saveSettings(settings);
      hideModal(el.settingsModal);
      notify('Settings saved', 'success');
    } catch(e) {
      console.error('Save settings:', e);
      notify('Failed to save settings', 'error');
    }
  }

  async function fetchModelsForProvider(provider) {
    var select = document.getElementById('model-' + provider);
    if (!select) return;

    // Save current selection
    var currentVal = select.value;

    // Show loading state
    select.innerHTML = '<option value="">Fetching models...</option>';

    try {
      var result = await window.api.fetchProviderModels(provider);
      if (result.error) {
        select.innerHTML = '<option value="">Error: ' + escapeHtml(result.error) + '</option>';
        // Re-add current value if we had one
        if (currentVal) {
          var opt = document.createElement('option');
          opt.value = currentVal;
          opt.textContent = currentVal;
          opt.selected = true;
          select.appendChild(opt);
        }
        return;
      }

      select.innerHTML = '';
      if (result.models && result.models.length > 0) {
        // Sort alphabetically
        result.models.sort();
        result.models.forEach(function(model) {
          var opt = document.createElement('option');
          opt.value = model;
          opt.textContent = model;
          if (model === currentVal) opt.selected = true;
          select.appendChild(opt);
        });
        // If current value wasn't in the list, add it
        if (currentVal && !result.models.includes(currentVal)) {
          var opt = document.createElement('option');
          opt.value = currentVal;
          opt.textContent = currentVal + ' (custom)';
          opt.selected = true;
          select.prepend(opt);
        }
      } else {
        select.innerHTML = '<option value="">No models available</option>';
        if (currentVal) {
          var opt = document.createElement('option');
          opt.value = currentVal;
          opt.textContent = currentVal;
          opt.selected = true;
          select.appendChild(opt);
        }
      }
    } catch(e) {
      console.error('Fetch models for ' + provider + ':', e);
      select.innerHTML = '<option value="">Fetch failed</option>';
      if (currentVal) {
        var opt = document.createElement('option');
        opt.value = currentVal;
        opt.textContent = currentVal;
        opt.selected = true;
        select.appendChild(opt);
      }
    }
  }

  function getVal(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }
  function setVal(id, val) { var e = document.getElementById(id); if (e && val) e.value = val; }

  // Export
  async function handleExport(e) {
    var format = e.currentTarget.dataset.format;
    try {
      var content = await window.api.exportConversation(state.currentConversationId, format);
      var blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'conversation.' + (format === 'json' ? 'json' : 'md');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      hideModal(el.exportModal);
      notify('Exported successfully', 'success');
    } catch(err) {
      console.error('Export:', err);
      notify('Export failed', 'error');
    }
  }

  // Utilities
  function scrollToBottom() {
    requestAnimationFrame(function() { el.chatArea.scrollTop = el.chatArea.scrollHeight; });
  }

  function formatDate(str) {
    if (!str) return '';
    var d = new Date(str);
    var now = new Date();
    var diff = now - d;
    var mins = Math.floor(diff / 60000);
    var hrs = Math.floor(diff / 3600000);
    var days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    if (hrs < 24) return hrs + 'h ago';
    if (days === 1) return 'yesterday';
    if (days < 7) return days + 'd ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatTime(str) {
    if (!str) return '';
    return new Date(str).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  function notify(msg, type) {
    var n = document.createElement('div');
    n.textContent = msg;
    n.style.cssText = 'position:fixed;top:20px;right:20px;background:' + (type === 'success' ? '#14b8a6' : '#ef4444') + ';color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500;z-index:10000;box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:fadeIn 0.3s ease;';
    document.body.appendChild(n);
    setTimeout(function() { n.style.opacity = '0'; n.style.transition = 'opacity 0.3s'; setTimeout(function() { n.remove(); }, 300); }, 3000);
  }

  // Init
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
