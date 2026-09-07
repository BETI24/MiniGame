import { GRID, MAX_RANK, WEAPONS, RARITY_WEIGHT, PURCHASE_TIERS, weaponStats, purchaseCost, tierPool, unlockedTypes } from "./MergeShootData.js";
import { stageClearRewards, unlocksForClear } from "./MergeShootProgression.js";
import { clamp, formationCellPosition, projectBlock, ROAD_HORIZON_Y } from "./MergeShootBattleMath.js";

let UID = 1;
const TAU = Math.PI * 2;

export function createWeapon(type = "blaster", rank = 0) {
  const st = weaponStats(type, rank);
  return {
    id: UID++, type, rank,
    hp: st.maxHp, maxHp: st.maxHp,
    cool: Math.random() * Math.min(st.rate, .35),
    recoil: 0, flash: 0, hitFlash: 0
  };
}

function initialGrid() {
  const g = Array(GRID * GRID).fill(null);
  g[17] = createWeapon("blaster", 0);
  g[21] = createWeapon("bubbles", 0);
  g[23] = createWeapon("rockets", 0);
  return g;
}

function hydrateWeapon(raw) {
  if (!raw || !WEAPONS[raw.type]) return null;
  return createWeapon(raw.type, Math.max(0, Math.min(MAX_RANK, raw.rank | 0)));
}

function restoredGrid(savedGrid) {
  if (!Array.isArray(savedGrid) || savedGrid.length !== GRID * GRID) return initialGrid();
  const g = savedGrid.map(hydrateWeapon);
  return g.some(Boolean) ? g : initialGrid();
}

export function createState(saved = {}) {
  return {
    mode: "build", panel: null,
    stage: Math.max(1, saved.stage || 1),
    level: Math.max(1, saved.level || 1), xp: Math.max(0, saved.xp || 0),
    gold: saved.gold ?? 4200, gems: saved.gems ?? 40, keys: saved.keys ?? 1,
    grid: restoredGrid(saved.grid), bag: Array.isArray(saved.bag) ? saved.bag.map(hydrateWeapon).filter(Boolean).slice(0, 40) : [],
    teamX: 0, teamY: 0, teamLean: 0,
    world: 0, worldSpeed: 126, targetDistance: 3800,
    blocks: [], shots: [], particles: [], rings: [], coins: [], floaters: [],
    earned: 0, shake: 0, flash: 0, battleFlash: 0,
    drag: null, hover: -1, purchases: Array.isArray(saved.purchases) ? [0,1,2].map(i => Math.max(0, saved.purchases[i] || 0)) : [0,0,0],
    lastResult: null, elapsed: 0, toast: ""
  };
}

export function connectedPlacement(grid, index, ignore = -1) {
  if (grid[index] && index !== ignore) return false;
  const occupied = grid.reduce((n, w, i) => n + (w && i !== ignore ? 1 : 0), 0);
  if (!occupied) return true;
  const r = Math.floor(index / GRID), c = index % GRID;
  return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].some(([y, x]) =>
    y >= 0 && y < GRID && x >= 0 && x < GRID && grid[y * GRID + x] && y * GRID + x !== ignore
  );
}

export function wholeFormationConnected(grid) {
  const first = grid.findIndex(Boolean);
  if (first < 0) return true;
  const seen = new Set([first]), q = [first];
  while (q.length) {
    const i = q.pop(), r = Math.floor(i / GRID), c = i % GRID;
    for (const [y, x] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
      if (y < 0 || y >= GRID || x < 0 || x >= GRID) continue;
      const j = y * GRID + x;
      if (grid[j] && !seen.has(j)) { seen.add(j); q.push(j); }
    }
  }
  return seen.size === grid.filter(Boolean).length;
}

export function moveWeapon(s, from, to) {
  if (from === to) return true;
  const a = s.grid[from], b = s.grid[to];
  if (!a) return false;
  if (b && a.type === b.type && a.rank === b.rank && a.rank < MAX_RANK) {
    const nw = createWeapon(a.type, a.rank + 1);
    s.grid[to] = nw; s.grid[from] = null;
    if (wholeFormationConnected(s.grid)) return true;
    s.grid[from] = a; s.grid[to] = b; return false;
  }
  if (b) return false;
  s.grid[from] = null; s.grid[to] = a;
  if (!wholeFormationConnected(s.grid)) { s.grid[from] = a; s.grid[to] = null; return false; }
  return true;
}

function weightedType(pool) {
  if (!pool.length) return "blaster";
  let total = 0;
  for (const type of pool) total += RARITY_WEIGHT[WEAPONS[type].rarity] || 1;
  let r = Math.random() * total;
  for (const type of pool) {
    r -= RARITY_WEIGHT[WEAPONS[type].rarity] || 1;
    if (r <= 0) return type;
  }
  return pool[pool.length - 1];
}

function firstPlacement(s, randomize = true) {
  const empties = s.grid.map((w, i) => !w && connectedPlacement(s.grid, i) ? i : -1).filter(i => i >= 0);
  if (!empties.length) return -1;
  return randomize ? empties[(Math.random() * empties.length) | 0] : empties[0];
}

export function addWeapon(s, type, rank = 0, randomize = true) {
  const weapon = createWeapon(type, rank);
  const spot = firstPlacement(s, randomize);
  if (spot >= 0) { s.grid[spot] = weapon; return { where: "grid", index: spot, weapon }; }
  if (s.bag.length < 40) { s.bag.push(weapon); return { where: "bag", index: s.bag.length - 1, weapon }; }
  return null;
}

export function buyWeapon(s, tier = 0) {
  tier = Math.max(0, Math.min(2, tier | 0));
  const cfg = PURCHASE_TIERS[tier];
  if (s.stage < cfg.minStage) { s.toast = `Unlocks at Stage ${cfg.minStage}`; return false; }
  const cost = purchaseCost(s.stage, tier, s.purchases[tier]);
  if (s.gold < cost) { s.toast = "Not enough gold"; return false; }
  const pool = tierPool(s.stage, tier);
  if (!pool.length) return false;
  const type = weightedType(pool);
  const result = addWeapon(s, type, cfg.rank);
  if (!result) { s.toast = "Grid and bag are full"; return false; }
  s.gold -= cost; s.purchases[tier]++;
  s.toast = `${WEAPONS[type].name} ${cfg.label}`;
  return true;
}

export function deployBagWeapon(s, bagIndex) {
  const w = s.bag[bagIndex]; if (!w) return false;
  const spot = firstPlacement(s, false); if (spot < 0) { s.toast = "No connected grid slot available"; return false; }
  s.grid[spot] = w; s.bag.splice(bagIndex, 1); s.toast = `${WEAPONS[w.type].name} deployed`; return true;
}

export function openChest(s, kind = "key") {
  let rank = 0, maxRarity = "Rare";
  if (kind === "key") {
    if (s.keys < 1) { s.toast = "You need a chest key"; return false; }
    s.keys--; rank = Math.random() < .28 ? 2 : Math.random() < .62 ? 1 : 0; maxRarity = rank >= 2 ? "Epic" : "Rare";
  } else {
    const cost = 120;
    if (s.gems < cost) { s.toast = "Not enough gems"; return false; }
    s.gems -= cost; rank = Math.random() < .38 ? 2 : 1; maxRarity = "Epic";
  }
  const rarityLimit = { Common:0, Uncommon:1, Rare:2, Epic:3 }[maxRarity];
  let pool = unlockedTypes(s.stage).filter(t => ({ Common:0, Uncommon:1, Rare:2, Epic:3 }[WEAPONS[t].rarity] <= rarityLimit));
  if (kind !== "key") pool = pool.filter(t => WEAPONS[t].rarity !== "Common");
  const type = weightedType(pool.length ? pool : unlockedTypes(s.stage));
  const result = addWeapon(s, type, rank);
  if (!result) { // refund if inventory really is full
    kind === "key" ? s.keys++ : s.gems += 120; s.toast = "Grid and bag are full"; return false;
  }
  s.toast = `${kind === "key" ? "Chest" : "Epic Crate"}: ${WEAPONS[type].name} ${rank + 1}★`;
  return true;
}

function addBlock(s, x, y, w, h, hp, color, kind = "brick", round = 13) {
  s.blocks.push({
    id: UID++, x, y, w, h, hp, maxHp: hp, color, kind, round,
    hit: 0, death: 0, destroyed: false, floatCooldown: 0, phase: Math.random() * TAU
  });
}

const PALETTES = [
  ["#1bb7a9", "#36c96f", "#3779d5", "#d93c99", "#e1bf39", "#f17048"],
  ["#49b56d", "#3298ce", "#7e54dc", "#e4539a", "#df9c3d", "#40c3bc"],
  ["#d05f57", "#eb8e45", "#4fae72", "#4a83d8", "#9d49ce", "#d44187"],
  ["#41b66f", "#27a9a2", "#526fd3", "#d95b9b", "#e0b33f", "#f06c3d"]
];

function waveHp(base, wave, mult = 1) {
  return Math.max(4, Math.round(base * (1 + wave * .12) * mult));
}

function generateWave(s, z, wave, base, palette) {
  const p = (wave + s.stage) % 7;
  const color = i => palette[(wave + i) % palette.length];
  const hp = m => waveHp(base, wave, m);

  if (p === 0) {
    const cols = 7, bw = 82;
    const hole = 1 + ((wave * 3 + s.stage) % 5);
    for (let i = 0; i < cols; i++) if (i !== hole)
      addBlock(s, (i - 3) * 91, z, bw, 72, hp(.78 + (i % 3) * .08), color(i), "brick", 11);
  } else if (p === 1) {
    for (let i = 0; i < 4; i++)
      addBlock(s, -225 + i * 150, z, 138, 96, hp(1.05 + i * .06), color(i + 1), i === 1 ? "armored" : "brick", 16);
    addBlock(s, 0, z + 105, 112, 66, hp(.72), color(5), "crystal", 12);
  } else if (p === 2) {
    addBlock(s, -205, z, 210, 148, hp(2.15), color(0), "heavy", 25);
    addBlock(s, 170, z - 18, 250, 118, hp(1.8), color(3), "heavy", 23);
    addBlock(s, 18, z + 90, 108, 72, hp(.82), color(5), "brick", 12);
  } else if (p === 3) {
    for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) {
      if ((i + r + wave) % 6 === 0) continue;
      addBlock(s, (i - 2) * 122 + (r ? 40 : -20), z + r * 90, 108, 70, hp(.68 + r * .13), color(i + r), "brick", 12);
    }
  } else if (p === 4) {
    addBlock(s, -270, z, 150, 178, hp(1.8), color(2), "pillar", 28);
    addBlock(s, 270, z, 150, 178, hp(1.8), color(4), "pillar", 28);
    for (let i = -1; i <= 1; i++) addBlock(s, i * 110, z + 42, 98, 76, hp(.74), color(i + 3), "brick", 13);
  } else if (p === 5) {
    const widths = [145, 92, 118, 92, 145], xs = [-262, -118, 0, 118, 262];
    for (let i = 0; i < xs.length; i++) addBlock(s, xs[i], z, widths[i], i % 2 ? 82 : 114, hp(.92 + i * .1), color(i), i === 2 ? "crystal" : "brick", 14);
    addBlock(s, 0, z + 102, 232, 70, hp(1.25), color(4), "armored", 14);
  } else {
    addBlock(s, 0, z, 330, 166, hp(3.35), color(1), "heavy", 30);
    for (const x of [-286, 286]) addBlock(s, x, z + 48, 112, 86, hp(.9), color(x < 0 ? 4 : 5), "brick", 14);
  }
}

export function startBattle(s) {
  if (!s.grid.some(Boolean)) return false;
  s.mode = "battle";
  s.world = 0; s.teamX = 0; s.teamY = 0; s.teamLean = 0;
  s.shots = []; s.blocks = []; s.particles = []; s.rings = []; s.coins = []; s.floaters = [];
  s.earned = 0; s.elapsed = 0; s.shake = 0; s.battleFlash = 0;
  s.worldSpeed = 126 + Math.min(28, s.stage * .65);

  for (const w of s.grid) if (w) {
    const st = weaponStats(w.type, w.rank);
    w.hp = w.maxHp = st.maxHp;
    w.cool = Math.random() * Math.min(.28, st.rate);
    w.recoil = 0; w.flash = 0; w.hitFlash = 0;
  }

  const base = 22 + s.stage * 4.2;
  const palette = PALETTES[(s.stage - 1) % PALETTES.length];
  let z = 610;
  for (let wave = 0; wave < 16; wave++) {
    generateWave(s, z, wave, base, palette);
    z += 190 + ((wave * 37 + s.stage * 11) % 70);
  }
  const bossHp = Math.round(base * (18 + Math.min(12, s.stage * .15)));
  addBlock(s, 0, z + 30, 535, 205, bossHp, "#3c51d7", "boss", 42);
  s.targetDistance = z + 560;
  return true;
}

function pushParticle(s, x, y, vx, vy, life, size, color, kind = "spark", gravity = 0, drag = .96) {
  s.particles.push({
    x, y, vx, vy, life, max: life, size, color, kind, gravity, drag,
    rot: Math.random() * TAU, spin: (Math.random() - .5) * 9
  });
}

function burst(s, x, y, color, n = 8, speed = 110, kind = "spark") {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, v = speed * (.25 + Math.random() * .9);
    pushParticle(s, x, y, Math.cos(a) * v, Math.sin(a) * v, .28 + Math.random() * .46,
      2 + Math.random() * 6, color, kind, kind === "shard" ? 90 : 0, kind === "smoke" ? .91 : .96);
  }
}

function smokeBurst(s, x, y, n = 6) {
  for (let i = 0; i < n; i++) {
    pushParticle(s, x + (Math.random() - .5) * 24, y + (Math.random() - .5) * 20,
      (Math.random() - .5) * 42, -20 - Math.random() * 55, .5 + Math.random() * .55,
      9 + Math.random() * 16, i % 3 ? "#323744" : "#ff9a3d", "smoke", -6, .92);
  }
}

function ring(s, x, y, color, maxRadius = 55, life = .32, width = 4) {
  s.rings.push({ x, y, color, radius: 4, maxRadius, life, max: life, width });
}

function pickTarget(s, originX, originY, viewH) {
  let best = null, score = Infinity;
  for (const b of s.blocks) {
    if (b.destroyed || b.hp <= 0) continue;
    const pr = projectBlock(s, b, viewH);
    if (pr.y < ROAD_HORIZON_Y - 50 || pr.y > originY - 20) continue;
    const scoreHere = (originY - pr.y) + Math.abs(originX - pr.x) * .65;
    if (scoreHere < score) { score = scoreHere; best = b; }
  }
  return best?.id ?? null;
}

function makeShot(s, w, pos, st, kind, dx = 0, vx = 0, damageScale = 1, viewH = 800) {
  const speed = st.speed || 650;
  const radii = { rocket:7, gravity:15, vortex:19, nuke:13, shell:9, mortar:11, bubble:8, acid:7, wave:16, drill:9, rail:5, tesla:5, flame:8, shard:4, needle:3 };
  const q = {
    id: UID++, kind, x: pos.x + dx, y: pos.y - 27,
    vx, vy: -speed, damage: st.damage * damageScale,
    life: kind === "flame" ? .72 : kind === "nuke" || kind === "mortar" ? 5.2 : 4.5,
    age: 0, r: radii[kind] || 5,
    splash: st.splash || 0, pierce: st.pierce || 0, color: st.accent,
    trail: [], phase: Math.random() * TAU, targetId: null, hitIds: new Set()
  };
  if (["rocket", "gravity", "vortex", "nuke", "drill", "mortar"].includes(kind)) q.targetId = pickTarget(s, q.x, q.y, viewH);
  s.shots.push(q);
}

function shoot(s, w, index, st, viewH) {
  if (st.shot === "none") return;
  const pos = formationCellPosition(s, index, viewH);
  if (st.shot === "split") {
    makeShot(s, w, pos, st, "split", -8, -120, .92, viewH); makeShot(s, w, pos, st, "split", 8, 120, .92, viewH);
  } else if (st.shot === "fire") {
    for (const [dx, vx, d] of [[-15,-65,.82],[0,0,1],[15,65,.82]]) makeShot(s, w, pos, st, "fire", dx, vx, d, viewH);
  } else if (st.shot === "rocket") {
    for (const [dx, vx] of [[-11,-32],[0,0],[11,32]]) makeShot(s, w, pos, st, "rocket", dx, vx, .72, viewH);
  } else if (st.shot === "bubble") {
    makeShot(s, w, pos, st, "bubble", 0, (Math.random() - .5) * 125, 1, viewH);
  } else if (st.shot === "shard") {
    for (const vx of [-180,-90,0,90,180]) makeShot(s, w, pos, st, "shard", vx / 22, vx, vx ? .68 : .9, viewH);
  } else if (st.shot === "tesla") {
    makeShot(s, w, pos, st, "tesla", -5, -35, .88, viewH); makeShot(s, w, pos, st, "tesla", 5, 35, .88, viewH);
  } else if (st.shot === "flame") {
    makeShot(s, w, pos, st, "flame", (Math.random()-.5)*9, (Math.random()-.5)*90, 1, viewH);
  } else {
    makeShot(s, w, pos, st, st.shot, 0, 0, 1, viewH);
  }
  w.recoil = 1; w.flash = 1;
  const big = ["nuke","mortar","rail","vortex"].includes(st.shot);
  ring(s, pos.x, pos.y - 28, st.accent, big ? 30 : 18, .16, big ? 3.5 : 2.5);
  for (let i = 0; i < (big ? 7 : 4); i++) pushParticle(s, pos.x + (Math.random() - .5) * 8, pos.y - 30,
    (Math.random() - .5) * 40, -55 - Math.random() * 70, .18 + Math.random() * .18,
    2 + Math.random() * 3, st.accent, "spark", 0, .93);
}

function destroyBlock(s, b, screenY, viewH) {
  if (b.destroyed) return;
  b.destroyed = true; b.hp = 0; b.death = .34;
  const reward = Math.max(2, Math.round(Math.sqrt(b.maxHp) * (b.kind === "boss" ? 5.2 : 2.2)));
  s.earned += reward;
  const pr = projectBlock(s, b, viewH), scale = pr.scale, px = pr.x;
  const burstCount = b.kind === "boss" ? 44 : b.kind === "heavy" ? 24 : 15;
  burst(s, px, screenY, "#fff4ae", Math.ceil(burstCount * .45), 180, "spark");
  burst(s, px, screenY, b.color, burstCount, b.kind === "boss" ? 260 : 175, "shard");
  smokeBurst(s, px, screenY, b.kind === "boss" ? 16 : 7);
  ring(s, px, screenY, "#fff4a8", Math.max(60, b.w * scale * .58), .38, 5);
  ring(s, px, screenY, b.color, Math.max(90, b.w * scale * .8), .52, 3);
  const coins = Math.min(10, 2 + Math.ceil(reward / 18));
  for (let i = 0; i < coins; i++) {
    s.coins.push({
      x: px + (Math.random() - .5) * b.w * scale * .48,
      y: screenY + (Math.random() - .5) * b.h * scale * .25,
      vx: (Math.random() - .5) * 145,
      vy: -110 - Math.random() * 120,
      life: 1.15 + Math.random() * .3,
      max: 1.45,
      spin: Math.random() * TAU
    });
  }
  s.shake = Math.min(b.kind === "boss" ? 18 : 11, s.shake + (b.kind === "boss" ? 11 : 3.5));
  s.battleFlash = Math.max(s.battleFlash, b.kind === "boss" ? .75 : .18);
}

function damageBlock(s, b, dmg, hitX, screenY, viewH, splash = 0, impactKind = "hit") {
  if (b.destroyed || b.hp <= 0) return;
  b.hp -= dmg; b.hit = 1;
  if (b.floatCooldown <= 0) {
    s.floaters.push({ x: hitX, y: screenY - 8, text: `${Math.max(1, Math.round(dmg))}`, life: .5, max: .5, big: dmg > b.maxHp * .12 });
    b.floatCooldown = .08;
  }
  burst(s, hitX, screenY, impactKind === "fire" ? "#ffb53d" : "#fff8ce", 4, 72, "spark");
  ring(s, hitX, screenY, "#ffffff", impactKind === "laser" ? 19 : 28, .16, 2);

  if (splash > 0) {
    for (const o of s.blocks) {
      if (o === b || o.destroyed || o.hp <= 0) continue;
      const dz = Math.abs(o.y - b.y) * .55, dx = o.x - b.x;
      if (Math.hypot(dx, dz) < splash + Math.max(o.w, o.h) * .35) {
        const splashDamage = dmg * .32;
        o.hp -= splashDamage; o.hit = Math.max(o.hit, .65);
        if (o.hp <= 0) destroyBlock(s, o, projectBlock(s, o, viewH).y, viewH);
      }
    }
  }
  if (b.hp <= 0) destroyBlock(s, b, screenY, viewH);
}

function updateShot(s, sh, dt, viewH) {
  sh.age += dt; sh.life -= dt;
  sh.trail.push([sh.x, sh.y]);
  if (sh.trail.length > (sh.kind === "laser" ? 5 : 11)) sh.trail.shift();

  if (sh.targetId && ["rocket", "gravity", "vortex", "nuke", "drill", "mortar"].includes(sh.kind)) {
    const target = s.blocks.find(b => b.id === sh.targetId && !b.destroyed && b.hp > 0);
    if (target) {
      const pr = projectBlock(s, target, viewH);
      const homing = sh.kind === "rocket" || sh.kind === "drill" ? 2.8 : sh.kind === "nuke" || sh.kind === "mortar" ? 1.6 : 1.25;
      const desired = clamp((pr.x - sh.x) * homing, -230, 230);
      sh.vx += (desired - sh.vx) * Math.min(1, dt * (sh.kind === "rocket" || sh.kind === "drill" ? 5.8 : 2.8));
      if (pr.y > sh.y + 45) sh.targetId = null;
    } else sh.targetId = null;
  }

  let extraX = 0;
  if (sh.kind === "bubble") extraX = Math.sin(sh.age * 10 + sh.phase) * 34;
  if (sh.kind === "gravity" || sh.kind === "vortex") extraX = Math.sin(sh.age * 5 + sh.phase) * (sh.kind === "vortex" ? 16 : 10);
  if (sh.kind === "acid") extraX = Math.sin(sh.age * 11 + sh.phase) * 18;
  sh.x += (sh.vx + extraX) * dt;
  sh.y += sh.vy * dt;

  for (const b of s.blocks) {
    if (b.destroyed || b.hp <= 0 || sh.hitIds.has(b.id)) continue;
    const pr = projectBlock(s, b, viewH);
    if (pr.y < ROAD_HORIZON_Y - 75 || pr.y > viewH + 90) continue;
    const bw = b.w * pr.scale, bh = b.h * pr.scale;
    if (Math.abs(sh.x - pr.x) < bw / 2 + sh.r && Math.abs(sh.y - pr.y) < bh / 2 + sh.r) {
      sh.hitIds.add(b.id);
      damageBlock(s, b, sh.damage, sh.x, pr.y, viewH, sh.splash, sh.kind);
      if (["rocket", "shell", "fire", "nuke", "mortar", "drill"].includes(sh.kind)) {
        const huge = sh.kind === "nuke", heavy = sh.kind === "mortar";
        smokeBurst(s, sh.x, pr.y, huge ? 18 : heavy ? 10 : sh.kind === "rocket" ? 4 : 3);
        ring(s, sh.x, pr.y, sh.kind === "fire" ? "#ff7b2b" : "#ffce5b", huge ? 175 : heavy ? 120 : sh.kind === "rocket" ? 62 : 45, huge ? .55 : .28, huge ? 8 : 4);
        if (huge) { burst(s, sh.x, pr.y, "#fff5a0", 34, 260, "spark"); s.shake = Math.max(s.shake, 15); s.battleFlash = Math.max(s.battleFlash, .7); }
      }
      if (sh.kind === "gravity" || sh.kind === "vortex") ring(s, sh.x, pr.y, "#d83cff", sh.kind === "vortex" ? 150 : 92, .48, 5);
      if (sh.kind === "tesla") ring(s, sh.x, pr.y, "#a9f8ff", 46, .18, 2);
      if (sh.kind === "wave") ring(s, sh.x, pr.y, "#f08dff", 105, .30, 4);
      if (sh.kind === "acid") ring(s, sh.x, pr.y, "#b7ff54", 48, .24, 3);
      if (sh.pierce > 0) {
        sh.pierce--; sh.damage *= .74; sh.y -= 8;
      } else {
        sh.life = 0; break;
      }
    }
  }
}

export function updateBattle(s, dt, input) {
  if (s.mode !== "battle") return;
  const viewH = input.viewH || 800;
  s.elapsed += dt;
  s.world += s.worldSpeed * dt;

  const prevX = s.teamX;
  const maxX = input.maxX ?? 245;
  s.teamX = clamp(s.teamX + (input.x - s.teamX) * Math.min(1, dt * 10.5), -maxX, maxX);
  s.teamY = clamp(s.teamY + (input.y - s.teamY) * Math.min(1, dt * 10), -105, 92);
  s.teamLean += (clamp((s.teamX - prevX) / Math.max(.001, dt) / 260, -1, 1) - s.teamLean) * Math.min(1, dt * 8);

  for (let i = 0; i < s.grid.length; i++) {
    const w = s.grid[i];
    if (!w || w.hp <= 0) continue;
    const st = weaponStats(w.type, w.rank);
    w.cool -= dt;
    w.recoil = Math.max(0, w.recoil - dt * 8.5);
    w.flash = Math.max(0, w.flash - dt * 11);
    w.hitFlash = Math.max(0, w.hitFlash - dt * 7);
    if (w.cool <= 0) { shoot(s, w, i, st, viewH); w.cool += st.rate; }
  }

  for (const sh of s.shots) updateShot(s, sh, dt, viewH);
  s.shots = s.shots.filter(q => q.life > 0 && q.y > ROAD_HORIZON_Y - 120 && q.y < viewH + 130);

  for (const b of s.blocks) {
    b.hit = Math.max(0, b.hit - dt * 5.5);
    b.floatCooldown = Math.max(0, b.floatCooldown - dt);
    if (b.destroyed) { b.death -= dt; continue; }
    if (b.hp <= 0) continue;
    const pr = projectBlock(s, b, viewH);
    if (pr.y < ROAD_HORIZON_Y - 80 || pr.y > viewH + 120) continue;
    const bw = b.w * pr.scale, bh = b.h * pr.scale;

    for (let i = 0; i < s.grid.length; i++) {
      const w = s.grid[i];
      if (!w || w.hp <= 0 || b.destroyed) continue;
      const pos = formationCellPosition(s, i, viewH);
      if (Math.abs(pos.x - pr.x) < bw / 2 + 22 && Math.abs(pos.y - pr.y) < bh / 2 + 22) {
        const exchanged = Math.min(w.hp, b.hp);
        w.hp -= exchanged; b.hp -= exchanged; w.hitFlash = 1;
        burst(s, pos.x, pos.y, "#ff785d", 12, 150, "spark");
        burst(s, pos.x, pos.y, "#83eaff", 7, 135, "shard");
        ring(s, pos.x, pos.y, "#ffffff", 46, .26, 4);
        s.shake = Math.max(s.shake, 8);
        s.battleFlash = Math.max(s.battleFlash, .22);
        if (w.hp <= 0) {
          smokeBurst(s, pos.x, pos.y, 8);
          ring(s, pos.x, pos.y, "#6fdcff", 72, .42, 4);
        }
        if (b.hp <= 0) destroyBlock(s, b, pr.y, viewH);
      }
    }
  }
  s.blocks = s.blocks.filter(b => !b.destroyed || b.death > 0);

  for (const p of s.particles) {
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gravity * dt;
    p.vx *= Math.pow(p.drag, dt * 60); p.vy *= Math.pow(p.drag, dt * 60);
    p.rot += p.spin * dt;
    if (p.kind === "smoke") p.size += dt * 14;
  }
  s.particles = s.particles.filter(p => p.life > 0);

  for (const r of s.rings) {
    r.life -= dt;
    const t = 1 - r.life / r.max;
    r.radius = r.maxRadius * (1 - Math.pow(1 - clamp(t, 0, 1), 2));
  }
  s.rings = s.rings.filter(r => r.life > 0);

  for (const c of s.coins) {
    c.life -= dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 220 * dt; c.spin += dt * 8;
  }
  s.coins = s.coins.filter(c => c.life > 0);

  for (const f of s.floaters) { f.life -= dt; f.y -= 42 * dt; }
  s.floaters = s.floaters.filter(f => f.life > 0);

  s.shake = Math.max(0, s.shake - dt * 22);
  s.battleFlash = Math.max(0, s.battleFlash - dt * 2.8);

  const alive = s.grid.some(w => w && w.hp > 0);
  if (!alive) {
    const playedStage = s.stage, progress = stageClearRewards(s, playedStage, false);
    s.gold += s.earned;
    s.mode = "result"; s.lastResult = { win: false, reward: s.earned, xp: progress.xp, progress, unlocks: [] };
  } else if (s.world > s.targetDistance) {
    const playedStage = s.stage;
    const clearGold = 90 + playedStage * 30;
    const bonus = Math.round(s.earned * (.20 + Math.min(.85, playedStage * .022))) + clearGold;
    s.earned += bonus; s.gold += s.earned;
    const unlocks = unlocksForClear(playedStage);
    s.stage++;
    const progress = stageClearRewards(s, playedStage, true);
    s.mode = "result"; s.lastResult = { win: true, reward: s.earned, bonus, clearGold, xp: progress.xp, progress, unlocks, playedStage };
  }
}
