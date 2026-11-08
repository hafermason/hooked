// Privacy policy + support pages required by the App Store and Google Play.
// CONTACT is shown publicly on both pages.
export const CONTACT = 'haferdigitals@gmail.com';
const UPDATED = 'November 8, 2026';

const shell = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Hooked!</title>
<style>body{margin:0;font:17px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1A0B3D;background:#F3EDFF}
main{max-width:720px;margin:0 auto;padding:28px 18px 60px}h1{font-size:30px;margin:0 0 4px}h2{font-size:20px;margin:28px 0 6px}
.muted{color:#6B5F86;font-size:14px}a{color:#B3006A}li{margin:4px 0}</style></head><body><main>${body}</main></body></html>`;

const mail = () => CONTACT.includes('@') ? `<a href="mailto:${CONTACT}">${CONTACT}</a>` : '(contact email coming soon)';

export const privacyHtml = () => shell('Privacy Policy', `
<h1>Privacy Policy</h1><p class="muted">Hooked! · Last updated ${UPDATED}</p>
<p>Hooked! is a casual game. You can play without an account, and we collect as little as possible.</p>
<h2>What we collect</h2>
<ul>
<li><b>An anonymous player ID.</b> The game creates a random ID on your device so your scores stay yours. We store only a one-way fingerprint (hash) of it. It is not linked to your name, email, phone number or advertising ID.</li>
<li><b>The nickname you type</b> when you save a score. It is shown publicly on the leaderboards and on challenge links you share. Don't use your real name if you'd rather not.</li>
<li><b>Game results</b>: scores, fish caught, combos, how long a run lasted, and which challenge link you played from, so we can run leaderboards, challenges and catch cheating.</li>
<li><b>Basic usage events</b>: when the game is opened, played, finished or shared, the type of device (iPhone, Android, desktop) and a campaign tag if you arrived from a tagged link. This tells us whether the game works and is fun.</li>
</ul>
<h2>What we don't collect</h2>
<ul><li>No account, email, phone number, contacts, photos, location or advertising ID.</li>
<li>We don't store IP addresses with your game data, and we don't track you across other apps or websites.</li>
<li>We don't sell or share your data.</li></ul>
<h2>Where it's stored</h2>
<p>Game data is stored with our service providers Supabase (database) and Cloudflare (hosting), who process it only to run the game.</p>
<h2>Children</h2>
<p>Hooked! is not directed at children under 13, and we don't knowingly collect personal information from them. Nicknames are filtered for offensive words.</p>
<h2>Deleting your data</h2>
<p>Deleting the app removes the player ID from your device. To have your scores and nickname removed from our servers, email ${mail()} with your nickname and roughly when you played, and we'll delete them within 30 days.</p>
<h2>Changes</h2><p>If this policy changes we'll update this page and the date above.</p>
<h2>Contact</h2><p>${mail()}</p>`);

export const supportHtml = () => shell('Support', `
<h1>Hooked! Support</h1><p class="muted">Ice Fishing Frenzy</p>
<h2>How to play</h2>
<ul><li>Drag your finger up and down to move the hook. Touch a fish to hook it, then pull it up through the ice hole.</li>
<li>Jellyfish zap your line, sharks steal your catch, crabs cut the line (tap them to shoo them away!), boots and tires knock fish off. A can of worms gives you an extra worm.</li>
<li>Catch fish in a row for a combo multiplier. Every 30 fish, the Rainbow King appears.</li></ul>
<h2>Challenge a friend</h2><p>At game over, tap <b>Challenge a Friend</b> to send a link. Your friend sees your score and tries to beat it.</p>
<h2>Problems or questions?</h2><p>Email ${mail()}. Tell us your device and what happened and we'll help.</p>
<p><a href="/privacy">Privacy Policy</a></p>`);
