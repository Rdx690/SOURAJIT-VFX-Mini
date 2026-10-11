module.exports = {
  name: 'menu',
  aliases: ['help', 'commands'],
  description: 'Show every installed command plugin',
  async execute({ reply, prefix, botName, settings }) {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const dir = path.resolve(process.env.PLUGIN_DIR || 'plugins');
    const plugins = fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => {
      try { const fullPath = path.join(dir, f); delete require.cache[require.resolve(fullPath)]; return require(fullPath); } catch { return null; }
    }).filter(p => p && typeof p.name === 'string' && typeof p.execute === 'function');
    const unique = [...new Map(plugins.map(p => [p.name.toLowerCase(), p])).values()].sort((a, b) => a.name.localeCompare(b.name));
    const now = new Date();
    const time = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
    const day = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long' });
    const date = now.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'numeric', year: 'numeric' });
    const totalMB = Math.round(os.totalmem() / 1024 / 1024);
    const usedMB = Math.round((os.totalmem() - os.freemem()) / 1024 / 1024);
    const up = Math.floor(process.uptime());
    const uptime = Math.floor(up / 3600) + 'h ' + Math.floor((up % 3600) / 60) + 'm ' + (up % 60) + 's';
    const platform = process.env.PLATFORM_LABEL || (os.platform() + ' ' + os.arch());
    const owner = process.env.MENU_USER_NAME || '𝐒ꭷᴜʀᴀᴊɪᴛ メ 𝐕𝐅𝐗';
    const name = settings?.botName || botName || 'LEVANTER';
    const lines = [
      '╭═══ ' + name.toUpperCase() + ' ═══⊷',
      '┃❃╭──────────────',
      '┃❃│ Prefix : ' + prefix,
      '┃❃│ User : ' + owner,
      '┃❃│ Time : ' + time,
      '┃❃│ Day : ' + day,
      '┃❃│ Date : ' + date,
      '┃❃│ Version : 6.2.0',
      '┃❃│ Plugins : ' + unique.length,
      '┃❃│ Ram : ' + usedMB + '/' + totalMB + 'MB',
      '┃❃│ Uptime : ' + uptime,
      '┃❃│ Platform : ' + platform,
      '┃❃╰───────────────',
      '╰═════════════════⊷',
      '',
      '╭━━━〔 ✦ COMMANDS ✦ 〕━━━╮',
      ...unique.map(p => '┃ ✧ ' + prefix + p.name + (p.description ? ' — ' + p.description : '')),
      '╰━━━━━━━━━━━━━━━━━━━━━━╯',
      '⚡ Powered by SOURAJIT VFX'
    ];
    await reply(lines.join('\n'));
  }
};