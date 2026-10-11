const { executeDownloader } = require('../downloader');

module.exports = {
  name: 'ig',
  aliases: ["instagram"],
  description: 'Get a download link for an Instagram post URL.',
  async execute(context) {
    return executeDownloader({ ...context, command: 'ig' });
  }
};
