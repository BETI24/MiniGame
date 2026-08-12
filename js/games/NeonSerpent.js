const CONFIG = {
    worldSize: 6200,
    botCount: 44,
    foodTarget: 1400,
    rareFoodTarget: 34,

    startLength: 24,
    startScore: 28,
    minScore: 18,

    segmentSpacing: 8.2,
    bodyRadius: 10.2,
    headRadius: 12.4,

    baseSpeed: 128,
    boostSpeed: 252,
    turnSpeed: 3.4,
    botTurnSpeed: 2.65,

    boostDrainPerSecond: 2.15,
    boostPelletInterval: 0.18,
    boostPelletMass: 0.34,

    foodMass: 1.0,
    rareFoodMass: 4.5,
    deathFoodFactor: 0.62,

    cameraZoom: 1.0,
    cameraLerp: 0.14,

    gridSize: 80,
    minimapSize: 150,
    leaderboardSize: 10,

    collisionStep: 3,
    safeSpawnRadius: 310
};

const SKINS = [
    { id:'lime',   name:'Lime',   colors:['#77e05e','#a3f174','#58c845'] },
    { id:'blue',   name:'Blue',   colors:['#55a8ff','#77c5ff','#377fe6'] },
    { id:'red',    name:'Red',    colors:['#ff5f6d','#ff8992','#d84252'] },
    { id:'purple', name:'Purple', colors:['#a56cff','#c68bff','#7b48df'] },
    { id:'gold',   name:'Gold',   colors:['#ffca55','#ffe07e','#dc9c2e'] },
    { id:'cyan',   name:'Cyan',   colors:['#48d8d4','#73f1ed','#2aa8a5'] },
    { id:'pink',   name:'Pink',   colors:['#f56fc4','#ff9ed9','#d4469d'] },
    { id:'orange', name:'Orange', colors:['#ff9657','#ffb678','#dd6f34'] }
];

const FOOD_COLORS = [
    '#ff5d73','#ff9a52','#ffd654','#8fe65e',
    '#4fd8c7','#55a6ff','#9f73ff','#f06fc8'
];

const BOT_NAMES = [
    'Noodle','Venom','Slinky','Orbit','Mamba','Pixel','Rex','Nova','Ghost','Wiggle',
    'Mochi','Fang','Luna','Volt','Miso','Ziggy','Dash','Comet','Boba','Mango',
    'Pip','Frost','Taco','Mint','Ruby','Crow','Kiwi','Sushi','Bolt','Riot',
    'Dune','Echo','Jinx','Otter','Waffle','Peach','Moss','Zero','Fizz','Basil',
    'Quill','Leaf','Drift','Ace','Puck','Bean','Cloud','Kilo','Sable','Wolf'
];

export default {
    manifest: {
        id: 'neon-serpent',
        name: 'Neon Serpent',
        description: 'Wachse, booste, umkreise Gegner und werde zur längsten Schlange der Arena.',
        icon: '🐍',
        tags: ['Arcade','Arena','Snake','Survival','Highscore']
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
        let snakes = [];
        let food = [];
        let particles = [];
        let killFeed = [];

        let player = null;
        let playerName = 'Player';
        let selectedSkin = SKINS[0];
        let muted = false;
        let darkMode = true;
        let audio = null;

        let bestScore = 0;
        let kills = 0;

        let mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            down: false
        };

        let keys = {
            boost: false
        };

        let camera = {
            x: CONFIG.worldSize / 2,
            y: CONFIG.worldSize / 2,
            zoom: CONFIG.cameraZoom
        };

        const style = document.createElement('style');
        style.textContent = `
            .ss-game{
                --panel:rgba(11,16,24,.78);
                --panel-border:rgba(255,255,255,.09);
                --text:#edf5fb;
                --muted:#94a3b3;
                --accent:#74e76b;

                position:relative;
                width:100%;
                height:100%;
                overflow:hidden;
                background:#0c1118;
                color:var(--text);
                font-family:Arial,Helvetica,sans-serif;
                user-select:none;
            }

            .ss-game.light{
                --panel:rgba(255,255,255,.80);
                --panel-border:rgba(0,0,0,.11);
                --text:#26313a;
                --muted:#6e7b87;
                background:#eef2f5;
            }

            .ss-game *{box-sizing:border-box}

            .ss-canvas{
                width:100%;
                height:100%;
                display:block;
                cursor:crosshair;
            }

            .ss-hud{
                position:absolute;
                inset:0;
                z-index:10;
                pointer-events:none;
            }

            .ss-top-left{
                position:absolute;
                left:12px;
                top:12px;
                display:flex;
                gap:7px;
                pointer-events:auto;
            }

            .ss-btn{
                padding:7px 9px;
                border:1px solid var(--panel-border);
                border-radius:5px;
                background:var(--panel);
                color:var(--muted);
                font:inherit;
                font-size:.63rem;
                font-weight:800;
                cursor:pointer;
                backdrop-filter:blur(8px);
            }

            .ss-btn:hover{filter:brightness(1.08)}

            .ss-board{
                position:absolute;
                right:12px;
                top:12px;
                width:205px;
                padding:10px 12px 11px;
                border:1px solid var(--panel-border);
                border-radius:6px;
                background:var(--panel);
                box-shadow:0 8px 22px rgba(0,0,0,.14);
                backdrop-filter:blur(8px);
            }

            .ss-board-title{
                margin-bottom:7px;
                text-align:center;
                color:var(--muted);
                font-size:.69rem;
                font-weight:900;
                letter-spacing:.06em;
                text-transform:uppercase;
            }

            .ss-row{
                display:flex;
                align-items:center;
                gap:6px;
                padding:2px 0;
                color:var(--muted);
                font-size:.68rem;
            }

            .ss-row.you{
                color:#6ee7ff;
                font-weight:900;
            }

            .ss-rank{width:19px;color:#72808e}
            .ss-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
            .ss-score{font-size:.62rem;color:#8795a3}

            .ss-bottom-left{
                position:absolute;
                left:12px;
                bottom:12px;
                display:flex;
                flex-direction:column;
                gap:6px;
            }

            .ss-stat,
            .ss-help{
                border:1px solid var(--panel-border);
                border-radius:5px;
                background:var(--panel);
                color:var(--muted);
                backdrop-filter:blur(8px);
                box-shadow:0 5px 15px rgba(0,0,0,.10);
            }

            .ss-stat{
                width:max-content;
                min-width:128px;
                padding:7px 10px;
                font-size:.69rem;
                font-weight:900;
            }

            .ss-stat strong{
                color:var(--text);
            }

            .ss-help{
                max-width:345px;
                padding:7px 10px;
                font-size:.60rem;
                line-height:1.4;
            }

            .ss-boostbar{
                position:absolute;
                left:50%;
                bottom:15px;
                transform:translateX(-50%);
                width:min(320px,44vw);
                height:10px;
                border:1px solid var(--panel-border);
                border-radius:999px;
                background:rgba(0,0,0,.30);
                overflow:hidden;
            }

            .ss-boostfill{
                height:100%;
                width:100%;
                background:linear-gradient(90deg,#56d75f,#c8f45d);
                transition:width .06s linear;
            }

            .ss-boostlabel{
                position:absolute;
                left:50%;
                bottom:29px;
                transform:translateX(-50%);
                color:var(--muted);
                font-size:.55rem;
                font-weight:900;
                text-transform:uppercase;
                letter-spacing:.08em;
            }

            .ss-map{
                position:absolute;
                right:12px;
                bottom:12px;
                width:150px;
                height:150px;
                border:1px solid var(--panel-border);
                border-radius:5px;
                overflow:hidden;
                background:var(--panel);
                box-shadow:0 5px 15px rgba(0,0,0,.10);
            }

            .ss-map canvas{
                width:100%;
                height:100%;
                display:block;
            }

            .ss-feed{
                position:absolute;
                right:12px;
                top:260px;
                width:250px;
                display:flex;
                flex-direction:column;
                gap:5px;
            }

            .ss-feed-item{
                padding:5px 7px;
                border:1px solid var(--panel-border);
                border-radius:4px;
                background:var(--panel);
                color:var(--muted);
                font-size:.60rem;
                backdrop-filter:blur(6px);
                animation:ssFeed .18s ease-out;
            }

            @keyframes ssFeed{
                from{opacity:0;transform:translateX(12px)}
                to{opacity:1;transform:translateX(0)}
            }

            .ss-overlay{
                position:absolute;
                inset:0;
                z-index:30;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:22px;
                background:rgba(7,10,15,.72);
                backdrop-filter:blur(5px);
            }

            .ss-game.light .ss-overlay{
                background:rgba(236,241,245,.76);
            }

            .ss-overlay.hidden{display:none}

            .ss-card{
                width:min(610px,100%);
                padding:28px 30px;
                border:1px solid var(--panel-border);
                border-radius:12px;
                background:rgba(13,19,28,.94);
                box-shadow:0 22px 60px rgba(0,0,0,.30);
                text-align:center;
            }

            .ss-game.light .ss-card{
                background:rgba(255,255,255,.96);
                box-shadow:0 20px 50px rgba(0,0,0,.15);
            }

            .ss-logo{
                font-size:clamp(2.6rem,7vw,4.8rem);
                font-weight:1000;
                line-height:.95;
                letter-spacing:-.06em;
                background:linear-gradient(90deg,#6ee76a,#5cd8d1,#67a8ff,#bd79ff);
                -webkit-background-clip:text;
                background-clip:text;
                color:transparent;
                text-shadow:0 0 24px rgba(102,224,133,.13);
            }

            .ss-sub{
                margin:9px auto 20px;
                max-width:500px;
                color:var(--muted);
                font-size:.79rem;
                line-height:1.45;
            }

            .ss-name-input{
                width:100%;
                padding:12px 13px;
                border:1px solid var(--panel-border);
                border-radius:7px;
                background:rgba(255,255,255,.055);
                color:var(--text);
                outline:none;
                text-align:center;
                font:inherit;
                font-size:.91rem;
            }

            .ss-game.light .ss-name-input{
                background:#f5f7f8;
            }

            .ss-skins{
                display:flex;
                flex-wrap:wrap;
                justify-content:center;
                gap:8px;
                margin:15px 0 18px;
            }

            .ss-skin{
                width:38px;
                height:38px;
                padding:0;
                border:3px solid transparent;
                border-radius:50%;
                cursor:pointer;
                position:relative;
                overflow:hidden;
                background:#333;
                box-shadow:0 2px 7px rgba(0,0,0,.18);
            }

            .ss-skin.selected{
                border-color:#fff;
                box-shadow:0 0 0 2px #4ad36e,0 3px 10px rgba(0,0,0,.25);
            }

            .ss-game.light .ss-skin.selected{
                border-color:#28313a;
            }

            .ss-skin i{
                position:absolute;
                inset:0;
                display:block;
                background:var(--skin);
            }

            .ss-skin i:after{
                content:"";
                position:absolute;
                inset:0;
                background:repeating-linear-gradient(
                    90deg,
                    transparent 0 8px,
                    rgba(255,255,255,.28) 8px 13px
                );
                transform:rotate(-28deg) scale(1.4);
            }

            .ss-play{
                width:100%;
                height:46px;
                border:0;
                border-radius:7px;
                background:linear-gradient(135deg,#57db64,#72bd4e);
                color:#102116;
                font:inherit;
                font-weight:1000;
                cursor:pointer;
                box-shadow:0 9px 25px rgba(79,211,94,.17);
            }

            .ss-play:hover{filter:brightness(1.06)}

            .ss-rules{
                display:grid;
                grid-template-columns:repeat(3,1fr);
                gap:8px;
                margin-top:16px;
            }

            .ss-rule{
                padding:9px 8px;
                border:1px solid var(--panel-border);
                border-radius:6px;
                background:rgba(255,255,255,.035);
                color:var(--muted);
                font-size:.62rem;
                line-height:1.38;
            }

            .ss-rule b{
                display:block;
                margin-bottom:2px;
                color:var(--text);
                font-size:.67rem;
            }

            .ss-end-title{
                font-size:2rem;
                font-weight:1000;
                color:#ff6577;
            }

            .ss-end-sub{
                margin:7px 0 16px;
                color:var(--muted);
            }

            .ss-end-stats{
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:7px;
                margin-bottom:16px;
            }

            .ss-end-stat{
                padding:10px 7px;
                border:1px solid var(--panel-border);
                border-radius:6px;
                background:rgba(255,255,255,.035);
            }

            .ss-end-stat span{
                display:block;
                color:var(--muted);
                font-size:.54rem;
                font-weight:900;
                text-transform:uppercase;
            }

            .ss-end-stat b{
                display:block;
                margin-top:3px;
                color:var(--text);
                font-size:.95rem;
            }

            @media(max-width:760px){
                .ss-board{width:155px;right:7px;top:7px;padding:7px 8px}
                .ss-row{font-size:.58rem}
                .ss-map{width:105px;height:105px;right:7px;bottom:7px}
                .ss-bottom-left{left:7px;bottom:7px}
                .ss-help{display:none}
                .ss-feed{display:none}
                .ss-top-left{left:7px;top:7px}
                .ss-rules{grid-template-columns:1fr}
                .ss-end-stats{grid-template-columns:1fr 1fr}
            }
        `;

        const root = document.createElement('div');
        root.className = 'ss-game';
        root.innerHTML = `
            <canvas class="ss-canvas"></canvas>

            <div class="ss-hud">
                <div class="ss-top-left">
                    <button class="ss-btn ss-sound" type="button">Sound: An</button>
                    <button class="ss-btn ss-theme" type="button">Light Mode</button>
                </div>

                <div class="ss-board">
                    <div class="ss-board-title">Leaderboard</div>
                    <div class="ss-board-list"></div>
                </div>

                <div class="ss-feed"></div>

                <div class="ss-bottom-left">
                    <div class="ss-stat">
                        Length: <strong class="ss-length">0</strong>
                        · Kills: <strong class="ss-kills">0</strong>
                    </div>
                    <div class="ss-help">
                        Maus = lenken · Linksklick oder SPACE = Boost · Gegner sterben,
                        wenn ihr Kopf einen fremden Körper berührt. Schneide Wege ab und sammle ihre Masse ein.
                    </div>
                </div>

                <div class="ss-boostlabel">Boost</div>
                <div class="ss-boostbar"><div class="ss-boostfill"></div></div>

                <div class="ss-map"><canvas></canvas></div>
            </div>

            <div class="ss-overlay ss-menu">
                <div class="ss-card">
                    <div class="ss-logo">Neon Serpent</div>
                    <div class="ss-sub">
                        Schlängle dich durch eine riesige Arena, sammle leuchtende Masse,
                        booste Gegnern den Weg ab und werde zur längsten Schlange.
                    </div>

                    <input
                        class="ss-name-input"
                        maxlength="16"
                        autocomplete="off"
                        spellcheck="false"
                        value="Player"
                        placeholder="Name"
                    >

                    <div class="ss-skins">
                        ${SKINS.map((skin,index)=>`
                            <button
                                class="ss-skin ${index===0?'selected':''}"
                                type="button"
                                data-skin="${skin.id}"
                                title="${skin.name}"
                            >
                                <i style="--skin:${skin.colors[0]}"></i>
                            </button>
                        `).join('')}
                    </div>

                    <button class="ss-play" type="button">Play</button>

                    <div class="ss-rules">
                        <div class="ss-rule">
                            <b>Grow</b>
                            Sammle normale und seltene leuchtende Pellets.
                        </div>
                        <div class="ss-rule">
                            <b>Boost</b>
                            Linksklick oder SPACE macht dich schneller, kostet aber Masse.
                        </div>
                        <div class="ss-rule">
                            <b>Cut Off</b>
                            Berührt ein Kopf einen fremden Körper, stirbt die Schlange und wird zu Nahrung.
                        </div>
                    </div>
                </div>
            </div>

            <div class="ss-overlay ss-end hidden">
                <div class="ss-card">
                    <div class="ss-end-title">You crashed!</div>
                    <div class="ss-end-sub">Deine Schlange wurde zu Futter für die Arena.</div>

                    <div class="ss-end-stats">
                        <div class="ss-end-stat"><span>Best Length</span><b class="ss-end-length">0</b></div>
                        <div class="ss-end-stat"><span>Kills</span><b class="ss-end-kills">0</b></div>
                        <div class="ss-end-stat"><span>Time</span><b class="ss-end-time">0:00</b></div>
                        <div class="ss-end-stat"><span>Score</span><b class="ss-end-score">0</b></div>
                    </div>

                    <button class="ss-play ss-restart" type="button">Play Again</button>
                </div>
            </div>
        `;

        container.append(style, root);

        const canvas = root.querySelector('.ss-canvas');
        const ctx = canvas.getContext('2d');

        const mini = root.querySelector('.ss-map canvas');
        const mctx = mini.getContext('2d');

        const listEl = root.querySelector('.ss-board-list');
        const lengthEl = root.querySelector('.ss-length');
        const killsEl = root.querySelector('.ss-kills');
        const boostFill = root.querySelector('.ss-boostfill');
        const feedEl = root.querySelector('.ss-feed');

        const soundBtn = root.querySelector('.ss-sound');
        const themeBtn = root.querySelector('.ss-theme');

        const menu = root.querySelector('.ss-menu');
        const end = root.querySelector('.ss-end');

        const nameInput = root.querySelector('.ss-name-input');
        const skinButtons = [...root.querySelectorAll('.ss-skin')];
        const playBtn = root.querySelector('.ss-menu .ss-play');
        const restartBtn = root.querySelector('.ss-restart');

        const endLength = root.querySelector('.ss-end-length');
        const endKills = root.querySelector('.ss-end-kills');
        const endTime = root.querySelector('.ss-end-time');
        const endScore = root.querySelector('.ss-end-score');

        const rand = (min,max)=>min+Math.random()*(max-min);
        const rint = (min,max)=>Math.floor(rand(min,max+1));
        const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));

        const normalizeAngle = angle => {
            while(angle > Math.PI) angle -= Math.PI*2;
            while(angle < -Math.PI) angle += Math.PI*2;
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
            const total = Math.max(0,Math.floor(seconds));
            return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;
        };

        const ensureAudio = () => {
            if(muted) return null;

            try{
                if(!audio){
                    audio = new (window.AudioContext||window.webkitAudioContext)();
                }

                if(audio.state==='suspended') audio.resume();
                return audio;
            }catch{
                return null;
            }
        };

        const tone = (frequency,duration=.04,volume=.01,type='sine') => {
            if(muted) return;

            const ac = ensureAudio();
            if(!ac) return;

            const osc = ac.createOscillator();
            const gain = ac.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(frequency,ac.currentTime);

            gain.gain.setValueAtTime(volume,ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+duration);

            osc.connect(gain);
            gain.connect(ac.destination);

            osc.start();
            osc.stop(ac.currentTime+duration);
        };

        const createFood = (x=null,y=null,mass=CONFIG.foodMass,color=null,rare=false) => ({
            id:nextId++,
            x:x??rand(24,CONFIG.worldSize-24),
            y:y??rand(24,CONFIG.worldSize-24),
            mass,
            radius:rare?rand(5.8,7.8):rand(3.5,5.4),
            color:color??FOOD_COLORS[rint(0,FOOD_COLORS.length-1)],
            rare,
            pulse:rand(0,Math.PI*2)
        });

        const createSnake = (name,skin,isPlayer=false) => {
            const p = safeSpawn();
            const angle = rand(0,Math.PI*2);

            const snake = {
                id:nextId++,
                name,
                skin,
                isPlayer,
                alive:true,

                x:p.x,
                y:p.y,
                angle,
                targetAngle:angle,

                score:CONFIG.startScore,
                boostEnergy:100,
                boostTick:0,
                body:[],
                length:CONFIG.startLength,

                speed:CONFIG.baseSpeed,
                radius:CONFIG.bodyRadius,
                boosting:false,

                eyeBlink:rand(1.4,4.3),

                ai:isPlayer?null:{
                    think:rand(.08,.20),
                    goalX:rand(0,CONFIG.worldSize),
                    goalY:rand(0,CONFIG.worldSize),
                    turnBias:rand(-.45,.45),
                    boostTime:0,
                    mode:'food',
                    wander:rand(.8,2.4)
                }
            };

            for(let i=0;i<snake.length;i++){
                snake.body.push({
                    x:snake.x-Math.cos(angle)*i*CONFIG.segmentSpacing,
                    y:snake.y-Math.sin(angle)*i*CONFIG.segmentSpacing
                });
            }

            snakes.push(snake);
            return snake;
        };

        function safeSpawn(){
            for(let tries=0;tries<120;tries++){
                const p={
                    x:rand(280,CONFIG.worldSize-280),
                    y:rand(280,CONFIG.worldSize-280)
                };

                let dangerous=false;

                for(const s of snakes){
                    if(!s.alive) continue;

                    const d=Math.hypot(p.x-s.x,p.y-s.y);

                    if(d<CONFIG.safeSpawnRadius){
                        dangerous=true;
                        break;
                    }
                }

                if(!dangerous) return p;
            }

            return {
                x:rand(220,CONFIG.worldSize-220),
                y:rand(220,CONFIG.worldSize-220)
            };
        }

        const snakeLengthFromScore = score =>
            Math.max(
                CONFIG.startLength,
                CONFIG.startLength+
                Math.floor((score-CONFIG.startScore)*0.48)
            );

        const snakeWidthScale = snake => {
            // Länge bleibt der Haupt-Progress, Breite wächst aber sichtbar mit.
            // Soft cap verhindert absurd breite Schlangen.
            const growth=
                Math.log2(
                    Math.max(
                        1,
                        snake.score/
                        CONFIG.startScore
                    )
                );

            return clamp(
                1+
                growth*.105,
                1,
                1.58
            );
        };

        const snakeBodyRadius = snake =>
            CONFIG.bodyRadius*
            snakeWidthScale(snake);

        const snakeHeadRadius = snake =>
            CONFIG.headRadius*
            (
                .96+
                snakeWidthScale(snake)*.08
            );

        const snakePickupRadius = snake => {
            const width=
                snakeWidthScale(snake);

            return (
                snakeHeadRadius(snake)+
                8+
                (width-1)*18
            );
        };

        const updateSnakeBodyLength = snake => {
            snake.length = snakeLengthFromScore(snake.score);

            while(snake.body.length<snake.length){
                const tail=snake.body[snake.body.length-1]??{x:snake.x,y:snake.y};
                snake.body.push({x:tail.x,y:tail.y});
            }

            if(snake.body.length>snake.length){
                snake.body.length=snake.length;
            }
        };

        const maintainFood = () => {
            let rareCount=0;

            for(const p of food){
                if(p.rare) rareCount++;
            }

            while(food.length<CONFIG.foodTarget){
                food.push(createFood());
            }

            while(rareCount<CONFIG.rareFoodTarget){
                food.push(
                    createFood(
                        null,
                        null,
                        CONFIG.rareFoodMass,
                        '#fff16b',
                        true
                    )
                );
                rareCount++;
            }
        };

        const moveSnake = (snake,targetX,targetY,delta,boosting=false) => {
            if(!snake.alive) return;

            const desired = Math.atan2(targetY-snake.y,targetX-snake.x);
            snake.targetAngle = desired;

            const diff = normalizeAngle(desired-snake.angle);
            const turnRate = snake.isPlayer?CONFIG.turnSpeed:CONFIG.botTurnSpeed;

            const sizeTurnPenalty = clamp(1-(snake.length-24)*.0007,.64,1);

            snake.angle +=
                clamp(
                    diff,
                    -turnRate*sizeTurnPenalty*delta,
                    turnRate*sizeTurnPenalty*delta
                );

            let speed = CONFIG.baseSpeed;

            if(
                boosting &&
                snake.score>CONFIG.minScore &&
                snake.boostEnergy>2
            ){
                speed=CONFIG.boostSpeed;
                snake.boostEnergy=Math.max(0,snake.boostEnergy-CONFIG.boostDrainPerSecond*delta);
                snake.boostTick-=delta;

                if(snake.boostTick<=0){
                    snake.boostTick=CONFIG.boostPelletInterval;

                    snake.score=Math.max(
                        CONFIG.minScore,
                        snake.score-CONFIG.boostPelletMass
                    );

                    const tail=snake.body[snake.body.length-1];

                    if(tail){
                        food.push(
                            createFood(
                                tail.x+rand(-4,4),
                                tail.y+rand(-4,4),
                                CONFIG.boostPelletMass,
                                snake.skin.colors[1],
                                false
                            )
                        );
                    }
                }
            }else{
                snake.boostEnergy=Math.min(100,snake.boostEnergy+10.5*delta);
                snake.boostTick=0;
            }

            snake.boosting=
                boosting &&
                snake.score>CONFIG.minScore &&
                snake.boostEnergy>2;

            snake.speed += (speed-snake.speed)*Math.min(1,delta*(snake.boosting?12:8));

            snake.x += Math.cos(snake.angle)*snake.speed*delta;
            snake.y += Math.sin(snake.angle)*snake.speed*delta;

            const currentHeadRadius=
                snakeHeadRadius(snake);

            snake.x=clamp(
                snake.x,
                currentHeadRadius,
                CONFIG.worldSize-currentHeadRadius
            );

            snake.y=clamp(
                snake.y,
                currentHeadRadius,
                CONFIG.worldSize-currentHeadRadius
            );

            updateSnakeBodyLength(snake);

            if(!snake.body.length){
                snake.body.push({x:snake.x,y:snake.y});
            }

            // Kopf ist Segment 0. Danach folgt jedes Segment dem vorherigen
            // mit festem Abstand. Dadurch bewegt sich die komplette Schlange
            // kontinuierlich und Kurven wandern sichtbar bis zum Schwanz.
            snake.body[0].x=snake.x;
            snake.body[0].y=snake.y;

            const followSpacing=
                CONFIG.segmentSpacing*
                (
                    .96+
                    (snakeWidthScale(snake)-1)*.16
                );

            for(let i=1;i<snake.body.length;i++){
                const prev=snake.body[i-1];
                const cur=snake.body[i];

                let dx=cur.x-prev.x;
                let dy=cur.y-prev.y;
                let d=Math.hypot(dx,dy);

                if(d<0.0001){
                    const fallbackAngle=
                        snake.angle+Math.PI;

                    dx=Math.cos(fallbackAngle);
                    dy=Math.sin(fallbackAngle);
                    d=1;
                }

                const nx=dx/d;
                const ny=dy/d;

                const targetX=
                    prev.x+
                    nx*
                    followSpacing;

                const targetY=
                    prev.y+
                    ny*
                    followSpacing;

                // Fast vollständig folgen, aber ein winziger Rest-Lerp
                // verhindert hartes Knicken bei abrupten Richtungswechseln.
                const follow=
                    i<5
                        ?.96
                        :.91;

                cur.x +=
                    (targetX-cur.x)*
                    follow;

                cur.y +=
                    (targetY-cur.y)*
                    follow;
            }

            snake.eyeBlink-=delta;
            if(snake.eyeBlink<=0) snake.eyeBlink=rand(2.3,5.2);
        };

        const nearestThreat = snake => {
            let best=null;
            let bestD=Infinity;

            for(const other of snakes){
                if(!other.alive||other.id===snake.id) continue;

                const threatRadius=
                    snakeHeadRadius(snake)+
                    snakeBodyRadius(other);

                for(let i=3;i<other.body.length;i+=5){
                    const b=other.body[i];
                    const d=
                        Math.hypot(
                            snake.x-b.x,
                            snake.y-b.y
                        )-
                        threatRadius;

                    if(d<bestD){
                        bestD=d;
                        best={snake:other,point:b,d};
                    }
                }
            }

            return best;
        };

        const bestFoodTarget = snake => {
            let best=null;
            let bestScore=-Infinity;

            const samples=Math.min(140,food.length);

            for(let i=0;i<samples;i++){
                const p=food[rint(0,food.length-1)];
                if(!p) continue;

                const d=Math.hypot(snake.x-p.x,snake.y-p.y);
                if(d>900) continue;

                const score=p.mass*25-d*.055+(p.rare?75:0);

                if(score>bestScore){
                    bestScore=score;
                    best=p;
                }
            }

            return best;
        };

        const bestCutoffTarget = snake => {
            let best=null;
            let bestScore=-Infinity;

            for(const other of snakes){
                if(!other.alive||other.id===snake.id) continue;
                if(other.length<10) continue;

                const d=Math.hypot(snake.x-other.x,snake.y-other.y);
                if(d>760) continue;

                const relative=other.score/(snake.score||1);
                const frontX=other.x+Math.cos(other.angle)*105;
                const frontY=other.y+Math.sin(other.angle)*105;

                const score=
                    clamp(relative,.4,2.2)*28
                    -d*.04
                    +(snake.score>other.score?12:0);

                if(score>bestScore){
                    bestScore=score;
                    best={other,x:frontX,y:frontY,d};
                }
            }

            return best;
        };

        const wallAvoidance = snake => {
            const margin=300;
            let vx=0,vy=0;

            if(snake.x<margin) vx+=(margin-snake.x)/margin;
            if(snake.x>CONFIG.worldSize-margin) vx-=(snake.x-(CONFIG.worldSize-margin))/margin;
            if(snake.y<margin) vy+=(margin-snake.y)/margin;
            if(snake.y>CONFIG.worldSize-margin) vy-=(snake.y-(CONFIG.worldSize-margin))/margin;

            return {vx,vy,strength:Math.hypot(vx,vy)};
        };

        const updateBot = (snake,delta) => {
            const ai=snake.ai;
            if(!ai) return;

            ai.think-=delta;
            ai.wander-=delta;

            if(ai.think<=0){
                ai.think=rand(.10,.22);

                const threat=nearestThreat(snake);
                const wall=wallAvoidance(snake);
                const cutoff=bestCutoffTarget(snake);
                const pellet=bestFoodTarget(snake);

                if(threat&&threat.d<155){
                    ai.mode='evade';

                    const dx=snake.x-threat.point.x;
                    const dy=snake.y-threat.point.y;
                    const len=Math.max(1,Math.hypot(dx,dy));

                    ai.goalX=clamp(snake.x+dx/len*520+wall.vx*280,40,CONFIG.worldSize-40);
                    ai.goalY=clamp(snake.y+dy/len*520+wall.vy*280,40,CONFIG.worldSize-40);
                    ai.boostTime=rand(.22,.65);
                }else if(cutoff&&cutoff.d<560&&Math.random()<.52){
                    ai.mode='cutoff';

                    ai.goalX=clamp(cutoff.x+wall.vx*220,40,CONFIG.worldSize-40);
                    ai.goalY=clamp(cutoff.y+wall.vy*220,40,CONFIG.worldSize-40);

                    if(cutoff.d<290&&snake.score>CONFIG.minScore+8){
                        ai.boostTime=rand(.18,.48);
                    }
                }else if(pellet){
                    ai.mode='food';
                    ai.goalX=pellet.x;
                    ai.goalY=pellet.y;
                }else if(ai.wander<=0){
                    ai.mode='wander';
                    ai.wander=rand(1.2,3.2);
                    ai.turnBias+=rand(-.8,.8);

                    ai.goalX=clamp(
                        snake.x+Math.cos(snake.angle+ai.turnBias)*rand(350,850),
                        80,
                        CONFIG.worldSize-80
                    );

                    ai.goalY=clamp(
                        snake.y+Math.sin(snake.angle+ai.turnBias)*rand(350,850),
                        80,
                        CONFIG.worldSize-80
                    );
                }

                if(wall.strength>.03){
                    ai.goalX=clamp(ai.goalX+wall.vx*480,70,CONFIG.worldSize-70);
                    ai.goalY=clamp(ai.goalY+wall.vy*480,70,CONFIG.worldSize-70);
                }
            }

            ai.boostTime=Math.max(0,ai.boostTime-delta);

            moveSnake(
                snake,
                ai.goalX,
                ai.goalY,
                delta,
                ai.boostTime>0
            );
        };

        const eatFood = snake => {
            const hitRadius=snakePickupRadius(snake);

            for(let i=food.length-1;i>=0;i--){
                const p=food[i];

                if(
                    Math.abs(p.x-snake.x)>hitRadius+p.radius ||
                    Math.abs(p.y-snake.y)>hitRadius+p.radius
                ) continue;

                if(Math.hypot(p.x-snake.x,p.y-snake.y)<hitRadius+p.radius){
                    snake.score+=p.mass;
                    food.splice(i,1);

                    particles.push({
                        x:p.x,
                        y:p.y,
                        vx:rand(-28,28),
                        vy:rand(-28,28),
                        life:.30,
                        maxLife:.30,
                        color:p.color,
                        size:p.radius
                    });

                    if(snake.isPlayer&&p.rare){
                        tone(650,.035,.007,'sine');
                    }
                }
            }
        };

        const headHitsBody = (snake,other) => {
            // Eigener Körper ist absichtlich nicht tödlich.
            if(other.id===snake.id){
                return false;
            }

            const headR=
                snakeHeadRadius(snake);

            const bodyR=
                snakeBodyRadius(other);

            for(let i=3;i<other.body.length;i+=CONFIG.collisionStep){
                const b=other.body[i];
                const d=Math.hypot(snake.x-b.x,snake.y-b.y);

                if(
                    d<
                    headR+
                    bodyR*.78
                ){
                    return true;
                }
            }

            return false;
        };

        const dieSnake = (snake,killer=null) => {
            if(!snake.alive) return;

            snake.alive=false;

            const dropCount=Math.min(
                520,
                Math.max(
                    42,
                    Math.floor(
                        snake.body.length*
                        1.18
                    )
                )
            );

            for(let i=0;i<dropCount;i++){
                const t=
                    i/
                    Math.max(
                        1,
                        dropCount-1
                    );

                const index=
                    Math.floor(
                        t*
                        Math.max(
                            1,
                            snake.body.length-1
                        )
                    );

                const b=
                    snake.body[index]??
                    {x:snake.x,y:snake.y};

                // Mehrere kleine Punkte um jedes Körperstück ergeben
                // den dichten Slither-artigen "Masse-Teppich".
                const spread=
                    7+
                    snakeBodyRadius(snake)*.72;

                const angle=
                    rand(
                        0,
                        Math.PI*2
                    );

                const distance=
                    Math.abs(
                        rand(-1,1)
                    )*
                    spread;

                const rare=
                    Math.random()<.045;

                food.push(
                    createFood(
                        b.x+
                        Math.cos(angle)*
                        distance+
                        rand(-3,3),
                        b.y+
                        Math.sin(angle)*
                        distance+
                        rand(-3,3),
                        rare
                            ?rand(1.35,2.2)
                            :rand(.38,.78),
                        snake.skin.colors[
                            i%
                            snake.skin.colors.length
                        ],
                        rare
                    )
                );
            }

            for(let i=0;i<42;i++){
                particles.push({
                    x:snake.x,
                    y:snake.y,
                    vx:rand(-110,110),
                    vy:rand(-110,110),
                    life:rand(.35,.72),
                    maxLife:0,
                    color:snake.skin.colors[rint(0,snake.skin.colors.length-1)],
                    size:rand(2,6)
                });
                particles[particles.length-1].maxLife=particles[particles.length-1].life;
            }

            if(killer&&killer.alive){
                if(killer.isPlayer) kills++;

                addKillFeed(killer.name,snake.name);
            }

            if(snake.isPlayer){
                tone(145,.10,.015,'sine');
                finishGame();
            }else{
                setTimeout(()=>{
                    if(destroyed||!running) return;

                    const skin=SKINS[rint(0,SKINS.length-1)];
                    const bot=createSnake(
                        BOT_NAMES[rint(0,BOT_NAMES.length-1)],
                        skin,
                        false
                    );

                    bot.score=rand(22,42);
                    updateSnakeBodyLength(bot);
                },1200+Math.random()*1800);
            }
        };

        const checkCollisions = () => {
            for(const snake of snakes){
                if(!snake.alive) continue;

                for(const other of snakes){
                    if(
                        !other.alive||
                        other.id===snake.id
                    ) continue;

                    if(headHitsBody(snake,other)){
                        dieSnake(
                            snake,
                            other.id===snake.id?null:other
                        );
                        break;
                    }
                }

                if(!snake.alive) continue;

                const margin=snakeHeadRadius(snake);

                if(
                    snake.x<=margin ||
                    snake.y<=margin ||
                    snake.x>=CONFIG.worldSize-margin ||
                    snake.y>=CONFIG.worldSize-margin
                ){
                    dieSnake(snake,null);
                }
            }
        };

        const addKillFeed = (killer,victim) => {
            killFeed.unshift({
                id:nextId++,
                text:`${killer} eliminated ${victim}`,
                life:4.8
            });

            if(killFeed.length>6) killFeed.length=6;

            renderFeed();
        };

        const renderFeed = () => {
            feedEl.innerHTML=killFeed
                .map(item=>`
                    <div class="ss-feed-item">${escapeHtml(item.text)}</div>
                `)
                .join('');
        };

        const updateParticles = delta => {
            for(let i=particles.length-1;i>=0;i--){
                const p=particles[i];

                p.life-=delta;
                p.x+=p.vx*delta;
                p.y+=p.vy*delta;
                p.vx*=Math.pow(.93,delta*60);
                p.vy*=Math.pow(.93,delta*60);

                if(p.life<=0) particles.splice(i,1);
            }

            let changed=false;

            for(let i=killFeed.length-1;i>=0;i--){
                killFeed[i].life-=delta;

                if(killFeed[i].life<=0){
                    killFeed.splice(i,1);
                    changed=true;
                }
            }

            if(changed) renderFeed();
        };

        const updateCamera = () => {
            if(!player?.alive) return;

            camera.x+=(player.x-camera.x)*CONFIG.cameraLerp;
            camera.y+=(player.y-camera.y)*CONFIG.cameraLerp;

            const scoreFactor=clamp(
                1/Math.pow(Math.max(1,player.score/CONFIG.startScore),.10),
                .66,
                1
            );

            camera.zoom+=(CONFIG.cameraZoom*scoreFactor-camera.zoom)*.08;
        };

        const updateLeaderboard = () => {
            const ranked=snakes
                .filter(s=>s.alive)
                .slice()
                .sort((a,b)=>b.score-a.score)
                .slice(0,CONFIG.leaderboardSize);

            listEl.innerHTML=ranked
                .map((s,index)=>`
                    <div class="ss-row ${s.isPlayer?'you':''}">
                        <span class="ss-rank">${index+1}.</span>
                        <span class="ss-name">${escapeHtml(s.name)}</span>
                        <span class="ss-score">${Math.round(s.score)}</span>
                    </div>
                `)
                .join('');
        };

        const updateHud = () => {
            if(!player) return;

            bestScore=Math.max(bestScore,player.score);

            lengthEl.textContent=Math.round(player.score);
            killsEl.textContent=kills;

            boostFill.style.width=
                `${clamp(player.boostEnergy,0,100)}%`;

            updateLeaderboard();
        };

        const update = delta => {
            if(!running) return;

            matchTime+=delta;

            mouse.worldX=
                camera.x+(mouse.x-width/2)/camera.zoom;

            mouse.worldY=
                camera.y+(mouse.y-height/2)/camera.zoom;

            if(player?.alive){
                moveSnake(
                    player,
                    mouse.worldX,
                    mouse.worldY,
                    delta,
                    mouse.down||keys.boost
                );
            }

            for(const snake of snakes){
                if(!snake.alive||snake.isPlayer) continue;
                updateBot(snake,delta);
            }

            for(const snake of snakes){
                if(snake.alive) eatFood(snake);
            }

            checkCollisions();
            maintainFood();
            updateParticles(delta);
            updateCamera();
            updateHud();

            snakes=snakes.filter(s=>s.alive||s.isPlayer);
        };

        const screen = (x,y) => ({
            x:width/2+(x-camera.x)*camera.zoom,
            y:height/2+(y-camera.y)*camera.zoom
        });

        const drawHexPath = (cx,cy,size) => {
            ctx.beginPath();

            for(let i=0;i<6;i++){
                const a=
                    Math.PI/3*i-
                    Math.PI/6;

                const x=
                    cx+
                    Math.cos(a)*
                    size;

                const y=
                    cy+
                    Math.sin(a)*
                    size;

                if(i===0){
                    ctx.moveTo(x,y);
                }else{
                    ctx.lineTo(x,y);
                }
            }

            ctx.closePath();
        };

        const drawBackground = () => {
            const baseTop=
                darkMode
                    ?'#121a26'
                    :'#e9eef3';

            const baseBottom=
                darkMode
                    ?'#080d14'
                    :'#dce5ec';

            const background=
                ctx.createRadialGradient(
                    width*.50,
                    height*.46,
                    20,
                    width*.50,
                    height*.48,
                    Math.max(width,height)*.78
                );

            background.addColorStop(
                0,
                baseTop
            );

            background.addColorStop(
                1,
                baseBottom
            );

            ctx.fillStyle=background;
            ctx.fillRect(0,0,width,height);

            // Weltfeste Wabenstruktur. Die Kamera bewegt sich über das Muster,
            // anstatt dass die Textur am Screen klebt.
            const left=
                camera.x-
                width/2/camera.zoom;

            const right=
                camera.x+
                width/2/camera.zoom;

            const top=
                camera.y-
                height/2/camera.zoom;

            const bottom=
                camera.y+
                height/2/camera.zoom;

            const hexSize=48;
            const hexW=
                Math.sqrt(3)*
                hexSize;

            const rowStep=
                hexSize*
                1.5;

            const firstRow=
                Math.floor(top/rowStep)-2;

            const lastRow=
                Math.ceil(bottom/rowStep)+2;

            ctx.lineWidth=
                Math.max(
                    .75,
                    camera.zoom*.85
                );

            for(let row=firstRow;row<=lastRow;row++){
                const cy=
                    row*
                    rowStep;

                const offset=
                    Math.abs(row)%2
                        ?hexW*.5
                        :0;

                const firstCol=
                    Math.floor(
                        (left-offset)/
                        hexW
                    )-2;

                const lastCol=
                    Math.ceil(
                        (right-offset)/
                        hexW
                    )+2;

                for(let col=firstCol;col<=lastCol;col++){
                    const cx=
                        col*
                        hexW+
                        offset;

                    const p=
                        screen(cx,cy);

                    const size=
                        hexSize*
                        camera.zoom;

                    const hash=
                        Math.abs(
                            (
                                row*92821+
                                col*68917
                            )%
                            17
                        );

                    if(hash===0||hash===7){
                        ctx.fillStyle=
                            darkMode
                                ?'rgba(56,99,138,.045)'
                                :'rgba(98,141,174,.050)';

                        drawHexPath(
                            p.x,
                            p.y,
                            size
                        );

                        ctx.fill();
                    }

                    ctx.strokeStyle=
                        darkMode
                            ?'rgba(112,151,190,.085)'
                            :'rgba(82,112,136,.10)';

                    drawHexPath(
                        p.x,
                        p.y,
                        size
                    );

                    ctx.stroke();
                }
            }

            // Leichte dunkle Vignette wie bei einer Neon-Arena.
            const vignette=
                ctx.createRadialGradient(
                    width*.5,
                    height*.5,
                    Math.min(width,height)*.20,
                    width*.5,
                    height*.5,
                    Math.max(width,height)*.72
                );

            vignette.addColorStop(
                0,
                'rgba(0,0,0,0)'
            );

            vignette.addColorStop(
                1,
                darkMode
                    ?'rgba(0,0,0,.35)'
                    :'rgba(25,45,60,.11)'
            );

            ctx.fillStyle=vignette;
            ctx.fillRect(0,0,width,height);

            const a=screen(0,0);
            const z=screen(CONFIG.worldSize,CONFIG.worldSize);

            ctx.strokeStyle=
                darkMode
                    ?'rgba(94,195,255,.42)'
                    :'rgba(0,0,0,.28)';

            ctx.shadowBlur=
                darkMode
                    ?10
                    :0;

            ctx.shadowColor=
                'rgba(74,188,255,.35)';

            ctx.lineWidth=4;

            ctx.strokeRect(
                a.x,
                a.y,
                z.x-a.x,
                z.y-a.y
            );

            ctx.shadowBlur=0;
        };

        const drawFood = () => {
            const visible=[];

            for(const p of food){
                p.pulse+=.035;

                const s=
                    screen(
                        p.x,
                        p.y
                    );

                const r=
                    p.radius*
                    camera.zoom*
                    (
                        p.rare
                            ?1+
                            Math.sin(p.pulse)*
                            .10
                            :1
                    );

                if(
                    s.x<-24||
                    s.y<-24||
                    s.x>width+24||
                    s.y>height+24
                ){
                    continue;
                }

                visible.push({
                    p,
                    s,
                    r
                });
            }

            // 1) Additiver Glow-Pass. Überlappende Pellets addieren
            // ihre Helligkeit und bilden bei Todesfeldern eine zusammen-
            // hängende leuchtende Masse, ähnlich wie in Slither.io.
            ctx.save();
            ctx.globalCompositeOperation='lighter';

            for(const item of visible){
                const {p,s,r}=item;

                const halo=
                    ctx.createRadialGradient(
                        s.x,
                        s.y,
                        0,
                        s.x,
                        s.y,
                        r*
                        (
                            p.rare
                                ?3.8
                                :3.0
                        )
                    );

                halo.addColorStop(
                    0,
                    p.rare
                        ?'rgba(255,255,255,.58)'
                        :p.color+'66'
                );

                halo.addColorStop(
                    .22,
                    p.color+
                    (
                        p.rare
                            ?'aa'
                            :'58'
                    )
                );

                halo.addColorStop(
                    .58,
                    p.color+
                    (
                        p.rare
                            ?'42'
                            :'24'
                    )
                );

                halo.addColorStop(
                    1,
                    'rgba(0,0,0,0)'
                );

                ctx.fillStyle=halo;

                ctx.beginPath();
                ctx.arc(
                    s.x,
                    s.y,
                    r*
                    (
                        p.rare
                            ?3.8
                            :3.0
                    ),
                    0,
                    Math.PI*2
                );

                ctx.fill();
            }

            ctx.restore();

            // 2) Scharfe Pellet-Kerne darüber.
            for(const item of visible){
                const {p,s,r}=item;

                ctx.save();

                ctx.fillStyle=p.color;
                ctx.shadowBlur=
                    (
                        p.rare
                            ?25
                            :11
                    )*
                    camera.zoom;

                ctx.shadowColor=p.color;

                ctx.beginPath();
                ctx.arc(
                    s.x,
                    s.y,
                    Math.max(
                        1.7,
                        r
                    ),
                    0,
                    Math.PI*2
                );
                ctx.fill();

                if(p.rare){
                    ctx.fillStyle=
                        'rgba(255,255,255,.76)';

                    ctx.beginPath();
                    ctx.arc(
                        s.x-r*.25,
                        s.y-r*.28,
                        Math.max(
                            1,
                            r*.25
                        ),
                        0,
                        Math.PI*2
                    );
                    ctx.fill();
                }

                ctx.restore();
            }
        };

        const drawSnake = snake => {
            if(!snake.alive) return;

            const colors=snake.skin.colors;
            const glowColor=colors[0];

            const visible=[];

            for(let i=snake.body.length-1;i>=0;i--){
                const b=snake.body[i];
                const p=screen(b.x,b.y);

                visible.push({
                    x:p.x,
                    y:p.y,
                    index:i
                });
            }

            if(!visible.length) return;

            ctx.save();

            // Breiter Outer-Glow unter dem ganzen Körper.
            ctx.lineCap='round';
            ctx.lineJoin='round';
            ctx.strokeStyle=glowColor;
            ctx.globalAlpha=
                snake.boosting
                    ?.34
                    :.22;

            const bodyRadius=
                snakeBodyRadius(snake);

            const headRadius=
                snakeHeadRadius(snake);

            ctx.lineWidth=
                bodyRadius*
                camera.zoom*
                (snake.boosting?3.15:2.75);

            ctx.shadowBlur=
                camera.zoom*
                (snake.boosting?28:21);

            ctx.shadowColor=glowColor;

            ctx.beginPath();

            for(let i=0;i<visible.length;i++){
                const p=visible[i];

                if(i===0){
                    ctx.moveTo(p.x,p.y);
                }else{
                    ctx.lineTo(p.x,p.y);
                }
            }

            ctx.stroke();

            ctx.globalAlpha=1;
            ctx.shadowBlur=0;

            // Dunkle Unterkontur macht den Körper trotz starkem Glow lesbar.
            ctx.strokeStyle=
                darkMode
                    ?'rgba(0,0,0,.42)'
                    :'rgba(30,42,50,.30)';

            ctx.lineWidth=
                bodyRadius*
                camera.zoom*
                2.15;

            ctx.beginPath();

            for(let i=0;i<visible.length;i++){
                const p=visible[i];

                if(i===0){
                    ctx.moveTo(p.x,p.y);
                }else{
                    ctx.lineTo(p.x,p.y);
                }
            }

            ctx.stroke();

            // Überlappende runde Segmente ergeben den typischen glatten,
            // aber noch leicht gegliederten Slither-Look.
            for(let i=snake.body.length-1;i>=1;i--){
                const b=snake.body[i];
                const s=screen(b.x,b.y);
                const r=
                    bodyRadius*
                    camera.zoom;

                if(
                    s.x<-r*3||
                    s.y<-r*3||
                    s.x>width+r*3||
                    s.y>height+r*3
                ){
                    continue;
                }

                const stripe=
                    Math.floor(i/3)%
                    colors.length;

                ctx.fillStyle=
                    colors[stripe];

                ctx.shadowBlur=
                    snake.boosting
                        ?12*camera.zoom
                        :7*camera.zoom;

                ctx.shadowColor=
                    colors[stripe];

                ctx.beginPath();
                ctx.arc(
                    s.x,
                    s.y,
                    r,
                    0,
                    Math.PI*2
                );
                ctx.fill();

                // Glänzende obere linke Kante.
                const shine=
                    ctx.createRadialGradient(
                        s.x-r*.35,
                        s.y-r*.38,
                        0,
                        s.x-r*.18,
                        s.y-r*.15,
                        r*.92
                    );

                shine.addColorStop(
                    0,
                    'rgba(255,255,255,.30)'
                );

                shine.addColorStop(
                    .42,
                    'rgba(255,255,255,.08)'
                );

                shine.addColorStop(
                    1,
                    'rgba(255,255,255,0)'
                );

                ctx.fillStyle=shine;
                ctx.beginPath();
                ctx.arc(
                    s.x,
                    s.y,
                    r*.96,
                    0,
                    Math.PI*2
                );
                ctx.fill();
            }

            ctx.shadowBlur=0;

            const h=screen(snake.x,snake.y);
            const hr=
                headRadius*
                camera.zoom;

            ctx.save();
            ctx.translate(h.x,h.y);
            ctx.rotate(snake.angle);

            // Extra Neon-Halo am Kopf.
            ctx.fillStyle=colors[0];
            ctx.globalAlpha=
                snake.boosting
                    ?.32
                    :.22;

            ctx.shadowBlur=
                snake.boosting
                    ?34*camera.zoom
                    :24*camera.zoom;

            ctx.shadowColor=colors[0];

            ctx.beginPath();
            ctx.arc(
                0,
                0,
                hr*1.22,
                0,
                Math.PI*2
            );
            ctx.fill();

            ctx.globalAlpha=1;

            ctx.fillStyle=colors[0];
            ctx.strokeStyle=
                'rgba(0,0,0,.25)';

            ctx.lineWidth=
                Math.max(
                    1.4,
                    hr*.11
                );

            ctx.beginPath();
            ctx.arc(
                0,
                0,
                hr,
                0,
                Math.PI*2
            );
            ctx.fill();
            ctx.stroke();

            // Kopf-Highlight
            const headShine=
                ctx.createRadialGradient(
                    -hr*.34,
                    -hr*.34,
                    0,
                    0,
                    0,
                    hr
                );

            headShine.addColorStop(
                0,
                'rgba(255,255,255,.35)'
            );

            headShine.addColorStop(
                .48,
                'rgba(255,255,255,.08)'
            );

            headShine.addColorStop(
                1,
                'rgba(255,255,255,0)'
            );

            ctx.fillStyle=headShine;
            ctx.beginPath();
            ctx.arc(
                0,
                0,
                hr*.96,
                0,
                Math.PI*2
            );
            ctx.fill();

            ctx.shadowBlur=0;

            // Große seitliche Cartoon-Augen.
            const eyeY=hr*.46;
            const eyeX=hr*.49;
            const eyeR=
                Math.max(
                    2.3,
                    hr*.29
                );

            const pupilR=
                Math.max(
                    1.15,
                    eyeR*.45
                );

            const blink=
                snake.eyeBlink<.12
                    ?.12
                    :1;

            ctx.fillStyle='#fff';

            for(const y of [-eyeY,eyeY]){
                ctx.save();
                ctx.translate(eyeX,y);
                ctx.scale(1,blink);

                ctx.shadowBlur=
                    darkMode
                        ?5
                        :1;

                ctx.shadowColor=
                    '#ffffff88';

                ctx.beginPath();
                ctx.arc(
                    0,
                    0,
                    eyeR,
                    0,
                    Math.PI*2
                );
                ctx.fill();
                ctx.restore();
            }

            ctx.shadowBlur=0;

            ctx.fillStyle='#14202b';

            ctx.beginPath();
            ctx.arc(
                eyeX+eyeR*.29,
                -eyeY,
                pupilR,
                0,
                Math.PI*2
            );

            ctx.arc(
                eyeX+eyeR*.29,
                eyeY,
                pupilR,
                0,
                Math.PI*2
            );

            ctx.fill();

            ctx.restore();

            // Name über dem Kopf.
            if(hr>8){
                ctx.fillStyle=
                    darkMode
                        ?'rgba(255,255,255,.96)'
                        :'rgba(24,34,44,.90)';

                ctx.strokeStyle=
                    darkMode
                        ?'rgba(0,0,0,.70)'
                        :'rgba(255,255,255,.82)';

                ctx.lineWidth=3;
                ctx.textAlign='center';
                ctx.textBaseline='middle';

                const font=
                    Math.max(
                        8,
                        Math.min(
                            14,
                            hr*.82
                        )
                    );

                ctx.font=
                    `900 ${font}px Arial`;

                const y=
                    h.y-
                    hr-
                    13;

                ctx.strokeText(
                    snake.name,
                    h.x,
                    y
                );

                ctx.fillText(
                    snake.name,
                    h.x,
                    y
                );
            }

            ctx.restore();
        };

        const drawParticles = () => {
            for(const p of particles){
                const s=screen(p.x,p.y);

                ctx.save();
                ctx.globalAlpha=clamp(p.life/p.maxLife,0,1);
                ctx.fillStyle=p.color;
                ctx.shadowBlur=13*camera.zoom;
                ctx.shadowColor=p.color;
                ctx.beginPath();
                ctx.arc(s.x,s.y,p.size*camera.zoom,0,Math.PI*2);
                ctx.fill();
                ctx.restore();
            }
        };

        const drawMini = () => {
            const r=mini.getBoundingClientRect();
            const mw=r.width,mh=r.height;
            const md=Math.min(2,window.devicePixelRatio||1);

            const pw=Math.max(1,Math.round(mw*md));
            const ph=Math.max(1,Math.round(mh*md));

            if(mini.width!==pw||mini.height!==ph){
                mini.width=pw;
                mini.height=ph;
                mctx.setTransform(md,0,0,md,0,0);
            }

            mctx.fillStyle=darkMode?'#111923':'#eef2f5';
            mctx.fillRect(0,0,mw,mh);

            // Dezente Mini-Wabenstruktur.
            const hs=12;
            const hw=Math.sqrt(3)*hs;
            const hy=hs*1.5;

            mctx.strokeStyle=
                darkMode
                    ?'rgba(120,160,195,.07)'
                    :'rgba(70,100,125,.08)';

            mctx.lineWidth=.6;

            for(let row=-1;row<Math.ceil(mh/hy)+1;row++){
                const cy=row*hy;
                const offset=
                    Math.abs(row)%2
                        ?hw*.5
                        :0;

                for(let col=-1;col<Math.ceil(mw/hw)+1;col++){
                    const cx=
                        col*hw+
                        offset;

                    mctx.beginPath();

                    for(let k=0;k<6;k++){
                        const a=
                            Math.PI/3*k-
                            Math.PI/6;

                        const x=
                            cx+
                            Math.cos(a)*
                            hs;

                        const y=
                            cy+
                            Math.sin(a)*
                            hs;

                        if(k===0)mctx.moveTo(x,y);
                        else mctx.lineTo(x,y);
                    }

                    mctx.closePath();
                    mctx.stroke();
                }
            }

            mctx.strokeStyle=darkMode?'rgba(255,255,255,.20)':'rgba(0,0,0,.22)';
            mctx.strokeRect(.5,.5,mw-1,mh-1);

            const sx=mw/CONFIG.worldSize;
            const sy=mh/CONFIG.worldSize;

            for(const snake of snakes){
                if(!snake.alive) continue;

                mctx.fillStyle=snake.isPlayer?snake.skin.colors[0]:'rgba(160,170,180,.45)';

                mctx.beginPath();
                mctx.arc(
                    snake.x*sx,
                    snake.y*sy,
                    snake.isPlayer?4:1.6,
                    0,
                    Math.PI*2
                );
                mctx.fill();
            }
        };

        const draw = () => {
            drawBackground();
            drawFood();

            const sorted=snakes
                .filter(s=>s.alive)
                .slice()
                .sort((a,b)=>a.score-b.score);

            for(const snake of sorted){
                drawSnake(snake);
            }

            drawParticles();

            if(running) drawMini();
        };

        const finishGame = () => {
            if(gameOver) return;

            gameOver=true;
            running=false;

            const score=Math.round(
                bestScore*70+
                kills*850+
                matchTime*2
            );

            services?.highscores?.saveHighscore?.(
                'neon-serpent',
                score
            );

            endLength.textContent=Math.round(bestScore);
            endKills.textContent=kills;
            endTime.textContent=formatTime(matchTime);
            endScore.textContent=score.toLocaleString('de-DE');

            end.classList.remove('hidden');
        };

        const reset = () => {
            nextId=1;
            snakes=[];
            food=[];
            particles=[];
            killFeed=[];

            matchTime=0;
            bestScore=CONFIG.startScore;
            kills=0;

            player=createSnake(
                playerName,
                selectedSkin,
                true
            );

            camera.x=player.x;
            camera.y=player.y;
            camera.zoom=CONFIG.cameraZoom;

            for(let i=0;i<CONFIG.botCount;i++){
                const skin=SKINS[(i+2)%SKINS.length];
                const bot=createSnake(
                    BOT_NAMES[i%BOT_NAMES.length],
                    skin,
                    false
                );

                bot.score=rand(22,62);
                updateSnakeBodyLength(bot);
            }

            maintainFood();
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

            mouse.x=width*.64;
            mouse.y=height*.50;
        };

        const onMouseMove = e => {
            const r=canvas.getBoundingClientRect();

            mouse.x=e.clientX-r.left;
            mouse.y=e.clientY-r.top;
        };

        const onMouseDown = e => {
            if(e.button===0){
                mouse.down=true;
                ensureAudio();
            }
        };

        const onMouseUp = e => {
            if(e.button===0) mouse.down=false;
        };

        const onKeyDown = e => {
            if(e.code==='Space'){
                e.preventDefault();
                keys.boost=true;
            }

            if(
                e.code==='Enter' &&
                !running &&
                !menu.classList.contains('hidden')
            ){
                start();
            }
        };

        const onKeyUp = e => {
            if(e.code==='Space'){
                keys.boost=false;
            }
        };

        skinButtons.forEach(button=>{
            button.addEventListener('click',()=>{
                const skin=SKINS.find(s=>s.id===button.dataset.skin);
                if(!skin) return;

                selectedSkin=skin;

                skinButtons.forEach(b=>
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

        themeBtn.addEventListener('click',()=>{
            darkMode=!darkMode;
            root.classList.toggle('light',!darkMode);

            themeBtn.textContent=
                darkMode
                    ?'Light Mode'
                    :'Dark Mode';
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

            const delta=Math.min(
                .033,
                Math.max(0,(timestamp-lastFrame)/1000)
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
    SKINS,
    FOOD_COLORS,
    BOT_NAMES
};
