// eslint-disable-next-line no-unused-vars
class Youtube {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // should this be stored or just requested each time?
    this.token = null;
    // this.busy is either false or {current: number, total: number}
    this.busy = false;
    this.cancel = false;

    this.login(false);
  }

  isSignedIn() {
    return !!this.token;
  }

  isBusy() {
    return this.busy;
  }

  setBusy(busy) {
    if (busy && !(busy.current && busy.total)) {
      console.log('incorrect parameters for setBusy');
    } else {
      this.busy = busy;
    }
  }

  login(interactive) {
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError);
          resolve();
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

  async sendApiRequest(resource, params, options) {
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

    try {
      const response = await fetch(url, request);
      const data = await response.json();
      if (!response.ok) {
        throw data.error;
      }
      return data;
    } catch (error) {
      console.log(`Error code: ${error.code}`);
      console.log(`Message: ${error.message}`);
    }
  }

  // pageToken is optional parameter
  async getChannelPlaylists(pageToken) {
    const resource = 'playlists';
    const params = {
      part: 'snippet, status',
      maxResults: '50',
      mine: 'true',
    };
    if (pageToken) {
      params.pageToken = pageToken;
    }
    const options = {
      method: 'GET',
    };
    console.log('Fetching playlists');
    const data = await this.sendApiRequest(resource, params, options);
    console.log(data);
    console.log('Playlists Received');
    const playlists = data.items.map(playlist => ({
      title: playlist.snippet.title,
      id: playlist.id,
      privacy: playlist.status.privacyStatus,
    }));
    return playlists;
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
    console.log('Creating Playlist');
    const data = await this.sendApiRequest(resource, params, options);
    const playlistTitle = data.snippet.title;
    const playlistId = data.id;
    console.log(`Created playlist:
      title: ${playlistTitle},
      id: ${playlistId}`);

    return data;
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
    const data = await this.sendApiRequest(resource, params, options);
    return data;
  }

  // pageToken is an optional parameter
  async getPlaylistItems(playlistId, pageToken) {
    const resource = 'playlistItems';
    const params = {
      part: 'snippet',
      maxResults: '50',
      playlistId,
    };
    if (pageToken) {
      params.pageToken = pageToken;
    }
    const options = {
      method: 'GET',
    };
    return this.sendApiRequest(resource, params, options);
  }

  // async avoidDuplicateVideos(playlistId, videoIds) {
  //   const data = await this.getPlaylistItems(playlistId);

  //   const playlistVideoIds = data.items.map(item => item.snippet.resourceId.videoId);

  //   return videoIds.filter(videoId => !playlistVideoIds.includes(videoId));
  // }

  async avoidDuplicateVideos(playlistId, videoIds, pageToken) {
    let data;
    if (pageToken) {
      data = await this.getPlaylistItems(playlistId, pageToken);
    } else {
      data = await this.getPlaylistItems(playlistId);
    }

    const playlistVideoIds = data.items.map(item => item.snippet.resourceId.videoId);

    let filteredVideoIds = videoIds.filter(videoId => !playlistVideoIds.includes(videoId));

    console.log(`Removed ${videoIds.length - filteredVideoIds.length} videos.`);

    if (data.nextPageToken) {
      filteredVideoIds = this.avoidDuplicateVideos(
        playlistId,
        filteredVideoIds,
        data.nextPageToken,
      );
    }

    return filteredVideoIds;
  }

  static async createQuickPlaylists(videoIds) {
    const maxPlaylistLength = 50;
    const numberOfLists = Math.ceil(videoIds.length / maxPlaylistLength);

    // prettier-ignore
    const playlistVideoIds = Array.from(
      Array(numberOfLists),
      (x, i) => videoIds.slice(i * maxPlaylistLength, (i + 1) * maxPlaylistLength),
    );

    const requestUrls = playlistVideoIds.reduce((result, element) => {
      const videoIdList = element.join(',');
      const { length } = element;
      result.push({
        url: `https://www.youtube.com/watch_videos?video_ids=${videoIdList}`,
        length,
      });
      return result;
    }, []);

    const re = /"playlistId":"((?:PL|LL|EC|UU|FL|RD|UL|TL|OLAK5uy_)[0-9A-Za-z-_]{10,})"/;
    const quickPlaylists = await Promise.all(
      requestUrls.map(async (request) => {
        const response = await fetch(request.url);
        const text = await response.text();
        const playlistId = text.match(re)[1];
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
