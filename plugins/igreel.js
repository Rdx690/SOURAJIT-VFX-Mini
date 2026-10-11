const { executeDownloader } = require('../downloader');

module.exports = {
  name: 'igreel',
  aliases: ["reel","igvideo"],
  description: 'Get a download link for an Instagram Reel URL.',
  async execute(context) {
    return executeDownloader({ ...context, command: 'igreel' });
  }
};
