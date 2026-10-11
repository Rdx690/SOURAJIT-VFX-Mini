module.exports = {
  name: 'statuschedule',
  aliases: ['schedulestatus', 'statusschedule'],
  description: 'Schedule a text WhatsApp status update',
  async execute({ args, reply, addSchedule }) {
    const input = args.join(' ');
    const match = input.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})\s+([\s\S]+)$/);
    if (!match) return reply('Usage: .statuschedule YYYY-MM-DD HH:mm status text\nExample: .statuschedule 2026-10-12 21:00 Good night ✨\nTime zone: Asia/Kolkata');
    const when = new Date(match[1] + 'T' + match[2] + ':00+05:30');
    if (!Number.isFinite(when.getTime()) || when.getTime() <= Date.now()) return reply('❌ Choose a future date and time (IST).');
    if (when.getTime() > Date.now() + 30 * 24 * 60 * 60 * 1000) return reply('❌ Status can be scheduled up to 30 days ahead.');
    if (typeof addSchedule !== 'function') return reply('❌ Scheduler is not available.');
    const item = await addSchedule({ kind: 'status', when: when.getTime(), text: match[3] });
    return reply('✅ Text status scheduled. ID: ' + item.id + '\nWhen: ' + when.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST');
  }
};
