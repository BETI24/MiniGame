export const GRID = 5;
export const MAX_RANK = 9;
export const RANKS = ["★", "★★", "★★★", "★★★★", "★★★★★", "P1", "P2", "P3", "P4", "P5"];

export const RARITY_COLORS = {
  Common: "#d9e7f4",
  Uncommon: "#57e46f",
  Rare: "#43a7ff",
  Epic: "#c74cff",
};
export const RARITY_WEIGHT = { Common: 10, Uncommon: 6, Rare: 3, Epic: 1 };

// unlockStage is intentionally spread across the campaign so the arsenal keeps changing.
export const WEAPONS = {
  blaster: {
    name: "Pulse Blaster", rarity: "Common", unlockStage: 1, color: "#27b8ff", accent: "#d8f7ff",
    hp: 120, damage: 11, rate: .34, shot: "bolt", speed: 790,
    desc: "Fast, reliable pulse fire."
  },
  rockets: {
    name: "Mini Rockets", rarity: "Uncommon", unlockStage: 1, color: "#ff9d27", accent: "#fff0b0",
    hp: 108, damage: 18, rate: .82, shot: "rocket", speed: 575, splash: 66,
    desc: "Launches several homing mini rockets."
  },
  bubbles: {
    name: "Bubble Gun", rarity: "Common", unlockStage: 1, color: "#21d4d0", accent: "#ff78e6",
    hp: 115, damage: 6, rate: .20, shot: "bubble", speed: 505, pierce: 1,
    desc: "Very rapid shots at slightly random angles."
  },
  shield: {
    name: "Heavy Steel", rarity: "Uncommon", unlockStage: 1, color: "#4bb7d9", accent: "#e8ffff",
    hp: 330, damage: 0, rate: 99, shot: "none", speed: 0,
    desc: "Cannot fire, but is extremely durable."
  },
  cannon: {
    name: "Heavy Cannon", rarity: "Uncommon", unlockStage: 2, color: "#36d46a", accent: "#ffdb54",
    hp: 180, damage: 31, rate: 1.12, shot: "shell", speed: 535, splash: 62,
    desc: "Slow explosive shells with strong impact damage."
  },
  splitter: {
    name: "Splitter Pistol", rarity: "Epic", unlockStage: 3, color: "#6958ff", accent: "#7ff8ff",
    hp: 118, damage: 15, rate: .58, shot: "split", speed: 770, pierce: 1,
    desc: "Splits laser rounds into different angles on impact."
  },
  fire: {
    name: "Fireball Rain", rarity: "Rare", unlockStage: 4, color: "#ff4e29", accent: "#ffd348",
    hp: 137, damage: 17, rate: .72, shot: "fire", speed: 625, splash: 55, pierce: 1,
    desc: "Fires several fireballs. Piercing splash damage."
  },
  gravity: {
    name: "Gravity Particles", rarity: "Rare", unlockStage: 5, color: "#a82cf2", accent: "#ff77ff",
    hp: 145, damage: 16, rate: 1.02, shot: "gravity", speed: 430, splash: 105,
    desc: "Creates a gravity impact that crushes nearby blocks."
  },
  needle: {
    name: "Needle Repeater", rarity: "Common", unlockStage: 6, color: "#25b7ef", accent: "#baffff",
    hp: 105, damage: 4, rate: .095, shot: "needle", speed: 1120, pierce: 1,
    desc: "Extremely fast needle fire with light penetration."
  },
  laser: {
    name: "Laser Beam", rarity: "Rare", unlockStage: 7, color: "#df39ff", accent: "#91f8ff",
    hp: 122, damage: 9, rate: .066, shot: "laser", speed: 1220, pierce: 2,
    desc: "Excellent sustained single-target damage."
  },
  tesla: {
    name: "Tesla Fork", rarity: "Rare", unlockStage: 8, color: "#4b73ff", accent: "#bdf6ff",
    hp: 128, damage: 22, rate: .74, shot: "tesla", speed: 930, pierce: 3,
    desc: "Forked electric bolts jump through several blocks."
  },
  shard: {
    name: "Shard Shotgun", rarity: "Uncommon", unlockStage: 9, color: "#39d6aa", accent: "#d9fff1",
    hp: 154, damage: 9, rate: .82, shot: "shard", speed: 720,
    desc: "Fires a wide fan of crystal shards."
  },
  nuke: {
    name: "Nuclear Bomb", rarity: "Rare", unlockStage: 10, color: "#f08b2b", accent: "#fff09c",
    hp: 165, damage: 195, rate: 4.0, shot: "nuke", speed: 420, splash: 190,
    desc: "Massive area damage on impact."
  },
  acid: {
    name: "Acid Sprayer", rarity: "Uncommon", unlockStage: 12, color: "#65df48", accent: "#d8ff6f",
    hp: 132, damage: 12, rate: .31, shot: "acid", speed: 570, splash: 38,
    desc: "Rapid corrosive globules with small splash damage."
  },
  railgun: {
    name: "Rail Lance", rarity: "Epic", unlockStage: 14, color: "#256cf0", accent: "#e6ffff",
    hp: 130, damage: 64, rate: 1.28, shot: "rail", speed: 1500, pierce: 7,
    desc: "A high-power lance that punches through entire rows."
  },
  wave: {
    name: "Plasma Wave", rarity: "Epic", unlockStage: 16, color: "#b348ff", accent: "#ffa7ff",
    hp: 152, damage: 26, rate: .95, shot: "wave", speed: 560, splash: 82, pierce: 2,
    desc: "A wide plasma front that damages clustered blocks."
  },
  mortar: {
    name: "Siege Mortar", rarity: "Rare", unlockStage: 18, color: "#efbc3b", accent: "#fff1a2",
    hp: 190, damage: 78, rate: 1.75, shot: "mortar", speed: 450, splash: 125,
    desc: "Heavy shells with a very large blast radius."
  },
  flame: {
    name: "Flame Jet", rarity: "Uncommon", unlockStage: 20, color: "#f15332", accent: "#ffd35a",
    hp: 160, damage: 8, rate: .12, shot: "flame", speed: 500, splash: 24,
    desc: "A continuous stream of short-range fire."
  },
  vortex: {
    name: "Void Vortex", rarity: "Epic", unlockStage: 22, color: "#7b2bd6", accent: "#ff5cf4",
    hp: 170, damage: 46, rate: 1.55, shot: "vortex", speed: 385, splash: 165, pierce: 1,
    desc: "A slow singularity with huge crowd-control damage."
  },
  drill: {
    name: "Drill Missile", rarity: "Epic", unlockStage: 24, color: "#ef7241", accent: "#ffe87e",
    hp: 172, damage: 48, rate: 1.08, shot: "drill", speed: 650, pierce: 4, splash: 42,
    desc: "Homing drill missiles keep travelling through targets."
  }
};

export const TYPES = Object.keys(WEAPONS);
export function rankScale(rank) { return Math.pow(1.56, rank); }
export function weaponStats(type, rank) {
  const w = WEAPONS[type] || WEAPONS.blaster, s = rankScale(rank);
  const fireRateScale = Math.pow(.975, Math.min(rank, 5));
  return { ...w, maxHp: Math.round(w.hp * s), damage: Math.round(w.damage * s), rate: Math.max(.045, w.rate * fireRateScale) };
}
export function rankLabel(rank) { return RANKS[Math.min(rank, RANKS.length - 1)] || `P${rank - 4}`; }
export function unlockedTypes(stage) { return TYPES.filter(type => WEAPONS[type].unlockStage <= stage); }
export function newlyUnlockedTypes(fromStage, toStage) {
  return TYPES.filter(type => WEAPONS[type].unlockStage > fromStage && WEAPONS[type].unlockStage <= toStage);
}

export const PURCHASE_TIERS = [
  { rank: 0, minStage: 1, label: "1★", base: 320, rarityMax: "Uncommon" },
  { rank: 1, minStage: 4, label: "2★", base: 1250, rarityMax: "Rare" },
  { rank: 2, minStage: 10, label: "3★", base: 3900, rarityMax: "Epic" },
];
const RARITY_INDEX = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3 };
export function purchaseCost(stage, tier, count = 0) {
  const t = PURCHASE_TIERS[tier] || PURCHASE_TIERS[0];
  const stageScale = 1 + Math.max(0, stage - 1) * .055;
  const buyScale = Math.pow(1.105, Math.max(0, count));
  return Math.max(50, Math.round(t.base * stageScale * buyScale / 10) * 10);
}
export function tierPool(stage, tier) {
  const t = PURCHASE_TIERS[tier] || PURCHASE_TIERS[0], max = RARITY_INDEX[t.rarityMax];
  return TYPES.filter(type => WEAPONS[type].unlockStage <= stage && RARITY_INDEX[WEAPONS[type].rarity] <= max);
}

export const STAGE_COLORS = [
  ["#35b7c8", "#83e6d2"], ["#b654b6", "#f082b4"], ["#c15c55", "#f49a66"],
  ["#4aae70", "#8fe182"], ["#436ec9", "#65d4e0"], ["#8e54c8", "#e47bd1"]
];
