const { executeDownloader } = require('../downloader');

module.exports = {
  name: 'spotify',
  aliases: ["sp"],
  description: 'Get a result for a Spotify track URL (provider support required).',
  async execute(context) {
    return executeDownloader({ ...context, command: 'spotify' });
  }
};
