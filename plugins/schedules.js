module.exports = {
  name: 'schedules',
  aliases: ['getschedule', 'listschedules', 'delschedule'],
  description: 'List scheduled items or cancel one with .delschedule ID',
  async execute({ args, reply, listSchedules, deleteSchedule, command }) {
    if (String(command).toLowerCase() === 'delschedule') {
      const id = args[0];
      if (!id) return reply('Usage: .delschedule ID');
      const ok = await deleteSchedule?.(id);
      return reply(ok ? '🗑️ Schedule ' + id + ' cancelled.' : '❌ Schedule ID not found.');
    }
    const items = await listSchedules?.() || [];
    if (!items.length) return reply('📅 No scheduled messages or statuses.');
    const lines = items.slice(0, 20).map(x => {
      const when = new Date(x.when).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      return '• ' + x.id + ' | ' + x.kind + ' | ' + when + ' IST | ' + String(x.text).slice(0, 70);
    });
    return reply('📅 SCHEDULES\n' + lines.join('\n') + '\nCancel: .delschedule ID');
  }
};
