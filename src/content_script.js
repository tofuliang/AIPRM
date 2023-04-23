function injectStyle(file) {
  var link = document.createElement('link');
  link.href = chrome.runtime.getURL(file);
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.media = 'all';
  document.getElementsByTagName('HEAD')[0].appendChild(link);
}

injectStyle('style.css');

function injectScript(file, node, module = true) {
  var th = document.getElementsByTagName(node)[0];
  var s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.setAttribute('src', file);

  if (module) {
    s.setAttribute('type', 'module');
  }

  th.appendChild(s);
}

injectScript(chrome.runtime.getURL('inject.js'), 'body');

injectScript(chrome.runtime.getURL('readability.js'), 'body', false);

// open a port to the background script
let port = chrome.runtime.connect({ name: 'AIPRM' });

// listen for messages from the background script
port.onMessage.addListener((message) => {
  // if the message contains tokens, dispatch a custom event
  if (message.type === 'tokens') {
    document.dispatchEvent(
      new CustomEvent('AIPRM.tokens', { detail: { tokens: message.tokens } })
    );
  }
});
