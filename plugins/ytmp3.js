const { executeDownloader } = require('../downloader');

module.exports = {
  name: 'ytmp3',
  aliases: ["song","ytaudio"],
  description: 'Download audio from a YouTube video URL.',
  async execute(context) {
    return executeDownloader({ ...context, command: 'ytmp3' });
  }
};
