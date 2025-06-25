#!/usr/bin/env node

// Simple build script to work around Render directory issues
import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('=== DigQuest Build Script ===');
console.log('Current directory:', process.cwd());
console.log('Files in current directory:');
execSync('ls -la', { stdio: 'inherit' });

// Check if we have the required files
if (!existsSync('package.json')) {
  console.error('ERROR: package.json not found!');
  process.exit(1);
}

if (!existsSync('vite.config.ts')) {
  console.error('ERROR: vite.config.ts not found!');
  process.exit(1);
}

console.log('\n=== Installing Dependencies ===');
try {
  execSync('npm ci', { stdio: 'inherit' });
} catch (error) {
  console.error('npm ci failed, trying npm install');
  execSync('npm install', { stdio: 'inherit' });
}

console.log('\n=== Building Client ===');
execSync('npx vite build', { stdio: 'inherit' });

console.log('\n=== Building Server ===');
execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

console.log('\n=== Build Complete ===');