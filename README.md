# Hetu-portal-demo

## Run locally

For a static preview, run `python -m http.server 8000` from the project root and open `http://localhost:8000`.

To preview the complete playlist integration, run the project with `vercel dev` and set `YOUTUBE_API_KEY` in the local Vercel environment. Enable the YouTube Data API v3 for the Google Cloud project that owns the key. Keep the key in the environment; do not add it to client-side files.

The playlist panel pages through the public YouTube playlist in groups of 50. When the API key is not configured, the player falls back to the embedded playlist and still shows available thumbnails and video details as they load.
