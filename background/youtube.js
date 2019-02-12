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

  login(props) {
    /*
    props should be object of form
    {
      interactive: bool,
      callback: function,
    }
    */
    const { interactive } = props;
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError);
      } else {
        this.token = token;
        console.log('logged in');
      }

      if (props.callback) {
        props.callback(this.isSignedIn());
      }
    });
  }

  // should this just reference this.token rather than calling chrome.identity?
  logout(props) {
    /*
    props should be object of form
    {
      callback: function,
    }
    */
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (!chrome.runtime.lastError) {
        chrome.identity.removeCachedAuthToken({ token }, () => {
          this.token = null;
          console.log('logged out');

          if (props.callback) {
            props.callback(this.isSignedIn());
          }
        });
      }
    });
  }

  createURL(url, params) {
    const paramArr = [];

    Object.keys(params).forEach((x) => {
      const param = params[x].replace(/,/g, '%2C');
      paramArr.push(`${x}=${param}&`);
    });

    return `${url}?${paramArr.join('')}key=${this.apiKey}`;
  }

  async getPlaylists() {
    const url = this.createURL('https://www.googleapis.com/youtube/v3/playlists', {
      part: 'snippet',
      maxResults: '25',
      mine: 'true',
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    const data = await response.json();

    console.log(data);
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
