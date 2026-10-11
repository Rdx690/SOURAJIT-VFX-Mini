module.exports = {
  name: 'getpp',
  aliases: ['pp', 'profilepic'],
  description: 'Fetch a WhatsApp profile picture',
  async execute({ args, reply, sock, jid, message }) {
    const mentioned = message?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted = message?.message?.extendedTextMessage?.contextInfo?.participant;
    const input = args.join(' ').trim();
    const number = (mentioned[0] || quoted || input).replace(/[^0-9]/g, '');
    if (!number) return reply('Usage: .getpp <phone number> or mention a user.\nExample: .getpp 919876543210');
    if (number.length < 8 || number.length > 15) return reply('❌ Enter a valid international number.');
    const endpoint = new URL('https://eliteprotech-apis.zone.id/tools/getpp');
    endpoint.searchParams.set('number', number);
    try {
      const response = await fetch(endpoint, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('API returned HTTP ' + response.status);
      const type = response.headers.get('content-type') || '';
      if (type.startsWith('image/')) {
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length > 5 * 1024 * 1024) throw new Error('Image is too large');
        await sock.sendMessage(jid, { image: buffer, caption: '👤 WhatsApp profile picture' }, { quoted: message });
        return;
      }
      const data = await response.json();
      const link = data?.url || data?.image || data?.profilePicture || data?.result?.url || data?.result?.image || data?.data?.url;
      if (typeof link === 'string' && /^https:\/\//i.test(link)) {
        await sock.sendMessage(jid, { image: { url: link }, caption: '👤 WhatsApp profile picture' }, { quoted: message });
      } else {
        await reply('❌ Profile picture was not returned. The provider may use a different parameter or require a WhatsApp JID. API response: ' + JSON.stringify(data).slice(0, 900));
      }
    } catch (error) {
      await reply('❌ GetPP failed: ' + error.message);
    }
  }
};