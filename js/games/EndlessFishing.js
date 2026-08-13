const FISH_TYPES = [
    {
        id: 'sardine',
        name: 'Sardine',
        rarity: 'Common',
        color: '#78ddff',
        accent: '#c6f5ff',
        requiredBait: 1,
        baitTier: 2,
        canBait: true,
        minDepth: 0.05,
        maxDepth: 0.34,
        value: [18, 28],
        size: [16, 21],
        speed: [35, 52],
        stamina: [28, 38],
        pull: 0.46,
        weight: 30
    },
    {
        id: 'perch',
        name: 'Perch',
        rarity: 'Common',
        color: '#8fe46f',
        accent: '#d3f4a8',
        requiredBait: 1,
        baitTier: 2,
        canBait: true,
        minDepth: 0.10,
        maxDepth: 0.46,
        value: [25, 42],
        size: [18, 24],
        speed: [32, 48],
        stamina: [34, 44],
        pull: 0.52,
        weight: 27
    },
    {
        id: 'trout',
        name: 'Trout',
        rarity: 'Uncommon',
        color: '#ffc36b',
        accent: '#ffe0a4',
        requiredBait: 2,
        baitTier: 3,
        canBait: true,
        minDepth: 0.25,
        maxDepth: 0.63,
        value: [65, 95],
        size: [23, 30],
        speed: [42, 61],
        stamina: [52, 68],
        pull: 0.72,
        weight: 19
    },
    {
        id: 'pike',
        name: 'Pike',
        rarity: 'Rare',
        color: '#65dba8',
        accent: '#b7f4d8',
        requiredBait: 2,
        baitTier: 3,
        canBait: true,
        minDepth: 0.32,
        maxDepth: 0.72,
        value: [95, 145],
        size: [28, 38],
        speed: [48, 68],
        stamina: [66, 82],
        pull: 0.86,
        weight: 13
    },
    {
        id: 'salmon',
        name: 'Salmon',
        rarity: 'Rare',
        color: '#ff88a6',
        accent: '#ffc2d0',
        requiredBait: 3,
        baitTier: 4,
        canBait: true,
        minDepth: 0.48,
        maxDepth: 0.82,
        value: [155, 225],
        size: [30, 41],
        speed: [55, 76],
        stamina: [82, 108],
        pull: 1.02,
        weight: 9
    },
    {
        id: 'tuna',
        name: 'Tuna',
        rarity: 'Epic',
        color: '#8c9eff',
        accent: '#d1d7ff',
        requiredBait: 3,
        baitTier: 4,
        canBait: true,
        minDepth: 0.56,
        maxDepth: 0.91,
        value: [240, 340],
        size: [36, 47],
        speed: [64, 88],
        stamina: [108, 138],
        pull: 1.18,
        weight: 6
    },
    {
        id: 'marlin',
        name: 'Marlin',
        rarity: 'Legendary',
        color: '#b66cff',
        accent: '#ead2ff',
        requiredBait: 4,
        baitTier: null,
        canBait: false,
        minDepth: 0.70,
        maxDepth: 0.98,
        value: [520, 760],
        size: [44, 57],
        speed: [74, 100],
        stamina: [145, 190],
        pull: 1.42,
        weight: 3
    },
    {
        id: 'abyss_king',
        name: 'Abyss King',
        rarity: 'Mythic',
        color: '#ffd45e',
        accent: '#fff2ab',
        requiredBait: 4,
        baitTier: null,
        canBait: false,
        minDepth: 0.82,
        maxDepth: 1.00,
        value: [1100, 1550],
        size: [58, 72],
        speed: [82, 112],
        stamina: [205, 260],
        pull: 1.72,
        weight: 1
    }
];

const BAIT_TIERS = {
    1: { label: 'Worm', short: 'Bait I', color: '#ffd166' },
    2: { label: 'Small Fish', short: 'Bait II', color: '#72dcff' },
    3: { label: 'Medium Fish', short: 'Bait III', color: '#6be0a8' },
    4: { label: 'Large Fish', short: 'Bait IV', color: '#b77cff' }
};

const SHOP_UPGRADES = {
    line: {
        label: 'Line Strength',
        icon: '◆',
        description: 'Mehr Spannung aushalten.',
        basePrice: 130,
        priceScale: 1.58,
        maxLevel: 6
    },
    reel: {
        label: 'Reel Speed',
        icon: '↟',
        description: 'Fisch schneller einholen.',
        basePrice: 150,
        priceScale: 1.60,
        maxLevel: 6
    },
    sinker: {
        label: 'Heavy Sinker',
        icon: '↓',
        description: 'Schneller sinken und tiefer kommen.',
        basePrice: 115,
        priceScale: 1.55,
        maxLevel: 5
    },
    hook: {
        label: 'Hook Size',
        icon: 'J',
        description: 'Größere Bite- und Hook-Zone.',
        basePrice: 145,
        priceScale: 1.62,
        maxLevel: 5
    }
};

const CONFIG = {
    startLives: 3,
    maxLives: 4,
    freeWormTier: 1,

    castDuration: 0.58,
    sinkSpeed: 88,
    steerSpeed: 115,
    passiveDrift: 13,

    baseReelSpeed: 95,
    fastReelMultiplier: 1.42,

    baseLineStrength: 100,
    tensionGain: 38,
    tensionRecovery: 34,
    lineSnapGrace: 0.52,

    fishDetectionRadius: 105,
    hookRadius: 10,

    fishTargetCount: 18,
    maxDepthMeters: 320,

    comboWindow: 28,
    comboValueStep: 0.10,
    comboValueCap: 1.9,

    rareNoticeCooldown: 1.7
};

const COLORS = {
    bg: '#07101a',
    bg2: '#0b1726',
    panel: '#111d2c',
    panel2: '#1a2b40',
    text: '#f4f8ff',
    muted: '#7f94aa',
    cyan: '#31dcff',
    cyan2: '#8df2ff',
    blue: '#4f86ff',
    green: '#55e69a',
    gold: '#ffd166',
    pink: '#ff5b88',
    purple: '#b368ff',
    red: '#ff4d6d'
};

export default {
    manifest: {
        id: 'endless-fishing',
        name: 'Endless Fishing',
        description: 'Fange kleine Fische, verwende sie als Köder für größere Beute und meistere harte Fischkämpfe.',
        icon: '🎣',
        tags: ['Arcade', 'Action']
    },

    init: (container, services) => {
        let destroyed = false;
        let animationId = null;
        let resizeObserver = null;
        let lastFrame = performance.now();

        let gameRunning = false;
        let gameEnded = false;
        let phase = 'menu';

        let money = 0;
        let score = 0;
        let catches = 0;
        let bestCatchValue = 0;
        let biggestFishName = '—';
        let lives = CONFIG.startLives;

        let combo = 0;
        let comboTimer = 0;
        let bestCombo = 0;

        let bait = {
            tier: 1,
            label: BAIT_TIERS[1].label,
            sourceFish: null,
            color: BAIT_TIERS[1].color
        };

        let baitConsumedThisCast = false;

        let upgrades = {
            line: 0,
            reel: 0,
            sinker: 0,
            hook: 0
        };

        let world = {
            width: 0,
            height: 0,
            surfaceY: 110,
            bottomY: 0,
            rodX: 0,
            rodY: 0,
            depthHeight: 0
        };

        let hook = {
            x: 0,
            y: 0,
            castStartX: 0,
            castStartY: 0,
            castEndX: 0,
            castEndY: 0,
            castT: 0,
            tension: 0,
            snapTimer: 0
        };

        let reelHeld = false;
        let pointerX = 0;
        let aimX = 0;

        let fish = [];
        let hookedFish = null;
        let hookedFishStartStamina = 1;

        let catchResult = null;

        let particles = [];
        let floatTexts = [];
        let bubbles = [];
        let rareNoticeTimer = 0;

        let muted = false;
        let audioContext = null;

        const timers = new Set();

        const style = document.createElement('style');
        style.textContent = `
            .ef2-game {
                --bg:${COLORS.bg};
                --panel:${COLORS.panel};
                --text:${COLORS.text};
                --muted:${COLORS.muted};
                --cyan:${COLORS.cyan};
                --cyan2:${COLORS.cyan2};
                --green:${COLORS.green};
                --gold:${COLORS.gold};
                --pink:${COLORS.pink};
                --purple:${COLORS.purple};
                --red:${COLORS.red};

                position:relative;
                width:100%;
                height:100%;
                overflow:hidden;
                color:var(--text);
                font-family:inherit;
                user-select:none;
                background:var(--bg);
            }

            .ef2-game * { box-sizing:border-box; }

            .ef2-canvas {
                width:100%;
                height:100%;
                display:block;
                touch-action:none;
            }

            .ef2-top {
                position:absolute;
                z-index:15;
                left:14px;
                right:14px;
                top:14px;
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                gap:10px;
                pointer-events:none;
            }

            .ef2-top-group {
                display:flex;
                gap:7px;
                flex-wrap:wrap;
            }

            .ef2-stat {
                min-width:96px;
                padding:8px 10px;
                border-radius:11px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(11,20,33,.80);
                backdrop-filter:blur(10px);
            }

            .ef2-stat-label {
                color:#71869e;
                font-size:.58rem;
                font-weight:850;
                text-transform:uppercase;
                letter-spacing:.08em;
            }

            .ef2-stat-value {
                margin-top:2px;
                font-size:.94rem;
                font-weight:950;
            }

            .ef2-money { color:var(--green); }
            .ef2-score { color:var(--cyan2); }
            .ef2-combo { color:var(--gold); }
            .ef2-lives { color:var(--pink); }

            .ef2-bait {
                position:absolute;
                z-index:16;
                left:50%;
                top:13px;
                transform:translateX(-50%);
                min-width:180px;
                padding:8px 12px;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(11,20,33,.84);
                backdrop-filter:blur(10px);
                text-align:center;
                pointer-events:none;
            }

            .ef2-bait-label {
                color:#72879e;
                font-size:.56rem;
                font-weight:850;
                text-transform:uppercase;
                letter-spacing:.08em;
            }

            .ef2-bait-value {
                margin-top:2px;
                font-size:.83rem;
                font-weight:950;
            }

            .ef2-status {
                position:absolute;
                z-index:14;
                left:50%;
                top:73px;
                transform:translateX(-50%);
                min-width:310px;
                text-align:center;
                pointer-events:none;
            }

            .ef2-status-main {
                font-size:clamp(1.15rem,2.4vw,1.7rem);
                font-weight:950;
            }

            .ef2-status-sub {
                margin-top:4px;
                color:#8196ad;
                font-size:.69rem;
            }

            .ef2-status.good .ef2-status-main { color:var(--green); }
            .ef2-status.bad .ef2-status-main { color:var(--pink); }
            .ef2-status.gold .ef2-status-main { color:var(--gold); }

            .ef2-depth {
                position:absolute;
                z-index:13;
                right:14px;
                top:79px;
                width:105px;
                padding:9px 10px;
                border-radius:11px;
                border:1px solid rgba(255,255,255,.07);
                background:rgba(11,20,33,.76);
                backdrop-filter:blur(9px);
                pointer-events:none;
            }

            .ef2-depth-label {
                color:#71869e;
                font-size:.56rem;
                font-weight:850;
                text-transform:uppercase;
            }

            .ef2-depth-value {
                margin-top:3px;
                font-size:.87rem;
                font-weight:950;
            }

            .ef2-depth-zone {
                margin-top:1px;
                color:#70869d;
                font-size:.59rem;
            }

            .ef2-shop-btn,
            .ef2-audio {
                position:absolute;
                z-index:18;
                bottom:16px;
                padding:9px 11px;
                border-radius:10px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(11,20,33,.80);
                color:#a5b8ca;
                font:inherit;
                font-size:.68rem;
                font-weight:850;
                cursor:pointer;
            }

            .ef2-shop-btn {
                left:14px;
            }

            .ef2-audio {
                right:14px;
            }

            .ef2-shop-btn:hover,
            .ef2-audio:hover {
                border-color:rgba(49,220,255,.26);
                color:#dce8f4;
            }

            .ef2-bottom {
                position:absolute;
                z-index:15;
                left:50%;
                bottom:14px;
                transform:translateX(-50%);
                width:min(650px,calc(100% - 170px));
                display:grid;
                grid-template-columns:1fr 1.3fr;
                gap:8px;
                align-items:end;
                pointer-events:none;
            }

            .ef2-help-panel,
            .ef2-fight-panel {
                min-height:56px;
                padding:10px 12px;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.07);
                background:rgba(11,20,33,.79);
                backdrop-filter:blur(10px);
            }

            .ef2-panel-label {
                color:#72879e;
                font-size:.56rem;
                font-weight:850;
                text-transform:uppercase;
                letter-spacing:.07em;
            }

            .ef2-help-main {
                margin-top:4px;
                color:#d8e5f0;
                font-size:.72rem;
                font-weight:900;
            }

            .ef2-help-sub {
                margin-top:2px;
                color:#71879e;
                font-size:.59rem;
            }

            .ef2-fight-head {
                display:flex;
                justify-content:space-between;
                gap:8px;
                margin-bottom:5px;
                color:#89a0b8;
                font-size:.61rem;
                font-weight:850;
            }

            .ef2-track {
                height:9px;
                border-radius:99px;
                overflow:hidden;
                position:relative;
                background:rgba(255,255,255,.06);
            }

            .ef2-tension-safe {
                position:absolute;
                left:28%;
                width:47%;
                top:0;
                bottom:0;
                background:rgba(85,230,154,.13);
            }

            .ef2-tension-danger {
                position:absolute;
                right:0;
                width:18%;
                top:0;
                bottom:0;
                background:rgba(255,77,109,.16);
            }

            .ef2-tension-fill {
                height:100%;
                width:0%;
                position:relative;
                z-index:2;
                background:linear-gradient(90deg,var(--cyan),var(--gold),var(--red));
            }

            .ef2-stamina-wrap {
                margin-top:7px;
            }

            .ef2-stamina-fill {
                height:100%;
                width:100%;
                background:linear-gradient(90deg,var(--purple),var(--pink));
            }

            .ef2-overlay {
                position:absolute;
                inset:0;
                z-index:40;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:24px;
                background:rgba(4,8,15,.75);
                backdrop-filter:blur(9px);
            }

            .ef2-overlay.hidden { display:none; }

            .ef2-card {
                width:min(980px,100%);
                max-height:calc(100% - 8px);
                overflow:auto;
                padding:32px;
                border-radius:22px;
                border:1px solid rgba(255,255,255,.09);
                background:linear-gradient(180deg,rgba(27,43,63,.98),rgba(12,22,35,.98));
                box-shadow:0 30px 90px rgba(0,0,0,.44);
            }

            .ef2-kicker {
                color:var(--cyan);
                font-size:.72rem;
                font-weight:950;
                text-transform:uppercase;
                letter-spacing:.16em;
            }

            .ef2-title {
                margin:6px 0 9px;
                font-size:clamp(2.7rem,5vw,4.5rem);
                line-height:1;
                font-weight:950;
                letter-spacing:-.045em;
            }

            .ef2-desc {
                max-width:790px;
                color:#8da1b8;
                line-height:1.55;
                margin-bottom:22px;
            }

            .ef2-flow {
                display:grid;
                grid-template-columns:repeat(5,1fr);
                gap:8px;
                margin-bottom:18px;
            }

            .ef2-flow-card {
                padding:12px 10px;
                text-align:center;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.06);
                background:rgba(255,255,255,.025);
            }

            .ef2-flow-icon {
                color:var(--cyan2);
                font-size:1.25rem;
                font-weight:950;
                margin-bottom:5px;
            }

            .ef2-flow-card b {
                display:block;
                font-size:.75rem;
                margin-bottom:3px;
            }

            .ef2-flow-card span {
                display:block;
                color:#7e93aa;
                font-size:.62rem;
                line-height:1.36;
            }

            .ef2-bait-chain {
                display:flex;
                align-items:center;
                justify-content:center;
                flex-wrap:wrap;
                gap:7px;
                margin:18px 0 21px;
            }

            .ef2-chain-chip {
                padding:7px 10px;
                border-radius:99px;
                border:1px solid rgba(255,255,255,.075);
                background:rgba(255,255,255,.03);
                color:#9fb3c7;
                font-size:.65rem;
                font-weight:850;
            }

            .ef2-chain-arrow {
                color:#526b83;
                font-weight:950;
            }

            .ef2-start {
                width:100%;
                padding:14px 18px;
                border:0;
                border-radius:13px;
                cursor:pointer;
                color:#06121a;
                font:inherit;
                font-weight:950;
                background:linear-gradient(135deg,var(--cyan),#4b87ff);
                box-shadow:0 14px 34px rgba(49,220,255,.16);
            }

            .ef2-start:hover {
                filter:brightness(1.08);
                transform:translateY(-1px);
            }

            .ef2-catch-layout {
                display:grid;
                grid-template-columns:.72fr 1.28fr;
                gap:20px;
                align-items:center;
            }

            .ef2-catch-visual {
                min-height:220px;
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                border-radius:18px;
                border:1px solid rgba(255,255,255,.07);
                background:
                    radial-gradient(circle,rgba(49,220,255,.09),transparent 62%),
                    rgba(255,255,255,.02);
            }

            .ef2-catch-fish {
                width:145px;
                height:76px;
                position:relative;
                filter:drop-shadow(0 0 18px var(--catch-color));
            }

            .ef2-catch-body {
                position:absolute;
                width:96px;
                height:52px;
                left:26px;
                top:12px;
                border-radius:50%;
                background:var(--catch-color);
            }

            .ef2-catch-tail {
                position:absolute;
                left:0;
                top:15px;
                width:0;
                height:0;
                border-top:23px solid transparent;
                border-bottom:23px solid transparent;
                border-right:35px solid var(--catch-color);
            }

            .ef2-catch-eye {
                position:absolute;
                right:30px;
                top:27px;
                width:7px;
                height:7px;
                border-radius:50%;
                background:#06121a;
            }

            .ef2-catch-rarity {
                margin-top:11px;
                color:var(--catch-color);
                font-size:.72rem;
                font-weight:950;
                text-transform:uppercase;
                letter-spacing:.10em;
            }

            .ef2-catch-title {
                font-size:2.1rem;
                font-weight:950;
                margin-bottom:4px;
            }

            .ef2-catch-sub {
                color:#8196ad;
                line-height:1.45;
                margin-bottom:14px;
            }

            .ef2-catch-value {
                margin-bottom:14px;
                color:var(--green);
                font-size:1.4rem;
                font-weight:950;
            }

            .ef2-choice-grid {
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:9px;
            }

            .ef2-choice {
                padding:14px;
                border-radius:13px;
                cursor:pointer;
                text-align:left;
                color:var(--text);
                font:inherit;
                border:1px solid rgba(255,255,255,.075);
                background:rgba(255,255,255,.025);
            }

            .ef2-choice:hover {
                transform:translateY(-1px);
                border-color:rgba(49,220,255,.30);
            }

            .ef2-choice.sell {
                border-color:rgba(85,230,154,.20);
            }

            .ef2-choice.bait {
                border-color:rgba(179,104,255,.22);
            }

            .ef2-choice:disabled {
                cursor:not-allowed;
                opacity:.38;
                transform:none;
            }

            .ef2-choice b {
                display:block;
                margin-bottom:3px;
                font-size:.88rem;
            }

            .ef2-choice span {
                display:block;
                color:#7f94aa;
                font-size:.67rem;
                line-height:1.35;
            }

            .ef2-shop-title,
            .ef2-end-title {
                font-size:2.2rem;
                font-weight:950;
                margin-bottom:5px;
            }

            .ef2-shop-title { color:var(--gold); }
            .ef2-end-title { color:var(--cyan2); }

            .ef2-shop-sub,
            .ef2-end-sub {
                color:#8da1b8;
                line-height:1.5;
                margin-bottom:18px;
            }

            .ef2-shop-money {
                color:var(--green);
                font-weight:950;
            }

            .ef2-shop-grid {
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:9px;
            }

            .ef2-shop-item {
                min-width:0;
                padding:15px;
                border-radius:13px;
                border:1px solid rgba(255,255,255,.07);
                background:rgba(255,255,255,.026);
            }

            .ef2-shop-icon {
                color:var(--gold);
                font-size:1.35rem;
                font-weight:950;
                margin-bottom:7px;
            }

            .ef2-shop-item b {
                display:block;
                font-size:.84rem;
                margin-bottom:3px;
            }

            .ef2-shop-item span {
                display:block;
                min-height:35px;
                color:#7e93aa;
                font-size:.65rem;
                line-height:1.35;
            }

            .ef2-shop-level {
                margin:8px 0;
                color:#6e849b;
                font-size:.61rem;
                font-weight:850;
            }

            .ef2-buy {
                width:100%;
                padding:8px 9px;
                border-radius:9px;
                cursor:pointer;
                border:1px solid rgba(255,209,102,.20);
                background:rgba(255,209,102,.065);
                color:#f5d87f;
                font:inherit;
                font-size:.67rem;
                font-weight:900;
            }

            .ef2-buy:disabled {
                opacity:.35;
                cursor:not-allowed;
            }

            .ef2-close {
                width:100%;
                margin-top:14px;
                padding:11px;
                border-radius:10px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(255,255,255,.035);
                color:#dce7f2;
                font:inherit;
                font-weight:900;
                cursor:pointer;
            }

            .ef2-end-stats {
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:8px;
                margin-bottom:18px;
            }

            .ef2-end-stat {
                padding:12px;
                text-align:center;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.06);
                background:rgba(255,255,255,.03);
            }

            .ef2-end-stat span {
                display:block;
                color:#788da5;
                font-size:.61rem;
                font-weight:850;
                text-transform:uppercase;
            }

            .ef2-end-stat b {
                display:block;
                margin-top:3px;
                font-size:1.08rem;
            }

            @media (max-width:850px) {
                .ef2-card { padding:22px; }
                .ef2-flow { grid-template-columns:1fr 1fr; }
                .ef2-flow-card:last-child { grid-column:1 / -1; }
                .ef2-shop-grid { grid-template-columns:1fr 1fr; }
                .ef2-catch-layout { grid-template-columns:1fr; }
                .ef2-catch-visual { min-height:150px; }
                .ef2-end-stats { grid-template-columns:1fr 1fr; }
                .ef2-stat {
                    min-width:0;
                    padding:7px 8px;
                }
                .ef2-stat-label { font-size:.50rem; }
                .ef2-stat-value { font-size:.74rem; }
                .ef2-bait { top:63px; }
                .ef2-status { top:101px; }
                .ef2-bottom {
                    width:min(500px,calc(100% - 18px));
                    grid-template-columns:1fr;
                    bottom:10px;
                }
                .ef2-help-panel {
                    min-height:42px;
                }
                .ef2-shop-btn,
                .ef2-audio {
                    bottom:132px;
                }
                .ef2-depth {
                    top:104px;
                    right:7px;
                }
            }
        `;

        const root = document.createElement('div');
        root.className = 'ef2-game';
        root.innerHTML = `
            <canvas class="ef2-canvas"></canvas>

            <div class="ef2-top">
                <div class="ef2-top-group">
                    <div class="ef2-stat">
                        <div class="ef2-stat-label">Money</div>
                        <div class="ef2-stat-value ef2-money">$0</div>
                    </div>
                    <div class="ef2-stat">
                        <div class="ef2-stat-label">Score</div>
                        <div class="ef2-stat-value ef2-score">0</div>
                    </div>
                </div>

                <div class="ef2-top-group">
                    <div class="ef2-stat">
                        <div class="ef2-stat-label">Combo</div>
                        <div class="ef2-stat-value ef2-combo">x0</div>
                    </div>
                    <div class="ef2-stat">
                        <div class="ef2-stat-label">Lives</div>
                        <div class="ef2-stat-value ef2-lives">♥♥♥</div>
                    </div>
                </div>
            </div>

            <div class="ef2-bait">
                <div class="ef2-bait-label">Current Bait</div>
                <div class="ef2-bait-value">Bait I · Worm</div>
            </div>

            <div class="ef2-status">
                <div class="ef2-status-main">AIM & CAST</div>
                <div class="ef2-status-sub">Maus bewegen · Klick zum Auswerfen.</div>
            </div>

            <div class="ef2-depth">
                <div class="ef2-depth-label">Depth</div>
                <div class="ef2-depth-value">0 m</div>
                <div class="ef2-depth-zone">Shallows</div>
            </div>

            <div class="ef2-bottom">
                <div class="ef2-help-panel">
                    <div class="ef2-panel-label">Controls</div>
                    <div class="ef2-help-main">Click = Cast · Hold Mouse = Reel</div>
                    <div class="ef2-help-sub">Release mouse to relax the line / let bait sink.</div>
                </div>

                <div class="ef2-fight-panel">
                    <div class="ef2-fight-head">
                        <span>LINE TENSION</span>
                        <span class="ef2-tension-value">0%</span>
                    </div>
                    <div class="ef2-track">
                        <div class="ef2-tension-safe"></div>
                        <div class="ef2-tension-danger"></div>
                        <div class="ef2-tension-fill"></div>
                    </div>

                    <div class="ef2-stamina-wrap">
                        <div class="ef2-fight-head">
                            <span>FISH STAMINA</span>
                            <span class="ef2-stamina-value">—</span>
                        </div>
                        <div class="ef2-track">
                            <div class="ef2-stamina-fill"></div>
                        </div>
                    </div>
                </div>
            </div>

            <button class="ef2-shop-btn" type="button">SHOP</button>
            <button class="ef2-audio" type="button">Sound: An</button>

            <div class="ef2-overlay ef2-menu">
                <div class="ef2-card">
                    <div class="ef2-kicker">Arcade Fishing / Progression</div>
                    <div class="ef2-title">Endless Fishing</div>
                    <div class="ef2-desc">
                        Fang klein an und arbeite dich nach oben: Kleine Fische können verkauft oder als besserer Köder benutzt werden.
                        Größere Köder locken größere Fische an – aber starke Fische kämpfen zurück und können deine Leine zerreißen.
                    </div>

                    <div class="ef2-flow">
                        <div class="ef2-flow-card">
                            <div class="ef2-flow-icon">↗</div>
                            <b>Cast</b>
                            <span>Maus positionieren und klicken.</span>
                        </div>
                        <div class="ef2-flow-card">
                            <div class="ef2-flow-icon">↓</div>
                            <b>Sink</b>
                            <span>Loslassen lässt den Köder tiefer sinken.</span>
                        </div>
                        <div class="ef2-flow-card">
                            <div class="ef2-flow-icon">◆</div>
                            <b>Bite</b>
                            <span>Nur passender Köder lockt große Fische.</span>
                        </div>
                        <div class="ef2-flow-card">
                            <div class="ef2-flow-icon">↟</div>
                            <b>Fight</b>
                            <span>Maus halten zum Reelen, loslassen gegen Spannung.</span>
                        </div>
                        <div class="ef2-flow-card">
                            <div class="ef2-flow-icon">$</div>
                            <b>Choose</b>
                            <span>Verkaufen oder als nächste Bait-Stufe nutzen.</span>
                        </div>
                    </div>

                    <div class="ef2-bait-chain">
                        <span class="ef2-chain-chip">Worm · I</span>
                        <span class="ef2-chain-arrow">→</span>
                        <span class="ef2-chain-chip">Small Fish · II</span>
                        <span class="ef2-chain-arrow">→</span>
                        <span class="ef2-chain-chip">Medium Fish · III</span>
                        <span class="ef2-chain-arrow">→</span>
                        <span class="ef2-chain-chip">Large Fish · IV</span>
                        <span class="ef2-chain-arrow">→</span>
                        <span class="ef2-chain-chip">Legendary / Mythic</span>
                    </div>

                    <button class="ef2-start" type="button">Fishing Run starten</button>
                </div>
            </div>

            <div class="ef2-overlay ef2-catch-overlay hidden">
                <div class="ef2-card">
                    <div class="ef2-catch-layout">
                        <div class="ef2-catch-visual">
                            <div class="ef2-catch-fish">
                                <div class="ef2-catch-tail"></div>
                                <div class="ef2-catch-body"></div>
                                <div class="ef2-catch-eye"></div>
                            </div>
                            <div class="ef2-catch-rarity">RARE</div>
                        </div>

                        <div>
                            <div class="ef2-catch-title">Fish</div>
                            <div class="ef2-catch-sub"></div>
                            <div class="ef2-catch-value">$0</div>

                            <div class="ef2-choice-grid">
                                <button class="ef2-choice sell" type="button">
                                    <b>SELL</b>
                                    <span>Geld erhalten und mit deinem aktuellen Bait weitermachen.</span>
                                </button>

                                <button class="ef2-choice bait" type="button">
                                    <b>USE AS BAIT</b>
                                    <span>Opfere den Verkauf und verwende den Fisch für größere Beute.</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="ef2-overlay ef2-shop-overlay hidden">
                <div class="ef2-card">
                    <div class="ef2-shop-title">TACKLE SHOP</div>
                    <div class="ef2-shop-sub">
                        Nutze verdientes Geld für permanente Upgrades in diesem Run.
                        Wallet: <span class="ef2-shop-money">$0</span>
                    </div>

                    <div class="ef2-shop-grid"></div>

                    <button class="ef2-close" type="button">Zurück zum Wasser</button>
                </div>
            </div>

            <div class="ef2-overlay ef2-end hidden">
                <div class="ef2-card">
                    <div class="ef2-end-title">RUN BEENDET</div>
                    <div class="ef2-end-sub"></div>

                    <div class="ef2-end-stats">
                        <div class="ef2-end-stat"><span>Score</span><b class="ef2-end-score">0</b></div>
                        <div class="ef2-end-stat"><span>Money</span><b class="ef2-end-money">$0</b></div>
                        <div class="ef2-end-stat"><span>Catches</span><b class="ef2-end-catches">0</b></div>
                        <div class="ef2-end-stat"><span>Biggest Catch</span><b class="ef2-end-biggest">—</b></div>
                    </div>

                    <button class="ef2-start ef2-restart" type="button">Nochmal</button>
                </div>
            </div>
        `;

        container.append(style, root);

        const canvas = root.querySelector('.ef2-canvas');
        const ctx = canvas.getContext('2d');

        const moneyEl = root.querySelector('.ef2-money');
        const scoreEl = root.querySelector('.ef2-score');
        const comboEl = root.querySelector('.ef2-combo');
        const livesEl = root.querySelector('.ef2-lives');

        const baitValueEl = root.querySelector('.ef2-bait-value');

        const statusEl = root.querySelector('.ef2-status');
        const statusMainEl = root.querySelector('.ef2-status-main');
        const statusSubEl = root.querySelector('.ef2-status-sub');

        const depthValueEl = root.querySelector('.ef2-depth-value');
        const depthZoneEl = root.querySelector('.ef2-depth-zone');

        const tensionFillEl = root.querySelector('.ef2-tension-fill');
        const tensionValueEl = root.querySelector('.ef2-tension-value');
        const staminaFillEl = root.querySelector('.ef2-stamina-fill');
        const staminaValueEl = root.querySelector('.ef2-stamina-value');

        const shopBtn = root.querySelector('.ef2-shop-btn');
        const audioBtn = root.querySelector('.ef2-audio');

        const menuOverlay = root.querySelector('.ef2-menu');
        const catchOverlay = root.querySelector('.ef2-catch-overlay');
        const shopOverlay = root.querySelector('.ef2-shop-overlay');
        const endOverlay = root.querySelector('.ef2-end');

        const startBtn = root.querySelector('.ef2-menu .ef2-start');
        const restartBtn = root.querySelector('.ef2-restart');

        const catchVisualEl = root.querySelector('.ef2-catch-visual');
        const catchRarityEl = root.querySelector('.ef2-catch-rarity');
        const catchTitleEl = root.querySelector('.ef2-catch-title');
        const catchSubEl = root.querySelector('.ef2-catch-sub');
        const catchValueEl = root.querySelector('.ef2-catch-value');
        const sellBtn = root.querySelector('.ef2-choice.sell');
        const baitBtn = root.querySelector('.ef2-choice.bait');

        const shopMoneyEl = root.querySelector('.ef2-shop-money');
        const shopGridEl = root.querySelector('.ef2-shop-grid');
        const shopCloseBtn = root.querySelector('.ef2-close');

        const endSubEl = root.querySelector('.ef2-end-sub');
        const endScoreEl = root.querySelector('.ef2-end-score');
        const endMoneyEl = root.querySelector('.ef2-end-money');
        const endCatchesEl = root.querySelector('.ef2-end-catches');
        const endBiggestEl = root.querySelector('.ef2-end-biggest');

        const rand = (min, max) => min + Math.random() * (max - min);
        const randInt = (min, max) => Math.floor(rand(min, max + 1));
        const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

        const schedule = (fn, delay) => {
            const id = setTimeout(() => {
                timers.delete(id);
                if (!destroyed) fn();
            }, delay);

            timers.add(id);
            return id;
        };

        const clearTimers = () => {
            timers.forEach(id => clearTimeout(id));
            timers.clear();
        };

        const ensureAudio = () => {
            if (muted) return null;

            try {
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }

                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }

                return audioContext;
            } catch {
                return null;
            }
        };

        const tone = (frequency, duration = 0.05, volume = 0.025, type = 'sine') => {
            if (muted) return;

            const ac = ensureAudio();
            if (!ac) return;

            const osc = ac.createOscillator();
            const gain = ac.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(frequency, ac.currentTime);

            gain.gain.setValueAtTime(volume, ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);

            osc.connect(gain);
            gain.connect(ac.destination);

            osc.start();
            osc.stop(ac.currentTime + duration);
        };

        const setStatus = (main, sub = '', kind = '') => {
            statusEl.className = `ef2-status ${kind}`;
            statusMainEl.textContent = main;
            statusSubEl.textContent = sub;
        };

        const currentLineStrength = () =>
            CONFIG.baseLineStrength *
            (1 + upgrades.line * 0.18);

        const currentReelSpeed = () =>
            CONFIG.baseReelSpeed *
            (1 + upgrades.reel * 0.13);

        const currentSinkSpeed = () =>
            CONFIG.sinkSpeed *
            (1 + upgrades.sinker * 0.15);

        const currentMaxDepthRatio = () =>
            Math.min(
                0.985,
                0.76 + upgrades.sinker * 0.045
            );

        const currentHookRadius = () =>
            CONFIG.hookRadius +
            upgrades.hook * 3.2;

        const currentDetectionRadius = () =>
            CONFIG.fishDetectionRadius +
            upgrades.hook * 12;

        const upgradePrice = id => {
            const def = SHOP_UPGRADES[id];
            const level = upgrades[id];

            return Math.round(
                def.basePrice *
                Math.pow(def.priceScale, level)
            );
        };

        const hookDepthRatio = () =>
            clamp(
                (hook.y - world.surfaceY) /
                Math.max(1, world.bottomY - world.surfaceY),
                0,
                1
            );

        const depthMeters = () =>
            Math.round(
                hookDepthRatio() *
                CONFIG.maxDepthMeters
            );

        const depthZone = ratio => {
            if (ratio < 0.32) return 'Shallows';
            if (ratio < 0.67) return 'Bluewater';
            return 'Deep Water';
        };

        const updateHud = () => {
            moneyEl.textContent = `$${Math.round(money).toLocaleString('de-DE')}`;
            scoreEl.textContent = Math.round(score).toLocaleString('de-DE');
            comboEl.textContent = `x${combo}`;
            livesEl.textContent = '♥'.repeat(Math.max(0, lives)) || '0';

            baitValueEl.textContent =
                `${BAIT_TIERS[bait.tier].short} · ${bait.label}`;

            baitValueEl.style.color =
                bait.color;

            const depth = depthMeters();

            depthValueEl.textContent =
                `${depth} m`;

            depthZoneEl.textContent =
                depthZone(hookDepthRatio());

            const tensionPercent =
                clamp(
                    hook.tension /
                    currentLineStrength() *
                    100,
                    0,
                    100
                );

            tensionFillEl.style.width =
                `${tensionPercent}%`;

            tensionValueEl.textContent =
                `${Math.round(tensionPercent)}%`;

            if (hookedFish) {
                const staminaPercent =
                    clamp(
                        hookedFish.stamina /
                        Math.max(1, hookedFishStartStamina) *
                        100,
                        0,
                        100
                    );

                staminaFillEl.style.width =
                    `${staminaPercent}%`;

                staminaValueEl.textContent =
                    `${Math.round(staminaPercent)}%`;
            } else {
                staminaFillEl.style.width = '0%';
                staminaValueEl.textContent = '—';
            }

            shopBtn.disabled =
                !gameRunning ||
                !['aim', 'menu'].includes(phase);
        };

        const resizeCanvas = () => {
            const rect = root.getBoundingClientRect();
            const width = Math.max(1, rect.width);
            const height = Math.max(1, rect.height);
            const dpr = Math.min(2, window.devicePixelRatio || 1);

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            world.width = width;
            world.height = height;
            world.surfaceY = width < 760 ? 120 : 112;
            world.bottomY = height - (width < 760 ? 165 : 82);
            world.rodX = Math.max(68, width * 0.13);
            world.rodY = world.surfaceY - 49;
            world.depthHeight = world.bottomY - world.surfaceY;

            if (
                phase === 'aim' ||
                phase === 'menu' ||
                phase === 'ended'
            ) {
                hook.x = world.rodX + 18;
                hook.y = world.surfaceY - 4;
            } else {
                hook.x = clamp(hook.x, 18, width - 18);
                hook.y = clamp(hook.y, world.surfaceY - 20, world.bottomY);
            }

            aimX = clamp(
                aimX || width * 0.55,
                world.rodX + 70,
                width - 35
            );
        };

        const weightedPick = items => {
            const total = items.reduce((sum, item) => sum + item.weight, 0);
            let roll = Math.random() * total;

            for (const item of items) {
                roll -= item.weight;

                if (roll <= 0) return item;
            }

            return items[items.length - 1];
        };

        const fishTypeForDepth = ratio => {
            const candidates =
                FISH_TYPES.filter(type =>
                    ratio >= type.minDepth &&
                    ratio <= type.maxDepth
                );

            if (!candidates.length) {
                return FISH_TYPES[0];
            }

            return weightedPick(candidates);
        };

        const createFish = (forcedType = null) => {
            const ratio =
                forcedType
                    ? rand(forcedType.minDepth, forcedType.maxDepth)
                    : rand(0.04, 0.985);

            const type =
                forcedType ??
                fishTypeForDepth(ratio);

            const size =
                rand(
                    type.size[0],
                    type.size[1]
                );

            const direction =
                Math.random() < 0.5
                    ? -1
                    : 1;

            return {
                id: `fish-${performance.now()}-${Math.random()}`,
                type,
                x:
                    direction > 0
                        ? rand(-90, world.width * 0.68)
                        : rand(world.width * 0.32, world.width + 90),
                y:
                    world.surfaceY +
                    ratio *
                    world.depthHeight,
                baseY:
                    world.surfaceY +
                    ratio *
                    world.depthHeight,
                size,
                direction,
                speed:
                    rand(
                        type.speed[0],
                        type.speed[1]
                    ),
                value:
                    randInt(
                        type.value[0],
                        type.value[1]
                    ),
                stamina:
                    rand(
                        type.stamina[0],
                        type.stamina[1]
                    ),
                maxStamina: 0,
                phase:
                    Math.random() *
                    Math.PI *
                    2,
                burstTimer:
                    rand(0.8, 2.0),
                burstTime: 0,
                burstDirection: 1,
                state: 'swim',
                inspectCooldown: 0,
                noticeCooldown: 0,
                alive: true
            };
        };

        const maintainFishPopulation = () => {
            while (
                fish.filter(item => item.alive && item !== hookedFish).length <
                CONFIG.fishTargetCount
            ) {
                fish.push(createFish());
            }
        };

        const createBubble = () => ({
            x: rand(10, world.width - 10),
            y: rand(world.surfaceY + 30, world.bottomY),
            radius: rand(1, 3.4),
            speed: rand(9, 24),
            alpha: rand(0.12, 0.32)
        });

        const maintainBubbles = () => {
            while (bubbles.length < 34) {
                bubbles.push(createBubble());
            }
        };

        const spawnParticles = (x, y, color, count = 10) => {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = rand(25, 105);
                const life = rand(0.34, 0.62);

                particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: rand(1.3, 3.7),
                    color,
                    life,
                    maxLife: life
                });
            }
        };

        const spawnText = (x, y, text, color) => {
            floatTexts.push({
                x,
                y,
                text,
                color,
                life: 0.78,
                maxLife: 0.78
            });
        };

        const resetToAim = (message = 'Aim with the mouse · click to cast.') => {
            phase = 'aim';
            reelHeld = false;
            hookedFish = null;
            baitConsumedThisCast = false;

            hook.x = world.rodX + 18;
            hook.y = world.surfaceY - 4;
            hook.tension = 0;
            hook.snapTimer = 0;

            setStatus(
                'AIM & CAST',
                message,
                ''
            );

            updateHud();
        };

        const startCast = () => {
            if (
                !gameRunning ||
                gameEnded ||
                phase !== 'aim'
            ) {
                return;
            }

            ensureAudio();

            phase = 'cast';

            hook.castStartX = world.rodX + 20;
            hook.castStartY = world.rodY - 8;
            hook.castEndX = clamp(
                aimX,
                world.rodX + 80,
                world.width - 24
            );
            hook.castEndY = world.surfaceY + 10;
            hook.castT = 0;

            hook.tension = 0;
            hook.snapTimer = 0;
            baitConsumedThisCast = false;

            setStatus(
                'CAST!',
                'Release the mouse and let the bait sink.',
                ''
            );

            tone(520, 0.055, 0.022, 'sine');
        };

        const consumeBaitOnBite = () => {
            if (baitConsumedThisCast) return;

            baitConsumedThisCast = true;

            bait = {
                tier: 1,
                label: BAIT_TIERS[1].label,
                sourceFish: null,
                color: BAIT_TIERS[1].color
            };
        };

        const hookFish = target => {
            if (
                hookedFish ||
                !target.alive ||
                phase !== 'water'
            ) {
                return;
            }

            hookedFish = target;
            target.state = 'hooked';
            target.maxStamina = target.stamina;
            hookedFishStartStamina = target.maxStamina;

            consumeBaitOnBite();

            phase = 'fight';
            hook.tension = Math.min(
                currentLineStrength() * 0.18,
                18
            );
            hook.snapTimer = 0;

            comboTimer = CONFIG.comboWindow;

            spawnParticles(
                target.x,
                target.y,
                target.type.color,
                14
            );

            setStatus(
                `${target.type.name.toUpperCase()} HOOKED!`,
                'Hold mouse to reel · release when tension gets dangerous.',
                target.type.rarity === 'Legendary' ||
                target.type.rarity === 'Mythic'
                    ? 'gold'
                    : 'good'
            );

            tone(620, 0.055, 0.03, 'triangle');
        };

        const fishBiteEligible = target =>
            bait.tier >= target.type.requiredBait;

        const showNeedBait = target => {
            if (
                target.noticeCooldown > 0 ||
                rareNoticeTimer > 0
            ) {
                return;
            }

            target.noticeCooldown = 1.8;
            rareNoticeTimer = CONFIG.rareNoticeCooldown;

            spawnText(
                target.x,
                target.y - target.size - 8,
                `Needs Bait ${target.type.requiredBait}`,
                COLORS.pink
            );
        };

        const updateFreeFish = (target, delta) => {
            target.phase += delta;
            target.inspectCooldown =
                Math.max(
                    0,
                    target.inspectCooldown - delta
                );

            target.noticeCooldown =
                Math.max(
                    0,
                    target.noticeCooldown - delta
                );

            const baitInWater =
                phase === 'water';

            const distToHook =
                baitInWater
                    ? Math.hypot(
                        target.x - hook.x,
                        target.y - hook.y
                    )
                    : Infinity;

            const eligible =
                baitInWater &&
                fishBiteEligible(target);

            if (
                baitInWater &&
                distToHook <
                currentDetectionRadius()
            ) {
                if (eligible) {
                    target.state = 'approach';
                } else if (
                    distToHook <
                    currentDetectionRadius() * 0.65
                ) {
                    target.state = 'reject';
                    showNeedBait(target);
                }
            } else if (
                target.state !== 'swim'
            ) {
                target.state = 'swim';
            }

            if (target.state === 'approach') {
                const dx = hook.x - target.x;
                const dy = hook.y - target.y;
                const dist = Math.max(1, Math.hypot(dx, dy));

                target.direction =
                    dx >= 0
                        ? 1
                        : -1;

                const chaseSpeed =
                    target.speed * 1.22;

                target.x +=
                    dx /
                    dist *
                    chaseSpeed *
                    delta;

                target.y +=
                    dy /
                    dist *
                    chaseSpeed *
                    0.78 *
                    delta;

                if (
                    dist <
                    currentHookRadius() +
                    target.size * 0.52
                ) {
                    hookFish(target);
                }
            } else if (target.state === 'reject') {
                const dx =
                    target.x - hook.x;

                target.direction =
                    dx >= 0
                        ? 1
                        : -1;

                target.x +=
                    target.direction *
                    target.speed *
                    1.35 *
                    delta;

                target.y +=
                    Math.sin(target.phase * 1.7) *
                    3 *
                    delta;
            } else {
                target.x +=
                    target.direction *
                    target.speed *
                    delta;

                target.y =
                    target.baseY +
                    Math.sin(
                        target.phase * 1.15
                    ) *
                    7;
            }

            if (
                target.direction > 0 &&
                target.x >
                world.width + 85
            ) {
                target.x = -85;
            }

            if (
                target.direction < 0 &&
                target.x <
                -85
            ) {
                target.x = world.width + 85;
            }
        };

        const updateHookedFish = (delta) => {
            if (
                !hookedFish ||
                phase !== 'fight'
            ) {
                return;
            }

            hookedFish.phase += delta;
            hookedFish.burstTimer -= delta;

            if (
                hookedFish.burstTimer <= 0 &&
                hookedFish.burstTime <= 0
            ) {
                hookedFish.burstTime =
                    rand(0.45, 0.92);

                hookedFish.burstTimer =
                    rand(0.85, 1.75);

                hookedFish.burstDirection =
                    Math.random() < 0.5
                        ? -1
                        : 1;
            }

            const exhausted =
                hookedFish.stamina <= 0;

            const burst =
                hookedFish.burstTime > 0 &&
                !exhausted;

            if (burst) {
                hookedFish.burstTime -= delta;
            }

            const pullStrength =
                exhausted
                    ? hookedFish.type.pull * 0.20
                    : hookedFish.type.pull *
                      (burst ? 1.65 : 0.66);

            const fightWave =
                Math.sin(
                    hookedFish.phase *
                    (burst ? 8 : 3.8)
                );

            const pullX =
                (
                    hookedFish.burstDirection *
                    0.78 +
                    fightWave *
                    0.42
                ) *
                pullStrength;

            hook.x +=
                pullX *
                56 *
                delta;

            hook.x =
                clamp(
                    hook.x,
                    20,
                    world.width - 20
                );

            const maxDepthY =
                world.surfaceY +
                world.depthHeight *
                currentMaxDepthRatio();

            if (!reelHeld) {
                hook.y +=
                    pullStrength *
                    21 *
                    delta;
            }

            hook.y =
                clamp(
                    hook.y,
                    world.surfaceY + 4,
                    maxDepthY
                );

            hookedFish.x =
                hook.x +
                hookedFish.direction *
                hookedFish.size *
                0.62;

            hookedFish.y =
                hook.y +
                10;

            const lineStrength =
                currentLineStrength();

            const tensionRatio =
                hook.tension /
                lineStrength;

            if (reelHeld) {
                const reelFactor =
                    exhausted
                        ? 1.12
                        : 1;

                hook.y -=
                    currentReelSpeed() *
                    CONFIG.fastReelMultiplier *
                    reelFactor *
                    delta;

                const dangerAmplifier =
                    burst
                        ? 1.65
                        : 0.78;

                hook.tension +=
                    CONFIG.tensionGain *
                    pullStrength *
                    dangerAmplifier *
                    delta;

                const sweetSpot =
                    tensionRatio >= 0.28 &&
                    tensionRatio <= 0.78;

                hookedFish.stamina -=
                    (
                        sweetSpot
                            ? 30
                            : 16
                    ) *
                    (1 + upgrades.reel * 0.025) *
                    delta;
            } else {
                hook.tension -=
                    CONFIG.tensionRecovery *
                    delta;

                if (
                    !exhausted &&
                    hookedFish.stamina <
                    hookedFish.maxStamina
                ) {
                    hookedFish.stamina +=
                        3.2 *
                        delta;
                }
            }

            if (burst) {
                hook.tension +=
                    7.5 *
                    pullStrength *
                    delta;
            }

            hook.tension =
                clamp(
                    hook.tension,
                    0,
                    lineStrength * 1.25
                );

            hookedFish.stamina =
                clamp(
                    hookedFish.stamina,
                    0,
                    hookedFish.maxStamina
                );

            if (
                hook.tension >
                lineStrength
            ) {
                hook.snapTimer += delta;
            } else {
                hook.snapTimer =
                    Math.max(
                        0,
                        hook.snapTimer -
                        delta *
                        1.65
                    );
            }

            if (
                hook.snapTimer >=
                CONFIG.lineSnapGrace
            ) {
                lineSnap();
                return;
            }

            if (
                hook.y <=
                world.surfaceY + 8
            ) {
                landFish();
            }
        };

        const lineSnap = () => {
            if (!hookedFish) return;

            const escapedName =
                hookedFish.type.name;

            hookedFish.state = 'swim';
            hookedFish.direction =
                Math.random() < 0.5
                    ? -1
                    : 1;

            hookedFish.stamina =
                hookedFish.maxStamina *
                0.75;

            hookedFish = null;
            baitConsumedThisCast = false;

            lives--;
            combo = 0;
            comboTimer = 0;

            spawnParticles(
                hook.x,
                hook.y,
                COLORS.red,
                18
            );

            setStatus(
                'LINE SNAPPED!',
                `${escapedName} escaped · bait lost.`,
                'bad'
            );

            tone(215, 0.10, 0.032, 'sawtooth');

            updateHud();

            if (lives <= 0) {
                schedule(endRun, 900);
                return;
            }

            schedule(() => {
                resetToAim(
                    'Line repaired. Try a safer reel rhythm.'
                );
            }, 980);
        };

        const calculateCatchValue = target => {
            const depth =
                clamp(
                    (
                        target.baseY -
                        world.surfaceY
                    ) /
                    Math.max(1, world.depthHeight),
                    0,
                    1
                );

            const depthMultiplier =
                1 +
                depth *
                0.52;

            const comboMultiplier =
                1 +
                Math.min(
                    CONFIG.comboValueCap - 1,
                    combo *
                    CONFIG.comboValueStep
                );

            const staminaBonus =
                hook.tension <
                currentLineStrength() *
                0.42
                    ? 1.08
                    : 1;

            return Math.round(
                target.value *
                depthMultiplier *
                comboMultiplier *
                staminaBonus
            );
        };

        const landFish = () => {
            if (!hookedFish) return;

            catchResult = {
                fish: hookedFish,
                value: calculateCatchValue(hookedFish)
            };

            bestCatchValue =
                Math.max(
                    bestCatchValue,
                    catchResult.value
                );

            biggestFishName =
                catchResult.fish.type.name;

            catches++;
            combo++;
            bestCombo =
                Math.max(
                    bestCombo,
                    combo
                );

            comboTimer =
                CONFIG.comboWindow;

            score +=
                Math.round(
                    catchResult.value *
                    0.42
                );

            hookedFish.alive = false;
            hookedFish = null;

            hook.tension = 0;
            hook.snapTimer = 0;
            phase = 'choice';

            openCatchChoice();
        };

        const openCatchChoice = () => {
            const target =
                catchResult.fish;

            const color =
                target.type.color;

            catchVisualEl.style.setProperty(
                '--catch-color',
                color
            );

            catchRarityEl.textContent =
                target.type.rarity;

            catchTitleEl.textContent =
                target.type.name;

            const baitInfo =
                target.type.canBait
                    ? `Can become ${BAIT_TIERS[target.type.baitTier].short}.`
                    : 'Trophy fish · too large to use as bait.';

            catchSubEl.textContent =
                `${Math.round(target.size)} cm class · ${baitInfo}`;

            catchValueEl.textContent =
                `$${catchResult.value.toLocaleString('de-DE')}`;

            sellBtn.querySelector('span').textContent =
                `Receive $${catchResult.value.toLocaleString('de-DE')} and continue.`;

            baitBtn.disabled =
                !target.type.canBait;

            baitBtn.querySelector('b').textContent =
                target.type.canBait
                    ? `USE AS ${BAIT_TIERS[target.type.baitTier].short.toUpperCase()}`
                    : 'TOO LARGE FOR BAIT';

            baitBtn.querySelector('span').textContent =
                target.type.canBait
                    ? `Sacrifice the sale. This bait can attract fish requiring tier ${target.type.baitTier}.`
                    : 'Legendary and Mythic fish must be sold.';

            catchOverlay.classList.remove('hidden');

            setStatus(
                `${target.type.rarity.toUpperCase()} CATCH!`,
                `${target.type.name} landed successfully.`,
                target.type.rarity === 'Legendary' ||
                target.type.rarity === 'Mythic'
                    ? 'gold'
                    : 'good'
            );

            spawnParticles(
                world.rodX + 38,
                world.surfaceY - 15,
                color,
                22
            );

            tone(650, 0.07, 0.035, 'sine');

            if (
                target.type.rarity === 'Legendary' ||
                target.type.rarity === 'Mythic'
            ) {
                schedule(
                    () => tone(940, 0.11, 0.04, 'sine'),
                    65
                );
            }
        };

        const finishCatchDecision = () => {
            catchOverlay.classList.add('hidden');

            catchResult = null;
            baitConsumedThisCast = false;

            maintainFishPopulation();

            resetToAim(
                'Move the mouse to aim the next cast.'
            );
        };

        const sellCatch = () => {
            if (!catchResult) return;

            money +=
                catchResult.value;

            score +=
                catchResult.value;

            spawnText(
                world.rodX + 42,
                world.surfaceY - 22,
                `+$${catchResult.value}`,
                COLORS.green
            );

            finishCatchDecision();
        };

        const useCatchAsBait = () => {
            if (
                !catchResult ||
                !catchResult.fish.type.canBait
            ) {
                return;
            }

            const target =
                catchResult.fish;

            bait = {
                tier:
                    target.type.baitTier,
                label:
                    target.type.name,
                sourceFish:
                    target.type.id,
                color:
                    target.type.color
            };

            score +=
                Math.round(
                    catchResult.value *
                    0.20
                );

            setStatus(
                `${BAIT_TIERS[bait.tier].short.toUpperCase()} READY`,
                `${target.type.name} attached to the hook.`,
                'good'
            );

            finishCatchDecision();
        };

        const updateHook = delta => {
            if (!gameRunning || gameEnded) return;

            if (phase === 'cast') {
                hook.castT +=
                    delta /
                    CONFIG.castDuration;

                const t =
                    clamp(
                        hook.castT,
                        0,
                        1
                    );

                const arc =
                    Math.sin(
                        t *
                        Math.PI
                    ) *
                    Math.min(
                        115,
                        Math.abs(
                            hook.castEndX -
                            hook.castStartX
                        ) *
                        0.24 +
                        55
                    );

                hook.x =
                    hook.castStartX +
                    (
                        hook.castEndX -
                        hook.castStartX
                    ) *
                    t;

                hook.y =
                    hook.castStartY +
                    (
                        hook.castEndY -
                        hook.castStartY
                    ) *
                    t -
                    arc;

                if (t >= 1) {
                    phase = 'water';

                    hook.x =
                        hook.castEndX;

                    hook.y =
                        world.surfaceY + 10;

                    setStatus(
                        'BAIT IN WATER',
                        'Release = sink · hold mouse = reel.',
                        ''
                    );

                    spawnParticles(
                        hook.x,
                        hook.y,
                        COLORS.cyan2,
                        10
                    );

                    tone(
                        360,
                        0.045,
                        0.018,
                        'triangle'
                    );
                }
            }

            if (phase === 'water') {
                const maxDepthY =
                    world.surfaceY +
                    world.depthHeight *
                    currentMaxDepthRatio();

                if (reelHeld) {
                    hook.y -=
                        currentReelSpeed() *
                        0.92 *
                        delta;
                } else {
                    hook.y +=
                        currentSinkSpeed() *
                        delta;
                }

                const steerTarget =
                    clamp(
                        pointerX || hook.x,
                        18,
                        world.width - 18
                    );

                hook.x +=
                    clamp(
                        steerTarget - hook.x,
                        -CONFIG.steerSpeed * delta,
                        CONFIG.steerSpeed * delta
                    );

                hook.x +=
                    Math.sin(
                        performance.now() *
                        0.0013
                    ) *
                    CONFIG.passiveDrift *
                    delta;

                hook.x =
                    clamp(
                        hook.x,
                        18,
                        world.width - 18
                    );

                hook.y =
                    clamp(
                        hook.y,
                        world.surfaceY + 8,
                        maxDepthY
                    );

                if (
                    reelHeld &&
                    hook.y <=
                    world.surfaceY + 9
                ) {
                    resetToAim(
                        'No bite. Your bait was not consumed.'
                    );
                }
            }

            if (phase === 'fight') {
                updateHookedFish(delta);
            }
        };

        const updateFish = delta => {
            for (const target of fish) {
                if (
                    !target.alive ||
                    target === hookedFish
                ) {
                    continue;
                }

                updateFreeFish(
                    target,
                    delta
                );
            }
        };

        const updateCombo = delta => {
            if (combo <= 0) return;

            comboTimer -= delta;

            if (
                comboTimer <= 0 &&
                phase !== 'fight' &&
                phase !== 'choice'
            ) {
                combo = 0;
                comboTimer = 0;
            }
        };

        const updateEffects = delta => {
            rareNoticeTimer =
                Math.max(
                    0,
                    rareNoticeTimer - delta
                );

            for (
                let i = particles.length - 1;
                i >= 0;
                i--
            ) {
                const p =
                    particles[i];

                p.life -= delta;

                p.x +=
                    p.vx *
                    delta;

                p.y +=
                    p.vy *
                    delta;

                p.vx *=
                    Math.pow(
                        0.93,
                        delta * 60
                    );

                p.vy *=
                    Math.pow(
                        0.93,
                        delta * 60
                    );

                if (p.life <= 0) {
                    particles.splice(i, 1);
                }
            }

            for (
                let i = floatTexts.length - 1;
                i >= 0;
                i--
            ) {
                const text =
                    floatTexts[i];

                text.life -= delta;
                text.y -= 23 * delta;

                if (text.life <= 0) {
                    floatTexts.splice(i, 1);
                }
            }

            for (const bubble of bubbles) {
                bubble.y -=
                    bubble.speed *
                    delta;

                bubble.x +=
                    Math.sin(
                        bubble.y *
                        0.025
                    ) *
                    3 *
                    delta;

                if (
                    bubble.y <
                    world.surfaceY + 4
                ) {
                    Object.assign(
                        bubble,
                        createBubble(),
                        {
                            y:
                                world.bottomY -
                                rand(0, 30)
                        }
                    );
                }
            }
        };

        const update = delta => {
            if (
                gameRunning &&
                !gameEnded &&
                phase !== 'shop' &&
                phase !== 'choice'
            ) {
                updateCombo(delta);
                updateFish(delta);
                updateHook(delta);
                maintainFishPopulation();
            }

            updateEffects(delta);
            updateHud();
        };

        const drawBackground = () => {
            const width =
                world.width;

            const height =
                world.height;

            ctx.fillStyle =
                COLORS.bg;

            ctx.fillRect(
                0,
                0,
                width,
                height
            );

            const sky =
                ctx.createLinearGradient(
                    0,
                    0,
                    0,
                    world.surfaceY
                );

            sky.addColorStop(
                0,
                '#101c2d'
            );

            sky.addColorStop(
                1,
                '#17394d'
            );

            ctx.fillStyle =
                sky;

            ctx.fillRect(
                0,
                0,
                width,
                world.surfaceY
            );

            const water =
                ctx.createLinearGradient(
                    0,
                    world.surfaceY,
                    0,
                    world.bottomY
                );

            water.addColorStop(
                0,
                '#0b84a9'
            );

            water.addColorStop(
                0.33,
                '#0a5b81'
            );

            water.addColorStop(
                0.67,
                '#073a5b'
            );

            water.addColorStop(
                1,
                '#061d34'
            );

            ctx.fillStyle =
                water;

            ctx.fillRect(
                0,
                world.surfaceY,
                width,
                world.bottomY -
                world.surfaceY
            );

            const abyss =
                ctx.createRadialGradient(
                    width * 0.5,
                    world.bottomY,
                    0,
                    width * 0.5,
                    world.bottomY,
                    width * 0.7
                );

            abyss.addColorStop(
                0,
                'rgba(0,5,18,.28)'
            );

            abyss.addColorStop(
                1,
                'rgba(0,5,18,0)'
            );

            ctx.fillStyle =
                abyss;

            ctx.fillRect(
                0,
                world.surfaceY,
                width,
                world.bottomY -
                world.surfaceY
            );

            ctx.strokeStyle =
                'rgba(255,255,255,.17)';

            ctx.lineWidth = 2;

            ctx.beginPath();

            for (
                let x = 0;
                x <= width;
                x += 26
            ) {
                const y =
                    world.surfaceY +
                    Math.sin(
                        x * 0.047 +
                        performance.now() * 0.0017
                    ) *
                    2.5;

                if (x === 0) {
                    ctx.moveTo(
                        x,
                        y
                    );
                } else {
                    ctx.lineTo(
                        x,
                        y
                    );
                }
            }

            ctx.stroke();

            for (
                let i = 1;
                i <= 4;
                i++
            ) {
                const ratio =
                    i /
                    5;

                const y =
                    world.surfaceY +
                    ratio *
                    world.depthHeight;

                ctx.strokeStyle =
                    'rgba(255,255,255,.032)';

                ctx.lineWidth = 1;
                ctx.setLineDash([6, 12]);

                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            ctx.setLineDash([]);

            ctx.fillStyle =
                '#07121f';

            ctx.fillRect(
                0,
                world.bottomY,
                width,
                height -
                world.bottomY
            );
        };

        const drawBubbles = () => {
            for (const bubble of bubbles) {
                ctx.save();

                ctx.globalAlpha =
                    bubble.alpha;

                ctx.strokeStyle =
                    '#c4f5ff';

                ctx.lineWidth = 1;

                ctx.beginPath();
                ctx.arc(
                    bubble.x,
                    bubble.y,
                    bubble.radius,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();

                ctx.restore();
            }
        };

        const drawPierAndRod = () => {
            ctx.save();

            ctx.fillStyle =
                '#6b4934';

            ctx.fillRect(
                0,
                world.surfaceY - 25,
                Math.max(115, world.rodX + 8),
                22
            );

            ctx.fillStyle =
                '#8c6143';

            for (
                let x = 0;
                x <
                Math.max(
                    115,
                    world.rodX + 8
                );
                x += 34
            ) {
                ctx.fillRect(
                    x,
                    world.surfaceY - 28,
                    27,
                    5
                );
            }

            ctx.strokeStyle =
                '#cfd8e2';

            ctx.lineWidth = 4;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(
                world.rodX - 14,
                world.surfaceY - 24
            );
            ctx.lineTo(
                world.rodX,
                world.rodY
            );
            ctx.stroke();

            ctx.strokeStyle =
                '#d38e4c';

            ctx.lineWidth = 5;

            ctx.beginPath();
            ctx.moveTo(
                world.rodX,
                world.rodY
            );

            ctx.quadraticCurveTo(
                world.rodX + 48,
                world.rodY - 37,
                world.rodX + 77,
                world.rodY - 5
            );

            ctx.stroke();

            ctx.fillStyle =
                '#d7e6f1';

            ctx.beginPath();
            ctx.arc(
                world.rodX + 76,
                world.rodY - 4,
                4,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.restore();
        };

        const drawAimPreview = () => {
            if (
                phase !== 'aim' ||
                !gameRunning
            ) {
                return;
            }

            const startX =
                world.rodX + 77;

            const startY =
                world.rodY - 4;

            const endX =
                clamp(
                    aimX,
                    world.rodX + 80,
                    world.width - 24
                );

            const endY =
                world.surfaceY + 9;

            const controlX =
                (
                    startX +
                    endX
                ) /
                2;

            const controlY =
                Math.min(
                    startY,
                    endY
                ) -
                Math.min(
                    105,
                    Math.abs(
                        endX -
                        startX
                    ) *
                    0.26 +
                    35
                );

            ctx.save();

            ctx.strokeStyle =
                'rgba(141,242,255,.62)';

            ctx.lineWidth = 2;
            ctx.setLineDash([7, 8]);

            ctx.beginPath();
            ctx.moveTo(
                startX,
                startY
            );

            ctx.quadraticCurveTo(
                controlX,
                controlY,
                endX,
                endY
            );

            ctx.stroke();

            ctx.setLineDash([]);

            ctx.fillStyle =
                COLORS.cyan2;

            ctx.shadowBlur = 12;
            ctx.shadowColor =
                COLORS.cyan;

            ctx.beginPath();
            ctx.arc(
                endX,
                endY,
                5,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.restore();
        };

        const drawFish = target => {
            if (
                !target.alive ||
                target === hookedFish
            ) {
                return;
            }

            ctx.save();

            ctx.translate(
                target.x,
                target.y
            );

            ctx.scale(
                target.direction,
                1
            );

            ctx.shadowBlur =
                target.type.rarity === 'Mythic'
                    ? 20
                    : target.type.rarity === 'Legendary'
                        ? 14
                        : target.type.rarity === 'Epic'
                            ? 10
                            : 5;

            ctx.shadowColor =
                target.type.color;

            ctx.fillStyle =
                target.type.color;

            ctx.beginPath();

            ctx.ellipse(
                0,
                0,
                target.size,
                target.size * 0.49,
                0,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.beginPath();

            ctx.moveTo(
                -target.size * 0.84,
                0
            );

            ctx.lineTo(
                -target.size * 1.42,
                -target.size * 0.50
            );

            ctx.lineTo(
                -target.size * 1.34,
                target.size * 0.48
            );

            ctx.closePath();
            ctx.fill();

            if (
                target.type.id === 'marlin'
            ) {
                ctx.fillStyle =
                    target.type.accent;

                ctx.beginPath();

                ctx.moveTo(
                    target.size * 0.78,
                    -2
                );

                ctx.lineTo(
                    target.size * 1.62,
                    -3
                );

                ctx.lineTo(
                    target.size * 0.84,
                    3
                );

                ctx.closePath();
                ctx.fill();
            }

            ctx.fillStyle =
                target.type.accent;

            ctx.globalAlpha =
                0.54;

            ctx.beginPath();

            ctx.ellipse(
                target.size * 0.06,
                -target.size * 0.12,
                target.size * 0.52,
                target.size * 0.16,
                -0.08,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.globalAlpha = 1;

            ctx.fillStyle =
                '#07121c';

            ctx.beginPath();

            ctx.arc(
                target.size * 0.52,
                -target.size * 0.12,
                Math.max(
                    2,
                    target.size * 0.075
                ),
                0,
                Math.PI * 2
            );

            ctx.fill();

            if (
                target.type.rarity === 'Mythic'
            ) {
                ctx.strokeStyle =
                    COLORS.gold;

                ctx.lineWidth = 2;

                ctx.beginPath();

                ctx.arc(
                    0,
                    0,
                    target.size * 1.12,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();
            }

            ctx.restore();
        };

        const drawHookedFish = () => {
            if (!hookedFish) return;

            const target =
                hookedFish;

            ctx.save();

            ctx.translate(
                target.x,
                target.y
            );

            const angle =
                Math.atan2(
                    hook.y - target.y,
                    hook.x - target.x
                );

            ctx.rotate(
                angle * 0.25
            );

            ctx.scale(
                target.direction,
                1
            );

            ctx.shadowBlur = 15;
            ctx.shadowColor =
                target.type.color;

            ctx.fillStyle =
                target.type.color;

            ctx.beginPath();

            ctx.ellipse(
                0,
                0,
                target.size,
                target.size * 0.50,
                0,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.beginPath();

            ctx.moveTo(
                -target.size * 0.84,
                0
            );

            ctx.lineTo(
                -target.size * 1.42,
                -target.size * 0.50
            );

            ctx.lineTo(
                -target.size * 1.34,
                target.size * 0.48
            );

            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#07121c';

            ctx.beginPath();

            ctx.arc(
                target.size * 0.52,
                -target.size * 0.12,
                Math.max(2, target.size * 0.075),
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.restore();
        };

        const drawLineAndHook = () => {
            if (
                !gameRunning ||
                phase === 'aim' ||
                phase === 'shop' ||
                phase === 'choice'
            ) {
                return;
            }

            const rodTipX =
                world.rodX + 77;

            const rodTipY =
                world.rodY - 4;

            ctx.save();

            const tensionRatio =
                hook.tension /
                Math.max(
                    1,
                    currentLineStrength()
                );

            ctx.strokeStyle =
                tensionRatio > 0.86
                    ? COLORS.red
                    : tensionRatio > 0.68
                        ? COLORS.gold
                        : 'rgba(229,245,255,.78)';

            ctx.lineWidth = 1.5;

            ctx.beginPath();

            ctx.moveTo(
                rodTipX,
                rodTipY
            );

            ctx.lineTo(
                hook.x,
                hook.y
            );

            ctx.stroke();

            ctx.translate(
                hook.x,
                hook.y
            );

            ctx.strokeStyle =
                '#eef9ff';

            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                7,
                -0.15,
                Math.PI * 0.95
            );

            ctx.stroke();

            if (
                !baitConsumedThisCast
            ) {
                const baitColor =
                    bait.color;

                ctx.fillStyle =
                    baitColor;

                ctx.shadowBlur = 10;
                ctx.shadowColor =
                    baitColor;

                if (bait.tier === 1) {
                    ctx.beginPath();
                    ctx.ellipse(
                        5,
                        8,
                        3,
                        6,
                        0.45,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.ellipse(
                        7,
                        8,
                        8 + bait.tier * 1.4,
                        4 + bait.tier,
                        0,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(
                        -1,
                        8
                    );
                    ctx.lineTo(
                        -8,
                        2
                    );
                    ctx.lineTo(
                        -8,
                        14
                    );
                    ctx.closePath();
                    ctx.fill();
                }
            }

            ctx.restore();
        };

        const drawEffects = () => {
            for (const p of particles) {
                const alpha =
                    clamp(
                        p.life /
                        p.maxLife,
                        0,
                        1
                    );

                ctx.save();

                ctx.globalAlpha =
                    alpha;

                ctx.fillStyle =
                    p.color;

                ctx.shadowBlur = 7;
                ctx.shadowColor =
                    p.color;

                ctx.beginPath();

                ctx.arc(
                    p.x,
                    p.y,
                    p.size,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                ctx.restore();
            }

            for (const text of floatTexts) {
                const alpha =
                    clamp(
                        text.life /
                        text.maxLife,
                        0,
                        1
                    );

                ctx.save();

                ctx.globalAlpha =
                    alpha;

                ctx.fillStyle =
                    text.color;

                ctx.font =
                    '950 12px system-ui, sans-serif';

                ctx.textAlign =
                    'center';

                ctx.textBaseline =
                    'middle';

                ctx.shadowBlur = 8;
                ctx.shadowColor =
                    text.color;

                ctx.fillText(
                    text.text,
                    text.x,
                    text.y
                );

                ctx.restore();
            }
        };

        const draw = () => {
            drawBackground();
            drawBubbles();

            fish.forEach(
                drawFish
            );

            drawPierAndRod();
            drawAimPreview();
            drawLineAndHook();
            drawHookedFish();
            drawEffects();
        };

        const loop = timestamp => {
            if (destroyed) return;

            const delta =
                Math.min(
                    0.033,
                    Math.max(
                        0,
                        (
                            timestamp -
                            lastFrame
                        ) /
                        1000
                    )
                );

            lastFrame =
                timestamp;

            update(delta);
            draw();

            animationId =
                requestAnimationFrame(loop);
        };

        const renderShop = () => {
            shopMoneyEl.textContent =
                `$${Math.round(money).toLocaleString('de-DE')}`;

            shopGridEl.innerHTML = '';

            Object.entries(
                SHOP_UPGRADES
            ).forEach(
                ([id, def]) => {
                    const level =
                        upgrades[id];

                    const maxed =
                        level >=
                        def.maxLevel;

                    const price =
                        maxed
                            ? null
                            : upgradePrice(id);

                    const card =
                        document.createElement('div');

                    card.className =
                        'ef2-shop-item';

                    card.innerHTML = `
                        <div class="ef2-shop-icon">${def.icon}</div>
                        <b>${def.label}</b>
                        <span>${def.description}</span>
                        <div class="ef2-shop-level">Level ${level} / ${def.maxLevel}</div>
                        <button class="ef2-buy" type="button" ${maxed || money < price ? 'disabled' : ''}>
                            ${maxed ? 'MAXED' : `BUY · $${price}`}
                        </button>
                    `;

                    const buy =
                        card.querySelector(
                            '.ef2-buy'
                        );

                    buy.addEventListener(
                        'click',
                        () => {
                            if (
                                maxed ||
                                money <
                                price
                            ) {
                                return;
                            }

                            money -= price;
                            upgrades[id]++;

                            tone(
                                650,
                                0.055,
                                0.025,
                                'sine'
                            );

                            resizeCanvas();
                            renderShop();
                            updateHud();
                        }
                    );

                    shopGridEl.appendChild(
                        card
                    );
                }
            );
        };

        const openShop = () => {
            if (
                !gameRunning ||
                gameEnded ||
                phase !== 'aim'
            ) {
                return;
            }

            phase = 'shop';

            renderShop();

            shopOverlay.classList.remove(
                'hidden'
            );
        };

        const closeShop = () => {
            shopOverlay.classList.add(
                'hidden'
            );

            resetToAim(
                'Shop closed. Aim your next cast.'
            );
        };

        const onPointerMove = event => {
            const rect =
                canvas.getBoundingClientRect();

            pointerX =
                event.clientX -
                rect.left;

            if (
                phase === 'aim'
            ) {
                aimX =
                    clamp(
                        pointerX,
                        world.rodX + 80,
                        world.width - 24
                    );
            }
        };

        const onPointerDown = event => {
            if (
                !gameRunning ||
                gameEnded
            ) {
                return;
            }

            ensureAudio();

            const rect =
                canvas.getBoundingClientRect();

            pointerX =
                event.clientX -
                rect.left;

            if (phase === 'aim') {
                aimX =
                    clamp(
                        pointerX,
                        world.rodX + 80,
                        world.width - 24
                    );

                startCast();
                return;
            }

            if (
                phase === 'water' ||
                phase === 'fight'
            ) {
                reelHeld = true;
            }
        };

        const onPointerUp = () => {
            reelHeld = false;
        };

        const onPointerLeave = event => {
            if (event.buttons === 0) {
                reelHeld = false;
            }
        };

        const onKeyDown = event => {
            if (
                event.code === 'Space'
            ) {
                event.preventDefault();

                if (event.repeat) {
                    return;
                }

                if (phase === 'aim') {
                    startCast();
                } else if (
                    phase === 'water' ||
                    phase === 'fight'
                ) {
                    reelHeld = true;
                }
            }
        };

        const onKeyUp = event => {
            if (
                event.code === 'Space'
            ) {
                reelHeld = false;
            }
        };

        const endRun = () => {
            if (gameEnded) return;

            clearTimers();

            gameEnded = true;
            gameRunning = false;
            phase = 'ended';
            reelHeld = false;

            const finalScore =
                Math.max(
                    0,
                    Math.round(
                        score +
                        money * 0.5 +
                        catches * 25 +
                        bestCombo * 60 +
                        bestCatchValue * 0.25
                    )
                );

            services
                ?.highscores
                ?.saveHighscore?.(
                    'endless-fishing',
                    finalScore
                );

            endSubEl.textContent =
                `${catches} catches · Best combo x${bestCombo}`;

            endScoreEl.textContent =
                finalScore.toLocaleString('de-DE');

            endMoneyEl.textContent =
                `$${Math.round(money).toLocaleString('de-DE')}`;

            endCatchesEl.textContent =
                catches;

            endBiggestEl.textContent =
                biggestFishName;

            endOverlay.classList.remove(
                'hidden'
            );
        };

        const resetRun = () => {
            money = 0;
            score = 0;
            catches = 0;
            bestCatchValue = 0;
            biggestFishName = '—';

            lives =
                CONFIG.startLives;

            combo = 0;
            comboTimer = 0;
            bestCombo = 0;

            bait = {
                tier: 1,
                label: BAIT_TIERS[1].label,
                sourceFish: null,
                color: BAIT_TIERS[1].color
            };

            baitConsumedThisCast = false;

            upgrades = {
                line: 0,
                reel: 0,
                sinker: 0,
                hook: 0
            };

            fish = [];
            particles = [];
            floatTexts = [];
            hookedFish = null;
            catchResult = null;

            bubbles = [];
            maintainBubbles();
            maintainFishPopulation();

            gameRunning = true;
            gameEnded = false;

            resetToAim(
                'Move the mouse to choose casting distance.'
            );
        };

        const startRun = () => {
            clearTimers();
            ensureAudio();

            menuOverlay.classList.add(
                'hidden'
            );

            endOverlay.classList.add(
                'hidden'
            );

            catchOverlay.classList.add(
                'hidden'
            );

            shopOverlay.classList.add(
                'hidden'
            );

            resetRun();
        };

        startBtn.addEventListener(
            'click',
            startRun
        );

        restartBtn.addEventListener(
            'click',
            startRun
        );

        sellBtn.addEventListener(
            'click',
            sellCatch
        );

        baitBtn.addEventListener(
            'click',
            useCatchAsBait
        );

        shopBtn.addEventListener(
            'click',
            openShop
        );

        shopCloseBtn.addEventListener(
            'click',
            closeShop
        );

        audioBtn.addEventListener(
            'click',
            () => {
                muted = !muted;

                audioBtn.textContent =
                    `Sound: ${muted ? 'Aus' : 'An'}`;

                if (!muted) {
                    ensureAudio();
                    tone(
                        620,
                        0.04,
                        0.02
                    );
                }
            }
        );

        canvas.addEventListener(
            'pointermove',
            onPointerMove
        );

        canvas.addEventListener(
            'pointerdown',
            onPointerDown
        );

        canvas.addEventListener(
            'pointerup',
            onPointerUp
        );

        canvas.addEventListener(
            'pointercancel',
            onPointerUp
        );

        canvas.addEventListener(
            'pointerleave',
            onPointerLeave
        );

        window.addEventListener(
            'keydown',
            onKeyDown
        );

        window.addEventListener(
            'keyup',
            onKeyUp
        );

        resizeObserver =
            new ResizeObserver(
                resizeCanvas
            );

        resizeObserver.observe(root);

        resizeCanvas();
        maintainBubbles();
        updateHud();

        animationId =
            requestAnimationFrame(loop);

        return {
            destroy: () => {
                destroyed = true;
                gameRunning = false;

                clearTimers();

                cancelAnimationFrame(
                    animationId
                );

                resizeObserver?.disconnect();

                window.removeEventListener(
                    'keydown',
                    onKeyDown
                );

                window.removeEventListener(
                    'keyup',
                    onKeyUp
                );

                try {
                    audioContext?.close?.();
                } catch {}

                style.remove();
            }
        };
    }
};

export {
    FISH_TYPES,
    BAIT_TIERS,
    SHOP_UPGRADES,
    CONFIG
};
