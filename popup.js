window.onload = () => {
  const anonymousPlaylists = document.querySelector('#anonymous-playlists');
  const numVideos = document.querySelector('#num-videos');

  chrome.extension.onMessage.addListener((msg) => {
    switch (msg.type) {
      case 'videoIds':
        numVideos.innerText = `${msg.videoIds.length} videos found`;

        break;

      case 'quickPlaylists':
        console.log(msg);
        msg.urls.forEach((url, index) => {
          const button = document.createElement('button');

          button.innerText = `Quick Playlist ${index + 1}`;
          button.onclick = () => {
            chrome.tabs.create({ url, active: false });
          };

          anonymousPlaylists.append(button);
        });

        if (msg.urls.length === 1) {
          anonymousPlaylists.children[0].innerText = 'Quick Playlist';
        } else {
          const button = document.createElement('button');

          button.innerText = 'Open All';

          button.onclick = () => {
            msg.urls.forEach((url) => {
              chrome.tabs.create({ url, active: false });
            });
          };

          anonymousPlaylists.prepend(button);
        }

        anonymousPlaylists.style.display = 'block';

        break;

      default:
        break;
    }
  });

  chrome.tabs.executeScript({ file: './extractor.js' });
};
