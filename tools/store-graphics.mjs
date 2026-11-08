// Google Play feature graphic (1024x500) + 512x512 icon, from the same art as the share images.
import { readFileSync, writeFileSync } from 'fs';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import sharp from 'sharp';
import { ogSvg } from '../worker/og.js';

await initWasm(readFileSync(new URL('../node_modules/@resvg/resvg-wasm/index_bg.wasm', import.meta.url)));
const fonts = ['LilitaOne.ttf', 'Fredoka-700Bold.ttf'].map((f) => readFileSync(new URL('../public/fonts/' + f, import.meta.url)));
// Reuse the default share card, cropped to Google's 1024x500 (2.048:1) frame.
const card = ogSvg(null).replace('width="1200" height="630" viewBox="0 0 1200 630"', 'width="1024" height="500" viewBox="0 36 1200 586"');
const png = new Resvg(card, { font: { fontBuffers: fonts, loadSystemFonts: false, defaultFontFamily: 'Fredoka' } }).render().asPng();
writeFileSync(new URL('../store/google/feature-graphic-1024x500.png', import.meta.url), await sharp(png).resize(1024, 500).png().toBuffer());
await sharp(new URL('../assets/icon-only.png', import.meta.url).pathname).resize(512, 512).png().toFile(new URL('../store/google/icon-512.png', import.meta.url).pathname);
console.log('wrote feature graphic + 512 icon');
