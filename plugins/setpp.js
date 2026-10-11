const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'setpp',
  aliases: ['setprofilepic', 'mypp'],
  description: 'Set your own WhatsApp profile picture using the image at original available resolution',
  async execute({ args, reply, sock, jid, message, isOwner }) {
    if (!isOwner) return reply('❌ Use this command only in your own WhatsApp chat.');
    const context = message?.message?.extendedTextMessage?.contextInfo;
    let imageMessage = message?.message?.imageMessage;
    let source = message;
    if (!imageMessage && context?.quotedMessage) {
      imageMessage = context.quotedMessage.imageMessage ||
        context.quotedMessage.viewOnceMessage?.message?.imageMessage ||
        context.quotedMessage.viewOnceMessageV2?.message?.imageMessage;
      if (imageMessage) source = {
        key: {
          remoteJid: jid,
          id: context.stanzaId,
          participant: context.participant,
          fromMe: Boolean(context.participant && context.participant === sock.user?.id)
        },
        message: context.quotedMessage
      };
    }
    if (!imageMessage) return reply('📷 Send an image in your own chat with caption .setpp, or reply to an image with .setpp.\nNo manual crop is applied by this command; WhatsApp may still process the profile image.');
    try {
      const buffer = await downloadMediaMessage(source, 'buffer', {}, {
        logger: require('pino')({ level: 'silent' }),
        reuploadRequest: sock.updateMediaMessage
      });
      if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('Could not download the image');
      if (buffer.length > 10 * 1024 * 1024) return reply('❌ Image is larger than 10 MB. Please send a smaller file.');
      const ownJid = String(sock.user?.id || '').split(':')[0].split('@')[0] + '@s.whatsapp.net';
      await sock.updateProfilePicture(ownJid, buffer);
      return reply('✅ Your WhatsApp profile picture was updated using the image at its available resolution. The command did not crop or resize it manually.');
    } catch (error) {
      console.error('[setpp] Failed:', error?.message || error);
      return reply('❌ Could not update your profile picture. Try a regular JPG/PNG image and check that your WhatsApp session is connected.');
    }
  }
};
