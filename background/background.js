/* global Youtube MessageHandler */
chrome.runtime.onInstalled.addListener(() => {
  const apiKey = 'AIzaSyDXAncnFBw3u0AcMo_Ikp-E-wwevie5nyY';
  const youtube = new Youtube(apiKey);
  const messageHandler = new MessageHandler(youtube);

  chrome.runtime.onConnect.addListener((port) => {
    messageHandler.updatePort(port);
  });
});
