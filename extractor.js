/* eslint-disable no-useless-escape */
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
  // prettier-ignore
  const re = new RegExp(
    '(?:'
      + '[?=&+%\\/:\\w.-]*'
      + 'https?' // Either http or https.
      + '(?::\\/\\/|%3A%2F%2F)' // :// may be URL encoded.
      + '(?:[\\w-]+\\.)?' // optional subdomain.
      + '(?:' // Group host alternatives.
      + 'youtu\\.be\\/' // Either youtu.be,
      + '|youtube' // or youtube.com or
      + '(?:-nocookie)?' // youtube-nocookie.com
      + '\\.com\\/'
      + '(?!user|c|redirect|howyoutubeworks)' // These paths can produce false positives,
      + '\\S*?' // anything else is fine.
      + '[^\\w\\s-])' // char before ID is non-ID char
      + '|(?:\\/watch\\?v=)' // or may be internal youtube.com links
      + ')' // End host alts.
      + '(?:3D)?' // possible 3D param
      + '([\\w-]{11})' // $1: videoID is exactly 11 chars
      + '(?=[^\\w-]|$)' // Assert next char is non-ID or EOS
      + '(?!' // Assert URL is not pre-linked
      + '[?=&+%\\w.-]*' // Allow URL remainder
      + '(?:' // Group pre-linked alternatives
      + "[''][^<>]*>" // Either inside a start tag,
      + '|<\\/a>' // or inside <a> element text contents
      + ')' // End recognised pre-linked alts.
      + ')' // End negative lookahead assertion.
      + '[?=&+%;\\w.-]*', // Consume any URL (query) remainder.
  );

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
