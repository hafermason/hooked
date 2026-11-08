// Cloudflare Worker that serves the built game (dist/) and routes share links.
// Files are bundled into the Worker at deploy time, so there's no separate asset upload.
import html from '../dist/index.html';
import appJs from '../dist/app.js';
import css from '../dist/style.css';

const FILES = {
  '/app.js': [appJs, 'text/javascript; charset=utf-8'],
  '/style.css': [css, 'text/css; charset=utf-8'],
};

const page = () => new Response(html, {
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' },
});

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const f = FILES[url.pathname];
    if (f) return new Response(f[0], { headers: { 'Content-Type': f[1], 'Cache-Control': 'public, max-age=300' } });
    // "/" , "/c/ABC2345" (challenge links) and anything else -> the game page
    if (url.pathname === '/' || url.pathname.startsWith('/c/') || !url.pathname.includes('.')) return page();
    return new Response('Not found', { status: 404 });
  },
};
