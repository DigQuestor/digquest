const { execSync } = require('child_process');
const fs = require('fs');

console.log('=== Render Build Script ===');
console.log('Working directory:', process.cwd());
console.log('Directory contents:');
try {
  execSync('ls -la', { stdio: 'inherit' });
} catch (e) {
  console.log('ls command failed, trying dir');
  execSync('dir', { stdio: 'inherit' });
}

// Check for required files
if (!fs.existsSync('package.json')) {
  console.error('ERROR: package.json not found');
  process.exit(1);
}

console.log('\n=== Installing Dependencies ===');
execSync('npm install --production=false', { stdio: 'inherit' });

console.log('\n=== Building Client ===');
execSync('npx vite build --config vite.config.minimal.ts', { stdio: 'inherit' });

console.log('\n=== Building Server ===');
execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

console.log('\n=== Build Complete ===');