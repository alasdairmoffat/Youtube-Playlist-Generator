# Youtube Playlist Generator

No longer functional.

API login stopped functioning, and was stripped out. Quick Playlist functionality became of little value after youtube.com updates.

Extracts all youtube video IDs from a webpage and either creates a playlist, or adds to a playlist belonging to the loggid in youtube account.

## Setup

### Required data

- **Key** aquired following these [instructions](https://developer.chrome.com/apps/manifest/key):

  > ```bash
  > manifest.json: {"key"}
  > ```

- **Youtube API key** acquired from [Google Cloud Platform](https://console.cloud.google.com):

  > ```bash
  > background/background.js:  apiKey
  > ```

- **OAuth2.0 Client ID** acquired from [Google Cloud Platform](https://console.cloud.google.com):

  > ```bash
  > manifest.json:  {"oauth2": {"client_id"}}
  > ```
