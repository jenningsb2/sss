// Custom tweet extension for marked
const tweetExtension = {
  name: 'tweet',
  level: 'inline',
  start(src) {
    return src.match(/::tweet\(/)?.index;
  },
  tokenizer(src) {
    // Support ::tweet(url) format
    const rule = /^::tweet\(([^)]+)\)/;
    const match = rule.exec(src);
    if (match) {
      const url = match[1].trim();

      // Extract tweet ID and username from the URL
      let tweetId = '';
      let username = '';

      // Try to extract tweet ID from various URL formats
      if (url.includes('status/')) {
        // Extract from URL with status/
        const urlParts = url.split('/');
        const statusIndex = urlParts.findIndex(part => part === 'status');
        if (statusIndex > 0 && statusIndex < urlParts.length - 1) {
          username = urlParts[statusIndex - 1];
          tweetId = urlParts[statusIndex + 1].split('?')[0];
        }
      } else if (/^\d+$/.test(url)) {
        // If it's just a number, we can't use it - need a full URL with username
        console.warn('Tweet embedding requires a full URL with username, not just a tweet ID');
        return null;
      }

      if (tweetId && username) {
        return {
          type: 'tweet',
          raw: match[0],
          tweetId: tweetId,
          username: username,
          tokens: []
        };
      }
    }
    return null;
  },
  renderer(token) {
    // Use Twitter's official embed approach - exact format is important for the widget script
    return `<div class="tweet-container">
  <blockquote class="twitter-tweet">
    <a style="visibility: hidden;" href="https://twitter.com/${token.username}/status/${token.tweetId}">View on X/Twitter</a>
  </blockquote>
  <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</div>`;
  }
};

module.exports = tweetExtension;
