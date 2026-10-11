module.exports = {
  name: 'astatus',
  aliases: ['statusreply'],
  description: 'Detect replies to a WhatsApp status containing common acknowledgement words',
  async execute({ args, reply, settings }) {
    return reply('ℹ️ AStatus is an automatic message listener, not a chat command.\nThis project currently executes plugins only for prefixed commands, so the legacy event-handler code needs a server listener to run automatically.\nSupported keywords: send, snd, sent, snt, ayak, sd, st, ayakko, cent, cnt, cend.');
  }
};
