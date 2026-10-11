# Login, Register & Dashboard setup

The website now includes a Firebase email/password login and registration page, a personal dashboard, and per-user settings saved in Cloud Firestore.

## Files
- `auth.html`: register and log in with Firebase Authentication.
- `dashboard.html`: profile view and saveable bot name, picture URL, and social link.
- `firebase.js`: shared Firebase app/auth/Firestore initialization.
- `firestore.rules`: rules that restrict each account to its own `users/{uid}` document.

## Required Firebase Console steps
1. Open Firebase Console → **Authentication** → **Sign-in method** → enable **Email/Password**.
2. Open **Firestore Database** → create a database.
3. Publish the contents of `firestore.rules` under Firestore **Rules**.
4. In **Authentication → Settings → Authorized domains**, add the domain where you host this site. For GitHub Pages, add your GitHub Pages hostname.
5. Serve the pages over HTTPS or localhost. ES module imports do not work reliably when opening the HTML directly as a `file://` URL.

## Important
The Firebase web config is designed to be public in client-side apps. It is **not** a security boundary. Firestore Security Rules are essential. This saves dashboard settings to Firestore; it does not automatically update the WhatsApp bot's server-side `.env` or running process. Copy the saved bot picture/link into the bot host configuration separately unless a trusted backend integration is built.
