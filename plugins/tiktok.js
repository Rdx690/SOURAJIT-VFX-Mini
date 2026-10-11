const { executeDownloader } = require('../downloader');

module.exports = {
  name: 'tiktok',
  aliases: ["tt"],
  description: 'Get a download link for a TikTok URL.',
  async execute(context) {
    return executeDownloader({ ...context, command: 'tiktok' });
  }
};
