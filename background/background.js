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
    const isSignedIn = this.youtube.isSignedIn();
    const busy = this.youtube.isBusy();
    const body = {
      isSignedIn,
      busy,
    };
    if (complete) {
      body.complete = true;
    }

    this.sendMessage({
      type: 'status',
      body,
    });
  }

  async sendChannelPlaylists() {
    const channelPlaylists = await this.youtube.getChannelPlaylists();
    this.sendMessage({
      type: 'channelPlaylists',
      body: { channelPlaylists },
    });
  }

  async addAllVideos(playlistId) {
    const videoIds = await this.youtube.avoidDuplicateVideos(playlistId, this.youtube.videoIds);
    const numVideos = videoIds.length;

    for (let i = 0; i < numVideos; i += 1) {
      this.youtube.setBusy({ current: i + 1, total: numVideos });
      this.sendStatus();
      console.log(`Adding video ${i + 1} of ${numVideos}.`);

      // eslint-disable-next-line no-await-in-loop
      await this.youtube.addVideo(playlistId, videoIds[i]);
    }

    this.youtube.setBusy(false);
    this.sendStatus(true);
    console.log(`All video added to ${playlistId}`);
  }

  async createPlaylist(title) {
    const data = await this.youtube.createPlaylist(title);
    const playlistId = data.id;
    this.addAllVideos(playlistId);
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
        this.addAllVideos(msg.body.playlistId);
        break;

      case 'createPlaylist':
        this.createPlaylist(msg.body.title);
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
