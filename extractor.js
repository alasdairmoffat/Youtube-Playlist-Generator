// contained in a block to allow variables to fall out of scope
// this allows the script to function more than once per DOM load
(function extractor() {
  const linkProperty = {
    a: 'href',
    object: 'data',
    iframe: 'src',
    embed: 'src',
  };

  // matches youtube video links of all formats and extracts video Ids
  // eslint-disable-next-line no-useless-escape
  const re = /(?:[?=&+%\/:\w.-]*https?(?::\/\/|%3A%2F%2F)(?:[\w-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?!user|redirect|howyoutubeworks)\S*?[^\w\s-])|(?:\/watch\?v=))(?:3D)?([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:[''][^<>]*>|<\/a>))[?=&+%;\w.-]*/;

  // All the attributes returned from getBoundingClientRect()
  const boundingRectAttributes = [
    'x',
    'y',
    'width',
    'height',
    'top',
    'bottom',
    'left',
    'right',
  ];

  // create Array with all requested types maintaining page order
  const allLinks = [...document.querySelectorAll('a, iframe, embed, object')];

  const videoIds = allLinks.reduce((result, link) => {
    // Remove any links where their bounding rect is all 0s
    // (Sorts issue with youtube search pages containing links that are not displayed)
    const boundingRect = link.getBoundingClientRect();
    if (boundingRectAttributes.some(key => boundingRect[key] !== 0)) {
      // then check for video Id
      const extract = link[linkProperty[link.localName]].match(re);
      if (!!extract && extract[1]) {
        result.push(extract[1]);
      }
    }
    return result;
  }, []);

  return videoIds;
}());
