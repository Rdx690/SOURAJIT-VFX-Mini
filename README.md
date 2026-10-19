# VFX AI MINI — by SOURAJIT VFX

VFX AI MINI is the branded web interface for the multi-user WhatsApp bot in this repository. The existing Firebase sign-in flow, private user sessions, QR pairing, pairing-code generation, and per-user settings are retained.

## Project layout

- `index.html` — landing page
- `auth.html` — Firebase authentication
- `dashboard.html` — authenticated dashboard
- `connect.html` — VFX AI MINI pairing page (pairing code + QR)
- `server.js` — authenticated Express/Baileys API
- `index.js` — single-session bot entry point
- `firebase.js` — Firebase web configuration (public client config only)
- `plugins.js`, `commands.js`, `downloader.js`, `media.js`, `settings.js` — bot functionality

## Hosting

The static website can be hosted on GitHub Pages or another static host. The Express/Baileys API must run as a persistent Node.js service (for example, Koyeb) because WhatsApp Web sockets and session files cannot be kept alive in Vercel serverless functions.

1. Deploy this repository's Node.js API with build command `npm install` and start command `npm start`.
2. Configure `FIREBASE_SERVICE_ACCOUNT_JSON` as a private service environment variable.
3. Mount persistent storage, set `DATA_DIR=/data`, and ensure the service has a persistent volume mounted at `/data`.
4. Set `ALLOWED_ORIGINS` to the exact website origin.
5. In `connect.html`, ensure `API_BASE` points at the deployed API origin.
6. Follow [FIREBASE-SETUP.md](FIREBASE-SETUP.md) and [BOT-SETUP.md](BOT-SETUP.md) for complete setup instructions.

## Security

Never commit real `.env` files, Firebase service-account JSON, WhatsApp session folders, tokens, pairing codes, or QR codes. The backend checks Firebase ID tokens on private API routes and scopes session storage to the authenticated user.

## Disclaimer

This is an unofficial WhatsApp Web automation project based on Baileys. Use only with an account you own or are authorized to manage and understand that third-party automation may violate WhatsApp terms or lead to account restrictions.
