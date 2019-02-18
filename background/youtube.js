// eslint-disable-next-line no-unused-vars
class Youtube {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // should this be stored or just requested each time?
    this.token = null;

    this.login(false);
  }

  isSignedIn() {
    return !!this.token;
  }

  login(interactive) {
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError);
        } else {
          this.token = token;
          console.log('logged in');
          resolve();
        }
      });
    });
  }

  // should this just reference this.token rather than calling chrome.identity?
  logout() {
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (!chrome.runtime.lastError) {
          chrome.identity.removeCachedAuthToken({ token }, () => {
            this.token = null;
            console.log('logged out');
            resolve();
          });
        }
      });
    });
  }

  createURL(resource, params) {
    const paramArr = Object.keys(params).map((x) => {
      const param = params[x].replace(/,/g, '%2C');
      return `${x}=${param}&`;
    });

    return `https://www.googleapis.com/youtube/v3/${resource}?${paramArr.join('')}key=${
      this.apiKey
    }`;
  }

  async sendApiResponse(resource, params, options) {
    const url = this.createURL(resource, params);

    const request = { ...options };

    request.headers = {
      Authorization: `Bearer ${this.token}`,
    };

    if (options.method === 'POST') {
      request.headers['Content-Type'] = 'application/json';
    }

    if (request.body) {
      request.body = JSON.stringify(request.body);
    }

    const response = await fetch(url, request);

    return response.json();
  }

  async getPlaylists() {
    const resource = 'playlists';

    const params = {
      part: 'snippet',
      maxResults: '25',
      mine: 'true',
    };

    const options = {
      method: 'GET',
    };

    const data = await this.sendApiResponse(resource, params, options);

    console.log(data);
  }

  async createPlaylist(title) {
    const resource = 'playlists';

    const params = {
      part: 'snippet',
    };

    const options = {
      method: 'POST',
      body: {
        snippet: {
          title,
        },
      },
    };

    const data = await this.sendApiResponse(resource, params, options);

    console.log(data);
  }

  async addVideo(playlistId, videoId) {
    const resource = 'playlistItems';

    const params = {
      part: 'snippet',
    };

    const options = {
      method: 'POST',
      body: {
        snippet: {
          playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId,
          },
        },
      },
    };

    const data = await this.sendApiResponse(resource, params, options);

    console.log(data);
  }

  async addToTestList() {
    const playlistId = 'PLXqaL3R-110qV1MIxyKYEZBzIQCW4VgsC';
    const { videoIds } = this;
    for (let i = 0; i < videoIds.length; i += 1) {
      await this.addVideo(playlistId, videoIds[i]);
    }
  }

  static async createQuickPlaylists(videoIds) {
    const re = /"playlistId":"((?:PL|LL|EC|UU|FL|RD|UL|TL|OLAK5uy_)[0-9A-Za-z-_]{10,})"/;

    const maxPlaylistLength = 50;

    const requestUrls = [];
    const numberOfLists = Math.ceil(videoIds.length / maxPlaylistLength);

    for (let i = 0; i < numberOfLists; i += 1) {
      const playlistVideoIds = videoIds.slice(i * maxPlaylistLength, (i + 1) * maxPlaylistLength);
      const { length } = playlistVideoIds;

      const videoIdList = playlistVideoIds.join(',');

      requestUrls.push({
        url: `https://www.youtube.com/watch_videos?video_ids=${videoIdList}`,
        length,
      });
    }

    const quickPlaylists = await Promise.all(
      requestUrls.map(async (request) => {
        const response = await fetch(request.url);
        const text = await response.text();
        const playlistId = re.exec(text)[1];

        const { length } = request;

        const playlist = {
          url: `https://www.youtube.com/playlist?list=${playlistId}&disable_polymer=true`,
          length,
        };

        return playlist;
      }),
    );

    // returns a promise
    return quickPlaylists;
  }
}
