window.onload = () => {
  const port = chrome.extension.connect({ name: 'youtubePlaylistGenerator' });

  function login() {
    port.postMessage({
      type: 'login',
    });
  }

  function logout() {
    port.postMessage({
      type: 'logout',
    });
  }

  const uiMethods = {
    login,
    logout,
  };

  // eslint-disable-next-line no-undef
  const ui = new UI(uiMethods);

  port.onMessage.addListener((msg) => {
    console.log(msg);
    switch (msg.type) {
      case 'status':
        ui.updateStatus(msg.body);
        break;

      default:
    }
  });

  chrome.extension.onMessage.addListener((msg) => {
    switch (msg.type) {
      case 'videoIds':
        ui.updateVideoCount(msg.videoIds.length);
        break;

      case 'quickPlaylists':
        ui.addQuickPlaylists(msg.quickPlaylists);
        break;

      default:
        break;
    }
  });

  chrome.tabs.executeScript({ file: './extractor.js' });
};
