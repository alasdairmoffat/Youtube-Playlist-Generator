// contained in a block to allow variables to fall out of scope
// this allows the script to function more than once per DOM load
{
  // Create an array to contain video IDs for all linked and embedded youtube videos.
  const videoIds = [];

  const linkProperty = {
    a: 'href',
    object: 'data',
    iframe: 'src',
    embed: 'src',
  };

  // Create RegEx to correctly extract video ID from any type of youtube URL.
  // eslint-disable-next-line no-useless-escape
  const re = /[?=&+%\/:\w.-]*https?(?::\/\/|%3A%2F%2F)(?:[\w-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*?[^\w\s-])(?:3D)?([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:[''][^<>]*>|<\/a>))[?=&+%;\w.-]*/;

  // create NodeList with all requested types maintaining page order
  const allLinks = document.querySelectorAll('a, iframe, embed, object');

  allLinks.forEach((elem) => {
    elem[linkProperty[elem.localName]].replace(re, (fullString, extractedId) => {
      if (!videoIds.includes(extractedId)) {
        videoIds.push(extractedId);
      }
    });
  });

  chrome.extension.sendMessage({
    type: 'videoIds',
    videoIds,
  });
}
