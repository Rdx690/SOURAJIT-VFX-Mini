const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULTS = Object.freeze({
  prefix: process.env.PREFIX || '.',
  botName: process.env.BOT_NAME || '𝐒ꭷᴜʀᴀᴊɪᴛ メ 𝐕𝐅𝐗',
  autoRead: process.env.AUTO_READ === 'true',
  autoReact: false,
  autoStatusView: process.env.AUTO_STATUS_VIEW === 'true',
  publicMode: false,
  antiLink: false,
  welcome: false,
  commandLogging: true
});

let cache = { ...DEFAULTS };

function ensureFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULTS, null, 2), { mode: 0o600 });
  }
}

function load() {
  try {
    ensureFile();
    const stored = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    cache = { ...DEFAULTS, ...stored };
  } catch (error) {
    console.error('[Settings] Could not load settings:', error.message);
    cache = { ...DEFAULTS };
  }
  return getAll();
}

function getAll() {
  return { ...cache };
}

function get(key) {
  return Object.prototype.hasOwnProperty.call(cache, key) ? cache[key] : undefined;
}

function set(key, value) {
  if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
    throw new Error('Unknown setting: ' + key);
  }
  const expectedType = typeof DEFAULTS[key];
  if (typeof value !== expectedType) {
    throw new Error('Setting ' + key + ' must be a ' + expectedType + '.');
  }
  cache[key] = value;
  ensureFile();
  const temporary = SETTINGS_FILE + '.tmp';
  fs.writeFileSync(temporary, JSON.stringify(cache, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, SETTINGS_FILE);
  return getAll();
}

function reset() {
  cache = { ...DEFAULTS };
  ensureFile();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(cache, null, 2), { mode: 0o600 });
  return getAll();
}

load();

module.exports = { DEFAULTS, get, getAll, set, reset, load };