const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const mobileRoot = path.resolve(__dirname, '..');
const frontendCandidates = [
  process.env.FRONTEND_ROOT,
  path.resolve(mobileRoot, '../../../../queueless-frontend'),
  path.resolve(mobileRoot, '../../../queueless-frontend'),
  path.resolve(mobileRoot, '../../../../Medvo-frontend'),
  path.resolve(mobileRoot, '../../../Medvo-frontend'),
].filter(Boolean);
const frontendRoot = frontendCandidates.find((candidate) => fs.existsSync(candidate));
const webRoot = path.join(mobileRoot, 'web');
const androidAssetsWeb = path.join(mobileRoot, 'android', 'app', 'src', 'main', 'assets', 'web');

const copyRecursive = (src, dest) => {
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
};

const removeRecursive = (target) => {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
};

if (frontendRoot) {
  const distRoot = path.join(frontendRoot, 'dist');
  const frontendEnv = { ...process.env };

  if (process.env.BACKEND_URL && !process.env.VITE_API_BASE_URL) {
    frontendEnv.VITE_API_BASE_URL = process.env.BACKEND_URL;
    console.log('Using BACKEND_URL as VITE_API_BASE_URL for frontend build.');
  }

  console.log(`Building frontend at: ${frontendRoot}`);
  execSync('npm install', { cwd: frontendRoot, stdio: 'inherit' });
  execSync('npm run build', { cwd: frontendRoot, stdio: 'inherit', env: frontendEnv });

  if (!fs.existsSync(distRoot)) {
    console.error(`Frontend build output not found: ${distRoot}`);
    process.exit(1);
  }

  console.log(`Copying built web bundle into mobile app web directory: ${webRoot}`);
  removeRecursive(webRoot);
  copyRecursive(distRoot, webRoot);
} else {
  if (!fs.existsSync(webRoot)) {
    console.error(
      'No frontend source found and no checked-in web bundle found. ' +
      'Provide FRONTEND_ROOT or commit the mobile web/ folder before building.'
    );
    process.exit(1);
  }
  console.log('Frontend source not found in this environment; using existing checked-in web/ bundle.');
}

const androidProjectRoot = path.join(mobileRoot, 'android');
if (fs.existsSync(androidProjectRoot)) {
  console.log(`Copying mobile web bundle into Android assets: ${androidAssetsWeb}`);
  removeRecursive(androidAssetsWeb);
  copyRecursive(webRoot, androidAssetsWeb);
} else {
  console.log('Android native directory not present yet; skipping direct android/assets copy.');
}

console.log('Frontend bundle preparation complete.');

