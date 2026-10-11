require('dotenv').config();

const list = (value) => (value || '')
  .split(',')
  .map((item) => item.replace(/[^0-9]/g, ''))
  .filter(Boolean);

module.exports = {
  BOT_NAME: process.env.BOT_NAME || '𝐒ꭷᴜʀᴀᴊɪᴛ メ 𝐕𝐅𝐗',
  BOT_PICTURE_URL: process.env.BOT_PICTURE_URL || '',
  BOT_SOCIAL_LINK: process.env.BOT_SOCIAL_LINK || 'https://github.com/Rdx690/SOURAJIT-VFX-Mini',
  PREFIX: process.env.PREFIX || '.',
  OWNER_NUMBERS: list(process.env.OWNER_NUMBER),
  PAIRING_NUMBER: (process.env.PAIRING_NUMBER || '').replace(/[^0-9]/g, ''),
  SESSION_DIR: process.env.SESSION_DIR || 'session',
  AUTO_READ: process.env.AUTO_READ === 'true',
  AUTO_STATUS_VIEW: process.env.AUTO_STATUS_VIEW === 'true'
};