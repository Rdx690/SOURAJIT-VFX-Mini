module.exports = {
  name: 'font',
  aliases: ['fonts', 'fancy'],
  description: 'Convert text into fancy font styles',
  async execute({ args, reply }) {
    const input = args.join(' ').trim();
    if (!input) return reply('Usage: .font <text>');
    const endpoint = new URL('https://eliteprotech-apis.zone.id/fun/font');
    endpoint.searchParams.set('text', input.slice(0, 120));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint, { headers: { accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error('API returned HTTP ' + response.status);
      const data = await response.json();
      if (!data?.status || !Array.isArray(data.results)) throw new Error('Unexpected API response');
      const results = data.results.filter(item => item && typeof item.text === 'string').slice(0, 18);
      if (!results.length) throw new Error('No font styles returned');
      const lines = ['╭─❏ FONT STYLES ❏'];
      results.forEach((item, index) => lines.push((index + 1) + '. ' + item.name + ':\n' + item.text));
      lines.push('╰─────────────────', 'Tip: copy your favourite style.');
      await reply(lines.join('\n').slice(0, 3400));
    } catch (error) {
      await reply('❌ Font API failed: ' + (error.name === 'AbortError' ? 'API timeout' : error.message));
    } finally { clearTimeout(timer); }
  }
};