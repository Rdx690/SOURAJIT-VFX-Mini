module.exports = {
  name: 'menu',
  aliases: ['help', 'commands'],
  description: 'Show installed commands in a randomly selected style',
  async execute({ reply, prefix, botName, settings }) {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const dir = path.resolve(process.env.PLUGIN_DIR || 'plugins');
    const plugins = fs.readdirSync(dir)
      .filter(file => file.endsWith('.js'))
      .map(file => {
        try {
          const fullPath = path.join(dir, file);
          delete require.cache[require.resolve(fullPath)];
          return require(fullPath);
        } catch { return null; }
      })
      .filter(plugin => plugin && typeof plugin.name === 'string' && typeof plugin.execute === 'function');

    const unique = [...new Map(plugins.map(plugin => [plugin.name.toLowerCase(), plugin])).values()];
    const byName = new Map(unique.map(plugin => [plugin.name.toLowerCase(), plugin]));
    const categories = [
      { title: 'ᴀɪ', commands: ['gpt'] },
      { title: 'ᴅᴏᴡɴʟᴏᴀᴅ', commands: ['ytmp3', 'ytmp4', 'tiktok', 'ig', 'igreel', 'facebook', 'spotify', 'pinterest'] },
      { title: 'ᴛᴏᴏʟs', commands: ['font', 'getpp', 'fullpp', 'setpp', 'ssweb', 'tg'] },
      { title: 'sᴇᴄᴜʀɪᴛʏ', commands: ['antidelete'] },
      { title: 'sᴄʜᴇᴅᴜʟᴇʀ', commands: ['schedule', 'statuschedule', 'schedules'] },
      { title: 'ʙᴏᴛ', commands: ['menu', 'alive', 'ping', 'uptime', 'repo', 'info'] },
      { title: 'sᴇᴛᴛɪɴɢs', commands: ['settings', 'private'] },
      { title: 'ᴛᴇxᴛ ᴛᴏᴏʟs', commands: ['echo', 'count', 'upper', 'lower', 'reverse'] },
      { title: 'ғᴜɴ & ᴇɴᴛᴇʀᴛᴀɪɴᴍᴇɴᴛ', commands: ['joke', 'fact', 'quote', 'flip', 'dice'] },
      { title: 'ᴅᴀᴛᴇ & ᴛɪᴍᴇ', commands: ['time', 'date'] }
    ];

    const included = new Set();
    const sections = [];
    for (const category of categories) {
      const commands = category.commands.filter(name => byName.has(name) && !included.has(name));
      if (!commands.length) continue;
      commands.forEach(name => included.add(name));
      sections.push(
        '╭─❏ ' + category.title + ' ❏',
        ...commands.map(name => {
          const plugin = byName.get(name);
          const aliases = Array.isArray(plugin.aliases) ? plugin.aliases.filter(alias => typeof alias === 'string') : [];
          const aliasText = aliases.length ? ' 〔' + aliases.map(alias => prefix + alias).join(', ') + '〕' : '';
          return ' │ ' + prefix + plugin.name.toUpperCase() + aliasText;
        }),
        ' ╰─────────────────',
        ''
      );
    }
    const remaining = unique.filter(plugin => !included.has(plugin.name.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
    if (remaining.length) {
      sections.push('╭─❏ ᴏᴛʜᴇʀ ᴘʟᴜɢɪɴs ❏', ...remaining.map(plugin => ' │ ' + prefix + plugin.name.toUpperCase()), ' ╰─────────────────', '');
    }

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
    const name = settings?.botName || botName || 'SOURAJIT VFX MINI';
    const stats = [
      'User: ' + owner, 'Time: ' + time + ' | ' + day, 'Date: ' + date,
      'Version: 6.2.0 | Plugins: ' + unique.length, 'RAM: ' + usedMB + '/' + totalMB + 'MB',
      'Uptime: ' + uptime, 'Platform: ' + platform, 'Prefix: ' + prefix
    ].join('\n');
    const body = sections.join('\n').trim();
    const styles = [
      () => ['╭═══⊷ ' + name.toUpperCase() + ' ⊶═══╮', '┃ 👑 ' + owner, '┃ ⚡ Prefix: ' + prefix + ' | Plugins: ' + unique.length, '┃ 🕒 ' + time + ' • ' + date, '┃ 💻 RAM: ' + usedMB + '/' + totalMB + 'MB • ' + uptime, '╰━━━━━━━━━━━━━━━━━━╯', '', body, '', '⚡ Powered by SOURAJIT VFX'].join('\n'),
      () => ['⚡『 ' + name.toUpperCase() + ' 』⚡', '┏━━━━━━━━━━━━━━━━━━', '┃ ◈ SYSTEM INFO', ...stats.split('\n').map(line => '┃ ' + line), '┗━━━━━━━━━━━━━━━━━━', '', '╔══〔 COMMAND CENTER 〕══╗', body, '╚══════════════════════╝', '✦ SOURAJIT VFX • NEON EDITION'].join('\n'),
      () => ['╔══════════════════╗', '║  🚀 ' + name.toUpperCase(), '╚══════════════════╝', '〔 BOT DASHBOARD 〕', ...stats.split('\n').map(line => '› ' + line), '', '〔 AVAILABLE COMMANDS 〕', body, '', '© SOURAJIT VFX'].join('\n'),
      () => ['┌───「 ' + name.toUpperCase() + ' 」', '│ 👤 ' + owner, '│ ⚙️ Prefix: ' + prefix, '│ 📦 Plugins: ' + unique.length, '│ 🟢 Online • ' + uptime, '└──────────────────', '', '『 SYSTEM MENU 』', body, '', '✨ Powered by SOURAJIT VFX'].join('\n')
    ];
    const selected = Math.floor(Math.random() * styles.length);
    await reply(styles[selected]());
  }
};
