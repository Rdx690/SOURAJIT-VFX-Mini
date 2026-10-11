module.exports = {
  name: 'settings',
  aliases: ['setting'],
  description: 'Show current bot settings',
  async execute({ reply, botName, prefix, settings }) {
    const s = settings || {};
    await reply([
      '╭━━〔 ⚙️ BOT SETTINGS 〕━━╮',
      '┃ ✦ Name : ' + (s.botName || botName || 'SOURAJIT VFX Mini'),
      '┃ ✦ Prefix : ' + prefix,
      '┃ ✦ Auto-read : ' + (s.autoRead ? 'ON 🟢' : 'OFF ⚪'),
      '┃ ✦ Auto-react : ' + (s.autoReact ? 'ON 🟢' : 'OFF ⚪'),
      '┃ ✦ Anti-link : ' + (s.antiLink ? 'ON 🟢' : 'OFF ⚪'),
      '┃ ✦ Welcome : ' + (s.welcome ? 'ON 🟢' : 'OFF ⚪'),
      '┃ ✦ Group commands : ' + (s.privateMode ? 'BLOCKED 🔒' : 'ALLOWED 🌐'),
      '╰━━━━━━━━━━━━━━━━━━━━╯',
      'Change saved options from the web dashboard.'
    ].join('\n'));
  }
};