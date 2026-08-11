const OWNER = {
    NEUTRAL: 0,
    PLAYER: 1,
    AI: 2
};

const CONFIG = {
    minIslands: 9,
    maxIslands: 14,
    maxTroopsPerIsland: 999,
    armySpeed: 118,
    aiThinkMin: 0.75,
    aiThinkMax: 1.35,
    defaultSendPercent: 50,
    minSendPercent: 5,
    maxSendPercent: 100,
    sendStep: 5,
    startTroopsMin: 22,
    startTroopsMax: 31,
    neutralTroopsMin: 3,
    neutralTroopsMax: 23
};

const COLORS = {
    background: '#07101d',
    background2: '#0a1727',
    grid: 'rgba(111, 177, 223, .055)',
    neutral: '#8393a7',
    neutralDark: '#3b4654',
    player: '#28dcff',
    playerBright: '#8cf4ff',
    playerDark: '#086a8d',
    ai: '#ff4f72',
    aiBright: '#ff9aae',
    aiDark: '#9b1539',
    text: '#f4f8ff',
    muted: '#91a4bb'
};

export default {
    manifest: {
        id: 'island-conquest',
        name: 'Island Conquest',
        description: 'Erobere Inseln, produziere Truppen und schlage die KI in Echtzeit.',
        icon: '🏝️',
        tags: ['Strategy', 'Realtime', 'Conquest', 'AI']
    },

    init: (container, services) => {
        let destroyed = false;
        let animationId = null;
        let resizeObserver = null;
        let lastFrame = performance.now();
        let gameRunning = false;
        let gameEnded = false;
        let elapsedTime = 0;
        let aiThinkTimer = 1;
        let sendPercent = CONFIG.defaultSendPercent;
        let islands = [];
        let armies = [];
        let nextArmyId = 1;
        let playerCaptures = 0;
        let initialWidth = 0;
        let initialHeight = 0;
        let dragging = null;
        let hoverIslandId = null;
        let pointer = { x: 0, y: 0 };

        const style = document.createElement('style');
        style.textContent = `
            .ic-game {
                width:100%; height:100%; position:relative; overflow:hidden;
                background:#07101d; color:#f4f8ff; font-family:inherit;
                user-select:none;
            }
            .ic-game * { box-sizing:border-box; }
            .ic-canvas { width:100%; height:100%; display:block; touch-action:none; }

            .ic-hud {
                position:absolute; inset:14px 16px auto 16px; display:grid;
                grid-template-columns:1fr auto 1fr; align-items:start; gap:10px;
                z-index:10; pointer-events:none;
            }
            .ic-hud-side { display:flex; gap:8px; flex-wrap:wrap; }
            .ic-hud-side.right { justify-content:flex-end; }
            .ic-chip {
                min-width:108px; padding:9px 12px; border-radius:12px;
                border:1px solid rgba(255,255,255,.08); background:rgba(10,20,34,.78);
                backdrop-filter:blur(10px); box-shadow:0 8px 24px rgba(0,0,0,.16);
            }
            .ic-chip-label { color:#8195ad; font-size:.64rem; font-weight:850; text-transform:uppercase; letter-spacing:.08em; }
            .ic-chip-value { margin-top:2px; font-size:.98rem; font-weight:950; }
            .ic-chip.player .ic-chip-value { color:${COLORS.playerBright}; }
            .ic-chip.ai .ic-chip-value { color:${COLORS.aiBright}; }
            .ic-chip.neutral .ic-chip-value { color:#c2ccd7; }
            .ic-time {
                padding:9px 15px; min-width:100px; text-align:center; border-radius:12px;
                border:1px solid rgba(255,255,255,.08); background:rgba(10,20,34,.78);
                backdrop-filter:blur(10px); font-weight:900; font-variant-numeric:tabular-nums;
            }

            .ic-controls {
                position:absolute; left:50%; bottom:18px; transform:translateX(-50%);
                width:min(540px,calc(100% - 32px)); z-index:15;
                padding:12px 15px 13px; border-radius:16px;
                border:1px solid rgba(255,255,255,.10); background:rgba(10,20,34,.88);
                backdrop-filter:blur(14px); box-shadow:0 16px 44px rgba(0,0,0,.32);
            }
            .ic-control-top { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:9px; }
            .ic-control-title { font-size:.72rem; color:#91a4bb; font-weight:850; text-transform:uppercase; letter-spacing:.08em; }
            .ic-send-value { color:${COLORS.playerBright}; font-size:1.08rem; font-weight:950; }
            .ic-range {
                width:100%; accent-color:${COLORS.player}; cursor:pointer;
            }
            .ic-range-labels { display:flex; justify-content:space-between; color:#60758e; font-size:.62rem; margin-top:2px; }
            .ic-help { margin-top:7px; color:#7890aa; text-align:center; font-size:.68rem; }

            .ic-map-btn {
                position:absolute; right:17px; bottom:20px; z-index:16;
                border:1px solid rgba(255,255,255,.10); border-radius:12px;
                padding:10px 13px; cursor:pointer; color:#d6e2ef; font:inherit; font-weight:800;
                background:rgba(10,20,34,.86); backdrop-filter:blur(10px);
            }
            .ic-map-btn:hover { background:rgba(255,255,255,.08); }

            .ic-overlay {
                position:absolute; inset:0; z-index:30; display:flex; align-items:center; justify-content:center;
                padding:26px; background:rgba(4,9,16,.67); backdrop-filter:blur(8px);
            }
            .ic-overlay.hidden { display:none; }
            .ic-card {
                width:min(720px,100%); padding:30px; border-radius:22px;
                border:1px solid rgba(255,255,255,.10);
                background:linear-gradient(180deg,rgba(28,46,68,.97),rgba(13,25,40,.97));
                box-shadow:0 30px 90px rgba(0,0,0,.45);
            }
            .ic-kicker { color:${COLORS.player}; font-size:.73rem; font-weight:950; letter-spacing:.16em; text-transform:uppercase; }
            .ic-title { margin:6px 0 8px; font-size:clamp(2.2rem,5vw,3.7rem); line-height:1; font-weight:950; letter-spacing:-.04em; }
            .ic-desc { color:#91a4bb; line-height:1.55; margin-bottom:20px; }
            .ic-rules { display:grid; grid-template-columns:repeat(3,1fr); gap:9px; margin-bottom:20px; }
            .ic-rule { padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,.065); background:rgba(255,255,255,.025); }
            .ic-rule b { display:block; font-size:.82rem; margin-bottom:3px; }
            .ic-rule span { color:#8296ae; font-size:.72rem; line-height:1.4; }
            .ic-start {
                width:100%; padding:14px 18px; border:0; border-radius:13px; cursor:pointer;
                color:#07131d; font:inherit; font-weight:950;
                background:linear-gradient(135deg,${COLORS.player},#4387ff);
                box-shadow:0 14px 34px rgba(40,220,255,.16);
            }
            .ic-start:hover { filter:brightness(1.08); transform:translateY(-1px); }

            .ic-end-title { font-size:2.3rem; font-weight:950; margin-bottom:7px; }
            .ic-end-title.win { color:${COLORS.playerBright}; }
            .ic-end-title.lose { color:${COLORS.aiBright}; }
            .ic-end-sub { color:#91a4bb; line-height:1.5; margin-bottom:18px; }
            .ic-end-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:9px; margin-bottom:18px; }
            .ic-end-stat { padding:12px; text-align:center; border-radius:12px; background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.065); }
            .ic-end-stat span { display:block; color:#8194aa; font-size:.65rem; text-transform:uppercase; font-weight:850; }
            .ic-end-stat b { display:block; margin-top:3px; font-size:1.15rem; }

            @media (max-width:760px) {
                .ic-hud { inset:8px 8px auto 8px; grid-template-columns:1fr auto 1fr; gap:5px; }
                .ic-chip { min-width:0; padding:7px 8px; }
                .ic-chip-label { font-size:.55rem; }
                .ic-chip-value { font-size:.78rem; }
                .ic-time { min-width:68px; padding:7px; font-size:.78rem; }
                .ic-rules { grid-template-columns:1fr; }
                .ic-map-btn { bottom:98px; right:10px; }
                .ic-controls { bottom:10px; }
                .ic-card { padding:21px; }
            }
        `;

        const root = document.createElement('div');
        root.className = 'ic-game';
        root.innerHTML = `
            <canvas class="ic-canvas"></canvas>

            <div class="ic-hud">
                <div class="ic-hud-side">
                    <div class="ic-chip player">
                        <div class="ic-chip-label">Deine Inseln</div>
                        <div class="ic-chip-value ic-player-islands">0</div>
                    </div>
                    <div class="ic-chip player">
                        <div class="ic-chip-label">Deine Truppen</div>
                        <div class="ic-chip-value ic-player-troops">0</div>
                    </div>
                </div>

                <div class="ic-time">00:00</div>

                <div class="ic-hud-side right">
                    <div class="ic-chip ai">
                        <div class="ic-chip-label">KI Inseln</div>
                        <div class="ic-chip-value ic-ai-islands">0</div>
                    </div>
                    <div class="ic-chip neutral">
                        <div class="ic-chip-label">Neutral</div>
                        <div class="ic-chip-value ic-neutral-islands">0</div>
                    </div>
                </div>
            </div>

            <div class="ic-controls">
                <div class="ic-control-top">
                    <span class="ic-control-title">Truppen pro Angriff</span>
                    <span class="ic-send-value">50%</span>
                </div>
                <input class="ic-range" type="range" min="${CONFIG.minSendPercent}" max="${CONFIG.maxSendPercent}" step="${CONFIG.sendStep}" value="${CONFIG.defaultSendPercent}">
                <div class="ic-range-labels"><span>5%</span><span>50%</span><span>100%</span></div>
                <div class="ic-help">Von einer cyanfarbenen Insel auf eine graue oder rote Insel ziehen.</div>
            </div>

            <button class="ic-map-btn" type="button">Neue Map</button>

            <div class="ic-overlay ic-start-overlay">
                <div class="ic-card">
                    <div class="ic-kicker">Realtime Strategy</div>
                    <div class="ic-title">Island Conquest</div>
                    <div class="ic-desc">
                        Baue automatisch Truppen auf deinen Inseln auf, entscheide wann du angreifst und dominiere die zufällig erzeugte Karte vor der KI.
                    </div>
                    <div class="ic-rules">
                        <div class="ic-rule"><b>Angreifen</b><span>Ziehe von deiner Insel auf eine neutrale oder feindliche Insel.</span></div>
                        <div class="ic-rule"><b>Kämpfen</b><span>20 Angreifer gegen 15 Verteidiger = Eroberung mit 5 übrigen Truppen.</span></div>
                        <div class="ic-rule"><b>Abfangen</b><span>Feindliche Armeen können sich bereits unterwegs treffen und gegenseitig dezimieren.</span></div>
                    </div>
                    <button class="ic-start" type="button">Zufälliges Level starten</button>
                </div>
            </div>

            <div class="ic-overlay ic-end-overlay hidden">
                <div class="ic-card">
                    <div class="ic-end-title"></div>
                    <div class="ic-end-sub"></div>
                    <div class="ic-end-stats">
                        <div class="ic-end-stat"><span>Zeit</span><b class="ic-end-time">00:00</b></div>
                        <div class="ic-end-stat"><span>Eroberungen</span><b class="ic-end-captures">0</b></div>
                        <div class="ic-end-stat"><span>Score</span><b class="ic-end-score">0</b></div>
                    </div>
                    <button class="ic-start ic-restart" type="button">Neue zufällige Map</button>
                </div>
            </div>
        `;

        container.append(style, root);

        const canvas = root.querySelector('.ic-canvas');
        const ctx = canvas.getContext('2d');
        const startOverlay = root.querySelector('.ic-start-overlay');
        const endOverlay = root.querySelector('.ic-end-overlay');
        const startBtn = root.querySelector('.ic-start-overlay .ic-start');
        const restartBtn = root.querySelector('.ic-restart');
        const mapBtn = root.querySelector('.ic-map-btn');
        const rangeEl = root.querySelector('.ic-range');
        const sendValueEl = root.querySelector('.ic-send-value');
        const playerIslandsEl = root.querySelector('.ic-player-islands');
        const playerTroopsEl = root.querySelector('.ic-player-troops');
        const aiIslandsEl = root.querySelector('.ic-ai-islands');
        const neutralIslandsEl = root.querySelector('.ic-neutral-islands');
        const timeEl = root.querySelector('.ic-time');
        const endTitleEl = root.querySelector('.ic-end-title');
        const endSubEl = root.querySelector('.ic-end-sub');
        const endTimeEl = root.querySelector('.ic-end-time');
        const endCapturesEl = root.querySelector('.ic-end-captures');
        const endScoreEl = root.querySelector('.ic-end-score');

        const rand = (min, max) => min + Math.random() * (max - min);
        const randInt = (min, max) => Math.floor(rand(min, max + 1));
        const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
        const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
        const ownerColor = owner => owner === OWNER.PLAYER ? COLORS.player : owner === OWNER.AI ? COLORS.ai : COLORS.neutral;
        const ownerBright = owner => owner === OWNER.PLAYER ? COLORS.playerBright : owner === OWNER.AI ? COLORS.aiBright : '#d0d9e2';

        const formatTime = seconds => {
            const whole = Math.max(0, Math.floor(seconds));
            const min = Math.floor(whole / 60).toString().padStart(2, '0');
            const sec = (whole % 60).toString().padStart(2, '0');
            return `${min}:${sec}`;
        };

        const resizeCanvas = () => {
            const rect = root.getBoundingClientRect();
            const cssWidth = Math.max(1, rect.width);
            const cssHeight = Math.max(1, rect.height);
            const dpr = Math.min(2, window.devicePixelRatio || 1);

            if (initialWidth && initialHeight && islands.length) {
                const sx = cssWidth / initialWidth;
                const sy = cssHeight / initialHeight;
                islands.forEach(i => {
                    i.x *= sx;
                    i.y *= sy;
                });
                armies.forEach(a => {
                    a.x *= sx;
                    a.y *= sy;
                });
            }

            initialWidth = cssWidth;
            initialHeight = cssHeight;
            canvas.width = Math.round(cssWidth * dpr);
            canvas.height = Math.round(cssHeight * dpr);
            canvas.style.width = `${cssWidth}px`;
            canvas.style.height = `${cssHeight}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const createIslandShape = seed => {
            const points = [];
            let state = seed * 99991 + 17;
            const random = () => {
                state = (state * 1664525 + 1013904223) >>> 0;
                return state / 4294967296;
            };
            const pointCount = 10;
            for (let i = 0; i < pointCount; i++) {
                points.push(0.88 + random() * 0.24);
            }
            return points;
        };

        const generateLevel = () => {
            islands = [];
            armies = [];
            nextArmyId = 1;
            playerCaptures = 0;
            dragging = null;
            hoverIslandId = null;

            const w = initialWidth;
            const h = initialHeight;
            const total = randInt(CONFIG.minIslands, CONFIG.maxIslands);
            const bottomReserved = 118;
            const topReserved = 84;
            const paddingX = Math.max(56, Math.min(92, w * 0.06));
            const minGap = clamp(Math.min(w, h) * 0.135, 92, 145);

            let attempts = 0;
            while (islands.length < total && attempts < 3000) {
                attempts++;
                const radius = rand(29, 43);
                const x = rand(paddingX + radius, w - paddingX - radius);
                const y = rand(topReserved + radius, h - bottomReserved - radius);
                const okay = islands.every(other => Math.hypot(x - other.x, y - other.y) > minGap + radius * 0.25 + other.radius * 0.25);
                if (!okay) continue;

                islands.push({
                    id: islands.length + 1,
                    x, y, radius,
                    owner: OWNER.NEUTRAL,
                    troops: randInt(CONFIG.neutralTroopsMin, CONFIG.neutralTroopsMax),
                    genRate: rand(0.62, 1.18) * (0.88 + (radius - 29) / 55),
                    seed: randInt(1, 999999),
                    shape: null
                });
            }

            // Fallback für sehr kleine/ungewöhnliche Container.
            if (islands.length < Math.min(total, 7)) {
                islands = [];
                const cols = Math.ceil(Math.sqrt(total * (w / Math.max(1, h))));
                const rows = Math.ceil(total / cols);
                const usableH = h - topReserved - bottomReserved;
                for (let n = 0; n < total; n++) {
                    const c = n % cols;
                    const r = Math.floor(n / cols);
                    const x = paddingX + (c + .5) * ((w - paddingX * 2) / cols);
                    const y = topReserved + (r + .5) * (usableH / rows);
                    const radius = clamp(Math.min((w / cols), (usableH / rows)) * .22, 25, 40);
                    islands.push({
                        id:n + 1, x, y, radius, owner:OWNER.NEUTRAL,
                        troops:randInt(3, 18), genRate:rand(.65, 1.1), seed:randInt(1,999999), shape:null
                    });
                }
            }

            islands.forEach(i => i.shape = createIslandShape(i.seed));

            const byX = [...islands].sort((a, b) => a.x - b.x);
            const playerStartCount = islands.length >= 12 && Math.random() < 0.30 ? 2 : 1;
            const aiStartCount = islands.length >= 12 && Math.random() < 0.30 ? 2 : 1;

            const playerStarts = byX.slice(0, Math.min(4, byX.length));
            const aiStarts = byX.slice(-Math.min(4, byX.length)).reverse();
            const chosen = new Set();

            const chooseSeparated = (pool, amount, owner) => {
                let picked = 0;
                for (const island of pool) {
                    if (picked >= amount) break;
                    if (chosen.has(island.id)) continue;
                    if ([...chosen].some(id => distance(island, islands.find(i => i.id === id)) < minGap * .78)) continue;
                    island.owner = owner;
                    island.troops = randInt(CONFIG.startTroopsMin, CONFIG.startTroopsMax);
                    chosen.add(island.id);
                    picked++;
                }
                if (picked === 0) {
                    const island = pool.find(i => !chosen.has(i.id));
                    if (island) {
                        island.owner = owner;
                        island.troops = randInt(CONFIG.startTroopsMin, CONFIG.startTroopsMax);
                        chosen.add(island.id);
                    }
                }
            };

            chooseSeparated(playerStarts, playerStartCount, OWNER.PLAYER);
            chooseSeparated(aiStarts, aiStartCount, OWNER.AI);

            // Mindestens je eine Startinsel garantieren.
            if (!islands.some(i => i.owner === OWNER.PLAYER)) {
                byX[0].owner = OWNER.PLAYER;
                byX[0].troops = CONFIG.startTroopsMax;
            }
            if (!islands.some(i => i.owner === OWNER.AI)) {
                byX[byX.length - 1].owner = OWNER.AI;
                byX[byX.length - 1].troops = CONFIG.startTroopsMax;
            }

            // Die jeweils nächste neutrale Insel bekommt eher schwache Verteidigung,
            // damit beide Seiten mehrere sinnvolle Eröffnungen haben.
            for (const owner of [OWNER.PLAYER, OWNER.AI]) {
                const starts = islands.filter(i => i.owner === owner);
                const neutral = islands.filter(i => i.owner === OWNER.NEUTRAL);
                const nearest = neutral
                    .map(n => ({ island:n, d:Math.min(...starts.map(s => distance(s, n))) }))
                    .sort((a,b) => a.d - b.d)
                    .slice(0, Math.min(2, neutral.length));
                nearest.forEach((entry, index) => {
                    entry.island.troops = Math.min(entry.island.troops, randInt(4 + index * 2, 9 + index * 3));
                });
            }
        };

        const islandAt = (x, y) => {
            let best = null;
            let bestDistance = Infinity;
            for (const island of islands) {
                const d = Math.hypot(x - island.x, y - island.y);
                if (d <= island.radius + 10 && d < bestDistance) {
                    best = island;
                    bestDistance = d;
                }
            }
            return best;
        };

        const getCanvasPoint = event => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        };

        const sendArmy = (source, target, percent, owner = source.owner) => {
            if (!source || !target || source.id === target.id) return false;
            if (source.owner !== owner || target.owner === owner) return false;

            const available = Math.floor(source.troops);
            const count = Math.floor(available * (percent / 100));
            if (count <= 0) return false;

            source.troops -= count;
            const angle = Math.atan2(target.y - source.y, target.x - source.x);
            const offset = source.radius * .72;

            armies.push({
                id: nextArmyId++, owner, count,
                x: source.x + Math.cos(angle) * offset,
                y: source.y + Math.sin(angle) * offset,
                targetIslandId: target.id,
                sourceIslandId: source.id,
                vx: Math.cos(angle), vy: Math.sin(angle),
                speed: CONFIG.armySpeed * rand(.96, 1.04)
            });
            return true;
        };

        const resolveArrival = army => {
            const target = islands.find(i => i.id === army.targetIslandId);
            if (!target) return;

            if (target.owner === army.owner) {
                target.troops = Math.min(CONFIG.maxTroopsPerIsland, target.troops + army.count);
                return;
            }

            const previousOwner = target.owner;
            if (army.count > target.troops) {
                target.troops = army.count - target.troops;
                target.owner = army.owner;
                if (army.owner === OWNER.PLAYER && previousOwner !== OWNER.PLAYER) {
                    playerCaptures++;
                }
            } else {
                // Bei Gleichstand bleibt die Insel beim Verteidiger mit exakt 0 Truppen.
                target.troops = Math.max(0, target.troops - army.count);
            }
        };

        const formationRadius = army => {
            if (army.count < 10) return 7;
            if (army.count < 25) return 10;
            if (army.count < 50) return 13;
            if (army.count < 100) return 16;
            return 19;
        };

        const resolveArmyCollisions = () => {
            const dead = new Set();

            for (let i = 0; i < armies.length; i++) {
                const a = armies[i];
                if (dead.has(a.id)) continue;

                for (let j = i + 1; j < armies.length; j++) {
                    const b = armies[j];
                    if (dead.has(b.id) || a.owner === b.owner) continue;

                    const hitDistance = Math.max(12, (formationRadius(a) + formationRadius(b)) * .75);
                    if (Math.hypot(a.x - b.x, a.y - b.y) > hitDistance) continue;

                    if (a.count === b.count) {
                        dead.add(a.id);
                        dead.add(b.id);
                        break;
                    }

                    if (a.count > b.count) {
                        a.count -= b.count;
                        dead.add(b.id);
                    } else {
                        b.count -= a.count;
                        dead.add(a.id);
                        break;
                    }
                }
            }

            if (dead.size) armies = armies.filter(a => !dead.has(a.id));
        };

        const updateArmies = delta => {
            const arrived = new Set();

            for (const army of armies) {
                const target = islands.find(i => i.id === army.targetIslandId);
                if (!target) {
                    arrived.add(army.id);
                    continue;
                }

                const dx = target.x - army.x;
                const dy = target.y - army.y;
                const dist = Math.hypot(dx, dy);
                const step = army.speed * delta;

                if (dist <= target.radius * .70 + step) {
                    resolveArrival(army);
                    arrived.add(army.id);
                    continue;
                }

                army.vx = dx / Math.max(.001, dist);
                army.vy = dy / Math.max(.001, dist);
                army.x += army.vx * step;
                army.y += army.vy * step;
            }

            if (arrived.size) armies = armies.filter(a => !arrived.has(a.id));
            resolveArmyCollisions();
        };

        const chooseAiAction = () => {
            const sources = islands
                .filter(i => i.owner === OWNER.AI && Math.floor(i.troops) >= 8)
                .sort((a, b) => b.troops - a.troops);
            if (!sources.length) return;

            let bestAction = null;

            for (const source of sources.slice(0, 5)) {
                const targets = islands.filter(i => i.id !== source.id && i.owner !== OWNER.AI);
                for (const target of targets) {
                    const percent = target.owner === OWNER.PLAYER
                        ? clamp(randInt(60, 85), 5, 100)
                        : clamp(randInt(45, 72), 5, 100);
                    const sent = Math.floor(Math.floor(source.troops) * percent / 100);
                    if (sent <= 0) continue;

                    const margin = sent - target.troops;
                    const dist = distance(source, target);
                    const captureValue = margin > 0 ? 68 + Math.min(40, margin * 1.8) : -Math.abs(margin) * 3.2;
                    const ownerBonus = target.owner === OWNER.PLAYER ? 34 : 12;
                    const productionValue = target.genRate * 24;
                    const distancePenalty = dist * .065;
                    const randomness = rand(-9, 17);
                    const score = captureValue + ownerBonus + productionValue - distancePenalty + randomness;

                    if (!bestAction || score > bestAction.score) {
                        bestAction = { source, target, percent, score, margin };
                    }
                }
            }

            if (!bestAction) return;

            // Die KI wartet bei sehr schlechten Situationen häufig und spart Truppen.
            if (bestAction.score < 15 && Math.random() < .80) return;
            if (bestAction.margin < -8 && Math.random() < .70) return;

            sendArmy(bestAction.source, bestAction.target, bestAction.percent, OWNER.AI);
        };

        const updateAi = delta => {
            aiThinkTimer -= delta;
            if (aiThinkTimer > 0) return;
            aiThinkTimer = rand(CONFIG.aiThinkMin, CONFIG.aiThinkMax);
            chooseAiAction();
        };

        const totalTroopsFor = owner => {
            const onIslands = islands
                .filter(i => i.owner === owner)
                .reduce((sum, island) => sum + Math.floor(island.troops), 0);
            const moving = armies
                .filter(a => a.owner === owner)
                .reduce((sum, army) => sum + army.count, 0);
            return onIslands + moving;
        };

        const updateHud = () => {
            playerIslandsEl.textContent = islands.filter(i => i.owner === OWNER.PLAYER).length;
            aiIslandsEl.textContent = islands.filter(i => i.owner === OWNER.AI).length;
            neutralIslandsEl.textContent = islands.filter(i => i.owner === OWNER.NEUTRAL).length;
            playerTroopsEl.textContent = totalTroopsFor(OWNER.PLAYER);
            timeEl.textContent = formatTime(elapsedTime);
        };

        const calculateScore = () => {
            const troops = totalTroopsFor(OWNER.PLAYER);
            return Math.max(0, Math.round(18000 - elapsedTime * 35 + playerCaptures * 320 + troops * 12));
        };

        const checkGameEnd = () => {
            if (gameEnded || !gameRunning || !islands.length) return;

            const allPlayer = islands.every(i => i.owner === OWNER.PLAYER) && !armies.some(a => a.owner === OWNER.AI);
            const allAi = islands.every(i => i.owner === OWNER.AI) && !armies.some(a => a.owner === OWNER.PLAYER);

            if (allPlayer) endGame(true);
            else if (allAi) endGame(false);
        };

        const endGame = won => {
            gameEnded = true;
            gameRunning = false;
            dragging = null;

            const score = won ? calculateScore() : 0;
            if (won) services?.highscores?.saveHighscore?.('island-conquest', score);

            endTitleEl.className = `ic-end-title ${won ? 'win' : 'lose'}`;
            endTitleEl.textContent = won ? 'KARTE EROBERT!' : 'DU WURDEST EROBERT';
            endSubEl.textContent = won
                ? 'Alle Inseln gehören dir und die letzte feindliche Armee wurde vernichtet.'
                : 'Die KI kontrolliert die gesamte Karte. Versuch eine andere Expansion oder greife früher an.';
            endTimeEl.textContent = formatTime(elapsedTime);
            endCapturesEl.textContent = playerCaptures;
            endScoreEl.textContent = score.toLocaleString('de-DE');
            endOverlay.classList.remove('hidden');
        };

        const startGame = () => {
            endOverlay.classList.add('hidden');
            startOverlay.classList.add('hidden');
            elapsedTime = 0;
            aiThinkTimer = rand(1.1, 1.8);
            gameEnded = false;
            gameRunning = true;
            generateLevel();
            updateHud();
        };

        const drawRoundedRect = (x, y, width, height, radius) => {
            const r = Math.min(radius, width / 2, height / 2);
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + width, y, x + width, y + height, r);
            ctx.arcTo(x + width, y + height, x, y + height, r);
            ctx.arcTo(x, y + height, x, y, r);
            ctx.arcTo(x, y, x + width, y, r);
            ctx.closePath();
        };

        const drawBackground = () => {
            const w = initialWidth;
            const h = initialHeight;
            const gradient = ctx.createLinearGradient(0, 0, w, h);
            gradient.addColorStop(0, COLORS.background2);
            gradient.addColorStop(.55, COLORS.background);
            gradient.addColorStop(1, '#080d18');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);

            ctx.strokeStyle = COLORS.grid;
            ctx.lineWidth = 1;
            const grid = 54;
            for (let x = 0; x < w; x += grid) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            }
            for (let y = 0; y < h; y += grid) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            }

            const glow = ctx.createRadialGradient(w * .5, h * .42, 20, w * .5, h * .42, Math.max(w, h) * .58);
            glow.addColorStop(0, 'rgba(36,126,170,.08)');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, w, h);
        };

        const drawIsland = island => {
            const color = ownerColor(island.owner);
            const bright = ownerBright(island.owner);
            const hovered = hoverIslandId === island.id;
            const selected = dragging?.sourceId === island.id;

            ctx.save();
            ctx.translate(island.x, island.y);

            if (island.owner !== OWNER.NEUTRAL || hovered || selected) {
                ctx.shadowBlur = selected ? 30 : hovered ? 24 : 17;
                ctx.shadowColor = color;
            }

            const fillGrad = ctx.createRadialGradient(-island.radius * .28, -island.radius * .30, 3, 0, 0, island.radius * 1.1);
            if (island.owner === OWNER.PLAYER) {
                fillGrad.addColorStop(0, '#2b8eb3');
                fillGrad.addColorStop(.55, '#145a79');
                fillGrad.addColorStop(1, '#0a2638');
            } else if (island.owner === OWNER.AI) {
                fillGrad.addColorStop(0, '#a33a59');
                fillGrad.addColorStop(.55, '#65243b');
                fillGrad.addColorStop(1, '#311523');
            } else {
                fillGrad.addColorStop(0, '#536373');
                fillGrad.addColorStop(.55, '#344252');
                fillGrad.addColorStop(1, '#1c2632');
            }

            ctx.beginPath();
            island.shape.forEach((scale, idx) => {
                const angle = (idx / island.shape.length) * Math.PI * 2 - Math.PI / 2;
                const radius = island.radius * scale;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.fillStyle = fillGrad;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = color;
            ctx.lineWidth = selected ? 4 : hovered ? 3 : 2;
            ctx.globalAlpha = island.owner === OWNER.NEUTRAL ? .62 : .95;
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Kleine Landmassen-Details.
            ctx.fillStyle = island.owner === OWNER.PLAYER
                ? 'rgba(95,232,255,.13)'
                : island.owner === OWNER.AI
                    ? 'rgba(255,120,150,.12)'
                    : 'rgba(255,255,255,.08)';
            ctx.beginPath();
            ctx.ellipse(-island.radius * .18, -island.radius * .15, island.radius * .27, island.radius * .14, -.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(island.radius * .23, island.radius * .12, island.radius * .15, island.radius * .10, .4, 0, Math.PI * 2);
            ctx.fill();

            const troopText = Math.floor(island.troops).toString();
            const badgeW = Math.max(34, 18 + troopText.length * 10);
            drawRoundedRect(-badgeW / 2, -12, badgeW, 24, 12);
            ctx.fillStyle = 'rgba(4,10,18,.84)';
            ctx.fill();
            ctx.strokeStyle = island.owner === OWNER.NEUTRAL ? 'rgba(255,255,255,.16)' : color;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = island.owner === OWNER.NEUTRAL ? '#eef3f8' : bright;
            ctx.font = '900 14px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(troopText, 0, 0);

            if (hovered) {
                ctx.fillStyle = 'rgba(220,233,247,.68)';
                ctx.font = '700 10px system-ui, sans-serif';
                const label = island.owner === OWNER.NEUTRAL ? 'NEUTRAL · keine Produktion' : `+${island.genRate.toFixed(1)}/s`;
                ctx.fillText(label, 0, island.radius + 19);
            }

            ctx.restore();
        };

        const formationOffsets = count => {
            if (count < 10) return [[0,0]];
            if (count < 25) return [[7,0],[-5,-5],[-5,5]];
            if (count < 50) return [[8,0],[0,-7],[0,7],[-8,-5],[-8,5]];
            if (count < 100) return [[10,0],[3,-8],[3,8],[-5,-10],[-5,10],[-11,-4],[-11,4]];
            return [[11,0],[5,-8],[5,8],[-2,-12],[-2,12],[-9,-9],[-9,9],[-13,-3],[-13,3]];
        };

        const drawArmy = army => {
            const color = ownerColor(army.owner);
            const bright = ownerBright(army.owner);
            const angle = Math.atan2(army.vy, army.vx);
            const offsets = formationOffsets(army.count);
            const size = army.count >= 100 ? 4.2 : army.count >= 50 ? 3.8 : army.count >= 25 ? 3.5 : 3.3;

            ctx.save();
            ctx.translate(army.x, army.y);
            ctx.rotate(angle);
            ctx.shadowBlur = army.count >= 50 ? 13 : 8;
            ctx.shadowColor = color;

            for (const [ox, oy] of offsets) {
                ctx.beginPath();
                ctx.moveTo(ox + size * 1.6, oy);
                ctx.lineTo(ox - size, oy - size);
                ctx.lineTo(ox - size * .55, oy);
                ctx.lineTo(ox - size, oy + size);
                ctx.closePath();
                ctx.fillStyle = bright;
                ctx.fill();
            }

            if (army.count >= 100) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.4;
                ctx.globalAlpha = .55;
                ctx.beginPath();
                ctx.ellipse(-2, 0, 19, 15, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
            ctx.restore();

            const text = army.count.toString();
            ctx.font = '900 10px system-ui, sans-serif';
            const width = Math.max(24, ctx.measureText(text).width + 12);
            drawRoundedRect(army.x - width / 2, army.y + formationRadius(army) + 5, width, 17, 8);
            ctx.fillStyle = 'rgba(4,9,16,.83)';
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = bright;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, army.x, army.y + formationRadius(army) + 13.5);
        };

        const drawDragConnection = () => {
            if (!dragging) return;
            const source = islands.find(i => i.id === dragging.sourceId);
            if (!source || source.owner !== OWNER.PLAYER) return;

            const target = islandAt(pointer.x, pointer.y);
            const validTarget = target && target.id !== source.id && target.owner !== OWNER.PLAYER;
            const endX = target ? target.x : pointer.x;
            const endY = target ? target.y : pointer.y;
            const lineColor = validTarget ? COLORS.playerBright : 'rgba(166,192,216,.65)';

            ctx.save();
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = validTarget ? 3 : 2;
            ctx.setLineDash([9, 7]);
            ctx.shadowBlur = validTarget ? 15 : 0;
            ctx.shadowColor = COLORS.player;
            ctx.beginPath();
            ctx.moveTo(source.x, source.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.setLineDash([]);

            const angle = Math.atan2(endY - source.y, endX - source.x);
            const arrowX = endX - Math.cos(angle) * (target ? target.radius * .72 : 7);
            const arrowY = endY - Math.sin(angle) * (target ? target.radius * .72 : 7);
            ctx.translate(arrowX, arrowY);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(9,0); ctx.lineTo(-6,-5); ctx.lineTo(-6,5); ctx.closePath();
            ctx.fillStyle = lineColor;
            ctx.fill();
            ctx.restore();
        };

        const draw = () => {
            drawBackground();
            islands.forEach(drawIsland);
            armies.forEach(drawArmy);
            drawDragConnection();
        };

        const update = delta => {
            if (!gameRunning) return;
            elapsedTime += delta;

            for (const island of islands) {
                if (island.owner === OWNER.NEUTRAL) continue;
                island.troops = Math.min(CONFIG.maxTroopsPerIsland, island.troops + island.genRate * delta);
            }

            updateAi(delta);
            updateArmies(delta);
            updateHud();
            checkGameEnd();
        };

        const loop = timestamp => {
            if (destroyed) return;
            const delta = Math.min(.05, Math.max(0, (timestamp - lastFrame) / 1000));
            lastFrame = timestamp;
            update(delta);
            draw();
            animationId = requestAnimationFrame(loop);
        };

        const onPointerDown = event => {
            if (!gameRunning) return;
            pointer = getCanvasPoint(event);
            const island = islandAt(pointer.x, pointer.y);
            if (!island || island.owner !== OWNER.PLAYER || Math.floor(island.troops) <= 0) return;

            dragging = { sourceId:island.id, pointerId:event.pointerId };
            canvas.setPointerCapture?.(event.pointerId);
        };

        const onPointerMove = event => {
            pointer = getCanvasPoint(event);
            const hovered = islandAt(pointer.x, pointer.y);
            hoverIslandId = hovered?.id ?? null;
        };

        const onPointerUp = event => {
            pointer = getCanvasPoint(event);
            if (!dragging) return;

            const source = islands.find(i => i.id === dragging.sourceId);
            const target = islandAt(pointer.x, pointer.y);
            if (source && target && source.id !== target.id && target.owner !== OWNER.PLAYER) {
                sendArmy(source, target, sendPercent, OWNER.PLAYER);
            }

            dragging = null;
            try { canvas.releasePointerCapture?.(event.pointerId); } catch {}
        };

        const onPointerLeave = event => {
            hoverIslandId = null;
            if (dragging && event.buttons === 0) dragging = null;
        };

        rangeEl.addEventListener('input', () => {
            sendPercent = Number(rangeEl.value);
            sendValueEl.textContent = `${sendPercent}%`;
        });
        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', startGame);
        mapBtn.addEventListener('click', startGame);
        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointercancel', onPointerUp);
        canvas.addEventListener('pointerleave', onPointerLeave);

        resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(root);
        resizeCanvas();
        updateHud();
        lastFrame = performance.now();
        animationId = requestAnimationFrame(loop);

        return {
            destroy: () => {
                destroyed = true;
                gameRunning = false;
                cancelAnimationFrame(animationId);
                resizeObserver?.disconnect();
                canvas.removeEventListener('pointerdown', onPointerDown);
                canvas.removeEventListener('pointermove', onPointerMove);
                canvas.removeEventListener('pointerup', onPointerUp);
                canvas.removeEventListener('pointercancel', onPointerUp);
                canvas.removeEventListener('pointerleave', onPointerLeave);
                style.remove();
            }
        };
    }
};
