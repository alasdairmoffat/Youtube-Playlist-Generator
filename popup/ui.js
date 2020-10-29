// eslint-disable-next-line no-unused-vars
class UI {
  constructor() {
    this.numVideos = document.querySelector('#num-videos');
    this.quickPlaylists = document.querySelector('#quick-playlists');
    this.quickPlaylistsList = document.querySelector('#quick-playlists-list');
    this.errorContainer = document.querySelector('#error-container');
    this.errorMessage = document.querySelector('#error-message');
    this.quickPlaylistsSpinner = document.querySelector(
      '#quick-playlists-spinner',
    );
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
    const { message } = error;
    this.errorMessage.textContent = message;

    UI.show(this.errorContainer);
  }

  updateVideoCount(numVideos) {
    if (numVideos === 0) {
      this.numVideos.textContent = 'No videos found';
      UI.hide(this.quickPlaylists);
    } else {
      this.numVideos.textContent = `${numVideos} video${
        numVideos === 1 ? '' : 's'
      } found`;
      UI.show(this.quickPlaylists);
    }
  }

  static createDomElement(elementString) {
    return new DOMParser().parseFromString(elementString, 'text/html').body
      .firstChild;
  }

  static createQuickPlaylistElement(playlist, index) {
    const { url, length } = playlist;

    if (length === 0) {
      console.log(`Failed Request: ${playlist.request.url}`);
      return UI.createDomElement(
        `<div class="valign-wrapper p10 row">
          <i class="material-icons grey-text col s2">error_outline</i>
          <span class="col s10">Error: Invalid Video</span>
        </div>`,
      );
    }

    const row = UI.createDomElement(
      `<div class="valign-wrapper pointer hover-highlight p10 row">
        <i class="material-icons grey-text col s2">playlist_play</i>
        <span class="col s10">Videos ${index * 50 + 1} to ${
  index * 50 + length
}</span>
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

    // Filter out failed requests
    const successfulPlaylists = quickPlaylists.filter(
      playlist => playlist.url,
    );

    // Create Open All element if multiple playlists
    if (successfulPlaylists.length > 1) {
      const row = UI.createDomElement(
        `<div class="valign-wrapper pointer hover-highlight p10 row">
          <i class="material-icons grey-text col s2">playlist_play</i>
          <span class="col s10">Open All (${successfulPlaylists.length} tabs)</span>
      </div>`,
      );

      row.addEventListener('click', () => {
        successfulPlaylists.forEach((playlist) => {
          const { url } = playlist;
          chrome.tabs.create({ url, active: false });
        });
      });

      this.quickPlaylistsList.prepend(row);
    }
  }
}
