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

  function getChannelPlaylists() {
    port.postMessage({
      type: 'getChannelPlaylists',
    });
  }

  function createPlaylist(title) {
    port.postMessage({
      type: 'createPlaylist',
      body: {
        title,
      },
    });
  }

  function cancel() {
    port.postMessage({
      type: 'cancel',
    });
  }

  const buttonFunctions = {
    login,
    logout,
    getChannelPlaylists,
    createPlaylist,
    cancel,
  };

  // eslint-disable-next-line no-undef
  const ui = new UI(buttonFunctions);

  function addToPlaylist(playlistId) {
    port.postMessage({
      type: 'addToPlaylist',
      body: { playlistId },
    });
    // Add button to open playlist on completion?
    // https://www.youtube.com/playlist?list=${playlistId}&disable_polymer=true
  }

  port.onMessage.addListener((msg) => {
    console.log(msg);
    switch (msg.type) {
      case 'status':
        ui.updateStatus(msg.body);
        break;

      case 'quickPlaylists':
        ui.showQuickPlaylists(msg.body.quickPlaylists);
        break;

      case 'channelPlaylists':
        ui.showChannelPlaylists(msg.body.channelPlaylists, addToPlaylist);
        break;

      default:
    }
  });

  chrome.tabs.executeScript({ file: './extractor.js', allFrames: true }, (returnArray) => {
    const videoIds = returnArray ? Array.from(new Set(returnArray.flat())) : [];

    ui.updateVideoCount(videoIds.length);
    port.postMessage({
      type: 'videoIds',
      body: { videoIds },
    });
  });
};
