// eslint-disable-next-line no-unused-vars
class UI {
  constructor(buttonFunctions) {
    /*
    methods sould be object of form
    {
      login: function,
      logout: function,
      getPlaylists: function,
      createPlaylist: function,
    }
    */
    this.mainScreen = document.querySelector('#main-screen');
    this.numVideos = document.querySelector('#num-videos');
    this.quickPlaylists = document.querySelector('#quick-playlists');
    this.quickPlaylistsList = document.querySelector('#quick-playlists-list');
    this.channelPlaylistsContainer = document.querySelector('#channel-playlists-container');
    this.channelPlaylists = document.querySelector('#channel-playlists');
    this.channelPlaylistsList = document.querySelector('#channel-playlists-list');
    this.busyContainer = document.querySelector('#busy-container');
    this.notbusyContainer = document.querySelector('#not-busy-container');
    this.playlistsContainer = document.querySelector('#playlists-container');

    this.loginButton = document.querySelector('#login-button');
    this.logoutButton = document.querySelector('#logout-button');
    this.quickPlaylistsButton = document.querySelector('#quick-playlists-button');
    this.backButton = document.querySelector('#back-button');
    this.addToPlaylistButton = document.querySelector('#add-to-playlist-button');
    this.newPlaylistButton = document.querySelector('#new-playlist-button');
    this.createNewPlaylistForm = document.querySelector('#create-new-playlist-form');

    if (buttonFunctions) {
      if (buttonFunctions.login) {
        this.loginButton.onclick = buttonFunctions.login;
      }
      if (buttonFunctions.logout) {
        this.logoutButton.onclick = buttonFunctions.logout;
      }
      if (buttonFunctions.getChannelPlaylists) {
        this.addToPlaylistButton.onclick = buttonFunctions.getChannelPlaylists;
      }
      if (buttonFunctions.createPlaylist) {
        this.createNewPlaylistForm.onsubmit = (event) => {
          event.preventDefault();
          const playlistTitle = event.target.querySelector('input').value;
          buttonFunctions.createPlaylist(playlistTitle);
        };
      }
    }

    this.quickPlaylistsButton.onclick = () => {
      this.mainScreen.style.display = 'none';
      this.quickPlaylists.style.display = 'block';
    };

    this.backButton.onclick = () => {
      this.mainScreen.style.display = 'block';
      this.quickPlaylists.style.display = 'none';
    };

    this.newPlaylistButton.onclick = () => {
      this.newPlaylistButton.style.display = 'none';
      this.createNewPlaylistForm.style.display = 'block';
    };
  }

  updateStatus(status) {
    if (status) {
      if (status.isSignedIn) {
        this.loginButton.style.display = 'none';
        this.logoutButton.style.display = 'block';
        this.channelPlaylistsContainer.style.display = 'block';
      } else {
        this.loginButton.style.display = 'block';
        this.logoutButton.style.display = 'none';
        this.channelPlaylistsContainer.style.display = 'none';
      }

      if (status.busy) {
        this.busyContainer.style.display = 'block';
        this.notbusyContainer.style.display = 'none';

        const { current, total } = status.busy;
        this.busyContainer.innerText = `Adding ${current} of ${total}`;
      } else if (status.complete) {
        this.busyContainer.innerText = 'All videos added';
        this.busyContainer.style.display = 'block';
        this.notbusyContainer.style.display = 'none';
      } else {
        this.busyContainer.style.display = 'none';
        this.notbusyContainer.style.display = 'block';
      }
    }
  }

  updateVideoCount(numVideos) {
    if (numVideos === 0) {
      this.numVideos.innerText = 'No videos found';
      this.playlistsContainer.style.display = 'none';
    } else {
      this.numVideos.innerText = `${numVideos} video${numVideos === 1 ? '' : 's'} found`;
      this.playlistsContainer.style.display = 'block';
    }
  }

  showChannelPlaylists(channelPlaylists, onclick) {
    channelPlaylists.forEach((playlist) => {
      const li = document.createElement('li');
      li.innerText = playlist.title;
      li.playlistId = playlist.id;
      li.onclick = (event) => {
        onclick(event.target.playlistId);
      };
      this.channelPlaylistsList.append(li);
    });

    this.addToPlaylistButton.style.display = 'none';
    this.channelPlaylists.style.display = 'block';
  }

  showQuickPlaylists(quickPlaylists) {
    quickPlaylists.forEach((playlist, index) => {
      const { url, length } = playlist;

      const button = document.createElement('button');

      button.innerText = `Videos ${index * 50 + 1} to ${index * 50 + length}`;
      button.onclick = () => {
        chrome.tabs.create({ url, active: false });
      };

      this.quickPlaylistsList.append(button);
    });

    if (quickPlaylists.length > 1) {
      const button = document.createElement('button');

      button.innerText = 'Open All';

      button.onclick = () => {
        quickPlaylists.forEach((playlist) => {
          const { url } = playlist;
          chrome.tabs.create({ url, active: false });
        });
      };

      this.quickPlaylistsList.prepend(button);
    }
  }
}
