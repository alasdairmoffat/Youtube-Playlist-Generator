class MessageHandler {
  constructor(youtube) {
    this.port = null;
    this.youtube = youtube;
  }

  updatePort(port) {
    this.port = port;
    this.port.onDisconnect.addListener(() => {
      this.port = null;
    });
    this.sendStatus();
    this.port.onMessage.addListener(this.messageListener.bind(this));
    chrome.extension.onMessage.addListener(this.receiveVideoIds.bind(this));
  }

  sendMessage(msg) {
    if (!this.port) {
      console.log('port disconnected');
    } else {
      try {
        this.port.postMessage(msg);
      } catch (error) {
        console.log(error);
      }
    }
  }

  sendStatus(complete = false) {
    // complete should be object {cancelled: bool}
    const isSignedIn = this.youtube.isSignedIn();
    const busy = this.youtube.isBusy();
    const body = {
      isSignedIn,
      busy,
    };
    if (complete) {
      body.complete = complete;
    }

    this.sendMessage({
      type: 'status',
      body,
    });
  }

  async sendChannelPlaylists(nextPageToken) {
    const channelPlaylists = nextPageToken
      ? await this.youtube.getChannelPlaylists(nextPageToken)
      : await this.youtube.getChannelPlaylists();

    const body = { channelPlaylists };

    if (channelPlaylists.nextPageToken) {
      console.log(channelPlaylists.nextPageToken);
      // sendChannelPlaylists(channelPlaylists.nextPageToken);
      body.incomplete = true;
    }

    this.sendMessage({
      type: 'channelPlaylists',
      body,
    });
  }

  async addAllVideos(playlistId, videoIds) {
    this.youtube.cancel = false;
    const numVideos = videoIds.length;

    for (let i = 0; i < numVideos; i += 1) {
      if (this.youtube.cancel) {
        this.youtube.cancel = false;
        this.youtube.setBusy(false);
        this.sendStatus({ cancelled: true });
        console.log('Process cancelled.');
        return;
      }
      this.youtube.setBusy({ current: i + 1, total: numVideos });
      this.sendStatus();
      console.log(`Adding video ${i + 1} of ${numVideos}.`);

      // eslint-disable-next-line no-await-in-loop
      await this.youtube.addVideo(playlistId, videoIds[i]);
    }

    this.youtube.setBusy(false);
    this.sendStatus({ cancelled: false });
    console.log(`All videos added to ${playlistId}.`);
  }

  async addToChannelPlaylist(playlistId) {
    const allVideoIds = [...this.youtube.videoIds];
    const videoIds = await this.youtube.avoidDuplicateVideos(playlistId, allVideoIds);

    this.addAllVideos(playlistId, videoIds);
  }

  async newPlaylist(title) {
    const data = await this.youtube.createPlaylist(title);
    const playlistId = data.id;
    const videoIds = [...this.youtube.videoIds];
    this.addAllVideos(playlistId, videoIds);
  }

  async receiveVideoIds(videoIds) {
    if (videoIds.length > 0) {
      this.youtube.videoIds = videoIds;
      // eslint-disable-next-line no-undef
      const quickPlaylists = await Youtube.createQuickPlaylists(videoIds);
      this.sendMessage({
        type: 'quickPlaylists',
        body: { quickPlaylists },
      });
    }
  }

  async messageListener(msg) {
    switch (msg.type) {
      case 'videoIds':
        this.receiveVideoIds(msg.body.videoIds);
        break;

      case 'login':
        await this.youtube.login(true);
        this.sendStatus();
        break;

      case 'logout':
        await this.youtube.logout();
        this.sendStatus();
        break;

      case 'getChannelPlaylists':
        this.sendChannelPlaylists();
        break;

      case 'addToPlaylist':
        this.addToChannelPlaylist(msg.body.playlistId);
        break;

      case 'createPlaylist':
        this.newPlaylist(msg.body.title);
        break;

      case 'cancel':
        this.youtube.cancel = true;
        break;

      default:
    }
  }
}

const apiKey = 'AIzaSyDXAncnFBw3u0AcMo_Ikp-E-wwevie5nyY';
// eslint-disable-next-line no-undef
const youtube = new Youtube(apiKey);
const messageHandler = new MessageHandler(youtube);

chrome.extension.onConnect.addListener((port) => {
  messageHandler.updatePort(port);
});
