const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');
const config = require('./config');
const commandTools = require('./commands');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let reconnecting = false;

function normalizeJid(jid = '') {
  return jid.split(':')[0].split('@')[0].replace(/[^0-9]/g, '');
}

function isOwner(jid) {
  const number = normalizeJid(jid);
  return config.OWNER_NUMBERS.includes(number);
}

function menuText() {
  return [
    `╭─「 ${config.BOT_NAME} 」`,
    '│',
    `│ Prefix: ${config.PREFIX}`,
    '│',
    '├─ GENERAL',
    `│ ${config.PREFIX}menu  — Show commands`,
    `│ ${config.PREFIX}ping  — Check response`,
    `│ ${config.PREFIX}alive — Bot status`,
    `│ ${config.PREFIX}help  — Help message`,
    '│',
    '├─ OWNER',
    `│ ${config.PREFIX}owner — Owner-only status`,
    '│',
    '╰────────────────────',
    '',
    'Use responsibly. Never share your pairing code or session files.'
  ].join('\n');
}

async function startBot() {
  if (reconnecting) return;
  reconnecting = true;

  try {
    fs.mkdirSync(path.resolve(config.SESSION_DIR), { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(config.SESSION_DIR);

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: process.env.LOG_LEVEL || 'silent' }),
      printQRInTerminal: false,
      browser: ['SOURAJIT VFX MINI', 'Chrome', '1.0.0'],
      markOnlineOnConnect: false,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'connecting') {
        console.log('[SOURAJIT VFX] Connecting to WhatsApp…');
      }

      if (connection === 'open') {
        console.log('[SOURAJIT VFX] Connected successfully.');
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        console.log('[SOURAJIT VFX] Connection closed:', statusCode || 'unknown');

        reconnecting = false;
        if (!loggedOut) {
          await sleep(2500);
          startBot().catch((error) => console.error('[Reconnect]', error.message));
        } else {
          console.error('Logged out. Remove your local session folder and pair again if you own this account.');
        }
      }

      if (connection === 'open') reconnecting = false;
    });

    // Pair only the phone number supplied by the operator in local environment settings.
    if (!state.creds.registered && config.PAIRING_NUMBER) {
      await sleep(1500);
      try {
        const code = await sock.requestPairingCode(config.PAIRING_NUMBER);
        console.log('\n====================================');
        console.log('SOURAJIT VFX PAIRING CODE:', code);
        console.log('Enter this code only on your own WhatsApp device.');
        console.log('Do not share it with anyone. Keep session/ private.');
        console.log('====================================\n');
      } catch (error) {
        console.error('Could not request pairing code:', error.message);
      }
    }

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const message of messages) {
        if (!message.message || message.key.fromMe) continue;
        const jid = message.key.remoteJid;
        if (!jid || jid === 'status@broadcast') continue;

        const body = message.message.conversation
          || message.message.extendedTextMessage?.text
          || message.message.imageMessage?.caption
          || message.message.videoMessage?.caption
          || '';
        const text = body.trim();
        if (!text.startsWith(config.PREFIX)) continue;

        const [rawCommand] = text.slice(config.PREFIX.length).trim().split(/\s+/);
        const command = (rawCommand || '').toLowerCase();
        const reply = (value) => sock.sendMessage(jid, { text: value }, { quoted: message });

        try {
          if (command === 'ping') {
            const started = Date.now();
            await reply(`🏓 Pong!\nResponse: ${Date.now() - started} ms`);
          } else if (command === 'alive') {
            await reply(`✅ ${config.BOT_NAME} is running.\nPrefix: ${config.PREFIX}`);
          } else if (command === 'owner') {
            if (!config.OWNER_NUMBERS.length) {
              await reply('Owner contact is not configured. Set OWNER_NUMBER in your private .env file.');
            } else {
              await reply('Owner contact is configured privately by the operator.');
            }
          } else {
            const handled = await commandTools.execute({
              command,
              args: text.slice(config.PREFIX.length).trim().split(/\\s+/).slice(1),
              prefix: config.PREFIX,
              botName: config.BOT_NAME,
              reply
            });
            if (!handled) {
              await reply(`Unknown command: ${command}\nType ${config.PREFIX}menu to see available commands.`);
            }
          }
        } catch (error) {
          console.error('Command error:', error.message);
        }
      }
    });

    if (config.AUTO_READ) {
      sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const message of messages) {
          if (message.key?.remoteJid && !message.key.fromMe) {
            try { await sock.readMessages([message.key]); } catch {}
          }
        }
      });
    }
  } catch (error) {
    reconnecting = false;
    console.error('Bot startup failed:', error.message);
    setTimeout(() => startBot().catch((err) => console.error(err.message)), 5000);
  }
}

startBot().catch((error) => {
  console.error('Fatal startup error:', error.message);
  process.exitCode = 1;
});