const fs = require('fs-extra');
const path = require('path');

function createWritingEntry(title) {
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  // Create the filename
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const filename = `${dateStr}-${slug}.md`;

  // Create the file path
  const draftsDir = path.join(__dirname, 'pages', 'drafts');
  const filePath = path.join(draftsDir, filename);

  // Ensure drafts directory exists
  fs.ensureDirSync(draftsDir);

  // Create the content template
  const contentTemplate = `# {{title}}

> {{summary}}

{{date}}

{{body}}

## Example Tweet Embed

To embed a tweet, use the following syntax:

\`\`\`markdown
::tweet(tweetUrl)
\`\`\`

You can use any of these formats:

\`\`\`markdown
::tweet(https://x.com/username/status/1909231499448401946)
::tweet(1909231499448401946)
\`\`\`

The extension will automatically extract the tweet ID from the URL.

### Controlling Light/Dark Mode

You can also control whether the tweet renders in light or dark mode:

::tweet(1234567890123456789, light)  // Force light mode
::tweet(1234567890123456789, dark)   // Force dark mode
::tweet(1234567890123456789)         // Auto (follows system preference)
`;

  // Write the file
  fs.writeFileSync(filePath, contentTemplate);
  console.log(`Created new writing entry: ${filePath}`);
}

// Get title from command line arguments (combine all arguments after the script name)
const title = process.argv.slice(2).join(' ');

if (!title) {
  console.error('Please provide a title for the writing entry');
  console.error('Usage: node create-entry.js Your Title Here');
  process.exit(1);
}

createWritingEntry(title);
