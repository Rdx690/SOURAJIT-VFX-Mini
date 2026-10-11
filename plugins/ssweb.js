module.exports = {
  name: 'ssweb',
  aliases: ['screenshot', 'webshot'],
  description: 'Get a website screenshot link',
  async execute({ args, reply }) {
    const raw = args.join(' ').trim();
    if (!raw) return reply('Usage: .ssweb https://example.com');
    let target;
    try {
      target = new URL(raw);
      if (target.protocol !== 'https:' && target.protocol !== 'http:') throw new Error();
      if (target.username || target.password) throw new Error();
    } catch {
      return reply('❌ Enter a valid http:// or https:// website URL.');
    }
    const endpoint = new URL('https://eliteprotech-apis.zone.id/tools/ssweb');
    endpoint.searchParams.set('url', target.toString());
    try {
      const response = await fetch(endpoint, { redirect: 'error', signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw new Error('API returned HTTP ' + response.status);
      const type = response.headers.get('content-type') || '';
      if (type.startsWith('image/')) {
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length > 5 * 1024 * 1024) throw new Error('Screenshot image is too large');
        await reply('Screenshot API returned an image, but this command currently returns links only. Try opening: ' + endpoint.toString());
        return;
      }
      const body = await response.text();
      let data;
      try { data = JSON.parse(body); } catch { data = null; }
      const link = data?.url || data?.result?.url || data?.screenshot || data?.result || data?.data?.url;
      if (typeof link === 'string' && /^https:\/\//i.test(link)) {
        await reply('📸 Website screenshot:\n' + link);
      } else {
        await reply('📸 Screenshot API response:\n' + body.slice(0, 2500));
      }
    } catch (error) {
      await reply('❌ Screenshot failed: ' + error.message);
    }
  }
};