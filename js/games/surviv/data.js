export const WORLD = {
    width: 4200,
    height: 4200,
    gridSize: 540,
    background: '#83b64d',
    grid: 'rgba(53, 88, 39, 0.28)'
};

export const COLORS = {
    outline: '#202020',
    ammo: {
        '9mm': '#d69a19',
        '12g': '#c73734',
        '7.62': '#3279c7',
        '5.56': '#36b44b'
    },
    grass: '#83b64d',
    treeLeaves: '#40592d',
    treeLeavesDark: '#324624',
    treeLeavesShadow: '#26351c',
    treeTrunk: '#6b431b',
    treeTrunkInner: '#8b5721',
    rock: '#c9c9cb',
    rockEdge: '#4e4e52',
    rockDark: '#7d7f84',
    rockDot: '#2d2d2e',
    container: '#223544',
    containerDark: '#0b141b',
    containerRoof: '#1e2c39',
    containerPanel: '#2d4a60',
    containerFloor: '#223543',
    containerWall: '#0a1218',
    containerShadow: 'rgba(0,0,0,0.22)',
    crate: '#9c6222',
    crateDark: '#342311',
    crateMid: '#bb7a2d',
    player: '#f1c471',
    playerOutline: '#3a2c20',
    energy: '#f1a03c',
    health: '#9bb7ac',
    capacityFull: '#f0a130',
    houseRoof: '#753b2c',
    houseRoofDark: '#5d2f25',
    houseOuterWall: '#8e2f2d',
    houseInnerWall: '#d6c4b4',
    houseFloor: '#b97731',
    houseWindow: '#9fc1bd',
    houseStone: '#c8c8c8',
    houseToilet: '#ececec'
};

export const AMMO = {
    '9mm': { label: '9mm', color: COLORS.ammo['9mm'], stack: 48 },
    '12g': { label: '12 Gauge', color: COLORS.ammo['12g'], stack: 10 },
    '7.62': { label: '7.62mm', color: COLORS.ammo['7.62'], stack: 30 },
    '5.56': { label: '5.56mm', color: COLORS.ammo['5.56'], stack: 30 }
};

export const WEAPONS = {
    g18: {
        id: 'g18', name: 'G18', ammo: '9mm', magSize: 17, reloadMs: 1250,
        fireInterval: 115, automatic: true, damage: 14, bulletSpeed: 1120, spread: 0.055,
        pellets: 1, barrel: 33, width: 12, moveScale: 0.90, shotSlowMs: 120, appearance: 'pistol', color: '#1c1f22', accent: '#111111', magColor: '#161616'
    },
    mp5: {
        id: 'mp5', name: 'MP5', ammo: '9mm', magSize: 30, reloadMs: 1550,
        fireInterval: 86, automatic: true, damage: 18, bulletSpeed: 1260, spread: 0.045,
        pellets: 1, barrel: 46, width: 14, moveScale: 0.82, shotSlowMs: 150, appearance: 'smg', color: '#1e2327', accent: '#0f1113', magColor: '#161616'
    },
    m870: {
        id: 'm870', name: 'M870', ammo: '12g', magSize: 5, reloadMs: 1750,
        fireInterval: 720, automatic: false, damage: 17, bulletSpeed: 1040, spread: 0.19,
        pellets: 7, barrel: 52, width: 12, moveScale: 0.46, shotSlowMs: 430, appearance: 'shotgun', color: '#4a3a28', accent: '#201811', magColor: '#2d241c'
    },
    ak47: {
        id: 'ak47', name: 'AK-47', ammo: '7.62', magSize: 30, reloadMs: 1800,
        fireInterval: 102, automatic: true, damage: 25, bulletSpeed: 1360, spread: 0.06,
        pellets: 1, barrel: 55, width: 13, moveScale: 0.68, shotSlowMs: 175, appearance: 'rifle', color: '#6e431e', accent: '#23160f', magColor: '#2b1e1b'
    },
    m416: {
        id: 'm416', name: 'M416', ammo: '5.56', magSize: 30, reloadMs: 1680,
        fireInterval: 92, automatic: true, damage: 22, bulletSpeed: 1440, spread: 0.045,
        pellets: 1, barrel: 55, width: 12, moveScale: 0.71, shotSlowMs: 165, appearance: 'rifle', color: '#8f8253', accent: '#2d2a1d', magColor: '#222421'
    },
    mosin: {
        id: 'mosin', name: 'Mosin-Nagant', ammo: '7.62', magSize: 5, reloadMs: 2050,
        fireInterval: 980, automatic: false, damage: 76, bulletSpeed: 1780, spread: 0.012,
        pellets: 1, barrel: 64, width: 10, moveScale: 0.56, shotSlowMs: 360, appearance: 'sniper', color: '#6b4826', accent: '#2a1b10', magColor: '#141414'
    },
    mk12: {
        id: 'mk12', name: 'Mk 12 SPR', ammo: '5.56', magSize: 20, reloadMs: 1750,
        fireInterval: 210, automatic: false, damage: 38, bulletSpeed: 1640, spread: 0.022,
        pellets: 1, barrel: 61, width: 11, moveScale: 0.76, shotSlowMs: 190, appearance: 'marksman', color: '#5c6e53', accent: '#1b241d', magColor: '#2e3032'
    },
    flare: {
        id: 'flare', name: 'Flare Gun', ammo: '9mm', magSize: 1, reloadMs: 1900,
        fireInterval: 880, automatic: false, damage: 10, bulletSpeed: 900, spread: 0.015,
        pellets: 1, barrel: 36, width: 10, moveScale: 0.80, shotSlowMs: 220, appearance: 'pistol', color: '#b25b18', accent: '#5a2500', magColor: '#5a2500'
    }
};

export const THROWABLES = {
    frag: {
        id: 'frag',
        name: 'Frag',
        icon: 'frag',
        fuseMs: 1650,
        throwCooldown: 450,
        speed: 960,
        drag: 0.42,
        radius: 145,
        bounce: 0.28,
        damage: 85
    }
};

export const BACKPACK_CAPACITY = {
    0: { ammo: { '9mm': 120, '12g': 30, '7.62': 90, '5.56': 90 }, heals: { bandage: 5, medkit: 1, soda: 2, painkiller: 1 }, throwables: { frag: 2 } },
    1: { ammo: { '9mm': 180, '12g': 50, '7.62': 120, '5.56': 120 }, heals: { bandage: 10, medkit: 2, soda: 3, painkiller: 2 }, throwables: { frag: 4 } },
    2: { ammo: { '9mm': 240, '12g': 70, '7.62': 180, '5.56': 180 }, heals: { bandage: 15, medkit: 3, soda: 5, painkiller: 3 }, throwables: { frag: 6 } },
    3: { ammo: { '9mm': 330, '12g': 100, '7.62': 240, '5.56': 240 }, heals: { bandage: 20, medkit: 4, soda: 7, painkiller: 4 }, throwables: { frag: 8 } }
};

export const HEALS = {
    bandage: { id: 'bandage', name: 'Bandage', short: 'Bandage', icon: '+', useMs: 3000, hp: 15, hpCap: 75, energyGain: 0, moveScale: 0.42 },
    medkit: { id: 'medkit', name: 'Med Kit', short: 'Med Kit', icon: '✚', useMs: 6200, hp: 100, hpCap: 100, energyGain: 0, moveScale: 0.34 },
    soda: { id: 'soda', name: 'Soda', short: 'Soda', icon: '▥', useMs: 2600, hp: 0, hpCap: 100, energyGain: 25, moveScale: 0.5 },
    painkiller: { id: 'painkiller', name: 'Painkiller', short: 'Pain', icon: '◒', useMs: 4200, hp: 0, hpCap: 100, energyGain: 55, moveScale: 0.38 }
};

export const ENERGY_RULES = {
    max: 100,
    decayPerSecond: 1.65,
    regenPerSecond: [0, 0.6, 1.1, 1.9, 2.8]
};



export const BOT_AI = {
    radius: 30,
    speed: 242,
    senseRadius: 720,
    fireLOSRadius: 690,
    searchMs: 4200,
    wanderRepathMs: 2400,
    combatRepathMs: 520,
    preferredRanges: {
        pistol: 250,
        smg: 300,
        shotgun: 170,
        rifle: 390,
        marksman: 500,
        sniper: 590
    },
    strafeStrength: 0.72,
    obstacleProbe: 82,
    botColor: '#f0b867'
};

export const EQUIPMENT_VISUALS = {
    helmet: {
        0: null,
        1: { color: '#2d7be0', stroke: '#1d1d1d' },
        2: { color: '#d8dbde', stroke: '#1d1d1d' },
        3: { color: '#2d3036', stroke: '#111111' }
    },
    vest: {
        0: null,
        1: { color: '#d8dddf' },
        2: { color: '#7e878f' },
        3: { color: '#101010' }
    },
    backpack: {
        0: null,
        1: { color: '#80603a', size: 0.72 },
        2: { color: '#6e502f', size: 0.92 },
        3: { color: '#36393f', size: 0.92 }
    }
};

export const SCOPES = {
    1: { label: '1x', cameraScale: 1.18 },
    2: { label: '2x', cameraScale: 0.98 },
    4: { label: '4x', cameraScale: 0.78 },
    8: { label: '8x', cameraScale: 0.60 }
};

export const MAP = {
    spawn: { x: 2100, y: 2190 },
    trees: [
        { x: 1540, y: 1760, r: 156, trunk: 43, hp: 180 },
        { x: 1930, y: 1610, r: 165, trunk: 45, hp: 180 },
        { x: 2620, y: 1660, r: 160, trunk: 44, hp: 180 },
        { x: 3000, y: 2130, r: 150, trunk: 42, hp: 180 },
        { x: 1670, y: 2460, r: 160, trunk: 45, hp: 180 },
        { x: 2420, y: 2630, r: 172, trunk: 47, hp: 185 },
        { x: 3170, y: 2780, r: 158, trunk: 44, hp: 180 },
        { x: 1120, y: 2970, r: 165, trunk: 45, hp: 180 },
        { x: 3590, y: 1210, r: 165, trunk: 45, hp: 180 },
        { x: 830, y: 1240, r: 150, trunk: 41, hp: 180 },
        { x: 1040, y: 1980, r: 155, trunk: 43, hp: 180 },
        { x: 3500, y: 3470, r: 170, trunk: 47, hp: 190 },
        { x: 2080, y: 3420, r: 155, trunk: 42, hp: 180 },
        { x: 680, y: 3570, r: 158, trunk: 44, hp: 180 }
    ],
    rocks: [
        { x: 2240, y: 1675, r: 61, hp: 250 }, { x: 2835, y: 1890, r: 57, hp: 240 },
        { x: 2890, y: 2380, r: 63, hp: 250 }, { x: 1900, y: 2860, r: 58, hp: 240 },
        { x: 1310, y: 2210, r: 54, hp: 235 }, { x: 3420, y: 2110, r: 61, hp: 250 },
        { x: 800, y: 1730, r: 62, hp: 250 }, { x: 3650, y: 2970, r: 60, hp: 245 },
        { x: 2550, y: 3260, r: 58, hp: 240 }, { x: 1440, y: 3400, r: 55, hp: 235 }
    ],
    containers: [
        { x: 2280, y: 2050, w: 440, h: 170, opening: 'left' },
        { x: 1220, y: 2720, w: 390, h: 165, opening: 'right' },
        { x: 3070, y: 3160, w: 410, h: 170, opening: 'left' }
    ],
    houses: [
        { x: 930, y: 780, w: 920, h: 840 },
        { x: 3130, y: 860, w: 920, h: 840 }
    ],
    barrels: [
        { x: 720, y: 760, r: 28, hp: 95 },
        { x: 3380, y: 1380, r: 28, hp: 95 },
        { x: 1080, y: 3650, r: 28, hp: 95 },
        { x: 3650, y: 3030, r: 28, hp: 95 }
    ],
    rareCrates: [
        { x: 520, y: 520 },
        { x: 3560, y: 3480 }
    ],
    crates: [
        { x: 980, y: 900, loot: 'ammo9' }, { x: 1370, y: 1110, loot: 'meds' },
        { x: 2080, y: 930, loot: 'g18' }, { x: 2860, y: 900, loot: 'armor1' },
        { x: 3470, y: 1030, loot: 'ammo556' }, { x: 3740, y: 1550, loot: 'm416' },
        { x: 850, y: 2420, loot: 'scope2' }, { x: 1040, y: 3210, loot: 'shotgun' },
        { x: 1690, y: 3140, loot: 'ammo762' }, { x: 2250, y: 3010, loot: 'meds' },
        { x: 2850, y: 3560, loot: 'scope4' }, { x: 3670, y: 3600, loot: 'armor2' },
        { x: 3890, y: 2660, loot: 'ak47' }, { x: 3270, y: 2440, loot: 'backpack2' },
        { x: 660, y: 1600, loot: 'ammo12' }, { x: 2440, y: 1220, loot: 'mosin' }
    ],
    botSpawnPoints: [
        { x: 2050, y: 520 }, { x: 2520, y: 610 }, { x: 3950, y: 980 },
        { x: 3970, y: 2020 }, { x: 3670, y: 2460 }, { x: 3350, y: 3820 },
        { x: 2350, y: 3900 }, { x: 1450, y: 3820 }, { x: 430, y: 3330 },
        { x: 420, y: 2300 }, { x: 520, y: 1540 }, { x: 2050, y: 2480 }
    ],
    lootSpawns: [
        { kind: 'weapon', subtype: 'mp5', x: 2470, y: 2135, loaded: 0 },
        { kind: 'ammo', subtype: '9mm', amount: 48, x: 2530, y: 2110 },
        { kind: 'ammo', subtype: '9mm', amount: 48, x: 2580, y: 2160 },
        { kind: 'equipment', subtype: 'backpack', level: 1, x: 2355, y: 2132 },

        { kind: 'weapon', subtype: 'm870', x: 1400, y: 2805, loaded: 0 },
        { kind: 'ammo', subtype: '12g', amount: 10, x: 1460, y: 2780 },
        { kind: 'ammo', subtype: '12g', amount: 10, x: 1510, y: 2830 },
        { kind: 'heal', subtype: 'bandage', amount: 5, x: 1315, y: 2795 },

        { kind: 'weapon', subtype: 'mk12', x: 3260, y: 3245, loaded: 0 },
        { kind: 'ammo', subtype: '5.56', amount: 30, x: 3320, y: 3220 },
        { kind: 'ammo', subtype: '5.56', amount: 30, x: 3370, y: 3270 },
        { kind: 'scope', subtype: 2, x: 3165, y: 3245 },

        { kind: 'equipment', subtype: 'helmet', level: 1, x: 1920, y: 2280 },
        { kind: 'equipment', subtype: 'vest', level: 1, x: 1980, y: 2300 },
        { kind: 'heal', subtype: 'soda', amount: 1, x: 1830, y: 2360 },
        { kind: 'heal', subtype: 'painkiller', amount: 1, x: 1870, y: 2395 },
        { kind: 'equipment', subtype: 'helmet', level: 2, x: 3440, y: 2100 },
        { kind: 'equipment', subtype: 'vest', level: 2, x: 3485, y: 2140 },
        { kind: 'equipment', subtype: 'backpack', level: 3, x: 740, y: 3535 },
        { kind: 'throwable', subtype: 'frag', amount: 2, x: 2040, y: 2360 },
        { kind: 'throwable', subtype: 'frag', amount: 1, x: 3340, y: 3240 }
    ]
};

export const RARE_CRATE_LOOT = {
    equipment: [
        { weight: 7, spec: { kind: 'equipment', subtype: 'helmet', level: 2 } },
        { weight: 4, spec: { kind: 'equipment', subtype: 'helmet', level: 3 } },
        { weight: 7, spec: { kind: 'equipment', subtype: 'vest', level: 2 } },
        { weight: 4, spec: { kind: 'equipment', subtype: 'vest', level: 3 } },
        { weight: 6, spec: { kind: 'equipment', subtype: 'backpack', level: 2 } },
        { weight: 5, spec: { kind: 'equipment', subtype: 'backpack', level: 3 } }
    ],
    heal: [
        { weight: 6, spec: { kind: 'heal', subtype: 'medkit', amount: 1 } },
        { weight: 6, spec: { kind: 'heal', subtype: 'painkiller', amount: 1 } },
        { weight: 3, spec: { kind: 'heal', subtype: 'soda', amount: 2 } },
        { weight: 2, spec: { kind: 'heal', subtype: 'bandage', amount: 5 } }
    ],
    weapon: [
        { weight: 5, spec: { kind: 'weapon', subtype: 'ak47', loaded: 0 } },
        { weight: 5, spec: { kind: 'weapon', subtype: 'm416', loaded: 0 } },
        { weight: 4, spec: { kind: 'weapon', subtype: 'mk12', loaded: 0 } },
        { weight: 2, spec: { kind: 'weapon', subtype: 'mosin', loaded: 0 } }
    ],
    utility: [
        { weight: 5, spec: { kind: 'scope', subtype: 4 } },
        { weight: 2, spec: { kind: 'scope', subtype: 8 } },
        { weight: 5, spec: { kind: 'throwable', subtype: 'frag', amount: 2 } },
        { weight: 5, spec: { kind: 'ammo', subtype: '7.62', amount: 30 } },
        { weight: 5, spec: { kind: 'ammo', subtype: '5.56', amount: 30 } }
    ]
};

export const CRATE_LOOT = {
    ammo9: [
        { kind: 'ammo', subtype: '9mm', amount: 48 },
        { kind: 'heal', subtype: 'bandage', amount: 2 }
    ],
    ammo12: [
        { kind: 'ammo', subtype: '12g', amount: 10 },
        { kind: 'ammo', subtype: '12g', amount: 10 }
    ],
    ammo556: [
        { kind: 'ammo', subtype: '5.56', amount: 30 },
        { kind: 'ammo', subtype: '5.56', amount: 30 }
    ],
    ammo762: [
        { kind: 'ammo', subtype: '7.62', amount: 30 },
        { kind: 'ammo', subtype: '7.62', amount: 30 }
    ],
    meds: [
        { kind: 'heal', subtype: 'bandage', amount: 5 },
        { kind: 'heal', subtype: 'soda', amount: 1 }
    ],
    armor1: [
        { kind: 'equipment', subtype: 'helmet', level: 1 },
        { kind: 'equipment', subtype: 'vest', level: 1 }
    ],
    armor2: [
        { kind: 'equipment', subtype: 'helmet', level: 2 },
        { kind: 'heal', subtype: 'medkit', amount: 1 }
    ],
    backpack2: [
        { kind: 'equipment', subtype: 'backpack', level: 2 },
        { kind: 'heal', subtype: 'bandage', amount: 3 }
    ],
    scope2: [
        { kind: 'scope', subtype: 2 },
        { kind: 'ammo', subtype: '9mm', amount: 48 }
    ],
    scope4: [
        { kind: 'scope', subtype: 4 },
        { kind: 'ammo', subtype: '7.62', amount: 30 }
    ],
    g18: [
        { kind: 'weapon', subtype: 'g18', loaded: 0 },
        { kind: 'ammo', subtype: '9mm', amount: 48 },
        { kind: 'ammo', subtype: '9mm', amount: 48 }
    ],
    shotgun: [
        { kind: 'weapon', subtype: 'm870', loaded: 0 },
        { kind: 'ammo', subtype: '12g', amount: 10 },
        { kind: 'ammo', subtype: '12g', amount: 10 }
    ],
    ak47: [
        { kind: 'weapon', subtype: 'ak47', loaded: 0 },
        { kind: 'ammo', subtype: '7.62', amount: 30 },
        { kind: 'ammo', subtype: '7.62', amount: 30 }
    ],
    m416: [
        { kind: 'weapon', subtype: 'm416', loaded: 0 },
        { kind: 'ammo', subtype: '5.56', amount: 30 },
        { kind: 'ammo', subtype: '5.56', amount: 30 }
    ],
    mosin: [
        { kind: 'weapon', subtype: 'mosin', loaded: 0 },
        { kind: 'ammo', subtype: '7.62', amount: 30 },
        { kind: 'ammo', subtype: '7.62', amount: 30 }
    ],
    houseRoom: [
        { kind: 'heal', subtype: 'bandage', amount: 5 },
        { kind: 'heal', subtype: 'soda', amount: 1 }
    ],
    houseRoom2: [
        { kind: 'ammo', subtype: '9mm', amount: 48 },
        { kind: 'equipment', subtype: 'helmet', level: 1 }
    ],
    houseLiving: [
        { kind: 'equipment', subtype: 'vest', level: 1 },
        { kind: 'heal', subtype: 'bandage', amount: 3 }
    ]
};
