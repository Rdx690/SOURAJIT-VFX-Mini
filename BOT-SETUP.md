# SOURAJIT VFX Mini — Multi-user deployment

## Architecture
- Static site: GitHub Pages or another static host.
- API + Baileys: Koyeb Node.js web service using `npm start`.
- Authentication: Firebase Authentication ID tokens verified server-side by Firebase Admin.
- Each Firebase UID gets a separate WhatsApp auth directory and separate settings file under `DATA_DIR/sessions/<uid>/`.

## Before deploying
1. Enable Email/Password sign-in in Firebase Authentication.
2. In Firebase Console → Project settings → Service accounts, generate a service-account private key. Store the full JSON as the Koyeb secret/environment variable `FIREBASE_SERVICE_ACCOUNT_JSON`. Never commit this JSON to GitHub or put it in browser code.
3. Create a Koyeb persistent volume and mount it at `/data`; set `DATA_DIR=/data`. Without persistent storage, sessions can be lost on redeploy/restart.
4. Set `ALLOWED_ORIGINS` to the exact deployed website origin(s), comma-separated. Example for GitHub Pages: `https://rdx690.github.io` (the origin does not include the repository path).
5. Deploy this repository as a Koyeb Web Service with build command `npm install`, run command `npm start`, and HTTP port `8000`.
6. Set the API URL in `connect.html` to the Koyeb public URL, e.g. `https://YOUR-SERVICE.koyeb.app`.
7. Add your actual site domain to Firebase Authentication → Settings → Authorized domains.
8. Open `connect.html`, sign in, and connect only a WhatsApp account you own or are authorized to operate.

## API
- `GET /health`: public health check.
- `GET /api/status`: current user's WhatsApp connection state, QR data URL, or pairing code.
- `POST /api/whatsapp/connect`: start a session. Optional JSON `{"phoneNumber":"91XXXXXXXXXX"}` requests a pairing code; omit phone number to use QR pairing.
- `POST /api/whatsapp/disconnect`: log out the current user's WhatsApp session.
- `PATCH /api/settings`: update the signed-in user's bot settings.
- `DELETE /api/whatsapp/session`: logout and delete only the signed-in user's session data.

All `/api/*` endpoints except `/health` require `Authorization: Bearer <Firebase ID token>`. Each request is scoped to the verified Firebase UID. Never expose a service-account key, pairing code, QR, or session files.

## Dashboard settings
Auto-read, auto-react, anti-link, welcome, bot name, prefix, and private-mode are per-user settings. Anti-link requires the bot to be a group admin to delete messages. Use responsibly and comply with WhatsApp terms. Baileys is an unofficial WhatsApp Web integration; availability and account restrictions are outside this project's control.
