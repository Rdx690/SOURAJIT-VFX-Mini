const API_BASE = 'https://api.sayan-nexuswork.workers.dev';

async function requestJson(endpoint, parameter, value) {
  const url = new URL(endpoint, API_BASE);
  url.searchParams.set(parameter, value);
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(25000)
  });
  if (!response.ok) throw new Error('API returned HTTP ' + response.status);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('json')) throw new Error('API did not return JSON.');
  const data = await response.json();
  if (!data || data.status !== 'success') {
    throw new Error(data?.message || data?.error || 'No result found.');
  }
  return data;
}

function safeHttpsUrl(value, label = 'media URL') {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error('Invalid ' + label + '.'); }
  if (parsed.protocol !== 'https:') throw new Error('Only HTTPS ' + label + 's are accepted.');
  return parsed.toString();
}

async function executeMediaCommand({ command, args, reply, sock, jid, message, botName }) {
  const query = args.join(' ').trim();
  if (!['song', 'play', 'music', 'ytmp3', 'video', 'ytmp4', 'insta', 'ig', 'igreel'].includes(command)) return false;

  if (!query) {
    const usage = {
      song: '.song <song name>',
      play: '.play <song name>',
      music: '.music <song name>',
      ytmp3: '.ytmp3 <song name>',
      video: '.video <YouTube URL or search query>',
      ytmp4: '.ytmp4 <YouTube URL or search query>',
      insta: '.insta <Instagram post/reel URL>',
      ig: '.ig <Instagram post/reel URL>',
      igreel: '.igreel <Instagram reel URL>'
    };
    await reply('Usage: ' + usage[command]);
    return true;
  }

  try {
    if (['song', 'play', 'music', 'ytmp3'].includes(command)) {
      const data = await requestJson('/music', 'query', query);
      const mediaUrl = safeHttpsUrl(data.url);
      const title = String(data.title || 'Unknown title').slice(0, 180);
      const caption = [
        '╭─「 SOURAJIT VFX MUSIC 」',
        '│ 🎵 ' + title,
        '│ ⏱️ Duration: ' + (data.duration || 'Unknown'),
        '│ 👁️ Views: ' + (data.views || 'N/A'),
        '│ 📺 Channel: ' + (data.channel || 'N/A'),
        '│ 🎧 Format: ' + (data.format || 'MP3') + ' ' + (data.quality || ''),
        '╰────────────────────',
        '✨ Powered by ' + botName
      ].join('\n');

      await sock.sendMessage(jid, {
        audio: { url: mediaUrl },
        mimetype: 'audio/mpeg',
        fileName: title.replace(/[\\/:*?"<>|]/g, '_') + '.mp3',
        ptt: false,
        contextInfo: { externalAdReply: data.thumbnail ? {
          title,
          body: 'SOURAJIT VFX Music',
          mediaType: 1,
          thumbnailUrl: safeHttpsUrl(data.thumbnail, 'thumbnail URL'),
          sourceUrl: 'https://github.com/Rdx690/SOURAJIT-VFX-Mini'
        } : undefined }
      }, { quoted: message });
      await reply(caption);
      return true;
    }

    if (['video', 'ytmp4'].includes(command)) {
      const data = await requestJson('/video', 'query', query);
      const mediaUrl = safeHttpsUrl(data.url);
      const title = String(data.title || 'Video').slice(0, 180);
      await sock.sendMessage(jid, {
        video: { url: mediaUrl },
        mimetype: 'video/mp4',
        caption: [
          '🎬 *SOURAJIT VFX VIDEO*',
          '📌 ' + title,
          '🎞️ Quality: ' + (data.quality || 'Auto'),
          '✨ Powered by ' + botName
        ].join('\n')
      }, { quoted: message });
      return true;
    }

    const data = await requestJson('/insta', 'url', query);
    const mediaUrl = safeHttpsUrl(data.url);
    const title = '📥 Instagram • ' + (data.type || 'media') + '\n✨ Powered by ' + botName;
    const kind = String(data.type || '').toLowerCase();
    if (kind === 'image' || kind === 'photo') {
      await sock.sendMessage(jid, {
        image: { url: mediaUrl },
        caption: title
      }, { quoted: message });
    } else {
      await sock.sendMessage(jid, {
        video: { url: mediaUrl },
        mimetype: 'video/mp4',
        caption: title
      }, { quoted: message });
    }
    return true;
  } catch (error) {
    console.error('[Media command]', error.message);
    await reply('❌ Media request failed: ' + error.message + '\nTry another query/link later.');
    return true;
  }
}

module.exports = { executeMediaCommand };