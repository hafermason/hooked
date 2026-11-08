// Renders the app icon and splash screen PNGs into assets/ from the game's SVG art.
// Run: node tools/make-art.mjs   (then: npx capacitor-assets generate)
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import { INK, PALETTES, fishInner, OTTER_SVG, HOOK } from '../src/sprites.js';

await initWasm(readFileSync(new URL('../node_modules/@resvg/resvg-wasm/index_bg.wasm', import.meta.url)));
const fonts = ['LilitaOne.ttf', 'Fredoka-700Bold.ttf'].map((f) => readFileSync(new URL('../public/fonts/' + f, import.meta.url)));
const render = (svg) => new Resvg(svg, { font: { fontBuffers: fonts, loadSystemFonts: false, defaultFontFamily: 'Fredoka' } }).render().asPng();
const fish = (x, y, w, pal, flip = 1, hooked = false) => { const [b, be, fi] = PALETTES[pal]; const s = w / 120; return `<g transform="translate(${x} ${y}) scale(${s * flip} ${s})">${fishInner(b, be, fi, hooked)}</g>`; };
const defs = `<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF4FA3"/><stop offset=".6" stop-color="#FF8A6B"/><stop offset="1" stop-color="#FFD36E"/></linearGradient>
<linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22F0E0"/><stop offset=".4" stop-color="#19B8FF"/><stop offset="1" stop-color="#6A2BEA"/></linearGradient>
<radialGradient id="sun"><stop offset="0" stop-color="#FFF6B0"/><stop offset=".6" stop-color="#FFE14D"/><stop offset="1" stop-color="#FFE14D" stop-opacity="0"/></radialGradient></defs>`;

// 1024x1024 icon, no transparency (App Store requirement). Otter on the ice with a fish on the line.
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs}
<rect width="1024" height="1024" fill="url(#water)"/>
<rect width="1024" height="560" fill="url(#sky)"/>
<circle cx="800" cy="250" r="200" fill="url(#sun)"/>
<g transform="translate(150 70) scale(3.3)">${OTTER_SVG}</g>
<rect x="-10" y="545" width="1044" height="64" fill="#E8FCFF" stroke="${INK}" stroke-width="14"/>
<ellipse cx="640" cy="575" rx="96" ry="22" fill="#0B7FA6" stroke="${INK}" stroke-width="10"/>
<line x1="640" y1="215" x2="640" y2="700" stroke="#FFFFFF" stroke-width="9"/>
<g transform="translate(616 692) scale(2.2)">${HOOK}</g>
<g transform="translate(668 868) rotate(-90)">${fish(-130, -84, 250, 'legend', 1, true)}</g>
</svg>`;

// Splash: logo + otter on a 2732 square (Capacitor crops it for every screen size, keep content in the middle).
const L = [['H', '#FF2E93'], ['O', '#00E5FF'], ['O', '#B6FF2E'], ['K', '#FF7A1A'], ['E', '#FFE14D'], ['D', '#B98CFF'], ['!', '#FF2E93']];
const adv = { H: 0.62, O: 0.6, K: 0.58, E: 0.5, D: 0.6, '!': 0.28 };
const size = 300; let x = 1366 - (L.reduce((a, [c]) => a + adv[c], 0) * size) / 2; let logo = '';
for (const [c, col] of L) {
  for (const [dy, fill, sw] of [[24, INK, 50], [0, INK, 50], [0, col, 0]])
    logo += `<text x="${x}" y="${880 + dy}" font-family="Lilita One" font-size="${size}" fill="${fill}"${sw ? ` stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"` : ''}>${c}</text>`;
  x += adv[c] * size;
}
const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">${defs}
<rect width="2732" height="2732" fill="url(#water)"/>
<rect width="2732" height="1450" fill="url(#sky)"/>
<circle cx="1900" cy="900" r="420" fill="url(#sun)"/>
${logo}
<g transform="translate(1166 1110) scale(2.6)">${OTTER_SVG}</g>
<rect x="-10" y="1440" width="2752" height="70" fill="#E8FCFF" stroke="${INK}" stroke-width="14"/>
${fish(900, 1700, 260, 'orange', 1)}${fish(1700, 1820, 220, 'cyan', -1)}${fish(1250, 1950, 240, 'shiny', 1)}
</svg>`;

mkdirSync(new URL('../assets', import.meta.url), { recursive: true });
writeFileSync(new URL('../assets/icon-only.png', import.meta.url), render(icon));
writeFileSync(new URL('../assets/splash.png', import.meta.url), render(splash));
writeFileSync(new URL('../assets/splash-dark.png', import.meta.url), render(splash));
console.log('wrote assets/icon-only.png, assets/splash.png, assets/splash-dark.png');
