window.onload = () => {
  console.log('loaded');

  const anonymousPlaylist = document.querySelector('#anonymous-playlist');
  const numVideos = document.querySelector('#num-videos');

  function getAnonymousPage(videoIds) {
    const requestStart = 'https://www.youtube.com/watch_videos?video_ids=';
    const playlistStart = 'https://www.youtube.com/playlist?list=';
    const re = /"playlistId":"((?:PL|LL|EC|UU|FL|RD|UL|TL|OLAK5uy_)[0-9A-Za-z-_]{10,})"/;

    const requestUrl = requestStart.concat(videoIds.join(','));

    fetch(requestUrl).then(async (response) => {
      const text = await response.text();
      text.replace(re, (fullString, playlistId) => {
        const anonymousUrl = `${playlistStart}${playlistId}&disable_polymer=true`;
        anonymousPlaylist.onclick = () => {
          chrome.tabs.create({ url: anonymousUrl, active: true });
        };
        anonymousPlaylist.style.display = 'block';
      });
    });
  }

  chrome.extension.onMessage.addListener((msg) => {
    const videoIds = [];

    switch (msg.type) {
      case 'videoIds':
        videoIds.push(...msg.videoIds);
        numVideos.innerText = `${videoIds.length} videos found`;
        getAnonymousPage(videoIds.slice(0, 50));
        break;
      default: {
        //  do nothing
      }
    }
  });

  // allFrames: true caused script to be run in all embedded videos independantly
  // need to test to see if this can be worked around, in case we need allFrames: true
  chrome.tabs.executeScript({ file: './extractor.js'});
};
