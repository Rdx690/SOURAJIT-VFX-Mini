module.exports = {
  name: 'tg',
  aliases: ['telegramstickers', 'tgstickers'],
  description: 'Download a Telegram sticker pack',
  async execute({ args, reply, sock, jid, message }) {
    const input = args.join(' ').trim() ||
      message?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
      message?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || '';
    let url;
    try { url = new URL(input); } catch {
      return reply('Usage: .tg https://t.me/addstickers/PackName');
    }
    if (!['t.me', 'telegram.me', 'www.t.me'].includes(url.hostname.toLowerCase()) ||
        !/^\/addstickers\/[A-Za-z0-9_]+\/?$/.test(url.pathname)) {
      return reply('❌ Send a public Telegram sticker-pack link, e.g. https://t.me/addstickers/PackName');
    }
    return reply('❌ Telegram sticker-pack download is not connected yet. This bot runtime does not include the legacy ../lib helpers (getTelegramStickers, getBuffer, sticker). Add a supported Telegram sticker API/provider to enable downloads.');
  }
};
