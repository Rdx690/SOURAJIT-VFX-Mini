module.exports = {
  name: 'ping',
  aliases: ['latency'],
  description: 'Neon styled ping and response latency check',
  async execute({ reply, botName }) {
    const started = process.hrtime.bigint();
    // Yield once so the reported value reflects local command response processing, not a fabricated network RTT.
    await new Promise(resolve => setImmediate(resolve));
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    const speed = ms < 100 ? '⚡ VERY FAST' : ms < 300 ? '🚀 FAST' : '⏳ NORMAL';
    const name = botName || 'SOURAJIT VFX';
    await reply([
      '╭━━━〔 ⚡ 𝐒𝐎𝐔𝐑𝐀𝐉𝐈𝐓 𝐕𝐅𝐗 〕━━━╮',
      '┃',
      '┃   ✨ 𝐏𝐎𝐍𝐆! ✨',
      '┃',
      '┃  ◈ Response: ' + ms.toFixed(2) + ' ms',
      '┃  ◈ Status: 🟢 ONLINE',
      '┃  ◈ Speed: ' + speed,
      '┃  ◈ Bot: ' + name,
      '┃',
      '╰━━━━━━━━━━━━━━━━━━━━━━╯',
      ' ▰▰▰▰▰▰▰▰▰▰ 100%',
      '⚡ Fast • Stable • SOURAJIT VFX'
    ].join('\n'));
  }
};
