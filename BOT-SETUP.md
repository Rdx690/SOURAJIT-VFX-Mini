# SOURAJIT VFX Mini — WhatsApp Bot Setup

This repository contains a WhatsApp bot starter and a separate static landing page. GitHub Pages can host the website, but **cannot run the WhatsApp bot process**. Run the bot on Node.js 20+ hosting or your own machine.

## Implemented commands

| Command | Purpose |
|---|---|
| `.menu`, `.help`, `.commands` | Show command list |
| `.ping` | Check response |
| `.alive` | Bot running status |
| `.owner` | Check owner configuration status |
| `.runtime` | Process uptime and runtime details |
| `.info` | Bot information |
| `.repo` | Repository link |
| `.date`, `.time` | Current date and time |
| `.joke` | Random joke |
| `.fact` | Random fact |
| `.quote` | Motivational quote |
| `.compliment` | Positive message |
| `.riddle` | Random riddle |
| `.trivia` | Quick trivia question with answer |
| `.flip`, `.coinflip` | Flip a coin |
| `.dice` | Roll a six-sided die |
| `.8ball <question>` | Random 8-ball response |
| `.choose tea | coffee` | Choose between options separated by `|` |
| `.echo <text>` | Repeat text |
| `.reverse <text>` | Reverse text |
| `.upper <text>` | Convert text to uppercase |
| `.lower <text>` | Convert text to lowercase |
| `.count <text>` | Count characters and words |

## Sayan Nexus music, video and Instagram commands

The bot now calls these configured-in-code HTTPS endpoints:

- `.song <song name>`, `.play <song name>`, `.music <song name>`, `.ytmp3 <song name>` — query the music endpoint and send the returned MP3 URL as WhatsApp audio.
- `.video <query or URL>`, `.ytmp4 <query or URL>` — query the video endpoint and send the returned MP4 URL as WhatsApp video.
- `.insta <Instagram URL>`, `.ig <Instagram URL>`, `.igreel <Instagram URL>` — query the Instagram endpoint and send the returned image/video URL.

The code expects a JSON response with `status: "success"` and a direct HTTPS `url` field. Media sending depends on the provider's links still being valid and WhatsApp/Baileys being able to fetch them. The supplied API is an external third-party service, so availability and response format can change; these commands have not been live-tested. Only download content you own or have permission to use.

## Premium menu picture and link

Set these optional values in your private `.env`:
- `BOT_PICTURE_URL=https://your-hosted-image-url` — optional HTTPS profile/menu image URL.
- `BOT_SOCIAL_LINK=https://your-link` — link shown in the menu (defaults to this GitHub repository).

No personal picture URL was supplied, so the code supports your own hosted picture but does not invent one.

## Settings and plugin system

Persistent settings are stored locally in `data/settings.json`; do not commit that runtime data file.

Owner-only controls (set `OWNER_NUMBER` in your private `.env`):
- `.settings` — show settings and loaded plugin count
- `.setprefix <symbol>` — set a 1–3 character prefix
- `.setname <name>` — change the displayed bot name
- `.autoread on/off` — toggle read receipts
- `.public` / `.private` — save the mode setting (this does not add public pairing)
- `.plugins` — list plugins
- `.pluginreload` — reload plugin files

Plugins live in `plugins/*.js` and export an object with `name`, optional `aliases`, optional `description`, and an async `execute(context)` function. The context includes `reply`, `args`, `command`, `sock`, `message`, `jid`, and an `isOwner` helper. Only install plugins you trust: JavaScript plugins execute with the bot process's permissions. The included examples are `ping` and `uptime`.

Settings such as anti-link, welcome and auto-react are currently stored/displayed as configuration flags only; their moderation/automation handlers are not implemented yet.

## Downloader commands

The following commands are wired to a configurable external HTTPS API adapter:

- `.ytmp3 <YouTube URL>`
- `.ytmp4 <YouTube URL>`
- `.tiktok <TikTok URL>`
- `.ig <Instagram URL>` / `.igreel <Instagram URL>`
- `.facebook <Facebook URL>`
- `.spotify <Spotify URL>`
- `.pinterest <Pinterest URL>`

Configure `DOWNLOAD_API_URL` in your private `.env`. The provider must accept a `url` query parameter and return JSON containing a direct URL in a common field such as `download`, `downloadUrl`, `download_url`, or `url` (or corresponding `data`/`result` fields). The adapter passes a `platform` query parameter too. Provider response formats vary; test against your provider. Without a provider URL, the bot explains that setup is missing instead of inventing a link. These commands return a provider link; they do not upload the media file into WhatsApp.

Only use content you own or have permission to download, and respect each platform's terms.

## Setup

1. Copy `.env.example` to `.env` on your host.
2. Set `PAIRING_NUMBER` to your own number in international format without a plus sign, e.g. `91XXXXXXXXXX`.
3. Set `OWNER_NUMBER` in the same format.
4. Run `npm install`, then `npm start`.
5. Read the pairing code in the private server logs and enter it only in WhatsApp's Linked Devices flow on your own phone.

The bot saves authentication in `session/`. Never upload that folder, share it, or expose logs containing pairing codes. If you accidentally expose a session, unlink it immediately from WhatsApp Linked Devices.

## Not included yet

These commands are **not implemented** in this starter: media downloads, AI, sticker creation, group moderation/anti-link, anti-delete, auto-status, and the full upstream plugin collection. They should not be advertised as working until added and tested.

This is an unofficial WhatsApp Web integration. Keep your account secure and use it only with an account you own or are authorized to operate.
