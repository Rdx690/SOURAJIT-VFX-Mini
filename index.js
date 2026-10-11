const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');
const config = require('./config');
const commandTools = require('./commands');
const downloaderTools = require('./downloader');
const mediaTools = require('./media');
const settings = require('./settings');
const pluginSystem = require('./plugins');
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
        const activePrefix = settings.get('prefix') || config.PREFIX;
        if (!text.startsWith(activePrefix)) continue;

        const [rawCommand] = text.slice(activePrefix.length).trim().split(/\s+/);
        const command = (rawCommand || '').toLowerCase();
        const reply = (value) => sock.sendMessage(jid, { text: value }, { quoted: message });

        try {
          const currentPrefix = settings.get('prefix') || config.PREFIX;
          const args = text.slice(currentPrefix.length).trim().split(/\s+/).slice(1);
          const ownerOnly = ['settings', 'setprefix', 'setname', 'autoread', 'public', 'private', 'plugins', 'pluginreload'];
          if (ownerOnly.includes(command) && !isOwner(jid)) {
            await reply('⛔ Owner-only command.');
            continue;
          }

          if (command === 'settings') {
            const s = settings.getAll();
            await reply([
              '╭─「 SOURAJIT VFX SETTINGS 」',
              `│ Prefix: ${s.prefix}`,
              `│ Bot name: ${s.botName}`,
              `│ Auto-read: ${s.autoRead ? 'ON' : 'OFF'}`,
              `│ Auto-react: ${s.autoReact ? 'ON' : 'OFF'}`,
              `│ Auto-status-view: ${s.autoStatusView ? 'ON' : 'OFF'}`,
              `│ Public mode: ${s.publicMode ? 'ON' : 'OFF'}`,
              `│ Anti-link: ${s.antiLink ? 'ON (setting only)' : 'OFF'}`,
              `│ Welcome: ${s.welcome ? 'ON (setting only)' : 'OFF'}`,
              `│ Plugin count: ${pluginSystem.listPlugins().length}`,
              '╰────────────────────',
              '',
              'Owner: .setprefix <symbol> | .setname <name>',
              'Owner: .autoread on/off | .public | .private',
              'Owner: .plugins | .pluginreload'
            ].join('\n'));
          } else if (command === 'setprefix') {
            const value = args[0];
            if (!value || value.length > 3 || /\s/.test(value)) {
              await reply('Usage: .setprefix <1-3 characters>');
            } else {
              settings.set('prefix', value);
              await reply('✅ Prefix changed to: ' + value);
            }
          } else if (command === 'setname') {
            const value = args.join(' ').trim();
            if (!value || value.length > 60) await reply('Usage: .setname <bot name, max 60 chars>');
            else { settings.set('botName', value); await reply('✅ Bot name updated in settings.'); }
          } else if (command === 'autoread') {
            const value = (args[0] || '').toLowerCase();
            if (!['on', 'off'].includes(value)) await reply('Usage: .autoread on/off');
            else { settings.set('autoRead', value === 'on'); await reply('✅ Auto-read setting: ' + value.toUpperCase()); }
          } else if (command === 'public') {
            settings.set('publicMode', true);
            await reply('ℹ️ Public mode setting saved. It does not enable any public pairing command.');
          } else if (command === 'private') {
            settings.set('publicMode', false);
            await reply('🔒 Private mode setting saved.');
          } else if (command === 'plugins') {
            const list = pluginSystem.listPlugins();
            await reply('🧩 LOADED PLUGINS\n' + (list.map(p => `• ${p.name}: ${p.description}`).join('\n') || 'No plugins loaded.'));
          } else if (command === 'pluginreload') {
            const list = pluginSystem.loadPlugins();
            await reply('🔄 Plugin reload complete. Loaded: ' + list.length);
          } else if (command === 'ping') {
            const started = Date.now();
            await reply(`🏓 Pong!\nResponse: ${Date.now() - started} ms`);
          } else if (command === 'alive') {
            await reply(`✅ ${settings.get('botName')} is running.\nPrefix: ${currentPrefix}`);
          } else if (command === 'owner') {
            await reply(config.OWNER_NUMBERS.length ? 'Owner contact is configured privately by the operator.' : 'Owner contact is not configured. Set OWNER_NUMBER in your private .env file.');
          } else {
            let handled = await pluginSystem.executePlugin({ command, args, prefix: currentPrefix, botName: settings.get('botName'), reply, sock, message, jid, isOwner: isOwner(jid) });
            if (!handled) handled = await mediaTools.executeMediaCommand({ command, args, reply, sock, jid, message, botName: settings.get('botName') });
            if (!handled) handled = await downloaderTools.executeDownloader({ command, args, reply });
            if (!handled) handled = await commandTools.execute({ command, args, prefix: currentPrefix, botName: settings.get('botName'), reply });
            if (!handled) await reply(`Unknown command: ${command}\nType ${currentPrefix}menu to see available commands.`);
          }
        } catch (error) {
          console.error('Command error:', error.message);
        }
      }
    });

    if (settings.get('autoRead')) {
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