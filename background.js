const requestStart = 'https://www.youtube.com/watch_videos?video_ids=';
const playlistStart = 'https://www.youtube.com/playlist?list=';

const re = /"playlistId":"((?:PL|LL|EC|UU|FL|RD|UL|TL|OLAK5uy_)[0-9A-Za-z-_]{10,})"/;

async function createQuickPlaylists(videoIds) {
  const requestUrls = [];
  const maxPlaylistLength = 50;
  const numberOfLists = Math.ceil(videoIds.length / maxPlaylistLength);

  for (let i = 0; i < numberOfLists; i += 1) {
    requestUrls.push(
      `${requestStart}${videoIds
        .slice(i * maxPlaylistLength, (i + 1) * maxPlaylistLength)
        .join(',')}`,
    );
  }

  const responsePages = await Promise.all(
    requestUrls.map(async url => fetch(url).then(async response => response.text())),
  );

  const finalUrls = responsePages.map(
    response => `${playlistStart}${re.exec(response)[1]}&disable_polymer=true`,
  );

  chrome.extension.sendMessage({
    type: 'quickPlaylists',
    urls: finalUrls,
  });
}

chrome.extension.onMessage.addListener((msg) => {
  switch (msg.type) {
    case 'videoIds':
      if (msg.videoIds.length > 0) {
        createQuickPlaylists(msg.videoIds);
      }
      break;
    default:
      break;
  }
});
