module.exports = {
  name: 'menu',
  aliases: ['help', 'commands'],
  description: 'Show every installed command plugin',
  async execute({ reply, prefix, botName }) {
    const fs = require('fs');
    const path = require('path');
    const dir = path.resolve(process.env.PLUGIN_DIR || 'plugins');
    const plugins = fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => {
      try { return require(path.join(dir, f)); } catch { return null; }
    }).filter(p => p && typeof p.name === 'string');
    const unique = [...new Map(plugins.map(p => [p.name, p])).values()].sort((a,b) => a.name.localeCompare(b.name));
    const lines = [
      '╭━━━〔 ✨ ' + botName + ' 〕━━━╮',
      '│ ⚡ MULTI-PLUGIN COMMAND MENU',
      '│ Prefix: ' + prefix,
      '│ Plugins: ' + unique.length,
      '├────────────────────',
      ...unique.map(p => '│ ' + prefix + p.name + (p.description ? ' — ' + p.description : '')),
      '╰━━━━━━━━━━━━━━━━━━━━',
      '✨ Powered by SOURAJIT VFX'
    ];
    await reply(lines.join('\n'));
  }
};