/* global UI */

window.onload = () => {
  const port = chrome.runtime.connect({ name: 'youtubePlaylistGenerator' });

  const ui = new UI();

  port.onMessage.addListener((msg) => {
    switch (msg.type) {
      case 'error':
        ui.displayError(msg.body);
        break;

      case 'quickPlaylists':
        ui.showQuickPlaylists(msg.body.quickPlaylists);
        break;

      default:
    }
  });

  chrome.tabs.executeScript(
    { file: '/extractor.js', allFrames: true },
    (returnArray) => {
      const videoIds = returnArray
        ? Array.from(new Set(returnArray.flat()))
        : [];

      ui.updateVideoCount(videoIds.length);
      port.postMessage({
        type: 'videoIds',
        body: { videoIds },
      });

      // Catch errors
      const e = chrome.runtime.lastError;
      if (e) {
        console.log(`Runtime Error: ${e.message}`);
      }
    },
  );
};
