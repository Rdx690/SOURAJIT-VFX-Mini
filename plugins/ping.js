module.exports = {
  name: 'ping',
  aliases: ['latency'],
  description: 'Check bot response',
  async execute({ reply }) {
    await reply('🏓 Pong! SOURAJIT VFX is responding.');
  }
};