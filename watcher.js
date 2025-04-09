const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');

// Add debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Add file content hash tracking
const fileHashes = new Map();

function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (err) {
    return null;
  }
}

function hasContentChanged(filePath) {
  const newHash = getFileHash(filePath);
  const oldHash = fileHashes.get(filePath);

  if (oldHash === undefined) {
    fileHashes.set(filePath, newHash);
    return true;
  }

  if (oldHash !== newHash) {
    fileHashes.set(filePath, newHash);
    return true;
  }

  return false;
}

function startWatcher(pagesDir, stylesFile, compile) {
  // Watch for changes with debouncing and content change detection
  const debouncedCompile = debounce(() => {
    console.log('Changes detected, recompiling...');
    compile();
  }, 250); // 250 millisecond debounce

  const watcher = chokidar.watch([
    path.join(pagesDir, '**', '*.md'),
    path.join(process.cwd(), '*.js'),  // Watch JavaScript files in root
    stylesFile
  ], {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  // Track if we need to restart the watcher
  let needsRestart = false;

  watcher
    .on('add', path => {
      if (path.endsWith('.js')) {
        console.log(`JavaScript file ${path} has been added - restarting watcher...`);
        needsRestart = true;
        watcher.close().then(() => {
          if (needsRestart) {
            console.log('Restarting watcher...');
            require('child_process').spawn(process.argv[0], process.argv.slice(1), {
              stdio: 'inherit',
              detached: true
            });
            process.exit(0);
          }
        });
      } else if (hasContentChanged(path)) {
        console.log(`File ${path} has been added`);
        debouncedCompile();
      }
    })
    .on('change', path => {
      if (path.endsWith('.js')) {
        console.log(`JavaScript file ${path} has been changed - restarting watcher...`);
        needsRestart = true;
        watcher.close().then(() => {
          if (needsRestart) {
            console.log('Restarting watcher...');
            require('child_process').spawn(process.argv[0], process.argv.slice(1), {
              stdio: 'inherit',
              detached: true
            });
            process.exit(0);
          }
        });
      } else if (hasContentChanged(path)) {
        console.log(`File ${path} has been changed`);
        debouncedCompile();
      }
    })
    .on('unlink', path => {
      if (path.endsWith('.js')) {
        console.log(`JavaScript file ${path} has been removed - restarting watcher...`);
        needsRestart = true;
        watcher.close().then(() => {
          if (needsRestart) {
            console.log('Restarting watcher...');
            require('child_process').spawn(process.argv[0], process.argv.slice(1), {
              stdio: 'inherit',
              detached: true
            });
            process.exit(0);
          }
        });
      } else {
        console.log(`File ${path} has been removed`);
        fileHashes.delete(path);
        debouncedCompile();
      }
    });

  // Handle process termination
  process.on('SIGINT', () => {
    needsRestart = false;
    watcher.close().then(() => process.exit(0));
  });

  console.log('Watching for changes...');
  return watcher;
}

module.exports = { startWatcher };
