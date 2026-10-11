const { executeDownloader } = require('../downloader');

module.exports = {
  name: 'ytmp4',
  aliases: ["ytvideo"],
  description: 'Get a download link for a YouTube video URL.',
  async execute(context) {
    return executeDownloader({ ...context, command: 'ytmp4' });
  }
};
