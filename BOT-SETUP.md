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
