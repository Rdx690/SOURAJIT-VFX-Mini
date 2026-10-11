const ALLOWED_HOSTS = [
  'youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com',
  'music.youtube.com', 'tiktok.com', 'www.tiktok.com', 'vm.tiktok.com',
  'instagram.com', 'www.instagram.com', 'm.instagram.com',
  'facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch',
  'spotify.com', 'open.spotify.com', 'pinterest.com', 'www.pinterest.com',
  'pin.it'
];

function validateMediaUrl(raw) {
  let parsed;
  try { parsed = new URL(raw); } catch { throw new Error('Please provide a valid public URL.'); }
  if (parsed.protocol !== 'https:') throw new Error('Only HTTPS links are supported.');
  const host = parsed.hostname.toLowerCase();
  const allowed = ALLOWED_HOSTS.some((domain) => host === domain || host.endsWith('.' + domain));
  if (!allowed) throw new Error('This link domain is not supported.');
  if (parsed.username || parsed.password) throw new Error('Links with embedded credentials are not allowed.');
  return parsed;
}

function extractResult(payload) {
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch { return null; }
  }
  if (!payload || typeof payload !== 'object') return null;
  const candidates = [
    payload.download, payload.downloadUrl, payload.download_url, payload.url,
    payload.result?.download, payload.result?.downloadUrl, payload.result?.url,
    payload.data?.download, payload.data?.downloadUrl, payload.data?.url,
    payload.result?.link, payload.data?.link
  ];
  return candidates.find((value) => typeof value === 'string' && /^https:\/\//i.test(value)) || null;
}

async function downloadInfo(platform, rawUrl, reply) {
  let source;
  try { source = validateMediaUrl(rawUrl); }
  catch (error) { await reply('❌ ' + error.message); return true; }

  const endpoint = process.env.DOWNLOAD_API_URL;
  if (!endpoint) {
    await reply([
      '⚠️ Downloader API is not configured yet.',
      '',
      'Set DOWNLOAD_API_URL in your private .env file to a trusted provider endpoint that accepts a ?url= parameter.',
      'Then restart the bot and retry.',
      '',
      'Supported link types: YouTube, TikTok, Instagram, Facebook, Spotify and Pinterest.',
      'No fake download link will be generated.'
    ].join('\n'));
    return true;
  }

  let api;
  try {
    api = new URL(endpoint);
    if (api.protocol !== 'https:') throw new Error('Downloader API endpoint must use HTTPS.');
  } catch (error) {
    await reply('❌ Invalid DOWNLOAD_API_URL setting: ' + error.message);
    return true;
  }

  api.searchParams.set('url', source.toString());
  api.searchParams.set('platform', platform);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(api, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error('Provider returned HTTP ' + response.status);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('json')) throw new Error('Provider did not return JSON.');
    const payload = await response.json();
    const link = extractResult(payload);
    if (!link) throw new Error('No download URL found in provider response.');
    const safeLink = new URL(link);
    if (safeLink.protocol !== 'https:') throw new Error('Provider returned a non-HTTPS link.');
    await reply([
      '╭─「 SOURAJIT VFX DOWNLOADER 」',
      '│ Platform: ' + platform.toUpperCase(),
      '│',
      '│ Your provider returned a result:',
      safeLink.toString(),
      '╰────────────────────',
      '',
      'Use only content you own or have permission to download.'
    ].join('\n'));
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'Provider timed out.' : error.message;
    await reply('❌ Download failed: ' + reason + '\nCheck your provider endpoint and try again.');
  } finally {
    clearTimeout(timer);
  }
  return true;
}

async function executeDownloader({ command, args, reply }) {
  const input = args.join(' ').trim();
  if (!input) {
    await reply('Usage: .' + command + ' <public URL>');
    return true;
  }
  const platform = ({
    ytmp3: 'youtube-audio',
    ytmp4: 'youtube-video',
    tiktok: 'tiktok',
    ig: 'instagram',
    igreel: 'instagram',
    instagram: 'instagram',
    facebook: 'facebook',
    fb: 'facebook',
    spotify: 'spotify',
    pinterest: 'pinterest',
    pin: 'pinterest'
  })[command];
  if (!platform) return false;
  return downloadInfo(platform, input, reply);
}

module.exports = { executeDownloader, validateMediaUrl };
