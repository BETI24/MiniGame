const GAME_ID = 'forest-frenzy';

const CONFIG = {
    sceneWidth: 2500,
    baseRoundTime: 72,
    bonusPhaseTime: 3.8,
    maxAnimals: 14,

    panEdge: 0.16,
    panSpeed: 470,

    comboWindow: 1.35,
    comboMax: 6,

    spawnBase: 0.60,
    spawnMin: 0.30,

    highscoreId: 'forest-frenzy'
};

const DIFFICULTY = {
    easy: {
        label: 'Easy',
        timeMult: 1.18,
        speedMult: 0.86,
        spawnMult: 1.08
    },
    normal: {
        label: 'Normal',
        timeMult: 1.0,
        speedMult: 1.0,
        spawnMult: 1.0
    },
    hard: {
        label: 'Hard',
        timeMult: 0.88,
        speedMult: 1.16,
        spawnMult: 0.91
    }
};

const SPECIES = {
    duck: {
        name: 'Duck',
        icon: '🦆',
        points: 80,
        hitRadius: 25,
        speed: [145, 220],
        band: [0.19, 0.39],
        layer: [0.68, 0.92]
    },
    rabbit: {
        name: 'Rabbit',
        icon: '🐇',
        points: 105,
        hitRadius: 23,
        speed: [115, 175],
        band: [0.70, 0.82],
        layer: [0.92, 1.15]
    },
    boar: {
        name: 'Boar',
        icon: '🐗',
        points: 135,
        hitRadius: 30,
        speed: [95, 150],
        band: [0.62, 0.76],
        layer: [0.96, 1.18]
    },
    deer: {
        name: 'Deer',
        icon: '🦌',
        points: 180,
        hitRadius: 31,
        speed: [120, 178],
        band: [0.49, 0.65],
        layer: [0.82, 1.02]
    },
    mole: {
        name: 'Mole',
        icon: '🐀',
        points: 70,
        hitRadius: 22,
        speed: [0, 0],
        band: [0.72, 0.83],
        layer: [0.96, 1.14]
    },
    woodpecker: {
        name: 'Woodpecker',
        icon: '🐦',
        points: 125,
        hitRadius: 18,
        speed: [0, 0],
        band: [0.27, 0.55],
        layer: [0.78, 0.96]
    },
    goose: {
        name: 'Goose',
        icon: '🪿',
        points: 155,
        hitRadius: 28,
        speed: [132, 195],
        band: [0.16, 0.34],
        layer: [0.76, 1.02]
    },
    fox: {
        name: 'Fox',
        icon: '🦊',
        points: 195,
        hitRadius: 25,
        speed: [150, 220],
        band: [0.60, 0.76],
        layer: [0.88, 1.10]
    },
    pheasant: {
        name: 'Pheasant',
        icon: '🐦',
        points: 170,
        hitRadius: 21,
        speed: [165, 245],
        band: [0.28, 0.47],
        layer: [0.74, 0.98]
    },
    goat: {
        name: 'Mountain Goat',
        icon: '🐐',
        points: 225,
        hitRadius: 29,
        speed: [92, 148],
        band: [0.51, 0.67],
        layer: [0.84, 1.05]
    }
};

const WEAPONS = {
    shotgun: {
        id: 'shotgun',
        name: 'Old Shotgun',
        short: 'SHOTGUN',
        magSize: 5,
        reserve: Infinity,
        reload: 0.92,
        fireDelay: 0.36,
        aimRadius: 27,
        scoreMult: 1.0,
        color: '#4b3427',
        unlocked: true,
        autoReload: false
    },
    crossbow: {
        id: 'crossbow',
        name: 'Hunting Crossbow',
        short: 'CROSSBOW',
        magSize: 1,
        reserve: 16,
        reload: 1.05,
        fireDelay: 0.52,
        aimRadius: 12,
        scoreMult: 1.30,
        color: '#54402c',
        unlocked: false,
        autoReload: true
    },
    rifle: {
        id: 'rifle',
        name: 'Hunter Rifle',
        short: 'RIFLE',
        magSize: 8,
        reserve: 32,
        reload: 1.25,
        fireDelay: 0.20,
        aimRadius: 9,
        scoreMult: 1.18,
        color: '#36434b',
        unlocked: false,
        autoReload: false
    },
    dynamite: {
        id: 'dynamite',
        name: 'Dynamite',
        short: 'DYNAMITE',
        magSize: 1,
        reserve: 3,
        reload: 0.75,
        fireDelay: 0.85,
        aimRadius: 118,
        scoreMult: 0.82,
        color: '#9c3030',
        unlocked: false,
        autoReload: true,
        explosive: true
    }
};

const ROUNDS = [
    {
        name: 'Morning Meadow',
        area: 'Green Valley',
        quotas: { duck: 5, rabbit: 5, boar: 4 },
        speciesPool: ['duck','rabbit','boar'],
        palette: 'meadow',
        sceneWidth: 2500,
        timeMult: 1.00,
        spawnMult: 1.00,
        maxAnimals: 13
    },
    {
        name: 'Forest Edge',
        area: 'Pine Woods',
        quotas: { deer: 4, mole: 5, duck: 6 },
        speciesPool: ['deer','mole','duck','woodpecker','rabbit'],
        palette: 'forest',
        sceneWidth: 2650,
        timeMult: 1.02,
        spawnMult: .96,
        maxAnimals: 14
    },
    {
        name: 'Wild Clearing',
        area: 'Golden Clearing',
        quotas: { boar: 6, rabbit: 6, deer: 5, woodpecker: 3 },
        speciesPool: ['boar','rabbit','deer','woodpecker','duck'],
        palette: 'golden',
        sceneWidth: 2780,
        timeMult: 1.04,
        spawnMult: .92,
        maxAnimals: 15
    },
    {
        name: 'Marsh Run',
        area: 'Foggy Wetlands',
        quotas: { goose: 6, fox: 4, duck: 5, mole: 4 },
        speciesPool: ['goose','fox','duck','mole','deer'],
        palette: 'swamp',
        sceneWidth: 2920,
        timeMult: 1.08,
        spawnMult: .90,
        maxAnimals: 15
    },
    {
        name: 'Autumn Trail',
        area: 'Redleaf Forest',
        quotas: { pheasant: 6, fox: 6, boar: 5, deer: 5 },
        speciesPool: ['pheasant','fox','boar','deer','rabbit'],
        palette: 'autumn',
        sceneWidth: 3060,
        timeMult: 1.10,
        spawnMult: .86,
        maxAnimals: 16
    },
    {
        name: 'Alpine Ridge',
        area: 'Snowline Mountains',
        quotas: { goat: 6, fox: 5, deer: 6, goose: 5, pheasant: 4 },
        speciesPool: ['goat','fox','deer','goose','pheasant'],
        palette: 'alpine',
        sceneWidth: 3220,
        timeMult: 1.14,
        spawnMult: .83,
        maxAnimals: 17
    }
];

export default {
    manifest: {
        id: GAME_ID,
        name: 'Forest Frenzy',
        description: 'Cartoon shooting-gallery hunt: finish animal quotas, find hidden gimmicks and chase a high score.',
        icon: '🎯',
        tags: ['Shooter', 'Arcade']
    },

    init: (container, services) => {
        let destroyed = false;
        let raf = 0;
        let resizeObserver = null;
        let lastTime = performance.now();

        let width = 1;
        let height = 1;
        let dpr = 1;

        let running = false;
        let gameOver = false;
        let phase = 'menu'; // menu | hunt | bonus | over

        let difficultyKey = 'normal';

        let roundIndex = 0;
        let roundTime = 0;
        let carryTime = 0;
        let bonusTimer = 0;
        let bonusTarget = null;

        let score = 0;
        let bestRound = 0;
        let hits = 0;
        let shots = 0;

        let combo = 0;
        let comboTimer = 0;

        let cameraX = 0;
        let cameraTargetX = 0;
        let sceneWidth = CONFIG.sceneWidth;

        let spawnTimer = 0.3;
        let nextAnimalId = 1;

        let animals = [];
        let particles = [];
        let floatingText = [];

        let quota = {};
        let quotaDone = {};

        let mouse = {
            x: 0,
            y: 0,
            inside: false
        };

        let audio = null;
        let muted = false;

        let weaponStates = {};
        let weaponId = 'shotgun';
        let triggerCooldown = 0;
        let reloading = false;
        let reloadTimer = 0;
        let shake = 0;
        let muzzleFlash = 0;

        let message = '';
        let messageTimer = 0;

        let props = [];

        const style = document.createElement('style');
        style.textContent = `
            .ff-game{
                position:relative;
                width:100%;
                height:100%;
                overflow:hidden;
                background:#6cae64;
                font-family:Arial,Helvetica,sans-serif;
                user-select:none;
                color:#2d261d;
            }

            .ff-game *{box-sizing:border-box}

            .ff-canvas{
                display:block;
                width:100%;
                height:100%;
                cursor:none;
            }

            .ff-hud{
                position:absolute;
                inset:0;
                z-index:10;
                pointer-events:none;
            }

            .ff-top{
                position:absolute;
                left:10px;
                right:10px;
                top:9px;
                display:flex;
                align-items:flex-start;
                justify-content:space-between;
                gap:12px;
            }

            .ff-timer,
            .ff-score,
            .ff-quota-panel{
                border:3px solid #51371e;
                background:linear-gradient(#d8bd76,#b8924f);
                box-shadow:
                    inset 0 0 0 2px #f5df9c,
                    0 3px 0 rgba(0,0,0,.22);
                color:#2e2519;
                text-shadow:0 1px #f5df9c;
            }

            .ff-timer{
                min-width:96px;
                padding:5px 10px 6px;
                text-align:center;
            }

            .ff-time-num{
                font-size:1.68rem;
                font-weight:1000;
                line-height:1;
            }

            .ff-round-name{
                margin-top:2px;
                font-size:.65rem;
                font-weight:900;
                text-transform:uppercase;
            }

            .ff-quota-panel{
                flex:1;
                max-width:520px;
                display:flex;
                justify-content:center;
                gap:7px;
                padding:4px 7px;
            }

            .ff-quota{
                min-width:83px;
                display:flex;
                align-items:center;
                justify-content:center;
                gap:4px;
                padding:3px 5px;
                border-right:1px solid rgba(78,51,22,.25);
                font-size:.84rem;
                font-weight:1000;
            }

            .ff-quota:last-child{border-right:0}

            .ff-quota.done{
                color:#276632;
                opacity:.72;
            }

            .ff-quota-icon{font-size:1.22rem}

            .ff-score{
                min-width:124px;
                padding:5px 10px;
                text-align:right;
            }

            .ff-score-label{
                font-size:.61rem;
                font-weight:1000;
                text-transform:uppercase;
            }

            .ff-score-num{
                font-size:1.58rem;
                font-weight:1000;
                line-height:1.05;
            }

            .ff-bottom-left{
                position:absolute;
                left:12px;
                bottom:12px;
                display:flex;
                flex-direction:column;
                gap:5px;
            }

            .ff-weapon-box,
            .ff-combo{
                border:2px solid #3d2b1e;
                background:rgba(239,216,158,.92);
                box-shadow:0 3px 0 rgba(0,0,0,.16);
            }

            .ff-weapon-box{
                min-width:300px;
                padding:9px 11px;
            }

            .ff-weapon-name{
                font-size:.92rem;
                font-weight:1000;
                text-transform:uppercase;
            }

            .ff-weapon-hint{
                margin-top:2px;
                color:#705b41;
                font-size:.64rem;
                font-weight:800;
            }

            .ff-weapon-topline{
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:10px;
                margin-bottom:3px;
            }

            .ff-equipped-label{
                color:#806443;
                font-size:.58rem;
                font-weight:1000;
                letter-spacing:.10em;
                text-transform:uppercase;
            }

            .ff-reload-state{
                color:#31673a;
                font-size:.62rem;
                font-weight:1000;
                text-transform:uppercase;
            }

            .ff-reload-state.warn{color:#9f3c26}
            .ff-reload-state.loading{color:#9a681f}

            .ff-weapon-slotbar{
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:4px;
                margin-top:7px;
            }

            .ff-weapon-slot{
                min-width:0;
                padding:4px 5px;
                border:1px solid #7b5b36;
                background:rgba(116,88,53,.10);
                color:#70573d;
                font-size:.54rem;
                font-weight:1000;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
                text-align:center;
            }

            .ff-weapon-slot b{
                display:block;
                color:#4b3827;
                font-size:.67rem;
            }

            .ff-weapon-slot.active{
                background:#557c3f;
                border-color:#365529;
                color:#f4eccb;
                box-shadow:inset 0 0 0 1px rgba(255,255,255,.16);
            }

            .ff-weapon-slot.active b{color:#fff7d2}

            .ff-weapon-slot.locked{
                opacity:.34;
                filter:grayscale(1);
            }

            .ff-reload-track{
                position:relative;
                height:7px;
                margin-top:6px;
                border:1px solid #725332;
                background:rgba(68,47,30,.20);
                overflow:hidden;
            }

            .ff-reload-fill{
                height:100%;
                width:0%;
                background:#d49532;
                transition:width .05s linear;
            }

            .ff-ammo-label{
                color:#76583a;
                font-size:.55rem;
                font-weight:1000;
                text-align:right;
                text-transform:uppercase;
            }

            .ff-reload-alert{
                position:absolute;
                left:50%;
                bottom:23%;
                transform:translateX(-50%);
                min-width:190px;
                padding:8px 13px;
                border:3px solid #5b321d;
                background:rgba(240,206,117,.96);
                color:#8c341e;
                font-size:.87rem;
                font-weight:1000;
                text-align:center;
                text-transform:uppercase;
                box-shadow:0 4px 0 rgba(0,0,0,.16);
                opacity:0;
                transition:opacity .08s;
            }

            .ff-reload-alert.on{opacity:1}

            .ff-combo{
                width:max-content;
                padding:4px 7px;
                color:#98431f;
                font-size:.76rem;
                font-weight:1000;
                opacity:0;
                transition:opacity .12s;
            }

            .ff-ammo{
                position:absolute;
                right:14px;
                bottom:12px;
                display:flex;
                align-items:flex-end;
                gap:8px;
                padding:9px 11px;
                border:2px solid #3d2b1e;
                background:rgba(239,216,158,.92);
                box-shadow:0 3px 0 rgba(0,0,0,.16);
            }

            .ff-shells{
                display:flex;
                align-items:flex-end;
                gap:3px;
                min-height:37px;
            }

            .ff-shell{
                width:9px;
                height:31px;
                border:1px solid #4d3625;
                border-radius:5px 5px 2px 2px;
                background:linear-gradient(90deg,#d5b065,#f1d68d,#b48d4f);
            }

            .ff-shell.empty{
                opacity:.18;
                filter:grayscale(1);
            }

            .ff-ammo-text{
                min-width:48px;
                color:#473627;
                font-size:.79rem;
                font-weight:1000;
                text-align:right;
            }

            .ff-message{
                position:absolute;
                left:50%;
                top:18%;
                transform:translateX(-50%);
                padding:7px 14px;
                border:2px solid #51371e;
                background:rgba(242,218,153,.94);
                color:#693b1d;
                font-size:.92rem;
                font-weight:1000;
                text-transform:uppercase;
                opacity:0;
            }

            .ff-bonus-label{
                position:absolute;
                left:50%;
                top:11%;
                transform:translateX(-50%);
                color:#fff0a0;
                font-size:1.3rem;
                font-weight:1000;
                text-shadow:
                    -2px -2px #63311f,
                    2px -2px #63311f,
                    -2px 2px #63311f,
                    2px 2px #63311f,
                    0 4px 8px rgba(0,0,0,.3);
                display:none;
            }

            .ff-bonus-label.on{display:block}

            .ff-audio{
                position:absolute;
                left:12px;
                top:80px;
                z-index:12;
                padding:6px 8px;
                border:2px solid #51371e;
                background:#d8bd76;
                color:#392b1f;
                font:inherit;
                font-size:.66rem;
                font-weight:1000;
                cursor:pointer;
                pointer-events:auto;
            }

            .ff-overlay{
                position:absolute;
                inset:0;
                z-index:30;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:22px;
                background:rgba(48,70,39,.58);
                backdrop-filter:blur(4px);
            }

            .ff-overlay.hidden{display:none}

            .ff-card{
                width:min(690px,100%);
                padding:25px 27px;
                border:5px solid #4b321d;
                outline:2px solid #c79e56;
                background:
                    linear-gradient(rgba(255,248,217,.96),rgba(222,194,129,.96)),
                    repeating-linear-gradient(90deg,#c49755 0 8px,#bd8c4d 8px 16px);
                box-shadow:0 18px 55px rgba(0,0,0,.30);
                text-align:center;
            }

            .ff-logo{
                color:#3f6f2f;
                font-size:clamp(2.3rem,7vw,4.7rem);
                line-height:.92;
                font-weight:1000;
                letter-spacing:-.05em;
                text-shadow:
                    2px 2px #f0d98f,
                    4px 4px #53371f;
            }

            .ff-logo span{color:#a34a29}

            .ff-sub{
                margin:10px auto 17px;
                max-width:570px;
                color:#684c31;
                font-size:.86rem;
                line-height:1.5;
                font-weight:700;
            }

            .ff-section{
                margin:13px 0 6px;
                color:#5b412b;
                font-size:.67rem;
                font-weight:1000;
                text-transform:uppercase;
                letter-spacing:.08em;
            }

            .ff-diffs{
                display:flex;
                gap:7px;
            }

            .ff-diff{
                flex:1;
                padding:9px 7px;
                border:2px solid #79532e;
                background:#d6b56c;
                color:#4d371f;
                font:inherit;
                font-size:.72rem;
                font-weight:1000;
                cursor:pointer;
            }

            .ff-diff.selected{
                background:#638d44;
                color:#fff7ce;
                border-color:#3e5e2b;
            }

            .ff-play{
                width:100%;
                margin-top:15px;
                height:45px;
                border:3px solid #4e321b;
                background:#a64d2b;
                color:#fff4d2;
                font:inherit;
                font-size:.82rem;
                font-weight:1000;
                cursor:pointer;
                box-shadow:inset 0 -3px rgba(0,0,0,.14);
            }

            .ff-rules{
                display:grid;
                grid-template-columns:repeat(3,1fr);
                gap:7px;
                margin-top:13px;
            }

            .ff-rule{
                padding:8px 7px;
                border:2px solid rgba(93,61,31,.25);
                background:rgba(255,246,207,.45);
                color:#74563a;
                font-size:.66rem;
                line-height:1.42;
            }

            .ff-rule b{
                display:block;
                margin-bottom:2px;
                color:#4f3825;
                font-size:.63rem;
            }

            .ff-end-title{
                color:#943d25;
                font-size:2rem;
                font-weight:1000;
            }

            .ff-end-sub{
                margin:6px 0 14px;
                color:#705136;
            }

            .ff-end-stats{
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:7px;
                margin-bottom:13px;
            }

            .ff-end-stat{
                padding:9px 6px;
                border:2px solid rgba(93,61,31,.24);
                background:rgba(255,246,207,.45);
            }

            .ff-end-stat span{
                display:block;
                color:#806144;
                font-size:.51rem;
                font-weight:1000;
                text-transform:uppercase;
            }

            .ff-end-stat b{
                display:block;
                margin-top:3px;
                color:#4d3725;
                font-size:.95rem;
            }

            @media(max-width:760px){
                .ff-quota-panel{gap:2px}
                .ff-quota{min-width:60px;font-size:.55rem}
                .ff-score{min-width:95px}
                .ff-rules{grid-template-columns:1fr}
                .ff-end-stats{grid-template-columns:1fr 1fr}
                .ff-weapon-box{min-width:150px}
            }
        `;

        const root = document.createElement('div');
        root.className = 'ff-game';

        root.innerHTML = `
            <canvas class="ff-canvas"></canvas>

            <div class="ff-hud">
                <div class="ff-top">
                    <div class="ff-timer">
                        <div class="ff-time-num">1:12</div>
                        <div class="ff-round-name">Morning Meadow</div>
                    </div>

                    <div class="ff-quota-panel"></div>

                    <div class="ff-score">
                        <div class="ff-score-label">Score</div>
                        <div class="ff-score-num">000000</div>
                    </div>
                </div>

                <button class="ff-audio" type="button">Sound: An</button>

                <div class="ff-bottom-left">
                    <div class="ff-weapon-box">
                        <div class="ff-weapon-topline">
                            <span class="ff-equipped-label">Equipped Weapon</span>
                            <span class="ff-reload-state">READY</span>
                        </div>
                        <div class="ff-weapon-name">OLD SHOTGUN</div>
                        <div class="ff-weapon-slotbar"></div>
                        <div class="ff-reload-track"><div class="ff-reload-fill"></div></div>
                        <div class="ff-weapon-hint">
                            LMB Shoot · R / RMB Reload · 1–4 Switch · Edge of screen pans camera
                        </div>
                    </div>
                    <div class="ff-combo">COMBO ×2</div>
                </div>

                <div class="ff-ammo">
                    <div class="ff-shells"></div>
                    <div>
                        <div class="ff-ammo-label">Magazine / Reserve</div>
                        <div class="ff-ammo-text">5 / ∞</div>
                    </div>
                </div>

                <div class="ff-reload-alert">R · RELOAD</div>
                <div class="ff-message"></div>
                <div class="ff-bonus-label">BONUS SHOT!</div>
            </div>

            <div class="ff-overlay ff-menu">
                <div class="ff-card">
                    <div class="ff-logo"><span>Forest</span> Frenzy</div>

                    <div class="ff-sub">
                        A fast cartoon hunting gallery: hit the required animals before time runs out,
                        build combos, discover hidden targets and unlock bonus weapons.
                    </div>

                    <div class="ff-section">Difficulty</div>

                    <div class="ff-diffs">
                        ${Object.entries(DIFFICULTY).map(([key,d])=>`
                            <button
                                class="ff-diff ${key==='normal'?'selected':''}"
                                type="button"
                                data-diff="${key}"
                            >${d.label}</button>
                        `).join('')}
                    </div>

                    <button class="ff-play" type="button">START HUNT</button>

                    <div class="ff-rules">
                        <div class="ff-rule">
                            <b>Finish the quota</b>
                            Every round asks for specific animals. Complete all counters before the clock reaches zero.
                        </div>
                        <div class="ff-rule">
                            <b>Look for secrets</b>
                            Bells, cans, bottles and strange mushrooms can grant time, points or new weapons.
                        </div>
                        <div class="ff-rule">
                            <b>Bonus shot</b>
                            Finish a round and a short-lived power-up target appears. Shoot it before it vanishes.
                        </div>
                    </div>
                </div>
            </div>

            <div class="ff-overlay ff-end hidden">
                <div class="ff-card">
                    <div class="ff-end-title">HUNT OVER</div>
                    <div class="ff-end-sub">The forest finally gets a break.</div>

                    <div class="ff-end-stats">
                        <div class="ff-end-stat"><span>Score</span><b class="ff-end-score">0</b></div>
                        <div class="ff-end-stat"><span>Rounds</span><b class="ff-end-round">0</b></div>
                        <div class="ff-end-stat"><span>Accuracy</span><b class="ff-end-acc">0%</b></div>
                        <div class="ff-end-stat"><span>Best Combo</span><b class="ff-end-combo">×1</b></div>
                    </div>

                    <button class="ff-play ff-restart" type="button">HUNT AGAIN</button>
                </div>
            </div>
        `;

        container.append(style, root);

        const canvas = root.querySelector('.ff-canvas');
        const ctx = canvas.getContext('2d');

        const timerEl = root.querySelector('.ff-time-num');
        const roundNameEl = root.querySelector('.ff-round-name');
        const quotaPanel = root.querySelector('.ff-quota-panel');
        const scoreEl = root.querySelector('.ff-score-num');

        const weaponNameEl = root.querySelector('.ff-weapon-name');
        const weaponSlotbarEl = root.querySelector('.ff-weapon-slotbar');
        const reloadStateEl = root.querySelector('.ff-reload-state');
        const reloadFillEl = root.querySelector('.ff-reload-fill');
        const reloadAlertEl = root.querySelector('.ff-reload-alert');
        const shellsEl = root.querySelector('.ff-shells');
        const ammoTextEl = root.querySelector('.ff-ammo-text');
        const comboEl = root.querySelector('.ff-combo');

        const messageEl = root.querySelector('.ff-message');
        const bonusLabel = root.querySelector('.ff-bonus-label');
        const audioBtn = root.querySelector('.ff-audio');

        const menu = root.querySelector('.ff-menu');
        const end = root.querySelector('.ff-end');
        const playBtn = root.querySelector('.ff-menu .ff-play');
        const restartBtn = root.querySelector('.ff-restart');
        const diffButtons = [...root.querySelectorAll('.ff-diff')];

        const endScoreEl = root.querySelector('.ff-end-score');
        const endRoundEl = root.querySelector('.ff-end-round');
        const endAccEl = root.querySelector('.ff-end-acc');
        const endComboEl = root.querySelector('.ff-end-combo');

        const rand = (min,max)=>min+Math.random()*(max-min);
        const rint = (min,max)=>Math.floor(rand(min,max+1));
        const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));

        let bestCombo = 1;

        const ensureAudio = () => {
            if(muted) return null;

            try{
                if(!audio){
                    audio = new (window.AudioContext||window.webkitAudioContext)();
                }

                if(audio.state==='suspended'){
                    audio.resume();
                }

                return audio;
            }catch{
                return null;
            }
        };

        const tone = (frequency,duration=.04,volume=.012,type='sine') => {
            if(muted) return;

            const ac=ensureAudio();
            if(!ac) return;

            const osc=ac.createOscillator();
            const gain=ac.createGain();

            osc.type=type;
            osc.frequency.setValueAtTime(frequency,ac.currentTime);

            gain.gain.setValueAtTime(volume,ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+duration);

            osc.connect(gain);
            gain.connect(ac.destination);

            osc.start();
            osc.stop(ac.currentTime+duration);
        };

        const weaponStateDefaults = () => ({
            shotgun: {
                unlocked:true,
                mag:WEAPONS.shotgun.magSize,
                reserve:Infinity
            },
            crossbow: {
                unlocked:false,
                mag:WEAPONS.crossbow.magSize,
                reserve:WEAPONS.crossbow.reserve
            },
            rifle: {
                unlocked:false,
                mag:WEAPONS.rifle.magSize,
                reserve:WEAPONS.rifle.reserve
            },
            dynamite: {
                unlocked:false,
                mag:WEAPONS.dynamite.magSize,
                reserve:WEAPONS.dynamite.reserve
            }
        });

        const createProps = () => [
            {
                id:'bell',
                x:415,
                yRatio:.315,
                type:'bell',
                hits:0,
                done:false
            },
            {
                id:'can',
                x:1030,
                yRatio:.755,
                type:'can',
                hits:0,
                done:false
            },
            {
                id:'mushroom',
                x:1650,
                yRatio:.782,
                type:'mushroom',
                hits:0,
                done:false
            },
            {
                id:'bottle',
                x:2160,
                yRatio:.735,
                type:'bottle',
                hits:0,
                done:false
            }
        ];

        const roundPreset = index => {
            if(index<ROUNDS.length){
                return ROUNDS[index];
            }

            const n=index+1;

            const lateBiomes=[
                {
                    palette:'swamp',
                    area:'Deep Wetlands',
                    pool:['goose','fox','duck','mole','deer']
                },
                {
                    palette:'autumn',
                    area:'Old Redleaf Woods',
                    pool:['pheasant','fox','boar','deer','rabbit']
                },
                {
                    palette:'alpine',
                    area:'High Mountain Pass',
                    pool:['goat','fox','deer','goose','pheasant']
                },
                {
                    palette:'forest',
                    area:'Black Pine Forest',
                    pool:['fox','deer','boar','woodpecker','pheasant']
                }
            ];

            const biome=
                lateBiomes[
                    (index-ROUNDS.length)%
                    lateBiomes.length
                ];

            const qA=
                biome.pool[
                    index%
                    biome.pool.length
                ];

            const qB=
                biome.pool[
                    (index+2)%
                    biome.pool.length
                ];

            const qC=
                biome.pool[
                    (index+4)%
                    biome.pool.length
                ];

            return {
                name:`Expedition ${n}`,
                area:biome.area,
                palette:biome.palette,
                speciesPool:biome.pool,
                sceneWidth:
                    3200+
                    Math.min(
                        750,
                        (index-5)*70
                    ),
                timeMult:
                    1.10+
                    Math.min(
                        .18,
                        (index-5)*.012
                    ),
                spawnMult:
                    Math.max(
                        .72,
                        .84-
                        (index-5)*.01
                    ),
                maxAnimals:
                    Math.min(
                        20,
                        16+
                        Math.floor(
                            (index-5)/2
                        )
                    ),
                quotas:{
                    [qA]:6+Math.floor(index*.45),
                    [qB]:5+Math.floor(index*.38),
                    [qC]:4+Math.floor(index*.32)
                }
            };
        };

        const formatTime = seconds => {
            const total=Math.max(0,Math.ceil(seconds));

            return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;
        };

        const showMessage = (text,time=1.5) => {
            message=text;
            messageTimer=time;
        };

        const worldToScreenX = x => x-cameraX;

        const resetRoundProps = () => {
            for(const p of props){
                if(p.type==='bell'){
                    p.done=false;
                    p.hits=0;
                }
            }
        };

        const setupRound = index => {
            const preset=roundPreset(index);
            const diff=DIFFICULTY[difficultyKey];

            phase='hunt';

            sceneWidth=
                preset.sceneWidth??
                CONFIG.sceneWidth;

            cameraX=
                clamp(
                    cameraX,
                    0,
                    Math.max(
                        0,
                        sceneWidth-width
                    )
                );

            cameraTargetX=cameraX;

            quota={...preset.quotas};
            quotaDone={};

            for(const key of Object.keys(quota)){
                quotaDone[key]=0;
            }

            roundTime=
                CONFIG.baseRoundTime*
                diff.timeMult*
                (preset.timeMult??1)+
                carryTime;

            carryTime=0;

            animals=[];
            spawnTimer=.35;
            combo=0;
            comboTimer=0;

            resetRoundProps();

            if(index===1&&!weaponStates.crossbow.unlocked){
                unlockWeapon('crossbow','Crossbow unlocked for Round 2!');
            }

            if(index===2&&!weaponStates.rifle.unlocked){
                unlockWeapon('rifle','Hunter Rifle unlocked!');
            }

            bestRound=Math.max(bestRound,index+1);

            showMessage(
                `Round ${index+1} · ${preset.area??'Forest'} · ${preset.name}`,
                2.1
            );
            updateHud();
        };

        const unlockWeapon = (id,text) => {
            const state=weaponStates[id];

            if(!state||state.unlocked){
                return;
            }

            state.unlocked=true;
            weaponId=id;

            showMessage(text,2.0);
            tone(760,.05,.015,'triangle');

            if(id==='dynamite'){
                state.reserve=Math.max(state.reserve,3);
            }
        };

        const chooseNeededSpecies = () => {
            const needed=[];

            for(const [type,amount] of Object.entries(quota)){
                const done=quotaDone[type]??0;
                const remaining=Math.max(0,amount-done);

                for(let i=0;i<remaining;i++){
                    needed.push(type);
                }
            }

            if(
                needed.length&&
                Math.random()<.72
            ){
                return needed[rint(0,needed.length-1)];
            }

            const preset=
                roundPreset(roundIndex);

            const pool=
                preset.speciesPool??
                Object.keys(SPECIES);

            return pool[rint(0,pool.length-1)];
        };

        const createAnimal = type => {
            const def=SPECIES[type];
            const dir=Math.random()<.5?1:-1;
            const scale=rand(def.layer[0],def.layer[1]);

            const startX=
                dir>0
                    ?cameraX-rand(90,330)
                    :cameraX+width+rand(90,330);

            const yRatio=
                rand(def.band[0],def.band[1]);

            const baseSpeed=
                rand(def.speed[0],def.speed[1])*
                DIFFICULTY[difficultyKey].speedMult;

            const isStatic=
                type==='mole'||
                type==='woodpecker';

            let x=startX;

            if(isStatic){
                x=clamp(
                    cameraX+
                    rand(width*.08,width*.92),
                    120,
                    sceneWidth-120
                );
            }

            return {
                id:nextAnimalId++,
                type,
                x,
                yRatio,
                dir,
                speed:baseSpeed,
                scale,
                phase:rand(0,Math.PI*2),
                life:
                    type==='mole'
                        ?rand(2.1,3.6)
                        :type==='woodpecker'
                            ?rand(3.0,4.8)
                            :rand(9,16),
                age:0,
                dead:false,
                deathT:0,
                scored:false,
                screen:null
            };
        };

        const spawnAnimal = () => {
            const preset=
                roundPreset(roundIndex);

            const maxAnimals=
                preset.maxAnimals??
                CONFIG.maxAnimals;

            if(
                animals.filter(a=>!a.dead).length>=
                maxAnimals
            ){
                return;
            }

            const type=chooseNeededSpecies();

            animals.push(createAnimal(type));
        };

        const quotaComplete = () =>
            Object.entries(quota).every(
                ([type,amount])=>
                    (quotaDone[type]??0)>=amount
            );

        const updateCamera = delta => {
            if(!mouse.inside||phase==='menu'||phase==='over'){
                return;
            }

            const left=width*CONFIG.panEdge;
            const right=width*(1-CONFIG.panEdge);

            let pan=0;

            if(mouse.x<left){
                pan=-
                    (
                        1-
                        mouse.x/left
                    );
            }else if(mouse.x>right){
                pan=
                    (
                        mouse.x-right
                    )/
                    (
                        width-right
                    );
            }

            cameraTargetX=
                clamp(
                    cameraTargetX+
                    pan*
                    CONFIG.panSpeed*
                    delta,
                    0,
                    Math.max(
                        0,
                        sceneWidth-width
                    )
                );

            cameraX +=
                (
                    cameraTargetX-cameraX
                )*
                Math.min(
                    1,
                    delta*8
                );
        };

        const updateAnimals = delta => {
            for(let i=animals.length-1;i>=0;i--){
                const a=animals[i];

                a.age+=delta;
                a.phase+=delta*5.4;

                if(a.dead){
                    a.deathT+=delta;

                    if(a.deathT>.62){
                        animals.splice(i,1);
                    }

                    continue;
                }

                a.life-=delta;

                if(
                    a.type!=='mole'&&
                    a.type!=='woodpecker'
                ){
                    a.x+=
                        a.dir*
                        a.speed*
                        delta;
                }

                if(
                    a.life<=0||
                    a.x<-450||
                    a.x>sceneWidth+450
                ){
                    animals.splice(i,1);
                }
            }
        };

        const getAnimalPose = a => {
            const x=worldToScreenX(a.x);
            const s=
                a.scale*
                clamp(
                    height/700,
                    .70,
                    1.26
                );

            let y=a.yRatio*height;

            if(a.type==='rabbit'){
                y-=
                    Math.abs(
                        Math.sin(
                            a.phase*
                            .72
                        )
                    )*
                    26*
                    s;
            }

            if(
                a.type==='duck'||
                a.type==='goose'||
                a.type==='pheasant'
            ){
                y+=
                    Math.sin(
                        a.phase*.62
                    )*
                    (
                        a.type==='pheasant'
                            ?10
                            :13
                    )*
                    s;
            }

            if(a.type==='mole'){
                const inT=
                    clamp(a.age/.35,0,1);

                const outT=
                    clamp(a.life/.45,0,1);

                y+=
                    (
                        1-
                        Math.min(
                            inT,
                            outT
                        )
                    )*
                    30*
                    s;
            }

            if(a.type==='woodpecker'){
                y+=
                    Math.sin(
                        a.phase*.8
                    )*
                    5*
                    s;
            }

            return {x,y,s};
        };

        const animalHitTest = (a,x,y,extra=0) => {
            if(a.dead) return false;

            const pose=getAnimalPose(a);
            const radius=
                (
                    SPECIES[a.type].hitRadius+
                    extra
                )*
                pose.s;

            const dx=x-pose.x;
            const dy=y-pose.y;

            return dx*dx+dy*dy<=radius*radius;
        };

        const propPose = p => ({
            x:worldToScreenX(p.x),
            y:p.yRatio*height
        });

        const propHitTest = (p,x,y,extra=0) => {
            if(p.done) return false;

            const pose=propPose(p);

            let radius=20;

            if(p.type==='bell') radius=24;
            if(p.type==='can') radius=18;
            if(p.type==='mushroom') radius=23;
            if(p.type==='bottle') radius=18;

            return Math.hypot(x-pose.x,y-pose.y)<=radius+extra;
        };

        const addParticles = (x,y,color,count=8) => {
            for(let i=0;i<count;i++){
                const life=rand(.25,.55);

                particles.push({
                    x,
                    y,
                    vx:rand(-75,75),
                    vy:rand(-100,20),
                    life,
                    maxLife:life,
                    color,
                    size:rand(2,5)
                });
            }
        };

        const addFloating = (x,y,text,color='#fff5b3') => {
            floatingText.push({
                x,y,
                text,
                life:1.0,
                maxLife:1.0,
                color
            });
        };

        const updateFx = delta => {
            for(let i=particles.length-1;i>=0;i--){
                const p=particles[i];

                p.life-=delta;
                p.x+=p.vx*delta;
                p.y+=p.vy*delta;
                p.vy+=120*delta;

                if(p.life<=0){
                    particles.splice(i,1);
                }
            }

            for(let i=floatingText.length-1;i>=0;i--){
                const f=floatingText[i];

                f.life-=delta;
                f.y-=25*delta;

                if(f.life<=0){
                    floatingText.splice(i,1);
                }
            }

            shake*=Math.pow(.035,delta);
            muzzleFlash=Math.max(0,muzzleFlash-delta);

            if(messageTimer>0){
                messageTimer-=delta;
            }

            if(comboTimer>0){
                comboTimer-=delta;

                if(comboTimer<=0){
                    combo=0;
                }
            }
        };

        const killAnimal = (a,weapon,explosive=false) => {
            if(a.dead) return 0;

            a.dead=true;
            a.deathT=0;

            hits++;

            const needed=
                Object.prototype.hasOwnProperty.call(
                    quota,
                    a.type
                );

            if(needed){
                quotaDone[a.type]=
                    (quotaDone[a.type]??0)+1;
            }

            combo=
                comboTimer>0
                    ?Math.min(
                        CONFIG.comboMax,
                        combo+1
                    )
                    :1;

            comboTimer=CONFIG.comboWindow;
            bestCombo=Math.max(bestCombo,combo);

            const distanceBonus=
                clamp(
                    1+
                    (
                        1-
                        a.scale
                    )*
                    .65,
                    .92,
                    1.45
                );

            const comboMult=
                1+
                Math.max(
                    0,
                    combo-1
                )*
                .16;

            const points=
                Math.round(
                    SPECIES[a.type].points*
                    weapon.scoreMult*
                    distanceBonus*
                    comboMult
                );

            score+=points;

            const pose=getAnimalPose(a);

            addParticles(
                pose.x,
                pose.y,
                '#f5dda2',
                explosive?13:7
            );

            addFloating(
                pose.x,
                pose.y-18,
                `+${points}`,
                combo>=3
                    ?'#ffdf55'
                    :'#fff1b1'
            );

            tone(
                450+
                combo*45,
                .035,
                .008,
                'sine'
            );

            if(quotaComplete()&&phase==='hunt'){
                startBonusPhase();
            }

            return points;
        };

        const hitProp = (p,weapon) => {
            const pose=propPose(p);

            p.hits++;

            if(p.type==='bell'){
                p.done=true;
                roundTime+=7;
                score+=120;

                addFloating(
                    pose.x,
                    pose.y-25,
                    '+7 SEC',
                    '#f4d358'
                );

                showMessage('Church bell! +7 seconds',1.4);

                tone(560,.12,.012,'sine');
                setTimeout(()=>{
                    if(!destroyed) tone(720,.13,.009,'sine');
                },90);

                return true;
            }

            if(p.type==='can'){
                score+=35;

                p.x+=rand(-38,42);
                p.yRatio-=rand(.015,.030);

                addFloating(
                    pose.x,
                    pose.y,
                    `CAN ${p.hits}/3`,
                    '#e7e1cf'
                );

                tone(800,.025,.005,'square');

                if(p.hits>=3){
                    p.done=true;
                    score+=260;

                    unlockWeapon(
                        'crossbow',
                        'Secret found: Crossbow unlocked!'
                    );

                    addParticles(
                        pose.x,
                        pose.y,
                        '#dbd9ce',
                        15
                    );
                }

                return true;
            }

            if(p.type==='mushroom'){
                p.done=true;

                unlockWeapon(
                    'dynamite',
                    'Explosive mushroom! Dynamite unlocked!'
                );

                const blast=185;

                for(const a of animals){
                    if(a.dead) continue;

                    const ap=getAnimalPose(a);

                    if(
                        Math.hypot(
                            ap.x-pose.x,
                            ap.y-pose.y
                        )<
                        blast
                    ){
                        killAnimal(
                            a,
                            {
                                scoreMult:.62
                            },
                            true
                        );
                    }
                }

                score+=180;

                addParticles(
                    pose.x,
                    pose.y,
                    '#e26e35',
                    26
                );

                shake=12;

                tone(90,.12,.018,'sawtooth');

                return true;
            }

            if(p.type==='bottle'){
                p.done=true;
                score+=300;

                addFloating(
                    pose.x,
                    pose.y,
                    '+300 SECRET',
                    '#8be6dd'
                );

                addParticles(
                    pose.x,
                    pose.y,
                    '#80d9cd',
                    16
                );

                tone(930,.035,.008,'sine');

                return true;
            }

            return false;
        };

        const useDynamite = weapon => {
            const blast=weapon.aimRadius;
            let killsNow=0;

            for(const a of animals){
                if(a.dead) continue;

                const pose=getAnimalPose(a);

                if(
                    Math.hypot(
                        pose.x-mouse.x,
                        pose.y-mouse.y
                    )<=
                    blast
                ){
                    killAnimal(a,weapon,true);
                    killsNow++;
                }
            }

            for(const p of props){
                if(
                    propHitTest(
                        p,
                        mouse.x,
                        mouse.y,
                        blast*.30
                    )
                ){
                    hitProp(p,weapon);
                }
            }

            addParticles(
                mouse.x,
                mouse.y,
                '#f18d44',
                32
            );

            addFloating(
                mouse.x,
                mouse.y-35,
                killsNow
                    ?`${killsNow} HIT!`
                    :'BOOM!',
                '#ffcf6b'
            );

            shake=18;

            tone(82,.15,.022,'sawtooth');
        };

        const fire = () => {
            if(
                !running||
                (
                    phase!=='hunt'&&
                    phase!=='bonus'
                )||
                triggerCooldown>0||
                reloading
            ){
                return;
            }

            ensureAudio();

            const state=weaponStates[weaponId];
            const weapon=WEAPONS[weaponId];

            if(!state.unlocked){
                return;
            }

            if(state.mag<=0){
                beginReload();
                return;
            }

            state.mag--;
            shots++;

            triggerCooldown=weapon.fireDelay;
            muzzleFlash=.08;

            if(weaponId==='shotgun'){
                shake=7;

                tone(
                    115,
                    .075,
                    .020,
                    'square'
                );
            }else if(weaponId==='rifle'){
                shake=4;

                tone(
                    165,
                    .045,
                    .014,
                    'square'
                );
            }else if(weaponId==='crossbow'){
                shake=2;

                tone(
                    260,
                    .045,
                    .009,
                    'triangle'
                );
            }else{
                useDynamite(weapon);
            }

            if(phase==='bonus'){
                if(
                    bonusTarget&&
                    Math.hypot(
                        mouse.x-bonusTarget.x,
                        mouse.y-bonusTarget.y
                    )<
                    45+weapon.aimRadius*.25
                ){
                    collectBonus();
                }

                maybeAutoReload();
                updateHud();
                return;
            }

            if(weapon.explosive){
                maybeAutoReload();
                updateHud();
                return;
            }

            let propHit=false;

            for(const p of props){
                if(
                    propHitTest(
                        p,
                        mouse.x,
                        mouse.y,
                        weapon.aimRadius*.22
                    )
                ){
                    propHit=
                        hitProp(
                            p,
                            weapon
                        );

                    if(propHit) break;
                }
            }

            if(!propHit){
                const targets=animals
                    .filter(
                        a=>
                            !a.dead&&
                            animalHitTest(
                                a,
                                mouse.x,
                                mouse.y,
                                weapon.aimRadius
                            )
                    )
                    .sort(
                        (a,b)=>
                            b.scale-
                            a.scale
                    );

                if(targets.length){
                    killAnimal(
                        targets[0],
                        weapon
                    );
                }else{
                    combo=0;
                    comboTimer=0;

                    addFloating(
                        mouse.x,
                        mouse.y-12,
                        'MISS',
                        '#d6cab4'
                    );
                }
            }

            maybeAutoReload();
            updateHud();
        };

        const maybeAutoReload = () => {
            const state=weaponStates[weaponId];
            const weapon=WEAPONS[weaponId];

            if(
                state.mag<=0&&
                weapon.autoReload
            ){
                beginReload();
            }
        };

        const beginReload = () => {
            if(
                reloading||
                phase==='menu'||
                phase==='over'
            ){
                return;
            }

            const state=weaponStates[weaponId];
            const weapon=WEAPONS[weaponId];

            if(!state||!state.unlocked){
                return;
            }

            if(state.mag>=weapon.magSize){
                return;
            }

            if(
                Number.isFinite(state.reserve)&&
                state.reserve<=0
            ){
                showMessage('No ammo!',.8);
                tone(120,.03,.005,'square');
                return;
            }

            reloading=true;
            reloadTimer=weapon.reload;

            tone(310,.03,.005,'square');
            updateHud();
        };

        const finishReload = () => {
            const state=weaponStates[weaponId];
            const weapon=WEAPONS[weaponId];

            if(!state||!weapon){
                reloading=false;
                return;
            }

            const needed=
                weapon.magSize-
                state.mag;

            if(Number.isFinite(state.reserve)){
                const take=
                    Math.min(
                        needed,
                        state.reserve
                    );

                state.mag+=take;
                state.reserve-=take;
            }else{
                state.mag=weapon.magSize;
            }

            reloading=false;

            tone(420,.025,.004,'square');
            updateHud();
        };

        const switchWeapon = id => {
            if(
                !weaponStates[id]?.unlocked
            ){
                return;
            }

            weaponId=id;
            reloading=false;
            reloadTimer=0;

            showMessage(
                `Equipped: ${WEAPONS[id].name}`,
                .85
            );

            tone(350,.025,.004,'triangle');

            updateHud();
        };

        const startBonusPhase = () => {
            phase='bonus';
            bonusTimer=CONFIG.bonusPhaseTime;

            const options=['clock','score','ammo'];
            const type=
                options[
                    rint(
                        0,
                        options.length-1
                    )
                ];

            bonusTarget={
                type,
                x:width*.50,
                y:height*.38,
                vx:rand(-70,70),
                vy:rand(-25,25),
                phase:0
            };

            showMessage('Quota complete!',1.2);
            tone(720,.055,.012,'triangle');
            setTimeout(()=>{
                if(!destroyed) tone(900,.06,.010,'triangle');
            },90);

            updateHud();
        };

        const collectBonus = () => {
            if(!bonusTarget) return;

            const type=bonusTarget.type;

            if(type==='clock'){
                carryTime+=12;
                addFloating(
                    bonusTarget.x,
                    bonusTarget.y,
                    '+12 SEC NEXT ROUND',
                    '#ffe65f'
                );
            }else if(type==='score'){
                score+=650;
                addFloating(
                    bonusTarget.x,
                    bonusTarget.y,
                    '+650',
                    '#ffe65f'
                );
            }else{
                weaponStates.dynamite.reserve+=2;

                if(!weaponStates.dynamite.unlocked){
                    unlockWeapon(
                        'dynamite',
                        'Dynamite unlocked!'
                    );
                }

                addFloating(
                    bonusTarget.x,
                    bonusTarget.y,
                    '+2 DYNAMITE',
                    '#ff9a58'
                );
            }

            bonusTarget=null;
            bonusTimer=Math.min(bonusTimer,.85);

            tone(980,.06,.010,'sine');
            updateHud();
        };

        const updateBonus = delta => {
            if(phase!=='bonus'){
                return;
            }

            bonusTimer-=delta;

            if(bonusTarget){
                bonusTarget.phase+=delta*5;

                bonusTarget.x+=
                    bonusTarget.vx*
                    delta;

                bonusTarget.y+=
                    bonusTarget.vy*
                    delta;

                if(
                    bonusTarget.x<width*.34||
                    bonusTarget.x>width*.66
                ){
                    bonusTarget.vx*=-1;
                }

                if(
                    bonusTarget.y<height*.30||
                    bonusTarget.y>height*.48
                ){
                    bonusTarget.vy*=-1;
                }
            }

            if(bonusTimer<=0){
                roundIndex++;
                setupRound(roundIndex);
            }
        };

        const updateRound = delta => {
            if(phase!=='hunt'){
                return;
            }

            roundTime-=delta;

            const diff=DIFFICULTY[difficultyKey];

            spawnTimer-=delta;

            if(spawnTimer<=0){
                spawnAnimal();

                const intensity=
                    clamp(
                        roundIndex*.035,
                        0,
                        .24
                    );

                const preset=
                    roundPreset(roundIndex);

                spawnTimer=
                    Math.max(
                        CONFIG.spawnMin,
                        (
                            CONFIG.spawnBase-
                            intensity
                        )*
                        diff.spawnMult*
                        (preset.spawnMult??1)*
                        rand(.72,1.25)
                    );
            }

            if(roundTime<=0){
                finishGame(false);
            }
        };

        const finishGame = success => {
            if(gameOver) return;

            gameOver=true;
            running=false;
            phase='over';

            services?.highscores?.saveHighscore?.(
                CONFIG.highscoreId,
                score
            );

            endScoreEl.textContent=
                score.toLocaleString('de-DE');

            endRoundEl.textContent=
                String(bestRound);

            endAccEl.textContent=
                `${shots?Math.round(hits/shots*100):0}%`;

            endComboEl.textContent=
                `×${bestCombo}`;

            end.querySelector('.ff-end-sub').textContent=
                success
                    ?'You cleared every planned round.'
                    :'Time ran out before the quota was complete.';

            end.classList.remove('hidden');

            tone(145,.12,.012,'sine');
        };

        const resetGame = () => {
            roundIndex=0;
            score=0;
            bestRound=0;
            hits=0;
            shots=0;
            bestCombo=1;

            carryTime=0;
            combo=0;
            comboTimer=0;

            cameraX=0;
            cameraTargetX=0;
            sceneWidth=CONFIG.sceneWidth;

            animals=[];
            particles=[];
            floatingText=[];

            props=createProps();

            weaponStates=weaponStateDefaults();
            weaponId='shotgun';

            triggerCooldown=0;
            reloading=false;
            reloadTimer=0;

            message='';
            messageTimer=0;

            bonusTarget=null;

            gameOver=false;
            running=true;

            setupRound(0);
        };

        const startGame = () => {
            ensureAudio();

            menu.classList.add('hidden');
            end.classList.add('hidden');

            resetGame();
        };

        const update = delta => {
            if(!running) return;

            triggerCooldown=
                Math.max(
                    0,
                    triggerCooldown-delta
                );

            if(reloading){
                reloadTimer-=delta;

                if(reloadTimer<=0){
                    finishReload();
                }
            }

            updateCamera(delta);
            updateAnimals(delta);
            updateFx(delta);
            updateRound(delta);
            updateBonus(delta);
            updateHud();
        };

        const drawBackground = () => {
            const preset=roundPreset(roundIndex);
            const palette=preset.palette;

            const biome={
                meadow:{
                    skyTop:'#8fc9df',
                    skyBottom:'#d7e6b4',
                    far:'#779b79',
                    forest:'#347349',
                    ground:'#62a94f',
                    foreground:'#397d3e',
                    path:'#9d7b50'
                },
                forest:{
                    skyTop:'#83b8d5',
                    skyBottom:'#c8dcb0',
                    far:'#537a62',
                    forest:'#285f3a',
                    ground:'#4e8a45',
                    foreground:'#2e6838',
                    path:'#856a4a'
                },
                golden:{
                    skyTop:'#87b8d4',
                    skyBottom:'#eac87f',
                    far:'#8b8b60',
                    forest:'#5f7741',
                    ground:'#87a94f',
                    foreground:'#608c3b',
                    path:'#a97d49'
                },
                swamp:{
                    skyTop:'#789fa6',
                    skyBottom:'#c5c39a',
                    far:'#617866',
                    forest:'#3e644b',
                    ground:'#557b4e',
                    foreground:'#355f42',
                    path:'#637e7e'
                },
                autumn:{
                    skyTop:'#8eb7cd',
                    skyBottom:'#efbd7a',
                    far:'#987763',
                    forest:'#8f623f',
                    ground:'#9b8247',
                    foreground:'#755a34',
                    path:'#a8794b'
                },
                alpine:{
                    skyTop:'#87b8dc',
                    skyBottom:'#e6eef0',
                    far:'#8197a5',
                    forest:'#385d55',
                    ground:'#d7e4df',
                    foreground:'#b8d0c8',
                    path:'#aebfc0'
                }
            }[palette]??{
                skyTop:'#8fc9df',
                skyBottom:'#d7e6b4',
                far:'#779b79',
                forest:'#347349',
                ground:'#62a94f',
                foreground:'#397d3e',
                path:'#9d7b50'
            };

            const sky=
                ctx.createLinearGradient(
                    0,
                    0,
                    0,
                    height*.57
                );

            sky.addColorStop(0,biome.skyTop);
            sky.addColorStop(1,biome.skyBottom);

            ctx.fillStyle=sky;
            ctx.fillRect(0,0,width,height);

            const farOffset=
                cameraX*
                .12;

            // Mountains / distant ridges.
            ctx.fillStyle=biome.far;

            ctx.beginPath();
            ctx.moveTo(-220,height*.49);

            for(let x=-220;x<width+340;x+=170){
                const wx=
                    x+
                    farOffset%
                    170;

                let ridge=
                    height*
                    (
                        .34+
                        Math.sin(
                            (x+farOffset)*
                            .008
                        )*
                        .036
                    );

                if(palette==='alpine'){
                    ridge-=
                        Math.abs(
                            Math.sin(
                                (x+farOffset)*
                                .012
                            )
                        )*
                        height*.10;
                }

                ctx.lineTo(wx,ridge);
            }

            ctx.lineTo(width+340,height*.58);
            ctx.lineTo(-220,height*.58);
            ctx.closePath();
            ctx.fill();

            if(palette==='alpine'){
                ctx.fillStyle='rgba(245,250,250,.78)';

                ctx.beginPath();
                ctx.moveTo(-200,height*.43);

                for(let x=-200;x<width+300;x+=180){
                    const wx=
                        x+
                        (cameraX*.10)%180;

                    ctx.lineTo(
                        wx,
                        height*
                        (
                            .31+
                            Math.sin(
                                (x+cameraX*.1)*
                                .009
                            )*
                            .025
                        )
                    );
                }

                ctx.lineTo(width+300,height*.47);
                ctx.closePath();
                ctx.fill();
            }

            // Distant forest line.
            for(let i=-2;i<25;i++){
                const wx=
                    i*150-
                    (cameraX*.32)%150;

                const h=
                    height*
                    (
                        .14+
                        (
                            i%3
                        )*
                        .015
                    );

                drawPine(
                    wx,
                    height*.55,
                    h,
                    biome.forest,
                    .70
                );
            }

            ctx.fillStyle=biome.ground;
            ctx.fillRect(0,height*.52,width,height*.48);

            if(palette==='swamp'){
                // Broad water channel instead of a dry track.
                ctx.fillStyle=biome.path;

                ctx.beginPath();
                ctx.moveTo(0,height*.61);
                ctx.bezierCurveTo(
                    width*.28,
                    height*.56,
                    width*.66,
                    height*.70,
                    width,
                    height*.60
                );
                ctx.lineTo(width,height*.76);
                ctx.bezierCurveTo(
                    width*.68,
                    height*.82,
                    width*.27,
                    height*.67,
                    0,
                    height*.77
                );
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle='rgba(219,236,217,.23)';
                ctx.lineWidth=2;

                for(let y=height*.64;y<height*.76;y+=18){
                    ctx.beginPath();
                    ctx.moveTo(0,y);
                    ctx.lineTo(width,y+Math.sin(y*.03)*5);
                    ctx.stroke();
                }

                // Lily pads.
                for(let i=0;i<8;i++){
                    const x=
                        (
                            i*220-
                            cameraX*.55
                        )%
                        (width+240);

                    const xx=x<0?x+width+240:x;

                    ctx.fillStyle='#467747';
                    ctx.beginPath();
                    ctx.ellipse(
                        xx,
                        height*(.67+(i%3)*.022),
                        22,
                        8,
                        -.12,
                        0,
                        Math.PI*2
                    );
                    ctx.fill();
                }
            }else{
                ctx.fillStyle=biome.path;

                ctx.beginPath();
                ctx.moveTo(0,height*.63);
                ctx.bezierCurveTo(
                    width*.30,
                    height*.59,
                    width*.70,
                    height*.68,
                    width,
                    height*.61
                );
                ctx.lineTo(width,height*.72);
                ctx.bezierCurveTo(
                    width*.72,
                    height*.77,
                    width*.28,
                    height*.69,
                    0,
                    height*.75
                );
                ctx.closePath();
                ctx.fill();
            }

            drawScenery();

            ctx.fillStyle=biome.foreground;
            ctx.fillRect(0,height*.82,width,height*.18);

            drawForegroundPlants();

            if(palette==='swamp'){
                // Subtle mist.
                const mist=
                    ctx.createLinearGradient(
                        0,
                        height*.35,
                        0,
                        height*.78
                    );

                mist.addColorStop(0,'rgba(220,230,213,0)');
                mist.addColorStop(.55,'rgba(220,230,213,.08)');
                mist.addColorStop(1,'rgba(220,230,213,0)');

                ctx.fillStyle=mist;
                ctx.fillRect(0,height*.30,width,height*.55);
            }

            if(palette==='alpine'){
                // Small world-independent snowfall for atmosphere.
                ctx.fillStyle='rgba(255,255,255,.72)';

                for(let i=0;i<42;i++){
                    const x=
                        (
                            i*79+
                            matchlessHash(i,roundIndex)*11
                        )%
                        width;

                    const y=
                        (
                            i*137+
                            (performance.now()*.018)*
                            (1+i%3)
                        )%
                        (height*.82);

                    ctx.beginPath();
                    ctx.arc(
                        x,
                        y,
                        1+(i%3)*.55,
                        0,
                        Math.PI*2
                    );
                    ctx.fill();
                }
            }
        };

        const matchlessHash = (a,b) =>
            Math.abs(
                Math.sin(
                    a*12.9898+
                    b*78.233
                )*
                43758.5453
            )%
            1;

        const drawPine = (x,baseY,h,color,alpha=1) => {
            ctx.save();
            ctx.globalAlpha=alpha;

            ctx.fillStyle='#5b442e';
            ctx.fillRect(
                x-4,
                baseY-h*.25,
                8,
                h*.25
            );

            ctx.fillStyle=color;

            for(let i=0;i<3;i++){
                const yy=
                    baseY-
                    h*.25-
                    i*h*.22;

                const w=
                    h*
                    (
                        .20-
                        i*.025
                    );

                ctx.beginPath();
                ctx.moveTo(x,yy-h*.34);
                ctx.lineTo(x-w,yy+h*.06);
                ctx.lineTo(x+w,yy+h*.06);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        };

        const drawTree = (worldX,baseY,scale=1) => {
            const x=worldToScreenX(worldX);

            if(
                x<-160||
                x>width+160
            ){
                return;
            }

            const s=
                scale*
                clamp(
                    height/700,
                    .72,
                    1.25
                );

            ctx.fillStyle='#6f4b30';

            ctx.beginPath();
            ctx.moveTo(x-23*s,baseY);
            ctx.bezierCurveTo(
                x-10*s,
                baseY-100*s,
                x-20*s,
                baseY-160*s,
                x-8*s,
                baseY-238*s
            );

            ctx.lineTo(
                x+23*s,
                baseY-238*s
            );

            ctx.bezierCurveTo(
                x+13*s,
                baseY-150*s,
                x+34*s,
                baseY-90*s,
                x+31*s,
                baseY
            );

            ctx.closePath();
            ctx.fill();

            const palette=
                roundPreset(roundIndex).palette;

            const greens=
                palette==='autumn'
                    ?['#b4552c','#d17732','#d6a13b']
                    :palette==='alpine'
                        ?['#28574a','#35695a','#467b67']
                        :palette==='swamp'
                            ?['#315e3e','#3d7045','#4b7d4e']
                            :['#2f7f3c','#3b9144','#4b9f49'];

            for(let i=0;i<10;i++){
                const a=i/10*Math.PI*2;
                const cx=
                    x+
                    Math.cos(a)*
                    62*s;

                const cy=
                    baseY-
                    245*s+
                    Math.sin(a)*
                    38*s;

                ctx.fillStyle=
                    greens[i%greens.length];

                ctx.beginPath();
                ctx.arc(
                    cx,
                    cy,
                    48*s,
                    0,
                    Math.PI*2
                );
                ctx.fill();
            }
        };

        const drawScenery = () => {
            drawTree(
                220,
                height*.80,
                1.08
            );

            drawTree(
                760,
                height*.72,
                .86
            );

            drawTree(
                1470,
                height*.75,
                .92
            );

            drawTree(
                2350,
                height*.80,
                1.12
            );

            drawCabin(
                1130,
                height*.62
            );

            drawLog(
                1850,
                height*.72
            );

            // Rock.
            const rockX=
                worldToScreenX(2020);

            if(
                rockX>-120&&
                rockX<width+120
            ){
                ctx.fillStyle='#77766c';

                ctx.beginPath();
                ctx.moveTo(
                    rockX-55,
                    height*.73
                );

                ctx.lineTo(
                    rockX-28,
                    height*.66
                );

                ctx.lineTo(
                    rockX+30,
                    height*.65
                );

                ctx.lineTo(
                    rockX+67,
                    height*.73
                );

                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle='#5c5c56';
                ctx.lineWidth=3;
                ctx.stroke();
            }

            for(const p of props){
                drawProp(p);
            }
        };

        const drawCabin = (worldX,baseY) => {
            const x=worldToScreenX(worldX);

            if(
                x<-220||
                x>width+220
            ){
                return;
            }

            const s=
                clamp(
                    height/700,
                    .72,
                    1.2
                );

            ctx.fillStyle='#6b4329';

            ctx.fillRect(
                x-105*s,
                baseY-105*s,
                210*s,
                105*s
            );

            ctx.strokeStyle='#402b20';
            ctx.lineWidth=3;

            for(let yy=0;yy<5;yy++){
                ctx.strokeRect(
                    x-105*s,
                    baseY-
                    105*s+
                    yy*21*s,
                    210*s,
                    21*s
                );
            }

            ctx.fillStyle='#4c3424';

            ctx.beginPath();
            ctx.moveTo(x-130*s,baseY-105*s);
            ctx.lineTo(x,baseY-175*s);
            ctx.lineTo(x+130*s,baseY-105*s);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle='#2e261f';

            ctx.fillRect(
                x-25*s,
                baseY-70*s,
                50*s,
                70*s
            );

            ctx.fillStyle='#9bc5d0';

            ctx.fillRect(
                x+50*s,
                baseY-78*s,
                35*s,
                28*s
            );
        };

        const drawLog = (worldX,baseY) => {
            const x=worldToScreenX(worldX);

            if(
                x<-160||
                x>width+160
            ){
                return;
            }

            ctx.save();
            ctx.translate(x,baseY);
            ctx.rotate(-.12);

            ctx.fillStyle='#705038';
            ctx.fillRect(-85,-17,170,34);

            ctx.fillStyle='#9a7048';
            ctx.beginPath();
            ctx.arc(85,0,17,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#62442f';

            for(let i=-60;i<60;i+=28){
                ctx.fillRect(i,-17,5,34);
            }

            ctx.restore();
        };

        const drawForegroundPlants = () => {
            const palette=
                roundPreset(roundIndex).palette;

            if(palette==='swamp'){
                ctx.strokeStyle='#315d3c';
                ctx.lineWidth=4;

                for(let x=-10;x<width+25;x+=28){
                    const h=
                        30+
                        (
                            (
                                x+
                                Math.floor(cameraX)
                            )%
                            42
                        );

                    ctx.beginPath();
                    ctx.moveTo(x,height);
                    ctx.lineTo(x+4,height-h);
                    ctx.stroke();

                    ctx.fillStyle='#67502d';
                    ctx.fillRect(
                        x+1,
                        height-h-7,
                        6,
                        13
                    );
                }

                return;
            }

            if(palette==='alpine'){
                ctx.strokeStyle='#638879';
                ctx.lineWidth=2;

                for(let x=0;x<width;x+=34){
                    const h=8+(x%17);

                    ctx.beginPath();
                    ctx.moveTo(x,height);
                    ctx.lineTo(x+2,height-h);
                    ctx.stroke();
                }

                ctx.fillStyle='rgba(255,255,255,.58)';

                for(let x=-30;x<width+40;x+=95){
                    ctx.beginPath();
                    ctx.ellipse(
                        x,
                        height-14-(x%3)*6,
                        32,
                        9,
                        0,
                        0,
                        Math.PI*2
                    );
                    ctx.fill();
                }

                return;
            }

            ctx.strokeStyle=
                palette==='autumn'
                    ?'#6d5a32'
                    :'#2d6c37';

            ctx.lineWidth=3;

            for(let x=-10;x<width+20;x+=22){
                const h=
                    15+
                    (
                        (
                            x+
                            Math.floor(cameraX)
                        )%
                        31
                    );

                ctx.beginPath();
                ctx.moveTo(x,height);
                ctx.quadraticCurveTo(
                    x+6,
                    height-h*.55,
                    x+2,
                    height-h
                );
                ctx.stroke();
            }

            const flowerColors=
                palette==='autumn'
                    ?['#d45c31','#e39b38','#b9432f']
                    :['#e44f48','#f1cf4e','#f2f0d7'];

            for(let i=0;i<12;i++){
                const x=
                    (
                        i*167-
                        cameraX*.72
                    )%
                    (
                        width+180
                    );

                const xx=
                    x<0
                        ?x+width+180
                        :x;

                ctx.fillStyle=
                    flowerColors[
                        i%
                        flowerColors.length
                    ];

                ctx.beginPath();
                ctx.arc(
                    xx,
                    height-
                    45-
                    (i%3)*12,
                    5,
                    0,
                    Math.PI*2
                );
                ctx.fill();
            }
        };

        const drawAnimal = a => {
            const p=getAnimalPose(a);

            if(
                p.x<-100||
                p.x>width+100
            ){
                a.screen=null;
                return;
            }

            a.screen=p;

            ctx.save();

            ctx.translate(
                p.x,
                p.y+
                (
                    a.dead
                        ?a.deathT*
                        90
                        :0
                )
            );

            ctx.scale(
                a.dir*
                p.s,
                p.s
            );

            if(a.dead){
                ctx.rotate(
                    a.dir*
                    a.deathT*
                    2.2
                );

                ctx.globalAlpha=
                    1-
                    a.deathT/
                    .65;
            }

            if(a.type==='duck'){
                drawDuck();
            }else if(a.type==='rabbit'){
                drawRabbit(a.phase);
            }else if(a.type==='boar'){
                drawBoar(a.phase);
            }else if(a.type==='deer'){
                drawDeer(a.phase);
            }else if(a.type==='mole'){
                drawMole();
            }else if(a.type==='woodpecker'){
                drawWoodpecker();
            }else if(a.type==='goose'){
                drawGoose();
            }else if(a.type==='fox'){
                drawFox(a.phase);
            }else if(a.type==='pheasant'){
                drawPheasant(a.phase);
            }else{
                drawGoat(a.phase);
            }

            ctx.restore();
        };

        const outline = () => {
            ctx.strokeStyle='#352a22';
            ctx.lineWidth=2.8;
            ctx.lineJoin='round';
            ctx.lineCap='round';
        };

        const drawDuck = () => {
            outline();

            ctx.fillStyle='#8c6a39';
            ctx.beginPath();
            ctx.ellipse(0,0,26,15,0,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#537d39';
            ctx.beginPath();
            ctx.arc(24,-10,11,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#e3bd48';
            ctx.beginPath();
            ctx.moveTo(33,-11);
            ctx.lineTo(47,-7);
            ctx.lineTo(33,-4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#6f5432';
            ctx.beginPath();
            ctx.ellipse(-3,-5,16,8,-.55,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#fff';
            ctx.beginPath();
            ctx.arc(27,-13,3.1,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#171717';
            ctx.beginPath();
            ctx.arc(28,-13,1.4,0,Math.PI*2);
            ctx.fill();
        };

        const drawRabbit = phase => {
            outline();

            ctx.fillStyle='#a99a89';

            ctx.beginPath();
            ctx.ellipse(-2,0,22,17,0,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(18,-10,13,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.save();
            ctx.rotate(
                Math.sin(phase)*.08
            );

            ctx.beginPath();
            ctx.ellipse(15,-32,6,20,-.14,0,Math.PI*2);
            ctx.ellipse(27,-31,6,19,.14,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.restore();

            ctx.fillStyle='#fff';
            ctx.beginPath();
            ctx.arc(23,-13,3.2,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#222';
            ctx.beginPath();
            ctx.arc(24,-13,1.5,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#e98782';
            ctx.beginPath();
            ctx.arc(31,-7,2.8,0,Math.PI*2);
            ctx.fill();
        };

        const drawBoar = phase => {
            outline();

            ctx.fillStyle='#4d4b48';

            ctx.beginPath();
            ctx.ellipse(-4,0,31,21,0,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(26,-1,19,15,0,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#7a6051';
            ctx.beginPath();
            ctx.ellipse(40,2,13,9,0,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#242424';
            ctx.beginPath();
            ctx.arc(44,1,2,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#fff';
            ctx.beginPath();
            ctx.arc(28,-6,3.2,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#171717';
            ctx.beginPath();
            ctx.arc(29,-6,1.4,0,Math.PI*2);
            ctx.fill();

            ctx.strokeStyle='#3c3835';
            ctx.lineWidth=5;

            const leg=
                Math.sin(phase)*
                5;

            ctx.beginPath();
            ctx.moveTo(-15,15);
            ctx.lineTo(-16+leg,28);
            ctx.moveTo(12,15);
            ctx.lineTo(13-leg,28);
            ctx.stroke();
        };

        const drawDeer = phase => {
            outline();

            ctx.fillStyle='#9b643c';

            ctx.beginPath();
            ctx.ellipse(-8,2,31,18,0,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle='#7d5337';
            ctx.lineWidth=12;

            ctx.beginPath();
            ctx.moveTo(11,-6);
            ctx.lineTo(23,-31);
            ctx.stroke();

            ctx.fillStyle='#a66b40';
            ctx.beginPath();
            ctx.ellipse(29,-38,15,10,-.1,0,Math.PI*2);
            ctx.fill();
            outline();
            ctx.stroke();

            ctx.strokeStyle='#5c3c2a';
            ctx.lineWidth=3;

            ctx.beginPath();
            ctx.moveTo(30,-47);
            ctx.lineTo(25,-62);
            ctx.moveTo(25,-57);
            ctx.lineTo(17,-64);
            ctx.moveTo(25,-56);
            ctx.lineTo(31,-66);

            ctx.moveTo(35,-47);
            ctx.lineTo(40,-61);
            ctx.moveTo(40,-56);
            ctx.lineTo(48,-63);
            ctx.stroke();

            ctx.fillStyle='#fff';
            ctx.beginPath();
            ctx.arc(35,-40,2.8,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#1b1b1b';
            ctx.beginPath();
            ctx.arc(36,-40,1.2,0,Math.PI*2);
            ctx.fill();

            ctx.strokeStyle='#71492f';
            ctx.lineWidth=5;

            const leg=Math.sin(phase)*7;

            ctx.beginPath();
            ctx.moveTo(-22,16);
            ctx.lineTo(-24+leg,39);
            ctx.moveTo(10,16);
            ctx.lineTo(12-leg,39);
            ctx.stroke();
        };

        const drawMole = () => {
            outline();

            ctx.fillStyle='#7a6d65';

            ctx.beginPath();
            ctx.ellipse(0,0,20,18,0,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#be8d80';

            ctx.beginPath();
            ctx.ellipse(18,1,9,6,0,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#fff';

            ctx.beginPath();
            ctx.arc(9,-6,3,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#111';

            ctx.beginPath();
            ctx.arc(10,-6,1.3,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#5b4638';

            ctx.beginPath();
            ctx.ellipse(0,15,28,8,0,0,Math.PI*2);
            ctx.fill();
        };

        const drawWoodpecker = () => {
            outline();

            ctx.fillStyle='#22262b';

            ctx.beginPath();
            ctx.ellipse(0,0,10,18,0,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#d9d9d4';

            ctx.beginPath();
            ctx.ellipse(-2,3,5,11,0,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#d9403e';

            ctx.beginPath();
            ctx.arc(5,-14,6,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#ddbb60';

            ctx.beginPath();
            ctx.moveTo(10,-14);
            ctx.lineTo(24,-10);
            ctx.lineTo(10,-7);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        };

        const drawGoose = () => {
            outline();

            ctx.fillStyle='#e7e3d7';

            ctx.beginPath();
            ctx.ellipse(-4,0,31,17,0,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle='#d8d4ca';
            ctx.lineWidth=12;

            ctx.beginPath();
            ctx.moveTo(18,-4);
            ctx.quadraticCurveTo(28,-18,24,-35);
            ctx.stroke();

            ctx.fillStyle='#e7e3d7';

            ctx.beginPath();
            ctx.arc(24,-39,10,0,Math.PI*2);
            ctx.fill();
            outline();
            ctx.stroke();

            ctx.fillStyle='#e89f34';

            ctx.beginPath();
            ctx.moveTo(32,-41);
            ctx.lineTo(48,-36);
            ctx.lineTo(32,-33);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#fff';
            ctx.beginPath();
            ctx.arc(27,-42,2.7,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#171717';
            ctx.beginPath();
            ctx.arc(28,-42,1.2,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#bab7ac';
            ctx.beginPath();
            ctx.ellipse(-7,-5,17,8,-.45,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();
        };

        const drawFox = phase => {
            outline();

            ctx.fillStyle='#c96130';

            ctx.beginPath();
            ctx.ellipse(-3,1,28,16,0,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(18,-8);
            ctx.lineTo(38,-17);
            ctx.lineTo(42,-3);
            ctx.lineTo(28,8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // ears
            ctx.beginPath();
            ctx.moveTo(25,-14);
            ctx.lineTo(28,-29);
            ctx.lineTo(35,-16);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(35,-15);
            ctx.lineTo(42,-27);
            ctx.lineTo(43,-10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // tail
            ctx.fillStyle='#d5743b';
            ctx.beginPath();
            ctx.ellipse(-31,0,25,10,-.45,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#f0e5cf';
            ctx.beginPath();
            ctx.ellipse(-49,-7,8,7,-.45,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#fff';
            ctx.beginPath();
            ctx.arc(34,-10,3,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#111';
            ctx.beginPath();
            ctx.arc(35,-10,1.35,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#242424';
            ctx.beginPath();
            ctx.arc(43,-3,2.8,0,Math.PI*2);
            ctx.fill();

            ctx.strokeStyle='#8f4828';
            ctx.lineWidth=4;

            const leg=Math.sin(phase)*6;

            ctx.beginPath();
            ctx.moveTo(-13,13);
            ctx.lineTo(-13+leg,27);
            ctx.moveTo(13,12);
            ctx.lineTo(13-leg,26);
            ctx.stroke();
        };

        const drawPheasant = phase => {
            outline();

            ctx.fillStyle='#8e562d';
            ctx.beginPath();
            ctx.ellipse(-4,0,25,14,0,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#376448';
            ctx.beginPath();
            ctx.arc(19,-9,9,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#b93431';
            ctx.beginPath();
            ctx.arc(24,-10,5,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#d2a43f';
            ctx.beginPath();
            ctx.moveTo(26,-10);
            ctx.lineTo(39,-6);
            ctx.lineTo(26,-3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle='#5c432d';
            ctx.lineWidth=5;

            ctx.beginPath();
            ctx.moveTo(-24,2);
            ctx.lineTo(-58,13+Math.sin(phase)*4);
            ctx.moveTo(-21,6);
            ctx.lineTo(-54,24+Math.cos(phase)*3);
            ctx.stroke();

            ctx.fillStyle='#fff';
            ctx.beginPath();
            ctx.arc(21,-12,2.6,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#111';
            ctx.beginPath();
            ctx.arc(22,-12,1.2,0,Math.PI*2);
            ctx.fill();
        };

        const drawGoat = phase => {
            outline();

            ctx.fillStyle='#b9b2a1';
            ctx.beginPath();
            ctx.ellipse(-5,1,30,18,0,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#c9c1af';
            ctx.beginPath();
            ctx.ellipse(25,-9,16,12,-.08,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle='#6d624f';
            ctx.lineWidth=3;

            ctx.beginPath();
            ctx.moveTo(25,-19);
            ctx.quadraticCurveTo(20,-34,10,-30);
            ctx.moveTo(33,-18);
            ctx.quadraticCurveTo(40,-32,49,-26);
            ctx.stroke();

            ctx.fillStyle='#fff';
            ctx.beginPath();
            ctx.arc(31,-11,3,0,Math.PI*2);
            ctx.fill();

            ctx.fillStyle='#111';
            ctx.beginPath();
            ctx.arc(32,-11,1.3,0,Math.PI*2);
            ctx.fill();

            ctx.strokeStyle='#817767';
            ctx.lineWidth=5;

            const leg=Math.sin(phase)*5;

            ctx.beginPath();
            ctx.moveTo(-18,16);
            ctx.lineTo(-18+leg,38);
            ctx.moveTo(11,16);
            ctx.lineTo(12-leg,38);
            ctx.stroke();

            // beard
            ctx.fillStyle='#8d8678';
            ctx.beginPath();
            ctx.moveTo(31,1);
            ctx.lineTo(36,17);
            ctx.lineTo(26,8);
            ctx.closePath();
            ctx.fill();
        };

        const drawProp = p => {
            if(p.done&&p.type!=='can'){
                return;
            }

            const pose=propPose(p);

            if(
                pose.x<-80||
                pose.x>width+80
            ){
                return;
            }

            ctx.save();
            ctx.translate(pose.x,pose.y);

            outline();

            if(p.type==='bell'){
                ctx.fillStyle='#d4a62e';

                ctx.beginPath();
                ctx.moveTo(-14,10);
                ctx.quadraticCurveTo(-11,-13,0,-19);
                ctx.quadraticCurveTo(11,-13,14,10);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle='#704d23';

                ctx.beginPath();
                ctx.arc(0,13,4,0,Math.PI*2);
                ctx.fill();
            }else if(p.type==='can'){
                ctx.fillStyle='#a8aaa8';

                ctx.save();
                ctx.rotate(p.hits*.18);

                ctx.fillRect(-9,-14,18,28);
                ctx.strokeRect(-9,-14,18,28);

                ctx.fillStyle='#777b7a';
                ctx.fillRect(-9,-14,18,5);

                ctx.restore();
            }else if(p.type==='mushroom'){
                ctx.fillStyle='#dc3f36';

                ctx.beginPath();
                ctx.arc(0,-7,17,Math.PI,0);
                ctx.lineTo(17,-7);
                ctx.lineTo(-17,-7);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle='#eee4c5';
                ctx.fillRect(-5,-7,10,22);
                ctx.strokeRect(-5,-7,10,22);

                ctx.fillStyle='#fff3d6';
                ctx.beginPath();
                ctx.arc(-7,-12,3,0,Math.PI*2);
                ctx.arc(6,-9,3,0,Math.PI*2);
                ctx.fill();
            }else{
                ctx.fillStyle='#55a8a0';

                ctx.beginPath();
                ctx.moveTo(-7,14);
                ctx.lineTo(-9,-6);
                ctx.lineTo(-4,-13);
                ctx.lineTo(-4,-22);
                ctx.lineTo(4,-22);
                ctx.lineTo(4,-13);
                ctx.lineTo(9,-6);
                ctx.lineTo(7,14);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle='rgba(255,255,255,.45)';
                ctx.fillRect(-4,-6,2,13);
            }

            ctx.restore();
        };

        const drawBonusTarget = () => {
            if(!bonusTarget) return;

            const b=bonusTarget;

            ctx.save();

            ctx.translate(
                b.x,
                b.y+
                Math.sin(b.phase)*8
            );

            ctx.shadowBlur=20;
            ctx.shadowColor='#ffe66a';

            ctx.fillStyle='#f8e17a';
            ctx.strokeStyle='#68471f';
            ctx.lineWidth=4;

            ctx.beginPath();
            ctx.arc(0,0,34,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur=0;

            ctx.fillStyle='#5d4323';
            ctx.font='900 22px Arial';
            ctx.textAlign='center';
            ctx.textBaseline='middle';

            ctx.fillText(
                b.type==='clock'
                    ?'⏱'
                    :b.type==='score'
                        ?'★'
                        :'💥',
                0,
                1
            );

            ctx.restore();
        };

        const drawWeapon = () => {
            const weapon=WEAPONS[weaponId];

            ctx.save();

            const x=width*.5;
            const y=height;

            if(weaponId==='shotgun'){
                ctx.fillStyle='#35261f';

                ctx.fillRect(
                    x-22,
                    y-180,
                    44,
                    180
                );

                ctx.fillStyle='#26343e';

                ctx.fillRect(
                    x-10,
                    y-235,
                    20,
                    145
                );

                ctx.fillStyle='#8a5d37';

                ctx.fillRect(
                    x-24,
                    y-105,
                    48,
                    60
                );
            }else if(weaponId==='crossbow'){
                ctx.strokeStyle='#302923';
                ctx.lineWidth=9;

                ctx.beginPath();
                ctx.arc(
                    x,
                    y-65,
                    95,
                    Math.PI*1.10,
                    Math.PI*1.90
                );
                ctx.stroke();

                ctx.strokeStyle='#b9b2a1';
                ctx.lineWidth=2;

                ctx.beginPath();
                ctx.moveTo(x-72,y-120);
                ctx.lineTo(x+72,y-120);
                ctx.stroke();

                ctx.fillStyle='#60442e';

                ctx.fillRect(
                    x-7,
                    y-145,
                    14,
                    145
                );
            }else if(weaponId==='rifle'){
                ctx.fillStyle='#35434b';

                ctx.fillRect(
                    x-12,
                    y-240,
                    24,
                    185
                );

                ctx.fillStyle='#67452f';

                ctx.fillRect(
                    x-27,
                    y-105,
                    54,
                    105
                );

                ctx.fillStyle='#151b1e';

                ctx.fillRect(
                    x-22,
                    y-190,
                    44,
                    16
                );
            }else{
                ctx.fillStyle='#a52727';

                ctx.fillRect(
                    x-10,
                    y-105,
                    20,
                    82
                );

                ctx.fillStyle='#d6b14a';

                ctx.fillRect(
                    x-10,
                    y-38,
                    20,
                    8
                );

                ctx.strokeStyle='#222';
                ctx.lineWidth=3;

                ctx.beginPath();
                ctx.moveTo(x,y-105);
                ctx.quadraticCurveTo(
                    x+14,
                    y-125,
                    x+7,
                    y-139
                );
                ctx.stroke();
            }

            if(muzzleFlash>0){
                ctx.fillStyle=
                    `rgba(255,211,87,${muzzleFlash/.08})`;

                ctx.beginPath();
                ctx.moveTo(x,y-230);
                ctx.lineTo(x-26,y-270);
                ctx.lineTo(x,y-258);
                ctx.lineTo(x+25,y-276);
                ctx.lineTo(x+13,y-239);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        };

        const drawCrosshair = () => {
            if(!mouse.inside||phase==='menu'||phase==='over'){
                return;
            }

            const r=
                WEAPONS[weaponId].explosive
                    ?16
                    :9;

            ctx.save();

            ctx.translate(mouse.x,mouse.y);

            ctx.strokeStyle='#8f171c';
            ctx.lineWidth=2;

            ctx.beginPath();
            ctx.arc(0,0,r,0,Math.PI*2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-r-7,0);
            ctx.lineTo(-r+2,0);
            ctx.moveTo(r-2,0);
            ctx.lineTo(r+7,0);
            ctx.moveTo(0,-r-7);
            ctx.lineTo(0,-r+2);
            ctx.moveTo(0,r-2);
            ctx.lineTo(0,r+7);
            ctx.stroke();

            ctx.fillStyle='#8f171c';

            ctx.beginPath();
            ctx.arc(0,0,2,0,Math.PI*2);
            ctx.fill();

            ctx.restore();
        };

        const drawFx = () => {
            for(const p of particles){
                ctx.save();

                ctx.globalAlpha=
                    clamp(
                        p.life/p.maxLife,
                        0,
                        1
                    );

                ctx.fillStyle=p.color;

                ctx.beginPath();
                ctx.arc(
                    p.x,
                    p.y,
                    p.size,
                    0,
                    Math.PI*2
                );
                ctx.fill();

                ctx.restore();
            }

            for(const f of floatingText){
                ctx.save();

                ctx.globalAlpha=
                    clamp(
                        f.life/f.maxLife,
                        0,
                        1
                    );

                ctx.fillStyle=f.color;
                ctx.strokeStyle='#4b2b1f';
                ctx.lineWidth=3;

                ctx.font='900 17px Arial';
                ctx.textAlign='center';

                ctx.strokeText(
                    f.text,
                    f.x,
                    f.y
                );

                ctx.fillText(
                    f.text,
                    f.x,
                    f.y
                );

                ctx.restore();
            }
        };

        const draw = () => {
            ctx.save();

            if(shake>0){
                ctx.translate(
                    rand(-shake,shake),
                    rand(-shake,shake)
                );
            }

            drawBackground();

            const sorted=
                animals
                    .slice()
                    .sort(
                        (a,b)=>
                            a.scale-
                            b.scale
                    );

            for(const a of sorted){
                drawAnimal(a);
            }

            if(phase==='bonus'){
                drawBonusTarget();
            }

            drawWeapon();
            drawFx();

            ctx.restore();

            drawCrosshair();
        };

        const updateHud = () => {
            const preset=roundPreset(roundIndex);

            timerEl.textContent=
                formatTime(roundTime);

            roundNameEl.textContent=
                `${preset.name} · ${preset.area??'Forest'}`;

            scoreEl.textContent=
                String(
                    Math.max(
                        0,
                        score
                    )
                ).padStart(6,'0');

            quotaPanel.innerHTML=
                Object.entries(quota)
                    .map(([type,amount])=>{
                        const done=
                            Math.min(
                                amount,
                                quotaDone[type]??0
                            );

                        return `
                            <div class="ff-quota ${done>=amount?'done':''}">
                                <span class="ff-quota-icon">${SPECIES[type].icon}</span>
                                <span>${done}/${amount}</span>
                            </div>
                        `;
                    })
                    .join('');

            const weapon=
                WEAPONS[weaponId];

            const state=
                weaponStates[weaponId];

            weaponNameEl.textContent=
                weapon.name.toUpperCase();

            weaponSlotbarEl.innerHTML=
                Object.values(WEAPONS)
                    .map((w,index)=>{
                        const s=
                            weaponStates[w.id];

                        const unlocked=
                            !!s?.unlocked;

                        return `
                            <div class="ff-weapon-slot ${w.id===weaponId?'active':''} ${unlocked?'':'locked'}">
                                <b>${index+1}</b>
                                ${unlocked?w.short:'LOCKED'}
                            </div>
                        `;
                    })
                    .join('');

            shellsEl.innerHTML='';

            const visualCount=
                Math.min(
                    8,
                    weapon.magSize
                );

            for(let i=0;i<visualCount;i++){
                const shell=
                    document.createElement('i');

                shell.className=
                    `ff-shell ${i>=state.mag?'empty':''}`;

                shellsEl.appendChild(shell);
            }

            const reserve=
                Number.isFinite(
                    state.reserve
                )
                    ?state.reserve
                    :'∞';

            ammoTextEl.innerHTML=
                reloading
                    ?`${state.mag} / ${reserve}<br><b>${Math.max(0,reloadTimer).toFixed(1)}s</b>`
                    :`${state.mag} / ${reserve}`;

            const canReload=
                state.mag<
                weapon.magSize&&
                (
                    !Number.isFinite(
                        state.reserve
                    )||
                    state.reserve>0
                );

            if(reloading){
                reloadStateEl.textContent=
                    `RELOADING ${Math.max(0,reloadTimer).toFixed(1)}s`;

                reloadStateEl.className=
                    'ff-reload-state loading';

                reloadFillEl.style.width=
                    `${clamp(
                        1-
                        reloadTimer/
                        Math.max(
                            .001,
                            weapon.reload
                        ),
                        0,
                        1
                    )*100}%`;

                reloadAlertEl.textContent=
                    `RELOADING · ${Math.max(0,reloadTimer).toFixed(1)}s`;

                reloadAlertEl.classList.add('on');
            }else if(
                state.mag<=0&&
                canReload
            ){
                reloadStateEl.textContent=
                    'EMPTY · PRESS R';

                reloadStateEl.className=
                    'ff-reload-state warn';

                reloadFillEl.style.width='0%';

                reloadAlertEl.textContent=
                    'R / RMB · RELOAD';

                reloadAlertEl.classList.add('on');
            }else if(
                state.mag<=Math.max(
                    1,
                    Math.floor(
                        weapon.magSize*.25
                    )
                )&&
                canReload
            ){
                reloadStateEl.textContent=
                    'LOW AMMO';

                reloadStateEl.className=
                    'ff-reload-state warn';

                reloadFillEl.style.width='0%';
                reloadAlertEl.classList.remove('on');
            }else{
                reloadStateEl.textContent=
                    'READY';

                reloadStateEl.className=
                    'ff-reload-state';

                reloadFillEl.style.width='0%';
                reloadAlertEl.classList.remove('on');
            }

            comboEl.textContent=
                `COMBO ×${Math.max(1,combo)}`;

            comboEl.style.opacity=
                combo>=2
                    ?'1'
                    :'0';

            messageEl.textContent=
                message;

            messageEl.style.opacity=
                messageTimer>0
                    ?'1'
                    :'0';

            bonusLabel.classList.toggle(
                'on',
                phase==='bonus'
            );
        };

        const resize = () => {
            const rect=root.getBoundingClientRect();

            width=Math.max(1,rect.width);
            height=Math.max(1,rect.height);

            dpr=Math.min(
                2,
                window.devicePixelRatio||1
            );

            canvas.width=
                Math.round(
                    width*dpr
                );

            canvas.height=
                Math.round(
                    height*dpr
                );

            canvas.style.width=`${width}px`;
            canvas.style.height=`${height}px`;

            ctx.setTransform(
                dpr,
                0,
                0,
                dpr,
                0,
                0
            );

            cameraX=
                clamp(
                    cameraX,
                    0,
                    Math.max(
                        0,
                        sceneWidth-width
                    )
                );

            cameraTargetX=cameraX;
        };

        const onMouseMove = event => {
            const rect=canvas.getBoundingClientRect();

            mouse.x=event.clientX-rect.left;
            mouse.y=event.clientY-rect.top;
            mouse.inside=true;
        };

        const onMouseLeave = () => {
            mouse.inside=false;
        };

        const onMouseDown = event => {
            if(event.button===0){
                fire();
            }else if(event.button===2){
                event.preventDefault();
                beginReload();
            }
        };

        const onContextMenu = event => {
            event.preventDefault();
        };

        const onKeyDown = event => {
            if(event.code==='KeyR'){
                beginReload();
            }

            if(event.code==='Digit1'){
                switchWeapon('shotgun');
            }else if(event.code==='Digit2'){
                switchWeapon('crossbow');
            }else if(event.code==='Digit3'){
                switchWeapon('rifle');
            }else if(event.code==='Digit4'){
                switchWeapon('dynamite');
            }

            if(event.code==='ArrowLeft'){
                cameraTargetX=
                    clamp(
                        cameraTargetX-140,
                        0,
                        Math.max(
                            0,
                            sceneWidth-width
                        )
                    );
            }

            if(event.code==='ArrowRight'){
                cameraTargetX=
                    clamp(
                        cameraTargetX+140,
                        0,
                        Math.max(
                            0,
                            sceneWidth-width
                        )
                    );
            }
        };

        diffButtons.forEach(button=>{
            button.addEventListener('click',()=>{
                difficultyKey=
                    button.dataset.diff||
                    'normal';

                diffButtons.forEach(b=>
                    b.classList.toggle(
                        'selected',
                        b===button
                    )
                );
            });
        });

        playBtn.addEventListener('click',startGame);
        restartBtn.addEventListener('click',startGame);

        audioBtn.addEventListener('click',()=>{
            muted=!muted;

            audioBtn.textContent=
                `Sound: ${muted?'Aus':'An'}`;

            if(!muted){
                ensureAudio();
                tone(640,.035,.007,'sine');
            }
        });

        canvas.addEventListener('mousemove',onMouseMove);
        canvas.addEventListener('mouseleave',onMouseLeave);
        canvas.addEventListener('mousedown',onMouseDown);
        canvas.addEventListener('contextmenu',onContextMenu);

        window.addEventListener('keydown',onKeyDown);

        resizeObserver=new ResizeObserver(resize);
        resizeObserver.observe(root);

        resize();

        weaponStates=weaponStateDefaults();
        props=createProps();

        const loop = now => {
            if(destroyed) return;

            const delta=
                Math.min(
                    .033,
                    Math.max(
                        0,
                        (now-lastTime)/1000
                    )
                );

            lastTime=now;

            update(delta);
            draw();

            raf=requestAnimationFrame(loop);
        };

        raf=requestAnimationFrame(loop);

        return {
            destroy:()=>{
                destroyed=true;
                running=false;

                cancelAnimationFrame(raf);
                resizeObserver?.disconnect();

                canvas.removeEventListener('mousemove',onMouseMove);
                canvas.removeEventListener('mouseleave',onMouseLeave);
                canvas.removeEventListener('mousedown',onMouseDown);
                canvas.removeEventListener('contextmenu',onContextMenu);

                window.removeEventListener('keydown',onKeyDown);

                try{
                    audio?.close?.();
                }catch{}

                style.remove();
            }
        };
    }
};

export {
    GAME_ID,
    CONFIG,
    DIFFICULTY,
    SPECIES,
    WEAPONS,
    ROUNDS
};
