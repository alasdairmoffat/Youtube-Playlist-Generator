// chrome.runtime.onInstalled.addListener(() => {
const apiKey = 'AIzaSyDXAncnFBw3u0AcMo_Ikp-E-wwevie5nyY';
// eslint-disable-next-line no-undef
const youtube = new Youtube(apiKey);
// eslint-disable-next-line no-undef
const messageHandler = new MessageHandler(youtube);

chrome.runtime.onConnect.addListener((port) => {
  messageHandler.updatePort(port);
});
// });
