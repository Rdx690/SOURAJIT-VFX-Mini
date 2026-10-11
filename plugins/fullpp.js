module.exports = {
  name: 'fullpp',
  aliases: ['fullpic', 'fullprofile'],
  description: 'Fetch a WhatsApp profile picture at the highest available resolution',
  async execute({ args, reply, sock, jid, message }) {
    const context = message?.message?.extendedTextMessage?.contextInfo || {};
    const mention = context.mentionedJid?.[0];
    const quoted = context.participant;
    let target = mention || quoted || args.join(' ').trim();
    if (!target) target = jid;
    if (/^\d{8,15}$/.test(target)) target = target + '@s.whatsapp.net';
    if (!target.includes('@')) return reply('Usage: .fullpp <number> or reply/mention a user.\nExample: .fullpp 919876543210');
    try {
      const url = await sock.profilePictureUrl(target, 'image');
      await sock.sendMessage(jid, { image: { url }, caption: '👤 Full profile picture' }, { quoted: message });
    } catch (error) {
      await reply('❌ Profile picture unavailable. The account may hide its picture or the number may be invalid.');
    }
  }
};
