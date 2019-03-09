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
    this.messageContainer = document.querySelector('#message-container');
    this.notbusyContainer = document.querySelector('#not-busy-container');
    this.playlistsContainer = document.querySelector('#playlists-container');
    this.signInProgress = document.querySelector('#sign-in-progress');
    this.channelSpinner = document.querySelector('#channel-spinner');
    this.quickPlaylistsSpinner = document.querySelector('#quick-playlists-spinner');
    this.progressText = document.querySelector('#progress-text');
    this.progressBar = document.querySelector('#progress-bar');
    this.waitingBar = document.querySelector('#waiting-bar');

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
            this.inputWarning.textContent = 'Required';
            this.createNewPlaylistForm.classList.add('form-warning');
          } else if (/[<>]/.test(playlistTitle)) {
            this.inputWarning.textContent = 'Playlist name cannot contain < or >';
            this.createNewPlaylistForm.classList.add('form-warning');
          } else {
            buttonFunctions.createPlaylist(playlistTitle);
            this.inputWarning.textContent = '';
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
      UI.hide(this.quickPlaylists);
      UI.show(this.mainScreen);
    };

    this.newPlaylistButton.onclick = () => {
      UI.hide(this.newPlaylistButton);
      UI.show(this.createNewPlaylistForm);
    };

    // text counter for input field
    this.titleInput.oninput = () => {
      this.titleCount.textContent = this.titleInput.value.length;
    };
  }

  static show(...args) {
    args.forEach((element) => {
      element.classList.remove('hide');
    });
  }

  static hide(...args) {
    args.forEach((element) => {
      element.classList.add('hide');
    });
  }

  updateStatus(status) {
    if (status) {
      if (status.isSignedIn) {
        UI.hide(this.signInButton, this.signInProgress);
        UI.show(this.signOutButton, this.addToPlaylistButton);
      } else {
        UI.hide(
          this.signOutButton,
          this.signInProgress,
          this.addToPlaylistButton,
          this.channelSpinner,
          this.channelPlaylists,
        );
        UI.show(this.signInButton);
      }

      if (status.busy) {
        UI.hide(this.waitingBar, this.addToPlaylistButton, this.notbusyContainer);
        UI.show(this.messageContainer, this.progressBar);

        const { current, total } = status.busy;
        this.progressText.textContent = `Adding ${current} of ${total}`;
        const percentComplete = Math.round(((current - 1) / total) * 100);
        this.progressBar.style.width = `${percentComplete}%`;
      } else if (status.complete) {
        if (status.complete.cancelled) {
          this.progressText.textContent = 'Cancelled';
        } else {
          this.progressText.textContent = 'All videos added';
          this.progressBar.style.width = '100%';
        }
        UI.hide(this.waitingBar, this.addToPlaylistButton, this.notbusyContainer);
        UI.show(this.messageContainer, this.progressBar);
      } else {
        UI.hide(this.messageContainer);
        UI.show(this.notbusyContainer);
      }
    }
  }

  updateVideoCount(numVideos) {
    if (numVideos === 0) {
      this.numVideos.textContent = 'No videos found';
      UI.hide(this.playlistsContainer);
    } else {
      this.numVideos.textContent = `${numVideos} video${numVideos === 1 ? '' : 's'} found`;
      UI.show(this.playlistsContainer);
    }
  }

  showDuplicateCheckMessage() {
    UI.hide(this.progressBar, this.addToPlaylistButton, this.notbusyContainer);
    UI.show(this.messageContainer, this.waitingBar);
    this.progressText.textContent = 'Checking for duplicates';
  }

  createChannelPlaylistElement(playlist, onclick) {
    const { title, id, privacy } = playlist;

    const label = document.createElement('label');
    label.classList.add('valign-wrapper');
    label.setAttribute('for', id);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('filled-in', 'checkmark-blue', 'checkmark-align');
    checkbox.id = id;
    checkbox.onclick = (event) => {
      this.showDuplicateCheckMessage();
      onclick(event.target.id);
    };

    const span = document.createElement('span');
    span.classList.add('grey-text', 'text-darken-4', 'truncate', 'col', 's10');
    span.textContent = title;

    const icon = document.createElement('i');
    icon.classList.add('material-icons', 'smaller', 'pointer', 'col', 's2');
    switch (privacy) {
      case 'private':
        icon.textContent = 'lock';
        break;
      case 'unlisted':
        icon.textContent = 'lock_open';
        break;
      case 'public':
        icon.textContent = 'public';
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
      const playlistElement = this.createChannelPlaylistElement(playlist, onclick);
      this.channelPlaylistsList.append(playlistElement);
    });

    UI.hide(this.channelSpinner);
    UI.show(this.channelPlaylists);
  }

  static createQuickPlaylistElement(playlist, index) {
    const { url, length } = playlist;

    const icon = document.createElement('i');
    icon.classList.add('material-icons', 'grey-text', 'col', 's2');
    icon.textContent = 'playlist_play';

    const textSpan = document.createElement('span');
    textSpan.classList.add('col', 's10');
    textSpan.textContent = `Videos ${index * 50 + 1} to ${index * 50 + length}`;

    const row = document.createElement('div');
    row.classList.add('valign-wrapper', 'pointer', 'hover-highlight', 'row');
    row.append(icon, textSpan);
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
      icon.textContent = 'playlist_play';

      const textSpan = document.createElement('span');
      textSpan.classList.add('col', 's10');
      textSpan.textContent = 'Open All';

      const row = document.createElement('div');
      row.classList.add('pointer', 'hover-highlight', 'row');
      row.append(icon, textSpan);
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
