const os = require('os');

const pick = (items) => items[Math.floor(Math.random() * items.length)];

const data = {
  jokes: [
    'Why did the computer get cold? It left its Windows open. 😄',
    'Why was the phone wearing glasses? It lost its contacts. 😂',
    'I told my Wi-Fi a joke. It disconnected from the conversation. 📶'
  ],
  facts: [
    'Octopuses have three hearts.',
    'A group of flamingos is called a flamboyance.',
    'Honey can remain edible for a very long time when stored properly.',
    'Bananas are botanically berries; strawberries are not true berries.'
  ],
  quotes: [
    'Great things are done by a series of small things brought together.',
    'Dream big. Start small. Keep going.',
    'Consistency beats motivation when motivation disappears.',
    'Your future is created by what you do today.'
  ],
  compliments: [
    'Your effort matters. Keep showing up for yourself. ✨',
    'You bring your own kind of energy to the world. 🌟',
    'You are capable of learning more than you think. 💪'
  ],
  riddles: [
    'What has keys but cannot open locks? A piano.',
    'What gets wetter the more it dries? A towel.',
    'What has a face and two hands but no arms or legs? A clock.'
  ],
  trivia: [
    'Trivia: Which planet is known as the Red Planet? Answer: Mars.',
    'Trivia: What is the largest ocean on Earth? Answer: The Pacific Ocean.',
    'Trivia: How many sides does a hexagon have? Answer: Six.'
  ]
};

function getHelp(prefix) {
  return [
    '╭─「 𝐒ꭷᴜʀᴀᴊɪᴛ メ 𝐕𝐅𝐗 」',
    '│ ⚡ PREMIUM MINI BOT',
    '│ GENERAL',
    `│ ${prefix}settings — Show settings (owner)`,
    `│ ${prefix}plugins — List plugins (owner)`,
    `│ ${prefix}pluginreload — Reload plugins (owner)`,
    `│ ${prefix}setprefix <symbol> — Change prefix`,
    `│ ${prefix}setname <name> — Change bot name`,
    `│ ${prefix}autoread on/off — Toggle auto-read`,
    `│ ${prefix}public / private — Save mode setting`,
    `│ ${prefix}menu, help, commands`,
    `│ ${prefix}ping, alive, runtime, info`,
    `│ ${prefix}owner, repo, date, time`,
    '│ FUN',
    `│ ${prefix}joke, fact, quote, compliment`,
    `│ ${prefix}riddle, trivia, 8ball <question>`,
    `│ ${prefix}flip, dice, choose <a | b>`,
    '│ MUSIC & MEDIA API',
    `│ ${prefix}song / play / music <song name>`,
    `│ ${prefix}video / ytmp4 <query or URL>`,
    `│ ${prefix}insta / ig / igreel <Instagram URL>`,
    '│ DOWNLOADERS (provider required)',
    `│ ${prefix}ytmp3 <YouTube URL>`,
    `│ ${prefix}ytmp4 <YouTube URL>`,
    `│ ${prefix}tiktok <TikTok URL>`,
    `│ ${prefix}ig / igreel <Instagram URL>`,
    `│ ${prefix}facebook <Facebook URL>`,
    `│ ${prefix}spotify <Spotify URL>`,
    `│ ${prefix}pinterest <Pinterest URL>`,
    '│ TEXT TOOLS',
    `│ ${prefix}echo <text>, reverse <text>`,
    `│ ${prefix}count <text>, upper <text>, lower <text>`,
    '│',
    '│ Song/video/Instagram: Sayan Nexus API',
    '│ GitHub: github.com/Rdx690/SOURAJIT-VFX-Mini',
    '│ Downloader commands may require provider configuration.',
    '│ Only download media you own or have permission to use.',
    '╰────────────────────',
    '',
    'This starter only implements the commands listed here.'
  ].join('\n');
}

async function execute({ command, args, prefix, botName, reply }) {
  const argText = args.join(' ');
  switch (command) {
    case 'menu':
    case 'help':
    case 'commands':
      await reply(getHelp(prefix)); return true;
    case 'joke':
      await reply(pick(data.jokes)); return true;
    case 'fact':
      await reply(pick(data.facts)); return true;
    case 'quote':
      await reply(pick(data.quotes)); return true;
    case 'compliment':
      await reply(pick(data.compliments)); return true;
    case 'riddle':
      await reply(pick(data.riddles)); return true;
    case 'trivia':
      await reply(pick(data.trivia)); return true;
    case 'flip':
    case 'coinflip':
      await reply(pick(['🪙 Heads', '🪙 Tails'])); return true;
    case 'dice':
      await reply(`🎲 You rolled: ${1 + Math.floor(Math.random() * 6)}`); return true;
    case '8ball':
      if (!argText) { await reply(`Ask a question: ${prefix}8ball will I succeed?`); return true; }
      await reply(pick(['Yes, definitely. ✨', 'Signs point to yes. 👍', 'Ask again later. 🔮', 'Not sure yet. 🤔', 'It looks promising. 🌟'])); return true;
    case 'choose': {
      const choices = argText.split('|').map((x) => x.trim()).filter(Boolean);
      if (choices.length < 2) await reply(`Usage: ${prefix}choose tea | coffee`);
      else await reply(`I choose: ${pick(choices)}`);
      return true;
    }
    case 'echo':
      await reply(argText || 'Usage: ' + prefix + 'echo your text'); return true;
    case 'reverse':
      await reply(argText ? Array.from(argText).reverse().join('') : 'Usage: ' + prefix + 'reverse your text'); return true;
    case 'upper':
      await reply(argText ? argText.toUpperCase() : 'Usage: ' + prefix + 'upper your text'); return true;
    case 'lower':
      await reply(argText ? argText.toLowerCase() : 'Usage: ' + prefix + 'lower your text'); return true;
    case 'count':
      await reply(argText ? `Characters: ${Array.from(argText).length}\nWords: ${argText.trim().split(/\s+/).filter(Boolean).length}` : 'Usage: ' + prefix + 'count your text'); return true;
    case 'date':
      await reply(new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })); return true;
    case 'time':
      await reply(new Date().toLocaleTimeString('en-IN', { timeStyle: 'medium' })); return true;
    case 'runtime':
      await reply(`⏱️ Process uptime: ${Math.floor(process.uptime())} seconds\nNode.js: ${process.version}\nPlatform: ${os.platform()}`); return true;
    case 'info':
      await reply(`🤖 ${botName}\nPrefix: ${prefix}\nRuntime: Node.js ${process.version}\nMode: Starter build`); return true;
    case 'repo':
      await reply('GitHub: https://github.com/Rdx690/SOURAJIT-VFX-Mini'); return true;
    default:
      return false;
  }
}

module.exports = { execute, getHelp };
