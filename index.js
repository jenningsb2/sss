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
const SITE_URL = 'https://baileyjennings.com';
const SITE_NAME = 'Bailey Jennings';
const DEFAULT_DESCRIPTION =
  'Software product manager who creates high-craft products for real people facing real challenges.';
const DEFAULT_IMAGE = '/assets/me.webp';

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

function escapeAttr(value) {
  const map = {
    '&': '&amp;',
    '"': '&quot;',
    '<': '&lt;',
    '>': '&gt;'
  };
  return String(value).replace(/[&"<>]/g, (ch) => map[ch]);
}

function cleanText(value) {
  return String(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(pathname) {
  if (!pathname) return `${SITE_URL}${DEFAULT_IMAGE}`;
  if (/^https?:\/\//i.test(pathname)) return pathname;
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${SITE_URL}${normalized}`;
}

function pagePath(relDir, slug) {
  const dir = !relDir || relDir === '.' ? '' : relDir.replace(/\\/g, '/');
  if (slug === 'index') {
    return dir ? `/${dir}/` : '/';
  }
  return dir ? `/${dir}/${slug}/` : `/${slug}/`;
}

function firstImage(content) {
  const hits = [];
  for (const match of content.matchAll(/src=["'](\/?assets\/[^"']+)["']/gi)) {
    hits.push({ index: match.index, path: match[1] });
  }
  for (const match of content.matchAll(/!\[[^\]]*\]\((\/?assets\/[^)]+)\)/gi)) {
    hits.push({ index: match.index, path: match[1] });
  }
  if (!hits.length) return DEFAULT_IMAGE;
  hits.sort((a, b) => a.index - b.index);
  const image = hits[0].path;
  return image.startsWith('/') ? image : `/${image}`;
}

function extractMetadata(content, { isHome }) {
  const h1Match = content.match(/^#\s+(.+)$/m);
  const heading = h1Match ? cleanText(h1Match[1]) : null;

  const quoteMatch = content.match(/^>\s+(.+)$/m);
  let description = quoteMatch ? cleanText(quoteMatch[1]) : '';

  // Home has a résumé-style upper half; prefer the stable bio line over "Now" updates.
  if (isHome) {
    description = DEFAULT_DESCRIPTION;
  }

  if (!description) {
    const paragraphs = content
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter((block) => {
        if (!block) return false;
        if (/^[#>\-\*\[!<]/.test(block)) return false;
        if (block.startsWith('---')) return false;
        if (/^\*\*[A-Za-z]/.test(block)) return false;
        return true;
      });
    if (paragraphs.length) {
      description = cleanText(paragraphs[0]).slice(0, 200);
    }
  }

  if (!description) {
    description = heading ? `${heading}.` : DEFAULT_DESCRIPTION;
  }

  return { heading, description, image: firstImage(content) };
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

  const isHome = (!relDir || relDir === '.') && cleanName === 'index.md';
  const { heading, description, image } = extractMetadata(content, { isHome });

  let pageTitle = SITE_NAME;
  let ogTitle = SITE_NAME;
  if (isHome) {
    pageTitle = SITE_NAME;
    ogTitle = SITE_NAME;
  } else if (heading) {
    ogTitle = heading;
    pageTitle = `${heading} | ${SITE_NAME}`;
  } else {
    ogTitle = path.basename(cleanName, '.md');
    pageTitle = `${ogTitle} | ${SITE_NAME}`;
  }

  const canonicalPath = pagePath(relDir, slug);
  const canonicalUrl = absoluteUrl(canonicalPath);
  const imageUrl = absoluteUrl(image);

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeAttr(pageTitle)}</title>
        <meta name="description" content="${escapeAttr(description)}">
        <link rel="canonical" href="${escapeAttr(canonicalUrl)}">
        <meta property="og:site_name" content="${escapeAttr(SITE_NAME)}">
        <meta property="og:type" content="website">
        <meta property="og:title" content="${escapeAttr(ogTitle)}">
        <meta property="og:description" content="${escapeAttr(description)}">
        <meta property="og:url" content="${escapeAttr(canonicalUrl)}">
        <meta property="og:image" content="${escapeAttr(imageUrl)}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${escapeAttr(ogTitle)}">
        <meta name="twitter:description" content="${escapeAttr(description)}">
        <meta name="twitter:image" content="${escapeAttr(imageUrl)}">
        <link rel="icon" href="/assets/favicon.ico" type="image/x-icon">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Jacquard+12&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/styles.css">
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
