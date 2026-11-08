// All art is the SVG from the Claude Design sprite sheet, rasterised once to canvases.
export const INK = '#1A0B3D';

export const PALETTES = {
  orange: ['#FF7A1A', '#FFE14D', '#FF2E93'],
  cyan:   ['#00E5FF', '#FFFFFF', '#8B2CFF'],
  yellow: ['#FFE14D', '#FFFFFF', '#FF7A1A'],
  pink:   ['#FF2E93', '#FFFFFF', '#FFE14D'],
  shiny:  ['#B6FF2E', '#FFFFFF', '#00E5FF'],
  legend: ['#B98CFF', '#FFE14D', '#FF2E93'],
};

export function fishInner(body, belly, fin, hooked) {
  return `
<path d="M48 18 Q62 -4 82 18 Z" fill="${fin}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
<path d="M26 40 L3 14 Q-2 40 3 66 Z" fill="${fin}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="62" cy="40" rx="42" ry="28" fill="${body}" stroke="${INK}" stroke-width="5"/>
<path d="M30 48 Q62 72 98 48 Q62 60 30 48 Z" fill="${belly}"/>
${hooked ? '' : `<path d="M44 28 Q52 40 44 52" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" opacity=".45"/>`}
<path d="M54 48 Q62 60 72 48" fill="${fin}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
<ellipse cx="70" cy="24" rx="12" ry="4.5" fill="#FFFFFF" opacity=".6"/>
<circle cx="84" cy="32" r="9" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/>
${hooked
    ? `<path d="M80 28 L88 36 M88 28 L80 36" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><ellipse cx="100" cy="46" rx="5" ry="6" fill="${INK}"/>`
    : `<circle cx="86" cy="33" r="4.5" fill="${INK}"/><path d="M96 48 Q101 51 97 55" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`}`;
}

const otterBase = (happy) => `
<ellipse cx="26" cy="124" rx="24" ry="9" fill="#7A4424" stroke="${INK}" stroke-width="5" transform="rotate(-12 26 124)"/>
<ellipse cx="70" cy="96" rx="46" ry="40" fill="#9A5B34" stroke="${INK}" stroke-width="5"/>
<ellipse cx="70" cy="106" rx="28" ry="24" fill="#FFD9A8"/>
<circle cx="36" cy="40" r="10" fill="#9A5B34" stroke="${INK}" stroke-width="5"/>
<circle cx="104" cy="40" r="10" fill="#9A5B34" stroke="${INK}" stroke-width="5"/>
<circle cx="70" cy="60" r="38" fill="#9A5B34" stroke="${INK}" stroke-width="5"/>
<ellipse cx="70" cy="74" rx="22" ry="15" fill="#FFE3C2" stroke="${INK}" stroke-width="4"/>
<ellipse cx="70" cy="66" rx="7" ry="5" fill="${INK}"/>
${happy
    ? `<ellipse cx="70" cy="80" rx="6" ry="5" fill="#B3006A" stroke="${INK}" stroke-width="3"/>
<path d="M47 50 Q53 44 59 50" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
<path d="M81 50 Q87 44 93 50" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`
    : `<path d="M63 76 Q70 83 77 76" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
<circle cx="53" cy="55" r="6" fill="${INK}"/><circle cx="55" cy="53" r="2" fill="#FFFFFF"/>
<circle cx="87" cy="55" r="6" fill="${INK}"/><circle cx="89" cy="53" r="2" fill="#FFFFFF"/>`}
<ellipse cx="42" cy="70" rx="7" ry="4" fill="#FF8FC2"/><ellipse cx="98" cy="70" rx="7" ry="4" fill="#FF8FC2"/>
<path d="M32 44 Q34 6 70 6 Q106 6 108 44 Z" fill="#FF2E93" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
<rect x="28" y="36" width="84" height="15" rx="7.5" fill="#B6FF2E" stroke="${INK}" stroke-width="5"/>
<circle cx="70" cy="6" r="11" fill="#00E5FF" stroke="${INK}" stroke-width="5"/>
<line x1="98" y1="104" x2="146" y2="44" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
<line x1="98" y1="104" x2="146" y2="44" stroke="#FF7A1A" stroke-width="5" stroke-linecap="round"/>
<circle cx="106" cy="96" r="6" fill="#00E5FF" stroke="${INK}" stroke-width="3"/>
<ellipse cx="100" cy="106" rx="11" ry="9" fill="#9A5B34" stroke="${INK}" stroke-width="4"/>`;
export const OTTER_SVG = otterBase(false);

const CRAB = `
<path d="M30 50 L16 66 M40 56 L34 68 M60 56 L66 68 M70 50 L84 66" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
<line x1="40" y1="28" x2="36" y2="12" stroke="${INK}" stroke-width="4"/><line x1="60" y1="28" x2="64" y2="12" stroke="${INK}" stroke-width="4"/>
<ellipse cx="50" cy="42" rx="28" ry="18" fill="#FF5A3D" stroke="${INK}" stroke-width="5"/>
<circle cx="36" cy="10" r="6" fill="#FFFFFF" stroke="${INK}" stroke-width="3"/><circle cx="64" cy="10" r="6" fill="#FFFFFF" stroke="${INK}" stroke-width="3"/>
<circle cx="37" cy="11" r="2.5" fill="${INK}"/><circle cx="63" cy="11" r="2.5" fill="${INK}"/>
<path d="M22 38 Q4 36 6 20 L14 24 L12 12 Q28 14 26 34 Z" fill="#FF5A3D" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
<path d="M78 38 Q96 36 94 20 L86 24 L88 12 Q72 14 74 34 Z" fill="#FF5A3D" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;

const JELLY = `
<path d="M18 52 Q26 70 18 86 Q12 98 20 108 M32 54 Q38 72 32 90 M48 54 Q42 72 48 90 M62 52 Q54 70 62 86 Q68 98 60 108" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
<path d="M18 52 Q26 70 18 86 Q12 98 20 108 M32 54 Q38 72 32 90 M48 54 Q42 72 48 90 M62 52 Q54 70 62 86 Q68 98 60 108" fill="none" stroke="#FF6FB5" stroke-width="4" stroke-linecap="round"/>
<path d="M6 50 Q6 6 40 6 Q74 6 74 50 Q66 58 57 50 Q48 58 40 50 Q32 58 23 50 Q14 58 6 50 Z" fill="#FF9BE6" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="28" cy="20" rx="9" ry="4" fill="#FFFFFF" opacity=".75"/>
<circle cx="30" cy="34" r="4" fill="${INK}"/><circle cx="50" cy="34" r="4" fill="${INK}"/>
<path d="M35 42 Q40 46 45 42" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;

const BOOT = `
<path d="M20 6 L46 6 L46 46 L70 52 Q78 54 76 64 L76 70 L12 70 L12 40 Z" fill="#B0703A" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
<rect x="10" y="66" width="68" height="10" rx="4" fill="#5C3A1E" stroke="${INK}" stroke-width="4"/>
<path d="M24 18 L42 18 M24 28 L42 28" stroke="#FFE14D" stroke-width="4" stroke-linecap="round"/>`;

const TIRE = `
<circle cx="40" cy="40" r="34" fill="#3A3150" stroke="${INK}" stroke-width="5"/>
<circle cx="40" cy="40" r="15" fill="#22F0E0" stroke="${INK}" stroke-width="5" opacity=".9"/>
<path d="M40 8 L40 18 M40 62 L40 72 M8 40 L18 40 M62 40 L72 40 M17 17 L24 24 M56 56 L63 63 M63 17 L56 24 M17 63 L24 56" stroke="#6B5F86" stroke-width="5" stroke-linecap="round"/>
<path d="M22 22 Q30 14 40 13" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;

const CAN = `
<path d="M28 26 Q24 8 34 6" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
<path d="M28 26 Q24 8 34 6" fill="none" stroke="#FF6FB5" stroke-width="5" stroke-linecap="round"/>
<path d="M50 26 Q58 12 50 4" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
<path d="M50 26 Q58 12 50 4" fill="none" stroke="#FF6FB5" stroke-width="5" stroke-linecap="round"/>
<circle cx="35" cy="6" r="1.8" fill="${INK}"/><circle cx="49" cy="4" r="1.8" fill="${INK}"/>
<rect x="12" y="28" width="56" height="56" rx="8" fill="#FF7A1A" stroke="${INK}" stroke-width="5"/>
<rect x="12" y="44" width="56" height="24" fill="#FFE14D" stroke="${INK}" stroke-width="4"/>
<path d="M30 56 h12 M36 50 v12 M48 50 v13" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="40" cy="28" rx="28" ry="7" fill="#FFB36B" stroke="${INK}" stroke-width="5"/>`;

const SHARK = `
<path d="M188 16 L170 50 L188 88 L150 66 Z" fill="#5B6CFF" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
<path d="M94 32 L112 0 L128 34 Z" fill="#5B6CFF" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
<path d="M8 54 Q50 18 120 28 Q158 34 162 52 Q158 72 120 78 Q50 88 8 54 Z" fill="#7A8CFF" stroke="${INK}" stroke-width="5"/>
<path d="M16 60 Q60 80 140 68 Q90 74 16 60 Z" fill="#E6EBFF"/>
<path d="M80 64 L96 88 L106 66 Z" fill="#5B6CFF" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
<path d="M66 44 Q70 52 66 60 M74 44 Q78 52 74 60" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
<circle cx="42" cy="44" r="7" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/><circle cx="40" cy="45" r="3.5" fill="${INK}"/>
<path d="M30 34 L52 40" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
<path d="M14 60 L20 55 L24 62 L30 56 L34 63 L40 58 L44 64" fill="#FFFFFF" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;

const HOOK = `<path d="M14 0 L14 20 Q14 32 24 32 Q32 32 32 24" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M14 0 L14 20 Q14 32 24 32 Q32 32 32 24" fill="none" stroke="#E6ECFF" stroke-width="3.5" stroke-linecap="round"/>`;
const WORM_BAIT = `<path d="M24 30 Q34 36 30 46 Q26 54 34 58" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M24 30 Q34 36 30 46 Q26 54 34 58" fill="none" stroke="#FF6FB5" stroke-width="5" stroke-linecap="round"/>`;

const WORM_ICON = (c) => `<path d="M6 26 Q12 12 20 22 Q28 32 34 16" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M6 26 Q12 12 20 22 Q28 32 34 16" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/><circle cx="33" cy="15" r="1.8" fill="${INK}"/>`;

export const KING_SVG = `
<defs>
<linearGradient id="rkBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF2E93"/><stop offset=".25" stop-color="#FF7A1A"/><stop offset=".45" stop-color="#FFE14D"/><stop offset=".65" stop-color="#B6FF2E"/><stop offset=".82" stop-color="#00E5FF"/><stop offset="1" stop-color="#8B2CFF"/></linearGradient>
<linearGradient id="rkFin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00E5FF"/><stop offset=".5" stop-color="#FF2E93"/><stop offset="1" stop-color="#8B2CFF"/></linearGradient>
</defs>
<path d="M62 82 L6 22 Q24 82 6 142 Z" fill="url(#rkFin)" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
<path d="M50 70 L22 46 M50 94 L22 118" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".6"/>
<path d="M84 40 Q118 -6 168 34 Z" fill="url(#rkFin)" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
<ellipse cx="130" cy="84" rx="88" ry="56" fill="url(#rkBody)" stroke="${INK}" stroke-width="6"/>
<path d="M78 64 q8 10 16 0 q8 10 16 0 q8 10 16 0 q8 10 16 0 M70 86 q8 10 16 0 q8 10 16 0 q8 10 16 0 q8 10 16 0 q8 10 16 0 M84 108 q8 10 16 0 q8 10 16 0 q8 10 16 0 q8 10 16 0" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".55"/>
<path d="M70 104 Q130 152 200 104 Q130 128 70 104 Z" fill="#FFFFFF" opacity=".45"/>
<ellipse cx="120" cy="48" rx="26" ry="7" fill="#FFFFFF" opacity=".7"/>
<path d="M120 104 Q128 136 152 106 Z" fill="url(#rkFin)" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
<circle cx="182" cy="72" r="15" fill="#FFFFFF" stroke="${INK}" stroke-width="5"/>
<circle cx="186" cy="74" r="7.5" fill="${INK}"/><circle cx="183" cy="70" r="2.6" fill="#FFFFFF"/>
<path d="M200 102 Q212 108 204 118" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
<path d="M148 36 L154 6 L166 22 L176 0 L186 22 L198 6 L204 36 Z" fill="#FFE14D" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
<circle cx="176" cy="26" r="4.5" fill="#FF2E93" stroke="${INK}" stroke-width="2.5"/>
<circle cx="160" cy="28" r="3" fill="#00E5FF" stroke="${INK}" stroke-width="2"/>
<circle cx="192" cy="28" r="3" fill="#B6FF2E" stroke="${INK}" stroke-width="2"/>`;

const DPR = Math.min(2, window.devicePixelRatio || 1);

function makeSprite(inner, vb, unitsPx) {
  const [, , vw, vh] = vb;
  const rs = unitsPx * DPR * 1.15;
  const W = Math.ceil(vw * rs), H = Math.ceil(vh * rs);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" width="${W}" height="${H}">${inner}</svg>`;
  const spr = { vb, canvas: null };
  spr.ready = new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      c.getContext('2d').drawImage(img, 0, 0, W, H);
      spr.canvas = c; res();
    };
    img.onerror = () => res();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  return spr;
}

// Draw sprite so its unit point (ax, ay) lands on (x, y), at s px per unit.
export function drawSpr(ctx, spr, ax, ay, x, y, s, rot = 0, fx = 1, fy = 1, alpha = 1) {
  if (!spr || !spr.canvas) return;
  const [vx, vy, vw, vh] = spr.vb;
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(s * fx, s * fy);
  if (alpha !== 1) ctx.globalAlpha *= alpha;
  ctx.drawImage(spr.canvas, vx - ax, vy - ay, vw, vh);
  ctx.restore();
}

export const SP = {};
export async function loadSprites() {
  const FISH_VB = [-8, -10, 136, 96];
  for (const [k, p] of Object.entries(PALETTES)) {
    SP['fish_' + k] = makeSprite(fishInner(p[0], p[1], p[2], false), FISH_VB, 0.8);
    SP['fishH_' + k] = makeSprite(fishInner(p[0], p[1], p[2], true), FISH_VB, 0.8);
  }
  SP.otter = makeSprite(otterBase(false), [-6, -12, 160, 156], 1.08);
  SP.otterHappy = makeSprite(otterBase(true), [-6, -12, 160, 156], 1.08);
  SP.crab = makeSprite(CRAB, [0, 0, 100, 72], 0.76);
  SP.jelly = makeSprite(JELLY, [0, 0, 80, 112], 0.84);
  SP.boot = makeSprite(BOOT, [4, 0, 80, 82], 0.72);
  SP.tire = makeSprite(TIRE, [0, 0, 80, 80], 0.72);
  SP.can = makeSprite(CAN, [0, 0, 80, 90], 0.8);
  SP.shark = makeSprite(SHARK, [0, -4, 200, 100], 0.9);
  SP.hook = makeSprite(HOOK, [0, 0, 40, 40], 0.7);
  SP.bait = makeSprite(HOOK + WORM_BAIT, [0, 0, 44, 64], 0.7);
  SP.king = makeSprite(KING_SVG, [-4, -6, 228, 160], 1.0);
  SP.wormOn = makeSprite(WORM_ICON('#FF6FB5'), [0, 0, 40, 40], 0.9);
  SP.wormOff = makeSprite(WORM_ICON('#D9D3E8'), [0, 0, 40, 40], 0.9);
  await Promise.all(Object.values(SP).map((s) => s.ready));
}
