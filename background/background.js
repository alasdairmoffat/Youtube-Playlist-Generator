/* eslint-disable no-console */
class MessageHandler {
  constructor() {
    this.port = null;
    this.controller = null;
  }

  updatePort(port) {
    this.port = port;
    this.port.onDisconnect.addListener(() => {
      this.port = null;
      // Abort any ongoing fetch requests
      if (this.controller) {
        this.controller.abort();
      }
    });
    this.port.onMessage.addListener(this.messageListener.bind(this));
    chrome.runtime.onMessage.addListener(this.receiveVideoIds.bind(this));
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
    const { message } = error;
    this.sendMessage({
      type: 'error',
      body: {
        message,
      },
    });
  }

  async createQuickPlaylists(videoIds) {
    const maxPlaylistLength = 50;
    const numberOfLists = Math.ceil(videoIds.length / maxPlaylistLength);

    // prettier-ignore
    const playlistVideoIds = Array.from(
      Array(numberOfLists),
      (x, i) => videoIds.slice(i * maxPlaylistLength, (i + 1) * maxPlaylistLength),
    );

    const requestUrls = playlistVideoIds.map((element) => {
      const videoIdList = element.join(',');
      const { length } = element;

      return {
        url: `https://www.youtube.com/watch_videos?video_ids=${videoIdList}`,
        length,
      };
    });

    const re = new RegExp(
      '^https:\\/\\/www.youtube.com\\/watch\\?v=' // Base url
        + '(?:[\\w-]{11})' // Non-captured current Video ID
        + '&list='
        + '(' // Open capture group
        + '(?:PL|LL|EC|UU|FL|RD|UL|TL|OLAK5uy_)' // Possible values for beginning of Playlist ID
        + '[\\w-]{10,}' // Remainder of Playlist ID
        + ')$', // End capture group
    );

    this.controller = new AbortController();
    const { signal } = this.controller;

    const quickPlaylists = await Promise.all(
      requestUrls.map(async (request) => {
        const response = await fetch(request.url, { signal });
        if (response.status !== 200) {
          return { url: '', length: 0, request };
        }

        const playlistId = response.url.match(re)[1];
        const { length } = request;

        const playlist = {
          url: `https://www.youtube.com/playlist?list=${playlistId}&disable_polymer=true`,
          length,
        };

        return playlist;
      }),
    );

    console.log(quickPlaylists);

    return quickPlaylists;
  }

  async receiveVideoIds(videoIds) {
    if (videoIds.length > 0) {
      try {
        const quickPlaylists = await this.createQuickPlaylists(videoIds);
        this.sendMessage({
          type: 'quickPlaylists',
          body: { quickPlaylists },
        });
      } catch (error) {
        console.log(error);
        this.sendError(error);
      }
    }
  }

  messageListener(msg) {
    switch (msg.type) {
      case 'videoIds':
        this.receiveVideoIds(msg.body.videoIds);
        break;

      default:
    }
  }
}

function initialise() {
  const messageHandler = new MessageHandler();

  chrome.runtime.onConnect.addListener((port) => {
    messageHandler.updatePort(port);
  });
}

chrome.runtime.onInstalled.addListener(initialise);
chrome.runtime.onStartup.addListener(initialise);
