// contained in a block to allow variables to fall out of scope
// this allows the script to function more than once per DOM load
(function extractor() {
  const linkProperty = {
    a: 'href',
    object: 'data',
    iframe: 'src',
    embed: 'src',
  };

  // added extra element to RegEx for search results on youtube.com
  // eslint-disable-next-line no-useless-escape
  const re = /(?:[?=&+%\/:\w.-]*https?(?::\/\/|%3A%2F%2F)(?:[\w-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*?[^\w\s-])|(?:\/watch\?v=))(?:3D)?([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:[''][^<>]*>|<\/a>))[?=&+%;\w.-]*/;

  // create Array with all requested types maintaining page order
  const allLinks = [].slice.apply(document.querySelectorAll('a, iframe, embed, object'));

  const videoIds = allLinks.reduce((result, element) => {
    const extract = element[linkProperty[element.localName]].match(re);
    if (!!extract && extract[1]) {
      result.push(extract[1]);
    }
    return result;
  }, []);

  return videoIds;
}());
