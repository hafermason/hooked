import { CFG, ramp } from './config.js';
import { SP, drawSpr, INK } from './sprites.js';
import { sfx } from './sfx.js';
import { haptic } from './native.js';

const W = CFG.stage.w, H = CFG.stage.h;
const HOLE = CFG.world.hole;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function star(c, x, y, r) {
  c.beginPath();
  const p = [[0, -1], [.3, -.3], [1, 0], [.3, .3], [0, 1], [-.3, .3], [-1, 0], [-.3, -.3]];
  p.forEach(([a, b], i) => (i ? c.lineTo : c.moveTo).call(c, x + a * r, y + b * r));
  c.closePath();
}
function outlined(c, text, x, y, size, fill, align = 'center') {
  c.font = `${size}px 'Lilita One', sans-serif`;
  c.textAlign = align; c.textBaseline = 'middle';
  c.lineJoin = 'round'; c.lineWidth = Math.max(4, size * 0.2); c.strokeStyle = INK;
  c.strokeText(text, x, y + size * 0.1);
  c.strokeText(text, x, y);
  c.fillStyle = fill; c.fillText(text, x, y);
}

// Seaweed path from the design (40x200 units, base at bottom centre)
const WEED = [[20, 200], [2, 160], [20, 120], [38, 80], [20, 40], [10, 20], [20, 2]];

export class Game {
  constructor(canvas, hooks) {
    this.cv = canvas;
    this.hooks = hooks;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * this.dpr; canvas.height = H * this.dpr;
    this.ctx = canvas.getContext('2d');
    this.state = 'idle';
    this.buildBackground();
    this.bindInput();
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  // ---------------------------------------------------------------- setup
  buildBackground() {
    const mk = () => { const c = document.createElement('canvas'); c.width = W * this.dpr; c.height = H * this.dpr; const x = c.getContext('2d'); x.scale(this.dpr, this.dpr); return [c, x]; };
    const [back, b] = mk();
    let g = b.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#22F0E0'); g.addColorStop(.28, '#19B8FF'); g.addColorStop(.66, '#6A2BEA'); g.addColorStop(1, '#2B0A73');
    b.fillStyle = g; b.fillRect(0, 0, W, H);
    g = b.createLinearGradient(0, 0, 0, 204);
    g.addColorStop(0, '#FF4FA3'); g.addColorStop(.55, '#FF8A6B'); g.addColorStop(1, '#FFD36E');
    b.fillStyle = g; b.fillRect(0, 0, W, 204);
    g = b.createRadialGradient(325, 135, 0, 325, 135, 75);
    g.addColorStop(0, '#FFF6B0'); g.addColorStop(.69, '#FFE14D'); g.addColorStop(1, 'rgba(255,225,77,0)');
    b.fillStyle = g; b.fillRect(250, 60, 150, 150);
    b.fillStyle = 'rgba(255,255,255,.8)'; rr(b, -20, 150, 120, 40, 20); b.fill();
    this.bgBack = back;

    const [ice, i] = mk();
    i.fillStyle = INK; i.fillRect(0, 196, W, 38);
    g = i.createLinearGradient(0, 201, 0, 229); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#BDF4FF');
    i.fillStyle = g; i.fillRect(0, 201, W, 28);
    i.beginPath(); i.ellipse(HOLE.x, HOLE.y, 28, 7, 0, 0, Math.PI * 2);
    i.fillStyle = '#0B7FA6'; i.fill(); i.lineWidth = 4; i.strokeStyle = INK; i.stroke();
    i.save(); i.translate(0, 233);
    i.beginPath();
    const pts = [[0, 0], [20, 0], [28, 14], [36, 0], [90, 0], [96, 10], [102, 0], [170, 0], [180, 16], [190, 0], [340, 0], [348, 12], [356, 0], [390, 0]];
    pts.forEach(([x, y], k) => (k ? i.lineTo(x, y) : i.moveTo(x, y)));
    i.fillStyle = '#BDF4FF'; i.fill(); i.lineWidth = 4; i.lineJoin = 'round'; i.strokeStyle = INK; i.stroke();
    i.restore();
    this.bgIce = ice;

    this.weedBack = [{ x: 70, h: 200, dur: 5, d: 0 }, { x: 160, h: 150, dur: 6, d: 1 }, { x: 250, h: 220, dur: 5.5, d: .5 }, { x: 340, h: 170, dur: 6.5, d: 1.5 }];
    this.weedFront = [{ x: 130, h: 90, dur: 3.4, d: 0, c: '#B6FF2E' }, { x: 340, h: 120, dur: 3, d: .6, c: '#2EE68A' }, { x: 362, h: 80, dur: 3.6, d: .3, c: '#FF6FB5' }];
    this.bubbles = Array.from({ length: 10 }, () => ({ x: rnd(10, 380), y: rnd(260, 860), s: rnd(8, 18), v: rnd(60, 110) }));
  }

  bindInput() {
    const cv = this.cv;
    this.pointer = null;
    const toStage = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
    };
    const aim = (p, type) => {
      const off = type === 'mouse' ? 0 : CFG.hook.touchOffsetY;
      this.aimX = p.x; this.aimY = p.y - off;
    };
    cv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sfx.unlock();
      const p = toStage(e);
      if (this.state === 'play' && this.tapCrab(p)) return;
      this.pointer = e.pointerId;
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      aim(p, e.pointerType);
    });
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' || this.pointer === e.pointerId) aim(toStage(e), e.pointerType);
    });
    const up = (e) => { if (this.pointer === e.pointerId) this.pointer = null; };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    this.keys = {};
    window.addEventListener('keydown', (e) => { this.keys[e.key] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.key] = false; });
  }

  // ---------------------------------------------------------------- run lifecycle
  start({ daily, runId, target = null, targetName = null }) {
    this.daily = daily || null;
    this.target = target; this.targetName = targetName; this.targetBeaten = false;
    this.runId = runId;
    this.t = 0;
    this.run = { score: 0, fish: 0, counts: { common: 0, rare: 0, legendary: 0, king: 0 }, maxCombo: 1, shooed: 0, cans: 0, catches: [], duration: 0, dailyDone: false };
    this.worms = CFG.worms.start;
    this.streak = 0; this.combo = 1;
    this.mult = 1;
    this.level = 0;
    this.hook = { x: HOLE.x, y: 300, carry: null, inv: 0, rebait: 0, wig: 0 };
    this.aimX = HOLE.x; this.aimY = 400;
    this.fish = []; this.jellies = []; this.sharks = []; this.crabs = []; this.junk = []; this.cans = [];
    this.parts = []; this.pops = [];
    this.king = null; this.bossTimer = 0; this.kingDue = false;
    this.shake = 0; this.flash = null; this.happy = 0;
    this.hintT = 0; this.crabHints = 2;
    const H0 = CFG.hazards;
    this.timers = { fish: 0.3, jelly: H0.jelly.firstAt, shark: H0.shark.firstAt, crab: H0.crab.firstAt, junk: H0.junk.firstAt, can: H0.can.firstAt };
    this.state = 'play';
  }
  pause() { if (this.state === 'play') this.state = 'paused'; }
  resume() { if (this.state === 'paused') { this.state = 'play'; this.last = performance.now(); } }
  quit() { this.state = 'idle'; }

  get diff() { return Math.min(1.6, this.t / CFG.difficulty.rampSeconds + this.level * CFG.difficulty.perBossLevel); }
  get speedK() { return 1 + CFG.difficulty.speedBoost * Math.min(1, this.diff); }

  // ---------------------------------------------------------------- loop
  loop(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.anim = (this.anim || 0) + dt;
    if (this.state === 'play' || this.state === 'dying') this.update(dt);
    else if (this.state === 'boss') this.updateBossIntro(dt);
    if (this.state !== 'idle') this.render();
    requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.t += dt;
    this.run.duration = this.t;
    const d = this.diff;
    const h = this.hook;
    h.inv = Math.max(0, h.inv - dt);
    h.rebait = Math.max(0, h.rebait - dt);
    this.happy = Math.max(0, this.happy - dt);
    this.shake = Math.max(0, this.shake - dt);
    this.hintT += dt;

    // --- keyboard aim (desktop)
    const kx = (this.keys.ArrowRight || this.keys.d ? 1 : 0) - (this.keys.ArrowLeft || this.keys.a ? 1 : 0);
    const ky = (this.keys.ArrowDown || this.keys.s ? 1 : 0) - (this.keys.ArrowUp || this.keys.w ? 1 : 0);
    if (kx || ky) { this.aimX += kx * 400 * dt / CFG.hook.xFollow; this.aimY += ky * 500 * dt; this.aimX = clamp(this.aimX, 0, W); this.aimY = clamp(this.aimY, 150, H); }

    // --- hook movement
    if (this.state === 'play') this.moveHook(dt);

    // --- spawns
    if (this.state === 'play') this.spawn(dt, d);

    // --- entities
    const sk = this.speedK;
    for (const f of this.fish) {
      f.x += f.vx * dt; f.ph += dt * f.fq;
      f.y = f.by + Math.sin(f.ph) * f.amp;
      if (f.esc > 0) f.esc -= dt;
    }
    this.fish = this.fish.filter((f) => f.x > -140 && f.x < W + 140);
    for (const j of this.jellies) { j.x += j.vx * dt; j.ph += dt * 2.2; j.y = j.by + Math.sin(j.ph) * CFG.hazards.jelly.bob; }
    this.jellies = this.jellies.filter((j) => j.x > -80 && j.x < W + 80);
    for (const s of this.sharks) {
      if (s.warn > 0) { s.warn -= dt; if (s.warn <= 0) sfx.play('shark'); continue; }
      s.x += s.vx * dt;
    }
    this.sharks = this.sharks.filter((s) => s.warn > 0 || (s.x > -200 && s.x < W + 200));
    for (const c of this.crabs) {
      if (c.flung) { c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 600 * dt; c.rot += dt * 9; c.a -= dt * 1.2; continue; }
      c.x += c.vx * dt;
    }
    this.crabs = this.crabs.filter((c) => (c.flung ? c.a > 0 : c.x > -80 && c.x < W + 80));
    for (const k of this.junk) { k.y += k.vy * dt; k.x += Math.sin(this.t * 1.3 + k.ph) * CFG.hazards.junk.drift * dt; k.rot += k.vr * dt; }
    this.junk = this.junk.filter((k) => k.y < H - 60);
    for (const c of this.cans) { c.x += c.vx * dt; c.y = c.by + Math.sin(this.t * 2 + c.ph) * 8; }
    this.cans = this.cans.filter((c) => c.x > -80 && c.x < W + 80);
    if (this.king) this.updateKing(dt);

    if (this.state === 'play') this.collide();

    // --- fx
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const p of this.pops) { p.life -= dt; p.y -= 28 * dt; }
    this.pops = this.pops.filter((p) => p.life > 0);
    for (const b of this.bubbles) { b.y -= b.v * dt; if (b.y < 250) { b.y = rnd(860, 900); b.x = rnd(10, 380); } }
    if (this.flash) { this.flash.a -= dt * 2.5; if (this.flash.a <= 0) this.flash = null; }

    if (this.state === 'dying') {
      this.dieT -= dt;
      if (this.dieT <= 0) { this.state = 'over'; this.hooks.onGameOver(this.run); }
    }
    if (this.kingDue && this.state === 'play' && !this.hook.carry) { this.kingDue = false; this.startBossIntro(); }
  }

  moveHook(dt) {
    const h = this.hook, C = CFG.hook, carry = h.carry;
    const tx = clamp(HOLE.x + clamp((this.aimX - HOLE.x) * C.xFollow, -C.reach, C.reach), 22, W - 18);
    const minY = carry ? CFG.world.waterline - 40 : CFG.world.waterTop;
    const ty = clamp(this.aimY, minY, CFG.world.waterBottom);
    let dx = (tx - h.x) * Math.min(1, C.lerp * dt), dy = (ty - h.y) * Math.min(1, C.lerp * dt);
    const maxStep = (carry ? carry.pull : C.freeSpeed) * dt;
    const m = Math.hypot(dx, dy);
    if (m > maxStep) { dx *= maxStep / m; dy *= maxStep / m; }
    h.x += dx; h.y += dy;
    if (carry) {
      // the fish fights back: drags the hook down and sideways
      h.wig += dt * (carry.type === 'king' ? 9 : 12);
      h.y += carry.struggle * dt * (0.6 + 0.4 * Math.sin(h.wig * 0.7));
      h.x += Math.sin(h.wig) * carry.struggle * 0.35 * dt;
      h.x = clamp(h.x, 22, W - 18);
      h.y = Math.min(h.y, CFG.world.waterBottom);
      if (h.y < CFG.world.waterline) this.land();
    }
  }

  // ---------------------------------------------------------------- spawning
  spawn(dt, d) {
    const T = this.timers, HZ = CFG.hazards, sk = this.speedK;
    const dd = Math.min(1, d);
    const fishCap = Math.round(ramp(CFG.fish.maxOnScreen, dd)) - (this.king ? 2 : 0);
    if ((T.fish -= dt) <= 0) {
      T.fish = ramp(CFG.fish.spawnEvery, dd) * rnd(0.7, 1.3);
      if (this.fish.length < fishCap) this.spawnFish();
    }
    if (this.t >= HZ.jelly.firstAt && (T.jelly -= dt) <= 0) {
      T.jelly = ramp(HZ.jelly.every, dd) * rnd(0.8, 1.2);
      if (this.jellies.length < Math.round(ramp(HZ.jelly.max, dd))) {
        const left = Math.random() < 0.5;
        this.jellies.push({ x: left ? -40 : W + 40, by: rnd(330, 680), y: 0, vx: (left ? 1 : -1) * rnd(...HZ.jelly.speed) * sk, ph: rnd(0, 6) });
      }
    }
    if (this.t >= HZ.shark.firstAt && (T.shark -= dt) <= 0) {
      T.shark = ramp(HZ.shark.every, dd) * rnd(0.8, 1.2);
      const left = Math.random() < 0.5;
      // aim the shark roughly at the hook's depth when it's deep enough
      const y = clamp(this.hook.y + rnd(-90, 90), HZ.shark.minDepth, HZ.shark.maxDepth);
      this.sharks.push({ x: left ? -110 : W + 110, y, vx: (left ? 1 : -1) * ramp(HZ.shark.speed, dd), warn: HZ.shark.warn });
      sfx.play('warn');
    }
    if (this.t >= HZ.crab.firstAt && (T.crab -= dt) <= 0) {
      T.crab = ramp(HZ.crab.every, dd) * rnd(0.8, 1.2);
      if (!this.crabs.some((c) => !c.flung)) {
        const left = Math.random() < 0.6; // the hole is on the right, so most crabs come from the left
        this.crabs.push({ x: left ? -40 : W + 40, y: CFG.world.crabY, vx: (left ? 1 : -1) * rnd(...HZ.crab.speed) * sk, rot: 0, a: 1, hint: this.crabHints-- > 0 });
      }
    }
    if (this.t >= HZ.junk.firstAt && (T.junk -= dt) <= 0) {
      T.junk = ramp(HZ.junk.every, dd) * rnd(0.8, 1.2);
      this.junk.push({ kind: Math.random() < 0.5 ? 'boot' : 'tire', x: rnd(HOLE.x - 120, W - 30), y: 236, vy: rnd(...HZ.junk.fall) * sk, ph: rnd(0, 6), rot: rnd(-0.4, 0.4), vr: rnd(-1, 1) });
    }
    if (this.t >= HZ.can.firstAt && (T.can -= dt) <= 0) {
      T.can = ramp(HZ.can.every, dd) * rnd(0.8, 1.2);
      if (this.worms < CFG.worms.max || Math.random() < 0.35) {
        const left = Math.random() < 0.5;
        this.cans.push({ x: left ? -40 : W + 40, by: rnd(320, 700), y: 0, vx: (left ? 1 : -1) * HZ.can.speed, ph: rnd(0, 6) });
      }
    }
  }

  spawnFish() {
    const T = CFG.fish.types;
    const wL = T.legendary.weight + this.level * CFG.fish.legendaryWeightPerLevel;
    const total = T.common.weight + T.rare.weight + wL;
    let r = Math.random() * total;
    const type = (r -= T.common.weight) < 0 ? 'common' : (r -= T.rare.weight) < 0 ? 'rare' : 'legendary';
    const def = T[type];
    const left = Math.random() < 0.5;
    const w = rnd(...def.size);
    this.fish.push({
      type, pal: pick(def.palettes), w,
      x: left ? -w : W + w, by: rnd(CFG.fish.minDepth, CFG.fish.maxDepth), y: 0,
      vx: (left ? 1 : -1) * rnd(...def.speed) * this.speedK,
      ph: rnd(0, 6), fq: rnd(1.5, 3), amp: rnd(...CFG.fish.wobble), esc: 0,
    });
  }

  // ---------------------------------------------------------------- boss
  startBossIntro() {
    this.state = 'boss';
    this.bossTimer = CFG.boss.introSeconds;
    this.sharks = []; this.junk = [];
    sfx.play('boss');
    this.hooks.onBossIntro(this.run.score, CFG.boss.bonus);
  }
  updateBossIntro(dt) {
    this.bossTimer -= dt;
    if (this.bossTimer <= 0) {
      this.hooks.onBossIntroEnd();
      const left = Math.random() < 0.5;
      const B = CFG.boss;
      this.king = { x: left ? -150 : W + 150, y: B.depth, vx: (left ? 1 : -1) * (B.speed + this.level * B.speedPerLevel), passes: 0, ph: 0 };
      this.state = 'play';
      this.last = performance.now();
    }
  }
  updateKing(dt) {
    const k = this.king, B = CFG.boss;
    k.x += k.vx * dt; k.ph += dt * 1.2;
    k.y = B.depth + Math.sin(k.ph) * B.swing;
    if ((k.vx > 0 && k.x > W + 140) || (k.vx < 0 && k.x < -140)) {
      k.passes++;
      if (k.passes >= B.passes) {
        this.king = null; this.level++;
        this.pop('HE GOT AWAY!', W / 2, 420, '#FFFFFF', 34, 1.6);
        return;
      }
      k.vx = -k.vx;
    }
  }

  // ---------------------------------------------------------------- collisions
  hookC() { return { x: this.hook.x + 6, y: this.hook.y + 18 }; }
  carryC() {
    const h = this.hook, c = h.carry; if (!c) return null;
    const s = c.w / 120;
    return { x: h.x + 6, y: h.y + 18 + 42 * s, r: c.w * 0.3 };
  }

  collide() {
    const h = this.hook, hc = this.hookC(), cc = this.carryC();
    const baited = this.worms > 0 && h.rebait <= 0 && !h.carry;

    // catch fish
    if (baited) {
      for (let i = 0; i < this.fish.length; i++) {
        const f = this.fish[i];
        if (f.esc > 0) continue;
        if (dist(hc.x, hc.y, f.x, f.y) < f.w * 0.36 + CFG.hook.hitRadius * 0.5) {
          const def = CFG.fish.types[f.type];
          h.carry = { type: f.type, pal: f.pal, w: f.w, pull: def.pull, struggle: def.struggle };
          this.fish.splice(i, 1);
          sfx.play('hook');
          haptic('light');
          break;
        }
      }
      if (this.king && !h.carry) {
        const k = this.king;
        const dx = (hc.x - k.x) / 100, dy = (hc.y - k.y) / 52;
        if (dx * dx + dy * dy < 1) {
          const B = CFG.boss;
          h.carry = { type: 'king', pal: 'king', w: B.size, pull: B.pull, struggle: B.struggle, passes: k.passes };
          this.king = null;
          sfx.play('hook');
          haptic('heavy');
        }
      }
    }

    // can of worms (+1)
    for (let i = 0; i < this.cans.length; i++) {
      const c = this.cans[i];
      if (dist(hc.x, hc.y, c.x, c.y) < CFG.hazards.can.radius || (cc && dist(cc.x, cc.y, c.x, c.y) < cc.r + 20)) {
        this.cans.splice(i, 1);
        this.run.cans++;
        if (this.worms < CFG.worms.max) { this.worms++; this.pop('+1 WORM', c.x, c.y - 30, '#B6FF2E', 28); }
        else { this.addScore(CFG.worms.fullCanBonus); this.pop('+' + CFG.worms.fullCanBonus, c.x, c.y - 30, '#B6FF2E', 28); }
        this.burst(c.x, c.y, 10, ['#B6FF2E', '#FF6FB5', '#FFE14D']);
        sfx.play('worm');
        break;
      }
    }

    if (h.inv > 0) return;

    // jellyfish: zap anywhere along the line
    for (const j of this.jellies) {
      const R = CFG.hazards.jelly.radius;
      const onLine = segDist(j.x, j.y, HOLE.x, HOLE.y + 20, hc.x, hc.y) < R;
      const onFish = cc && dist(j.x, j.y, cc.x, cc.y) < R + cc.r;
      if (onLine || onFish) { this.loseWorm('ZAP!', '#FFE14D', 'zap'); return; }
    }
    // sharks: eat the fish and the worm
    for (const s of this.sharks) {
      if (s.warn > 0) continue;
      const mouthX = s.x + (s.vx > 0 ? 50 : -50);
      const R = CFG.hazards.shark.radius;
      const hitHook = dist(mouthX, s.y, hc.x, hc.y) < R || dist(s.x, s.y, hc.x, hc.y) < R;
      const hitFish = cc && (dist(mouthX, s.y, cc.x, cc.y) < R + cc.r || dist(s.x, s.y, cc.x, cc.y) < R + cc.r * 0.6);
      if (hitHook || hitFish) {
        const stole = h.carry && h.carry.type !== 'king';
        if (stole) this.hooks.onEvent && this.hooks.onEvent('sharkSteal');
        this.loseWorm(stole ? 'CHOMP!' : 'BITE!', '#FF5A3D', 'chomp', stole);
        return;
      }
    }
    // crabs: cut the line under the ice
    for (const c of this.crabs) {
      if (c.flung) continue;
      const lineX = h.y > c.y ? HOLE.x + (hc.x - HOLE.x) * ((c.y - HOLE.y) / (hc.y - HOLE.y)) : hc.x;
      if (Math.abs(c.x - lineX) < CFG.hazards.crab.cutWidth) {
        this.loseWorm('SNIP!', '#FF5A3D', 'snip');
        this.hook.x = HOLE.x; this.hook.y = CFG.world.waterTop;
        return;
      }
    }
    // boots & tires: knock the fish off (no worm lost)
    if (cc && h.carry.type !== 'king') {
      for (const k of this.junk) {
        if (dist(k.x, k.y, cc.x, cc.y) < CFG.hazards.junk.radius + cc.r) {
          this.releaseFish(cc);
          this.pop('BONK!', cc.x, cc.y - 30, '#FF7A1A', 32);
          sfx.play('bonk');
          this.shake = 0.2;
          return;
        }
      }
    }
  }

  tapCrab(p) {
    for (const c of this.crabs) {
      if (c.flung) continue;
      if (dist(p.x, p.y, c.x, c.y) < CFG.hazards.crab.tapRadius) {
        c.flung = true; c.vx = (c.x < HOLE.x ? -1 : 1) * 160; c.vy = -60;
        this.run.shooed++;
        this.addScore(CFG.hazards.crab.shooPoints);
        this.pop('SHOO! +' + CFG.hazards.crab.shooPoints, c.x, c.y + 50, '#FFFFFF', 24);
        sfx.play('shoo');
        this.checkDaily();
        return true;
      }
    }
    return false;
  }

  releaseFish(cc) {
    const c = this.hook.carry; if (!c) return;
    this.hook.carry = null;
    if (c.type === 'king') {
      const B = CFG.boss;
      this.king = { x: cc.x, y: cc.y, vx: (Math.random() < 0.5 ? -1 : 1) * (B.speed + 60), passes: Math.max(c.passes || 0, B.passes - 1), ph: Math.asin(clamp((cc.y - B.depth) / B.swing, -1, 1)) };
      return;
    }
    this.fish.push({ type: c.type, pal: c.pal, w: c.w, x: cc.x, by: cc.y, y: cc.y, vx: (Math.random() < 0.5 ? -1 : 1) * 260, ph: 0, fq: 3, amp: 4, esc: 1.5 });
  }

  loseWorm(text, color, sound, eaten = false) {
    const h = this.hook, cc = this.carryC();
    if (h.carry && !eaten) this.releaseFish(cc);
    if (h.carry && eaten) h.carry = null;
    this.worms--;
    this.streak = 0; this.combo = 1;
    h.inv = CFG.hook.invulnTime; h.rebait = CFG.hook.rebaitTime;
    this.shake = CFG.juice.shakeOnHit;
    this.flash = { color: color === '#FFE14D' ? '255,225,77' : '255,90,61', a: 0.45 };
    const hc = this.hookC();
    this.pop(text, clamp(hc.x, 70, W - 70), hc.y - 34, color, 40);
    sfx.play(sound);
    haptic('error');
    if (this.worms <= 0) { this.state = 'dying'; this.dieT = 1.1; this.hooks.onEvent && this.hooks.onEvent('gameOver'); }
  }

  land() {
    const h = this.hook, c = h.carry;
    h.carry = null;
    this.happy = 0.8;
    let base, label = null, color = '#FFE14D';
    if (c.type === 'king') { base = CFG.boss.bonus; label = 'RAINBOW KING!'; }
    else { base = CFG.fish.types[c.type].base; if (c.type === 'rare') { label = 'SHINY!'; color = '#00E5FF'; } if (c.type === 'legendary') { label = 'LEGENDARY!'; color = '#B98CFF'; } }
    const pts = base * this.combo * this.mult;
    this.addScore(pts);
    this.run.catches.push({ t: +this.t.toFixed(2), type: c.type, combo: this.combo, mult: this.mult, pts });
    this.run.counts[c.type]++;
    this.streak++;
    this.combo = Math.min(CFG.combo.max, 1 + this.streak);
    this.run.maxCombo = Math.max(this.run.maxCombo, this.combo);
    this.pop('+' + pts.toLocaleString('en-US'), HOLE.x - 6, 150, '#FFE14D', 44);
    if (label) this.pop(label, 92, 140, color, 30, 1.4);
    if (this.combo >= 3) this.pop('x' + this.combo + ' COMBO', 120, 178, '#FF6FB5', 22);
    const big = c.type === 'king';
    this.burst(HOLE.x, HOLE.y, big ? 36 : 14);
    if (big) { this.flash = { color: '255,255,255', a: 0.8 }; this.shake = 0.5; }
    sfx.play(big ? 'king' : c.type === 'common' ? 'catch' : 'rare');
    haptic(big ? 'success' : 'medium');

    if (c.type === 'king') {
      this.level++;
      this.hooks.onEvent && this.hooks.onEvent('bossCatch');
    } else {
      this.run.fish++;
      if (c.type === 'legendary') this.hooks.onEvent && this.hooks.onEvent('bigCatch');
      if (this.run.fish % CFG.boss.everyFish === 0) this.kingDue = true;
    }
    this.checkDaily();
    this.aimY = Math.max(this.aimY, 360);
  }

  addScore(p) {
    this.run.score += p;
    if (this.target != null && !this.targetBeaten && this.run.score > this.target) {
      this.targetBeaten = true;
      this.pop('YOU BEAT ' + (this.targetName || 'YOUR FRIEND').toUpperCase().slice(0, 12) + '!', W / 2, 360, '#B6FF2E', 30, 2);
      sfx.play('rare');
      this.hooks.onEvent && this.hooks.onEvent('beatFriend');
    }
  }
  checkDaily() {
    const d = this.daily;
    if (!d || !d.test || this.run.dailyDone) return;
    if (d.test(this.run)) {
      this.run.dailyDone = true;
      this.mult = CFG.daily.multiplier;
      this.pop('DAILY DONE! x' + this.mult, W / 2, 300, '#B6FF2E', 34, 1.8);
      sfx.play('worm');
    }
  }
  pop(text, x, y, color, size, life = CFG.juice.popupLife) { this.pops.push({ text, x, y, color, size, life, max: life }); }
  burst(x, y, n, cols = ['#FF2E93', '#00E5FF', '#B6FF2E', '#FFE14D', '#FF7A1A']) {
    for (let i = 0; i < n; i++) {
      const a = Math.PI + Math.random() * Math.PI, sp = rnd(140, 340);
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, s: rnd(8, 16), c: pick(cols), round: Math.random() < 0.5, life: rnd(0.7, 1.1) });
    }
  }

  // ---------------------------------------------------------------- render
  render() {
    const c = this.ctx, t = this.anim;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = '#2B0A73'; c.fillRect(0, 0, W, H);
    c.save();
    if (this.shake > 0) { const m = this.shake * 16; c.translate(rnd(-m, m), rnd(-m, m)); }
    c.drawImage(this.bgBack, 0, 0, W, H);
    const reeling = this.hook && this.hook.carry;
    drawSpr(c, reeling || this.happy > 0 ? SP.otterHappy : SP.otter, 0, 0, 140, 52, 150 / 140);
    c.drawImage(this.bgIce, 0, 0, W, H);

    // light rays
    [[60, 60, 520, 4, 0], [190, 34, 440, 3.2, .8], [340, 44, 480, 5, 1.4]].forEach(([x, w, hh, dur, del]) => {
      const a = 0.3 + 0.12 * Math.sin((t + del) * Math.PI * 2 / dur);
      const sk = Math.tan(14 * Math.PI / 180) * hh / 2;
      const g = c.createLinearGradient(0, 236, 0, 236 + hh);
      g.addColorStop(0, `rgba(255,255,255,${a * 1.6})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.beginPath();
      c.moveTo(x + sk, 236); c.lineTo(x + w + sk, 236); c.lineTo(x + w - sk, 236 + hh); c.lineTo(x - sk, 236 + hh); c.fill();
    });
    this.drawWeeds(this.weedBack, 34, false);
    for (const b of this.bubbles) {
      c.beginPath(); c.arc(b.x, b.y, b.s / 2, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255,255,255,.18)'; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,.85)'; c.stroke();
    }

    if (this.state !== 'idle' && this.run) {
      // crabs (upside-down under the ice)
      for (const k of this.crabs) {
        const wob = k.flung ? k.rot : Math.sin(t * 10) * 0.08;
        drawSpr(c, SP.crab, 50, 36, k.x, k.y, 0.74, wob, 1, k.flung ? 1 : -1, k.a);
        if (k.hint && !k.flung) {
          const bob = Math.sin(t * 8) * 3;
          c.fillStyle = '#FFFFFF'; c.strokeStyle = INK; c.lineWidth = 4;
          rr(c, k.x - 30, k.y + 34 + bob, 60, 30, 15); c.fill(); c.stroke();
          c.font = "18px 'Lilita One'"; c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('TAP!', k.x, k.y + 50 + bob);
        }
      }
      for (const j of this.jellies) {
        drawSpr(c, SP.jelly, 40, 50, j.x, j.y, 0.82);
        if (Math.floor(t * 5) % 2) {
          c.strokeStyle = '#FFE14D'; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
          c.beginPath(); c.moveTo(j.x - 36, j.y - 18); c.lineTo(j.x - 44, j.y - 10); c.lineTo(j.x - 38, j.y - 8); c.lineTo(j.x - 46, j.y + 2); c.stroke();
          c.beginPath(); c.moveTo(j.x + 36, j.y - 22); c.lineTo(j.x + 44, j.y - 14); c.lineTo(j.x + 38, j.y - 12); c.lineTo(j.x + 46, j.y - 2); c.stroke();
        }
      }
      for (const k of this.junk) drawSpr(c, k.kind === 'boot' ? SP.boot : SP.tire, 42, 40, k.x, k.y, 0.7, k.rot);
      for (const k of this.cans) {
        const ring = (t % 1.4) / 1.4;
        c.beginPath(); c.arc(k.x, k.y, 36 + ring * 24, 0, Math.PI * 2);
        c.strokeStyle = `rgba(182,255,46,${0.9 * (1 - ring)})`; c.lineWidth = 4; c.stroke();
        drawSpr(c, SP.can, 40, 48, k.x, k.y, 0.8);
      }
      for (const f of this.fish) this.drawFish(f);
      if (this.king) this.drawKing(this.king.x, this.king.y, this.king.vx < 0 ? -1 : 1, 0);
      for (const s of this.sharks) {
        if (s.warn > 0) {
          const ex = s.vx > 0 ? 26 : W - 26;
          const pulse = 1 + Math.sin(t * 20) * 0.12;
          c.save(); c.translate(ex, s.y); c.scale(pulse, pulse);
          c.beginPath(); c.arc(0, 0, 20, 0, Math.PI * 2); c.fillStyle = '#FF5A3D'; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
          c.restore();
          outlined(c, '!', ex, s.y, 26, '#FFFFFF');
          continue;
        }
        drawSpr(c, SP.shark, 100, 50, s.x, s.y, 0.88, 0, s.vx > 0 ? -1 : 1);
      }
      this.drawLineAndHook();
      for (const p of this.parts) {
        c.globalAlpha = Math.min(1, p.life * 2);
        c.fillStyle = p.c; c.strokeStyle = INK; c.lineWidth = 3;
        if (p.round) { c.beginPath(); c.arc(p.x, p.y, p.s / 2, 0, Math.PI * 2); c.fill(); c.stroke(); }
        else { rr(c, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s, 3); c.fill(); c.stroke(); }
      }
      c.globalAlpha = 1;
    }
    this.drawWeeds(this.weedFront, 40, true);

    if (this.run) {
      for (const p of this.pops) {
        const k = 1 - p.life / p.max;
        const sc = k < 0.15 ? 0.4 + k / 0.15 * 0.85 : k < 0.3 ? 1.25 - (k - 0.15) / 0.15 * 0.25 : 1;
        c.save(); c.globalAlpha = Math.min(1, p.life / (p.max * 0.35));
        c.translate(p.x, p.y); c.scale(sc, sc);
        outlined(c, p.text, 0, 0, p.size, p.color);
        c.restore();
      }
    }
    if (this.flash) { c.fillStyle = `rgba(${this.flash.color},${Math.max(0, this.flash.a)})`; c.fillRect(-20, -20, W + 40, H + 40); }
    c.restore();
    if (this.run) this.drawHUD();
  }

  drawFish(f) {
    const c = this.ctx, s = f.w / 120;
    const spr = SP['fish_' + f.pal];
    if (f.type === 'legendary') {
      c.save();
      const k = (Math.sin(this.anim * 4) + 1) / 2;
      c.shadowColor = k > 0.5 ? '#FF2E93' : '#FFE14D'; c.shadowBlur = 10 + k * 14;
      drawSpr(c, spr, 62, 40, f.x, f.y, s, 0, f.vx < 0 ? -1 : 1);
      c.restore();
    } else drawSpr(c, spr, 62, 40, f.x, f.y, s, 0, f.vx < 0 ? -1 : 1, 1, f.esc > 0 ? 0.6 + 0.4 * Math.sin(this.anim * 30) : 1);
    if (f.type !== 'common') this.sparkles(f.x, f.y, f.w);
  }
  sparkles(x, y, w) {
    const c = this.ctx, t = this.anim;
    [[w * 0.42, -w * 0.32, 9, 0], [-w * 0.38, w * 0.26, 6, 0.5]].forEach(([dx, dy, r, ph]) => {
      const k = 0.6 + 0.55 * (Math.sin((t + ph) * Math.PI * 2 / 1.2) + 1) / 2;
      star(c, x + dx, y + dy, r * k); c.fillStyle = '#FFFFFF'; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    });
  }
  drawKing(x, y, dir, rot) {
    const c = this.ctx, k = (Math.sin(this.anim * 4.4) + 1) / 2;
    c.save();
    c.shadowColor = ['#FFE14D', '#00E5FF', '#FF2E93', '#8B2CFF'][Math.floor(this.anim * 3) % 4]; c.shadowBlur = 18 + k * 18;
    drawSpr(c, SP.king, 120, 84, x, y, CFG.boss.size / 240, rot, dir);
    c.restore();
    this.sparkles(x, y, 200);
  }

  drawLineAndHook() {
    const c = this.ctx, h = this.hook, R = CFG.world.rodTip;
    c.strokeStyle = '#FFFFFF'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(R.x, R.y); c.lineTo(HOLE.x, HOLE.y); c.lineTo(h.x + 9, h.y + 1); c.stroke();
    const blink = h.inv > 0 && Math.floor(this.anim * 12) % 2;
    if (h.carry) {
      const s = h.carry.w / 120, wig = Math.sin(this.anim * 22) * 0.17;
      const cx = h.x + 6, cy = h.y + 18 + 42 * s;
      if (h.carry.type === 'king') this.drawKing(cx, cy, 1, -Math.PI / 2 + wig);
      else {
        drawSpr(this.ctx, SP['fishH_' + h.carry.pal], 62, 40, cx, cy, s, -Math.PI / 2 + wig);
        if (h.carry.type !== 'common') this.sparkles(cx, cy, h.carry.w * 0.8);
      }
      drawSpr(c, SP.hook, 14, 0, h.x + 9, h.y, 0.65);
      // "pull up!" arrow above the hole
      const a = (Math.sin(this.anim * 8) + 1) / 2;
      c.globalAlpha = 0.6 + a * 0.4;
      c.fillStyle = '#B6FF2E'; c.strokeStyle = INK; c.lineWidth = 4; c.lineJoin = 'round';
      c.beginPath(); const ax = HOLE.x - 60, ay = 270 - a * 6;
      c.moveTo(ax, ay - 16); c.lineTo(ax + 14, ay); c.lineTo(ax + 6, ay); c.lineTo(ax + 6, ay + 14); c.lineTo(ax - 6, ay + 14); c.lineTo(ax - 6, ay); c.lineTo(ax - 14, ay); c.closePath();
      c.fill(); c.stroke(); c.globalAlpha = 1;
    } else if (!blink) {
      const baited = this.worms > 0 && h.rebait <= 0;
      drawSpr(c, baited ? SP.bait : SP.hook, 14, 0, h.x + 9, h.y, 0.65, Math.sin(this.anim * 3) * 0.08);
    }
  }

  drawWeeds(list, width, front) {
    const c = this.ctx, base = H - 60;
    for (const w of list) {
      const ang = Math.sin((this.anim + w.d) * Math.PI * 2 / w.dur) * 7 * Math.PI / 180;
      c.save(); c.translate(w.x + width / 2, base); c.rotate(ang);
      c.beginPath();
      c.moveTo(0, 0);
      const P = WEED.map(([x, y]) => [(x - 20) * width / 40, (y - 200) * w.h / 200]);
      c.quadraticCurveTo(P[1][0], P[1][1], P[2][0], P[2][1]);
      c.quadraticCurveTo(P[3][0], P[3][1], P[4][0], P[4][1]);
      c.quadraticCurveTo(P[5][0], P[5][1], P[6][0], P[6][1]);
      c.lineCap = 'round';
      if (front) { c.strokeStyle = INK; c.lineWidth = 18; c.stroke(); c.strokeStyle = w.c; c.lineWidth = 10; c.stroke(); }
      else { c.globalAlpha = 0.45; c.strokeStyle = '#12C9B0'; c.lineWidth = 12; c.stroke(); }
      c.restore();
    }
  }

  drawHUD() {
    const c = this.ctx, t = this.anim;
    const card = (x, y, w, h, r, fill = '#FFFFFF') => {
      c.fillStyle = INK; rr(c, x, y + 5, w, h, r); c.fill();
      c.fillStyle = fill; rr(c, x, y, w, h, r); c.fill();
      c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
    };
    // score
    const sTxt = this.run.score.toLocaleString('en-US');
    c.font = "36px 'Lilita One'";
    const sw = Math.max(96, c.measureText(sTxt).width + 36);
    card(12, 14, sw, 66, 22);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.font = "700 12px 'Fredoka'"; c.fillStyle = '#B3006A'; c.fillText('S C O R E', 30, 36);
    c.font = "36px 'Lilita One'"; c.fillStyle = INK; c.fillText(sTxt, 30, 70);
    if (this.mult > 1) {
      c.fillStyle = '#B6FF2E'; rr(c, 12 + sw - 30, 6, 40, 24, 12); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
      c.font = "15px 'Lilita One'"; c.fillStyle = INK; c.textAlign = 'center'; c.fillText('x' + this.mult, 12 + sw - 10, 24);
    }
    // challenge target chip
    if (this.target != null) {
      const beaten = this.targetBeaten;
      const label = beaten ? 'BEATEN!' : 'BEAT ' + this.target.toLocaleString('en-US');
      c.font = "16px 'Lilita One'";
      const tw = c.measureText(label).width + 26;
      c.fillStyle = INK; rr(c, 14, 90, tw, 28, 14); c.fill();
      c.fillStyle = beaten ? '#B6FF2E' : '#FF2E93'; rr(c, 14, 87, tw, 28, 14); c.fill();
      c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
      c.fillStyle = beaten ? INK : '#FFFFFF'; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(label, 27, 102);
    }
    // worms
    const n = CFG.worms.max, ww = n * 36 + 18;
    card(W - 12 - ww, 14, ww, 50, 25);
    for (let i = 0; i < n; i++) drawSpr(c, i < this.worms ? SP.wormOn : SP.wormOff, 0, 0, W - 12 - ww + 10 + i * 36, 22, 34 / 40, 0, 1, 1, i < this.worms ? 1 : 0.5);
    // combo meter
    const pulse = 1 + 0.06 * Math.sin(t * Math.PI * 2 / 0.7);
    c.save(); c.translate(30, 282); c.scale(pulse, pulse); outlined(c, 'x' + this.combo, 0, 0, 30, '#FFE14D'); c.restore();
    c.save();
    if (this.combo >= 5) { const k = (Math.sin(t * 8) + 1) / 2; c.shadowColor = k > 0.5 ? '#FFE14D' : '#FF2E93'; c.shadowBlur = 14 + k * 16; }
    c.fillStyle = INK; rr(c, 9, 299, 36, 340, 18); c.fill();
    c.restore();
    c.fillStyle = 'rgba(70,40,140,.9)'; rr(c, 14, 304, 26, 330, 13); c.fill();
    const fh = 330 * this.combo / CFG.combo.max;
    const g = c.createLinearGradient(0, 634, 0, 304);
    g.addColorStop(0, '#FF2E93'); g.addColorStop(.5, '#FF7A1A'); g.addColorStop(1, '#FFE14D');
    c.fillStyle = g; rr(c, 14, 634 - fh, 26, fh, 13); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, 19, 312, 6, 300, 3); c.fill();
    c.font = "700 11px 'Fredoka'"; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('COMBO', 27, 654);
    // boss bar
    card(12, 770, 366, 60, 22);
    c.save(); c.translate(20, 783);
    c.beginPath(); [[3, 10], [12, 18], [20, 4], [28, 18], [37, 10], [33, 30], [7, 30]].forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
    c.fillStyle = '#FFE14D'; c.fill(); c.lineWidth = 3.5; c.lineJoin = 'round'; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.arc(20, 22, 3, 0, Math.PI * 2); c.fillStyle = '#FF2E93'; c.fill();
    c.restore();
    const every = CFG.boss.everyFish;
    const prog = this.king || (this.hook.carry && this.hook.carry.type === 'king') || this.kingDue ? every : this.run.fish % every;
    c.font = "700 12px 'Fredoka'"; c.fillStyle = INK; c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    const kingLive = this.king || (this.hook.carry && this.hook.carry.type === 'king');
    c.fillText(kingLive ? 'HOOK THE KING!' : 'RAINBOW KING', 72, 795);
    c.textAlign = 'right'; c.fillText(kingLive ? '+' + CFG.boss.bonus + ' x COMBO' : `${prog}/${every} FISH`, 364, 795);
    c.fillStyle = '#EDE6FF'; rr(c, 72, 801, 292, 16, 8); c.fill();
    if (prog > 0) {
      const bg = c.createLinearGradient(72, 0, 364, 0);
      ['#FF2E93', '#FF7A1A', '#FFE14D', '#B6FF2E', '#00E5FF', '#8B2CFF'].forEach((col, i) => bg.addColorStop(i / 5, col));
      c.save(); rr(c, 72, 801, 292, 16, 8); c.clip();
      c.fillStyle = bg; c.fillRect(72, 801, 292 * prog / every, 16); c.restore();
    }
    rr(c, 72, 801, 292, 16, 8); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();

    // first-run hint
    if (this.run.fish === 0 && this.hintT < 12) {
      const a = Math.min(1, (12 - this.hintT) / 1.5);
      c.globalAlpha = a;
      c.fillStyle = 'rgba(26,11,61,.75)'; rr(c, 60, 718, 270, 34, 17); c.fill();
      c.font = "700 14px 'Fredoka'"; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(this.hook.carry ? 'PULL IT UP THROUGH THE ICE!' : 'DRAG TO MOVE · TOUCH A FISH', W / 2, 735);
      c.globalAlpha = 1;
    }
  }
}
