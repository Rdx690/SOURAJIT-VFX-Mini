module.exports = {
  name: 'schedule',
  aliases: ['setschedule'],
  description: 'Schedule a WhatsApp message; use .schedules to list and .delschedule to cancel',
  async execute({ args, reply, addSchedule }) {
    const input = args.join(' ');
    const match = input.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})\s+(self|\d{8,15})\s+([\s\S]+)$/i);
    if (!match) return reply('Usage: .schedule YYYY-MM-DD HH:mm self|NUMBER message text\nExample: .schedule 2026-10-12 20:30 self Hello!\nTime zone: Asia/Kolkata');
    const when = new Date(match[1] + 'T' + match[2] + ':00+05:30');
    if (!Number.isFinite(when.getTime()) || when.getTime() <= Date.now()) return reply('❌ Choose a future date and time (IST).');
    if (when.getTime() > Date.now() + 90 * 24 * 60 * 60 * 1000) return reply('❌ Schedule up to 90 days ahead.');
    if (typeof addSchedule !== 'function') return reply('❌ Scheduler is not available.');
    const target = match[3].toLowerCase() === 'self' ? 'self' : match[3] + '@s.whatsapp.net';
    const item = await addSchedule({ kind: 'message', when: when.getTime(), target, text: match[4] });
    return reply('✅ Message scheduled. ID: ' + item.id + '\nWhen: ' + when.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST');
  }
};
