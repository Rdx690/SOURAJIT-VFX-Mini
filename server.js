require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const pino = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const pluginSystem = require('./plugins');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '32kb' }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && allowedOrigins.length === 0)) return callback(null, true);
    return callback(new Error('Origin not allowed'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false }));

const credentialText = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!credentialText) {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable.');
  process.exit(1);
}
try {
  const serviceAccount = JSON.parse(credentialText);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (error) {
  console.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', error.message);
  process.exit(1);
}

const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
fs.mkdirSync(SESSIONS_DIR, { recursive: true, mode: 0o700 });
console.log('[storage] DATA_DIR=' + DATA_DIR);
console.log('[storage] SESSIONS_DIR=' + SESSIONS_DIR);
console.log('[storage] For sessions to survive redeploys, mount a persistent Koyeb volume at ' + DATA_DIR + ' and set DATA_DIR to the same path.');
const sessions = new Map();
const DEFAULT_SETTINGS = Object.freeze({
  botName: 'SOURAJIT VFX Mini',
  botPictureUrl: '',
  prefix: '.',
  autoRead: false,
  autoReact: false,
  antiLink: false,
  welcome: false,
  privateMode: true,
  antiDelete: true
});
const SAFE_SETTINGS = new Set(Object.keys(DEFAULT_SETTINGS));

function userDir(uid) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new Error('Invalid user id');
  return path.join(SESSIONS_DIR, uid);
}
function loadSettings(uid) {
  const file = path.join(userDir(uid), 'settings.json');
  try {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { ...DEFAULT_SETTINGS, ...value };
  } catch { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings(uid, settings) {
  const dir = userDir(uid);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, 'settings.json');
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(settings, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, file);
}
async function requireUser(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Sign in first.' });
    const decoded = await admin.auth().verifyIdToken(header.slice(7), true);
    req.user = { uid: decoded.uid, email: decoded.email || '' };
    next();
  } catch {
    res.status(401).json({ error: 'Your login expired. Sign in again.' });
  }
}
function publicStatus(uid) {
  const s = sessions.get(uid);
  return {
    connected: Boolean(s && s.connection === 'open'),
    state: s?.connection || 'disconnected',
    pairingCode: s?.pairingCode || null,
    qrDataUrl: s?.qrDataUrl || null,
    message: s?.message || 'Not connected'
  };
}
function safeReply(sock, jid, text, quoted) {
  return sock.sendMessage(jid, { text: String(text).slice(0, 3500) }, quoted ? { quoted } : {});
}
function ownJid(sock) {
  const number = String(sock.user?.id || '').split(':')[0].split('@')[0];
  return number ? number + '@s.whatsapp.net' : '';
}
function scheduleFile(uid) {
  return path.join(userDir(uid), 'schedules.json');
}
function readSchedules(uid) {
  try {
    const value = JSON.parse(fs.readFileSync(scheduleFile(uid), 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}
function writeSchedules(uid, items) {
  const dir = userDir(uid);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = scheduleFile(uid);
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(items, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, file);
}
function scheduleContext(uid) {
  return {
    addSchedule: async item => {
      const items = readSchedules(uid);
      const created = { ...item, id: require('crypto').randomBytes(4).toString('hex'), createdAt: Date.now() };
      items.push(created);
      writeSchedules(uid, items);
      return created;
    },
    listSchedules: async () => readSchedules(uid).sort((a, b) => a.when - b.when),
    deleteSchedule: async id => {
      const items = readSchedules(uid);
      const next = items.filter(item => item.id !== String(id));
      if (next.length === items.length) return false;
      writeSchedules(uid, next);
      return true;
    }
  };
}
async function processScheduledItems() {
  for (const [uid, session] of sessions) {
    if (session.connection !== 'open' || !session.sock) continue;
    const items = readSchedules(uid);
    if (!items.length) continue;
    const now = Date.now();
    const due = items.filter(item => item.when <= now);
    if (!due.length) continue;
    const pending = items.filter(item => item.when > now);
    for (const item of due) {
      try {
        if (item.kind === 'status') {
          await session.sock.sendMessage('status@broadcast', { text: String(item.text).slice(0, 65000) });
        } else {
          const target = item.target === 'self' ? ownJid(session.sock) : item.target;
          if (!target) throw new Error('Could not resolve own WhatsApp number');
          await session.sock.sendMessage(target, { text: String(item.text).slice(0, 65000) });
        }
        const self = ownJid(session.sock);
        if (self) await safeReply(session.sock, self, '✅ Scheduled ' + item.kind + ' sent. ID: ' + item.id, null).catch(() => {});
      } catch (error) {
        console.warn('[scheduler] Delivery failed for ' + item.id + ': ' + error.message);
        pending.push({ ...item, when: now + 5 * 60 * 1000, attempts: (item.attempts || 0) + 1 });
      }
    }
    writeSchedules(uid, pending);
  }
}
setInterval(() => processScheduledItems().catch(error => console.error('[scheduler]', error.message)), 15_000);
async function handleMessage(uid, sock, message) {
  if (!message?.message) return;
  const jid = message.key.remoteJid;
  if (!jid || jid === 'status@broadcast') return;
  // Allow commands typed in WhatsApp's own-number chat, but ignore this bot's outgoing messages in every other chat.
  const ownNumber = String(sock.user?.id || '').split(':')[0].split('@')[0];
  const chatNumber = String(jid).split('@')[0];
  const isSelfChat = Boolean(ownNumber && chatNumber === ownNumber && !jid.endsWith('@g.us'));
  if (message.key?.fromMe && !isSelfChat) return;
  console.log('[message] Incoming message received for user session ' + uid + ' from ' + jid + (message.message.conversation || message.message.extendedTextMessage?.text ? ' (text)' : ' (non-text)'));
  const s = loadSettings(uid);
  if (s.privateMode && jid.endsWith('@g.us')) return;
  const body = message.message.conversation ||
    message.message.extendedTextMessage?.text ||
    message.message.imageMessage?.caption ||
    message.message.videoMessage?.caption || '';
  const text = body.trim();
  if (s.autoRead) {
    try { await sock.readMessages([message.key]); } catch {}
  }
  if (s.autoReact) {
    try { await sock.sendMessage(jid, { react: { text: '✨', key: message.key } }); } catch {}
  }
  if (jid.endsWith('@g.us') && s.antiLink && /(https?:\/\/|www\.|chat\.whatsapp\.com\/)/i.test(text)) {
    try {
      const metadata = await sock.groupMetadata(jid);
      const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
      const botParticipant = metadata.participants.find(p => p.id === botJid || p.id?.startsWith(sock.user?.id?.split(':')[0]));
      if (botParticipant?.admin) await sock.sendMessage(jid, { delete: message.key });
    } catch (e) { console.warn('[antiLink]', e.message); }
    return;
  }
  if (!text.startsWith(s.prefix)) {
    if (text) console.log('[message] Ignored: message does not start with configured prefix "' + s.prefix + '".');
    return;
  }
  const parts = text.slice(s.prefix.length).trim().split(/\s+/);
  const command = (parts.shift() || '').toLowerCase();
  const argText = parts.join(' ');
  const reply = value => safeReply(sock, jid, value, message);
  try {
    const pluginHandled = await pluginSystem.executePlugin({
      command, args: parts, prefix: s.prefix, botName: s.botName, settings: s, reply, sock, message, jid,
      setPrivateMode: enabled => { const current = loadSettings(uid); const next = { ...current, privateMode: Boolean(enabled) }; saveSettings(uid, next); return next; },
      setAntiDelete: enabled => { const current = loadSettings(uid); const next = { ...current, antiDelete: Boolean(enabled) }; saveSettings(uid, next); return next; },
      ...scheduleContext(uid),
      isOwner: isSelfChat
    });
    if (pluginHandled) return;
    if (['menu', 'help', 'commands'].includes(command)) {
      const menu = [
        '╭─「 ' + s.botName + ' 」',
        '│ MULTI-USER MINI BOT',
        '│ ' + s.prefix + 'menu · ' + s.prefix + 'ping · ' + s.prefix + 'alive',
        '│ ' + s.prefix + 'echo <text> · ' + s.prefix + 'time · ' + s.prefix + 'date',
        '│ ' + s.prefix + 'settings · ' + s.prefix + 'private',
        '╰──────────────────',
        'Managed from your SOURAJIT VFX dashboard.'
      ].join('\n');
      const picture = s.botPictureUrl || process.env.BOT_PICTURE_URL;
      if (picture && /^https:\/\//i.test(picture)) {
        try { await sock.sendMessage(jid, { image: { url: picture }, caption: menu }, { quoted: message }); }
        catch { await reply(menu); }
      } else await reply(menu);
    } else if (command === 'ping') {
      await reply('🏓 Pong! ' + s.botName);
    } else if (command === 'alive') {
      await reply('✅ ' + s.botName + ' is online.');
    } else if (command === 'echo') {
      await reply(argText || 'Usage: ' + s.prefix + 'echo hello');
    } else if (command === 'time') {
      await reply(new Date().toLocaleTimeString('en-IN', { timeStyle: 'medium' }));
    } else if (command === 'date') {
      await reply(new Date().toLocaleDateString('en-IN', { dateStyle: 'full' }));
    } else if (command === 'settings') {
      await reply('⚙️ Settings are managed in your authenticated web dashboard.\nPrefix: ' + s.prefix +
        '\nAuto-read: ' + (s.autoRead ? 'ON' : 'OFF') +
        '\nAuto-react: ' + (s.autoReact ? 'ON' : 'OFF') +
        '\nAnti-link: ' + (s.antiLink ? 'ON' : 'OFF') +
        '\nWelcome: ' + (s.welcome ? 'ON' : 'OFF'));
    } else if (command === 'private') {
      const next = { ...s, privateMode: true };
      saveSettings(uid, next);
      await reply('🔒 Private mode is ON.');
    }
  } catch (error) {
    console.error('[message handler] Failed to process/send command reply:', error?.stack || error?.message || error);
  }
}
async function startUserSession(uid, phoneNumber) {
  const existing = sessions.get(uid);
  if (existing && existing.connection !== 'close') throw new Error('A session is already starting or connected. Check status first.');
  const dir = userDir(uid);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const authDir = path.join(dir, 'auth');
  fs.mkdirSync(authDir, { recursive: true, mode: 0o700 });
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const entry = { connection: 'connecting', pairingCode: null, qrDataUrl: null, message: 'Starting WhatsApp connection', sock: null };
  sessions.set(uid, entry);
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: process.env.LOG_LEVEL || 'silent' }),
    printQRInTerminal: false,
    browser: ['Windows', 'Chrome', '10.0.0'],
    markOnlineOnConnect: false,
    syncFullHistory: false
  });
  entry.sock = sock;
  sock.ev.on('creds.update', async () => {
    try {
      await saveCreds();
      console.log('[storage] WhatsApp credentials saved for session ' + uid);
    } catch (error) {
      console.error('[storage] Could not save WhatsApp credentials for session ' + uid + ':', error.message);
    }
  });
  sock.ev.on('connection.update', async update => {
    const current = sessions.get(uid);
    if (!current || current.sock !== sock) return;
    if (update.qr) {
      current.qrDataUrl = await QRCode.toDataURL(update.qr, { width: 280, margin: 2 }).catch(() => null);
      current.message = 'Scan this QR from WhatsApp Linked Devices.';
    }
    if (update.connection === 'connecting') {
      current.connection = 'connecting';
      current.message = 'Connecting to WhatsApp…';
    }
    if (update.connection === 'open') {
      console.log('[whatsapp] Session connected for user ' + uid);
      current.connection = 'open';
      current.pairingCode = null;
      current.qrDataUrl = null;
      current.message = 'WhatsApp connected successfully.';
      // Send one connection notice to the paired account's own chat. markOnlineOnConnect remains disabled.
      const ownJid = String(sock.user?.id || '').split(':')[0].split('@')[0] + '@s.whatsapp.net';
      if (ownJid && !current.startNoticeSent) {
        current.startNoticeSent = true;
        const settings = loadSettings(uid);
        const notice = '╭═══ ' + settings.botName.toUpperCase() + ' ═══⊷\\n┃ ✅ Bot connected successfully\\n┃ Prefix: ' + settings.prefix + '\\n┃ Mode: ' + (settings.privateMode ? 'PRIVATE 🔒' : 'PUBLIC 🌐') + '\\n┃ Always-online presence: OFF\\n┃ Commands: ' + settings.prefix + 'menu | ' + settings.prefix + 'gpt | ' + settings.prefix + 'font\\n╰═════════════════⊷';
        sock.sendMessage(ownJid, { text: notice }).catch(error => console.warn('[startup notice] Could not send self-chat notice:', error.message));
      }
    }
    if (update.connection === 'close') {
      console.warn('[whatsapp] Session closed for user ' + uid + '; status=' + (update.lastDisconnect?.error?.output?.statusCode ?? 'unknown') + '; error=' + (update.lastDisconnect?.error?.message || 'unknown'));
      current.connection = 'close';
      current.message = 'Connection closed. Check session status or reconnect.';
      const statusCode = update.lastDisconnect?.error?.output?.statusCode;
      if (statusCode !== DisconnectReason.loggedOut) {
        setTimeout(() => {
          if (sessions.get(uid)?.sock === sock) {
            sessions.delete(uid);
            startUserSession(uid).catch(err => console.error('[reconnect]', err.message));
          }
        }, 2500);
      } else {
        current.message = 'WhatsApp logged out. Disconnect and pair again.';
      }
    }
  });
  const recentMessages = new Map();
  sock.ev.on('messages.update', async updates => {
    const settings = loadSettings(uid);
    if (settings.antiDelete === false) return;
    for (const item of updates || []) {
      const protocol = item.update?.message?.protocolMessage;
      if (!protocol || protocol.type !== 0) continue;
      const key = protocol.key || item.key;
      const id = key?.id;
      if (!id) continue;
      const saved = recentMessages.get(id);
      if (!saved) continue;
      const target = ownJid(sock);
      if (!target) continue;
      try {
        await sock.sendMessage(target, { text: '🛡️ ANTI-DELETE\\nChat: ' + saved.chat + '\\nSender: ' + saved.sender + '\\nMessage: ' + saved.text });
      } catch (error) {
        console.warn('[anti-delete] Could not forward deleted text:', error.message);
      }
      recentMessages.delete(id);
    }
  });
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    // Personal-number self-chat commands may arrive as append; ordinary incoming messages arrive as notify.
    if (type !== 'notify' && type !== 'append') return;
    for (const message of messages) {
      if (message?.key?.id && message?.message) {
        const text = message.message.conversation || message.message.extendedTextMessage?.text ||
          message.message.imageMessage?.caption || message.message.videoMessage?.caption || '';
        recentMessages.set(message.key.id, {
          chat: message.key.remoteJid || 'unknown',
          sender: message.key.participant || message.key.remoteJid || 'unknown',
          text: String(text || '[Non-text message]').slice(0, 1500)
        });
        if (recentMessages.size > 500) recentMessages.delete(recentMessages.keys().next().value);
      }
      await handleMessage(uid, sock, message);
    }
  });
  sock.ev.on('group-participants.update', async update => {
    const settings = loadSettings(uid);
    if (!settings.welcome || update.action !== 'add') return;
    try {
      const mentions = update.participants || [];
      await sock.sendMessage(update.id, {
        text: '👋 Welcome to the group! Please read the group rules.',
        mentions
      });
    } catch (e) { console.warn('[welcome]', e.message); }
  });
  if (!state.creds.registered && phoneNumber) {
    try {
      // Give the WhatsApp socket time to initialize before requesting a code.
      await new Promise(resolve => setTimeout(resolve, 2500));
      const code = await sock.requestPairingCode(phoneNumber);
      entry.pairingCode = String(code).match(/.{1,4}/g)?.join('-') || String(code);
      entry.message = 'Enter this fresh code in WhatsApp > Linked devices > Link with phone number.';
    } catch (error) {
      entry.connection = 'close';
      entry.message = 'Pairing code request failed. Disconnect this attempt and try again.';
      sessions.delete(uid);
      try { sock.end(new Error('Pairing code request failed')); } catch {}
      throw new Error('WhatsApp could not create a pairing code: ' + (error?.message || 'unknown error'));
    }
  }
  return publicStatus(uid);
}

app.get('/health', (req, res) => res.json({ ok: true, service: 'sourajit-vfx-multi-user-bot' }));
app.use('/api', requireUser);
app.get('/api/me', (req, res) => res.json({ uid: req.user.uid, email: req.user.email }));
app.get('/api/settings', (req, res) => res.json({ settings: loadSettings(req.user.uid) }));
app.get('/api/status', (req, res) => res.json(publicStatus(req.user.uid)));
app.post('/api/whatsapp/connect', async (req, res) => {
  try {
    const phoneNumber = String(req.body?.phoneNumber || '').replace(/\D/g, '');
    if (phoneNumber && (phoneNumber.length < 8 || phoneNumber.length > 15)) {
      return res.status(400).json({ error: 'Enter a valid international phone number without + or spaces.' });
    }
    const status = await startUserSession(req.user.uid, phoneNumber || undefined);
    res.json(status);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Could not start WhatsApp session.' });
  }
});
app.post('/api/whatsapp/disconnect', async (req, res) => {
  const s = sessions.get(req.user.uid);
  if (!s) return res.json({ ok: true, message: 'No active session.' });
  try { if (s.sock) await s.sock.logout(); } catch {}
  sessions.delete(req.user.uid);
  res.json({ ok: true, message: 'Session disconnected.' });
});
app.patch('/api/settings', (req, res) => {
  const current = loadSettings(req.user.uid);
  const updates = req.body || {};
  for (const [key, value] of Object.entries(updates)) {
    if (!SAFE_SETTINGS.has(key)) return res.status(400).json({ error: 'Unsupported setting: ' + key });
    if (typeof DEFAULT_SETTINGS[key] !== typeof value) return res.status(400).json({ error: 'Invalid value for ' + key });
    if (key === 'botName' && (!value.trim() || value.length > 60)) return res.status(400).json({ error: 'Bot name must be 1–60 characters.' });
    if (key === 'botPictureUrl' && value && !/^https:\/\//i.test(value)) return res.status(400).json({ error: 'Menu image URL must use HTTPS.' });
    if (key === 'prefix' && (!value || value.length > 3 || /\s/.test(value))) return res.status(400).json({ error: 'Prefix must be 1–3 non-space characters.' });
  }
  const next = { ...current, ...updates };
  saveSettings(req.user.uid, next);
  res.json({ ok: true, settings: next });
});
app.delete('/api/whatsapp/session', async (req, res) => {
  const s = sessions.get(req.user.uid);
  try { if (s?.sock) await s.sock.logout(); } catch {}
  sessions.delete(req.user.uid);
  fs.rmSync(userDir(req.user.uid), { recursive: true, force: true });
  res.json({ ok: true, message: 'Your session and settings were deleted.' });
});

async function restoreSessions() {
  const entries = fs.readdirSync(SESSIONS_DIR);
  console.log('[storage] Found ' + entries.length + ' stored session directories to inspect.');
  for (const name of entries) {
    const dir = path.join(SESSIONS_DIR, name);
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(name) || !fs.statSync(dir).isDirectory()) continue;
    if (fs.existsSync(path.join(dir, 'auth', 'creds.json'))) {
      try {
        console.log('[storage] Restoring saved WhatsApp session ' + name);
        await startUserSession(name);
      } catch (e) {
        console.error('[restore session] Could not restore ' + name + ':', e.message);
      }
    } else {
      console.log('[storage] No saved creds.json found for session directory ' + name);
    }
  }
}
const port = Number(process.env.PORT || 8000);
app.listen(port, async () => {
  console.log('SOURAJIT VFX multi-user API listening on ' + port);
  await restoreSessions();
});
