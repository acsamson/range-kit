import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const packages = [
  'packages/core',
  'packages/react',
  'packages/vue',
  'examples/react-demo',
  'examples/vue-demo'
];

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getGzipSize(content) {
  return zlib.gzipSync(content).length;
}

function scanDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      scanDir(filePath, fileList);
    } else {
      // Exclude source maps and declaration files for cleaner output
      if (!file.endsWith('.map') && !file.endsWith('.d.ts') && !file.endsWith('.d.mts')) {
         fileList.push(filePath);
      }
    }
  });
  return fileList;
}

console.log('📦 Bundle Analysis Report\n');

packages.forEach(pkg => {
  const pkgPath = path.join(rootDir, pkg);
  const distPath = path.join(pkgPath, 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.log(`⚠️  ${pkg}: dist folder not found (maybe run build first?)`);
    return;
  }

  const files = scanDir(distPath);
  if (files.length === 0) {
    console.log(`⚠️  ${pkg}: no files in dist`);
    return;
  }

  console.log(`👉 ${pkg}`);
  console.log('  ' + '-'.repeat(80));
  console.log('  ' + 'File'.padEnd(50) + 'Size'.padEnd(15) + 'Gzip');
  console.log('  ' + '-'.repeat(80));

  files.forEach(file => {
    const content = fs.readFileSync(file);
    const size = content.length;
    const gzip = getGzipSize(content);
    const relativePath = path.relative(distPath, file);
    
    console.log('  ' + relativePath.padEnd(50) + formatBytes(size).padEnd(15) + formatBytes(gzip));
  });
  console.log('\n');
});
