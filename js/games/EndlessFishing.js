const FISH_TYPES = [
    {
        id: 'minnow',
        label: 'Minnow',
        rarity: 'Common',
        color: '#70d9ff',
        glow: '#35bfe9',
        minDepth: 0.08,
        maxDepth: 0.42,
        speed: [42, 66],
        value: [45, 70],
        size: [15, 20],
        pull: 0.35,
        weight: 28
    },
    {
        id: 'perch',
        label: 'Perch',
        rarity: 'Common',
        color: '#86e66f',
        glow: '#4fae58',
        minDepth: 0.12,
        maxDepth: 0.55,
        speed: [36, 58],
        value: [65, 95],
        size: [18, 24],
        pull: 0.45,
        weight: 24
    },
    {
        id: 'trout',
        label: 'Trout',
        rarity: 'Uncommon',
        color: '#ffcf70',
        glow: '#e89243',
        minDepth: 0.28,
        maxDepth: 0.68,
        speed: [46, 72],
        value: [120, 170],
        size: [21, 29],
        pull: 0.62,
        weight: 17
    },
    {
        id: 'salmon',
        label: 'Salmon',
        rarity: 'Rare',
        color: '#ff8ca7',
        glow: '#e94f7c',
        minDepth: 0.42,
        maxDepth: 0.82,
        speed: [56, 84],
        value: [220, 310],
        size: [24, 33],
        pull: 0.84,
        weight: 10
    },
    {
        id: 'swordfish',
        label: 'Swordfish',
        rarity: 'Epic',
        color: '#b487ff',
        glow: '#8559ff',
        minDepth: 0.58,
        maxDepth: 0.96,
        speed: [68, 96],
        value: [430, 620],
        size: [30, 40],
        pull: 1.08,
        weight: 5
    },
    {
        id: 'lantern',
        label: 'Lantern Fish',
        rarity: 'Legendary',
        color: '#ffe66d',
        glow: '#fff09a',
        minDepth: 0.72,
        maxDepth: 1.00,
        speed: [74, 110],
        value: [900, 1300],
        size: [27, 36],
        pull: 1.28,
        weight: 2
    }
];

const HAZARD_TYPES = [
    {
        id: 'boot',
        label: 'Old Boot',
        color: '#807263',
        minDepth: 0.10,
        maxDepth: 0.70,
        weight: 8,
        penalty: 80
    },
    {
        id: 'can',
        label: 'Tin Can',
        color: '#94a1aa',
        minDepth: 0.05,
        maxDepth: 0.88,
        weight: 10,
        penalty: 55
    },
    {
        id: 'jelly',
        label: 'Jellyfish',
        color: '#ff7fd8',
        minDepth: 0.42,
        maxDepth: 1.00,
        weight: 6,
        penalty: 0
    }
];

const UPGRADE_POOL = [
    {
        id: 'line_strength',
        label: 'Stronger Line',
        icon: '◆',
        description: '+18% maximale Spannung.',
        maxLevel: 5
    },
    {
        id: 'reel_speed',
        label: 'Fast Reel',
        icon: '↟',
        description: '+12% Einholgeschwindigkeit.',
        maxLevel: 5
    },
    {
        id: 'steering',
        label: 'Fin Control',
        icon: '↔',
        description: '+14% Steuerkraft beim Cast.',
        maxLevel: 5
    },
    {
        id: 'deep_line',
        label: 'Deep Line',
        icon: '↓',
        description: '+9% maximale Tiefe.',
        maxLevel: 4
    },
    {
        id: 'magnet',
        label: 'Lucky Hook',
        icon: '✦',
        description: 'Fische werden etwas stärker zum Haken gezogen.',
        maxLevel: 4
    },
    {
        id: 'value',
        label: 'Sharp Hook',
        icon: '×',
        description: '+10% Fangwert.',
        maxLevel: 5
    }
];

const CONFIG = {
    castSpeed: 225,
    maxCastDepth: 0.88,
    steerSpeed: 205,
    baseReelSpeed: 185,
    baseLineStrength: 100,
    tensionGain: 34,
    tensionRecovery: 28,
    tensionDanger: 82,
    snapGrace: 0.42,
    hookRadius: 10,
    spawnBase: 10,
    hazardBase: 2,
    upgradeEvery: 5,
    feverTarget: 5,
    feverDuration: 9,
    bossEvery: 10,
    maxLives: 3
};


const COLORS = {
    cyan: '#31dcff',
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
        description: 'Wirf die Leine aus, jage seltene Fische, kontrolliere die Spannung und baue einen endlosen Highscore-Run.',
        icon: '🎣',
        tags: ['Arcade', 'Fishing', 'Endless', 'Highscore']
    },

    init: (container, services) => {
        let destroyed = false;
        let animationId = null;
        let resizeObserver = null;
        let lastFrame = performance.now();

        let gameRunning = false;
        let gameEnded = false;
        let phase = 'ready';

        let score = 0;
        let catches = 0;
        let combo = 0;
        let bestCombo = 0;
        let lives = CONFIG.maxLives;
        let fever = 0;
        let feverActive = false;
        let feverTime = 0;
        let streakGood = 0;

        let upgradeLevels = {
            line_strength: 0,
            reel_speed: 0,
            steering: 0,
            deep_line: 0,
            magnet: 0,
            value: 0
        };

        let world = {
            width: 0,
            height: 0,
            waterTop: 92,
            bottom: 0,
            centerX: 0,
            maxDepthPx: 0
        };

        let hook = {
            x: 0,
            y: 0,
            vx: 0,
            targetX: 0,
            tension: 0,
            snapTime: 0,
            heldFishId: null,
            heldBoss: false
        };

        let fish = [];
        let hazards = [];
        let particles = [];
        let floatTexts = [];
        let boss = null;

        let keys = {
            left: false,
            right: false,
            reel: false
        };

        let pointerX = 0;

        let muted = false;
        let audioContext = null;
        const timers = new Set();

        const style = document.createElement('style');
        style.textContent = `
            .ef-game {
                --bg:#07101a;
                --panel:#111d2c;
                --panel2:#19283a;
                --text:#f4f8ff;
                --muted:#7f94aa;
                --cyan:#31dcff;
                --cyan2:#8df2ff;
                --green:#55e69a;
                --gold:#ffd166;
                --pink:#ff5b88;
                --purple:#b368ff;
                --red:#ff4d6d;

                position:relative;
                width:100%;
                height:100%;
                overflow:hidden;
                color:var(--text);
                font-family:inherit;
                user-select:none;
                background:var(--bg);
            }

            .ef-game * { box-sizing:border-box; }

            .ef-canvas {
                width:100%;
                height:100%;
                display:block;
                touch-action:none;
            }

            .ef-topbar {
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

            .ef-top-group {
                display:flex;
                gap:7px;
                flex-wrap:wrap;
            }

            .ef-stat {
                min-width:96px;
                padding:8px 10px;
                border-radius:11px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(11,20,33,.80);
                backdrop-filter:blur(10px);
            }

            .ef-stat-label {
                color:#71869e;
                font-size:.58rem;
                font-weight:850;
                text-transform:uppercase;
                letter-spacing:.08em;
            }

            .ef-stat-value {
                margin-top:2px;
                font-size:.94rem;
                font-weight:950;
            }

            .ef-score { color:var(--cyan2); }
            .ef-combo { color:var(--gold); }
            .ef-lives { color:var(--pink); }
            .ef-catches { color:var(--green); }

            .ef-depth-card {
                position:absolute;
                z-index:12;
                right:14px;
                top:82px;
                width:104px;
                padding:9px 10px;
                border-radius:11px;
                border:1px solid rgba(255,255,255,.07);
                background:rgba(11,20,33,.74);
                backdrop-filter:blur(10px);
                pointer-events:none;
            }

            .ef-depth-label {
                color:#71869e;
                font-size:.57rem;
                font-weight:850;
                text-transform:uppercase;
            }

            .ef-depth-value {
                margin-top:3px;
                font-size:.86rem;
                font-weight:950;
            }

            .ef-depth-zone {
                margin-top:2px;
                color:#7790a9;
                font-size:.61rem;
            }

            .ef-bottom {
                position:absolute;
                z-index:14;
                left:50%;
                bottom:16px;
                transform:translateX(-50%);
                width:min(690px,calc(100% - 30px));
                display:grid;
                grid-template-columns:1fr 1.4fr 1fr;
                gap:9px;
                align-items:end;
                pointer-events:none;
            }

            .ef-panel {
                padding:10px 12px;
                min-height:54px;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.07);
                background:rgba(11,20,33,.78);
                backdrop-filter:blur(10px);
            }

            .ef-panel-label {
                color:#70859e;
                font-size:.58rem;
                font-weight:850;
                text-transform:uppercase;
                letter-spacing:.07em;
            }

            .ef-tension-head {
                display:flex;
                justify-content:space-between;
                gap:8px;
                margin-bottom:6px;
                color:#8ba0b6;
                font-size:.63rem;
                font-weight:850;
            }

            .ef-tension-track {
                height:10px;
                border-radius:99px;
                overflow:hidden;
                background:rgba(255,255,255,.06);
                position:relative;
            }

            .ef-tension-danger {
                position:absolute;
                top:0;
                right:0;
                bottom:0;
                width:18%;
                background:rgba(255,77,109,.20);
            }

            .ef-tension-fill {
                height:100%;
                width:0%;
                background:linear-gradient(90deg,var(--cyan),var(--gold),var(--red));
                transition:width .06s linear;
            }

            .ef-main-action {
                pointer-events:auto;
                min-height:54px;
                display:flex;
                align-items:center;
                justify-content:center;
                flex-direction:column;
                gap:2px;
                border:0;
                border-radius:12px;
                cursor:pointer;
                color:#06121a;
                font:inherit;
                font-weight:950;
                background:linear-gradient(135deg,var(--cyan),#4b87ff);
                box-shadow:0 12px 30px rgba(49,220,255,.15);
            }

            .ef-main-action:hover { filter:brightness(1.08); }

            .ef-main-action small {
                font-size:.59rem;
                font-weight:850;
                opacity:.66;
            }

            .ef-panel-value {
                margin-top:4px;
                color:#d8e5f1;
                font-size:.75rem;
                font-weight:900;
            }

            .ef-fever {
                position:absolute;
                z-index:13;
                left:50%;
                top:75px;
                transform:translateX(-50%);
                width:min(330px,54vw);
                text-align:center;
                opacity:.9;
                pointer-events:none;
            }

            .ef-fever-title {
                color:var(--gold);
                font-size:.64rem;
                font-weight:950;
                text-transform:uppercase;
                letter-spacing:.12em;
                margin-bottom:5px;
            }

            .ef-fever-track {
                height:6px;
                overflow:hidden;
                border-radius:99px;
                background:rgba(255,255,255,.055);
            }

            .ef-fever-fill {
                height:100%;
                width:0%;
                background:linear-gradient(90deg,#ffd166,#ff8c66,#ff5b88);
                transition:width .12s ease;
            }

            .ef-status {
                position:absolute;
                z-index:16;
                left:50%;
                top:116px;
                transform:translateX(-50%);
                text-align:center;
                pointer-events:none;
                min-width:270px;
            }

            .ef-status-main {
                font-size:clamp(1.2rem,2.5vw,1.7rem);
                font-weight:950;
            }

            .ef-status-sub {
                margin-top:3px;
                color:#7f94aa;
                font-size:.69rem;
            }

            .ef-status.good .ef-status-main { color:var(--green); }
            .ef-status.bad .ef-status-main { color:var(--pink); }
            .ef-status.gold .ef-status-main { color:var(--gold); }

            .ef-audio {
                position:absolute;
                z-index:20;
                right:14px;
                bottom:82px;
                padding:8px 10px;
                border-radius:9px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(11,20,33,.78);
                color:#9eb1c4;
                font:inherit;
                font-size:.67rem;
                cursor:pointer;
            }

            .ef-overlay {
                position:absolute;
                inset:0;
                z-index:40;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:24px;
                background:rgba(4,8,15,.74);
                backdrop-filter:blur(9px);
            }

            .ef-overlay.hidden { display:none; }

            .ef-card {
                width:min(980px,100%);
                max-height:calc(100% - 8px);
                overflow:auto;
                padding:32px;
                border-radius:22px;
                border:1px solid rgba(255,255,255,.09);
                background:linear-gradient(180deg,rgba(27,43,63,.98),rgba(12,22,35,.98));
                box-shadow:0 30px 90px rgba(0,0,0,.44);
            }

            .ef-kicker {
                color:var(--cyan);
                font-size:.72rem;
                font-weight:950;
                text-transform:uppercase;
                letter-spacing:.16em;
            }

            .ef-title {
                margin:6px 0 9px;
                font-size:clamp(2.7rem,5vw,4.5rem);
                line-height:1;
                font-weight:950;
                letter-spacing:-.045em;
            }

            .ef-desc {
                max-width:780px;
                color:#8da1b8;
                line-height:1.55;
                margin-bottom:22px;
            }

            .ef-how {
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:8px;
                margin-bottom:20px;
            }

            .ef-how-card {
                padding:12px;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.06);
                background:rgba(255,255,255,.025);
            }

            .ef-how-icon {
                color:var(--cyan2);
                font-size:1.25rem;
                font-weight:950;
                margin-bottom:5px;
            }

            .ef-how-card b {
                display:block;
                margin-bottom:3px;
                font-size:.8rem;
            }

            .ef-how-card span {
                display:block;
                color:#7e93aa;
                font-size:.67rem;
                line-height:1.4;
            }

            .ef-feature-row {
                display:flex;
                flex-wrap:wrap;
                gap:6px;
                margin-bottom:18px;
            }

            .ef-feature {
                padding:7px 10px;
                border-radius:99px;
                border:1px solid rgba(49,220,255,.13);
                background:rgba(49,220,255,.045);
                color:#9db2c8;
                font-size:.65rem;
                font-weight:850;
            }

            .ef-start {
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

            .ef-start:hover {
                filter:brightness(1.08);
                transform:translateY(-1px);
            }

            .ef-upgrade-title,
            .ef-end-title {
                font-size:2.2rem;
                font-weight:950;
                margin-bottom:6px;
            }

            .ef-upgrade-title { color:var(--gold); }
            .ef-end-title { color:var(--cyan2); }

            .ef-upgrade-sub,
            .ef-end-sub {
                color:#8da1b8;
                line-height:1.5;
                margin-bottom:18px;
            }

            .ef-upgrade-grid {
                display:grid;
                grid-template-columns:repeat(3,1fr);
                gap:9px;
            }

            .ef-upgrade {
                min-width:0;
                padding:16px;
                border-radius:14px;
                border:1px solid rgba(255,255,255,.07);
                background:rgba(255,255,255,.026);
                color:var(--text);
                text-align:left;
                font:inherit;
                cursor:pointer;
                transition:.15s ease;
            }

            .ef-upgrade:hover {
                transform:translateY(-2px);
                border-color:rgba(255,209,102,.38);
                background:rgba(255,209,102,.045);
            }

            .ef-upgrade-icon {
                color:var(--gold);
                font-size:1.4rem;
                font-weight:950;
                margin-bottom:8px;
            }

            .ef-upgrade b {
                display:block;
                margin-bottom:3px;
                font-size:.88rem;
            }

            .ef-upgrade span {
                display:block;
                color:#7e93aa;
                font-size:.68rem;
                line-height:1.38;
            }

            .ef-upgrade small {
                display:block;
                margin-top:8px;
                color:#617991;
                font-size:.60rem;
            }

            .ef-end-stats {
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:8px;
                margin-bottom:18px;
            }

            .ef-end-stat {
                padding:12px;
                text-align:center;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.06);
                background:rgba(255,255,255,.03);
            }

            .ef-end-stat span {
                display:block;
                color:#788da5;
                font-size:.61rem;
                font-weight:850;
                text-transform:uppercase;
            }

            .ef-end-stat b {
                display:block;
                margin-top:3px;
                font-size:1.08rem;
            }

            @media (max-width:820px) {
                .ef-card { padding:22px; }
                .ef-how { grid-template-columns:1fr 1fr; }
                .ef-upgrade-grid { grid-template-columns:1fr; }
                .ef-end-stats { grid-template-columns:1fr 1fr; }
                .ef-stat {
                    min-width:0;
                    padding:7px 8px;
                }
                .ef-stat-label { font-size:.50rem; }
                .ef-stat-value { font-size:.75rem; }
                .ef-bottom {
                    grid-template-columns:1fr;
                    width:min(420px,calc(100% - 18px));
                    gap:6px;
                }
                .ef-bottom .ef-panel {
                    min-height:42px;
                }
                .ef-audio {
                    bottom:190px;
                }
                .ef-depth-card {
                    right:7px;
                    top:70px;
                }
            }
        `;

        const root = document.createElement('div');
        root.className = 'ef-game';
        root.innerHTML = `
            <canvas class="ef-canvas"></canvas>

            <div class="ef-topbar">
                <div class="ef-top-group">
                    <div class="ef-stat">
                        <div class="ef-stat-label">Score</div>
                        <div class="ef-stat-value ef-score">0</div>
                    </div>
                    <div class="ef-stat">
                        <div class="ef-stat-label">Combo</div>
                        <div class="ef-stat-value ef-combo">x0</div>
                    </div>
                </div>

                <div class="ef-top-group">
                    <div class="ef-stat">
                        <div class="ef-stat-label">Catches</div>
                        <div class="ef-stat-value ef-catches">0</div>
                    </div>
                    <div class="ef-stat">
                        <div class="ef-stat-label">Lives</div>
                        <div class="ef-stat-value ef-lives">♥♥♥</div>
                    </div>
                </div>
            </div>

            <div class="ef-fever">
                <div class="ef-fever-title">FEVER</div>
                <div class="ef-fever-track">
                    <div class="ef-fever-fill"></div>
                </div>
            </div>

            <div class="ef-depth-card">
                <div class="ef-depth-label">Depth</div>
                <div class="ef-depth-value">0 m</div>
                <div class="ef-depth-zone">Shallows</div>
            </div>

            <div class="ef-status">
                <div class="ef-status-main">BEREIT</div>
                <div class="ef-status-sub">SPACE drücken und die Leine auswerfen.</div>
            </div>

            <div class="ef-bottom">
                <div class="ef-panel">
                    <div class="ef-panel-label">Steering</div>
                    <div class="ef-panel-value">A / D · ← / →</div>
                </div>

                <button class="ef-main-action" type="button">
                    CAST
                    <small>SPACE</small>
                </button>

                <div class="ef-panel">
                    <div class="ef-tension-head">
                        <span>Tension</span>
                        <span class="ef-tension-value">0%</span>
                    </div>
                    <div class="ef-tension-track">
                        <div class="ef-tension-danger"></div>
                        <div class="ef-tension-fill"></div>
                    </div>
                </div>
            </div>

            <button class="ef-audio" type="button">Sound: An</button>

            <div class="ef-overlay ef-menu">
                <div class="ef-card">
                    <div class="ef-kicker">Arcade / Endless Run</div>
                    <div class="ef-title">Endless Fishing</div>
                    <div class="ef-desc">
                        Wirf deinen Haken immer tiefer ins Wasser, fang seltene Fische und bring sie sicher an die Oberfläche.
                        Je tiefer du gehst, desto wertvoller – und aggressiver – werden die Fische.
                    </div>

                    <div class="ef-how">
                        <div class="ef-how-card">
                            <div class="ef-how-icon">↓</div>
                            <b>1. Cast</b>
                            <span>SPACE wirft den Haken aus. Mit A/D steuerst du ihn beim Absinken.</span>
                        </div>
                        <div class="ef-how-card">
                            <div class="ef-how-icon">◆</div>
                            <b>2. Hook</b>
                            <span>Berühre einen Fisch. Seltene Arten findest du hauptsächlich in großer Tiefe.</span>
                        </div>
                        <div class="ef-how-card">
                            <div class="ef-how-icon">↟</div>
                            <b>3. Reel</b>
                            <span>Halte SPACE zum schnellen Einholen. Zu viel Spannung lässt die Leine reißen.</span>
                        </div>
                        <div class="ef-how-card">
                            <div class="ef-how-icon">✦</div>
                            <b>4. Build</b>
                            <span>Combos, Fever und Upgrades machen deinen Run immer stärker.</span>
                        </div>
                    </div>

                    <div class="ef-feature-row">
                        <span class="ef-feature">6 Fish Rarities</span>
                        <span class="ef-feature">Depth Zones</span>
                        <span class="ef-feature">Fever Mode</span>
                        <span class="ef-feature">Boss Fish</span>
                        <span class="ef-feature">Random Upgrades</span>
                        <span class="ef-feature">Highscore Run</span>
                    </div>

                    <button class="ef-start" type="button">Run starten</button>
                </div>
            </div>

            <div class="ef-overlay ef-upgrade-overlay hidden">
                <div class="ef-card">
                    <div class="ef-upgrade-title">UPGRADE!</div>
                    <div class="ef-upgrade-sub">Wähle eine Verbesserung für den restlichen Run.</div>
                    <div class="ef-upgrade-grid"></div>
                </div>
            </div>

            <div class="ef-overlay ef-end hidden">
                <div class="ef-card">
                    <div class="ef-end-title">RUN BEENDET</div>
                    <div class="ef-end-sub"></div>

                    <div class="ef-end-stats">
                        <div class="ef-end-stat"><span>Score</span><b class="ef-end-score">0</b></div>
                        <div class="ef-end-stat"><span>Catches</span><b class="ef-end-catches">0</b></div>
                        <div class="ef-end-stat"><span>Best Combo</span><b class="ef-end-combo">0</b></div>
                        <div class="ef-end-stat"><span>Deepest</span><b class="ef-end-depth">0 m</b></div>
                    </div>

                    <button class="ef-start ef-restart" type="button">Nochmal</button>
                </div>
            </div>
        `;

        container.append(style, root);

        const canvas = root.querySelector('.ef-canvas');
        const ctx = canvas.getContext('2d');

        const scoreEl = root.querySelector('.ef-score');
        const comboEl = root.querySelector('.ef-combo');
        const catchesEl = root.querySelector('.ef-catches');
        const livesEl = root.querySelector('.ef-lives');

        const depthValueEl = root.querySelector('.ef-depth-value');
        const depthZoneEl = root.querySelector('.ef-depth-zone');

        const feverFillEl = root.querySelector('.ef-fever-fill');
        const tensionFillEl = root.querySelector('.ef-tension-fill');
        const tensionValueEl = root.querySelector('.ef-tension-value');

        const statusEl = root.querySelector('.ef-status');
        const statusMainEl = root.querySelector('.ef-status-main');
        const statusSubEl = root.querySelector('.ef-status-sub');

        const mainActionBtn = root.querySelector('.ef-main-action');
        const audioBtn = root.querySelector('.ef-audio');

        const menuOverlay = root.querySelector('.ef-menu');
        const upgradeOverlay = root.querySelector('.ef-upgrade-overlay');
        const upgradeGrid = root.querySelector('.ef-upgrade-grid');
        const endOverlay = root.querySelector('.ef-end');

        const startBtn = root.querySelector('.ef-menu .ef-start');
        const restartBtn = root.querySelector('.ef-restart');

        const endSubEl = root.querySelector('.ef-end-sub');
        const endScoreEl = root.querySelector('.ef-end-score');
        const endCatchesEl = root.querySelector('.ef-end-catches');
        const endComboEl = root.querySelector('.ef-end-combo');
        const endDepthEl = root.querySelector('.ef-end-depth');

        let deepestDepth = 0;

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
            statusEl.className = `ef-status ${kind}`;
            statusMainEl.textContent = main;
            statusSubEl.textContent = sub;
        };

        const currentMaxDepthRatio = () =>
            Math.min(
                0.98,
                CONFIG.maxCastDepth +
                upgradeLevels.deep_line * 0.0225
            );

        const currentSteerSpeed = () =>
            CONFIG.steerSpeed *
            (1 + upgradeLevels.steering * 0.14);

        const currentReelSpeed = () =>
            CONFIG.baseReelSpeed *
            (1 + upgradeLevels.reel_speed * 0.12);

        const currentLineStrength = () =>
            CONFIG.baseLineStrength *
            (1 + upgradeLevels.line_strength * 0.18);

        const currentValueMultiplier = () =>
            1 + upgradeLevels.value * 0.10;

        const currentMagnetRadius = () =>
            CONFIG.hookRadius +
            upgradeLevels.magnet * 10;

        const depthRatio = () =>
            clamp(
                (hook.y - world.waterTop) /
                Math.max(1, world.bottom - world.waterTop),
                0,
                1
            );

        const currentDepthMeters = () =>
            Math.round(depthRatio() * 220);

        const depthZone = ratio => {
            if (ratio < 0.34) return 'Shallows';
            if (ratio < 0.68) return 'Bluewater';
            return 'Abyss';
        };

        const updateHud = () => {
            scoreEl.textContent = Math.round(score).toLocaleString('de-DE');
            comboEl.textContent = `x${combo}`;
            catchesEl.textContent = catches;
            livesEl.textContent = '♥'.repeat(Math.max(0, lives)) || '0';

            const depth = currentDepthMeters();
            deepestDepth = Math.max(deepestDepth, depth);

            depthValueEl.textContent = `${depth} m`;
            depthZoneEl.textContent = depthZone(depthRatio());

            const displayedTension =
                currentLineStrength() > 0
                    ? clamp(hook.tension / currentLineStrength() * 100, 0, 100)
                    : 0;

            tensionFillEl.style.width = `${displayedTension}%`;
            tensionValueEl.textContent = `${Math.round(displayedTension)}%`;

            let feverPct = 0;

            if (feverActive) {
                feverPct = clamp(feverTime / CONFIG.feverDuration * 100, 0, 100);
            } else {
                feverPct = clamp(fever / CONFIG.feverTarget * 100, 0, 100);
            }

            feverFillEl.style.width = `${feverPct}%`;

            if (phase === 'ready') {
                mainActionBtn.innerHTML = `CAST<small>SPACE</small>`;
            } else if (phase === 'casting') {
                mainActionBtn.innerHTML = `RECALL<small>SPACE</small>`;
            } else if (phase === 'reeling') {
                mainActionBtn.innerHTML = `REEL FAST<small>HOLD SPACE</small>`;
            } else {
                mainActionBtn.innerHTML = `WAIT<small>...</small>`;
            }
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
            world.waterTop = width < 760 ? 82 : 92;
            world.bottom = height - (width < 760 ? 175 : 82);
            world.centerX = width / 2;
            world.maxDepthPx =
                world.waterTop +
                (world.bottom - world.waterTop) *
                currentMaxDepthRatio();

            if (phase === 'ready' || !gameRunning) {
                hook.x = world.centerX;
                hook.y = world.waterTop + 2;
            } else {
                hook.x = clamp(hook.x, 24, width - 24);
                hook.y = clamp(hook.y, world.waterTop, world.bottom);
            }
        };

        const weightedPick = entries => {
            const total = entries.reduce((sum, item) => sum + item.weight, 0);
            let roll = Math.random() * total;

            for (const item of entries) {
                roll -= item.weight;
                if (roll <= 0) return item;
            }

            return entries[entries.length - 1];
        };

        const pickFishTypeForDepth = ratio => {
            const candidates = FISH_TYPES
                .filter(type =>
                    ratio >= type.minDepth &&
                    ratio <= type.maxDepth
                )
                .map(type => ({
                    ...type,
                    weight:
                        type.weight *
                        (feverActive && type.rarity !== 'Common' ? 1.65 : 1)
                }));

            if (!candidates.length) {
                return FISH_TYPES[0];
            }

            return weightedPick(candidates);
        };

        const createFish = forcedDepth = null => {
            const ratio =
                forcedDepth ??
                rand(0.08, 0.96);

            const type =
                pickFishTypeForDepth(ratio);

            const size =
                rand(
                    type.size[0],
                    type.size[1]
                );

            const direction =
                Math.random() < 0.5
                    ? -1
                    : 1;

            const y =
                world.waterTop +
                ratio *
                (world.bottom - world.waterTop);

            const x =
                direction > 0
                    ? rand(-90, world.width * 0.72)
                    : rand(world.width * 0.28, world.width + 90);

            return {
                id: `fish-${performance.now()}-${Math.random()}`,
                type,
                x,
                y,
                baseY: y,
                size,
                direction,
                speed: rand(type.speed[0], type.speed[1]),
                phase: Math.random() * Math.PI * 2,
                alive: true,
                hooked: false,
                value: randInt(type.value[0], type.value[1])
            };
        };

        const createHazard = () => {
            const ratio = rand(0.12, 0.95);

            const candidates = HAZARD_TYPES.filter(
                type =>
                    ratio >= type.minDepth &&
                    ratio <= type.maxDepth
            );

            const type =
                weightedPick(
                    candidates.length
                        ? candidates
                        : HAZARD_TYPES
                );

            return {
                id: `hazard-${performance.now()}-${Math.random()}`,
                type,
                x: rand(38, world.width - 38),
                y:
                    world.waterTop +
                    ratio *
                    (world.bottom - world.waterTop),
                phase: Math.random() * Math.PI * 2,
                alive: true
            };
        };

        const refillWorld = () => {
            const targetFish =
                CONFIG.spawnBase +
                Math.min(10, Math.floor(catches / 4)) +
                (feverActive ? 5 : 0);

            while (
                fish.filter(item => item.alive && !item.hooked).length <
                targetFish
            ) {
                fish.push(createFish());
            }

            const targetHazards =
                CONFIG.hazardBase +
                Math.min(4, Math.floor(catches / 10));

            while (
                hazards.filter(item => item.alive).length <
                targetHazards
            ) {
                hazards.push(createHazard());
            }
        };

        const spawnParticles = (x, y, color, count = 10) => {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = rand(25, 100);
                const life = rand(0.36, 0.62);

                particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: rand(1.3, 3.5),
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
                life: 0.72,
                maxLife: 0.72
            });
        };

        const beginCast = () => {
            if (!gameRunning || gameEnded || phase !== 'ready') return;

            ensureAudio();

            phase = 'casting';

            hook.x = world.centerX;
            hook.y = world.waterTop + 2;
            hook.vx = 0;
            hook.tension = 0;
            hook.snapTime = 0;
            hook.heldFishId = null;
            hook.heldBoss = false;

            setStatus(
                'CAST!',
                'A/D steuert den Haken · tiefer = bessere Fische.',
                ''
            );

            tone(510, 0.055, 0.022, 'sine');

            updateHud();
        };

        const beginReel = () => {
            if (
                !gameRunning ||
                gameEnded ||
                (phase !== 'casting' && phase !== 'reeling')
            ) {
                return;
            }

            phase = 'reeling';

            setStatus(
                hook.heldFishId || hook.heldBoss
                    ? 'HOOKED!'
                    : 'REELING',
                hook.heldFishId || hook.heldBoss
                    ? 'SPACE halten = schneller · Spannung beobachten!'
                    : 'Kein Fang – Haken kommt zurück.',
                hook.heldFishId || hook.heldBoss
                    ? 'gold'
                    : ''
            );

            updateHud();
        };

        const loseLife = (reason, text) => {
            lives--;
            combo = 0;
            streakGood = 0;
            fever = 0;
            feverActive = false;
            feverTime = 0;

            hook.heldFishId = null;
            hook.heldBoss = false;
            hook.tension = 0;

            phase = 'cooldown';

            setStatus(
                reason,
                text,
                'bad'
            );

            tone(220, 0.09, 0.028, 'sawtooth');

            updateHud();

            if (lives <= 0) {
                schedule(endRun, 850);
                return;
            }

            schedule(() => {
                phase = 'ready';
                hook.x = world.centerX;
                hook.y = world.waterTop + 2;

                setStatus(
                    'BEREIT',
                    'SPACE drücken und erneut auswerfen.',
                    ''
                );

                updateHud();
            }, 950);
        };

        const activateFever = () => {
            feverActive = true;
            feverTime = CONFIG.feverDuration;
            fever = CONFIG.feverTarget;

            setStatus(
                'FEVER MODE!',
                'Mehr seltene Fische · doppelte Punkte!',
                'gold'
            );

            spawnParticles(
                world.centerX,
                world.waterTop + 80,
                COLORS.gold,
                28
            );

            tone(680, 0.07, 0.035, 'sine');
            schedule(() => tone(920, 0.09, 0.038, 'sine'), 60);
        };

        const maybeSpawnBoss = () => {
            if (
                boss ||
                catches === 0 ||
                catches % CONFIG.bossEvery !== 0
            ) {
                return;
            }

            boss = {
                id: `boss-${catches}`,
                x: Math.random() < 0.5 ? -80 : world.width + 80,
                y:
                    world.waterTop +
                    rand(0.72, 0.88) *
                    (world.bottom - world.waterTop),
                size: 52,
                direction: Math.random() < 0.5 ? 1 : -1,
                speed: 72,
                pull: 1.65 + catches * 0.015,
                value: 1800 + catches * 70,
                hooked: false,
                alive: true,
                phase: 0
            };

            if (boss.x < 0) boss.direction = 1;
            else boss.direction = -1;

            setStatus(
                'MONSTER FISH!',
                'Ein Boss ist in der Tiefe aufgetaucht.',
                'gold'
            );
        };

        const catchComplete = () => {
            if (hook.heldBoss && boss) {
                const depthMult =
                    1 +
                    depthRatio() *
                    1.25;

                const comboMult =
                    1 +
                    Math.min(2.5, combo * 0.14);

                const feverMult =
                    feverActive
                        ? 2
                        : 1;

                const gained =
                    Math.round(
                        boss.value *
                        depthMult *
                        comboMult *
                        feverMult *
                        currentValueMultiplier()
                    );

                score += gained;
                catches++;
                combo += 2;
                bestCombo = Math.max(bestCombo, combo);
                streakGood += 2;
                fever += 2;

                spawnParticles(
                    world.centerX,
                    world.waterTop + 24,
                    COLORS.gold,
                    34
                );

                spawnText(
                    world.centerX,
                    world.waterTop + 54,
                    `MONSTER +${gained}`,
                    COLORS.gold
                );

                tone(660, 0.08, 0.040, 'sine');
                schedule(() => tone(920, 0.11, 0.045, 'sine'), 70);

                boss = null;
                hook.heldBoss = false;
            } else if (hook.heldFishId) {
                const held =
                    fish.find(item => item.id === hook.heldFishId);

                if (held) {
                    const ratio =
                        clamp(
                            (held.baseY - world.waterTop) /
                            Math.max(1, world.bottom - world.waterTop),
                            0,
                            1
                        );

                    const depthMult =
                        1 +
                        ratio *
                        1.2;

                    const comboMult =
                        1 +
                        Math.min(2.2, combo * 0.12);

                    const feverMult =
                        feverActive
                            ? 2
                            : 1;

                    const perfectMult =
                        hook.tension <
                        currentLineStrength() * 0.35
                            ? 1.15
                            : 1;

                    const gained =
                        Math.round(
                            held.value *
                            depthMult *
                            comboMult *
                            feverMult *
                            perfectMult *
                            currentValueMultiplier()
                        );

                    score += gained;
                    catches++;
                    combo++;
                    bestCombo = Math.max(bestCombo, combo);
                    streakGood++;
                    fever++;

                    const color =
                        held.type.rarity === 'Legendary'
                            ? COLORS.gold
                            : held.type.rarity === 'Epic'
                                ? COLORS.purple
                                : COLORS.green;

                    spawnParticles(
                        world.centerX,
                        world.waterTop + 24,
                        color,
                        held.type.rarity === 'Legendary'
                            ? 26
                            : 15
                    );

                    spawnText(
                        world.centerX,
                        world.waterTop + 54,
                        `${held.type.label} +${gained}`,
                        color
                    );

                    setStatus(
                        held.type.rarity === 'Legendary'
                            ? 'LEGENDARY CATCH!'
                            : `${held.type.rarity.toUpperCase()} CATCH`,
                        `${held.type.label} · +${gained.toLocaleString('de-DE')}`,
                        held.type.rarity === 'Legendary'
                            ? 'gold'
                            : 'good'
                    );

                    held.alive = false;
                }

                hook.heldFishId = null;
            } else {
                combo = 0;
                streakGood = 0;
            }

            hook.tension = 0;
            hook.snapTime = 0;

            if (
                !feverActive &&
                fever >= CONFIG.feverTarget
            ) {
                activateFever();
            }

            maybeSpawnBoss();

            updateHud();

            if (
                catches > 0 &&
                catches % CONFIG.upgradeEvery === 0
            ) {
                schedule(showUpgradeChoice, 420);
            } else {
                schedule(() => {
                    phase = 'ready';
                    hook.x = world.centerX;
                    hook.y = world.waterTop + 2;

                    setStatus(
                        'BEREIT',
                        'Nächster Cast!',
                        ''
                    );

                    updateHud();
                }, 620);
            }
        };

        const showUpgradeChoice = () => {
            phase = 'upgrade';
            upgradeGrid.innerHTML = '';

            const available =
                UPGRADE_POOL
                    .filter(item =>
                        upgradeLevels[item.id] <
                        item.maxLevel
                    );

            const shuffled =
                [...available]
                    .sort(() => Math.random() - 0.5)
                    .slice(0, Math.min(3, available.length));

            if (!shuffled.length) {
                phase = 'ready';
                return;
            }

            shuffled.forEach(item => {
                const button = document.createElement('button');

                button.className = 'ef-upgrade';
                button.type = 'button';

                const nextLevel =
                    upgradeLevels[item.id] + 1;

                button.innerHTML = `
                    <div class="ef-upgrade-icon">${item.icon}</div>
                    <b>${item.label}</b>
                    <span>${item.description}</span>
                    <small>Level ${nextLevel} / ${item.maxLevel}</small>
                `;

                button.addEventListener('click', () => {
                    upgradeLevels[item.id]++;

                    upgradeOverlay.classList.add('hidden');

                    phase = 'ready';
                    hook.x = world.centerX;
                    hook.y = world.waterTop + 2;

                    setStatus(
                        `${item.label.toUpperCase()} +1`,
                        'Upgrade aktiv für den restlichen Run.',
                        'good'
                    );

                    resizeCanvas();
                    updateHud();
                });

                upgradeGrid.appendChild(button);
            });

            upgradeOverlay.classList.remove('hidden');
        };

        const checkHookFish = () => {
            if (
                phase !== 'casting' ||
                hook.heldFishId ||
                hook.heldBoss
            ) {
                return;
            }

            const magnetRadius =
                currentMagnetRadius();

            if (
                boss &&
                boss.alive &&
                !boss.hooked &&
                Math.hypot(
                    hook.x - boss.x,
                    hook.y - boss.y
                ) <
                magnetRadius +
                boss.size * 0.58
            ) {
                boss.hooked = true;
                hook.heldBoss = true;

                spawnParticles(
                    hook.x,
                    hook.y,
                    COLORS.gold,
                    18
                );

                beginReel();
                return;
            }

            for (const item of fish) {
                if (
                    !item.alive ||
                    item.hooked
                ) {
                    continue;
                }

                const distance =
                    Math.hypot(
                        hook.x - item.x,
                        hook.y - item.y
                    );

                if (
                    distance <
                    magnetRadius +
                    item.size * 0.62
                ) {
                    item.hooked = true;
                    hook.heldFishId = item.id;

                    spawnParticles(
                        hook.x,
                        hook.y,
                        item.type.color,
                        10
                    );

                    tone(
                        540,
                        0.05,
                        0.022,
                        'triangle'
                    );

                    beginReel();
                    return;
                }

                if (
                    upgradeLevels.magnet > 0 &&
                    distance <
                    magnetRadius +
                    item.size +
                    upgradeLevels.magnet * 8
                ) {
                    const pull =
                        18 *
                        upgradeLevels.magnet;

                    item.x +=
                        Math.sign(hook.x - item.x) *
                        pull *
                        (1 / 60);
                }
            }
        };

        const checkHookHazards = () => {
            if (
                phase !== 'casting' ||
                hook.heldFishId ||
                hook.heldBoss
            ) {
                return;
            }

            for (const hazard of hazards) {
                if (!hazard.alive) continue;

                const radius =
                    hazard.type.id === 'jelly'
                        ? 18
                        : 14;

                if (
                    Math.hypot(
                        hook.x - hazard.x,
                        hook.y - hazard.y
                    ) <
                    CONFIG.hookRadius +
                    radius
                ) {
                    hazard.alive = false;

                    if (hazard.type.id === 'jelly') {
                        spawnParticles(
                            hazard.x,
                            hazard.y,
                            hazard.type.color,
                            18
                        );

                        loseLife(
                            'LINE SHOCK!',
                            'Jellyfish getroffen · ein Leben verloren.'
                        );

                        return;
                    }

                    score =
                        Math.max(
                            0,
                            score -
                            hazard.type.penalty
                        );

                    combo = 0;
                    streakGood = 0;
                    fever = Math.max(0, fever - 1);

                    spawnText(
                        hazard.x,
                        hazard.y,
                        `-${hazard.type.penalty}`,
                        COLORS.pink
                    );

                    setStatus(
                        hazard.type.label.toUpperCase(),
                        'Trash erwischt · Combo verloren.',
                        'bad'
                    );

                    beginReel();
                    return;
                }
            }
        };

        const updateFish = delta => {
            for (const item of fish) {
                if (!item.alive || item.hooked) continue;

                item.phase += delta;

                item.x +=
                    item.direction *
                    item.speed *
                    delta;

                item.y =
                    item.baseY +
                    Math.sin(item.phase * 1.35) *
                    7;

                if (
                    item.direction > 0 &&
                    item.x > world.width + 80
                ) {
                    item.x = -80;
                    item.baseY =
                        world.waterTop +
                        rand(0.08, 0.96) *
                        (world.bottom - world.waterTop);
                }

                if (
                    item.direction < 0 &&
                    item.x < -80
                ) {
                    item.x = world.width + 80;
                    item.baseY =
                        world.waterTop +
                        rand(0.08, 0.96) *
                        (world.bottom - world.waterTop);
                }
            }

            if (boss && boss.alive && !boss.hooked) {
                boss.phase += delta;

                boss.x +=
                    boss.direction *
                    boss.speed *
                    delta;

                boss.y +=
                    Math.sin(boss.phase * 1.4) *
                    9 *
                    delta;

                if (
                    boss.direction > 0 &&
                    boss.x > world.width + 100
                ) {
                    boss.x = -100;
                }

                if (
                    boss.direction < 0 &&
                    boss.x < -100
                ) {
                    boss.x = world.width + 100;
                }
            }
        };

        const updateHazards = delta => {
            for (const hazard of hazards) {
                if (!hazard.alive) continue;

                hazard.phase += delta;

                if (hazard.type.id === 'jelly') {
                    hazard.y +=
                        Math.sin(hazard.phase * 1.6) *
                        7 *
                        delta;
                }
            }
        };

        const updateHook = delta => {
            if (!gameRunning || gameEnded) return;

            const steer =
                (keys.left ? -1 : 0) +
                (keys.right ? 1 : 0);

            if (phase === 'casting') {
                hook.x +=
                    steer *
                    currentSteerSpeed() *
                    delta;

                const castMultiplier =
                    1 +
                    Math.min(0.35, catches * 0.006);

                hook.y +=
                    CONFIG.castSpeed *
                    castMultiplier *
                    delta;

                hook.x =
                    clamp(
                        hook.x,
                        24,
                        world.width - 24
                    );

                if (
                    hook.y >=
                    world.waterTop +
                    (world.bottom - world.waterTop) *
                    currentMaxDepthRatio()
                ) {
                    beginReel();
                }

                checkHookFish();
                checkHookHazards();
            }

            if (phase === 'reeling') {
                const heldFish =
                    hook.heldFishId
                        ? fish.find(item => item.id === hook.heldFishId)
                        : null;

                const pull =
                    hook.heldBoss && boss
                        ? boss.pull
                        : heldFish
                            ? heldFish.type.pull
                            : 0;

                const difficultyScale =
                    1 +
                    catches *
                    0.012;

                const fishWave =
                    Math.sin(
                        performance.now() *
                        0.0045 +
                        (heldFish?.phase ?? boss?.phase ?? 0)
                    );

                if (pull > 0) {
                    hook.x +=
                        fishWave *
                        pull *
                        42 *
                        difficultyScale *
                        delta;

                    hook.x =
                        clamp(
                            hook.x,
                            20,
                            world.width - 20
                        );
                }

                const fastReel =
                    keys.reel;

                const reelSpeed =
                    currentReelSpeed() *
                    (fastReel ? 1.55 : 1);

                hook.y -=
                    reelSpeed *
                    delta;

                if (
                    heldFish
                ) {
                    heldFish.x = hook.x;
                    heldFish.y = hook.y + 14;
                }

                if (
                    hook.heldBoss &&
                    boss
                ) {
                    boss.x = hook.x;
                    boss.y = hook.y + 22;
                }

                if (
                    pull > 0
                ) {
                    const pullFactor =
                        pull *
                        difficultyScale;

                    if (fastReel) {
                        hook.tension +=
                            CONFIG.tensionGain *
                            pullFactor *
                            delta;
                    } else {
                        hook.tension +=
                            CONFIG.tensionGain *
                            pullFactor *
                            0.30 *
                            delta;

                        hook.tension -=
                            CONFIG.tensionRecovery *
                            delta;
                    }

                    hook.tension +=
                        Math.max(
                            0,
                            Math.abs(fishWave) - 0.58
                        ) *
                        18 *
                        pullFactor *
                        delta;

                    hook.tension =
                        clamp(
                            hook.tension,
                            0,
                            currentLineStrength() * 1.3
                        );

                    if (
                        hook.tension >
                        currentLineStrength()
                    ) {
                        hook.snapTime += delta;
                    } else {
                        hook.snapTime =
                            Math.max(
                                0,
                                hook.snapTime - delta * 1.5
                            );
                    }

                    if (
                        hook.snapTime >=
                        CONFIG.snapGrace
                    ) {
                        if (heldFish) {
                            heldFish.alive = false;
                        }

                        if (
                            hook.heldBoss &&
                            boss
                        ) {
                            boss.alive = false;
                            boss = null;
                        }

                        loseLife(
                            'LINE SNAPPED!',
                            'Zu viel Spannung · Fisch verloren.'
                        );

                        return;
                    }
                } else {
                    hook.tension =
                        Math.max(
                            0,
                            hook.tension -
                            CONFIG.tensionRecovery *
                            2 *
                            delta
                        );
                }

                if (
                    hook.y <=
                    world.waterTop + 2
                ) {
                    hook.y =
                        world.waterTop + 2;

                    phase = 'cooldown';

                    catchComplete();
                }
            }
        };

        const updateFever = delta => {
            if (!feverActive) return;

            feverTime -= delta;

            if (feverTime <= 0) {
                feverActive = false;
                feverTime = 0;
                fever = 0;

                setStatus(
                    'FEVER ENDED',
                    'Baue die nächste Fangserie auf.',
                    ''
                );
            }
        };

        const updateParticles = delta => {
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];

                p.life -= delta;
                p.x += p.vx * delta;
                p.y += p.vy * delta;

                p.vx *= Math.pow(0.93, delta * 60);
                p.vy *= Math.pow(0.93, delta * 60);

                if (p.life <= 0) {
                    particles.splice(i, 1);
                }
            }

            for (let i = floatTexts.length - 1; i >= 0; i--) {
                const text = floatTexts[i];

                text.life -= delta;
                text.y -= 23 * delta;

                if (text.life <= 0) {
                    floatTexts.splice(i, 1);
                }
            }
        };

        const update = delta => {
            if (gameRunning && !gameEnded && phase !== 'upgrade') {
                updateFever(delta);
                updateFish(delta);
                updateHazards(delta);
                updateHook(delta);
                refillWorld();
            }

            updateParticles(delta);
            updateHud();
        };

        const drawBackground = () => {
            const gradient =
                ctx.createLinearGradient(
                    0,
                    world.waterTop,
                    0,
                    world.bottom
                );

            gradient.addColorStop(0, '#0d87ae');
            gradient.addColorStop(0.32, '#0b567c');
            gradient.addColorStop(0.68, '#083453');
            gradient.addColorStop(1, '#061c32');

            ctx.fillStyle = '#07101a';
            ctx.fillRect(0, 0, world.width, world.height);

            ctx.fillStyle = gradient;
            ctx.fillRect(
                0,
                world.waterTop,
                world.width,
                world.bottom - world.waterTop
            );

            ctx.strokeStyle =
                'rgba(255,255,255,.12)';

            ctx.lineWidth = 2;

            ctx.beginPath();

            for (let x = 0; x <= world.width; x += 28) {
                const y =
                    world.waterTop +
                    Math.sin(
                        x * 0.045 +
                        performance.now() * 0.0018
                    ) *
                    3;

                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            ctx.stroke();

            for (let i = 1; i <= 5; i++) {
                const ratio = i / 6;

                ctx.strokeStyle =
                    'rgba(255,255,255,.035)';

                ctx.lineWidth = 1;
                ctx.setLineDash([6, 11]);

                const y =
                    world.waterTop +
                    ratio *
                    (world.bottom - world.waterTop);

                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(world.width, y);
                ctx.stroke();
            }

            ctx.setLineDash([]);
        };

        const drawBoat = () => {
            ctx.save();

            ctx.translate(
                world.centerX,
                world.waterTop - 15
            );

            ctx.fillStyle = '#d9924d';
            ctx.strokeStyle = '#ffd3a0';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(-46, -7);
            ctx.lineTo(46, -7);
            ctx.lineTo(30, 9);
            ctx.lineTo(-32, 9);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#23394b';
            ctx.fillRect(-8, -25, 16, 18);

            ctx.strokeStyle = '#a8eaff';
            ctx.beginPath();
            ctx.moveTo(0, -25);
            ctx.lineTo(26, -47);
            ctx.stroke();

            ctx.restore();
        };

        const drawFish = item => {
            if (!item.alive) return;

            ctx.save();

            ctx.translate(item.x, item.y);

            if (!item.hooked) {
                ctx.scale(item.direction, 1);
            }

            const size = item.size;

            ctx.shadowBlur =
                item.type.rarity === 'Legendary'
                    ? 16
                    : item.type.rarity === 'Epic'
                        ? 11
                        : 6;

            ctx.shadowColor =
                item.type.glow;

            ctx.fillStyle =
                item.type.color;

            ctx.beginPath();
            ctx.ellipse(
                0,
                0,
                size,
                size * 0.50,
                0,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-size * 0.90, 0);
            ctx.lineTo(-size * 1.45, -size * 0.50);
            ctx.lineTo(-size * 1.36, size * 0.48);
            ctx.closePath();
            ctx.fill();

            if (item.type.id === 'swordfish') {
                ctx.beginPath();
                ctx.moveTo(size * 0.82, -1);
                ctx.lineTo(size * 1.55, -2);
                ctx.lineTo(size * 0.86, 3);
                ctx.closePath();
                ctx.fill();
            }

            ctx.fillStyle = '#06121a';

            ctx.beginPath();
            ctx.arc(
                size * 0.48,
                -size * 0.12,
                Math.max(2, size * 0.08),
                0,
                Math.PI * 2
            );

            ctx.fill();

            if (
                item.type.rarity === 'Legendary'
            ) {
                ctx.fillStyle = '#fff3a5';

                ctx.beginPath();
                ctx.arc(
                    size * 0.72,
                    -size * 0.55,
                    3,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }

            ctx.restore();
        };

        const drawBoss = () => {
            if (!boss || !boss.alive) return;

            ctx.save();

            ctx.translate(
                boss.x,
                boss.y
            );

            if (!boss.hooked) {
                ctx.scale(boss.direction, 1);
            }

            ctx.shadowBlur = 22;
            ctx.shadowColor = COLORS.gold;

            ctx.fillStyle = '#4d224f';

            ctx.beginPath();
            ctx.ellipse(
                0,
                0,
                boss.size,
                boss.size * 0.47,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();

            ctx.fillStyle = '#ffce5c';

            ctx.beginPath();
            ctx.moveTo(-boss.size * 0.85, 0);
            ctx.lineTo(-boss.size * 1.45, -boss.size * 0.55);
            ctx.lineTo(-boss.size * 1.32, boss.size * 0.52);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#ffdc75';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.arc(
                0,
                0,
                boss.size * 0.72,
                -0.7,
                0.7
            );
            ctx.stroke();

            ctx.fillStyle = '#fff4a6';
            ctx.beginPath();
            ctx.arc(
                boss.size * 0.5,
                -boss.size * 0.13,
                5,
                0,
                Math.PI * 2
            );
            ctx.fill();

            ctx.restore();
        };

        const drawHazard = hazard => {
            if (!hazard.alive) return;

            ctx.save();
            ctx.translate(hazard.x, hazard.y);

            if (hazard.type.id === 'jelly') {
                ctx.shadowBlur = 12;
                ctx.shadowColor = hazard.type.color;
                ctx.fillStyle = hazard.type.color;

                ctx.beginPath();
                ctx.arc(
                    0,
                    0,
                    13,
                    Math.PI,
                    Math.PI * 2
                );
                ctx.lineTo(13, 3);
                ctx.lineTo(-13, 3);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = '#ffb5ea';
                ctx.lineWidth = 2;

                for (let x = -8; x <= 8; x += 8) {
                    ctx.beginPath();
                    ctx.moveTo(x, 3);
                    ctx.quadraticCurveTo(
                        x + 5,
                        14,
                        x,
                        23
                    );
                    ctx.stroke();
                }
            } else if (hazard.type.id === 'boot') {
                ctx.fillStyle = hazard.type.color;
                ctx.fillRect(-8, -10, 10, 20);
                ctx.fillRect(-8, 4, 18, 8);
            } else {
                ctx.fillStyle = hazard.type.color;
                ctx.rotate(0.25);
                ctx.fillRect(-7, -11, 14, 22);
                ctx.strokeStyle = '#c9d0d5';
                ctx.strokeRect(-7, -11, 14, 22);
            }

            ctx.restore();
        };

        const drawLineAndHook = () => {
            if (!gameRunning || phase === 'upgrade') return;

            ctx.save();

            ctx.strokeStyle =
                hook.tension >
                currentLineStrength() * 0.82
                    ? COLORS.red
                    : 'rgba(230,244,255,.78)';

            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.moveTo(
                world.centerX + 26,
                world.waterTop - 47
            );
            ctx.lineTo(
                hook.x,
                hook.y
            );
            ctx.stroke();

            ctx.translate(hook.x, hook.y);

            ctx.strokeStyle = '#e5f4ff';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(
                0,
                0,
                7,
                -Math.PI * 0.1,
                Math.PI * 0.9
            );
            ctx.stroke();

            ctx.restore();
        };

        const drawParticles = () => {
            for (const p of particles) {
                const alpha =
                    clamp(
                        p.life / p.maxLife,
                        0,
                        1
                    );

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 7;
                ctx.shadowColor = p.color;

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
                        text.life / text.maxLife,
                        0,
                        1
                    );

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = text.color;
                ctx.shadowBlur = 8;
                ctx.shadowColor = text.color;
                ctx.font = '950 13px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

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

            hazards.forEach(drawHazard);
            fish.forEach(drawFish);
            drawBoss();

            drawBoat();
            drawLineAndHook();
            drawParticles();
        };

        const loop = timestamp => {
            if (destroyed) return;

            const delta =
                Math.min(
                    0.033,
                    Math.max(
                        0,
                        (timestamp - lastFrame) / 1000
                    )
                );

            lastFrame = timestamp;

            update(delta);
            draw();

            animationId =
                requestAnimationFrame(loop);
        };

        const mainAction = () => {
            ensureAudio();

            if (phase === 'ready') {
                beginCast();
                return;
            }

            if (phase === 'casting') {
                beginReel();
            }
        };

        const onKeyDown = event => {
            const key = event.key.toLowerCase();

            if (
                key === 'a' ||
                key === 'arrowleft'
            ) {
                keys.left = true;
                event.preventDefault();
            }

            if (
                key === 'd' ||
                key === 'arrowright'
            ) {
                keys.right = true;
                event.preventDefault();
            }

            if (
                event.code === 'Space'
            ) {
                event.preventDefault();
                keys.reel = true;

                if (
                    !event.repeat &&
                    phase !== 'reeling'
                ) {
                    mainAction();
                }
            }
        };

        const onKeyUp = event => {
            const key = event.key.toLowerCase();

            if (
                key === 'a' ||
                key === 'arrowleft'
            ) {
                keys.left = false;
            }

            if (
                key === 'd' ||
                key === 'arrowright'
            ) {
                keys.right = false;
            }

            if (
                event.code === 'Space'
            ) {
                keys.reel = false;
            }
        };

        const onPointerMove = event => {
            const rect =
                canvas.getBoundingClientRect();

            pointerX =
                event.clientX -
                rect.left;

            if (
                gameRunning &&
                phase === 'casting'
            ) {
                hook.x +=
                    clamp(
                        pointerX - hook.x,
                        -currentSteerSpeed() * 0.03,
                        currentSteerSpeed() * 0.03
                    );
            }
        };

        const calculateFinalScore = () =>
            Math.max(
                0,
                Math.round(
                    score +
                    catches * 25 +
                    bestCombo * 60 +
                    deepestDepth * 3
                )
            );

        const endRun = () => {
            if (gameEnded) return;

            clearTimers();

            gameEnded = true;
            gameRunning = false;
            phase = 'ended';

            const finalScore =
                calculateFinalScore();

            services
                ?.highscores
                ?.saveHighscore?.(
                    'endless-fishing',
                    finalScore
                );

            endSubEl.textContent =
                `${catches} Fische · ${deepestDepth} m maximale Tiefe`;

            endScoreEl.textContent =
                finalScore.toLocaleString('de-DE');

            endCatchesEl.textContent =
                catches;

            endComboEl.textContent =
                bestCombo;

            endDepthEl.textContent =
                `${deepestDepth} m`;

            endOverlay.classList.remove('hidden');
        };

        const resetRun = () => {
            score = 0;
            catches = 0;
            combo = 0;
            bestCombo = 0;
            lives = CONFIG.maxLives;
            fever = 0;
            feverActive = false;
            feverTime = 0;
            streakGood = 0;
            deepestDepth = 0;

            upgradeLevels = {
                line_strength: 0,
                reel_speed: 0,
                steering: 0,
                deep_line: 0,
                magnet: 0,
                value: 0
            };

            fish = [];
            hazards = [];
            particles = [];
            floatTexts = [];
            boss = null;

            phase = 'ready';
            gameEnded = false;
            gameRunning = true;

            hook.x = world.centerX;
            hook.y = world.waterTop + 2;
            hook.tension = 0;
            hook.snapTime = 0;
            hook.heldFishId = null;
            hook.heldBoss = false;

            refillWorld();

            setStatus(
                'BEREIT',
                'SPACE drücken und die Leine auswerfen.',
                ''
            );

            updateHud();
        };

        const startRun = () => {
            clearTimers();
            ensureAudio();

            menuOverlay.classList.add('hidden');
            endOverlay.classList.add('hidden');
            upgradeOverlay.classList.add('hidden');

            resetRun();
        };

        startBtn.addEventListener('click', startRun);
        restartBtn.addEventListener('click', startRun);

        mainActionBtn.addEventListener('pointerdown', event => {
            event.preventDefault();

            if (phase === 'reeling') {
                keys.reel = true;
            } else {
                mainAction();
            }
        });

        mainActionBtn.addEventListener('pointerup', () => {
            keys.reel = false;
        });

        mainActionBtn.addEventListener('pointerleave', () => {
            keys.reel = false;
        });

        audioBtn.addEventListener('click', () => {
            muted = !muted;

            audioBtn.textContent =
                `Sound: ${muted ? 'Aus' : 'An'}`;

            if (!muted) {
                ensureAudio();
                tone(620, 0.04, 0.02);
            }
        });

        canvas.addEventListener('pointermove', onPointerMove);

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        resizeObserver =
            new ResizeObserver(
                resizeCanvas
            );

        resizeObserver.observe(root);

        resizeCanvas();
        updateHud();

        animationId =
            requestAnimationFrame(loop);

        return {
            destroy: () => {
                destroyed = true;
                gameRunning = false;

                clearTimers();

                cancelAnimationFrame(animationId);
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
    HAZARD_TYPES,
    UPGRADE_POOL,
    CONFIG
};
