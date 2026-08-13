export const WORLD = {
    width: 5600,
    height: 5600,
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
    houseToilet: '#ececec',
    water: '#4d9bb5',
    waterDeep: '#3b829b',
    shore: '#79a75a'
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
    dualberetta: {
        id: 'dualberetta', name: 'Dual Beretta', ammo: '9mm', magSize: 30, reloadMs: 1650,
        fireInterval: 185, automatic: false, damage: 16, bulletSpeed: 1190, spread: 0.045,
        pellets: 2, ammoCost: 2, barrel: 35, width: 10, moveScale: 0.84, shotSlowMs: 150,
        appearance: 'pistol', dual: true, color: '#35383b', accent: '#111214', magColor: '#17191b'
    },
    mac10: {
        id: 'mac10', name: 'MAC-10', ammo: '9mm', magSize: 32, reloadMs: 1450,
        fireInterval: 62, automatic: true, damage: 12, bulletSpeed: 1110, spread: 0.085,
        pellets: 1, barrel: 34, width: 15, moveScale: 0.86, shotSlowMs: 120,
        appearance: 'smg', color: '#26282a', accent: '#101112', magColor: '#191a1c'
    },
    ump9: {
        id: 'ump9', name: 'UMP9', ammo: '9mm', magSize: 30, reloadMs: 1600,
        fireInterval: 105, automatic: true, damage: 21, bulletSpeed: 1300, spread: 0.035,
        pellets: 1, barrel: 48, width: 14, moveScale: 0.80, shotSlowMs: 150,
        appearance: 'smg', color: '#474941', accent: '#191a18', magColor: '#272925'
    },
    vector: {
        id: 'vector', name: 'Vector', ammo: '9mm', magSize: 25, reloadMs: 1500,
        fireInterval: 52, automatic: true, damage: 13, bulletSpeed: 1280, spread: 0.045,
        pellets: 1, barrel: 43, width: 15, moveScale: 0.82, shotSlowMs: 135,
        appearance: 'smg', color: '#30383b', accent: '#111516', magColor: '#202426'
    },
    famas: {
        id: 'famas', name: 'FAMAS', ammo: '5.56', magSize: 30, reloadMs: 1650,
        fireInterval: 78, automatic: true, burstCount: 3, burstPauseMs: 320, damage: 23,
        bulletSpeed: 1470, spread: 0.032, pellets: 1, barrel: 53, width: 13,
        moveScale: 0.69, shotSlowMs: 160, appearance: 'rifle', color: '#60654b', accent: '#22261c', magColor: '#2b2d27'
    },
    bar1918: {
        id: 'bar1918', name: 'BAR M1918', ammo: '7.62', magSize: 20, reloadMs: 2050,
        fireInterval: 150, automatic: true, damage: 31, bulletSpeed: 1490, spread: 0.052,
        pellets: 1, barrel: 65, width: 13, moveScale: 0.59, shotSlowMs: 205,
        appearance: 'rifle', color: '#6d4829', accent: '#22170f', magColor: '#26221e'
    },
    m1garand: {
        id: 'm1garand', name: 'M1 Garand', ammo: '7.62', magSize: 8, reloadMs: 1850,
        fireInterval: 360, automatic: false, damage: 48, bulletSpeed: 1630, spread: 0.021,
        pellets: 1, barrel: 62, width: 11, moveScale: 0.73, shotSlowMs: 210,
        appearance: 'marksman', color: '#76502d', accent: '#241810', magColor: '#1d1d1d'
    },
    ot38: {
        id: 'ot38', name: 'OT-38', ammo: '7.62', magSize: 5, reloadMs: 2000,
        fireInterval: 430, automatic: false, damage: 42, bulletSpeed: 1370, spread: 0.035,
        pellets: 1, barrel: 34, width: 11, moveScale: 0.87, shotSlowMs: 145,
        appearance: 'pistol', color: '#72716a', accent: '#232320', magColor: '#343430'
    },
    saiga12: {
        id: 'saiga12', name: 'Saiga-12', ammo: '12g', magSize: 8, reloadMs: 2050,
        fireInterval: 245, automatic: true, damage: 12, bulletSpeed: 1080, spread: 0.145,
        pellets: 6, barrel: 54, width: 14, moveScale: 0.55, shotSlowMs: 250,
        appearance: 'shotgun', color: '#343536', accent: '#111111', magColor: '#212121'
    },
    sv98: {
        id: 'sv98', name: 'SV-98', ammo: '7.62', magSize: 10, reloadMs: 2250,
        fireInterval: 1120, automatic: false, damage: 88, bulletSpeed: 1900, spread: 0.008,
        pellets: 1, barrel: 70, width: 10, moveScale: 0.52, shotSlowMs: 420,
        appearance: 'sniper', color: '#66704f', accent: '#202619', magColor: '#1b1d19'
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
    spawn: { x: 2800, y: 3740 },
    lakes: [
        { x: 2800, y: 2780, rx: 650, ry: 430, rotation: -0.08, slowScale: 0.58 }
    ],
    trees: [
        { x: 620, y: 540, r: 158, trunk: 44, hp: 180 }, { x: 1380, y: 500, r: 150, trunk: 42, hp: 180 },
        { x: 2060, y: 560, r: 165, trunk: 45, hp: 185 }, { x: 3550, y: 520, r: 154, trunk: 43, hp: 180 },
        { x: 5050, y: 590, r: 168, trunk: 46, hp: 190 }, { x: 560, y: 1660, r: 156, trunk: 43, hp: 180 },
        { x: 1540, y: 1670, r: 172, trunk: 47, hp: 190 }, { x: 2240, y: 1660, r: 148, trunk: 41, hp: 180 },
        { x: 3390, y: 1650, r: 162, trunk: 45, hp: 185 }, { x: 4840, y: 1680, r: 154, trunk: 43, hp: 180 },
        { x: 700, y: 2720, r: 165, trunk: 45, hp: 185 }, { x: 1560, y: 2620, r: 148, trunk: 41, hp: 180 },
        { x: 1810, y: 3220, r: 160, trunk: 44, hp: 180 }, { x: 3780, y: 2570, r: 155, trunk: 43, hp: 180 },
        { x: 4160, y: 3190, r: 168, trunk: 46, hp: 190 }, { x: 5120, y: 2820, r: 158, trunk: 44, hp: 180 },
        { x: 560, y: 3890, r: 170, trunk: 47, hp: 190 }, { x: 1510, y: 3890, r: 154, trunk: 43, hp: 180 },
        { x: 2140, y: 4220, r: 162, trunk: 45, hp: 185 }, { x: 3560, y: 3970, r: 154, trunk: 43, hp: 180 },
        { x: 4840, y: 4030, r: 170, trunk: 47, hp: 190 }, { x: 680, y: 5140, r: 158, trunk: 44, hp: 180 },
        { x: 1940, y: 5060, r: 165, trunk: 45, hp: 185 }, { x: 3030, y: 5080, r: 150, trunk: 42, hp: 180 },
        { x: 3970, y: 5000, r: 165, trunk: 45, hp: 185 }, { x: 5100, y: 5100, r: 172, trunk: 47, hp: 190 }
    ],
    rocks: [
        { x: 420, y: 1120, r: 58, hp: 240 }, { x: 1810, y: 1120, r: 62, hp: 250 },
        { x: 2690, y: 670, r: 55, hp: 235 }, { x: 3830, y: 1120, r: 61, hp: 250 },
        { x: 5260, y: 1260, r: 57, hp: 240 }, { x: 980, y: 2190, r: 63, hp: 250 },
        { x: 1980, y: 2320, r: 54, hp: 235 }, { x: 3630, y: 2200, r: 60, hp: 245 },
        { x: 4660, y: 2390, r: 56, hp: 240 }, { x: 1140, y: 3260, r: 61, hp: 250 },
        { x: 2020, y: 3470, r: 55, hp: 235 }, { x: 3660, y: 3490, r: 60, hp: 245 },
        { x: 4950, y: 3420, r: 63, hp: 250 }, { x: 860, y: 4550, r: 57, hp: 240 },
        { x: 2530, y: 4510, r: 61, hp: 250 }, { x: 4470, y: 4550, r: 55, hp: 235 },
        { x: 5360, y: 4540, r: 60, hp: 245 }
    ],
    containers: [
        { x: 2590, y: 1040, w: 440, h: 170, opening: 'right' },
        { x: 1430, y: 2460, w: 400, h: 165, opening: 'left' },
        { x: 4210, y: 2360, w: 420, h: 170, opening: 'right' },
        { x: 2510, y: 4520, w: 430, h: 170, opening: 'left' },
        { x: 4460, y: 4760, w: 400, h: 165, opening: 'left' }
    ],
    houses: [
        { x: 1040, y: 980, w: 920, h: 840 },
        { x: 4540, y: 1010, w: 920, h: 840 },
        { x: 1040, y: 4620, w: 920, h: 840 },
        { x: 4550, y: 3970, w: 920, h: 840 }
    ],
    barrels: [
        { x: 540, y: 2480, r: 28, hp: 95 }, { x: 1770, y: 1960, r: 28, hp: 95 },
        { x: 3900, y: 1880, r: 28, hp: 95 }, { x: 5120, y: 2050, r: 28, hp: 95 },
        { x: 740, y: 3540, r: 28, hp: 95 }, { x: 1830, y: 4710, r: 28, hp: 95 },
        { x: 3810, y: 4450, r: 28, hp: 95 }, { x: 5250, y: 3650, r: 28, hp: 95 }
    ],
    rareCrates: [
        { x: 2660, y: 520 }, { x: 5200, y: 2640 }, { x: 340, y: 3320 }, { x: 3190, y: 5200 }
    ],
    crates: [
        { x: 370, y: 520, loot: 'dualberetta' }, { x: 1660, y: 740, loot: 'mac10' },
        { x: 3050, y: 760, loot: 'famas' }, { x: 3890, y: 650, loot: 'sv98' },
        { x: 5250, y: 740, loot: 'ammo556' }, { x: 470, y: 1880, loot: 'scope2' },
        { x: 1180, y: 2100, loot: 'ump9' }, { x: 2100, y: 2000, loot: 'meds' },
        { x: 3500, y: 1920, loot: 'saiga12' }, { x: 4870, y: 1900, loot: 'armor1' },
        { x: 680, y: 3000, loot: 'ot38' }, { x: 1750, y: 2910, loot: 'ammo762' },
        { x: 3900, y: 2920, loot: 'vector' }, { x: 5050, y: 3010, loot: 'scope4' },
        { x: 480, y: 4100, loot: 'm1garand' }, { x: 1720, y: 4080, loot: 'bar1918' },
        { x: 3010, y: 4010, loot: 'm416' }, { x: 3740, y: 4100, loot: 'ak47' },
        { x: 5180, y: 4460, loot: 'armor2' }, { x: 350, y: 5240, loot: 'shotgun' },
        { x: 1520, y: 5200, loot: 'ammo9' }, { x: 2470, y: 5220, loot: 'mosin' },
        { x: 3820, y: 5230, loot: 'ammo12' }, { x: 5220, y: 5200, loot: 'backpack2' }
    ],
    botSpawnPoints: [
        { x: 2800, y: 420 }, { x: 3650, y: 520 }, { x: 5280, y: 1550 },
        { x: 5200, y: 2550 }, { x: 5250, y: 3400 }, { x: 5360, y: 5000 },
        { x: 3900, y: 5220 }, { x: 2800, y: 5180 }, { x: 1750, y: 5220 },
        { x: 380, y: 5100 }, { x: 360, y: 3820 }, { x: 380, y: 2600 },
        { x: 420, y: 1550 }, { x: 1900, y: 1520 }, { x: 3460, y: 1510 },
        { x: 1740, y: 3500 }, { x: 3830, y: 3530 }, { x: 3320, y: 3780 }
    ],
    lootSpawns: [
        { kind: 'weapon', subtype: 'mp5', x: 2490, y: 1050, loaded: 0 },
        { kind: 'ammo', subtype: '9mm', amount: 48, x: 2560, y: 1020 },
        { kind: 'ammo', subtype: '9mm', amount: 48, x: 2630, y: 1080 },
        { kind: 'equipment', subtype: 'backpack', level: 1, x: 2700, y: 1035 },

        { kind: 'weapon', subtype: 'dualberetta', x: 1350, y: 2460, loaded: 0 },
        { kind: 'ammo', subtype: '9mm', amount: 48, x: 1420, y: 2420 },
        { kind: 'ammo', subtype: '9mm', amount: 48, x: 1500, y: 2490 },

        { kind: 'weapon', subtype: 'saiga12', x: 4140, y: 2350, loaded: 0 },
        { kind: 'ammo', subtype: '12g', amount: 10, x: 4210, y: 2320 },
        { kind: 'ammo', subtype: '12g', amount: 10, x: 4290, y: 2390 },

        { kind: 'weapon', subtype: 'famas', x: 2410, y: 4520, loaded: 0 },
        { kind: 'ammo', subtype: '5.56', amount: 30, x: 2480, y: 4490 },
        { kind: 'ammo', subtype: '5.56', amount: 30, x: 2560, y: 4550 },
        { kind: 'scope', subtype: 2, x: 2640, y: 4510 },

        { kind: 'weapon', subtype: 'vector', x: 4380, y: 4760, loaded: 0 },
        { kind: 'ammo', subtype: '9mm', amount: 48, x: 4460, y: 4730 },
        { kind: 'ammo', subtype: '9mm', amount: 48, x: 4530, y: 4800 },

        { kind: 'heal', subtype: 'bandage', amount: 5, x: 2600, y: 3690 },
        { kind: 'heal', subtype: 'soda', amount: 1, x: 2700, y: 3700 },
        { kind: 'throwable', subtype: 'frag', amount: 2, x: 2900, y: 3700 },
        { kind: 'equipment', subtype: 'helmet', level: 1, x: 3000, y: 3690 },
        { kind: 'equipment', subtype: 'vest', level: 1, x: 3100, y: 3700 },

        { kind: 'weapon', subtype: 'ump9', x: 2050, y: 3650, loaded: 0 },
        { kind: 'ammo', subtype: '9mm', amount: 48, x: 2120, y: 3680 },
        { kind: 'weapon', subtype: 'bar1918', x: 3540, y: 3660, loaded: 0 },
        { kind: 'ammo', subtype: '7.62', amount: 30, x: 3620, y: 3690 },
        { kind: 'weapon', subtype: 'sv98', x: 3150, y: 5000, loaded: 0 },
        { kind: 'ammo', subtype: '7.62', amount: 30, x: 3230, y: 5030 }
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
        { weight: 2, spec: { kind: 'weapon', subtype: 'mosin', loaded: 0 } },
        { weight: 3, spec: { kind: 'weapon', subtype: 'saiga12', loaded: 0 } },
        { weight: 3, spec: { kind: 'weapon', subtype: 'bar1918', loaded: 0 } },
        { weight: 2, spec: { kind: 'weapon', subtype: 'sv98', loaded: 0 } },
        { weight: 4, spec: { kind: 'weapon', subtype: 'famas', loaded: 0 } }
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
    dualberetta: [
        { kind: 'weapon', subtype: 'dualberetta', loaded: 0 }, { kind: 'ammo', subtype: '9mm', amount: 48 }, { kind: 'ammo', subtype: '9mm', amount: 48 }
    ],
    mac10: [
        { kind: 'weapon', subtype: 'mac10', loaded: 0 }, { kind: 'ammo', subtype: '9mm', amount: 48 }, { kind: 'ammo', subtype: '9mm', amount: 48 }
    ],
    ump9: [
        { kind: 'weapon', subtype: 'ump9', loaded: 0 }, { kind: 'ammo', subtype: '9mm', amount: 48 }, { kind: 'ammo', subtype: '9mm', amount: 48 }
    ],
    vector: [
        { kind: 'weapon', subtype: 'vector', loaded: 0 }, { kind: 'ammo', subtype: '9mm', amount: 48 }, { kind: 'ammo', subtype: '9mm', amount: 48 }
    ],
    famas: [
        { kind: 'weapon', subtype: 'famas', loaded: 0 }, { kind: 'ammo', subtype: '5.56', amount: 30 }, { kind: 'ammo', subtype: '5.56', amount: 30 }
    ],
    bar1918: [
        { kind: 'weapon', subtype: 'bar1918', loaded: 0 }, { kind: 'ammo', subtype: '7.62', amount: 30 }, { kind: 'ammo', subtype: '7.62', amount: 30 }
    ],
    m1garand: [
        { kind: 'weapon', subtype: 'm1garand', loaded: 0 }, { kind: 'ammo', subtype: '7.62', amount: 30 }, { kind: 'ammo', subtype: '7.62', amount: 30 }
    ],
    ot38: [
        { kind: 'weapon', subtype: 'ot38', loaded: 0 }, { kind: 'ammo', subtype: '7.62', amount: 30 }, { kind: 'ammo', subtype: '7.62', amount: 30 }
    ],
    saiga12: [
        { kind: 'weapon', subtype: 'saiga12', loaded: 0 }, { kind: 'ammo', subtype: '12g', amount: 10 }, { kind: 'ammo', subtype: '12g', amount: 10 }
    ],
    sv98: [
        { kind: 'weapon', subtype: 'sv98', loaded: 0 }, { kind: 'ammo', subtype: '7.62', amount: 30 }, { kind: 'ammo', subtype: '7.62', amount: 30 }
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
