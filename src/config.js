// ============================================================
//  HOOKED! — every tuning number lives here.
//  Units: pixels on a 390x844 stage, seconds, points.
// ============================================================
export const CFG = {
  stage: { w: 390, h: 844 },

  world: {
    hole: { x: 296, y: 208 },     // ice hole centre
    rodTip: { x: 296, y: 100 },
    waterline: 246,               // pull a hooked fish above this y to score
    waterTop: 262,                // free hook can't go above this
    waterBottom: 748,             // lowest hook / fish depth
    crabY: 266,                   // crabs crawl along the underside of the ice
  },

  hook: {
    reach: 104,                   // how far left/right of the hole the hook may swing
    xFollow: 0.55,                // 1 = hook x tracks the finger exactly, lower = "slightly" left/right
    touchOffsetY: 46,             // hook sits above the fingertip so you can see it
    freeSpeed: 1500,              // px/s max hook speed when empty
    lerp: 16,                     // follow smoothing (higher = snappier)
    hitRadius: 15,
    rebaitTime: 0.9,              // seconds unbaited after losing a worm
    invulnTime: 1.3,              // seconds of hazard immunity after losing a worm
  },

  worms: { start: 3, max: 3, fullCanBonus: 100 },

  combo: {
    max: 10,                      // multiplier cap (x10)
    // multiplier = 1 + catches in a row since last lost worm (capped)
  },

  fish: {
    // base = points before combo. pull = max reel speed while carrying (px/s).
    // struggle = how hard it drags the hook down (px/s). weight = spawn chance.
    types: {
      common:    { base: 10,  weight: 70, speed: [55, 95],   size: [58, 80], pull: 900, struggle: 60,  palettes: ['orange', 'cyan', 'yellow', 'pink'] },
      rare:      { base: 50,  weight: 22, speed: [80, 120],  size: [62, 76], pull: 760, struggle: 110, palettes: ['shiny'] },
      legendary: { base: 200, weight: 8,  speed: [125, 165], size: [84, 94], pull: 520, struggle: 190, palettes: ['legend'] },
    },
    legendaryWeightPerLevel: 2,   // legendary gets more common after each boss
    maxOnScreen: [4, 7],          // [start, fully ramped]
    spawnEvery: [1.25, 0.6],      // seconds
    minDepth: 290,
    maxDepth: 728,
    wobble: [4, 14],
  },

  boss: {
    everyFish: 30,                // Rainbow King appears after every 30 fish
    introSeconds: 2.8,
    bonus: 500,                   // base points (x combo)
    passes: 3,                    // swims across this many times before leaving
    speed: 85, speedPerLevel: 12,
    size: 220,
    pull: 330, struggle: 210,
    depth: 480, swing: 120,
  },

  hazards: {
    jelly:  { firstAt: 7,  every: [11, 5],  max: [1, 3], speed: [22, 42], bob: 14, radius: 27 },
    shark:  { firstAt: 18, every: [15, 6.5], speed: [230, 360], warn: 1.1, minDepth: 420, maxDepth: 720, radius: 34 },
    crab:   { firstAt: 14, every: [17, 8],  speed: [42, 72], shooPoints: 10, tapRadius: 46, cutWidth: 15 },
    junk:   { firstAt: 10, every: [11, 6],  fall: [40, 75], drift: 18, radius: 26 },   // boots + tires
    can:    { firstAt: 12, every: [22, 16], speed: 50, radius: 30 },
  },

  difficulty: {
    rampSeconds: 150,             // 0 → 1 over this many seconds…
    perBossLevel: 0.15,           // …plus this per boss encounter
    speedBoost: 0.6,              // fish / hazard speeds scale up to (1 + this) at full ramp
  },

  daily: { multiplier: 2 },       // daily challenge reward: x2 score for the rest of the run

  juice: { shakeOnHit: 0.4, popupLife: 1.2 },
};

// Value at difficulty t (0..1) between [a, b]
export const ramp = (pair, t) => pair[0] + (pair[1] - pair[0]) * Math.min(1, Math.max(0, t));
