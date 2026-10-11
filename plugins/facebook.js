const { executeDownloader } = require('../downloader');

module.exports = {
  name: 'facebook',
  aliases: ["fb"],
  description: 'Get a download link for a Facebook video URL.',
  async execute(context) {
    return executeDownloader({ ...context, command: 'facebook' });
  }
};
