const CONFIG = {
    tile: 96,
    fov: 82 * Math.PI / 180,
    adsFov: 58 * Math.PI / 180,
    rayStepPx: 2,
    playerRadius: 19,

    moveSpeed: 300,
    accel: 10.5,
    airAccel: 3.0,
    friction: 8.5,

    jumpVelocity: 350,
    gravity: 980,

    slideDuration: 0.58,
    slideBoost: 1.52,
    slideMinSpeed: 210,

    respawnDelay: 1.7,
    matchSeconds: 240,
    scoreLimit: 30,

    botCount: 8,
    botThinkMin: 0.08,
    botThinkMax: 0.20,

    mouseSensitivity: 0.00225,
    maxPitch: 185,

    maxParticles: 180,
    leaderboardSize: 7
};

const WEAPONS = {
    ar: {
        id: 'ar',
        name: 'AR-26',
        className: 'Assault',
        ammoName: '5.56',
        damage: 27,
        headDamage: 42,
        range: 1500,
        fireRate: 9.2,
        mag: 30,
        reserve: 120,
        reload: 1.65,
        spread: 0.010,
        moveSpread: 0.019,
        adsSpread: 0.003,
        pellets: 1,
        color: '#4d92d9',
        sound: 132,
        kick: 0.72,
        automatic: true
    },
    smg: {
        id: 'smg',
        name: 'VX-9',
        className: 'Runner',
        ammoName: '9mm',
        damage: 19,
        headDamage: 28,
        range: 1050,
        fireRate: 13.0,
        mag: 36,
        reserve: 144,
        reload: 1.35,
        spread: 0.015,
        moveSpread: 0.026,
        adsSpread: 0.006,
        pellets: 1,
        color: '#efb84e',
        sound: 155,
        kick: 0.52,
        automatic: true,
        speedMult: 1.10
    },
    sniper: {
        id: 'sniper',
        name: 'Longshot',
        className: 'Marksman',
        ammoName: '.308',
        damage: 80,
        headDamage: 140,
        range: 2600,
        fireRate: 1.12,
        mag: 5,
        reserve: 25,
        reload: 2.15,
        spread: 0.019,
        moveSpread: 0.045,
        adsSpread: 0.0006,
        pellets: 1,
        color: '#8fd06f',
        sound: 88,
        kick: 1.45,
        automatic: false,
        adsRequired: true
    },
    shotgun: {
        id: 'shotgun',
        name: 'Breach-12',
        className: 'Breacher',
        ammoName: '12G',
        damage: 15,
        headDamage: 20,
        range: 720,
        fireRate: 1.35,
        mag: 6,
        reserve: 30,
        reload: 1.85,
        spread: 0.058,
        moveSpread: 0.070,
        adsSpread: 0.040,
        pellets: 8,
        color: '#e6755f',
        sound: 106,
        kick: 1.10,
        automatic: false
    },
    pistol: {
        id: 'pistol',
        name: 'Sidearm',
        className: 'Secondary',
        ammoName: '9mm',
        damage: 24,
        headDamage: 38,
        range: 1050,
        fireRate: 4.4,
        mag: 12,
        reserve: 48,
        reload: 1.25,
        spread: 0.012,
        moveSpread: 0.020,
        adsSpread: 0.005,
        pellets: 1,
        color: '#b8c1ca',
        sound: 178,
        kick: 0.48,
        automatic: false
    },
    knife: {
        id: 'knife',
        name: 'Combat Knife',
        className: 'Melee',
        damage: 75,
        headDamage: 75,
        range: 86,
        fireRate: 1.65,
        mag: Infinity,
        reserve: Infinity,
        reload: 0,
        spread: 0,
        moveSpread: 0,
        adsSpread: 0,
        pellets: 1,
        color: '#d6dbe0',
        sound: 240,
        kick: 0.36,
        automatic: false,
        melee: true
    }
};

const CLASSES = [
    {
        id: 'assault',
        name: 'Assault',
        weapon: 'ar',
        blurb: 'Balanced rifle · reliable at every range',
        speed: 1.0,
        hp: 100
    },
    {
        id: 'runner',
        name: 'Runner',
        weapon: 'smg',
        blurb: 'High mobility · fast close-range pressure',
        speed: 1.10,
        hp: 95
    },
    {
        id: 'marksman',
        name: 'Marksman',
        weapon: 'sniper',
        blurb: 'One-shot headshots · precision and range',
        speed: 0.96,
        hp: 90
    },
    {
        id: 'breacher',
        name: 'Breacher',
        weapon: 'shotgun',
        blurb: 'Devastating up close · strong slide attacks',
        speed: 1.04,
        hp: 105
    }
];

const DIFFICULTIES = {
    easy:   { label:'Easy',   aim:0.050, reaction:0.28, strafe:0.70, aggression:0.72 },
    normal: { label:'Normal', aim:0.028, reaction:0.18, strafe:0.90, aggression:0.88 },
    hard:   { label:'Hard',   aim:0.015, reaction:0.11, strafe:1.00, aggression:1.00 }
};

const MAPS = {
    yard: {
        id: 'yard',
        name: 'Container Yard',
        description: 'Open center, colored lanes, containers and long sightlines.',
        rows: [
            '1111111111111111111111111111',
            '1000000000000000000000000001',
            '1000000222200000003333000001',
            '1000000200200000003003000001',
            '1000000200200000003003000001',
            '1000000222200000003333000001',
            '1000000000000000000000000001',
            '1000444400000000000044440001',
            '1000400400000110000040040001',
            '1000400400000110000040040001',
            '1000444400000000000044440001',
            '1000000000000000000000000001',
            '1000000111100000001111000001',
            '1000000100100000001001000001',
            '1000000100100000001001000001',
            '1000000111100000001111000001',
            '1000000000000000000000000001',
            '1000555500000000000055550001',
            '1000500500000110000050050001',
            '1000500500000110000050050001',
            '1000555500000000000055550001',
            '1000000000000000000000000001',
            '1000000222200000003333000001',
            '1000000200200000003003000001',
            '1000000222200000003333000001',
            '1000000000000000000000000001',
            '1000000000000000000000000001',
            '1111111111111111111111111111'
        ],
        spawns: [
            [2.5,2.5],[25.5,2.5],[2.5,25.5],[25.5,25.5],
            [13.5,3.5],[14.5,24.5],[4.5,14.0],[23.5,14.0],
            [8.5,8.5],[19.5,19.5],[19.5,8.5],[8.5,19.5]
        ]
    },
    depot: {
        id: 'depot',
        name: 'Block Depot',
        description: 'Tighter corridors with a central warehouse and flank routes.',
        rows: [
            '1111111111111111111111111111',
            '1000000000000000000000000001',
            '1000222200000000000022220001',
            '1000200200000000000020020001',
            '1000200200011111100020020001',
            '1000222200010000100022220001',
            '1000000000010000100000000001',
            '1000000000010000100000000001',
            '1000111100010000100011110001',
            '1000100100010000100010010001',
            '1000100100010000100010010001',
            '1000111100010000100011110001',
            '1000000000010000100000000001',
            '1000000000010000100000000001',
            '1000000000010000100000000001',
            '1000000000010000100000000001',
            '1000111100010000100011110001',
            '1000100100010000100010010001',
            '1000100100010000100010010001',
            '1000111100010000100011110001',
            '1000000000010000100000000001',
            '1000333300010000100033330001',
            '1000300300011111100030030001',
            '1000300300000000000030030001',
            '1000333300000000000033330001',
            '1000000000000000000000000001',
            '1000000000000000000000000001',
            '1111111111111111111111111111'
        ],
        spawns: [
            [2.5,2.5],[25.5,2.5],[2.5,25.5],[25.5,25.5],
            [8.5,4.5],[19.5,4.5],[8.5,23.5],[19.5,23.5],
            [4.5,13.5],[23.5,13.5],[13.5,8.5],[14.5,19.5]
        ]
    }
};

const BOT_NAMES = [
    'k9','Voxel','NoScope','Byte','Drift','Ace','Nova','Rex',
    'Bolt','Ghost','Mint','Mako','Dash','Crow','Zero','Luna'
];

export default {
    manifest: {
        id: 'block-strike',
        name: 'Block Strike',
        description: 'Fast-paced low-poly browser FPS with slide-hopping, classes, bots and compact arena maps.',
        icon: '🔫',
        tags: ['FPS','Shooter','AI','Arena','3D']
    },

    init: (container, services) => {
        let destroyed = false;
        let animationId = 0;
        let resizeObserver = null;
        let lastFrame = performance.now();

        let width = 1;
        let height = 1;
        let dpr = 1;

        let running = false;
        let paused = false;
        let ended = false;
        let matchTime = CONFIG.matchSeconds;

        let selectedClass = CLASSES[0];
        let selectedMap = MAPS.yard;
        let difficultyKey = 'normal';

        let map = null;
        let mapW = 0;
        let mapH = 0;

        let player = null;
        let bots = [];
        let nextId = 1;

        let depthBuffer = [];
        let particles = [];
        let killFeed = [];
        let medals = [];

        let mouseDown = false;
        let adsDown = false;
        let fireLatch = false;

        let recoil = 0;
        let muzzleFlash = 0;
        let hitMarker = 0;
        let damageFlash = 0;
        let crosshairBloom = 0;
        let lastPlayerKillAt = -99;
        let streak = 0;

        let audio = null;
        let muted = false;

        const keys = new Set();

        const style = document.createElement('style');
        style.textContent = `
            .bs-game{
                position:relative;
                width:100%;
                height:100%;
                overflow:hidden;
                background:#111820;
                color:#f3f6f8;
                font-family:Arial,Helvetica,sans-serif;
                user-select:none;
            }

            .bs-game *{box-sizing:border-box}

            .bs-canvas{
                display:block;
                width:100%;
                height:100%;
                cursor:crosshair;
            }

            .bs-ui{
                position:absolute;
                inset:0;
                z-index:10;
                pointer-events:none;
            }

            .bs-top{
                position:absolute;
                left:50%;
                top:10px;
                transform:translateX(-50%);
                text-align:center;
                text-shadow:0 2px 5px rgba(0,0,0,.75);
            }

            .bs-timer{
                font-size:1.15rem;
                font-weight:1000;
                letter-spacing:.06em;
            }

            .bs-mode{
                margin-top:1px;
                color:#b8c3cc;
                font-size:.55rem;
                font-weight:900;
                text-transform:uppercase;
                letter-spacing:.12em;
            }

            .bs-leaderboard{
                position:absolute;
                top:10px;
                right:10px;
                width:196px;
                padding:8px 9px;
                border-radius:4px;
                background:rgba(8,11,15,.70);
                border:1px solid rgba(255,255,255,.08);
                box-shadow:0 5px 16px rgba(0,0,0,.20);
                backdrop-filter:blur(4px);
            }

            .bs-lb-title{
                margin-bottom:5px;
                color:#d9e1e6;
                font-size:.62rem;
                font-weight:1000;
                text-transform:uppercase;
                letter-spacing:.08em;
            }

            .bs-lb-row{
                display:flex;
                align-items:center;
                gap:5px;
                padding:2px 0;
                color:#a9b4bd;
                font-size:.62rem;
                font-weight:800;
            }

            .bs-lb-row.you{color:#ffd85b}
            .bs-lb-rank{width:18px;color:#75828d}
            .bs-lb-name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
            .bs-lb-score{color:#e7edf1}

            .bs-health{
                position:absolute;
                left:16px;
                bottom:16px;
                width:230px;
            }

            .bs-health-num{
                margin-bottom:4px;
                font-size:1.55rem;
                line-height:1;
                font-weight:1000;
                text-shadow:0 2px 4px rgba(0,0,0,.7);
            }

            .bs-health-track{
                height:12px;
                border:2px solid #0a0c0f;
                background:#1b232a;
                box-shadow:0 2px 7px rgba(0,0,0,.28);
            }

            .bs-health-fill{
                height:100%;
                width:100%;
                background:#55df72;
                transition:width .08s linear;
            }

            .bs-scoreline{
                margin-top:5px;
                color:#bac5ce;
                font-size:.61rem;
                font-weight:900;
            }

            .bs-ammo{
                position:absolute;
                right:18px;
                bottom:16px;
                text-align:right;
                text-shadow:0 2px 5px rgba(0,0,0,.75);
            }

            .bs-weapon{
                color:#c9d3da;
                font-size:.64rem;
                font-weight:900;
                text-transform:uppercase;
                letter-spacing:.08em;
            }

            .bs-ammo-main{
                margin-top:-2px;
                font-size:2.15rem;
                line-height:1;
                font-weight:1000;
            }

            .bs-ammo-main small{
                color:#9ca9b2;
                font-size:.72rem;
            }

            .bs-reload{
                min-height:13px;
                color:#ffd665;
                font-size:.59rem;
                font-weight:900;
                letter-spacing:.06em;
                text-transform:uppercase;
            }

            .bs-feed{
                position:absolute;
                top:83px;
                right:10px;
                width:250px;
                display:flex;
                flex-direction:column;
                gap:4px;
                align-items:flex-end;
            }

            .bs-feed-item{
                padding:4px 7px;
                border-left:3px solid #58a8eb;
                background:rgba(8,11,15,.65);
                color:#bec8cf;
                font-size:.58rem;
                font-weight:800;
                text-shadow:0 1px 3px #000;
            }

            .bs-medals{
                position:absolute;
                left:50%;
                top:22%;
                transform:translateX(-50%);
                display:flex;
                flex-direction:column;
                align-items:center;
                gap:4px;
            }

            .bs-medal{
                padding:5px 9px;
                background:rgba(10,13,17,.58);
                border-top:1px solid rgba(255,255,255,.08);
                border-bottom:1px solid rgba(255,255,255,.08);
                color:#ffe078;
                font-size:.64rem;
                font-weight:1000;
                text-transform:uppercase;
                letter-spacing:.08em;
                text-shadow:0 0 8px rgba(255,211,72,.35);
            }

            .bs-crosshair{
                position:absolute;
                left:50%;
                top:50%;
                width:1px;
                height:1px;
            }

            .bs-crosshair i{
                position:absolute;
                display:block;
                background:#fff;
                box-shadow:0 0 3px rgba(0,0,0,.85);
            }

            .bs-crosshair .l,
            .bs-crosshair .r{
                top:-1px;
                width:8px;
                height:2px;
            }

            .bs-crosshair .t,
            .bs-crosshair .b{
                left:-1px;
                width:2px;
                height:8px;
            }

            .bs-hit{
                position:absolute;
                left:50%;
                top:50%;
                width:26px;
                height:26px;
                transform:translate(-50%,-50%);
                opacity:0;
            }

            .bs-hit:before,
            .bs-hit:after{
                content:"";
                position:absolute;
                left:12px;
                top:2px;
                width:2px;
                height:22px;
                background:#fff;
                transform:rotate(45deg);
                box-shadow:0 0 5px #000;
            }

            .bs-hit:after{transform:rotate(-45deg)}

            .bs-click{
                position:absolute;
                left:50%;
                bottom:22%;
                transform:translateX(-50%);
                padding:7px 10px;
                border:1px solid rgba(255,255,255,.12);
                background:rgba(5,7,9,.64);
                color:#d6dde2;
                font-size:.61rem;
                font-weight:900;
                pointer-events:none;
            }

            .bs-overlay{
                position:absolute;
                inset:0;
                z-index:30;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:22px;
                background:
                    linear-gradient(rgba(10,14,18,.78),rgba(10,14,18,.88)),
                    repeating-linear-gradient(
                        90deg,
                        rgba(255,255,255,.018) 0 2px,
                        transparent 2px 34px
                    );
                backdrop-filter:blur(4px);
            }

            .bs-overlay.hidden{display:none}

            .bs-card{
                width:min(760px,100%);
                padding:26px 28px;
                border:1px solid rgba(255,255,255,.10);
                background:rgba(20,26,32,.95);
                box-shadow:0 24px 70px rgba(0,0,0,.38);
            }

            .bs-logo{
                color:#f0f3f5;
                font-size:clamp(2.4rem,7vw,4.8rem);
                line-height:.92;
                font-weight:1000;
                letter-spacing:-.07em;
                text-transform:uppercase;
            }

            .bs-logo span{color:#55a8ef}

            .bs-sub{
                margin:9px 0 19px;
                color:#8997a3;
                font-size:.77rem;
                line-height:1.45;
            }

            .bs-section-title{
                margin:14px 0 7px;
                color:#c9d2d8;
                font-size:.61rem;
                font-weight:1000;
                text-transform:uppercase;
                letter-spacing:.10em;
            }

            .bs-classes{
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:7px;
            }

            .bs-class{
                min-width:0;
                padding:10px 8px;
                border:1px solid rgba(255,255,255,.08);
                background:#171e24;
                color:#8e9aa4;
                cursor:pointer;
                text-align:left;
            }

            .bs-class.selected{
                border-color:#4b9bdb;
                background:#1a2d3c;
                box-shadow:inset 0 0 0 1px rgba(85,168,239,.20);
            }

            .bs-class-name{
                color:#dce2e6;
                font-size:.69rem;
                font-weight:1000;
            }

            .bs-class-gun{
                margin-top:2px;
                color:#5ca8e6;
                font-size:.61rem;
                font-weight:900;
            }

            .bs-class-desc{
                margin-top:5px;
                font-size:.55rem;
                line-height:1.35;
            }

            .bs-options{
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:10px;
                margin-top:13px;
            }

            .bs-option{
                padding:10px;
                border:1px solid rgba(255,255,255,.07);
                background:#171e24;
            }

            .bs-option-label{
                margin-bottom:6px;
                color:#8996a0;
                font-size:.56rem;
                font-weight:1000;
                text-transform:uppercase;
            }

            .bs-segment{
                display:flex;
                gap:5px;
            }

            .bs-seg{
                flex:1;
                padding:7px 6px;
                border:1px solid rgba(255,255,255,.07);
                background:#10161b;
                color:#83909a;
                font:inherit;
                font-size:.59rem;
                font-weight:900;
                cursor:pointer;
            }

            .bs-seg.selected{
                color:#f3f6f8;
                background:#2b6f9f;
                border-color:#468fbf;
            }

            .bs-play{
                width:100%;
                height:47px;
                margin-top:15px;
                border:0;
                background:#3e9bdd;
                color:#07131a;
                font:inherit;
                font-size:.82rem;
                font-weight:1000;
                cursor:pointer;
                box-shadow:inset 0 -3px 0 rgba(0,0,0,.18);
            }

            .bs-controls{
                margin-top:10px;
                color:#71808c;
                font-size:.57rem;
                line-height:1.55;
                text-align:center;
            }

            .bs-respawn{
                position:absolute;
                inset:0;
                z-index:20;
                display:flex;
                align-items:center;
                justify-content:center;
                background:rgba(90,0,0,.08);
                pointer-events:none;
            }

            .bs-respawn.hidden{display:none}

            .bs-respawn-box{
                padding:11px 16px;
                background:rgba(8,10,13,.72);
                color:#e2e6e9;
                font-size:.69rem;
                font-weight:1000;
                text-align:center;
            }

            .bs-end-title{
                color:#f2f4f5;
                font-size:2rem;
                font-weight:1000;
                text-transform:uppercase;
            }

            .bs-end-winner{
                margin:5px 0 15px;
                color:#57abea;
                font-weight:900;
            }

            .bs-end-stats{
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:7px;
                margin-bottom:15px;
            }

            .bs-end-stat{
                padding:10px 7px;
                background:#151b20;
                border:1px solid rgba(255,255,255,.07);
                text-align:center;
            }

            .bs-end-stat span{
                display:block;
                color:#76838d;
                font-size:.52rem;
                font-weight:900;
                text-transform:uppercase;
            }

            .bs-end-stat b{
                display:block;
                margin-top:3px;
                font-size:1rem;
                color:#dbe2e6;
            }

            @media(max-width:760px){
                .bs-leaderboard{width:150px}
                .bs-feed{display:none}
                .bs-classes{grid-template-columns:1fr 1fr}
                .bs-options{grid-template-columns:1fr}
                .bs-health{width:180px;left:8px;bottom:8px}
                .bs-ammo{right:8px;bottom:8px}
                .bs-end-stats{grid-template-columns:1fr 1fr}
            }
        `;

        const root = document.createElement('div');
        root.className = 'bs-game';

        root.innerHTML = `
            <canvas class="bs-canvas"></canvas>

            <div class="bs-ui">
                <div class="bs-top">
                    <div class="bs-timer">4:00</div>
                    <div class="bs-mode">FREE FOR ALL · FIRST TO ${CONFIG.scoreLimit}</div>
                </div>

                <div class="bs-leaderboard">
                    <div class="bs-lb-title">Leaderboard</div>
                    <div class="bs-lb-list"></div>
                </div>

                <div class="bs-feed"></div>
                <div class="bs-medals"></div>

                <div class="bs-health">
                    <div class="bs-health-num">100</div>
                    <div class="bs-health-track"><div class="bs-health-fill"></div></div>
                    <div class="bs-scoreline">0 KILLS · 0 DEATHS · 0 SCORE</div>
                </div>

                <div class="bs-ammo">
                    <div class="bs-weapon">AR-26</div>
                    <div class="bs-ammo-main">30 <small>/ 120</small></div>
                    <div class="bs-reload"></div>
                </div>

                <div class="bs-crosshair">
                    <i class="l"></i><i class="r"></i><i class="t"></i><i class="b"></i>
                </div>

                <div class="bs-hit"></div>
                <div class="bs-click">CLICK TO LOCK MOUSE</div>
            </div>

            <div class="bs-respawn hidden">
                <div class="bs-respawn-box">
                    ELIMINATED<br>
                    <span class="bs-respawn-time">Respawning...</span>
                </div>
            </div>

            <div class="bs-overlay bs-menu">
                <div class="bs-card">
                    <div class="bs-logo"><span>BLOCK</span> STRIKE</div>
                    <div class="bs-sub">
                        Fast low-poly arena FPS: mouse-look, slide-hopping, quick respawns,
                        four classes and AI opponents fighting everyone.
                    </div>

                    <div class="bs-section-title">Choose Class</div>

                    <div class="bs-classes">
                        ${CLASSES.map((c,index)=>`
                            <button class="bs-class ${index===0?'selected':''}" type="button" data-class="${c.id}">
                                <div class="bs-class-name">${c.name}</div>
                                <div class="bs-class-gun">${WEAPONS[c.weapon].name}</div>
                                <div class="bs-class-desc">${c.blurb}</div>
                            </button>
                        `).join('')}
                    </div>

                    <div class="bs-options">
                        <div class="bs-option">
                            <div class="bs-option-label">Map</div>
                            <div class="bs-segment">
                                ${Object.values(MAPS).map((m,index)=>`
                                    <button class="bs-seg ${index===0?'selected':''}" type="button" data-map="${m.id}">
                                        ${m.name}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div class="bs-option">
                            <div class="bs-option-label">Bot Difficulty</div>
                            <div class="bs-segment">
                                ${Object.entries(DIFFICULTIES).map(([key,d])=>`
                                    <button class="bs-seg ${key==='normal'?'selected':''}" type="button" data-diff="${key}">
                                        ${d.label}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <button class="bs-play" type="button">PLAY FFA</button>

                    <div class="bs-controls">
                        WASD = move · Mouse = aim · LMB = fire · RMB = ADS · R = reload ·
                        SPACE = jump · SHIFT / CTRL = slide · 1/2/3 = primary / pistol / knife
                    </div>
                </div>
            </div>

            <div class="bs-overlay bs-end hidden">
                <div class="bs-card">
                    <div class="bs-end-title">Match Complete</div>
                    <div class="bs-end-winner">Winner</div>

                    <div class="bs-end-stats">
                        <div class="bs-end-stat"><span>Kills</span><b class="bs-end-kills">0</b></div>
                        <div class="bs-end-stat"><span>Deaths</span><b class="bs-end-deaths">0</b></div>
                        <div class="bs-end-stat"><span>Score</span><b class="bs-end-score">0</b></div>
                        <div class="bs-end-stat"><span>Accuracy</span><b class="bs-end-acc">0%</b></div>
                    </div>

                    <button class="bs-play bs-restart" type="button">PLAY AGAIN</button>
                </div>
            </div>
        `;

        container.append(style,root);

        const canvas = root.querySelector('.bs-canvas');
        const ctx = canvas.getContext('2d');

        const timerEl = root.querySelector('.bs-timer');
        const lbEl = root.querySelector('.bs-lb-list');

        const healthNum = root.querySelector('.bs-health-num');
        const healthFill = root.querySelector('.bs-health-fill');
        const scoreline = root.querySelector('.bs-scoreline');

        const weaponEl = root.querySelector('.bs-weapon');
        const ammoEl = root.querySelector('.bs-ammo-main');
        const reloadEl = root.querySelector('.bs-reload');

        const feedEl = root.querySelector('.bs-feed');
        const medalsEl = root.querySelector('.bs-medals');

        const crosshair = root.querySelector('.bs-crosshair');
        const hitEl = root.querySelector('.bs-hit');
        const clickEl = root.querySelector('.bs-click');

        const respawnOverlay = root.querySelector('.bs-respawn');
        const respawnTime = root.querySelector('.bs-respawn-time');

        const menu = root.querySelector('.bs-menu');
        const end = root.querySelector('.bs-end');

        const playBtn = root.querySelector('.bs-menu .bs-play');
        const restartBtn = root.querySelector('.bs-restart');

        const classButtons = [...root.querySelectorAll('[data-class]')];
        const mapButtons = [...root.querySelectorAll('[data-map]')];
        const diffButtons = [...root.querySelectorAll('[data-diff]')];

        const endWinner = root.querySelector('.bs-end-winner');
        const endKills = root.querySelector('.bs-end-kills');
        const endDeaths = root.querySelector('.bs-end-deaths');
        const endScore = root.querySelector('.bs-end-score');
        const endAcc = root.querySelector('.bs-end-acc');

        const rand = (min,max)=>min+Math.random()*(max-min);
        const rint = (min,max)=>Math.floor(rand(min,max+1));
        const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));

        const normAngle = angle => {
            while(angle>Math.PI) angle-=Math.PI*2;
            while(angle<-Math.PI) angle+=Math.PI*2;
            return angle;
        };

        const escapeHtml = value =>
            String(value)
                .replaceAll('&','&amp;')
                .replaceAll('<','&lt;')
                .replaceAll('>','&gt;')
                .replaceAll('"','&quot;')
                .replaceAll("'",'&#039;');

        const formatTime = seconds => {
            const s=Math.max(0,Math.ceil(seconds));
            return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
        };

        const ensureAudio = () => {
            if(muted) return null;

            try{
                if(!audio){
                    audio=new (window.AudioContext||window.webkitAudioContext)();
                }

                if(audio.state==='suspended') audio.resume();
                return audio;
            }catch{
                return null;
            }
        };

        const tone = (frequency,duration=.035,volume=.010,type='square') => {
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

        const createWeaponState = id => {
            const d=WEAPONS[id];

            return {
                id,
                mag:Number.isFinite(d.mag)?d.mag:999,
                reserve:Number.isFinite(d.reserve)?d.reserve:999,
                cooldown:0,
                reload:0
            };
        };

        const loadMap = preset => {
            selectedMap=preset;

            map=preset.rows.map(row=>row.split('').map(Number));
            mapH=map.length;
            mapW=map[0].length;
        };

        const tileAt = (x,y) => {
            const tx=Math.floor(x/CONFIG.tile);
            const ty=Math.floor(y/CONFIG.tile);

            if(tx<0||ty<0||tx>=mapW||ty>=mapH){
                return 1;
            }

            return map[ty][tx];
        };

        const collides = (x,y,r=CONFIG.playerRadius) => {
            const points=[
                [x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r],
                [x,y-r],[x,y+r],[x-r,y],[x+r,y]
            ];

            return points.some(([px,py])=>tileAt(px,py)!==0);
        };

        const randomSpawn = avoid => {
            const options=selectedMap.spawns.slice();

            for(let tries=0;tries<80;tries++){
                const s=options[rint(0,options.length-1)];

                const point={
                    x:s[0]*CONFIG.tile,
                    y:s[1]*CONFIG.tile
                };

                if(!avoid){
                    return point;
                }

                const d=Math.hypot(point.x-avoid.x,point.y-avoid.y);

                if(d>CONFIG.tile*4.2){
                    return point;
                }
            }

            const s=options[0];

            return {
                x:s[0]*CONFIG.tile,
                y:s[1]*CONFIG.tile
            };
        };

        const createPlayer = () => {
            const spawn=randomSpawn();

            const c=selectedClass;

            return {
                id:nextId++,
                name:'YOU',
                isPlayer:true,

                x:spawn.x,
                y:spawn.y,
                angle:rand(0,Math.PI*2),
                pitch:0,

                vx:0,
                vy:0,

                z:0,
                vz:0,
                grounded:true,
                slideTimer:0,
                bob:0,

                hp:c.hp,
                maxHp:c.hp,
                classId:c.id,
                speed:c.speed,

                alive:true,
                respawn:0,

                kills:0,
                deaths:0,
                score:0,

                shots:0,
                hits:0,

                weapons:[
                    createWeaponState(c.weapon),
                    createWeaponState('pistol'),
                    createWeaponState('knife')
                ],
                slot:0
            };
        };

        const createBot = index => {
            const spawn=randomSpawn(player);

            const classData=CLASSES[index%CLASSES.length];

            return {
                id:nextId++,
                name:BOT_NAMES[index%BOT_NAMES.length],
                isPlayer:false,

                x:spawn.x,
                y:spawn.y,
                angle:rand(0,Math.PI*2),
                pitch:0,

                vx:0,
                vy:0,

                hp:classData.hp,
                maxHp:classData.hp,
                classId:classData.id,
                speed:classData.speed,

                alive:true,
                respawn:0,

                kills:0,
                deaths:0,
                score:0,

                weapon:createWeaponState(classData.weapon),

                ai:{
                    think:rand(.05,.25),
                    target:null,
                    targetX:spawn.x,
                    targetY:spawn.y,
                    strafe:Math.random()<.5?-1:1,
                    strafeTime:rand(.5,1.6),
                    fireDelay:rand(.2,.9),
                    wander:rand(.6,2.1)
                }
            };
        };

        const playerWeapon = () =>
            player?.weapons[player.slot]??null;

        const weaponDef = state =>
            state?WEAPONS[state.id]:null;

        const canSee = (a,b) => {
            const dx=b.x-a.x;
            const dy=b.y-a.y;
            const dist=Math.hypot(dx,dy);
            const steps=Math.ceil(dist/24);

            for(let i=1;i<steps;i++){
                const t=i/steps;

                if(
                    tileAt(
                        a.x+dx*t,
                        a.y+dy*t
                    )!==0
                ){
                    return false;
                }
            }

            return true;
        };

        const castWallRay = angle => {
            const posX=player.x/CONFIG.tile;
            const posY=player.y/CONFIG.tile;

            const rayDirX=Math.cos(angle);
            const rayDirY=Math.sin(angle);

            let mapX=Math.floor(posX);
            let mapY=Math.floor(posY);

            const deltaDistX=Math.abs(1/(rayDirX||1e-8));
            const deltaDistY=Math.abs(1/(rayDirY||1e-8));

            let stepX;
            let stepY;
            let sideDistX;
            let sideDistY;

            if(rayDirX<0){
                stepX=-1;
                sideDistX=(posX-mapX)*deltaDistX;
            }else{
                stepX=1;
                sideDistX=(mapX+1-posX)*deltaDistX;
            }

            if(rayDirY<0){
                stepY=-1;
                sideDistY=(posY-mapY)*deltaDistY;
            }else{
                stepY=1;
                sideDistY=(mapY+1-posY)*deltaDistY;
            }

            let side=0;
            let cell=0;

            for(let i=0;i<120;i++){
                if(sideDistX<sideDistY){
                    sideDistX+=deltaDistX;
                    mapX+=stepX;
                    side=0;
                }else{
                    sideDistY+=deltaDistY;
                    mapY+=stepY;
                    side=1;
                }

                if(
                    mapX<0||mapY<0||
                    mapX>=mapW||mapY>=mapH
                ){
                    cell=1;
                    break;
                }

                cell=map[mapY][mapX];

                if(cell!==0) break;
            }

            const perpDist=
                side===0
                    ?(mapX-posX+(1-stepX)/2)/(rayDirX||1e-8)
                    :(mapY-posY+(1-stepY)/2)/(rayDirY||1e-8);

            const worldDist=
                Math.abs(perpDist)*CONFIG.tile;

            let wallX=
                side===0
                    ?posY+perpDist*rayDirY
                    :posX+perpDist*rayDirX;

            wallX-=Math.floor(wallX);

            return {
                dist:worldDist,
                side,
                cell,
                wallX
            };
        };

        const shootRay = (shooter,angle,spread,pitch=0,weaponId=null) => {
            const def=WEAPONS[weaponId??(shooter.isPlayer?playerWeapon().id:shooter.weapon.id)];

            const rayAngle=angle+rand(-spread,spread);

            const wall=shooter.isPlayer
                ?castWallRay(rayAngle)
                :castWallFrom(shooter.x,shooter.y,rayAngle);

            let best=null;
            let bestDist=wall.dist;

            const candidates=[player,...bots];

            for(const target of candidates){
                if(
                    !target||
                    !target.alive||
                    target.id===shooter.id
                ){
                    continue;
                }

                const dx=target.x-shooter.x;
                const dy=target.y-shooter.y;

                const dist=Math.hypot(dx,dy);

                if(dist>=bestDist||dist>def.range) continue;

                const angleTo=Math.atan2(dy,dx);
                const delta=Math.abs(normAngle(angleTo-rayAngle));

                const angularRadius=
                    Math.atan2(
                        CONFIG.playerRadius*1.15,
                        dist
                    );

                if(delta>angularRadius) continue;

                if(!canSee(shooter,target)) continue;

                let head=false;

                if(shooter.isPlayer){
                    // In the billboard projection, negative pitch aims upward.
                    // The upper ~30% of the target counts as a headshot.
                    const verticalAim=
                        pitch/
                        Math.max(
                            1,
                            1300/dist
                        );

                    head=
                        verticalAim<
                        -7 &&
                        verticalAim>
                        -80;
                }else{
                    head=
                        Math.random()<
                        (
                            difficultyKey==='hard'
                                ?.12
                                :difficultyKey==='normal'
                                    ?.055
                                    :.025
                        );
                }

                best={
                    target,
                    dist,
                    head
                };

                bestDist=dist;
            }

            return {
                hit:best,
                wallDist:wall.dist,
                wall
            };
        };

        const castWallFrom = (x,y,angle) => {
            const oldX=player.x;
            const oldY=player.y;

            player.x=x;
            player.y=y;

            const result=castWallRay(angle);

            player.x=oldX;
            player.y=oldY;

            return result;
        };

        const spawnParticles = (x,y,color,count=9) => {
            for(let i=0;i<count;i++){
                if(particles.length>=CONFIG.maxParticles) break;

                particles.push({
                    x,
                    y,
                    vx:rand(-50,50),
                    vy:rand(-50,50),
                    z:rand(10,55),
                    vz:rand(25,110),
                    life:rand(.18,.48),
                    maxLife:0,
                    color,
                    size:rand(1.5,4)
                });

                particles[particles.length-1].maxLife=
                    particles[particles.length-1].life;
            }
        };

        const awardMedal = text => {
            medals.unshift({
                text,
                life:1.5
            });

            if(medals.length>3){
                medals.length=3;
            }
        };

        const addFeed = (killer,victim,weapon,head=false) => {
            killFeed.unshift({
                text:`${killer}  ${head?'HEADSHOT · ':''}${weapon}  ${victim}`,
                life:4.2
            });

            if(killFeed.length>6){
                killFeed.length=6;
            }
        };

        const applyDamage = (target,amount,shooter,weaponId,head=false,dist=0) => {
            if(!target.alive) return;

            target.hp-=amount;

            if(target.isPlayer){
                damageFlash=.24;
                tone(68,.05,.014,'sawtooth');
            }

            if(shooter?.isPlayer){
                player.hits++;
                hitMarker=.13;

                if(head){
                    tone(920,.025,.008,'sine');
                }else{
                    tone(700,.018,.005,'square');
                }
            }

            if(target.hp<=0){
                killEntity(
                    target,
                    shooter,
                    weaponId,
                    head,
                    dist
                );
            }
        };

        const killEntity = (victim,killer,weaponId,head=false,dist=0) => {
            if(!victim.alive) return;

            victim.alive=false;
            victim.respawn=CONFIG.respawnDelay;
            victim.deaths++;

            spawnParticles(
                victim.x,
                victim.y,
                victim.isPlayer?'#ff5555':'#e7d0ab',
                18
            );

            if(killer&&killer.id!==victim.id){
                killer.kills++;
                killer.score+=100;

                if(head){
                    killer.score+=50;
                }

                if(dist>850){
                    killer.score+=25;
                }

                addFeed(
                    killer.name,
                    victim.name,
                    WEAPONS[weaponId]?.name??weaponId,
                    head
                );

                if(killer.isPlayer){
                    const now=matchTime;

                    if(lastPlayerKillAt-now<2.7){
                        streak++;
                    }else{
                        streak=1;
                    }

                    lastPlayerKillAt=now;

                    awardMedal(
                        head
                            ?'HEADSHOT +150'
                            :dist>850
                                ?'LONGSHOT +125'
                                :streak>=3
                                    ?`${streak}X MULTI KILL`
                                    :'ELIMINATION +100'
                    );

                    tone(520,.045,.010,'triangle');
                }
            }

            if(victim.isPlayer){
                player.deaths++;
                respawnOverlay.classList.remove('hidden');
            }
        };

        const beginReload = state => {
            const def=WEAPONS[state.id];

            if(
                def.melee||
                state.reload>0||
                state.mag>=def.mag||
                state.reserve<=0
            ){
                return;
            }

            state.reload=def.reload;

            if(playerWeapon()===state){
                tone(310,.035,.004,'square');
            }
        };

        const finishReload = state => {
            const def=WEAPONS[state.id];

            const need=def.mag-state.mag;
            const take=Math.min(need,state.reserve);

            state.mag+=take;
            state.reserve-=take;
        };

        const fireWeapon = shooter,state,botAimAngle=null) => {
            const def=WEAPONS[state.id];

            if(
                !shooter.alive||
                state.cooldown>0||
                state.reload>0
            ){
                return;
            }

            if(!def.melee&&state.mag<=0){
                if(shooter.isPlayer){
                    beginReload(state);
                }
                return;
            }

            if(
                shooter.isPlayer&&
                def.adsRequired&&
                !adsDown
            ){
                return;
            }

            state.cooldown=1/def.fireRate;

            if(!def.melee){
                state.mag--;
            }

            const speed=Math.hypot(shooter.vx||0,shooter.vy||0);

            let spread=def.spread;

            if(speed>85){
                spread+=def.moveSpread;
            }

            if(shooter.isPlayer&&adsDown){
                spread=def.adsSpread;
            }

            if(shooter.isPlayer&&shooter.z>2){
                spread*=1.35;
            }

            const baseAngle=
                botAimAngle??shooter.angle;

            const pitch=
                shooter.isPlayer
                    ?shooter.pitch
                    :0;

            const pellets=
                def.pellets||1;

            let anyHit=false;

            for(let i=0;i<pellets;i++){
                const result=
                    shootRay(
                        shooter,
                        baseAngle,
                        spread,
                        pitch,
                        state.id
                    );

                if(!result.hit) continue;

                anyHit=true;

                const falloff=
                    state.id==='shotgun'
                        ?clamp(
                            1-result.hit.dist/def.range*.55,
                            .35,
                            1
                        )
                        :clamp(
                            1-result.hit.dist/def.range*.18,
                            .72,
                            1
                        );

                const dmg=
                    (
                        result.hit.head
                            ?def.headDamage
                            :def.damage
                    )*
                    falloff;

                applyDamage(
                    result.hit.target,
                    dmg,
                    shooter,
                    state.id,
                    result.hit.head,
                    result.hit.dist
                );
            }

            if(shooter.isPlayer){
                player.shots++;

                recoil=Math.min(
                    2.5,
                    recoil+def.kick
                );

                crosshairBloom=Math.min(
                    22,
                    crosshairBloom+
                    8+
                    def.kick*5
                );

                muzzleFlash=.055;

                tone(
                    def.sound,
                    state.id==='sniper'
                        ?.08
                        :state.id==='shotgun'
                            ?.07
                            :.035,
                    state.id==='sniper'||state.id==='shotgun'
                        ?.018
                        :.010,
                    state.id==='smg'
                        ?'sawtooth'
                        :'square'
                );
            }

            if(!anyHit&&shooter.isPlayer&&def.melee){
                tone(220,.03,.004,'triangle');
            }
        };

        const tryMove = (entity,nx,ny) => {
            if(!collides(nx,entity.y)){
                entity.x=nx;
            }else{
                entity.vx*=.15;
            }

            if(!collides(entity.x,ny)){
                entity.y=ny;
            }else{
                entity.vy*=.15;
            }
        };

        const updatePlayerMovement = delta => {
            if(!player.alive) return;

            const forwardX=Math.cos(player.angle);
            const forwardY=Math.sin(player.angle);
            const rightX=-forwardY;
            const rightY=forwardX;

            let ix=0;
            let iy=0;

            if(keys.has('KeyW')) iy+=1;
            if(keys.has('KeyS')) iy-=1;
            if(keys.has('KeyD')) ix+=1;
            if(keys.has('KeyA')) ix-=1;

            const len=Math.hypot(ix,iy)||1;

            ix/=len;
            iy/=len;

            const desiredX=
                forwardX*iy+
                rightX*ix;

            const desiredY=
                forwardY*iy+
                rightY*ix;

            let speed=
                CONFIG.moveSpeed*
                player.speed;

            if(player.slideTimer>0){
                speed*=CONFIG.slideBoost;
                player.slideTimer-=delta;
            }

            const accel=
                player.grounded
                    ?CONFIG.accel
                    :CONFIG.airAccel;

            if(ix!==0||iy!==0){
                player.vx +=
                    (
                        desiredX*speed-
                        player.vx
                    )*
                    Math.min(1,accel*delta);

                player.vy +=
                    (
                        desiredY*speed-
                        player.vy
                    )*
                    Math.min(1,accel*delta);
            }else if(player.grounded&&player.slideTimer<=0){
                player.vx *=
                    Math.max(
                        0,
                        1-CONFIG.friction*delta
                    );

                player.vy *=
                    Math.max(
                        0,
                        1-CONFIG.friction*delta
                    );
            }

            if(
                (
                    keys.has('ShiftLeft')||
                    keys.has('ControlLeft')
                )&&
                player.grounded&&
                player.slideTimer<=0&&
                Math.hypot(player.vx,player.vy)>=CONFIG.slideMinSpeed
            ){
                player.slideTimer=CONFIG.slideDuration;

                const current=Math.hypot(player.vx,player.vy)||1;

                player.vx=
                    player.vx/current*
                    speed*
                    CONFIG.slideBoost;

                player.vy=
                    player.vy/current*
                    speed*
                    CONFIG.slideBoost;

                tone(95,.025,.003,'triangle');
            }

            if(
                keys.has('Space')&&
                player.grounded
            ){
                player.grounded=false;
                player.vz=CONFIG.jumpVelocity;
                keys.delete('Space');

                tone(150,.025,.003,'sine');
            }

            if(!player.grounded){
                player.vz-=CONFIG.gravity*delta;
                player.z+=player.vz*delta;

                if(player.z<=0){
                    player.z=0;
                    player.vz=0;
                    player.grounded=true;
                }
            }

            tryMove(
                player,
                player.x+player.vx*delta,
                player.y+player.vy*delta
            );

            const moveAmount=
                Math.hypot(player.vx,player.vy);

            player.bob +=
                delta*
                moveAmount*
                .035;

            recoil*=Math.pow(.08,delta);
            crosshairBloom*=Math.pow(.04,delta);

            muzzleFlash=Math.max(0,muzzleFlash-delta);
            hitMarker=Math.max(0,hitMarker-delta);
            damageFlash=Math.max(0,damageFlash-delta);
        };

        const chooseBotTarget = bot => {
            const entities=[player,...bots];

            let best=null;
            let bestScore=-Infinity;

            for(const e of entities){
                if(
                    !e||
                    !e.alive||
                    e.id===bot.id
                ){
                    continue;
                }

                const d=Math.hypot(e.x-bot.x,e.y-bot.y);
                if(d>1450) continue;

                let score=-d;

                if(canSee(bot,e)){
                    score+=500;
                }

                if(e.hp<45){
                    score+=130;
                }

                if(score>bestScore){
                    bestScore=score;
                    best=e;
                }
            }

            return best;
        };

        const botWanderPoint = bot => {
            const angle=rand(0,Math.PI*2);
            const d=rand(180,520);

            const tx=clamp(
                bot.x+Math.cos(angle)*d,
                CONFIG.tile*1.5,
                (mapW-1.5)*CONFIG.tile
            );

            const ty=clamp(
                bot.y+Math.sin(angle)*d,
                CONFIG.tile*1.5,
                (mapH-1.5)*CONFIG.tile
            );

            if(tileAt(tx,ty)===0){
                bot.ai.targetX=tx;
                bot.ai.targetY=ty;
            }
        };

        const updateBot = (bot,delta) => {
            if(!bot.alive){
                bot.respawn-=delta;

                if(bot.respawn<=0){
                    respawnBot(bot);
                }

                return;
            }

            const ai=bot.ai;
            const diff=DIFFICULTIES[difficultyKey];

            ai.think-=delta;
            ai.strafeTime-=delta;
            ai.fireDelay-=delta;
            ai.wander-=delta;

            bot.weapon.cooldown=Math.max(0,bot.weapon.cooldown-delta);

            if(bot.weapon.reload>0){
                bot.weapon.reload-=delta;

                if(bot.weapon.reload<=0){
                    bot.weapon.reload=0;
                    finishReload(bot.weapon);
                }
            }

            if(ai.strafeTime<=0){
                ai.strafe*=-1;
                ai.strafeTime=rand(.45,1.35);
            }

            if(ai.think<=0){
                ai.think=
                    rand(
                        CONFIG.botThinkMin,
                        CONFIG.botThinkMax
                    )+
                    diff.reaction;

                ai.target=chooseBotTarget(bot);

                if(!ai.target&&ai.wander<=0){
                    ai.wander=rand(.7,2.2);
                    botWanderPoint(bot);
                }
            }

            let moveX=0;
            let moveY=0;
            let aimAngle=bot.angle;

            if(ai.target?.alive){
                const target=ai.target;

                const dx=target.x-bot.x;
                const dy=target.y-bot.y;
                const dist=Math.hypot(dx,dy);

                aimAngle=Math.atan2(dy,dx);

                const aimError=
                    rand(
                        -diff.aim,
                        diff.aim
                    )*
                    clamp(
                        dist/500,
                        .7,
                        2.0
                    );

                const desired=
                    aimAngle+
                    aimError;

                const turn=
                    normAngle(
                        desired-
                        bot.angle
                    );

                bot.angle +=
                    turn*
                    Math.min(
                        1,
                        delta*
                        (
                            6+
                            diff.aggression*4
                        )
                    );

                const ideal=
                    bot.weapon.id==='shotgun'
                        ?250
                        :bot.weapon.id==='smg'
                            ?420
                            :bot.weapon.id==='sniper'
                                ?820
                                :570;

                const forward=
                    dist>ideal
                        ?1
                        :dist<ideal*.55
                            ?-0.35
                            :0;

                const rightX=-Math.sin(bot.angle);
                const rightY=Math.cos(bot.angle);

                moveX=
                    Math.cos(bot.angle)*forward+
                    rightX*
                    ai.strafe*
                    .58*
                    diff.strafe;

                moveY=
                    Math.sin(bot.angle)*forward+
                    rightY*
                    ai.strafe*
                    .58*
                    diff.strafe;

                if(
                    canSee(bot,target)&&
                    ai.fireDelay<=0
                ){
                    const def=WEAPONS[bot.weapon.id];

                    if(bot.weapon.mag<=0){
                        beginReload(bot.weapon);
                    }else if(
                        bot.weapon.id!=='shotgun'||
                        dist<650
                    ){
                        fireWeapon(
                            bot,
                            bot.weapon,
                            bot.angle+
                            rand(
                                -diff.aim,
                                diff.aim
                            )
                        );

                        ai.fireDelay=
                            (
                                1/def.fireRate
                            )*
                            rand(
                                .92,
                                1.16
                            );
                    }
                }
            }else{
                const dx=ai.targetX-bot.x;
                const dy=ai.targetY-bot.y;

                if(Math.hypot(dx,dy)<55){
                    botWanderPoint(bot);
                }

                const desired=Math.atan2(dy,dx);
                const turn=normAngle(desired-bot.angle);

                bot.angle +=
                    turn*
                    Math.min(
                        1,
                        delta*4.5
                    );

                moveX=Math.cos(bot.angle);
                moveY=Math.sin(bot.angle);
            }

            const moveLen=Math.hypot(moveX,moveY)||1;
            moveX/=moveLen;
            moveY/=moveLen;

            const speed=
                CONFIG.moveSpeed*
                bot.speed*
                .78;

            bot.vx +=
                (
                    moveX*speed-
                    bot.vx
                )*
                Math.min(
                    1,
                    delta*5.5
                );

            bot.vy +=
                (
                    moveY*speed-
                    bot.vy
                )*
                Math.min(
                    1,
                    delta*5.5
                );

            const oldX=bot.x;
            const oldY=bot.y;

            tryMove(
                bot,
                bot.x+bot.vx*delta,
                bot.y+bot.vy*delta
            );

            if(
                Math.hypot(
                    bot.x-oldX,
                    bot.y-oldY
                )<
                .4&&
                Math.hypot(bot.vx,bot.vy)>80
            ){
                bot.angle+=rand(-1.1,1.1);
                botWanderPoint(bot);
            }
        };

        const respawnBot = bot => {
            const s=randomSpawn(player);

            const c=
                CLASSES.find(x=>x.id===bot.classId)||
                CLASSES[0];

            bot.x=s.x;
            bot.y=s.y;
            bot.angle=rand(0,Math.PI*2);

            bot.vx=0;
            bot.vy=0;

            bot.hp=c.hp;
            bot.maxHp=c.hp;
            bot.alive=true;

            bot.weapon=createWeaponState(c.weapon);

            bot.ai.target=null;
            bot.ai.fireDelay=rand(.25,.75);
            botWanderPoint(bot);
        };

        const respawnPlayer = () => {
            const s=randomSpawn();

            player.x=s.x;
            player.y=s.y;
            player.angle=rand(0,Math.PI*2);
            player.pitch=0;

            player.vx=0;
            player.vy=0;
            player.z=0;
            player.vz=0;

            player.hp=player.maxHp;
            player.alive=true;
            player.respawn=0;

            player.weapons=[
                createWeaponState(selectedClass.weapon),
                createWeaponState('pistol'),
                createWeaponState('knife')
            ];

            player.slot=0;

            respawnOverlay.classList.add('hidden');
        };

        const updatePlayerWeapons = delta => {
            if(!player) return;

            for(const state of player.weapons){
                state.cooldown=Math.max(0,state.cooldown-delta);

                if(state.reload>0){
                    state.reload-=delta;

                    if(state.reload<=0){
                        state.reload=0;
                        finishReload(state);
                    }
                }
            }

            if(!player.alive){
                player.respawn-=delta;

                respawnTime.textContent=
                    `Respawning in ${Math.max(0,player.respawn).toFixed(1)}s`;

                if(player.respawn<=0){
                    respawnPlayer();
                }

                return;
            }

            const state=playerWeapon();
            const def=weaponDef(state);

            if(
                mouseDown&&
                (
                    def.automatic||
                    !fireLatch
                )
            ){
                fireWeapon(
                    player,
                    state
                );

                fireLatch=true;
            }

            if(!mouseDown){
                fireLatch=false;
            }
        };

        const updateParticles = delta => {
            for(let i=particles.length-1;i>=0;i--){
                const p=particles[i];

                p.life-=delta;
                p.x+=p.vx*delta;
                p.y+=p.vy*delta;
                p.z+=p.vz*delta;
                p.vz-=360*delta;

                if(p.life<=0){
                    particles.splice(i,1);
                }
            }

            let feedChanged=false;

            for(let i=killFeed.length-1;i>=0;i--){
                killFeed[i].life-=delta;

                if(killFeed[i].life<=0){
                    killFeed.splice(i,1);
                    feedChanged=true;
                }
            }

            for(let i=medals.length-1;i>=0;i--){
                medals[i].life-=delta;

                if(medals[i].life<=0){
                    medals.splice(i,1);
                }
            }

            if(feedChanged){
                renderFeed();
            }
        };

        const renderFeed = () => {
            feedEl.innerHTML=
                killFeed
                    .map(item=>`
                        <div class="bs-feed-item">${escapeHtml(item.text)}</div>
                    `)
                    .join('');
        };

        const updateHud = () => {
            timerEl.textContent=formatTime(matchTime);

            const ranked=[player,...bots]
                .filter(Boolean)
                .slice()
                .sort((a,b)=>b.kills-a.kills||b.score-a.score)
                .slice(0,CONFIG.leaderboardSize);

            lbEl.innerHTML=
                ranked
                    .map((e,index)=>`
                        <div class="bs-lb-row ${e.isPlayer?'you':''}">
                            <span class="bs-lb-rank">${index+1}.</span>
                            <span class="bs-lb-name">${escapeHtml(e.name)}</span>
                            <span class="bs-lb-score">${e.kills}</span>
                        </div>
                    `)
                    .join('');

            if(!player) return;

            healthNum.textContent=
                Math.max(
                    0,
                    Math.ceil(player.hp)
                );

            healthFill.style.width=
                `${clamp(player.hp/player.maxHp*100,0,100)}%`;

            healthFill.style.background=
                player.hp>60
                    ?'#55df72'
                    :player.hp>30
                        ?'#f3c957'
                        :'#ef5a60';

            scoreline.textContent=
                `${player.kills} KILLS · ${player.deaths} DEATHS · ${player.score} SCORE`;

            const state=playerWeapon();
            const def=weaponDef(state);

            weaponEl.textContent=def.name;

            ammoEl.innerHTML=
                def.melee
                    ?'∞'
                    :`${state.mag} <small>/ ${state.reserve}</small>`;

            reloadEl.textContent=
                state.reload>0
                    ?`RELOADING ${state.reload.toFixed(1)}`
                    :state.mag<=0&&state.reserve>0
                        ?'PRESS R TO RELOAD'
                        :'';

            medalsEl.innerHTML=
                medals
                    .map(m=>`
                        <div class="bs-medal">${escapeHtml(m.text)}</div>
                    `)
                    .join('');

            hitEl.style.opacity=
                hitMarker>0
                    ?'1'
                    :'0';

            const spread=
                6+
                crosshairBloom+
                Math.hypot(player.vx,player.vy)*.012;

            const [l,r,t,b]=[
                root.querySelector('.bs-crosshair .l'),
                root.querySelector('.bs-crosshair .r'),
                root.querySelector('.bs-crosshair .t'),
                root.querySelector('.bs-crosshair .b')
            ];

            l.style.left=`${-spread-8}px`;
            r.style.left=`${spread}px`;
            t.style.top=`${-spread-8}px`;
            b.style.top=`${spread}px`;

            crosshair.style.opacity=
                adsDown&&def.id==='sniper'
                    ?'0'
                    :'1';

            clickEl.style.display=
                running&&
                document.pointerLockElement!==canvas
                    ?'block'
                    :'none';
        };

        const wallPalette = cell => {
            if(cell===2) return ['#2d6fa3','#3f87bc'];
            if(cell===3) return ['#9d653f','#b9794b'];
            if(cell===4) return ['#7d8790','#99a3ac'];
            if(cell===5) return ['#814256','#a0526c'];
            return ['#70777d','#899096'];
        };

        const renderWorld = () => {
            const ads=
                adsDown&&
                player?.alive;

            const state=playerWeapon();
            const def=weaponDef(state);

            const fov=
                ads
                    ?CONFIG.adsFov
                    :CONFIG.fov;

            const horizon=
                height*.50+
                player.pitch+
                (
                    Math.sin(player.bob)*
                    Math.min(
                        7,
                        Math.hypot(player.vx,player.vy)*.018
                    )
                )+
                (
                    player.slideTimer>0
                        ?34
                        :0
                )+
                recoil*10-
                player.z*.18;

            const sky=
                ctx.createLinearGradient(
                    0,
                    0,
                    0,
                    horizon
                );

            sky.addColorStop(0,'#7fa4c2');
            sky.addColorStop(1,'#b7c6d1');

            ctx.fillStyle=sky;
            ctx.fillRect(0,0,width,Math.max(0,horizon));

            const floor=
                ctx.createLinearGradient(
                    0,
                    horizon,
                    0,
                    height
                );

            floor.addColorStop(0,'#777f83');
            floor.addColorStop(.55,'#5e666a');
            floor.addColorStop(1,'#454c50');

            ctx.fillStyle=floor;
            ctx.fillRect(
                0,
                Math.max(0,horizon),
                width,
                height-horizon
            );

            // Simple low-poly horizon strips.
            ctx.strokeStyle='rgba(255,255,255,.035)';
            ctx.lineWidth=1;

            for(let y=horizon+30;y<height;y+=40){
                ctx.beginPath();
                ctx.moveTo(0,y);
                ctx.lineTo(width,y);
                ctx.stroke();
            }

            depthBuffer=
                new Array(
                    Math.ceil(width/CONFIG.rayStepPx)
                );

            for(let x=0,ci=0;x<width;x+=CONFIG.rayStepPx,ci++){
                const cameraX=
                    2*x/width-1;

                const rayAngle=
                    player.angle+
                    Math.atan(
                        cameraX*
                        Math.tan(fov/2)
                    );

                const ray=castWallRay(rayAngle);

                const corrected=
                    ray.dist*
                    Math.cos(rayAngle-player.angle);

                depthBuffer[ci]=corrected;

                const wallH=
                    clamp(
                        CONFIG.tile/
                        Math.max(1,corrected)*
                        height*
                        .92,
                        1,
                        height*2.2
                    );

                const top=horizon-wallH/2;

                const palette=wallPalette(ray.cell);

                let shade=
                    ray.side===1
                        ?.78
                        :1;

                shade*=clamp(
                    1-corrected/3000*.38,
                    .56,
                    1
                );

                const stripe=
                    Math.floor(ray.wallX*8)%2;

                ctx.fillStyle=
                    shadeHex(
                        palette[stripe],
                        shade
                    );

                ctx.fillRect(
                    x,
                    top,
                    CONFIG.rayStepPx+1,
                    wallH
                );

                if(
                    Math.floor(ray.wallX*12)%6===0
                ){
                    ctx.fillStyle='rgba(255,255,255,.035)';

                    ctx.fillRect(
                        x,
                        top,
                        1,
                        wallH
                    );
                }
            }

            renderBots(horizon,fov);
            renderParticles(horizon,fov);
            renderWeaponView(def);

            if(
                ads&&
                def.id==='sniper'
            ){
                renderScope();
            }

            if(damageFlash>0){
                ctx.fillStyle=
                    `rgba(190,0,0,${damageFlash*.52})`;

                ctx.fillRect(0,0,width,height);
            }
        };

        const shadeHex = (hex,mult) => {
            const raw=parseInt(hex.slice(1),16);

            const r=clamp(Math.round((raw>>16)*mult),0,255);
            const g=clamp(Math.round(((raw>>8)&255)*mult),0,255);
            const b=clamp(Math.round((raw&255)*mult),0,255);

            return `rgb(${r},${g},${b})`;
        };

        const projectEntity = (x,y,horizon,fov) => {
            const dx=x-player.x;
            const dy=y-player.y;

            const dist=Math.hypot(dx,dy);
            const angleTo=Math.atan2(dy,dx);

            const rel=normAngle(angleTo-player.angle);

            if(
                Math.abs(rel)>
                fov*.65
            ){
                return null;
            }

            const screenX=
                width/2+
                Math.tan(rel)/
                Math.tan(fov/2)*
                width/2;

            const corrected=
                dist*
                Math.cos(rel);

            const scale=
                height/
                Math.max(1,corrected);

            return {
                x:screenX,
                dist:corrected,
                scale
            };
        };

        const renderBots = (horizon,fov) => {
            const visible=bots
                .filter(b=>b.alive)
                .map(bot=>({
                    bot,
                    p:projectEntity(
                        bot.x,
                        bot.y,
                        horizon,
                        fov
                    )
                }))
                .filter(item=>item.p)
                .sort((a,b)=>b.p.dist-a.p.dist);

            for(const {bot,p} of visible){
                const col=
                    clamp(
                        Math.floor(
                            p.x/
                            CONFIG.rayStepPx
                        ),
                        0,
                        depthBuffer.length-1
                    );

                if(
                    depthBuffer[col]<
                    p.dist-
                    CONFIG.playerRadius
                ){
                    continue;
                }

                const bodyH=
                    clamp(
                        150*p.scale,
                        10,
                        height*1.3
                    );

                const bodyW=
                    bodyH*.36;

                const feet=
                    horizon+
                    bodyH*.47;

                const headSize=
                    bodyW*.70;

                const headY=
                    feet-
                    bodyH;

                const classData=
                    CLASSES.find(c=>c.id===bot.classId)||
                    CLASSES[0];

                const accent=
                    WEAPONS[classData.weapon].color;

                ctx.save();

                ctx.fillStyle='rgba(0,0,0,.18)';
                ctx.fillRect(
                    p.x-bodyW*.56,
                    feet-bodyH*.52,
                    bodyW*1.12,
                    bodyH*.58
                );

                // Legs.
                ctx.fillStyle='#31383e';

                ctx.fillRect(
                    p.x-bodyW*.44,
                    feet-bodyH*.32,
                    bodyW*.34,
                    bodyH*.32
                );

                ctx.fillRect(
                    p.x+bodyW*.10,
                    feet-bodyH*.32,
                    bodyW*.34,
                    bodyH*.32
                );

                // Torso.
                ctx.fillStyle=accent;

                ctx.fillRect(
                    p.x-bodyW*.50,
                    feet-bodyH*.78,
                    bodyW,
                    bodyH*.48
                );

                ctx.fillStyle=shadeHex(accent,.72);

                ctx.fillRect(
                    p.x-bodyW*.50,
                    feet-bodyH*.62,
                    bodyW,
                    bodyH*.10
                );

                // Head.
                ctx.fillStyle='#dfbb91';

                ctx.fillRect(
                    p.x-headSize*.5,
                    headY,
                    headSize,
                    headSize
                );

                // Gun.
                ctx.fillStyle='#20262a';

                ctx.fillRect(
                    p.x+bodyW*.20,
                    feet-bodyH*.72,
                    bodyW*.72,
                    bodyH*.08
                );

                if(p.dist<750){
                    ctx.fillStyle='rgba(0,0,0,.52)';
                    ctx.fillRect(
                        p.x-bodyW*.55,
                        headY-13,
                        bodyW*1.1,
                        5
                    );

                    ctx.fillStyle='#ef5960';
                    ctx.fillRect(
                        p.x-bodyW*.55,
                        headY-13,
                        bodyW*1.1*
                        clamp(bot.hp/bot.maxHp,0,1),
                        5
                    );

                    ctx.fillStyle='#fff';
                    ctx.font=`800 ${clamp(bodyW*.22,7,11)}px Arial`;
                    ctx.textAlign='center';

                    ctx.fillText(
                        bot.name,
                        p.x,
                        headY-18
                    );
                }

                ctx.restore();
            }
        };

        const renderParticles = (horizon,fov) => {
            for(const p of particles){
                const proj=
                    projectEntity(
                        p.x,
                        p.y,
                        horizon,
                        fov
                    );

                if(!proj) continue;

                const col=
                    clamp(
                        Math.floor(
                            proj.x/
                            CONFIG.rayStepPx
                        ),
                        0,
                        depthBuffer.length-1
                    );

                if(depthBuffer[col]<proj.dist) continue;

                const y=
                    horizon-
                    p.z*
                    proj.scale;

                ctx.save();
                ctx.globalAlpha=
                    clamp(
                        p.life/p.maxLife,
                        0,
                        1
                    );

                ctx.fillStyle=p.color;

                ctx.fillRect(
                    proj.x,
                    y,
                    Math.max(1,p.size*proj.scale*.45),
                    Math.max(1,p.size*proj.scale*.45)
                );

                ctx.restore();
            }
        };

        const renderWeaponView = def => {
            if(!player.alive) return;

            const ads=
                adsDown;

            const speed=
                Math.hypot(player.vx,player.vy);

            const swayX=
                Math.sin(player.bob*.5)*
                Math.min(
                    12,
                    speed*.03
                );

            const swayY=
                Math.abs(
                    Math.cos(player.bob)
                )*
                Math.min(
                    8,
                    speed*.02
                );

            const recoilY=
                recoil*
                18;

            let cx=
                width*
                (
                    ads
                        ?.50
                        :.64
                )+
                swayX;

            let cy=
                height+
                swayY+
                recoilY;

            ctx.save();

            if(def.id==='knife'){
                ctx.translate(cx,cy);

                ctx.rotate(-.35-recoil*.15);

                ctx.fillStyle='#d5d9dc';

                ctx.beginPath();
                ctx.moveTo(-10,-155);
                ctx.lineTo(17,-62);
                ctx.lineTo(0,-40);
                ctx.lineTo(-20,-132);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle='#272b2e';
                ctx.fillRect(-14,-58,26,75);

                ctx.restore();
                return;
            }

            const scale=
                ads
                    ?.90
                    :1.0;

            ctx.translate(cx,cy);
            ctx.scale(scale,scale);

            const body=
                def.id==='sniper'
                    ?170
                    :def.id==='shotgun'
                        ?145
                        :def.id==='smg'
                            ?112
                            :def.id==='pistol'
                                ?78
                                :132;

            ctx.fillStyle='#1d2429';

            ctx.fillRect(
                -body*.48,
                -78,
                body,
                78
            );

            ctx.fillStyle=def.color;

            ctx.fillRect(
                -body*.36,
                -85,
                body*.58,
                24
            );

            ctx.fillStyle='#101519';

            ctx.fillRect(
                body*.16,
                -78,
                body*.44,
                13
            );

            if(def.id==='ar'||def.id==='smg'){
                ctx.fillStyle='#2a3136';

                ctx.beginPath();
                ctx.moveTo(-12,-55);
                ctx.lineTo(8,-55);
                ctx.lineTo(18,-8);
                ctx.lineTo(-5,-8);
                ctx.closePath();
                ctx.fill();
            }

            if(def.id==='shotgun'){
                ctx.fillStyle='#7a5239';

                ctx.fillRect(
                    -15,
                    -84,
                    65,
                    18
                );
            }

            if(def.id==='sniper'){
                ctx.fillStyle='#0d1114';

                ctx.fillRect(
                    -35,
                    -115,
                    92,
                    19
                );

                ctx.fillStyle='#151a1d';

                ctx.beginPath();
                ctx.arc(12,-106,16,0,Math.PI*2);
                ctx.fill();
            }

            if(muzzleFlash>0&&!def.melee){
                ctx.fillStyle=
                    `rgba(255,210,95,${clamp(muzzleFlash/.055,0,1)})`;

                ctx.beginPath();
                ctx.moveTo(body*.59,-73);
                ctx.lineTo(body*.88,-93);
                ctx.lineTo(body*.78,-68);
                ctx.lineTo(body*.92,-50);
                ctx.lineTo(body*.58,-59);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        };

        const renderScope = () => {
            const radius=
                Math.min(
                    width,
                    height
                )*
                .43;

            ctx.save();

            ctx.fillStyle='rgba(0,0,0,.93)';

            ctx.beginPath();
            ctx.rect(0,0,width,height);
            ctx.arc(
                width/2,
                height/2,
                radius,
                0,
                Math.PI*2,
                true
            );

            ctx.fill('evenodd');

            ctx.strokeStyle='#111';
            ctx.lineWidth=5;

            ctx.beginPath();
            ctx.arc(
                width/2,
                height/2,
                radius,
                0,
                Math.PI*2
            );
            ctx.stroke();

            ctx.strokeStyle='rgba(0,0,0,.85)';
            ctx.lineWidth=1.5;

            ctx.beginPath();
            ctx.moveTo(width/2-radius,height/2);
            ctx.lineTo(width/2+radius,height/2);
            ctx.moveTo(width/2,height/2-radius);
            ctx.lineTo(width/2,height/2+radius);
            ctx.stroke();

            ctx.restore();
        };

        const update = delta => {
            if(!running||paused) return;

            matchTime-=delta;

            updatePlayerMovement(delta);
            updatePlayerWeapons(delta);

            for(const bot of bots){
                updateBot(bot,delta);
            }

            updateParticles(delta);

            const winner=[player,...bots]
                .filter(Boolean)
                .sort((a,b)=>b.kills-a.kills||b.score-a.score)[0];

            if(
                matchTime<=0||
                winner?.kills>=CONFIG.scoreLimit
            ){
                finishMatch();
            }

            updateHud();
        };

        const draw = () => {
            if(player){
                renderWorld();
            }else{
                ctx.fillStyle='#161d23';
                ctx.fillRect(0,0,width,height);
            }
        };

        const finishMatch = () => {
            if(ended) return;

            ended=true;
            running=false;

            if(document.pointerLockElement===canvas){
                document.exitPointerLock?.();
            }

            const winner=[player,...bots]
                .filter(Boolean)
                .sort((a,b)=>b.kills-a.kills||b.score-a.score)[0];

            endWinner.textContent=
                winner?.isPlayer
                    ?'YOU WIN'
                    :`${winner?.name??'BOT'} WINS`;

            endKills.textContent=player.kills;
            endDeaths.textContent=player.deaths;
            endScore.textContent=player.score;

            const accuracy=
                player.shots>0
                    ?player.hits/player.shots*100
                    :0;

            endAcc.textContent=
                `${accuracy.toFixed(0)}%`;

            services?.highscores?.saveHighscore?.(
                'block-strike',
                player.score
            );

            end.classList.remove('hidden');
        };

        const resetGame = () => {
            nextId=1;
            bots=[];
            particles=[];
            killFeed=[];
            medals=[];

            recoil=0;
            muzzleFlash=0;
            hitMarker=0;
            damageFlash=0;
            crosshairBloom=0;
            streak=0;
            lastPlayerKillAt=-99;

            matchTime=CONFIG.matchSeconds;

            loadMap(selectedMap);

            player=createPlayer();

            for(let i=0;i<CONFIG.botCount;i++){
                bots.push(createBot(i));
            }

            renderFeed();

            ended=false;
            paused=false;
            running=true;

            updateHud();
        };

        const startGame = () => {
            ensureAudio();

            menu.classList.add('hidden');
            end.classList.add('hidden');

            resetGame();

            canvas.requestPointerLock?.();
        };

        const resize = () => {
            const rect=root.getBoundingClientRect();

            width=Math.max(1,rect.width);
            height=Math.max(1,rect.height);
            dpr=Math.min(2,window.devicePixelRatio||1);

            canvas.width=Math.round(width*dpr);
            canvas.height=Math.round(height*dpr);

            canvas.style.width=`${width}px`;
            canvas.style.height=`${height}px`;

            ctx.setTransform(dpr,0,0,dpr,0,0);
        };

        const onMouseMove = event => {
            if(
                !running||
                !player?.alive||
                document.pointerLockElement!==canvas
            ){
                return;
            }

            const sens=
                CONFIG.mouseSensitivity*
                (
                    adsDown
                        ?.67
                        :1
                );

            player.angle +=
                event.movementX*
                sens;

            player.pitch=
                clamp(
                    player.pitch+
                    event.movementY*
                    .31,
                    -CONFIG.maxPitch,
                    CONFIG.maxPitch
                );
        };

        const onMouseDown = event => {
            if(!running) return;

            if(document.pointerLockElement!==canvas){
                canvas.requestPointerLock?.();
                return;
            }

            if(event.button===0){
                mouseDown=true;
                ensureAudio();
            }

            if(event.button===2){
                adsDown=true;
            }
        };

        const onMouseUp = event => {
            if(event.button===0){
                mouseDown=false;
                fireLatch=false;
            }

            if(event.button===2){
                adsDown=false;
            }
        };

        const onContextMenu = event => {
            event.preventDefault();
        };

        const onKeyDown = event => {
            if(
                ['Space','ArrowUp','ArrowDown'].includes(event.code)
            ){
                event.preventDefault();
            }

            keys.add(event.code);

            if(!player||!running) return;

            if(event.code==='KeyR'){
                beginReload(playerWeapon());
            }

            if(event.code==='Digit1'){
                player.slot=0;
                adsDown=false;
            }

            if(event.code==='Digit2'){
                player.slot=1;
                adsDown=false;
            }

            if(event.code==='Digit3'){
                player.slot=2;
                adsDown=false;
            }
        };

        const onKeyUp = event => {
            keys.delete(event.code);
        };

        const onPointerLock = () => {
            paused=
                running&&
                document.pointerLockElement!==canvas;

            clickEl.style.display=
                running&&
                document.pointerLockElement!==canvas
                    ?'block'
                    :'none';

            mouseDown=false;
            adsDown=false;
        };

        classButtons.forEach(button=>{
            button.addEventListener('click',()=>{
                const found=CLASSES.find(c=>c.id===button.dataset.class);

                if(found){
                    selectedClass=found;
                }

                classButtons.forEach(b=>
                    b.classList.toggle(
                        'selected',
                        b===button
                    )
                );
            });
        });

        mapButtons.forEach(button=>{
            button.addEventListener('click',()=>{
                selectedMap=
                    MAPS[button.dataset.map]||
                    MAPS.yard;

                mapButtons.forEach(b=>
                    b.classList.toggle(
                        'selected',
                        b===button
                    )
                );
            });
        });

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

        canvas.addEventListener('mousemove',onMouseMove);
        canvas.addEventListener('mousedown',onMouseDown);
        window.addEventListener('mouseup',onMouseUp);
        canvas.addEventListener('contextmenu',onContextMenu);

        window.addEventListener('keydown',onKeyDown);
        window.addEventListener('keyup',onKeyUp);

        document.addEventListener('pointerlockchange',onPointerLock);

        resizeObserver=new ResizeObserver(resize);
        resizeObserver.observe(root);

        resize();
        loadMap(selectedMap);

        const loop = timestamp => {
            if(destroyed) return;

            const delta=
                Math.min(
                    .033,
                    Math.max(
                        0,
                        (timestamp-lastFrame)/1000
                    )
                );

            lastFrame=timestamp;

            update(delta);
            draw();

            animationId=requestAnimationFrame(loop);
        };

        animationId=requestAnimationFrame(loop);

        return {
            destroy:()=>{
                destroyed=true;
                running=false;

                cancelAnimationFrame(animationId);
                resizeObserver?.disconnect();

                canvas.removeEventListener('mousemove',onMouseMove);
                canvas.removeEventListener('mousedown',onMouseDown);
                window.removeEventListener('mouseup',onMouseUp);
                canvas.removeEventListener('contextmenu',onContextMenu);

                window.removeEventListener('keydown',onKeyDown);
                window.removeEventListener('keyup',onKeyUp);

                document.removeEventListener('pointerlockchange',onPointerLock);

                if(document.pointerLockElement===canvas){
                    document.exitPointerLock?.();
                }

                try{
                    audio?.close?.();
                }catch{}

                style.remove();
            }
        };
    }
};

export {
    CONFIG,
    WEAPONS,
    CLASSES,
    DIFFICULTIES,
    MAPS
};
