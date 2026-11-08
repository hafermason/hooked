// Bundles src/ into dist/ for deployment (one JS + one CSS file).
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'fs';
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'esm', outfile: 'dist/app.js', target: 'es2020' });
await build({ entryPoints: ['src/style.css'], minify: true, outfile: 'dist/style.css' });
let html = readFileSync('index.html', 'utf8')
  .replace('/src/style.css', '/style.css')
  .replace('<script type="module" src="/src/main.js"></script>', '<script type="module" src="/app.js"></script>');
writeFileSync('dist/index.html', html);
if (existsSync('public')) cpSync('public', 'dist', { recursive: true });
console.log('built dist/');
