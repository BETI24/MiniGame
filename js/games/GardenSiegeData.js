export const ROWS = 5;
export const COLS = 9;

export const PLANTS = {
  sunbloom: {
    id: "sunbloom",
    name: "Sun Bloom",
    icon: "☀",
    cost: 50,
    cooldown: 5.5,
    hp: 85,
    role: "Economy",
    description: "Generates energy orbs every few seconds.",
    color: "#f6c84a",
    accent: "#7b5a14",
    produceEvery: 8.2,
    produceAmount: 30
  },
  podshot: {
    id: "podshot",
    name: "Pod Shot",
    icon: "●",
    cost: 100,
    cooldown: 5.0,
    hp: 100,
    role: "Ranged",
    description: "Reliable ranged attacker for one lane.",
    color: "#67b74c",
    accent: "#2e6326",
    damage: 21,
    fireRate: 1.32,
    projectileSpeed: 270
  },
  frostbud: {
    id: "frostbud",
    name: "Frost Bud",
    icon: "❄",
    cost: 125,
    cooldown: 7.5,
    hp: 95,
    role: "Control",
    description: "Shots slow enemies for a short time.",
    color: "#71c7df",
    accent: "#315e7e",
    damage: 15,
    fireRate: 1.6,
    projectileSpeed: 245,
    slow: 0.56,
    slowTime: 3.2
  },
  barkwall: {
    id: "barkwall",
    name: "Bark Wall",
    icon: "▰",
    cost: 75,
    cooldown: 10.0,
    hp: 700,
    role: "Defense",
    description: "Huge health pool. Buys precious time.",
    color: "#9b6a39",
    accent: "#5c3b20"
  },
  snapvine: {
    id: "snapvine",
    name: "Snap Vine",
    icon: "✦",
    cost: 150,
    cooldown: 14.0,
    hp: 130,
    role: "Burst",
    description: "Devours the first nearby enemy, then needs time to recover.",
    color: "#a04f8e",
    accent: "#552949",
    biteDamage: 999,
    biteRange: 72,
    biteCooldown: 18
  },
  sporecap: {
    id: "sporecap",
    name: "Spore Cap",
    icon: "◉",
    cost: 25,
    cooldown: 4.0,
    hp: 70,
    role: "Cheap",
    description: "Short-ranged free-fire mushroom. Stronger at night.",
    color: "#8b6bbb",
    accent: "#4d386b",
    damage: 11,
    fireRate: 1.18,
    projectileSpeed: 220,
    range: 270,
    nightDamageMult: 1.45
  },
  twinpod: {
    id: "twinpod",
    name: "Twin Pod",
    icon: "∞",
    cost: 200,
    cooldown: 10.0,
    hp: 105,
    role: "DPS",
    description: "Fires two quick shots at a time.",
    color: "#4ba35a",
    accent: "#215d31",
    damage: 18,
    fireRate: 1.5,
    burst: 2,
    burstGap: 0.18,
    projectileSpeed: 285
  },
  thunderfern: {
    id: "thunderfern",
    name: "Thunder Fern",
    icon: "⚡",
    cost: 175,
    cooldown: 13.0,
    hp: 90,
    role: "Chain",
    description: "Lightning jumps between up to three enemies.",
    color: "#7ad1a5",
    accent: "#275f50",
    damage: 24,
    fireRate: 2.5,
    chain: 3,
    chainFalloff: 0.72
  },
  bombberry: {
    id: "bombberry",
    name: "Bomb Berry",
    icon: "✹",
    cost: 125,
    cooldown: 18.0,
    hp: 1,
    role: "Instant",
    description: "Explodes after a short fuse and damages a 3×3 area.",
    color: "#dc5d53",
    accent: "#7d2b2b",
    fuse: 0.8,
    blastDamage: 210,
    blastRadius: 112
  }
};

export const ENEMIES = {
  drifter: {
    id: "drifter",
    name: "Drifter",
    hp: 130,
    speed: 19,
    damage: 22,
    attackRate: 1.0,
    reward: 12,
    weight: 1,
    color: "#87926f",
    accent: "#43523b"
  },
  caphead: {
    id: "caphead",
    name: "Caphead",
    hp: 260,
    speed: 17,
    damage: 24,
    attackRate: 1.0,
    reward: 18,
    weight: 0.7,
    color: "#8a9370",
    accent: "#d07a40",
    armorShape: "cone"
  },
  ironclad: {
    id: "ironclad",
    name: "Ironclad",
    hp: 440,
    speed: 14,
    damage: 28,
    attackRate: 1.05,
    reward: 28,
    weight: 0.42,
    color: "#838d72",
    accent: "#687782",
    armorShape: "bucket"
  },
  sprinter: {
    id: "sprinter",
    name: "Sprinter",
    hp: 95,
    speed: 35,
    damage: 18,
    attackRate: 0.72,
    reward: 18,
    weight: 0.35,
    color: "#92a271",
    accent: "#8a3d45"
  },
  hurdler: {
    id: "hurdler",
    name: "Hurdler",
    hp: 180,
    speed: 25,
    damage: 20,
    attackRate: 0.92,
    reward: 24,
    weight: 0.24,
    color: "#7f956e",
    accent: "#4f64a1",
    jump: true,
    jumpCooldown: 5.5
  },
  brute: {
    id: "brute",
    name: "Garden Brute",
    hp: 760,
    speed: 10.5,
    damage: 54,
    attackRate: 1.25,
    reward: 52,
    weight: 0.12,
    color: "#768568",
    accent: "#583f32",
    scale: 1.28
  },
  summoner: {
    id: "summoner",
    name: "Mire Caller",
    hp: 330,
    speed: 13,
    damage: 16,
    attackRate: 1.0,
    reward: 42,
    weight: 0.10,
    color: "#747f6b",
    accent: "#7d4f8f",
    summonEvery: 8.5
  }
};

export const BOSSES = {
  compostKing: {
    id: "compostKing",
    name: "The Compost King",
    hp: 4200,
    speed: 7.2,
    damage: 88,
    attackRate: 1.35,
    reward: 500,
    color: "#65745d",
    accent: "#b08345",
    scale: 1.72,
    boss: true,
    stompEvery: 8,
    summonEvery: 10
  }
};

export const DIFFICULTIES = {
  easy: {
    label: "Easy",
    enemyHp: 0.82,
    enemySpeed: 0.92,
    waveSize: 0.82,
    startingEnergy: 225,
    energyDropEvery: 7.8
  },
  normal: {
    label: "Normal",
    enemyHp: 1,
    enemySpeed: 1,
    waveSize: 1,
    startingEnergy: 175,
    energyDropEvery: 9.0
  },
  hard: {
    label: "Hard",
    enemyHp: 1.18,
    enemySpeed: 1.08,
    waveSize: 1.18,
    startingEnergy: 150,
    energyDropEvery: 10.2
  }
};

export const CAMPAIGN_LEVELS = [
  {
    name: "Front Yard",
    waves: 5,
    unlocked: ["sunbloom","podshot","barkwall","bombberry"],
    description: "Learn the basics: economy, ranged defense and emergency explosives.",
    weather: ["day"]
  },
  {
    name: "Twilight Lawn",
    waves: 6,
    unlocked: ["sunbloom","podshot","barkwall","bombberry","sporecap","frostbud"],
    description: "Night phases strengthen mushrooms while energy falls less often.",
    weather: ["day","night"]
  },
  {
    name: "Storm Garden",
    waves: 7,
    unlocked: ["sunbloom","podshot","barkwall","bombberry","sporecap","frostbud","twinpod","thunderfern"],
    description: "Rain speeds projectiles and periodically empowers electric plants.",
    weather: ["day","rain","night"]
  },
  {
    name: "Overgrown Siege",
    waves: 8,
    unlocked: Object.keys(PLANTS),
    description: "All tools unlocked. Elite enemies and the Compost King await.",
    weather: ["day","rain","night"],
    boss: true
  }
];
