module.exports = {
  name: 'private',
  aliases: ['public', 'mode'],
  description: 'Switch the bot between private and public group-command modes',
  async execute({ args, reply, settings, setPrivateMode, command }) {
    const requested = (args[0] || (command === 'public' ? 'public' : command === 'private' ? 'private' : '')).toLowerCase();
    if (!['private', 'public'].includes(requested)) {
      return reply('╭─❏ BOT MODE ❏\n│ .private — Ignore group commands\n│ .public — Allow group commands\n│ Current: ' + (settings?.privateMode ? 'PRIVATE 🔒' : 'PUBLIC 🌐') + '\n╰─────────────────');
    }
    if (typeof setPrivateMode !== 'function') return reply('❌ Mode setting is not available in this runtime.');
    const next = setPrivateMode(requested === 'private');
    await reply(requested === 'private'
      ? '🔒 Private mode enabled. Group commands are now ignored.'
      : '🌐 Public mode enabled. Group commands are now allowed.');
  }
};