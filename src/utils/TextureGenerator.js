import { COLORS, SIZES } from './constants.js';

export function generateTextures(scene) {
  // Hero ship — fly, bank-left, bank-right
  generateShip(scene, 'ship', 0);
  generateShip(scene, 'ship-left', -3);
  generateShip(scene, 'ship-right', 3);

  // Asteroid variants
  generateAsteroid(scene, 'asteroid-1', 0);
  generateAsteroid(scene, 'asteroid-2', 1);
  generateAsteroid(scene, 'asteroid-3', 2);

  // Boss — normal + bomb-drop
  generateBoss(scene, 'boss', false);
  generateBoss(scene, 'boss-drop', true);

  // Bomb (dropped by boss)
  generateBomb(scene);

  // Utility sprites
  generateBullet(scene);
  generateHeart(scene);
  generateStar(scene);
  generateParticle(scene);
}

// ─── Hero Ship ───────────────────────────────────────────────

function generateShip(scene, key, tilt) {
  const g = scene.make.graphics({ add: false });
  const { w, h } = SIZES.SHIP;
  const t = tilt;

  // Thruster positions shift with tilt
  const ltx = w * 0.35 + t * 0.5;
  const rtx = w * 0.65 + t * 0.5;

  // Outer flames
  g.fillStyle(0xff6622, 0.9);
  g.fillTriangle(ltx - 4, h * 0.80, ltx, h, ltx - 1, h * 0.72);
  g.fillTriangle(rtx + 1, h * 0.72, rtx, h, rtx + 4, h * 0.80);

  // Inner hot flames
  g.fillStyle(0xffcc44, 0.7);
  g.fillTriangle(ltx - 2, h * 0.82, ltx, h * 0.96, ltx, h * 0.74);
  g.fillTriangle(rtx, h * 0.74, rtx, h * 0.96, rtx + 2, h * 0.82);

  // Wings (swept back)
  const lwx = t < 0 ? w * 0.06 : w * 0.02;
  const rwx = t > 0 ? w * 0.94 : w * 0.98;

  g.fillStyle(0x3366cc);
  g.fillTriangle(lwx, h * 0.65, w * 0.38 + t * 0.5, h * 0.35, w * 0.38 + t * 0.5, h * 0.70);
  g.fillTriangle(rwx, h * 0.65, w * 0.62 + t * 0.5, h * 0.35, w * 0.62 + t * 0.5, h * 0.70);

  // Wing tips
  g.fillStyle(0x224488);
  g.fillTriangle(lwx, h * 0.65, lwx + 5, h * 0.60, lwx + 3, h * 0.68);
  g.fillTriangle(rwx, h * 0.65, rwx - 5, h * 0.60, rwx - 3, h * 0.68);

  // Main body
  g.fillStyle(COLORS.SHIP_BODY);
  g.fillTriangle(
    w / 2 + t, h * 0.02,
    w * 0.30 + t * 0.5, h * 0.72,
    w * 0.70 + t * 0.5, h * 0.72,
  );

  // Body highlight (left-facing bevel)
  g.fillStyle(COLORS.SHIP_HIGHLIGHT, 0.4);
  g.fillTriangle(
    w / 2 + t, h * 0.08,
    w * 0.34 + t * 0.5, h * 0.50,
    w / 2 + t, h * 0.50,
  );

  // Cockpit
  g.fillStyle(0x88ccff);
  g.fillCircle(w / 2 + t, h * 0.28, 4);
  g.fillStyle(0xddeeff, 0.7);
  g.fillCircle(w / 2 + t - 1, h * 0.26, 1.5);

  // Body stripe
  g.lineStyle(1, 0x6699dd, 0.4);
  g.lineBetween(w * 0.38 + t * 0.5, h * 0.55, w * 0.62 + t * 0.5, h * 0.55);

  g.generateTexture(key, w, h);
  g.destroy();
}

// ─── Asteroids ───────────────────────────────────────────────

function generateAsteroid(scene, key, variant) {
  const g = scene.make.graphics({ add: false });
  const s = SIZES.ASTEROID;
  const cx = s / 2;
  const cy = s / 2;
  const r = s / 2 - 2;

  // Each variant has a unique lumpy silhouette built from overlapping circles
  const lumpSets = [
    // 0: roundish
    [
      { dx: 0, dy: 0, r },
      { dx: -5, dy: -3, r: r * 0.70 },
      { dx: 5, dy: 2, r: r * 0.65 },
      { dx: -2, dy: 5, r: r * 0.60 },
      { dx: 3, dy: -5, r: r * 0.55 },
    ],
    // 1: angular / boxy
    [
      { dx: 0, dy: 0, r: r * 0.90 },
      { dx: -7, dy: -2, r: r * 0.60 },
      { dx: 7, dy: -2, r: r * 0.55 },
      { dx: -4, dy: 6, r: r * 0.65 },
      { dx: 5, dy: 5, r: r * 0.60 },
      { dx: 0, dy: -7, r: r * 0.50 },
    ],
    // 2: elongated
    [
      { dx: 0, dy: 0, r: r * 0.85 },
      { dx: -8, dy: 0, r: r * 0.60 },
      { dx: 8, dy: 0, r: r * 0.55 },
      { dx: -3, dy: -5, r: r * 0.55 },
      { dx: 4, dy: 5, r: r * 0.60 },
    ],
  ];

  const lumps = lumpSets[variant];

  // Drop shadow
  g.fillStyle(0x666666);
  for (const l of lumps) g.fillCircle(cx + l.dx + 1, cy + l.dy + 1, l.r);

  // Rocky body
  g.fillStyle(COLORS.ASTEROID);
  for (const l of lumps) g.fillCircle(cx + l.dx, cy + l.dy, l.r);

  // Top-left light
  g.fillStyle(0xaaaaaa, 0.25);
  g.fillCircle(cx - 4, cy - 4, r * 0.4);

  // Craters
  const craterSets = [
    [{ dx: -7, dy: -5, r: 5 }, { dx: 5, dy: 4, r: 4 }, { dx: -2, dy: 7, r: 3 }],
    [{ dx: 6, dy: -6, r: 4 }, { dx: -5, dy: 3, r: 5 }, { dx: 3, dy: 7, r: 3 }],
    [{ dx: -3, dy: -7, r: 4 }, { dx: 7, dy: 1, r: 3 }, { dx: -6, dy: 5, r: 5 }],
  ];
  g.fillStyle(COLORS.ASTEROID_CRATER);
  for (const c of craterSets[variant]) g.fillCircle(cx + c.dx, cy + c.dy, c.r);

  // Crater inner shadow
  g.fillStyle(0x444444, 0.5);
  for (const c of craterSets[variant]) g.fillCircle(cx + c.dx + 0.5, cy + c.dy + 0.5, c.r * 0.6);

  g.generateTexture(key, s, s);
  g.destroy();
}

// ─── Boss Ship ───────────────────────────────────────────────

function generateBoss(scene, key, isDropping) {
  const g = scene.make.graphics({ add: false });
  const { w, h } = SIZES.BOSS;

  // Engine glow
  g.fillStyle(0xff6633, 0.7);
  g.fillCircle(w * 0.30, h * 0.88, 6);
  g.fillCircle(w * 0.70, h * 0.88, 6);
  g.fillStyle(0xffaa44, 0.5);
  g.fillCircle(w * 0.30, h * 0.88, 3);
  g.fillCircle(w * 0.70, h * 0.88, 3);

  // Outer hull (darker red border)
  g.fillStyle(0xaa2222);
  g.fillTriangle(w / 2, h * 0.02, w * 0.05, h / 2, w / 2, h * 0.98);
  g.fillTriangle(w / 2, h * 0.02, w * 0.95, h / 2, w / 2, h * 0.98);

  // Inner hull
  g.fillStyle(COLORS.ENEMY_BODY);
  g.fillTriangle(w / 2, h * 0.10, w * 0.15, h / 2, w / 2, h * 0.90);
  g.fillTriangle(w / 2, h * 0.10, w * 0.85, h / 2, w / 2, h * 0.90);

  // Hull bevel
  g.fillStyle(0xff5555, 0.4);
  g.fillTriangle(w / 2, h * 0.15, w * 0.22, h * 0.45, w / 2, h * 0.75);

  // Wing accent lines
  g.lineStyle(3, 0xff6666);
  g.lineBetween(w * 0.08, h * 0.42, w * 0.32, h * 0.22);
  g.lineBetween(w * 0.68, h * 0.22, w * 0.92, h * 0.42);
  g.lineBetween(w * 0.08, h * 0.58, w * 0.32, h * 0.78);
  g.lineBetween(w * 0.68, h * 0.78, w * 0.92, h * 0.58);

  // Panel lines
  g.lineStyle(1, 0xcc4444, 0.4);
  g.lineBetween(w * 0.30, h * 0.30, w * 0.30, h * 0.70);
  g.lineBetween(w * 0.70, h * 0.30, w * 0.70, h * 0.70);

  // Cockpit
  g.fillStyle(COLORS.ENEMY_COCKPIT);
  g.fillCircle(w / 2, h / 2, 9);
  g.fillStyle(0xffee88, 0.5);
  g.fillCircle(w / 2 - 2, h / 2 - 2, 3);

  // Antenna
  g.lineStyle(2, 0xff8888);
  g.lineBetween(w / 2, h * 0.02, w / 2, h * 0.10);
  g.fillStyle(0xff4444);
  g.fillCircle(w / 2, h * 0.02, 2);

  // Bomb bay (only in drop mode)
  if (isDropping) {
    g.fillStyle(0xff8833, 0.8);
    g.fillRect(w * 0.35, h * 0.82, w * 0.30, h * 0.10);
    g.fillStyle(0xffcc44, 0.6);
    g.fillRect(w * 0.40, h * 0.84, w * 0.20, h * 0.06);
    g.fillStyle(0xffdd66, 0.3);
    g.fillCircle(w / 2, h * 0.90, 10);
  }

  g.generateTexture(key, w, h);
  g.destroy();
}

// ─── Bomb ────────────────────────────────────────────────────

function generateBomb(scene) {
  const g = scene.make.graphics({ add: false });
  const s = SIZES.ASTEROID; // same canvas size so physics body stays consistent
  const cx = s / 2;
  const cy = s / 2 + 2;
  const r = s * 0.35;

  // Fuse line
  g.lineStyle(2, 0x886644);
  g.lineBetween(cx, cy - r + 1, cx + 3, cy - r - 4);
  g.lineBetween(cx + 3, cy - r - 4, cx + 5, cy - r - 7);

  // Spark
  g.fillStyle(0xff8833);
  g.fillCircle(cx + 5, cy - r - 7, 3);
  g.fillStyle(0xffdd44, 0.8);
  g.fillCircle(cx + 5, cy - r - 8, 1.5);

  // Shadow
  g.fillStyle(0x1a1a1a);
  g.fillCircle(cx + 1, cy + 1, r);

  // Body
  g.fillStyle(0x333333);
  g.fillCircle(cx, cy, r);

  // Metallic sheen
  g.fillStyle(0x555555, 0.5);
  g.fillCircle(cx - 2, cy - 2, r * 0.65);
  g.fillStyle(0x333333, 0.8);
  g.fillCircle(cx - 1, cy - 1, r * 0.50);

  // Specular highlight
  g.fillStyle(0x999999, 0.5);
  g.fillCircle(cx - 4, cy - 4, 2);

  g.generateTexture('bomb', s, s);
  g.destroy();
}

// ─── Utility sprites ─────────────────────────────────────────

function generateBullet(scene) {
  const g = scene.make.graphics({ add: false });
  const s = SIZES.BULLET;
  const r = s / 2;

  g.fillStyle(COLORS.BULLET);
  g.fillCircle(r, r, r);
  g.fillStyle(COLORS.BULLET_CENTER);
  g.fillCircle(r, r, r * 0.4);

  g.generateTexture('bullet', s, s);
  g.destroy();
}

function generateHeart(scene) {
  const g = scene.make.graphics({ add: false });
  const { w, h } = SIZES.HEART;

  g.fillStyle(COLORS.HEART);
  g.fillCircle(w * 0.30, h * 0.35, w * 0.28);
  g.fillCircle(w * 0.70, h * 0.35, w * 0.28);
  g.fillTriangle(w * 0.03, h * 0.45, w * 0.97, h * 0.45, w / 2, h);

  g.generateTexture('heart', w, h);
  g.destroy();
}

function generateStar(scene) {
  const g = scene.make.graphics({ add: false });
  const s = SIZES.STAR;

  g.fillStyle(COLORS.STAR);
  g.fillCircle(s / 2, s / 2, s / 2);

  g.generateTexture('star', s, s);
  g.destroy();
}

function generateParticle(scene) {
  const g = scene.make.graphics({ add: false });

  g.fillStyle(0xffffff);
  g.fillCircle(4, 4, 4);

  g.generateTexture('particle', 8, 8);
  g.destroy();
}
