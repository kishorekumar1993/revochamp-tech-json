const fs = require('fs');
const path = require('path');

const repoDir = 'd:\\Backend\\tech\\revochamp-tech-json';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== '.git' && f !== 'node_modules') {
        walkDir(dirPath, callback);
      }
    } else if (f.endsWith('.json')) {
      callback(dirPath);
    }
  });
}

const allJsonFiles = new Set();
walkDir(repoDir, (filePath) => {
  allJsonFiles.add(path.basename(filePath, '.json'));
});

let removedCount = 0;

walkDir(repoDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    return;
  }

  let modified = false;

  if (data.related && Array.isArray(data.related)) {
    const originalLength = data.related.length;
    data.related = data.related.filter(rel => {
      // Check if rel.json exists anywhere in the repo
      // Sometimes rel is a full path or just a slug
      const slug = rel.split('/').pop().replace('.json', '');
      return allJsonFiles.has(slug);
    });
    if (data.related.length !== originalLength) {
      modified = true;
      removedCount += (originalLength - data.related.length);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
});

console.log(`Finished cleaning related links. Removed ${removedCount} missing links.`);
