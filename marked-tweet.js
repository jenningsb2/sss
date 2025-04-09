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

      // Extract tweet ID from the URL
      let tweetId = '';

      // Try to extract tweet ID from various URL formats
      if (url.includes('status/')) {
        // Extract from URL with status/
        const parts = url.split('status/');
        if (parts.length > 1) {
          tweetId = parts[1].split('?')[0].split('/')[0];
        }
      } else if (/^\d+$/.test(url)) {
        // If it's just a number, assume it's the tweet ID
        tweetId = url;
      }

      if (tweetId) {
        return {
          type: 'tweet',
          raw: match[0],
          tweetId: tweetId,
          tokens: []
        };
      }
    }
    return null;
  },
  renderer(token) {
    // Use Twitter's official embed approach
    return `<div class="tweet-container">
  <blockquote class="twitter-tweet">
    <a href="https://twitter.com/x/status/${token.tweetId}"></a>
  </blockquote>
  <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</div>`;
  }
};

module.exports = tweetExtension;
