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
    this.channelPlaylistsList = document.querySelector(
      '#channel-playlists-list',
    );
    this.messageContainer = document.querySelector('#message-container');
    this.errorContainer = document.querySelector('#error-container');
    this.errorMessage = document.querySelector('#error-message');
    this.fetchedPlaylistsContainer = document.querySelector(
      '#fetched-playlists-container',
    );
    this.playlistsContainer = document.querySelector('#playlists-container');
    this.signInProgress = document.querySelector('#sign-in-progress');
    this.channelSpinner = document.querySelector('#channel-spinner');
    this.quickPlaylistsSpinner = document.querySelector(
      '#quick-playlists-spinner',
    );
    this.progressText = document.querySelector('#progress-text');
    this.progressBar = document.querySelector('#progress-bar');
    this.waitingBar = document.querySelector('#waiting-bar');

    this.signInButton = document.querySelector('#sign-in-button');
    this.signOutButton = document.querySelector('#sign-out-button');
    this.quickPlaylistsButton = document.querySelector(
      '#quick-playlists-button',
    );
    this.backButton = document.querySelector('#back-button');
    this.addToPlaylistButton = document.querySelector(
      '#add-to-playlist-button',
    );
    this.newPlaylistButton = document.querySelector('#new-playlist-button');
    this.createNewPlaylistForm = document.querySelector(
      '#create-new-playlist-form',
    );
    this.titleInput = document.querySelector('#title-input');
    this.titleCount = document.querySelector('#title-count');
    this.inputWarning = document.querySelector('#input-warning');
    this.cancelButton = document.querySelector('#cancel-button');

    if (buttonFunctions) {
      if (buttonFunctions.login) {
        this.signInButton.addEventListener('click', () => {
          UI.hide(this.signInButton);
          UI.show(this.signInProgress);
          buttonFunctions.login();
        });
      }
      if (buttonFunctions.logout) {
        this.signOutButton.addEventListener('click', buttonFunctions.logout);
      }
      if (buttonFunctions.getChannelPlaylists) {
        this.addToPlaylistButton.addEventListener('click', () => {
          UI.hide(this.addToPlaylistButton);
          UI.show(this.channelSpinner);
          buttonFunctions.getChannelPlaylists();
        });
      }
      if (buttonFunctions.createPlaylist) {
        this.createNewPlaylistForm.addEventListener('submit', (event) => {
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
        });
      }
      if (buttonFunctions.cancel) {
        this.cancelButton.addEventListener('click', () => {
          buttonFunctions.cancel();
        });
      }
    }

    this.quickPlaylistsButton.addEventListener('click', () => {
      UI.hide(this.mainScreen);
      UI.show(this.quickPlaylists);
    });

    this.backButton.addEventListener('click', () => {
      UI.hide(this.quickPlaylists);
      UI.show(this.mainScreen);
    });

    this.newPlaylistButton.addEventListener('click', () => {
      UI.hide(this.newPlaylistButton);
      UI.show(this.createNewPlaylistForm);
    });

    // text counter for input field
    this.titleInput.addEventListener('input', () => {
      this.titleCount.textContent = this.titleInput.value.length;
    });
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

  displayError(error) {
    UI.hide(
      this.addToPlaylistButton,
      this.channelSpinner,
      this.fetchedPlaylistsContainer,
      this.messageContainer,
    );

    const { message } = error;
    this.errorMessage.textContent = message;

    UI.show(this.errorContainer);
  }

  displaySignedIn() {
    UI.hide(this.signInButton, this.signInProgress);
    UI.show(this.signOutButton, this.addToPlaylistButton);
  }

  displaySignedOut() {
    UI.hide(
      this.signOutButton,
      this.signInProgress,
      this.addToPlaylistButton,
      this.channelSpinner,
      this.channelPlaylists,
    );
    UI.show(this.signInButton);
  }

  displayBusy(busy) {
    UI.hide(
      this.waitingBar,
      this.addToPlaylistButton,
      this.fetchedPlaylistsContainer,
    );

    const { current, total } = busy;
    this.progressText.textContent = `Adding ${current} of ${total}`;
    const percentComplete = Math.round(((current - 1) / total) * 100);
    this.progressBar.style.width = `${percentComplete}%`;

    UI.show(this.messageContainer, this.progressBar);
  }

  displayCompleted(complete) {
    UI.hide(
      this.waitingBar,
      this.addToPlaylistButton,
      this.fetchedPlaylistsContainer,
    );

    if (complete.cancelled) {
      this.progressText.textContent = 'Cancelled';
    } else {
      this.progressText.textContent = 'All videos added';
      this.progressBar.style.width = '100%';
    }

    UI.show(this.messageContainer, this.progressBar);
  }

  displayNotBusy() {
    UI.hide(this.messageContainer);
    UI.show(this.fetchedPlaylistsContainer);
  }

  updateStatus(status) {
    if (status) {
      if (status.isSignedIn) {
        this.displaySignedIn();
      } else {
        this.displaySignedOut();
      }

      if (status.busy) {
        this.displayBusy(status.busy);
      } else if (status.complete) {
        this.displayCompleted(status.complete);
      } else {
        this.displayNotBusy();
      }
    }
  }

  updateVideoCount(numVideos) {
    if (numVideos === 0) {
      this.numVideos.textContent = 'No videos found';
      UI.hide(this.playlistsContainer);
    } else {
      this.numVideos.textContent = `${numVideos} video${
        numVideos === 1 ? '' : 's'
      } found`;
      UI.show(this.playlistsContainer);
    }
  }

  showDuplicateCheckMessage() {
    UI.hide(
      this.progressBar,
      this.addToPlaylistButton,
      this.fetchedPlaylistsContainer,
    );

    this.progressText.textContent = 'Checking playlist for duplicates';

    UI.show(this.messageContainer, this.waitingBar);
  }

  static createDomElement(elementString) {
    return new DOMParser().parseFromString(elementString, 'text/html').body
      .firstChild;
  }

  createChannelPlaylistElement(playlist, onclick) {
    const { title, id, privacy } = playlist;

    const checkbox = UI.createDomElement(
      `<input type="checkbox" class="filled-in checkmark-blue checkmark-align" id=${id}></input>`,
    );

    checkbox.addEventListener('click', (event) => {
      this.showDuplicateCheckMessage();
      onclick(event.target.id);
    });

    let iconTextContent = '';
    if (privacy === 'private') iconTextContent = 'lock';
    if (privacy === 'unlisted') iconTextContent = 'lock_open';
    if (privacy === 'public') iconTextContent = 'public';

    const row = UI.createDomElement(
      `<div class="row">
        <label class="valign-wrapper" for=${id}>
          <span class="grey-text text-darken-4 truncate col s10">${title}</span>
          <i class="material-icons smaller pointer col s2">${iconTextContent}</i>
        </label>
      </div>`,
    );

    row.querySelector('label').prepend(checkbox);

    return row;
  }

  showChannelPlaylists(body, onclick) {
    const { channelPlaylists, incomplete } = body;

    const listSpinner = this.channelPlaylistsList.lastElementChild;
    this.channelPlaylistsList.removeChild(listSpinner);

    // Add Watch later to beginning of channelPlaylists
    channelPlaylists.unshift({
      title: 'Watch later',
      id: 'WL',
      privacy: 'private',
    });

    channelPlaylists.forEach((playlist) => {
      const playlistElement = this.createChannelPlaylistElement(
        playlist,
        onclick,
      );
      this.channelPlaylistsList.append(playlistElement);
    });

    if (incomplete) {
      this.channelPlaylistsList.append(listSpinner);
    }

    UI.hide(this.channelSpinner);
    UI.show(this.channelPlaylists);
  }

  static createQuickPlaylistElement(playlist, index) {
    const { url, length } = playlist;

    const row = UI.createDomElement(
      `<div class="valign-wrapper pointer hover-highlight row">
        <i class="material-icons grey-text col s2">playlist_play</i>
        <span class="col s10">Videos ${index * 50 + 1} to ${index * 50
        + length}</span>
      </div>`,
    );

    row.addEventListener('click', () => {
      chrome.tabs.create({ url, active: false });
    });

    return row;
  }

  showQuickPlaylists(quickPlaylists) {
    UI.hide(this.quickPlaylistsSpinner);
    quickPlaylists.forEach((playlist, index) => {
      const row = UI.createQuickPlaylistElement(playlist, index);
      this.quickPlaylistsList.append(row);
    });

    if (quickPlaylists.length > 1) {
      const row = UI.createDomElement(
        `<div class="valign-wrapper pointer hover-highlight row">
          <i class="material-icons grey-text col s2">playlist_play</i>
          <span class="col s10">Open All (${quickPlaylists.length} tabs)</span>
      </div>`,
      );

      row.addEventListener('click', () => {
        quickPlaylists.forEach((playlist) => {
          const { url } = playlist;
          chrome.tabs.create({ url, active: false });
        });
      });

      this.quickPlaylistsList.prepend(row);
    }
  }
}
