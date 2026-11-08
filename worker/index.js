// Cloudflare Worker for Hooked!
//  - serves the built game (dist/) bundled into the Worker
//  - /c/CODE challenge links get their own share title + preview image
//  - /og/default.png and /og/c/CODE.png are rendered on the fly (resvg) and cached at the edge
//  - /stats is a small private analytics page (needs the stats key)
import html from '../dist/index.html';
import appJs from '../dist/app.js';
import css from '../dist/style.css';
import statsHtml from './stats.html';
import resvgWasm from '../node_modules/@resvg/resvg-wasm/index_bg.wasm';
import lilita from '../public/fonts/LilitaOne.ttf';
import fredoka from '../public/fonts/Fredoka-700Bold.ttf';
import fredoka500 from '../public/fonts/Fredoka-500Medium.ttf';
import fredoka600 from '../public/fonts/Fredoka-600SemiBold.ttf';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import { ogSvg } from './og.js';
import { privacyHtml, supportHtml } from './legal.js';

const API = 'https://gbdluiufwjdutslyljkw.supabase.co/functions/v1/hooked';
const CODE_RE = /^\/(?:og\/)?c\/([A-Za-z2-9]{7})(?:\.png)?\/?$/;

const FILES = {
  '/app.js': [appJs, 'text/javascript; charset=utf-8'],
  '/style.css': [css, 'text/css; charset=utf-8'],
  '/fonts/LilitaOne.ttf': [lilita, 'font/ttf', 31536000],
  '/fonts/Fredoka-500Medium.ttf': [fredoka500, 'font/ttf', 31536000],
  '/fonts/Fredoka-600SemiBold.ttf': [fredoka600, 'font/ttf', 31536000],
  '/fonts/Fredoka-700Bold.ttf': [fredoka, 'font/ttf', 31536000],
};

let wasmReady = null;
const fonts = [new Uint8Array(lilita), new Uint8Array(fredoka)];

async function getChallenge(code) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 2500);
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getChallenge', code }), signal: ctl.signal });
    return r.ok ? await r.json() : null;
  } catch (e) { return null; } finally { clearTimeout(t); }
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Number(n || 0).toLocaleString('en-US');

function pageWithMeta(origin, path, ch) {
  const title = ch ? `${ch.name} scored ${fmt(ch.score)} in Hooked! Can you beat it?` : 'Hooked! · Ice Fishing Frenzy';
  const desc = ch ? `${ch.name} caught ${fmt(ch.fish)} fish. Tap to accept the challenge. Free, no download.` : 'Hook fish, dodge sharks and catch the Rainbow King. Free to play in your browser.';
  const img = ch ? `${origin}/og/c/${ch.code}.png` : `${origin}/og/default.png`;
  const meta = `
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Hooked!">
<meta property="og:url" content="${esc(origin + path)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
`;
  const out = html.replace(/<!--OG-->[\s\S]*<!--\/OG-->/, meta);
  return new Response(out, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
}

async function ogImage(request, ctx, code) {
  const cache = caches.default;
  const key = new Request(new URL(request.url).toString(), { method: 'GET' });
  const hit = await cache.match(key);
  if (hit) return hit;
  let data = null;
  if (code) { data = await getChallenge(code.toUpperCase()); if (!data) return new Response('Not found', { status: 404 }); }
  if (!wasmReady) wasmReady = initWasm(resvgWasm);
  await wasmReady;
  const png = new Resvg(ogSvg(data), { font: { fontBuffers: fonts, loadSystemFonts: false, defaultFontFamily: 'Fredoka' } }).render().asPng();
  const res = new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' } });
  ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;
    const f = FILES[p];
    if (f) return new Response(f[0], { headers: { 'Content-Type': f[1], 'Cache-Control': `public, max-age=${f[2] || 300}`, 'Access-Control-Allow-Origin': '*' } });
    if (p === '/og/default.png') return ogImage(request, ctx, null);
    if (p.startsWith('/og/c/')) { const m = CODE_RE.exec(p); return m ? ogImage(request, ctx, m[1]) : new Response('Not found', { status: 404 }); }
    if (p === '/stats') return new Response(statsHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
    if (p === '/privacy' || p === '/support') return new Response(p === '/privacy' ? privacyHtml() : supportHtml(), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=600' } });
    if (p.startsWith('/c/')) {
      const m = CODE_RE.exec(p);
      const ch = m ? await getChallenge(m[1].toUpperCase()) : null;
      return pageWithMeta(url.origin, p, ch);
    }
    if (p === '/' || !p.includes('.')) return pageWithMeta(url.origin, '/', null);
    return new Response('Not found', { status: 404 });
  },
};
