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

  sendError(error) {
    const { code, message } = error;
    this.sendMessage({
      type: 'error',
      body: {
        code,
        message,
      },
    });
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
    try {
      // will send null if nextPageToken not given
      const data = await this.youtube.getChannelPlaylists(nextPageToken);

      const channelPlaylists = data.items.map(playlist => ({
        title: playlist.snippet.title,
        id: playlist.id,
        privacy: playlist.status.privacyStatus,
      }));

      const body = { channelPlaylists };

      if (data.nextPageToken) {
        // console.log(data.nextPageToken);
        this.sendChannelPlaylists(data.nextPageToken);
        body.incomplete = true;
      }

      this.sendMessage({
        type: 'channelPlaylists',
        body,
      });
    } catch (error) {
      this.sendError(error);
    }
  }

  // async addAllVideos(playlistId, videoIds) {
  //   this.youtube.cancel = false;
  //   const numVideos = videoIds.length;

  //   for (let i = 0; i < numVideos; i += 1) {
  //     if (this.youtube.cancel) {
  //       this.youtube.cancel = false;
  //       this.youtube.setBusy(false);
  //       this.sendStatus({ cancelled: true });
  //       console.log('Process cancelled.');
  //       return;
  //     }
  //     this.youtube.setBusy({ current: i + 1, total: numVideos });
  //     this.sendStatus();
  //     console.log(`Adding video ${i + 1} of ${numVideos}.`);

  //     try {
  //       // eslint-disable-next-line no-await-in-loop
  //       await this.youtube.addVideo(playlistId, videoIds[i]);
  //     } catch (error) {
  //       if (error.message !== 'Video not found.') {
  //         throw error;
  //       }
  //       // Do nothing further with 'Video not found.' error so as to not interrupt process.
  //     }
  //   }

  //   this.youtube.setBusy(false);
  //   this.sendStatus({ cancelled: false });
  //   console.log(`All videos added to ${playlistId}.`);
  // }

  async addAllVideos(playlistId, videoIds) {
    this.youtube.cancel = false;
    const numVideo = videoIds.length;

    await videoIds.reduce(async (prev, current, i) => {
      await prev;

      if (this.youtube.cancel) return null;

      this.youtube.setBusy({ current: i + 1, total: numVideos });
      this.sendStatus();
      console.log(`Adding video ${i + 1} of ${numVIdeos}.`);

      try {
        return await this.youtube.addVideo(playlistId, current);
      } catch (error) {
        // Do nothing further with 'Video not found.' error
        if (error.message !== 'Video not found.') throw error;
        return null;
      }
    }, Promise.resolve());

    this.youtube.setBusy(false);
    this.sendStatus({ cancelled: this.youtube.cancel });

    console.log(this.youtube.cancel ? 'Process cancelled.' : `All videos added to ${playlistId}.`);

    this.youtube.cancel = false;
  }

  async addToChannelPlaylist(playlistId) {
    const allVideoIds = [...this.youtube.videoIds];
    try {
      const videoIds = await this.youtube.avoidDuplicateVideos(playlistId, allVideoIds);

      this.addAllVideos(playlistId, videoIds);
    } catch (error) {
      this.sendError(error);
    }
  }

  async newPlaylist(title) {
    try {
      const data = await this.youtube.createPlaylist(title);
      if (data.id) {
        const playlistId = data.id;
        const videoIds = [...this.youtube.videoIds];
        this.addAllVideos(playlistId, videoIds);
      }
    } catch (error) {
      this.sendError(error);
    }
  }

  async receiveVideoIds(videoIds) {
    if (videoIds.length > 0) {
      try {
        this.youtube.videoIds = videoIds;
        // eslint-disable-next-line no-undef
        const quickPlaylists = await Youtube.createQuickPlaylists(videoIds);
        this.sendMessage({
          type: 'quickPlaylists',
          body: { quickPlaylists },
        });
      } catch (error) {
        this.sendError(error);
      }
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
