# The Room

Local setup of the original attic-room concept. Run the repository's static server and open `/room/`. The TV is dedicated to **MINI DOC 1 The Ride to Die** (27 minutes), with its archive chooser hidden. The neon sign above it names the film, and the clickable table Post-it opens the archive. The archive includes **snapnyap** (51 seconds), the tablet opens **Psychosis Loops** (1 minute 17 seconds), and the laptop opens **mini doc 2 theme song** (1 minute 16 seconds), all supplied by Ryan through Bunny. The four existing short site animations remain labeled **Room motion studies**.

## Bunny Stream

All 26 uploads from library **766115 / The Dirt Show** are integrated, with public HLS sources and Bunny thumbnails read from both dashboard pages. The phone opens `minidoc1`; each device can select any film. Both uploads named `psychosislolololopsmusicvid.mp4` are retained under distinct IDs; the previously connected version keeps Ryan's title **mini doc 2 theme song**. Other upload titles retain their filenames without `.mp4` until Ryan names them. All 26 master playlists returned HTTP 200 with five variants during integration. The four local motion studies remain separately labeled.

Create a Stream library using standard encoding. Upload a few archive films and wait for encoding. Each entry in `videos.json` needs the public playback URL, title, collection and poster. No API key belongs in these files.

```json
{
  "id": "stable-video-id",
  "title": "Approved video title",
  "collection": "Documentary",
  "description": "Approved description",
  "src": "https://YOUR-CDN-HOST/VIDEO-GUID/playlist.m3u8",
  "type": "application/x-mpegURL",
  "poster": "https://YOUR-CDN-HOST/VIDEO-GUID/thumbnail.jpg",
  "preview": "/room/assets/a-small-muted-preview.mp4",
  "duration": "05:20",
  "captions": [{"src": "/room/assets/film-en.vtt", "language": "en", "label": "English"}]
}
```

`preview`, `duration`, and `captions` are optional. Use short muted local previews instead of the full HLS stream for ambient screens. Only the chosen film loads into the full player. HLS sources lazily load pinned hls.js, with native HLS fallback when Media Source playback is unavailable. Test the actual Bunny URL and any allowed-domain/CORS settings before publishing. Token-authenticated sources require a separate signing service, not a browser-visible secret.

Screens use four normalized corners in `room.js`, mapped onto the physical devices with a perspective transform. `archive-room-v2.webp` is a sibling edit; the original room remains available at `/action-figure-room.webp`.

## Artwork provenance

Built-in image generation edited `action-figure-room.png`, preserving the attic, figures, shelves, flags and cats, removing baked social-interface panels and adding a blank TV, tablet, laptop and phone. Prompt: preserve the original scene and all eight figure identities/relative lineup; add four realistic physical devices without covering faces; use plain nearblack screens facing the camera with subtle perspective, matching amber/red room lighting; no new people or screen UI. Output source: `assets/trap-house/archive-room-v2.png`; delivery asset: matching `.webp`.

Ryan approved publishing the room on September 29, 2026. The route is public and indexable.
