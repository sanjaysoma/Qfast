const fs = require('fs');
const path = require('path');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

const projectRoot = path.resolve(__dirname, '..');
const webDir = path.join(projectRoot, 'web');
const androidAssetsWeb = path.join(projectRoot, 'android', 'app', 'src', 'main', 'assets', 'web');

console.log('Copying', webDir, '->', androidAssetsWeb);
copyRecursive(webDir, androidAssetsWeb);
console.log('Copy complete');

process.exit(0);
