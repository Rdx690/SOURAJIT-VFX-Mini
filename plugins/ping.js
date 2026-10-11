module.exports = {
  name: 'ping',
  aliases: ['latency'],
  description: 'Premium styled response and latency check',
  async execute({ reply }) {
    const start = Date.now();
    await new Promise(resolve => setTimeout(resolve, 30));
    const ms = Date.now() - start;
    await reply([
      '╭═══⊷ 𝐋𝐄𝐕𝐀𝐍𝐓𝐄𝐑 𝐏𝐈𝐍𝐆 ⊶═══╮',
      '┃ ✦ Status : ONLINE 🟢',
      '┃ ✦ Speed : ' + ms + ' ms',
      '┃ ✦ Signal : ▰▰▰▰▰▰▰▰▰▰ 100%',
      '┃ ✦ Engine : SOURAJIT VFX',
      '╰══════════════════════╯',
      '⚡ Fast • Stable • Premium'
    ].join('\\n'));
  }
};