/* eslint-disable no-console */
/* eslint-disable-next-line no-unused-vars */
class Youtube {
  constructor(apiKey) {
    this.apiKey = apiKey;
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
          console.log(
            'runtime error:',
            chrome.runtime.lastError.message,
            chrome.runtime.lastError,
          );
          resolve();
        } else {
          this.token = token;
          console.log('logged in');
          resolve();
        }
      });
    });
  }

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

    const paramString = paramArr.join('');

    return `https://www.googleapis.com/youtube/v3/${resource}?${paramString}key=${this.apiKey}`;
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
    } catch (err) {
      console.log(err);

      const messageRegExes = [
        '^The request cannot be completed because you have exceeded your .+quota.+$',
        '^Daily Limit Exceeded. The quota will be reset[\\s\\w()]+?\\.',
        '^The user has created too many playlists recently. Please try the request again later.$',
      ];

      const re = new RegExp(`(${messageRegExes.join('|')})`);

      const match = err.message.match(re);

      if (match) {
        // Strip any html from message
        const message = match[0].replace(/<.+?>/g, '');

        throw Error(message);
      }

      return null;
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
    console.log('Playlists Received');

    return data;
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

    if (data.snippet && data.snippet.title && data.id) {
      const playlistTitle = data.snippet.title;
      const playlistId = data.id;
      console.log(`Created playlist:
      title: ${playlistTitle},
      id: ${playlistId}`);
    }

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

  async avoidDuplicateVideos(playlistId, videoIds) {
    // Request the current contents of the given playlist
    const data = await this.getPlaylistItems(playlistId);

    // Create an array of the videoIds currently in the playlist
    const playlistVideoIds = data.items.map(
      item => item.snippet.resourceId.videoId,
    );

    // Checks to see if there is another page of results (if playlist length > 50)
    let pageToken = data.nextPageToken ? data.nextPageToken : null;

    // Continue requesting subsequent pages until all results are fetched
    while (pageToken) {
      // eslint-disable-next-line no-await-in-loop
      const nextPage = await this.getPlaylistItems(playlistId, pageToken);

      nextPage.items.forEach((item) => {
        playlistVideoIds.push(item.snippet.resourceId.videoId);
      });

      pageToken = nextPage.nextPageToken ? nextPage.nextPageToken : null;
    }

    // Create array from videoIds which are not already contained in playlist
    const filteredVideoIds = videoIds.filter(
      videoId => !playlistVideoIds.includes(videoId),
    );

    console.log(
      `Removed ${videoIds.length - filteredVideoIds.length} duplicate videos.`,
    );

    console.log(`${filteredVideoIds.length} videos remaining.`);

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

    const requestUrls = playlistVideoIds.map((element) => {
      const videoIdList = element.join(',');
      const { length } = element;

      return {
        url: `https://www.youtube.com/watch_videos?video_ids=${videoIdList}`,
        length,
      };
    });

    const re = /"playlistId":"((?:PL|LL|EC|UU|FL|RD|UL|TL|OLAK5uy_)[0-9A-Za-z-_]{10,})"/;
    const quickPlaylists = await Promise.all(
      requestUrls.map(async (request) => {
        const response = await fetch(request.url);
        if (response.status !== 200) return undefined;

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

    return quickPlaylists;
  }
}
