/* global Youtube MessageHandler */
function initialise() {
  const apiKey = '';
  const youtube = new Youtube(apiKey);
  const messageHandler = new MessageHandler(youtube);

  chrome.runtime.onConnect.addListener((port) => {
    messageHandler.updatePort(port);
  });
}

chrome.runtime.onInstalled.addListener(initialise);
chrome.runtime.onStartup.addListener(initialise);
