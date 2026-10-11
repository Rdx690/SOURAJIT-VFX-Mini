module.exports = {
  name: 'uptime',
  aliases: [],
  description: 'Show process uptime',
  async execute({ reply }) {
    const seconds = Math.floor(process.uptime());
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    await reply(`⏱️ Uptime: ${hours}h ${minutes}m ${remainder}s`);
  }
};