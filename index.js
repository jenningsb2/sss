const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const chokidar = require('chokidar');
const footnote = require('marked-footnote');
const definitionList = require('./marked-definition-list');

const pagesDir = path.join(__dirname, 'pages');
const outputDir = path.join(__dirname, 'dist');
const assetsDir = path.join(__dirname, 'assets');
const stylesFile = path.join(__dirname, 'styles.css');

// Configure marked with extensions
marked.use({ extensions: [definitionList] });
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

  // Add home link for non-index files
  if (!isIndex) {
    content = '[← Home](index.html)\n\n' + content;
    // Add copyright footer using footnotes styling
    content += `\n\n<div class="footnotes">\n<p>© Nan Yu ${currentYear}</p>\n</div>`;
  }

  const htmlContent = marked(content);
  const outputPath = path.join(outputDir, cleanName.replace('.md', '.html'));

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="styles.css">
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

// Watch for changes
const watcher = chokidar.watch([
  path.join(pagesDir, '**', '*.md'),
  stylesFile
], {
  persistent: true,
  ignoreInitial: true
});

watcher
  .on('add', path => {
    console.log(`File ${path} has been added`);
    compile();
  })
  .on('change', path => {
    console.log(`File ${path} has been changed`);
    compile();
  })
  .on('unlink', path => {
    console.log(`File ${path} has been removed`);
    compile();
  });

console.log('Watching for changes...');
