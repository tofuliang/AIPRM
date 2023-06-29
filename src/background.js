'use strict';

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'https://chat.openai.com/chat' });
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.query({ url: 'https://chat.openai.com/chat' }, function ([tab]) {
    if (tab) {
      chrome.tabs.update(tab.id, { active: true });
    } else {
      chrome.tabs.create({ url: 'https://chat.openai.com/chat' });
    }
  });
});

let connections = [];

// listen for connections from content scripts
chrome.runtime.onConnect.addListener(function (port) {
  // only accept connections from our extension
  if (port.name !== 'AIPRM') {
    return;
  }

  // add connection to list of connections with tab id as key
  connections[port.sender.tab.id] = port;

  // add disconnect listener to remove connection from list
  port.onDisconnect.addListener(function () {
    delete connections[port.sender.tab.id];
  });

  // listen for messages from content script
  port.onMessage.addListener(function (message) {
    // only accept messages from our extension
    if (message.from !== 'AIPRM') {
      return;
    }

    if (message.data.type === 'AIPRM.favoritePrompts') {
      // remove all context menu items
      chrome.contextMenus.removeAll();

      // insert new context menu items
      insertContextMenuItems(message.data.favoritePrompts);
    }
  });
});

// listen for messages from AIPRM APP
chrome.runtime.onMessageExternal.addListener(function (
  request,
  sender,
  sendResponse
) {
  // only accept messages from our extension with tokens
  if (!request.tokens) {
    sendResponse({ success: false });
    return;
  }

  // no connections available
  if (!connections.length) {
    sendResponse({ success: false });
    return;
  }

  // send to connections
  for (let tabId in connections) {
    connections[tabId].postMessage({
      type: 'tokens',
      tokens: request.tokens,
    });
  }

  sendResponse({ success: true });
});

// mapping of prompt IDs to context menu item IDs
const contextMenuPromptMap = {
  AIPRM_MIDJOURNEY_V5_LIVE: '1837526819881603072',
  AIPRM_OUTRANK_ARTICLE: '1000101',
  AIPRM_OUTRANK_ARTICLE_LIVE: '1806246638470299648',
  AIPRM_SUMMARIZE: '1783773498066604032',
  AIPRM_SUMMARIZE_LIVE: '1837503888648581120',
  AIPRM_FIND_QUESTIONS: '1000109',
  AIPRM_FIND_QUESTIONS_LIVE: '1837517873166934016',
  AIPRM_SOCIAL_MEDIA_POSTS_LIVE: '1837511372687810560',
  AIPRM_SPELLING_GRAMMAR: '1788887681418391552',
  AIPRM_CUSTOM: '',
};

// Handle context menu item clicks
chrome.contextMenus.onClicked.addListener(function (info) {
  let prompt = `${[info.selectionText || '', info.pageUrl].join('\n\n')}`;
  let promptID =
    info.menuItemId === 'AIPRM_CUSTOM'
      ? ''
      : contextMenuPromptMap[info.menuItemId] || info.menuItemId;

  // remove _LIVE suffix
  promptID = promptID.replace('_LIVE', '');

  // menu item ID ends with _LIVE = live crawling
  if (info.menuItemId.endsWith('_LIVE')) {
    prompt = info.pageUrl;
  }

  // open new tab with AIPRM and prefill AIPRM_Prompt and AIPRM_PromptID
  chrome.tabs.create(
    {
      url: `https://chat.openai.com/${
        promptID ? `?AIPRM_PromptID=${promptID}` : ''
      }`,
    },
    function (newTab) {
      sendPromptMessageToTab(prompt, newTab.id);
    }
  );
});

// send prompt message to tab ID
function sendPromptMessageToTab(prompt, tabID) {
  chrome.tabs.sendMessage(
    tabID,
    {
      type: 'AIPRM.prompt',
      prompt,
    },
    function () {
      if (chrome.runtime.lastError) {
        // retry sending message
        setTimeout(function () {
          sendPromptMessageToTab(prompt, tabID);
        }, 1000);
      }
    }
  );
}

// Pre-fill prompt input with user input using omnibox
chrome.omnibox.onInputEntered.addListener((text) => {
  chrome.tabs.create({
    url: `https://chat.openai.com/?AIPRM_Prompt=${encodeURIComponent(text)}`,
  });
});

function insertContextMenuItems(favoritePrompts = []) {
  // Create a context menu item "AIPRM" with icon with sub-items
  chrome.contextMenus.create({
    id: 'AIPRM',
    title: 'AIPRM for ChatGPT',
    contexts: ['selection', 'page'],
  });

  // Favorites
  if (favoritePrompts.length > 0) {
    chrome.contextMenus.create({
      id: 'AIPRM_FAVORITES',
      parentId: 'AIPRM',
      title: 'Favorites',
      contexts: ['selection', 'page'],
      enabled: false,
    });
  }

  favoritePrompts?.forEach((prompt) => {
    chrome.contextMenus.create({
      id: prompt.ID,
      parentId: 'AIPRM',
      title: prompt.Title,
      contexts: ['selection', 'page'],
    });
  });

  if (favoritePrompts.length > 0) {
    // Separator
    chrome.contextMenus.create({
      id: 'AIPRM_SEPARATOR_FAVORITES',
      parentId: 'AIPRM',
      type: 'separator',
      contexts: ['selection', 'page'],
    });
  }

  // Non-Live Crawling context menu items
  chrome.contextMenus.create({
    id: 'AIPRM_HEADER',
    parentId: 'AIPRM',
    title: 'Suggested',
    contexts: ['selection', 'page'],
    enabled: false,
  });

  chrome.contextMenus.create({
    id: 'AIPRM_FIND_QUESTIONS',
    parentId: 'AIPRM',
    title: 'Find Questions',
    contexts: ['selection', 'page'],
  });

  chrome.contextMenus.create({
    id: 'AIPRM_OUTRANK_ARTICLE',
    parentId: 'AIPRM',
    title: 'Outrank Article',
    contexts: ['selection', 'page'],
  });

  chrome.contextMenus.create({
    id: 'AIPRM_SPELLING_GRAMMAR',
    parentId: 'AIPRM',
    title: 'Spelling and Grammar',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'AIPRM_SUMMARIZE',
    parentId: 'AIPRM',
    title: 'Summarize',
    contexts: ['selection'],
  });

  // Separator
  chrome.contextMenus.create({
    id: 'AIPRM_LIVE_CRAWLING',
    parentId: 'AIPRM',
    type: 'separator',
    contexts: ['selection', 'page'],
  });

  // Live Crawling context menu items
  chrome.contextMenus.create({
    id: 'AIPRM_LIVE_CRAWLING_HEADER',
    parentId: 'AIPRM',
    title: 'Live Crawling',
    contexts: ['selection', 'page'],
    enabled: false,
  });

  chrome.contextMenus.create({
    id: 'AIPRM_FIND_QUESTIONS_LIVE',
    parentId: 'AIPRM',
    title: 'Find Questions',
    contexts: ['selection', 'page'],
  });

  chrome.contextMenus.create({
    id: 'AIPRM_MIDJOURNEY_V5_LIVE',
    parentId: 'AIPRM',
    title: 'Midjourney V5 Prompts',
    contexts: ['selection', 'page'],
  });

  chrome.contextMenus.create({
    id: 'AIPRM_OUTRANK_ARTICLE_LIVE',
    parentId: 'AIPRM',
    title: 'Outrank Article',
    contexts: ['selection', 'page'],
  });

  chrome.contextMenus.create({
    id: 'AIPRM_SOCIAL_MEDIA_POSTS_LIVE',
    parentId: 'AIPRM',
    title: 'Social Media Posts',
    contexts: ['selection', 'page'],
  });

  chrome.contextMenus.create({
    id: 'AIPRM_SUMMARIZE_LIVE',
    parentId: 'AIPRM',
    title: 'Summarize',
    contexts: ['selection', 'page'],
  });

  // Separator
  chrome.contextMenus.create({
    id: 'AIPRM_SEPARATOR_CUSTOM',
    parentId: 'AIPRM',
    type: 'separator',
    contexts: ['selection', 'page'],
  });

  chrome.contextMenus.create({
    id: 'AIPRM_CUSTOM_HEADER',
    parentId: 'AIPRM',
    title: 'Custom',
    contexts: ['selection', 'page'],
    enabled: false,
  });

  // Custom Prompt context menu item
  chrome.contextMenus.create({
    id: 'AIPRM_CUSTOM',
    parentId: 'AIPRM',
    title: 'Custom Prompt',
    contexts: ['selection', 'page'],
  });
}
