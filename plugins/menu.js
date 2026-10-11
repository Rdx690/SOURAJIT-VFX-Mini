module.exports = {
  name: 'menu',
  aliases: ['help', 'commands'],
  description: 'Show all installed commands in categorized LEVANTER style',
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
        } catch {
          return null;
        }
      })
      .filter(plugin => plugin && typeof plugin.name === 'string' && typeof plugin.execute === 'function');

    const unique = [...new Map(plugins.map(plugin => [plugin.name.toLowerCase(), plugin])).values()];
    const byName = new Map(unique.map(plugin => [plugin.name.toLowerCase(), plugin]));
    const categories = [
      { title: 'ᴀɪ', commands: ['gpt'] },
      { title: 'ᴅᴏᴡɴʟᴏᴀᴅ', commands: ['ytmp3', 'ytmp4', 'tiktok', 'ig', 'igreel', 'facebook', 'spotify', 'pinterest'] },
      { title: 'ᴛᴏᴏʟs', commands: ['font', 'getpp', 'fullpp', 'ssweb'] },
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

    const remaining = unique
      .filter(plugin => !included.has(plugin.name.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (remaining.length) {
      sections.push(
        '╭─❏ ᴏᴛʜᴇʀ ᴘʟᴜɢɪɴs ❏',
        ...remaining.map(plugin => ' │ ' + prefix + plugin.name.toUpperCase()),
        ' ╰─────────────────',
        ''
      );
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

    const header = [
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
      ''
    ];

    await reply([...header, ...sections, '⚡ Powered by SOURAJIT VFX'].join('\n'));
  }
};
