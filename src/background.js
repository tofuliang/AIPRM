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
