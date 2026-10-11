module.exports = {
  name: 'antidelete',
  aliases: ['antidel', 'antideleteon'],
  description: 'Toggle text-message delete notifications to your own chat',
  async execute({ args, reply, settings, setAntiDelete }) {
    const value = (args[0] || 'status').toLowerCase();
    if (value === 'status') return reply('🛡️ Anti-delete: ' + (settings?.antiDelete === false ? 'OFF' : 'ON') + '\nUse .antidelete on or .antidelete off');
    if (!['on', 'off'].includes(value)) return reply('Usage: .antidelete on|off');
    if (typeof setAntiDelete !== 'function') return reply('❌ Anti-delete setting unavailable.');
    setAntiDelete(value === 'on');
    return reply('🛡️ Anti-delete ' + value.toUpperCase() + '. Deleted text messages will be copied to your own chat when available.');
  }
};
