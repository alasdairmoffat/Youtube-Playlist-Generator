// eslint-disable-next-line no-unused-vars
class UI {
  constructor(methods) {
    /*
    methods sould be object of form
    {
      login: function,
      logout: function,
    }
    */
    this.mainScreen = document.querySelector('#main-screen');
    this.numVideos = document.querySelector('#num-videos');
    this.quickPlaylists = document.querySelector('#quick-playlists');
    this.quickPlaylistsList = document.querySelector('#quick-playlists-list');

    this.loginButton = document.querySelector('#login-button');
    this.logoutButton = document.querySelector('#logout-button');
    this.quickPlaylistsButton = document.querySelector('#quick-playlists-button');
    this.backButton = document.querySelector('#back-button');

    if (methods) {
      if (methods.login) {
        this.loginButton.onclick = methods.login;
      }
      if (methods.logout) {
        this.logoutButton.onclick = methods.logout;
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
  }

  updateStatus(status) {
    if (status) {
      if (status.isSignedIn) {
        this.loginButton.style.display = 'none';
        this.logoutButton.style.display = 'block';
      } else {
        this.loginButton.style.display = 'block';
        this.logoutButton.style.display = 'none';
      }
    }
  }

  updateVideoCount(numVideos) {
    this.numVideos.innerText = `${numVideos} videos found`;
  }

  addQuickPlaylists(quickPlaylists) {
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
