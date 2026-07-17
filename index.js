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
const lightboxFile = path.join(__dirname, 'lightbox.js');

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
  fs.copyFileSync(lightboxFile, path.join(outputDir, 'lightbox.js'));
}

function processMarkdownFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace {{YEAR}} with current year
  content = content.replace(/{{YEAR}}/g, new Date().getFullYear());

  const htmlContent = marked(content);

  // Strip the date prefix from the basename if present, and preserve subdirectories under pages/
  const basename = path.basename(filePath);
  const cleanName = basename.replace(/^\d{4}-\d{2}-\d{2}-(.+)\.md$/, '$1.md');
  const relDir = path.relative(pagesDir, path.dirname(filePath));
  const slug = cleanName.replace(/\.md$/, '');
  // index.md → <relDir>/index.html. Other files → <relDir>/<slug>/index.html for clean URLs.
  const outputPath = slug === 'index'
    ? path.join(outputDir, relDir, 'index.html')
    : path.join(outputDir, relDir, slug, 'index.html');
  fs.ensureDirSync(path.dirname(outputPath));

  // Determine page title
  let pageTitle = 'Bailey Jennings';
  if (cleanName === 'index.md') {
    pageTitle = 'Bailey Jennings';
  } else {
    // Extract title from the markdown content (first h1)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      pageTitle = titleMatch[1] + ' | Bailey Jennings';
    } else {
      pageTitle = path.basename(cleanName, '.md') + ' | Bailey Jennings';
    }
  }

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="icon" href="/assets/favicon.ico" type="image/x-icon">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Jacquard+12&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/styles.css">
        <title>${pageTitle}</title>
    </head>
    <body>
        ${htmlContent}
        <script src="/lightbox.js" defer></script>
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

const isOnce = process.argv.includes('--once');

compile();

if (!isOnce) {
  const watcher = chokidar.watch([
    path.join(pagesDir, '**', '*.md'),
    stylesFile,
    lightboxFile
  ], {
    persistent: true,
    ignoreInitial: true
  });

  watcher
    .on('add', filePath => {
      console.log(`File ${filePath} has been added`);
      compile();
    })
    .on('change', filePath => {
      console.log(`File ${filePath} has been changed`);
      compile();
    })
    .on('unlink', filePath => {
      console.log(`File ${filePath} has been removed`);
      compile();
    });

  console.log('Watching for changes...');
} else {
  console.log('Build complete. Exiting...');
  process.exit(0);
}