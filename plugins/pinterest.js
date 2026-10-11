const { executeDownloader } = require('../downloader');

module.exports = {
  name: 'pinterest',
  aliases: ["pin"],
  description: 'Get a download link for a Pinterest pin URL.',
  async execute(context) {
    return executeDownloader({ ...context, command: 'pinterest' });
  }
};
