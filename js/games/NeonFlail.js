const CONFIG = {
    worldSize: 5200,
    botCount: 34,
    foodTarget: 820,
    greenSentinelCount: 18,

    carRadius: 13,
    carLength: 31,
    carWidth: 17,

    maxCarSpeed: 188,
    botCarSpeed: 175,
    turnLerp: 8.5,
    stopMouseRadius: 58,

    tetherBase: 82,
    tetherPerRadius: 0.80,
    spring: 9.6,
    springDamping: 0.93,

    detachedDrag: 0.988,
    attractForce: 820,
    attachDistance: 34,
    launchBoost: 430,

    startFlailRadius: 9,
    flailRadiusScale: 0.305,
    maxFlailRadius: 86,

    pelletMassMin: 4,
    pelletMassMax: 10,

    deathDropMax: 230,

    arenaWidth: 1180,
    arenaHeight: 820,
    arenaDoor: 180,
    arenaWall: 38,

    blackHoleNeutral: 55,
    blackHoleFeeding: 25,
    blackHoleActive: 14.5,

    redFlailDuration: 36,

    minimapSize: 150,
    leaderboardSize: 10,

    cameraBaseZoom: 1.06,
    cameraMinZoom: 0.54,
    cameraLerp: 0.12
};

const COLORS = [
    '#39ff49','#ff3155','#00eaff','#ffcf2f','#d13cff',
    '#ff6b1f','#46a2ff','#f447d4','#9aff20','#6e62ff'
];

const BOT_NAMES = [
    'Takanu','Messi PC','Taca Taca','Yoga Thongs','Izzibaby','Gabriel','Chamal',
    'Troddynhuw','X','Stella','GrayByte','OmegaX','B0B_1','Aledo','Shaun',
    'Graysker','JGCzadeh','Mako','Orbit','Zero','Nova','Riot','Noodle','Puck',
    'Volt','Kilo','Cloud','Miso','Dash','Sable','Comet','Mango','Ruby','Fang',
    'Mint','Ghost','Ace','Viper','Pixel','Frost'
];

export default {
    manifest: {
        id: 'neon-flail',
        name: 'Neon Flail',
        description: 'Schwinge eine tödliche Energiekugel, sammle Masse und dominiere eine neonbeleuchtete Physics-Arena.',
        icon: '☄️',
        tags: ['Action', 'Arcade']
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
        let gameOver = false;
        let matchTime = 0;

        let nextId = 1;

        let player = null;
        let bots = [];
        let food = [];
        let greenSentinels = [];
        let redSentinels = [];
        let particles = [];
        let killFeed = [];

        let blackHole = null;
        let redPowerup = null;

        let playerName = 'Player';
        let selectedColor = COLORS[0];

        let muted = false;
        let audio = null;

        let mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            down: false
        };

        let keys = {
            action: false
        };

        let camera = {
            x: CONFIG.worldSize / 2,
            y: CONFIG.worldSize / 2,
            zoom: CONFIG.cameraBaseZoom,
            targetZoom: CONFIG.cameraBaseZoom
        };

        let kingId = null;
        let playerBest = 0;
        let playerKills = 0;

        const style = document.createElement('style');
        style.textContent = `
            .nf-game{
                position:relative;
                width:100%;
                height:100%;
                overflow:hidden;
                background:#030811;
                color:#d5f8ff;
                font-family:Arial,Helvetica,sans-serif;
                user-select:none;
            }

            .nf-game *{box-sizing:border-box}

            .nf-canvas{
                display:block;
                width:100%;
                height:100%;
                cursor:crosshair;
            }

            .nf-hud{
                position:absolute;
                inset:0;
                pointer-events:none;
                z-index:10;
            }

            .nf-board{
                position:absolute;
                right:12px;
                top:12px;
                width:225px;
                background:rgba(0,74,82,.72);
                border:1px solid rgba(0,247,255,.35);
                box-shadow:0 0 18px rgba(0,225,255,.12);
                backdrop-filter:blur(5px);
            }

            .nf-board-title{
                padding:5px 8px;
                background:rgba(0,178,185,.73);
                color:#baffff;
                text-align:center;
                font-size:.75rem;
                font-weight:1000;
                letter-spacing:.04em;
                text-transform:uppercase;
                text-shadow:0 0 8px rgba(100,255,255,.6);
            }

            .nf-board-list{
                padding:5px 7px 7px;
            }

            .nf-row{
                display:flex;
                align-items:center;
                gap:5px;
                padding:2px 0;
                color:#45d6d9;
                font-size:.67rem;
                font-weight:850;
            }

            .nf-row.you{
                color:#fff66b;
            }

            .nf-rank{width:20px}
            .nf-crown{width:13px;color:#ffe75c}
            .nf-name{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
            .nf-score{font-size:.62rem;color:#6de9eb}

            .nf-stats{
                position:absolute;
                left:12px;
                bottom:12px;
                display:flex;
                flex-direction:column;
                gap:5px;
            }

            .nf-stat,
            .nf-help{
                border:1px solid rgba(0,225,255,.18);
                background:rgba(3,12,24,.70);
                color:#7fc3d2;
                box-shadow:0 0 12px rgba(0,100,160,.08);
                backdrop-filter:blur(5px);
            }

            .nf-stat{
                width:max-content;
                min-width:145px;
                padding:7px 9px;
                font-size:.68rem;
                font-weight:900;
            }

            .nf-stat strong{color:#c9fbff}

            .nf-help{
                max-width:360px;
                padding:6px 9px;
                font-size:.58rem;
                line-height:1.4;
            }

            .nf-map{
                position:absolute;
                right:12px;
                bottom:12px;
                width:150px;
                height:150px;
                border:2px solid rgba(0,240,255,.72);
                background:#07111f;
                box-shadow:0 0 15px rgba(0,220,255,.14);
            }

            .nf-map canvas{
                width:100%;
                height:100%;
                display:block;
            }

            .nf-feed{
                position:absolute;
                right:12px;
                top:255px;
                width:260px;
                display:flex;
                flex-direction:column;
                gap:4px;
            }

            .nf-feed-item{
                padding:4px 7px;
                background:rgba(3,12,24,.66);
                border-left:2px solid #00dce5;
                color:#6cbec8;
                font-size:.58rem;
                animation:nfIn .18s ease-out;
            }

            @keyframes nfIn{
                from{opacity:0;transform:translateX(12px)}
                to{opacity:1;transform:translateX(0)}
            }

            .nf-redbar{
                position:absolute;
                left:50%;
                top:12px;
                transform:translateX(-50%);
                width:min(390px,46vw);
                display:none;
                text-align:center;
            }

            .nf-redbar.on{display:block}

            .nf-redlabel{
                color:#ff5d68;
                font-size:.58rem;
                font-weight:1000;
                letter-spacing:.12em;
                text-transform:uppercase;
                text-shadow:0 0 9px #ff263d;
            }

            .nf-redtrack{
                margin-top:3px;
                height:6px;
                background:#2d0d12;
                border:1px solid #ff3d4e66;
            }

            .nf-redfill{
                height:100%;
                width:100%;
                background:#ff3047;
                box-shadow:0 0 12px #ff3047;
            }

            .nf-top-buttons{
                position:absolute;
                left:12px;
                top:12px;
                display:flex;
                gap:6px;
                pointer-events:auto;
            }

            .nf-btn{
                padding:6px 8px;
                border:1px solid rgba(0,225,255,.20);
                background:rgba(3,12,24,.72);
                color:#75c2cf;
                font:inherit;
                font-size:.60rem;
                font-weight:900;
                cursor:pointer;
            }

            .nf-overlay{
                position:absolute;
                inset:0;
                z-index:30;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:24px;
                background:rgba(0,5,12,.82);
                backdrop-filter:blur(6px);
            }

            .nf-overlay.hidden{display:none}

            .nf-card{
                width:min(610px,100%);
                padding:28px 30px;
                border:1px solid rgba(0,235,255,.18);
                background:rgba(3,12,24,.94);
                box-shadow:0 0 60px rgba(0,174,255,.10);
                text-align:center;
            }

            .nf-logo{
                color:#67f6ff;
                font-size:clamp(2.6rem,7vw,4.8rem);
                font-weight:1000;
                letter-spacing:-.06em;
                text-shadow:
                    0 0 7px #00eaff,
                    0 0 24px rgba(0,234,255,.42);
            }

            .nf-sub{
                margin:7px auto 18px;
                max-width:500px;
                color:#7093aa;
                font-size:.77rem;
                line-height:1.5;
            }

            .nf-name-input{
                width:100%;
                padding:11px 12px;
                border:1px solid #116478;
                background:#071522;
                color:#e5fbff;
                outline:none;
                text-align:center;
                font:inherit;
                font-size:.91rem;
            }

            .nf-colors{
                display:flex;
                justify-content:center;
                flex-wrap:wrap;
                gap:8px;
                margin:14px 0 17px;
            }

            .nf-color{
                width:30px;
                height:30px;
                border:2px solid transparent;
                cursor:pointer;
                box-shadow:0 0 12px var(--c);
            }

            .nf-color.selected{
                border-color:#fff;
                transform:scale(1.12);
            }

            .nf-play{
                width:100%;
                height:45px;
                border:1px solid #00f4ff80;
                background:#008b93;
                color:#dbffff;
                font:inherit;
                font-size:.88rem;
                font-weight:1000;
                cursor:pointer;
                box-shadow:0 0 18px rgba(0,238,255,.16);
            }

            .nf-rules{
                display:grid;
                grid-template-columns:repeat(3,1fr);
                gap:8px;
                margin-top:15px;
            }

            .nf-rule{
                padding:9px 8px;
                border:1px solid #0a4051;
                background:#07131f;
                color:#648ca0;
                font-size:.61rem;
                line-height:1.4;
            }

            .nf-rule b{
                display:block;
                margin-bottom:2px;
                color:#a9eef5;
                font-size:.67rem;
            }

            .nf-end-title{
                color:#ff4d60;
                font-size:2rem;
                font-weight:1000;
                text-shadow:0 0 15px #ff243855;
            }

            .nf-end-sub{
                margin:6px 0 15px;
                color:#708ca0;
            }

            .nf-end-stats{
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:7px;
                margin-bottom:16px;
            }

            .nf-end-stat{
                padding:9px 6px;
                border:1px solid #0c4050;
                background:#07131f;
            }

            .nf-end-stat span{
                display:block;
                color:#688696;
                font-size:.53rem;
                font-weight:900;
                text-transform:uppercase;
            }

            .nf-end-stat b{
                display:block;
                margin-top:3px;
                color:#bff7fb;
                font-size:.93rem;
            }

            @media(max-width:760px){
                .nf-board{width:165px;right:7px;top:7px}
                .nf-row{font-size:.57rem}
                .nf-map{width:105px;height:105px;right:7px;bottom:7px}
                .nf-stats{left:7px;bottom:7px}
                .nf-help{display:none}
                .nf-feed{display:none}
                .nf-top-buttons{left:7px;top:7px}
                .nf-rules{grid-template-columns:1fr}
                .nf-end-stats{grid-template-columns:1fr 1fr}
            }
        `;

        const root = document.createElement('div');
        root.className = 'nf-game';

        root.innerHTML = `
            <canvas class="nf-canvas"></canvas>

            <div class="nf-hud">
                <div class="nf-top-buttons">
                    <button class="nf-btn nf-sound" type="button">Sound: An</button>
                </div>

                <div class="nf-board">
                    <div class="nf-board-title">Leaderboard</div>
                    <div class="nf-board-list"></div>
                </div>

                <div class="nf-feed"></div>

                <div class="nf-redbar">
                    <div class="nf-redlabel">RED FLAIL</div>
                    <div class="nf-redtrack"><div class="nf-redfill"></div></div>
                </div>

                <div class="nf-stats">
                    <div class="nf-stat">
                        Energy: <strong class="nf-energy">0</strong>
                        · Kills: <strong class="nf-kills">0</strong>
                    </div>
                    <div class="nf-help">
                        Maus = fahren · Klick/SPACE = Flail lösen · halten = zurückziehen.
                        Triff gegnerische Fahrzeuge mit deinem Flail. Größere Flails sind stärker, aber schwerer zu kontrollieren.
                    </div>
                </div>

                <div class="nf-map"><canvas></canvas></div>
            </div>

            <div class="nf-overlay nf-menu">
                <div class="nf-card">
                    <div class="nf-logo">NEON FLAIL</div>
                    <div class="nf-sub">
                        Sammle Energie, vergrößere deinen Flail und schleudere ihn mit echter Trägheit durch eine gefährliche Neon-Arena.
                    </div>

                    <input
                        class="nf-name-input"
                        maxlength="16"
                        value="Player"
                        autocomplete="off"
                        spellcheck="false"
                    >

                    <div class="nf-colors">
                        ${COLORS.map((color,index)=>`
                            <button
                                class="nf-color ${index===0?'selected':''}"
                                type="button"
                                data-color="${color}"
                                style="--c:${color};background:${color}"
                            ></button>
                        `).join('')}
                    </div>

                    <button class="nf-play" type="button">PLAY</button>

                    <div class="nf-rules">
                        <div class="nf-rule">
                            <b>Physics Flail</b>
                            Fahre Kurven, baue Schwung auf und löse den Flail für Fernangriffe.
                        </div>
                        <div class="nf-rule">
                            <b>Central Arena</b>
                            Black-Hole-Zyklus, Electrocuter, Sentinels und ein mächtiger Red-Flail-Powerup.
                        </div>
                        <div class="nf-rule">
                            <b>Become King</b>
                            Sammle Remains und steige im Leaderboard bis auf Platz 1.
                        </div>
                    </div>
                </div>
            </div>

            <div class="nf-overlay nf-end hidden">
                <div class="nf-card">
                    <div class="nf-end-title">DELETED</div>
                    <div class="nf-end-sub nf-death-reason">Your vehicle was destroyed.</div>

                    <div class="nf-end-stats">
                        <div class="nf-end-stat"><span>Best Energy</span><b class="nf-end-energy">0</b></div>
                        <div class="nf-end-stat"><span>Kills</span><b class="nf-end-kills">0</b></div>
                        <div class="nf-end-stat"><span>Time</span><b class="nf-end-time">0:00</b></div>
                        <div class="nf-end-stat"><span>Score</span><b class="nf-end-score">0</b></div>
                    </div>

                    <button class="nf-play nf-restart" type="button">PLAY AGAIN</button>
                </div>
            </div>
        `;

        container.append(style,root);

        const canvas = root.querySelector('.nf-canvas');
        const ctx = canvas.getContext('2d');

        const mini = root.querySelector('.nf-map canvas');
        const mctx = mini.getContext('2d');

        const boardList = root.querySelector('.nf-board-list');
        const feedEl = root.querySelector('.nf-feed');
        const energyEl = root.querySelector('.nf-energy');
        const killsEl = root.querySelector('.nf-kills');

        const redBar = root.querySelector('.nf-redbar');
        const redFill = root.querySelector('.nf-redfill');

        const soundBtn = root.querySelector('.nf-sound');

        const menu = root.querySelector('.nf-menu');
        const end = root.querySelector('.nf-end');
        const nameInput = root.querySelector('.nf-name-input');

        const playBtn = root.querySelector('.nf-menu .nf-play');
        const restartBtn = root.querySelector('.nf-restart');
        const colorButtons = [...root.querySelectorAll('.nf-color')];

        const deathReason = root.querySelector('.nf-death-reason');
        const endEnergy = root.querySelector('.nf-end-energy');
        const endKills = root.querySelector('.nf-end-kills');
        const endTime = root.querySelector('.nf-end-time');
        const endScore = root.querySelector('.nf-end-score');

        const rand = (min,max)=>min+Math.random()*(max-min);
        const rint = (min,max)=>Math.floor(rand(min,max+1));
        const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));

        const fmtTime = seconds => {
            const t=Math.max(0,Math.floor(seconds));
            return `${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;
        };

        const escapeHtml = value =>
            String(value)
                .replaceAll('&','&amp;')
                .replaceAll('<','&lt;')
                .replaceAll('>','&gt;')
                .replaceAll('"','&quot;')
                .replaceAll("'",'&#039;');

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

        const tone = (frequency,duration=.04,volume=.010,type='sine') => {
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

        const flailRadius = score =>
            clamp(
                CONFIG.startFlailRadius+
                Math.sqrt(Math.max(0,score))*
                CONFIG.flailRadiusScale,
                CONFIG.startFlailRadius,
                CONFIG.maxFlailRadius
            );

        const createFood = (x=null,y=null,mass=null,color=null) => ({
            id:nextId++,
            x:x??rand(30,CONFIG.worldSize-30),
            y:y??rand(30,CONFIG.worldSize-30),
            mass:mass??rand(CONFIG.pelletMassMin,CONFIG.pelletMassMax),
            radius:rand(2.5,4.8),
            color:color??COLORS[rint(0,COLORS.length-1)],
            pulse:rand(0,Math.PI*2)
        });

        const createOwner = (name,color,isPlayer=false) => {
            const p=safeSpawn();

            const angle=rand(0,Math.PI*2);
            const rearX=p.x-Math.cos(angle)*62;
            const rearY=p.y-Math.sin(angle)*62;

            const owner={
                id:nextId++,
                name,
                color,
                isPlayer,
                alive:true,

                x:p.x,
                y:p.y,
                vx:0,
                vy:0,
                angle,

                score:0,
                kills:0,

                flail:{
                    x:rearX,
                    y:rearY,
                    vx:0,
                    vy:0,
                    detached:false,
                    attracting:false,
                    score:0,
                    redTime:0,
                    shockCooldown:0
                },

                ai:isPlayer?null:{
                    think:rand(.08,.22),
                    goalX:rand(0,CONFIG.worldSize),
                    goalY:rand(0,CONFIG.worldSize),
                    mode:'food',
                    actionCooldown:rand(.4,1.6),
                    holdTime:0,
                    wander:rand(.8,2.5)
                }
            };

            return owner;
        };

        function safeSpawn(){
            for(let attempt=0;attempt<100;attempt++){
                const p={
                    x:rand(180,CONFIG.worldSize-180),
                    y:rand(180,CONFIG.worldSize-180)
                };

                if(
                    Math.abs(p.x-CONFIG.worldSize/2)<CONFIG.arenaWidth*.72 &&
                    Math.abs(p.y-CONFIG.worldSize/2)<CONFIG.arenaHeight*.72
                ){
                    continue;
                }

                let bad=false;

                for(const o of [player,...bots]){
                    if(!o?.alive) continue;

                    if(Math.hypot(o.x-p.x,o.y-p.y)<250){
                        bad=true;
                        break;
                    }
                }

                if(!bad) return p;
            }

            return {
                x:rand(150,CONFIG.worldSize-150),
                y:rand(150,CONFIG.worldSize-150)
            };
        }

        const arenaRect = () => ({
            x:CONFIG.worldSize/2-CONFIG.arenaWidth/2,
            y:CONFIG.worldSize/2-CONFIG.arenaHeight/2,
            w:CONFIG.arenaWidth,
            h:CONFIG.arenaHeight
        });

        const arenaWalls = () => {
            const a=arenaRect();
            const t=CONFIG.arenaWall;
            const door=CONFIG.arenaDoor;

            return [
                {x:a.x,y:a.y,w:a.w,h:t,kind:'wall'},
                {x:a.x,y:a.y+a.h-t,w:a.w,h:t,kind:'wall'},

                {x:a.x,y:a.y,w:t,h:(a.h-door)/2,kind:'wall'},
                {x:a.x,y:a.y+(a.h+door)/2,w:t,h:(a.h-door)/2,kind:'wall'},

                {x:a.x+a.w-t,y:a.y,w:t,h:(a.h-door)/2,kind:'wall'},
                {x:a.x+a.w-t,y:a.y+(a.h+door)/2,w:t,h:(a.h-door)/2,kind:'wall'}
            ];
        };

        const arenaFlailGates = () => {
            const a=arenaRect();
            const y=a.y+(a.h-CONFIG.arenaDoor)/2;

            return [
                {x:a.x-3,y,w:6,h:CONFIG.arenaDoor},
                {x:a.x+a.w-3,y,w:6,h:CONFIG.arenaDoor}
            ];
        };

        const sideCrossWalls = () => {
            const cx=CONFIG.worldSize/2;
            const cy=CONFIG.worldSize/2;
            const gap=CONFIG.arenaWidth/2+255;

            const makeCross=(x,y)=>[
                {x:x-130,y:y-24,w:260,h:48,kind:'wall'},
                {x:x-24,y:y-130,w:48,h:260,kind:'wall'}
            ];

            return [
                ...makeCross(cx-gap,cy),
                ...makeCross(cx+gap,cy)
            ];
        };

        const staticWalls = () => [
            ...arenaWalls(),
            ...sideCrossWalls()
        ];

        const greenBumpers = () => {
            const cx=CONFIG.worldSize/2;
            const cy=CONFIG.worldSize/2;
            const dx=CONFIG.arenaWidth/2+170;
            const dy=CONFIG.arenaHeight/2+170;

            return [
                {x:cx-dx,y:cy-dy,r:48,phase:0},
                {x:cx+dx,y:cy-dy,r:48,phase:1},
                {x:cx-dx,y:cy+dy,r:48,phase:2},
                {x:cx+dx,y:cy+dy,r:48,phase:3}
            ];
        };

        const electrocuters = () => {
            const a=arenaRect();
            const cx=CONFIG.worldSize/2;
            const cy=CONFIG.worldSize/2;

            return [
                {x:a.x+95,y:a.y+95,r:58},
                {x:a.x+a.w-95,y:a.y+95,r:58},
                {x:a.x+95,y:a.y+a.h-95,r:58},
                {x:a.x+a.w-95,y:a.y+a.h-95,r:58},

                {x:cx,y:a.y-125,r:72},
                {x:cx,y:a.y+a.h+125,r:72}
            ];
        };

        const pointInArena = (x,y) => {
            const a=arenaRect();

            return (
                x>a.x &&
                x<a.x+a.w &&
                y>a.y &&
                y<a.y+a.h
            );
        };

        const maintainFood = () => {
            while(food.length<CONFIG.foodTarget){
                food.push(createFood());
            }
        };

        const createGreenSentinel = () => ({
            id:nextId++,
            x:rand(80,CONFIG.worldSize-80),
            y:rand(80,CONFIG.worldSize-80),
            vx:rand(-45,45),
            vy:rand(-45,45),
            angle:rand(0,Math.PI*2),
            alive:true
        });

        const createRedSentinel = () => {
            const a=arenaRect();

            return {
                id:nextId++,
                x:rand(a.x+100,a.x+a.w-100),
                y:rand(a.y+100,a.y+a.h-100),
                vx:0,
                vy:0,
                angle:rand(0,Math.PI*2),
                alive:true
            };
        };

        const maintainSentinels = () => {
            while(greenSentinels.filter(s=>s.alive).length<CONFIG.greenSentinelCount){
                greenSentinels.push(createGreenSentinel());
            }

            if(redSentinels.filter(s=>s.alive).length<3){
                redSentinels.push(createRedSentinel());
            }
        };

        const updateBlackHolePhase = delta => {
            if(!blackHole){
                blackHole={
                    phase:'neutral',
                    timer:CONFIG.blackHoleNeutral,
                    total:CONFIG.blackHoleNeutral,
                    angle:0,
                    feedTimer:0
                };
            }

            blackHole.timer-=delta;
            blackHole.angle+=delta*(blackHole.phase==='active'?1.8:.5);

            if(blackHole.phase==='feeding'){
                blackHole.feedTimer-=delta;

                if(blackHole.feedTimer<=0){
                    blackHole.feedTimer=.13;

                    const a=rand(0,Math.PI*2);
                    const d=rand(80,230);

                    food.push(
                        createFood(
                            CONFIG.worldSize/2+Math.cos(a)*d,
                            CONFIG.worldSize/2+Math.sin(a)*d,
                            rand(5,11),
                            '#ffe930'
                        )
                    );
                }
            }

            if(blackHole.timer<=0){
                if(blackHole.phase==='neutral'){
                    blackHole.phase='feeding';
                    blackHole.timer=CONFIG.blackHoleFeeding;
                    blackHole.total=CONFIG.blackHoleFeeding;
                }else if(blackHole.phase==='feeding'){
                    blackHole.phase='active';
                    blackHole.timer=CONFIG.blackHoleActive;
                    blackHole.total=CONFIG.blackHoleActive;
                }else{
                    blackHole.phase='neutral';
                    blackHole.timer=CONFIG.blackHoleNeutral;
                    blackHole.total=CONFIG.blackHoleNeutral;

                    redPowerup={
                        x:CONFIG.worldSize/2,
                        y:CONFIG.worldSize/2,
                        alive:true,
                        pulse:0
                    };
                }
            }
        };

        const ownerList = () => {
            const result=[];

            if(player?.alive) result.push(player);

            for(const b of bots){
                if(b.alive) result.push(b);
            }

            return result;
        };

        const getKing = () =>
            ownerList()
                .slice()
                .sort((a,b)=>b.flail.score-a.flail.score)[0]??null;

        const screen = (x,y) => ({
            x:width/2+(x-camera.x)*camera.zoom,
            y:height/2+(y-camera.y)*camera.zoom
        });

        const normalize = (x,y) => {
            const d=Math.hypot(x,y);

            if(d<.0001) return {x:0,y:0,d:0};

            return {
                x:x/d,
                y:y/d,
                d
            };
        };

        const rectCircle = (x,y,r,rect) => {
            const nx=clamp(x,rect.x,rect.x+rect.w);
            const ny=clamp(y,rect.y,rect.y+rect.h);

            return Math.hypot(x-nx,y-ny)<r;
        };

        const resolveRectCollision = (obj,r,rect,bounce=.45) => {
            if(!rectCircle(obj.x,obj.y,r,rect)) return false;

            const left=Math.abs((obj.x+r)-rect.x);
            const right=Math.abs((obj.x-r)-(rect.x+rect.w));
            const top=Math.abs((obj.y+r)-rect.y);
            const bottom=Math.abs((obj.y-r)-(rect.y+rect.h));

            const min=Math.min(left,right,top,bottom);

            if(min===left){
                obj.x=rect.x-r;
                obj.vx=-Math.abs(obj.vx)*bounce;
            }else if(min===right){
                obj.x=rect.x+rect.w+r;
                obj.vx=Math.abs(obj.vx)*bounce;
            }else if(min===top){
                obj.y=rect.y-r;
                obj.vy=-Math.abs(obj.vy)*bounce;
            }else{
                obj.y=rect.y+rect.h+r;
                obj.vy=Math.abs(obj.vy)*bounce;
            }

            return true;
        };

        const updateFlail = (owner,delta) => {
            const f=owner.flail;
            const r=flailRadius(f.score);

            f.shockCooldown=Math.max(0,f.shockCooldown-delta);

            if(f.redTime>0){
                f.redTime=Math.max(0,f.redTime-delta);
            }

            const rearX=
                owner.x-
                Math.cos(owner.angle)*
                (CONFIG.carLength*.58);

            const rearY=
                owner.y-
                Math.sin(owner.angle)*
                (CONFIG.carLength*.58);

            const dx=rearX-f.x;
            const dy=rearY-f.y;
            const n=normalize(dx,dy);

            if(!f.detached){
                const targetLen=
                    CONFIG.tetherBase+
                    r*
                    CONFIG.tetherPerRadius;

                const stretch=
                    n.d-
                    targetLen;

                const springForce=
                    stretch*
                    CONFIG.spring;

                f.vx +=
                    n.x*
                    springForce*
                    delta;

                f.vy +=
                    n.y*
                    springForce*
                    delta;

                // Die Bewegung des Autos überträgt Trägheit auf den Flail.
                f.vx += owner.vx*.75*delta*8;
                f.vy += owner.vy*.75*delta*8;

                f.vx*=Math.pow(CONFIG.springDamping,delta*60);
                f.vy*=Math.pow(CONFIG.springDamping,delta*60);
            }else{
                f.vx*=Math.pow(CONFIG.detachedDrag,delta*60);
                f.vy*=Math.pow(CONFIG.detachedDrag,delta*60);

                if(f.attracting){
                    const attract=
                        CONFIG.attractForce/
                        Math.max(
                            1,
                            1+
                            r*.017
                        );

                    f.vx += n.x*attract*delta;
                    f.vy += n.y*attract*delta;

                    if(n.d<CONFIG.attachDistance+r*.35){
                        f.detached=false;
                        f.attracting=false;
                    }
                }
            }

            f.x+=f.vx*delta;
            f.y+=f.vy*delta;

            f.x=clamp(f.x,r,CONFIG.worldSize-r);
            f.y=clamp(f.y,r,CONFIG.worldSize-r);

            for(const wall of staticWalls()){
                resolveRectCollision(f,r,wall,.72);
            }

            if(pointInArena(owner.x,owner.y)){
                for(const gate of arenaFlailGates()){
                    resolveRectCollision(f,r,gate,.38);
                }
            }

            for(const bumper of greenBumpers()){
                const d=Math.hypot(f.x-bumper.x,f.y-bumper.y);

                if(d<r+bumper.r){
                    const nx=(f.x-bumper.x)/Math.max(1,d);
                    const ny=(f.y-bumper.y)/Math.max(1,d);

                    f.x=bumper.x+nx*(r+bumper.r);
                    f.y=bumper.y+ny*(r+bumper.r);

                    const dot=f.vx*nx+f.vy*ny;

                    if(dot<0){
                        f.vx-=2*dot*nx;
                        f.vy-=2*dot*ny;
                        f.vx*=.87;
                        f.vy*=.87;
                    }

                    if(Math.random()<.035){
                        for(let i=0;i<7;i++){
                            const a=rand(0,Math.PI*2);

                            food.push(
                                createFood(
                                    bumper.x+Math.cos(a)*rand(55,105),
                                    bumper.y+Math.sin(a)*rand(55,105),
                                    rand(4,9),
                                    '#4cff2b'
                                )
                            );
                        }
                    }
                }
            }
        };

        const launchFlail = owner => {
            const f=owner.flail;

            if(!owner.alive) return;

            if(!f.detached){
                f.detached=true;
                f.attracting=true;

                const dx=f.x-owner.x;
                const dy=f.y-owner.y;
                const n=normalize(dx,dy);

                f.vx += n.x*CONFIG.launchBoost;
                f.vy += n.y*CONFIG.launchBoost;

                if(owner.isPlayer){
                    tone(250,.035,.007,'triangle');
                }
            }else{
                f.attracting=true;
            }
        };

        const releaseAttract = owner => {
            if(owner?.flail){
                owner.flail.attracting=false;
            }
        };

        const moveOwner = (owner,targetX,targetY,delta,maxSpeed) => {
            if(!owner.alive) return;

            const dx=targetX-owner.x;
            const dy=targetY-owner.y;
            const dir=normalize(dx,dy);

            let speed=maxSpeed;

            if(owner.isPlayer){
                const screenDist=Math.hypot(mouse.x-width/2,mouse.y-height/2);

                speed*=clamp(
                    (screenDist-CONFIG.stopMouseRadius)/
                    115,
                    0,
                    1
                );
            }

            const desired=Math.atan2(dy,dx);
            let diff=desired-owner.angle;

            while(diff>Math.PI) diff-=Math.PI*2;
            while(diff<-Math.PI) diff+=Math.PI*2;

            owner.angle += diff*Math.min(1,CONFIG.turnLerp*delta);

            owner.vx +=
                (
                    Math.cos(owner.angle)*speed-
                    owner.vx
                )*
                Math.min(1,delta*6.2);

            owner.vy +=
                (
                    Math.sin(owner.angle)*speed-
                    owner.vy
                )*
                Math.min(1,delta*6.2);

            owner.x += owner.vx*delta;
            owner.y += owner.vy*delta;

            owner.x=clamp(owner.x,CONFIG.carRadius,CONFIG.worldSize-CONFIG.carRadius);
            owner.y=clamp(owner.y,CONFIG.carRadius,CONFIG.worldSize-CONFIG.carRadius);

            for(const wall of staticWalls()){
                resolveRectCollision(owner,CONFIG.carRadius,wall,.15);
            }
        };

        const findFoodTarget = owner => {
            let best=null;
            let bestScore=-Infinity;

            const samples=Math.min(120,food.length);

            for(let i=0;i<samples;i++){
                const p=food[rint(0,food.length-1)];
                if(!p) continue;

                const d=Math.hypot(owner.x-p.x,owner.y-p.y);
                if(d>900) continue;

                const score=p.mass*10-d*.035;

                if(score>bestScore){
                    bestScore=score;
                    best=p;
                }
            }

            return best;
        };

        const nearestDangerFlail = owner => {
            let best=null;
            let bd=Infinity;

            for(const other of ownerList()){
                if(other.id===owner.id) continue;

                const r=flailRadius(other.flail.score);
                const d=Math.hypot(owner.x-other.flail.x,owner.y-other.flail.y)-r;

                if(d<bd){
                    bd=d;
                    best={other,d};
                }
            }

            return best;
        };

        const nearestVictim = owner => {
            let best=null;
            let bd=Infinity;

            for(const other of ownerList()){
                if(other.id===owner.id) continue;

                const d=Math.hypot(owner.x-other.x,owner.y-other.y);

                if(d<bd){
                    bd=d;
                    best={other,d};
                }
            }

            return best;
        };

        const updateBot = (owner,delta) => {
            const ai=owner.ai;
            if(!ai||!owner.alive) return;

            ai.think-=delta;
            ai.actionCooldown-=delta;
            ai.wander-=delta;

            if(ai.holdTime>0){
                ai.holdTime-=delta;
                owner.flail.attracting=true;

                if(ai.holdTime<=0){
                    releaseAttract(owner);
                }
            }

            if(ai.think<=0){
                ai.think=rand(.09,.18);

                const danger=nearestDangerFlail(owner);
                const victim=nearestVictim(owner);
                const foodTarget=findFoodTarget(owner);

                if(danger&&danger.d<145){
                    ai.mode='evade';

                    const dx=owner.x-danger.other.flail.x;
                    const dy=owner.y-danger.other.flail.y;
                    const n=normalize(dx,dy);

                    ai.goalX=clamp(owner.x+n.x*650,50,CONFIG.worldSize-50);
                    ai.goalY=clamp(owner.y+n.y*650,50,CONFIG.worldSize-50);

                    if(owner.flail.detached){
                        owner.flail.attracting=true;
                        ai.holdTime=rand(.22,.55);
                    }
                }else if(victim&&victim.d<610&&Math.random()<.62){
                    ai.mode='hunt';

                    const target=victim.other;
                    const lead=.28;

                    ai.goalX=clamp(target.x+target.vx*lead,40,CONFIG.worldSize-40);
                    ai.goalY=clamp(target.y+target.vy*lead,40,CONFIG.worldSize-40);

                    const flailToVictim=
                        Math.hypot(
                            owner.flail.x-target.x,
                            owner.flail.y-target.y
                        );

                    if(
                        ai.actionCooldown<=0 &&
                        !owner.flail.detached &&
                        victim.d<360 &&
                        flailToVictim<440
                    ){
                        launchFlail(owner);
                        ai.holdTime=rand(.35,.85);
                        ai.actionCooldown=rand(1.5,3.2);
                    }else if(
                        ai.actionCooldown<=0 &&
                        owner.flail.detached &&
                        flailToVictim<260
                    ){
                        owner.flail.attracting=true;
                        ai.holdTime=rand(.28,.72);
                        ai.actionCooldown=rand(1.2,2.5);
                    }
                }else if(foodTarget){
                    ai.mode='food';

                    ai.goalX=foodTarget.x;
                    ai.goalY=foodTarget.y;
                }else if(ai.wander<=0){
                    ai.wander=rand(1.1,2.8);

                    ai.goalX=rand(80,CONFIG.worldSize-80);
                    ai.goalY=rand(80,CONFIG.worldSize-80);
                }
            }

            moveOwner(
                owner,
                ai.goalX,
                ai.goalY,
                delta,
                CONFIG.botCarSpeed
            );

            updateFlail(owner,delta);
        };

        const updatePlayer = delta => {
            if(!player?.alive) return;

            mouse.worldX=
                camera.x+
                (mouse.x-width/2)/
                camera.zoom;

            mouse.worldY=
                camera.y+
                (mouse.y-height/2)/
                camera.zoom;

            moveOwner(
                player,
                mouse.worldX,
                mouse.worldY,
                delta,
                CONFIG.maxCarSpeed
            );

            updateFlail(player,delta);

            if(keys.action){
                keys.action=false;
                launchFlail(player);
            }
        };

        const addParticles = (x,y,color,count=12) => {
            for(let i=0;i<count;i++){
                const a=rand(0,Math.PI*2);
                const s=rand(22,120);

                particles.push({
                    x,y,
                    vx:Math.cos(a)*s,
                    vy:Math.sin(a)*s,
                    life:rand(.25,.62),
                    maxLife:0,
                    color,
                    size:rand(1.5,4.2)
                });

                particles[particles.length-1].maxLife=
                    particles[particles.length-1].life;
            }
        };

        const dropOwnerEnergy = owner => {
            const amount=
                Math.min(
                    CONFIG.deathDropMax,
                    Math.max(
                        18,
                        Math.floor(
                            30+
                            Math.sqrt(
                                Math.max(
                                    0,
                                    owner.flail.score
                                )
                            )*
                            3.8
                        )
                    )
                );

            for(let i=0;i<amount;i++){
                const a=rand(0,Math.PI*2);
                const d=rand(15,95);

                food.push(
                    createFood(
                        owner.x+Math.cos(a)*d,
                        owner.y+Math.sin(a)*d,
                        rand(5,14),
                        owner.color
                    )
                );
            }
        };

        const addKillFeed = (killer,victim) => {
            killFeed.unshift({
                text:`${killer} deleted ${victim}`,
                life:4.5
            });

            if(killFeed.length>6){
                killFeed.length=6;
            }

            renderFeed();
        };

        const renderFeed = () => {
            feedEl.innerHTML=
                killFeed
                    .map(item=>`
                        <div class="nf-feed-item">${escapeHtml(item.text)}</div>
                    `)
                    .join('');
        };

        const killOwner = (victim,killer=null,reason='Deleted by flail') => {
            if(!victim.alive) return;

            victim.alive=false;

            dropOwnerEnergy(victim);
            addParticles(victim.x,victim.y,victim.color,28);

            if(killer&&killer.alive){
                killer.kills++;

                if(killer.isPlayer){
                    playerKills++;
                    tone(650,.05,.012,'triangle');
                }

                addKillFeed(killer.name,victim.name);
            }

            if(victim.isPlayer){
                finishGame(reason);
            }else{
                setTimeout(()=>{
                    if(destroyed||!running) return;

                    const bot=createOwner(
                        BOT_NAMES[rint(0,BOT_NAMES.length-1)],
                        COLORS[rint(0,COLORS.length-1)],
                        false
                    );

                    bot.flail.score=rand(0,1200);

                    bots.push(bot);
                },900+Math.random()*1600);
            }
        };

        const stealFlailEnergy = (redOwner,otherOwner) => {
            const rf=redOwner.flail;
            const of=otherOwner.flail;

            if(rf.shockCooldown>0) return;

            rf.shockCooldown=.42;

            const steal=Math.min(
                Math.max(20,of.score*.12),
                of.score
            );

            if(steal<=0) return;

            of.score-=steal;
            rf.score+=steal;

            addParticles(
                otherOwner.flail.x,
                otherOwner.flail.y,
                '#ff3048',
                13
            );
        };

        const updateCombat = () => {
            const owners=ownerList();

            for(const attacker of owners){
                const fr=flailRadius(attacker.flail.score);

                for(const victim of owners){
                    if(victim.id===attacker.id||!victim.alive) continue;

                    const d=
                        Math.hypot(
                            attacker.flail.x-victim.x,
                            attacker.flail.y-victim.y
                        );

                    if(d<fr+CONFIG.carRadius*.92){
                        killOwner(
                            victim,
                            attacker,
                            `Deleted by ${attacker.name}`
                        );

                        break;
                    }
                }
            }

            // Flail-vs-Flail physics / Red Flail shock.
            for(let i=0;i<owners.length;i++){
                for(let j=i+1;j<owners.length;j++){
                    const a=owners[i];
                    const b=owners[j];

                    const ar=flailRadius(a.flail.score);
                    const br=flailRadius(b.flail.score);

                    const dx=b.flail.x-a.flail.x;
                    const dy=b.flail.y-a.flail.y;
                    const d=Math.max(1,Math.hypot(dx,dy));

                    if(d>=ar+br) continue;

                    const nx=dx/d;
                    const ny=dy/d;

                    const overlap=ar+br-d;

                    a.flail.x-=nx*overlap*.5;
                    a.flail.y-=ny*overlap*.5;
                    b.flail.x+=nx*overlap*.5;
                    b.flail.y+=ny*overlap*.5;

                    const av=a.flail.vx*nx+a.flail.vy*ny;
                    const bv=b.flail.vx*nx+b.flail.vy*ny;

                    a.flail.vx+=(bv-av)*nx*.62;
                    a.flail.vy+=(bv-av)*ny*.62;
                    b.flail.vx+=(av-bv)*nx*.62;
                    b.flail.vy+=(av-bv)*ny*.62;

                    if(a.flail.redTime>0){
                        stealFlailEnergy(a,b);
                    }

                    if(b.flail.redTime>0){
                        stealFlailEnergy(b,a);
                    }
                }
            }
        };

        const updateFoodPickup = () => {
            for(const owner of ownerList()){
                const f=owner.flail;
                const r=flailRadius(f.score);

                for(let i=food.length-1;i>=0;i--){
                    const p=food[i];

                    if(
                        Math.abs(p.x-f.x)>r+12 ||
                        Math.abs(p.y-f.y)>r+12
                    ){
                        continue;
                    }

                    if(Math.hypot(p.x-f.x,p.y-f.y)<r+p.radius+3){
                        f.score+=p.mass;

                        addParticles(p.x,p.y,p.color,2);

                        food.splice(i,1);
                    }
                }
            }
        };

        const updateElectrocuters = () => {
            const zones=electrocuters();

            for(const owner of ownerList()){
                const f=owner.flail;
                const fr=flailRadius(f.score);

                for(const e of zones){
                    const carD=Math.hypot(owner.x-e.x,owner.y-e.y);

                    if(carD<e.r*.64+CONFIG.carRadius){
                        killOwner(owner,null,'Deleted by electrocuter');
                        break;
                    }

                    const flailD=Math.hypot(f.x-e.x,f.y-e.y);

                    if(
                        flailD<e.r+fr*.35 &&
                        f.redTime<=0
                    ){
                        f.score*=.76;

                        const dx=f.x-e.x;
                        const dy=f.y-e.y;
                        const n=normalize(dx,dy);

                        f.vx+=n.x*260;
                        f.vy+=n.y*260;

                        addParticles(f.x,f.y,'#ff253d',8);
                    }
                }
            }
        };

        const updateBlackHolePhysics = delta => {
            if(!blackHole) return;

            const cx=CONFIG.worldSize/2;
            const cy=CONFIG.worldSize/2;

            for(const owner of ownerList()){
                if(!pointInArena(owner.x,owner.y)) continue;

                const dx=cx-owner.x;
                const dy=cy-owner.y;
                const n=normalize(dx,dy);

                if(blackHole.phase==='feeding'){
                    if(n.d<180){
                        owner.vx-=n.x*190*delta;
                        owner.vy-=n.y*190*delta;
                    }
                }

                if(blackHole.phase==='active'){
                    const strength=
                        clamp(
                            1-
                            n.d/520,
                            .15,
                            1
                        );

                    owner.vx+=n.x*520*strength*delta;
                    owner.vy+=n.y*520*strength*delta;

                    const tangentX=-n.y;
                    const tangentY=n.x;

                    owner.vx+=tangentX*115*strength*delta;
                    owner.vy+=tangentY*115*strength*delta;

                    if(n.d<62){
                        killOwner(owner,null,'Deleted by black hole');
                    }
                }
            }

            if(blackHole.phase==='active'){
                for(const p of food){
                    if(!pointInArena(p.x,p.y)) continue;

                    const dx=cx-p.x;
                    const dy=cy-p.y;
                    const n=normalize(dx,dy);

                    const strength=clamp(1-n.d/520,.05,1);

                    p.x+=n.x*110*strength*delta;
                    p.y+=n.y*110*strength*delta;

                    p.x+=-n.y*45*strength*delta;
                    p.y+=n.x*45*strength*delta;
                }
            }
        };

        const updatePowerup = delta => {
            if(redPowerup?.alive){
                redPowerup.pulse+=delta*3;

                for(const owner of ownerList()){
                    const d=
                        Math.hypot(
                            owner.x-redPowerup.x,
                            owner.y-redPowerup.y
                        );

                    if(d<CONFIG.carRadius+18){
                        owner.flail.redTime=CONFIG.redFlailDuration;
                        redPowerup.alive=false;

                        if(owner.isPlayer){
                            tone(720,.06,.014,'sawtooth');
                        }

                        break;
                    }
                }
            }

            for(const owner of ownerList()){
                if(owner.flail.redTime>0){
                    owner.flail.redTime=
                        Math.max(
                            0,
                            owner.flail.redTime-delta
                        );
                }
            }
        };

        const updateSentinels = delta => {
            const owners=ownerList();

            for(const s of greenSentinels){
                if(!s.alive) continue;

                let nearest=null;
                let bd=Infinity;

                for(const o of owners){
                    const d=Math.hypot(s.x-o.x,s.y-o.y);

                    if(d<bd){
                        bd=d;
                        nearest=o;
                    }
                }

                if(nearest&&bd<260){
                    const dx=s.x-nearest.x;
                    const dy=s.y-nearest.y;
                    const n=normalize(dx,dy);

                    s.vx+=n.x*110*delta;
                    s.vy+=n.y*110*delta;
                }else{
                    s.vx+=Math.cos(s.angle)*12*delta;
                    s.vy+=Math.sin(s.angle)*12*delta;
                    s.angle+=rand(-.35,.35)*delta;
                }

                s.vx*=Math.pow(.986,delta*60);
                s.vy*=Math.pow(.986,delta*60);

                s.x+=s.vx*delta;
                s.y+=s.vy*delta;

                s.x=clamp(s.x,20,CONFIG.worldSize-20);
                s.y=clamp(s.y,20,CONFIG.worldSize-20);

                s.angle=Math.atan2(s.vy,s.vx);

                for(const o of owners){
                    const fr=flailRadius(o.flail.score);

                    if(Math.hypot(s.x-o.flail.x,s.y-o.flail.y)<fr+11){
                        s.alive=false;
                        o.flail.score+=150;

                        for(let i=0;i<18;i++){
                            const a=rand(0,Math.PI*2);

                            food.push(
                                createFood(
                                    s.x+Math.cos(a)*rand(5,40),
                                    s.y+Math.sin(a)*rand(5,40),
                                    rand(5,12),
                                    '#43ff31'
                                )
                            );
                        }

                        break;
                    }
                }
            }

            for(const s of redSentinels){
                if(!s.alive) continue;

                let target=null;
                let bd=Infinity;

                for(const o of owners){
                    if(!pointInArena(o.x,o.y)) continue;

                    const d=Math.hypot(s.x-o.x,s.y-o.y);

                    if(d<bd){
                        bd=d;
                        target=o;
                    }
                }

                if(target){
                    const dx=target.x-s.x;
                    const dy=target.y-s.y;
                    const n=normalize(dx,dy);

                    s.vx+=n.x*125*delta;
                    s.vy+=n.y*125*delta;
                }

                s.vx*=Math.pow(.986,delta*60);
                s.vy*=Math.pow(.986,delta*60);

                s.x+=s.vx*delta;
                s.y+=s.vy*delta;
                s.angle=Math.atan2(s.vy,s.vx);

                for(const o of owners){
                    if(Math.hypot(s.x-o.x,s.y-o.y)<14+CONFIG.carRadius){
                        killOwner(o,null,'Deleted by sentinel');
                        break;
                    }

                    const fr=flailRadius(o.flail.score);

                    if(Math.hypot(s.x-o.flail.x,s.y-o.flail.y)<fr+12){
                        s.alive=false;
                        o.flail.score+=320;
                        addParticles(s.x,s.y,'#ff3043',14);
                        break;
                    }
                }
            }

            greenSentinels=greenSentinels.filter(s=>s.alive);
            redSentinels=redSentinels.filter(s=>s.alive);

            maintainSentinels();
        };

        const updateParticles = delta => {
            for(let i=particles.length-1;i>=0;i--){
                const p=particles[i];

                p.life-=delta;
                p.x+=p.vx*delta;
                p.y+=p.vy*delta;

                p.vx*=Math.pow(.94,delta*60);
                p.vy*=Math.pow(.94,delta*60);

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

            if(feedChanged){
                renderFeed();
            }
        };

        const updateCamera = () => {
            if(!player?.alive) return;

            camera.x+=(player.x-camera.x)*CONFIG.cameraLerp;
            camera.y+=(player.y-camera.y)*CONFIG.cameraLerp;

            const size=
                flailRadius(player.flail.score);

            const target=
                clamp(
                    CONFIG.cameraBaseZoom/
                    (
                        1+
                        Math.max(0,size-14)*.0062
                    ),
                    CONFIG.cameraMinZoom,
                    CONFIG.cameraBaseZoom
                );

            const arenaBonus=
                pointInArena(player.x,player.y)
                    ?.82
                    :1;

            camera.targetZoom=target*arenaBonus;

            camera.zoom+=(camera.targetZoom-camera.zoom)*.08;
        };

        const updateHud = () => {
            const owners=ownerList()
                .slice()
                .sort((a,b)=>b.flail.score-a.flail.score);

            const king=owners[0]??null;
            kingId=king?.id??null;

            boardList.innerHTML=
                owners
                    .slice(0,CONFIG.leaderboardSize)
                    .map((o,index)=>`
                        <div class="nf-row ${o.isPlayer?'you':''}">
                            <span class="nf-rank">${index+1}.</span>
                            <span class="nf-crown">${index===0?'♛':''}</span>
                            <span class="nf-name">${escapeHtml(o.name)}</span>
                            <span class="nf-score">${Math.round(o.flail.score)}</span>
                        </div>
                    `)
                    .join('');

            if(player){
                energyEl.textContent=Math.round(player.flail.score);
                killsEl.textContent=playerKills;

                playerBest=Math.max(playerBest,player.flail.score);

                if(player.flail.redTime>0){
                    redBar.classList.add('on');

                    redFill.style.width=
                        `${player.flail.redTime/CONFIG.redFlailDuration*100}%`;
                }else{
                    redBar.classList.remove('on');
                }
            }
        };

        const update = delta => {
            if(!running) return;

            matchTime+=delta;

            updateBlackHolePhase(delta);

            updatePlayer(delta);

            for(const bot of bots){
                if(bot.alive){
                    updateBot(bot,delta);
                }
            }

            updateFoodPickup();
            updateCombat();
            updateElectrocuters();
            updateBlackHolePhysics(delta);
            updatePowerup(delta);
            updateSentinels(delta);

            maintainFood();
            updateParticles(delta);
            updateCamera();
            updateHud();

            bots=bots.filter(b=>b.alive);
        };

        const drawBackground = () => {
            ctx.fillStyle='#020712';
            ctx.fillRect(0,0,width,height);

            const left=camera.x-width/2/camera.zoom;
            const right=camera.x+width/2/camera.zoom;
            const top=camera.y-height/2/camera.zoom;
            const bottom=camera.y+height/2/camera.zoom;

            const grid=54;
            const sx=Math.floor(left/grid)*grid;
            const sy=Math.floor(top/grid)*grid;

            ctx.strokeStyle='rgba(23,75,142,.22)';
            ctx.lineWidth=1;

            ctx.beginPath();

            for(let x=sx;x<=right;x+=grid){
                const px=screen(x,0).x;
                ctx.moveTo(px,0);
                ctx.lineTo(px,height);
            }

            for(let y=sy;y<=bottom;y+=grid){
                const py=screen(0,y).y;
                ctx.moveTo(0,py);
                ctx.lineTo(width,py);
            }

            ctx.stroke();

            const radial=
                ctx.createRadialGradient(
                    width*.5,
                    height*.5,
                    20,
                    width*.5,
                    height*.5,
                    Math.max(width,height)*.72
                );

            radial.addColorStop(0,'rgba(0,38,79,.10)');
            radial.addColorStop(1,'rgba(0,0,0,.25)');

            ctx.fillStyle=radial;
            ctx.fillRect(0,0,width,height);
        };

        const drawFood = () => {
            ctx.save();
            ctx.globalCompositeOperation='lighter';

            for(const p of food){
                p.pulse+=.04;

                const s=screen(p.x,p.y);
                const r=p.radius*camera.zoom;

                if(s.x<-20||s.y<-20||s.x>width+20||s.y>height+20) continue;

                const glow=
                    ctx.createRadialGradient(
                        s.x,s.y,0,
                        s.x,s.y,r*4.2
                    );

                glow.addColorStop(0,p.color+'b8');
                glow.addColorStop(.25,p.color+'65');
                glow.addColorStop(1,'rgba(0,0,0,0)');

                ctx.fillStyle=glow;
                ctx.beginPath();
                ctx.arc(s.x,s.y,r*4.2,0,Math.PI*2);
                ctx.fill();
            }

            ctx.restore();

            for(const p of food){
                const s=screen(p.x,p.y);
                const r=p.radius*camera.zoom;

                if(s.x<-20||s.y<-20||s.x>width+20||s.y>height+20) continue;

                ctx.fillStyle=p.color;
                ctx.shadowBlur=8;
                ctx.shadowColor=p.color;

                ctx.beginPath();
                ctx.arc(s.x,s.y,Math.max(1.7,r),0,Math.PI*2);
                ctx.fill();
            }

            ctx.shadowBlur=0;
        };

        const drawNeonWall = rect => {
            const p=screen(rect.x,rect.y);

            ctx.save();

            ctx.fillStyle='rgba(0,98,118,.34)';
            ctx.strokeStyle='#00efff';
            ctx.lineWidth=Math.max(2,3*camera.zoom);
            ctx.shadowBlur=15*camera.zoom;
            ctx.shadowColor='#00eaff';

            ctx.fillRect(
                p.x,
                p.y,
                rect.w*camera.zoom,
                rect.h*camera.zoom
            );

            ctx.strokeRect(
                p.x,
                p.y,
                rect.w*camera.zoom,
                rect.h*camera.zoom
            );

            ctx.restore();
        };

        const drawStructures = () => {
            for(const wall of staticWalls()){
                drawNeonWall(wall);
            }

            // Dotted flail-only gates at arena entries.
            ctx.save();

            ctx.strokeStyle='rgba(180,245,255,.55)';
            ctx.lineWidth=1.5;
            ctx.setLineDash([6,7]);

            for(const gate of arenaFlailGates()){
                const p=screen(gate.x,gate.y);

                ctx.strokeRect(
                    p.x,
                    p.y,
                    gate.w*camera.zoom,
                    gate.h*camera.zoom
                );
            }

            ctx.restore();

            ctx.setLineDash([]);

            // Electrocuter triangle clusters.
            for(const e of electrocuters()){
                const p=screen(e.x,e.y);
                const r=e.r*camera.zoom;

                ctx.save();

                ctx.translate(p.x,p.y);
                ctx.shadowBlur=24*camera.zoom;
                ctx.shadowColor='#ff1736';
                ctx.fillStyle='#ff102d';

                for(let i=0;i<3;i++){
                    const a=i/3*Math.PI*2;

                    ctx.save();
                    ctx.rotate(a);

                    ctx.beginPath();
                    ctx.moveTo(r*.18,0);
                    ctx.lineTo(r*.70,-r*.27);
                    ctx.lineTo(r*.70,r*.27);
                    ctx.closePath();
                    ctx.fill();

                    ctx.restore();
                }

                ctx.restore();
            }

            // Green bumpers.
            for(const b of greenBumpers()){
                const p=screen(b.x,b.y);
                const r=b.r*camera.zoom;

                ctx.save();
                ctx.translate(p.x,p.y);

                ctx.fillStyle='#18bd21';
                ctx.strokeStyle='#29ff35';
                ctx.lineWidth=2.5;
                ctx.shadowBlur=18*camera.zoom;
                ctx.shadowColor='#2eff3d';

                const spikes=24;

                ctx.beginPath();

                for(let i=0;i<spikes*2;i++){
                    const a=i/(spikes*2)*Math.PI*2;
                    const rr=r*(i%2===0?1.15:.91);

                    const x=Math.cos(a)*rr;
                    const y=Math.sin(a)*rr;

                    if(i===0) ctx.moveTo(x,y);
                    else ctx.lineTo(x,y);
                }

                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.restore();
            }
        };

        const drawBlackHole = () => {
            if(!blackHole) return;

            const p=screen(CONFIG.worldSize/2,CONFIG.worldSize/2);

            const base=
                (
                    blackHole.phase==='active'
                        ?105
                        :82
                )*
                camera.zoom;

            ctx.save();
            ctx.translate(p.x,p.y);
            ctx.rotate(blackHole.angle);

            if(blackHole.phase==='neutral'){
                ctx.strokeStyle='#26ff3d';
                ctx.lineWidth=3;
                ctx.setLineDash([8,6]);
                ctx.shadowBlur=15;
                ctx.shadowColor='#25ff37';

                ctx.beginPath();
                ctx.arc(0,0,base,0,Math.PI*2);
                ctx.stroke();
            }else if(blackHole.phase==='feeding'){
                ctx.strokeStyle='#ffe92f';
                ctx.lineWidth=7;
                ctx.setLineDash([16,10]);
                ctx.shadowBlur=18;
                ctx.shadowColor='#ffe52c';

                ctx.beginPath();
                ctx.arc(0,0,base*1.15,0,Math.PI*2);
                ctx.stroke();
            }else{
                const glow=
                    ctx.createRadialGradient(
                        0,0,base*.15,
                        0,0,base*1.65
                    );

                glow.addColorStop(0,'#000');
                glow.addColorStop(.45,'rgba(20,0,30,.94)');
                glow.addColorStop(.70,'rgba(170,0,255,.42)');
                glow.addColorStop(1,'rgba(170,0,255,0)');

                ctx.fillStyle=glow;
                ctx.beginPath();
                ctx.arc(0,0,base*1.65,0,Math.PI*2);
                ctx.fill();

                ctx.fillStyle='#000';
                ctx.beginPath();
                ctx.arc(0,0,base*.68,0,Math.PI*2);
                ctx.fill();
            }

            ctx.restore();
            ctx.setLineDash([]);
        };

        const drawPowerup = () => {
            if(!redPowerup?.alive) return;

            redPowerup.pulse+=.04;

            const p=screen(redPowerup.x,redPowerup.y);
            const r=(16+Math.sin(redPowerup.pulse)*2)*camera.zoom;

            ctx.save();

            ctx.strokeStyle='#ff374c';
            ctx.fillStyle='#4b1018';
            ctx.lineWidth=3;
            ctx.shadowBlur=18;
            ctx.shadowColor='#ff2c43';

            ctx.beginPath();
            ctx.arc(p.x,p.y,r,0,Math.PI*2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle='#ff4a5b';

            for(let i=0;i<6;i++){
                const a=i/6*Math.PI*2;

                ctx.fillRect(
                    p.x+Math.cos(a)*r*1.55-2,
                    p.y+Math.sin(a)*r*1.55-5,
                    4,
                    10
                );
            }

            ctx.restore();
        };

        const drawSentinel = (s,color) => {
            const p=screen(s.x,s.y);
            const scale=camera.zoom;

            ctx.save();

            ctx.translate(p.x,p.y);
            ctx.rotate(s.angle);

            ctx.fillStyle=color;
            ctx.shadowBlur=14*scale;
            ctx.shadowColor=color;

            ctx.beginPath();
            ctx.moveTo(13*scale,0);
            ctx.lineTo(-9*scale,-8*scale);
            ctx.lineTo(-5*scale,0);
            ctx.lineTo(-9*scale,8*scale);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle=color;
            ctx.lineWidth=1.5;

            ctx.beginPath();
            ctx.moveTo(-8*scale,0);
            ctx.lineTo(-24*scale,0);
            ctx.stroke();

            ctx.restore();
        };

        const drawSentinels = () => {
            greenSentinels.forEach(s=>drawSentinel(s,'#25ff25'));
            redSentinels.forEach(s=>drawSentinel(s,'#ff3046'));
        };

        const drawFlail = owner => {
            const f=owner.flail;
            const r=flailRadius(f.score)*camera.zoom;
            const p=screen(f.x,f.y);

            const color=
                f.redTime>0
                    ?'#ff263d'
                    :owner.color;

            ctx.save();
            ctx.translate(p.x,p.y);

            ctx.fillStyle=
                f.redTime>0
                    ?'#8c101f'
                    :color;

            ctx.strokeStyle=color;
            ctx.lineWidth=Math.max(1.5,2.5*camera.zoom);

            ctx.shadowBlur=22*camera.zoom;
            ctx.shadowColor=color;

            const spikes=
                clamp(
                    10+
                    Math.floor(
                        Math.sqrt(
                            Math.max(0,f.score)
                        )/
                        10
                    ),
                    10,
                    42
                );

            ctx.beginPath();

            for(let i=0;i<spikes*2;i++){
                const a=i/(spikes*2)*Math.PI*2;

                const rr=
                    r*
                    (
                        i%2===0
                            ?1.16
                            :.91
                    );

                const x=Math.cos(a)*rr;
                const y=Math.sin(a)*rr;

                if(i===0) ctx.moveTo(x,y);
                else ctx.lineTo(x,y);
            }

            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            if(f.redTime>0){
                ctx.strokeStyle='#ff8290';
                ctx.lineWidth=1;

                for(let i=-2;i<=2;i++){
                    ctx.beginPath();
                    ctx.moveTo(-r*.6,i*r*.22);
                    ctx.lineTo(r*.6,i*r*.22+r*.17);
                    ctx.stroke();
                }
            }

            ctx.restore();
        };

        const drawCar = owner => {
            const p=screen(owner.x,owner.y);
            const scale=camera.zoom;

            const flailP=screen(owner.flail.x,owner.flail.y);

            // Cable.
            ctx.save();

            ctx.strokeStyle=owner.color;
            ctx.globalAlpha=.70;
            ctx.lineWidth=Math.max(1,1.4*scale);
            ctx.shadowBlur=6;
            ctx.shadowColor=owner.color;

            ctx.beginPath();
            ctx.moveTo(p.x,p.y);
            ctx.lineTo(flailP.x,flailP.y);
            ctx.stroke();

            ctx.restore();

            // Player control ring like the reference.
            if(owner.isPlayer){
                ctx.save();

                ctx.strokeStyle='rgba(180,220,235,.18)';
                ctx.lineWidth=1;
                ctx.beginPath();
                ctx.arc(
                    p.x,
                    p.y,
                    CONFIG.stopMouseRadius,
                    0,
                    Math.PI*2
                );
                ctx.stroke();

                ctx.restore();
            }

            ctx.save();

            ctx.translate(p.x,p.y);
            ctx.rotate(owner.angle);

            const len=CONFIG.carLength*scale;
            const h=CONFIG.carWidth*scale;

            ctx.strokeStyle=owner.color;
            ctx.lineWidth=Math.max(2,2.5*scale);
            ctx.shadowBlur=16*scale;
            ctx.shadowColor=owner.color;

            ctx.fillStyle='rgba(4,15,20,.80)';

            ctx.beginPath();

            const rr=Math.min(h*.45,6*scale);

            ctx.roundRect(
                -len*.5,
                -h*.5,
                len,
                h,
                rr
            );

            ctx.fill();
            ctx.stroke();

            // Front direction arrow.
            const arrowScale=
                owner.isPlayer
                    ?clamp(
                        Math.hypot(
                            mouse.x-width/2,
                            mouse.y-height/2
                        )/
                        130,
                        .18,
                        1
                    )
                    :1;

            ctx.fillStyle=owner.color;

            ctx.beginPath();
            ctx.moveTo(len*.72,0);
            ctx.lineTo(len*.52,-h*.25*arrowScale);
            ctx.lineTo(len*.52,h*.25*arrowScale);
            ctx.closePath();
            ctx.fill();

            ctx.restore();

            // Name.
            ctx.fillStyle=owner.color;
            ctx.font=`800 ${Math.max(8,10*scale)}px Arial`;
            ctx.textAlign='center';
            ctx.textBaseline='middle';
            ctx.shadowBlur=5;
            ctx.shadowColor=owner.color;

            ctx.fillText(
                owner.name,
                p.x,
                p.y+22*scale
            );

            ctx.shadowBlur=0;

            // Crown for King.
            if(owner.id===kingId){
                ctx.fillStyle='#ffe54f';
                ctx.font=`900 ${Math.max(12,15*scale)}px Arial`;
                ctx.fillText('♛',p.x,p.y-25*scale);
            }
        };

        const drawOwner = owner => {
            if(!owner.alive) return;

            drawFlail(owner);
            drawCar(owner);
        };

        const drawKingArrow = () => {
            const king=getKing();

            if(
                !player?.alive ||
                !king ||
                king.id===player.id
            ){
                return;
            }

            const kp=screen(king.x,king.y);

            if(
                kp.x>0 &&
                kp.x<width &&
                kp.y>0 &&
                kp.y<height
            ){
                return;
            }

            const angle=
                Math.atan2(
                    king.y-player.y,
                    king.x-player.x
                );

            const cx=width*.5;
            const cy=height*.5;
            const radius=Math.min(width,height)*.42;

            const x=cx+Math.cos(angle)*radius;
            const y=cy+Math.sin(angle)*radius;

            ctx.save();
            ctx.translate(x,y);
            ctx.rotate(angle);

            ctx.fillStyle='#ffe25a';
            ctx.shadowBlur=10;
            ctx.shadowColor='#ffe25a';

            ctx.beginPath();
            ctx.moveTo(11,0);
            ctx.lineTo(-7,-6);
            ctx.lineTo(-7,6);
            ctx.closePath();
            ctx.fill();

            ctx.restore();

            ctx.fillStyle='#ffe25a';
            ctx.font='900 14px Arial';
            ctx.textAlign='center';
            ctx.fillText('♛',x,y-13);
        };

        const drawParticles = () => {
            for(const p of particles){
                const s=screen(p.x,p.y);

                ctx.save();

                ctx.globalAlpha=clamp(p.life/p.maxLife,0,1);
                ctx.fillStyle=p.color;
                ctx.shadowBlur=10;
                ctx.shadowColor=p.color;

                ctx.beginPath();
                ctx.arc(s.x,s.y,p.size*camera.zoom,0,Math.PI*2);
                ctx.fill();

                ctx.restore();
            }
        };

        const drawMini = () => {
            const r=mini.getBoundingClientRect();
            const mw=r.width;
            const mh=r.height;
            const md=Math.min(2,window.devicePixelRatio||1);

            const pw=Math.max(1,Math.round(mw*md));
            const ph=Math.max(1,Math.round(mh*md));

            if(mini.width!==pw||mini.height!==ph){
                mini.width=pw;
                mini.height=ph;
                mctx.setTransform(md,0,0,md,0,0);
            }

            mctx.fillStyle='#06101e';
            mctx.fillRect(0,0,mw,mh);

            mctx.strokeStyle='rgba(20,90,150,.22)';
            mctx.lineWidth=.6;

            for(let x=0;x<mw;x+=12){
                mctx.beginPath();
                mctx.moveTo(x,0);
                mctx.lineTo(x,mh);
                mctx.stroke();
            }

            for(let y=0;y<mh;y+=12){
                mctx.beginPath();
                mctx.moveTo(0,y);
                mctx.lineTo(mw,y);
                mctx.stroke();
            }

            const sx=mw/CONFIG.worldSize;
            const sy=mh/CONFIG.worldSize;

            const a=arenaRect();

            mctx.strokeStyle='#00dbea';
            mctx.lineWidth=1.5;

            mctx.strokeRect(
                a.x*sx,
                a.y*sy,
                a.w*sx,
                a.h*sy
            );

            for(const owner of ownerList()){
                mctx.fillStyle=
                    owner.isPlayer
                        ?owner.color
                        :'rgba(185,195,205,.52)';

                mctx.beginPath();
                mctx.arc(
                    owner.flail.x*sx,
                    owner.flail.y*sy,
                    owner.isPlayer?3:1.7,
                    0,
                    Math.PI*2
                );
                mctx.fill();
            }

            const king=getKing();

            if(king){
                mctx.fillStyle='#ffe52f';
                mctx.beginPath();
                mctx.arc(
                    king.flail.x*sx,
                    king.flail.y*sy,
                    2.5,
                    0,
                    Math.PI*2
                );
                mctx.fill();
            }

            mctx.strokeStyle='#00efff';
            mctx.strokeRect(.5,.5,mw-1,mh-1);
        };

        const draw = () => {
            drawBackground();
            drawFood();
            drawStructures();
            drawBlackHole();
            drawPowerup();
            drawSentinels();

            const owners=ownerList()
                .slice()
                .sort(
                    (a,b)=>
                        flailRadius(a.flail.score)-
                        flailRadius(b.flail.score)
                );

            for(const owner of owners){
                drawOwner(owner);
            }

            drawParticles();
            drawKingArrow();

            if(running){
                drawMini();
            }
        };

        const finishGame = reason => {
            if(gameOver) return;

            gameOver=true;
            running=false;

            const score=
                Math.round(
                    playerBest+
                    playerKills*750+
                    matchTime*2
                );

            services?.highscores?.saveHighscore?.(
                'neon-flail',
                score
            );

            deathReason.textContent=reason;

            endEnergy.textContent=Math.round(playerBest);
            endKills.textContent=playerKills;
            endTime.textContent=fmtTime(matchTime);
            endScore.textContent=score.toLocaleString('de-DE');

            end.classList.remove('hidden');

            tone(120,.12,.016,'sine');
        };

        const reset = () => {
            nextId=1;

            player=null;
            bots=[];
            food=[];
            greenSentinels=[];
            redSentinels=[];
            particles=[];
            killFeed=[];

            blackHole=null;
            redPowerup=null;

            matchTime=0;
            playerBest=0;
            playerKills=0;

            player=createOwner(
                playerName,
                selectedColor,
                true
            );

            camera.x=player.x;
            camera.y=player.y;
            camera.zoom=CONFIG.cameraBaseZoom;
            camera.targetZoom=CONFIG.cameraBaseZoom;

            for(let i=0;i<CONFIG.botCount;i++){
                const b=createOwner(
                    BOT_NAMES[i%BOT_NAMES.length],
                    COLORS[(i+2)%COLORS.length],
                    false
                );

                b.flail.score=
                    Math.random()<.12
                        ?rand(1100,4800)
                        :Math.random()<.40
                            ?rand(180,1250)
                            :rand(0,300);

                bots.push(b);
            }

            maintainFood();
            maintainSentinels();

            updateBlackHolePhase(0);
            renderFeed();
            updateHud();

            gameOver=false;
            running=true;
        };

        const start = () => {
            ensureAudio();

            playerName=
                nameInput.value.trim().slice(0,16)||
                'Player';

            menu.classList.add('hidden');
            end.classList.add('hidden');

            reset();
        };

        const resize = () => {
            const r=root.getBoundingClientRect();

            width=Math.max(1,r.width);
            height=Math.max(1,r.height);
            dpr=Math.min(2,window.devicePixelRatio||1);

            canvas.width=Math.round(width*dpr);
            canvas.height=Math.round(height*dpr);

            canvas.style.width=`${width}px`;
            canvas.style.height=`${height}px`;

            ctx.setTransform(dpr,0,0,dpr,0,0);

            mouse.x=width*.63;
            mouse.y=height*.50;
        };

        const onMouseMove = event => {
            const r=canvas.getBoundingClientRect();

            mouse.x=event.clientX-r.left;
            mouse.y=event.clientY-r.top;
        };

        const onMouseDown = event => {
            if(event.button!==0||!running) return;

            mouse.down=true;

            launchFlail(player);
        };

        const onMouseUp = event => {
            if(event.button!==0) return;

            mouse.down=false;

            releaseAttract(player);
        };

        const onKeyDown = event => {
            if(
                event.code==='Space' &&
                running &&
                !event.repeat
            ){
                event.preventDefault();

                keys.action=true;
                player.flail.attracting=true;
            }

            if(
                event.code==='Enter' &&
                !running &&
                !menu.classList.contains('hidden')
            ){
                start();
            }
        };

        const onKeyUp = event => {
            if(event.code==='Space'){
                releaseAttract(player);
            }
        };

        colorButtons.forEach(button=>{
            button.addEventListener('click',()=>{
                selectedColor=button.dataset.color;

                colorButtons.forEach(b=>
                    b.classList.toggle('selected',b===button)
                );
            });
        });

        soundBtn.addEventListener('click',()=>{
            muted=!muted;

            soundBtn.textContent=
                `Sound: ${muted?'Aus':'An'}`;

            if(!muted){
                ensureAudio();
                tone(620,.04,.009);
            }
        });

        playBtn.addEventListener('click',start);
        restartBtn.addEventListener('click',start);

        canvas.addEventListener('mousemove',onMouseMove);
        canvas.addEventListener('mousedown',onMouseDown);
        window.addEventListener('mouseup',onMouseUp);

        window.addEventListener('keydown',onKeyDown);
        window.addEventListener('keyup',onKeyUp);

        resizeObserver=new ResizeObserver(resize);
        resizeObserver.observe(root);

        resize();

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

                window.removeEventListener('keydown',onKeyDown);
                window.removeEventListener('keyup',onKeyUp);

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
    COLORS,
    BOT_NAMES
};
