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
      cancel: function,
    }
    */
    this.mainScreen = document.querySelector('#main-screen');
    this.numVideos = document.querySelector('#num-videos');
    this.quickPlaylists = document.querySelector('#quick-playlists');
    this.quickPlaylistsList = document.querySelector('#quick-playlists-list');
    this.channelPlaylists = document.querySelector('#channel-playlists');
    this.channelPlaylistsList = document.querySelector('#channel-playlists-list');
    this.busyContainer = document.querySelector('#busy-container');
    this.notbusyContainer = document.querySelector('#not-busy-container');
    this.playlistsContainer = document.querySelector('#playlists-container');
    this.signInProgress = document.querySelector('#sign-in-progress');
    this.channelSpinner = document.querySelector('#channel-spinner');
    this.quickPlaylistsSpinner = document.querySelector('#quick-playlists-spinner');
    this.progressText = document.querySelector('#progress-text');
    this.progressBar = document.querySelector('#progress-bar');

    this.signInButton = document.querySelector('#sign-in-button');
    this.signOutButton = document.querySelector('#sign-out-button');
    this.quickPlaylistsButton = document.querySelector('#quick-playlists-button');
    this.backButton = document.querySelector('#back-button');
    this.addToPlaylistButton = document.querySelector('#add-to-playlist-button');
    this.newPlaylistButton = document.querySelector('#new-playlist-button');
    this.createNewPlaylistForm = document.querySelector('#create-new-playlist-form');
    this.titleInput = document.querySelector('#title-input');
    this.titleCount = document.querySelector('#title-count');
    this.inputWarning = document.querySelector('#input-warning');
    this.cancelButton = document.querySelector('#cancel-button');

    if (buttonFunctions) {
      if (buttonFunctions.login) {
        this.signInButton.onclick = () => {
          UI.hide(this.signInButton);
          UI.show(this.signInProgress);
          buttonFunctions.login();
        };
      }
      if (buttonFunctions.logout) {
        this.signOutButton.onclick = buttonFunctions.logout;
      }
      if (buttonFunctions.getChannelPlaylists) {
        this.addToPlaylistButton.onclick = () => {
          buttonFunctions.getChannelPlaylists();
          UI.hide(this.addToPlaylistButton);
          UI.show(this.channelSpinner);
        };
      }
      if (buttonFunctions.createPlaylist) {
        this.createNewPlaylistForm.onsubmit = (event) => {
          event.preventDefault();
          const playlistTitle = this.titleInput.value;

          if (playlistTitle.length === 0) {
            this.inputWarning.innerText = 'Required';
            this.createNewPlaylistForm.classList.add('form-warning');
          } else if (/[<>]/.test(playlistTitle)) {
            this.inputWarning.innerText = 'Playlist name cannot contain < or >';
            this.createNewPlaylistForm.classList.add('form-warning');
          } else {
            buttonFunctions.createPlaylist(playlistTitle);
            this.inputWarning.innerText = '';
            this.createNewPlaylistForm.classList.remove('form-warning');
          }
        };
      }
      if (buttonFunctions.cancel) {
        this.cancelButton.onclick = () => {
          buttonFunctions.cancel();
        };
      }
    }

    this.quickPlaylistsButton.onclick = () => {
      UI.hide(this.mainScreen);
      UI.show(this.quickPlaylists);
    };

    this.backButton.onclick = () => {
      UI.show(this.mainScreen);
      UI.hide(this.quickPlaylists);
    };

    this.newPlaylistButton.onclick = () => {
      UI.hide(this.newPlaylistButton);
      UI.show(this.createNewPlaylistForm);
    };

    // text counter for input field
    this.titleInput.oninput = () => {
      this.titleCount.innerText = this.titleInput.value.length;
    };
  }

  static show(element) {
    element.classList.remove('hide');
  }

  static hide(element) {
    element.classList.add('hide');
  }

  updateStatus(status) {
    if (status) {
      if (status.isSignedIn) {
        UI.hide(this.signInButton);
        UI.show(this.signOutButton);
        UI.hide(this.signInProgress);
        UI.show(this.addToPlaylistButton);
      } else {
        UI.show(this.signInButton);
        UI.hide(this.signOutButton);
        UI.hide(this.signInProgress);
        UI.hide(this.addToPlaylistButton);
        UI.hide(this.channelSpinner);
        UI.hide(this.channelPlaylists);
      }

      if (status.busy) {
        UI.show(this.busyContainer);
        UI.hide(this.addToPlaylistButton);
        UI.hide(this.notbusyContainer);

        const { current, total } = status.busy;
        this.progressText.innerText = `Adding ${current} of ${total}`;
        const percentComplete = Math.round(((current - 1) / total) * 100);
        this.progressBar.style.width = `${percentComplete}%`;
      } else if (status.complete) {
        if (status.complete.cancelled) {
          this.progressText.innerText = 'Cancelled';
        } else {
          this.progressText.innerText = 'All videos added';
          this.progressBar.style.width = '100%';
        }
        UI.show(this.busyContainer);
        UI.hide(this.addToPlaylistButton);
        UI.hide(this.notbusyContainer);
      } else {
        UI.hide(this.busyContainer);
        UI.show(this.notbusyContainer);
      }
    }
  }

  updateVideoCount(numVideos) {
    if (numVideos === 0) {
      this.numVideos.innerText = 'No videos found';
      UI.hide(this.playlistsContainer);
    } else {
      this.numVideos.innerText = `${numVideos} video${numVideos === 1 ? '' : 's'} found`;
      UI.show(this.playlistsContainer);
    }
  }

  static createChannelPlaylistElement(playlist, onclick) {
    const { title, id, privacy } = playlist;

    const label = document.createElement('label');
    label.classList.add('valign-wrapper');
    label.setAttribute('for', id);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('filled-in', 'checkmark-blue', 'checkmark-align');
    checkbox.id = id;
    checkbox.onclick = (event) => {
      onclick(event.target.id);
    };

    const span = document.createElement('span');
    span.classList.add('grey-text', 'text-darken-4', 'truncate', 'col', 's10');
    span.innerText = title;

    const icon = document.createElement('i');
    icon.classList.add('material-icons', 'smaller', 'pointer', 'col', 's2');
    switch (privacy) {
      case 'private':
        icon.innerText = 'lock';
        break;
      case 'unlisted':
        icon.innerText = 'lock_open';
        break;
      case 'public':
        icon.innerText = 'public';
        break;
      default:
    }

    label.append(checkbox, span, icon);

    const row = document.createElement('div');
    row.classList.add('row');
    row.append(label);

    return row;
  }

  showChannelPlaylists(channelPlaylists, onclick) {
    channelPlaylists.forEach((playlist) => {
      const playlistElement = UI.createChannelPlaylistElement(playlist, onclick);
      this.channelPlaylistsList.append(playlistElement);
    });

    UI.hide(this.channelSpinner);
    UI.show(this.channelPlaylists);
  }

  static createQuickPlaylistElement(playlist, index) {
    const { url, length } = playlist;

    const icon = document.createElement('i');
    icon.classList.add('material-icons', 'grey-text', 'col', 's2');
    icon.innerText = 'playlist_play';

    const textSpan = document.createElement('span');
    textSpan.classList.add('col', 's8');
    textSpan.innerText = `Videos ${index * 50 + 1} to ${index * 50 + length}`;

    const spacingSpan = document.createElement('span');
    spacingSpan.classList.add('col', 's2');
    spacingSpan.innerText = '\xa0';

    const row = document.createElement('div');
    row.classList.add('valign-wrapper', 'pointer', 'hover-highlight', 'row');
    row.append(icon, textSpan, spacingSpan);
    row.onclick = () => {
      chrome.tabs.create({ url, active: false });
    };

    return row;
  }

  showQuickPlaylists(quickPlaylists) {
    UI.hide(this.quickPlaylistsSpinner);
    quickPlaylists.forEach((playlist, index) => {
      const row = UI.createQuickPlaylistElement(playlist, index);
      this.quickPlaylistsList.append(row);
    });

    if (quickPlaylists.length > 1) {
      const icon = document.createElement('i');
      icon.classList.add('material-icons', 'grey-text', 'col', 's2');
      icon.innerText = 'playlist_play';

      const textSpan = document.createElement('span');
      textSpan.classList.add('col', 's8');
      textSpan.innerText = 'Open All';

      const spacingSpan = document.createElement('span');
      spacingSpan.classList.add('col', 's2');
      spacingSpan.innerText = '\xa0';

      const row = document.createElement('div');
      row.classList.add('pointer', 'hover-highlight', 'row');
      row.append(icon, textSpan, spacingSpan);
      row.onclick = () => {
        quickPlaylists.forEach((playlist) => {
          const { url } = playlist;
          chrome.tabs.create({ url, active: false });
        });
      };

      this.quickPlaylistsList.prepend(row);
    }
  }
}
