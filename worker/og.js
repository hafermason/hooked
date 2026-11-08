// Share-preview image (1200x630) for Hooked, drawn as SVG from the game's own art.
// Rendered to PNG by resvg in the Worker. Data comes from the server (validated scores).
import { INK, PALETTES, fishInner, OTTER_SVG, KING_SVG, HOOK, WORM_BAIT } from '../src/sprites.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const fmt = (n) => Number(n || 0).toLocaleString('en-US');

// Outlined cartoon text: thick ink stroke underneath, drop shadow, then the fill.
function outlined(text, x, y, size, fill, { anchor = 'start', stroke = size * 0.16, rotate = 0 } = {}) {
  const t = esc(text);
  const common = `x="${x}" y="${y}" font-family="Lilita One" font-size="${size}" text-anchor="${anchor}"${rotate ? ` transform="rotate(${rotate} ${x} ${y})"` : ''}`;
  return `<text ${common} dy="${size * 0.08}" fill="${INK}" stroke="${INK}" stroke-width="${stroke}" stroke-linejoin="round">${t}</text>
<text ${common} fill="${INK}" stroke="${INK}" stroke-width="${stroke}" stroke-linejoin="round">${t}</text>
<text ${common} fill="${fill}">${t}</text>`;
}

function fish(x, y, w, pal, flip = 1, hooked = false) {
  const [b, be, fi] = PALETTES[pal];
  const s = w / 120;
  return `<g transform="translate(${x} ${y}) scale(${s * flip} ${s})">${fishInner(b, be, fi, hooked)}</g>`;
}

function logo(x, y, size) {
  const letters = [['H', '#FF2E93'], ['O', '#00E5FF'], ['O', '#B6FF2E'], ['K', '#FF7A1A'], ['E', '#FFE14D'], ['D', '#B98CFF'], ['!', '#FF2E93']];
  // Lilita One advance widths are roughly 0.56em for capitals; lay letters out one by one so each gets its own colour.
  const adv = { H: 0.62, O: 0.6, K: 0.58, E: 0.5, D: 0.6, '!': 0.28 };
  let cx = x, out = '';
  for (const [ch, col] of letters) { out += outlined(ch, cx, y, size, col, { stroke: size * 0.17 }); cx += adv[ch] * size; }
  return out;
}

function scene() {
  return `
<defs>
  <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22F0E0"/><stop offset=".35" stop-color="#19B8FF"/><stop offset=".75" stop-color="#6A2BEA"/><stop offset="1" stop-color="#2B0A73"/></linearGradient>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF4FA3"/><stop offset=".55" stop-color="#FF8A6B"/><stop offset="1" stop-color="#FFD36E"/></linearGradient>
  <radialGradient id="sun"><stop offset="0" stop-color="#FFF6B0"/><stop offset=".6" stop-color="#FFE14D"/><stop offset="1" stop-color="#FFE14D" stop-opacity="0"/></radialGradient>
  <linearGradient id="ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#BDF4FF"/></linearGradient>
  <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
</defs>
<rect width="1200" height="630" fill="url(#water)"/>
<rect width="1200" height="250" fill="url(#sky)"/>
<circle cx="1040" cy="150" r="120" fill="url(#sun)"/>
<rect x="-20" y="196" width="260" height="56" rx="28" fill="#FFFFFF" opacity=".8"/>
<path d="M700 262 l60 0 -120 368 -60 0z M900 262 l40 0 -110 368 -40 0z M1110 262 l50 0 -110 368 -50 0z" fill="url(#ray)"/>
<rect x="0" y="244" width="1200" height="40" fill="url(#ice)" stroke="${INK}" stroke-width="7"/>
<path d="M0 286 L60 286 L72 306 L84 286 L280 286 L290 302 L300 286 L520 286 L534 310 L548 286 L1040 286 L1052 304 L1064 286 L1200 286" fill="#BDF4FF" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
<ellipse cx="985" cy="262" rx="46" ry="11" fill="#0B7FA6" stroke="${INK}" stroke-width="5"/>`;
}

function otterWithCatch() {
  // otter on the ice, rod tip over the hole, a legendary fish dangling from the hook
  return `
<g transform="translate(790 58) scale(1.42)">${OTTER_SVG}</g>
<line x1="993" y1="122" x2="985" y2="262" stroke="#FFFFFF" stroke-width="4"/>
<line x1="985" y1="262" x2="985" y2="372" stroke="#FFFFFF" stroke-width="4"/>
<g transform="translate(976 370) scale(1.1)">${HOOK}</g>
<g transform="translate(996 447) rotate(-90)">${fish(-62, -40, 120, 'legend', 1, true).replace('<g ', '<g ')}</g>`;
}

const sparkle = (x, y, r) => `<path transform="translate(${x} ${y}) scale(${r / 10})" d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3 Z" fill="#FFFFFF" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;

export function ogSvg(c) {
  let body;
  if (c) {
    const name = (c.name || 'A friend').slice(0, 16);
    const fishLine = `caught ${fmt(c.fish)} fish and scored`;
    body = `
${logo(56, 150, 108)}
<g transform="rotate(-4 300 230)"><rect x="56" y="186" width="250" height="58" rx="16" fill="${INK}"/><rect x="56" y="180" width="250" height="58" rx="16" fill="#FF2E93" stroke="${INK}" stroke-width="6"/></g>
${outlined('CHALLENGE!', 181, 226, 40, '#FFFFFF', { anchor: 'middle', stroke: 7, rotate: -4 })}
${outlined(name, 60, 340, 66, '#FFE14D', { stroke: 11 })}
${outlined(fishLine, 60, 396, 40, '#FFFFFF', { stroke: 8 })}
${outlined(fmt(c.score), 60, 530, 140, '#FFE14D', { stroke: 20 })}
<rect x="60" y="560" width="420" height="52" rx="26" fill="${INK}"/>
<rect x="60" y="554" width="420" height="52" rx="26" fill="#B6FF2E" stroke="${INK}" stroke-width="5"/>
<text x="270" y="590" font-family="Lilita One" font-size="30" text-anchor="middle" fill="${INK}">CAN YOU BEAT IT?</text>`;
  } else {
    body = `
${logo(56, 170, 150)}
<g transform="rotate(-3 260 220)"><rect x="66" y="196" width="380" height="50" rx="25" fill="${INK}"/></g>
<text x="256" y="231" font-family="Fredoka" font-weight="700" font-size="26" letter-spacing="5" text-anchor="middle" fill="#FFFFFF" transform="rotate(-3 260 220)">ICE FISHING FRENZY</text>
${outlined('Hook fish. Dodge sharks.', 60, 400, 52, '#FFFFFF', { stroke: 10 })}
${outlined('Catch the Rainbow King.', 60, 466, 52, '#FFE14D', { stroke: 10 })}
<rect x="60" y="540" width="360" height="58" rx="29" fill="${INK}"/>
<rect x="60" y="533" width="360" height="58" rx="29" fill="#B6FF2E" stroke="${INK}" stroke-width="5"/>
<text x="240" y="573" font-family="Lilita One" font-size="32" text-anchor="middle" fill="${INK}">PLAY FREE</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
${scene()}
${fish(700, 340, 110, 'orange', -1)}
${fish(640, 540, 96, 'cyan', 1)}
${fish(1060, 560, 110, 'shiny', -1)}
${sparkle(1110, 548, 14)}${sparkle(1000, 600, 9)}
${otterWithCatch()}
${sparkle(1060, 420, 16)}${sparkle(950, 520, 11)}
${body}
</svg>`;
}
