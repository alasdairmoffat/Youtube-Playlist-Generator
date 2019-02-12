const apiKey = 'AIzaSyDXAncnFBw3u0AcMo_Ikp-E-wwevie5nyY';

const youtube = new Youtube(apiKey);

let portToPopup;

chrome.extension.onMessage.addListener(async (msg) => {
  switch (msg.type) {
    case 'videoIds':
      if (msg.videoIds.length > 0) {
        const quickPlaylists = await Youtube.createQuickPlaylists(msg.videoIds);
        chrome.extension.sendMessage({
          type: 'quickPlaylists',
          quickPlaylists,
        });
      }
      break;
    default:
      break;
  }
});

function sendStatus(port) {
  const isSignedIn = youtube.isSignedIn();
  port.postMessage({
    type: 'status',
    body: { isSignedIn },
  });
}

chrome.extension.onConnect.addListener((port) => {
  portToPopup = port;
  sendStatus(port);

  portToPopup.onMessage.addListener(async (msg) => {
    switch (msg.type) {
      case 'login':
        await youtube.login({
          interactive: true,
          callback: () => {
            sendStatus(port);
          },
        });
        break;
      case 'logout':
        await youtube.logout({
          callback: () => {
            sendStatus(port);
          },
        });
        break;
      default:
    }
  });
});
