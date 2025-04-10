const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const footnote = require('marked-footnote');
const definitionList = require('./marked-definition-list');
const tweetExtension = require('./marked-tweet');
const { startWatcher } = require('./watcher');

const pagesDir = path.join(__dirname, 'pages');
const outputDir = path.join(__dirname, 'dist');
const assetsDir = path.join(__dirname, 'assets');
const stylesFile = path.join(__dirname, 'styles.css');

// Configure marked with extensions
marked.use({ extensions: [definitionList, tweetExtension] });
marked.use(footnote());
marked.use({
  gfm: true,
  breaks: true
});

// Ensure output directory exists
fs.ensureDirSync(outputDir);

function copyAssets() {
  fs.copySync(assetsDir, path.join(outputDir, 'assets'));
  fs.copyFileSync(stylesFile, path.join(outputDir, 'styles.css'));
}

function processMarkdownFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Get the basename and parse date if it exists
  const basename = path.basename(filePath);
  const dateMatch = basename.match(/^(\d{4})-(\d{2})-\d{2}-/);

  if (dateMatch) {
    const [year, monthNum] = dateMatch.slice(1);
    const date = new Date(year, parseInt(monthNum) - 1);
    const monthName = date.toLocaleString('en-US', { month: 'short' });
    const formattedDate = `*${monthName} ${year}*`;
    content = content.replace(/{{date}}/g, formattedDate);
  }

  // Replace {{YEAR}} with current year
  const currentYear = new Date().getFullYear();
  content = content.replace(/{{YEAR}}/g, currentYear);

  // Clean filename for output
  const cleanName = basename.replace(/^\d{4}-\d{2}-\d{2}-(.+)\.md$/, '$1.md');
  const isIndex = cleanName.toLowerCase() === 'index.md';

  // If this is the index file, replace the writing template variable
  if (isIndex) {
    const writingEntries = generateWritingEntries();
    content = content.replace(/{{writing}}/g, writingEntries);
  }

  // Add home link for non-index files
  if (!isIndex) {
    content = '[← Home](index.html)\n\n' + content;
    // Add copyright footer using footnotes styling
    content += `\n\n<div class="footnotes">\n<p>© Nan Yu – ${currentYear}</p>\n</div>`;
  }

  const htmlContent = marked(content);
  const outputPath = path.join(outputDir, cleanName.replace('.md', '.html'));

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400;1,600&family=Spectral:ital,wght@0,400;0,600;1,400;1,600&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="styles.css?v=${Date.now()}">
        <title>${path.basename(cleanName, '.md')}</title>
    </head>
    <body>
        ${htmlContent}
    </body>
    </html>
  `;

  fs.writeFileSync(outputPath, htmlTemplate);
  console.log(`Generated ${outputPath}`);
}

// Function to generate the writing entries
function generateWritingEntries() {
  const writingDir = path.join(pagesDir, 'writing');

  // Check if the writing directory exists
  if (!fs.existsSync(writingDir)) {
    return 'No writing entries found.\n\n';
  }

  // Get all markdown files in the writing directory
  const files = fs.readdirSync(writingDir)
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const filePath = path.join(writingDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Extract title from the first line (assuming it's a heading)
      // This regex is more robust and handles titles with special characters
      const titleMatch = content.match(/^#\s+(.*?)(?:\n|$)/);
      const title = titleMatch ? titleMatch[1].trim() : path.basename(file, '.md');

      // Extract date from filename
      const dateMatch = file.match(/^(\d{4})-(\d{2})-\d{2}-/);
      let date = '*Coming soon*';
      let dateObj = null;

      if (dateMatch) {
        const [year, monthNum] = dateMatch.slice(1);
        dateObj = new Date(year, parseInt(monthNum) - 1);
        const monthName = dateObj.toLocaleString('en-US', { month: 'short' });
        date = `*${monthName} ${year}*`;
      }

      // Extract description from the blockquote
      // This regex is more robust and handles descriptions with special characters
      const descMatch = content.match(/^#.*?\n>\s*(.*?)(?:\n|$)/s);
      const description = descMatch ? descMatch[1].trim() : '';

      // Clean filename for output
      const cleanName = file.replace(/^\d{4}-\d{2}-\d{2}-(.+)\.md$/, '$1');

      return {
        title,
        date,
        dateObj,
        description,
        filename: cleanName
      };
    })
    .sort((a, b) => {
      // Sort by date (newest first)
      // If date is "Coming soon", put it at the end
      if (!a.dateObj) return 1;
      if (!b.dateObj) return -1;

      // Compare dates directly
      return b.dateObj - a.dateObj;
    });

  // Generate the writing entries
  if (files.length === 0) {
    return 'No writing entries found.\n\n';
  }

  return files.map(file => {
    // Handle missing descriptions
    const description = file.description || 'No description available';
    return `[${file.title}](${file.filename}.html)\n: ${file.date} — ${description}\n\n`;
  }).join('');
}

function processAllMarkdownFiles() {
  const processDir = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
      const fullPath = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        processDir(fullPath);
      } else if (path.extname(dirent.name) === '.md') {
        processMarkdownFile(fullPath);
      }
    });
  };

  processDir(pagesDir);
}

function compile() {
  console.log('Compiling...');

  // Clean the distribution directory first
  fs.emptyDirSync(outputDir);

  copyAssets();
  processAllMarkdownFiles();
  console.log('Compilation complete.');
}

// Initial compilation
compile();

// Start the watcher
startWatcher(pagesDir, stylesFile, compile);
