# SOURAJIT VFX Mini — WhatsApp Bot Setup

This repository now contains a **starter bot core** and a separate premium static landing page. The bot is not hosted by GitHub Pages; run it on a Node.js host or your own machine.

## Included commands

- `.menu` / `.help` — command menu
- `.ping` — response check
- `.alive` — running status
- `.owner` — reports whether owner contact is configured

## Requirements

- Node.js 20 or newer
- A WhatsApp account that you own or are explicitly authorized to connect
- A private environment configuration

## Setup

1. Clone or download this repository.
2. Copy `.env.example` to `.env` on your host.
3. Set `PAIRING_NUMBER` to your own number in international format without a plus sign, e.g. `91XXXXXXXXXX`.
4. Set `OWNER_NUMBER` to your owner number in the same format.
5. Install dependencies with `npm install`.
6. Run `npm start` and read the pairing code in the private server logs.
7. Enter that code only in WhatsApp's Linked Devices flow on your own phone.

The bot saves authentication in `session/`. Never upload that folder, send it to anyone, or expose host logs containing pairing codes. If you accidentally expose a session, unlink it immediately from WhatsApp Linked Devices.

## Safety and limitations

- The pairing number is read from the local `.env`; the bot does not accept arbitrary numbers from chat.
- There is no mass-messaging or public pairing command.
- This is a small starter implementation, not the entire MONA-LISA-Mini plugin collection. Media/AI integrations, anti-link moderation, and other advanced plugins have not been ported.
- Baileys is an unofficial WhatsApp Web integration and may be affected by WhatsApp changes or account restrictions.
- Keep all API keys and database credentials private.
