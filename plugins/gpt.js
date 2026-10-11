module.exports = {
  name: 'gpt',
  aliases: ['chatgpt', 'ai'],
  description: 'Ask the ChatGPT API',
  async execute({ args, reply }) {
    const prompt = args.join(' ').trim();
    if (!prompt) return reply('Usage: .gpt <your question>');
    const endpoint = new URL('https://eliteprotech-apis.zone.id/ai/chatgpt');
    endpoint.searchParams.set('prompt', prompt.slice(0, 1500));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(endpoint, { headers: { accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error('API returned HTTP ' + response.status);
      const data = await response.json();
      if (!data?.success || typeof data.text !== 'string') throw new Error('Unexpected API response');
      const answer = data.text.trim().slice(0, 3000);
      await reply('╭─「 SOURAJIT VFX GPT 」\n' + answer + '\n╰────────────────');
    } catch (error) {
      await reply('❌ GPT request failed: ' + (error.name === 'AbortError' ? 'API timeout' : error.message));
    } finally { clearTimeout(timer); }
  }
};