# For my Hetu

A static-first private couples portal for Chikoo and Prath. Existing login-by-person, home counter, Feelings Portal, Diary, Journey, music player and Love Typer remain. Love Arcade uses one responsive fixed-step canvas shell and separate game modules.

## Run locally

- No Python is needed to preview or deploy. Once this GitHub repository is connected to Vercel, push a branch for a preview deployment and merge it to the production branch when ready.
- For a full local preview, install Node.js 18+, run `npm install`, link the folder to the Vercel project, pull its development variables with `npx vercel pull`, then start `npx vercel dev`. This runs the API routes needed for memory uploads and the full YouTube catalogue.
- Reload once with cache disabled after frontend changes so the service worker installs the latest shell.

## Environment and deployment

Copy `.env.example` to `.env.local` for local Vercel development. Do not commit real secrets.

- `YOUTUBE_API_KEY`: YouTube Data API v3 key. The playlist API pages 50 entries at a time; the embedded-player fallback is limited to about 200 entries. Set this variable on Vercel to load, search and play the complete playlist catalogue, including song titles, creators and thumbnails.
- `HETU_MEDIA_CODE`: a long shared passphrase known to both people. It unlocks memory photo APIs and is exchanged for a seven-day HttpOnly, SameSite cookie; it is never stored in frontend code.
- `BLOB_READ_WRITE_TOKEN`: connect a **private** Vercel Blob store to the project to provision this variable. Uploaded memory images and metadata are private blobs and are read through authenticated API routes. Do not make the store public.

Connect the private Blob store, set these variables in Vercel, then push the files to the connected Git branch or run `vercel --prod`. See [Vercel private Blob storage](https://vercel.com/docs/vercel-blob/private-storage).

## Cycle tracker sync

The tracker reuses the existing Google Apps Script endpoint from `script.js`, already used by the portal. It syncs period starts/ends, daily flow/mood/symptoms/notes and cycle settings in the shared cycle document. The client keeps a localStorage cache (`hetuCycleDoc`), queues changes in `hetuCyPending` while offline, merges by each item's update timestamp, retries on reconnect, and polls every five seconds while visible. The endpoint must implement `GET ?action=getCycleDoc` and accept JSON `POST {"items": {...}}`. No service-role or admin key is shipped to the browser.

Legacy `periodData`, `periodCycleLength` and `periodLength` values migrate once if present. On first backend contact the client reads the shared document before uploading cached rows, and only sends local records that are newer or absent remotely. An empty local cache is never posted over a non-empty remote document.

### Two-device sync smoke test

1. Open the app on two devices and log in as Chikoo and Prath.
2. Log a period day and change a tracker setting. Check the first device changes from “Syncing…” to “Synced 💕”.
3. Confirm the second device updates within about five seconds without refresh.
4. Disconnect one device, make a change, refresh, then reconnect. Confirm the queued change reaches the other device.
5. Compare dates, flow, mood, symptoms, notes and cycle/period lengths on both devices.

## Shared memory photos

1. In Vercel Storage, create and connect a **private** Blob store.
2. Set a strong `HETU_MEDIA_CODE` and `YOUTUBE_API_KEY` as needed.
3. Redeploy so the Blob token and API routes are active.
4. In Our Journey, tap **Unlock shared photos** and enter the passphrase once on each device. Tap **Memory** to choose a photo directly from the device; images resize to WebP and are limited to 3 MB after resizing. Title, date, description and photo save to the shared private store.
5. The access cookie lasts seven days per device. The person picker is a convenience screen, not account authentication, so keep the media passphrase private.

## Playlist and arcade

The full playlist catalogue comes from `/api/youtube-playlist` in 50-item pages. Search pages until it finds a match; **Load all songs** fetches the rest. Missing `YOUTUBE_API_KEY` leaves the embedded list capped and the UI explains the setup.

The arcade includes Catch the Heart, Love Slasher, Memory Match (using Journey photos), Couple’s Dare, Quiz About Us and the preserved Love Typer. Canvas games use a fixed 60 Hz timestep, touch/keyboard controls, pause/resume, game-over overlays, optional Web Audio tones and reduced-motion-friendly UI. Arcade scores post to the existing Apps Script leaderboard, queue locally while offline, and compare Chikoo vs Prath. Love Typer keeps its existing leaderboard.

## Manual regression checklist

- Sign in as both people; verify home counter, Feelings Portal, Diary, Love Typer and Journey remain available.
- Navigate between sections and verify no memory popup opens automatically.
- Add/edit/delete a shared Journey photo on each device; verify private memory API responses are not cached offline.
- Search for a song beyond the first 200, load all songs, check title/creator/thumbnail, and play several tracks.
- Play each arcade mode on desktop and mobile; test keyboard/swipes, pause/resume, mute, game-over and the shared tally.
- Check light/dark appearance, keyboard focus and reduced-motion preference.

