const OWNER = {
    NEUTRAL: 0,
    PLAYER: 1,
    AI: 2
};

const CONFIG = {
    armySpeed: 118,
    aiThinkMin: 0.65,
    aiThinkMax: 1.15,
    defaultSendPercent: 50,
    minSendPercent: 5,
    maxSendPercent: 100,
    sendStep: 5,
    startTroopsMin: 24,
    startTroopsMax: 32,
    neutralTroopsMin: 3,
    neutralTroopsMax: 23,
    maxTroopsPerIsland: 999
};

const MAP_SIZES = {
    small:  { label: 'Small',  min: 8,  max: 10, startChanceTwo: 0.00 },
    medium: { label: 'Medium', min: 11, max: 14, startChanceTwo: 0.28 },
    large:  { label: 'Large',  min: 16, max: 20, startChanceTwo: 0.60 }
};

const MAP_ARCHETYPES = {
    random:      { label: 'Random',      description: 'Wählt bei jedem Start einen Kartenstil.' },
    balanced:    { label: 'Balanced',    description: 'Gleichmäßig verteilte Inseln und faire Fronten.' },
    archipelago: { label: 'Archipelago', description: 'Viele kleinere Inseln und schnelle Expansion.' },
    centerWar:   { label: 'Center War',  description: 'Eine sehr wertvolle Insel dominiert die Mitte.' },
    frontline:   { label: 'Frontline',   description: 'Inselketten bilden mehrere umkämpfte Routen.' }
};

const ISLAND_TIERS = {
    small:   { label: 'Outpost', radiusMin: 25, radiusMax: 30, genMin: 0.55, genMax: 0.78, productionLevel: 1 },
    medium:  { label: 'Colony',  radiusMin: 31, radiusMax: 38, genMin: 0.82, genMax: 1.10, productionLevel: 2 },
    large:   { label: 'Hub',     radiusMin: 39, radiusMax: 46, genMin: 1.18, genMax: 1.50, productionLevel: 3 },
    capital: { label: 'Core',    radiusMin: 47, radiusMax: 53, genMin: 1.65, genMax: 1.95, productionLevel: 4 }
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
        description: 'Erobere Inseln, verstärke deine Front und schlage die KI in Echtzeit.',
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
        let selectedMapSizeKey = 'medium';
        let selectedArchetypeKey = 'random';
        let activeArchetypeKey = 'balanced';

        let islands = [];
        let armies = [];
        let effects = [];
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
                background:${COLORS.background}; color:${COLORS.text}; font-family:inherit;
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
            .ic-chip-label {
                color:#8195ad; font-size:.64rem; font-weight:850;
                text-transform:uppercase; letter-spacing:.08em;
            }
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
                width:min(560px,calc(100% - 32px)); z-index:15;
                padding:12px 15px 13px; border-radius:16px;
                border:1px solid rgba(255,255,255,.10); background:rgba(10,20,34,.88);
                backdrop-filter:blur(14px); box-shadow:0 16px 44px rgba(0,0,0,.32);
            }
            .ic-control-top {
                display:flex; align-items:center; justify-content:space-between;
                gap:14px; margin-bottom:9px;
            }
            .ic-control-title {
                font-size:.72rem; color:#91a4bb; font-weight:850;
                text-transform:uppercase; letter-spacing:.08em;
            }
            .ic-send-value { color:${COLORS.playerBright}; font-size:1.08rem; font-weight:950; }
            .ic-range { width:100%; accent-color:${COLORS.player}; cursor:pointer; }
            .ic-range-labels {
                display:flex; justify-content:space-between; color:#60758e;
                font-size:.62rem; margin-top:2px;
            }
            .ic-help { margin-top:7px; color:#7890aa; text-align:center; font-size:.68rem; }

            .ic-map-btn {
                position:absolute; right:17px; bottom:20px; z-index:16;
                border:1px solid rgba(255,255,255,.10); border-radius:12px;
                padding:10px 13px; cursor:pointer; color:#d6e2ef; font:inherit; font-weight:800;
                background:rgba(10,20,34,.86); backdrop-filter:blur(10px);
            }
            .ic-map-btn:hover { background:rgba(255,255,255,.08); }

            .ic-overlay {
                position:absolute; inset:0; z-index:30; display:flex; align-items:center;
                justify-content:center; padding:26px; background:rgba(4,9,16,.67);
                backdrop-filter:blur(8px);
            }
            .ic-overlay.hidden { display:none; }
            .ic-card {
                width:min(900px,100%); padding:30px; border-radius:22px;
                border:1px solid rgba(255,255,255,.10);
                background:linear-gradient(180deg,rgba(28,46,68,.97),rgba(13,25,40,.97));
                box-shadow:0 30px 90px rgba(0,0,0,.45);
            }
            .ic-kicker {
                color:${COLORS.player}; font-size:.73rem; font-weight:950;
                letter-spacing:.16em; text-transform:uppercase;
            }
            .ic-title {
                margin:6px 0 8px; font-size:clamp(2.2rem,5vw,3.7rem);
                line-height:1; font-weight:950; letter-spacing:-.04em;
            }
            .ic-desc { color:#91a4bb; line-height:1.55; margin-bottom:20px; }

            .ic-option-label {
                margin:14px 0 8px; color:#c8d7e7; font-size:.72rem;
                font-weight:900; text-transform:uppercase; letter-spacing:.08em;
            }
            .ic-option-grid { display:grid; gap:8px; }
            .ic-option-grid.sizes { grid-template-columns:repeat(3,1fr); }
            .ic-option-grid.maps { grid-template-columns:repeat(5,1fr); }
            .ic-option {
                min-width:0; padding:11px 12px; text-align:left; cursor:pointer;
                color:#e9f2fb; border-radius:12px; font:inherit;
                border:1px solid rgba(255,255,255,.07);
                background:rgba(255,255,255,.025); transition:.15s ease;
            }
            .ic-option:hover {
                transform:translateY(-1px);
                border-color:rgba(40,220,255,.30);
            }
            .ic-option.selected {
                border-color:rgba(40,220,255,.58);
                background:linear-gradient(180deg,rgba(40,220,255,.13),rgba(67,135,255,.06));
            }
            .ic-option b { display:block; font-size:.82rem; margin-bottom:2px; }
            .ic-option span { display:block; color:#7f93aa; font-size:.65rem; line-height:1.35; }

            .ic-rules {
                display:grid; grid-template-columns:repeat(3,1fr);
                gap:9px; margin:20px 0;
            }
            .ic-rule {
                padding:12px; border-radius:12px;
                border:1px solid rgba(255,255,255,.065);
                background:rgba(255,255,255,.025);
            }
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
            .ic-end-stats {
                display:grid; grid-template-columns:repeat(3,1fr); gap:9px; margin-bottom:18px;
            }
            .ic-end-stat {
                padding:12px; text-align:center; border-radius:12px;
                background:rgba(255,255,255,.035);
                border:1px solid rgba(255,255,255,.065);
            }
            .ic-end-stat span {
                display:block; color:#8194aa; font-size:.65rem;
                text-transform:uppercase; font-weight:850;
            }
            .ic-end-stat b { display:block; margin-top:3px; font-size:1.15rem; }

            @media (max-width:900px) {
                .ic-option-grid.maps { grid-template-columns:repeat(3,1fr); }
            }
            @media (max-width:760px) {
                .ic-hud {
                    inset:8px 8px auto 8px; grid-template-columns:1fr auto 1fr; gap:5px;
                }
                .ic-chip { min-width:0; padding:7px 8px; }
                .ic-chip-label { font-size:.55rem; }
                .ic-chip-value { font-size:.78rem; }
                .ic-time { min-width:68px; padding:7px; font-size:.78rem; }
                .ic-rules { grid-template-columns:1fr; }
                .ic-option-grid.maps { grid-template-columns:1fr 1fr; }
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
                    <span class="ic-control-title">Truppen senden</span>
                    <span class="ic-send-value">50%</span>
                </div>
                <input class="ic-range" type="range"
                    min="${CONFIG.minSendPercent}"
                    max="${CONFIG.maxSendPercent}"
                    step="${CONFIG.sendStep}"
                    value="${CONFIG.defaultSendPercent}">
                <div class="ic-range-labels"><span>5%</span><span>50%</span><span>100%</span></div>
                <div class="ic-help">
                    Ziehe zu Feinden zum Angreifen oder zu eigenen Inseln zum Verstärken.
                </div>
            </div>

            <button class="ic-map-btn" type="button">Neue Map</button>

            <div class="ic-overlay ic-start-overlay">
                <div class="ic-card">
                    <div class="ic-kicker">Realtime Strategy</div>
                    <div class="ic-title">Island Conquest</div>
                    <div class="ic-desc">
                        Produziere Truppen, verschiebe Reserven an die Front und erobere die Karte,
                        bevor die KI deine Inseln überrennt.
                    </div>

                    <div class="ic-option-label">Map-Größe</div>
                    <div class="ic-option-grid sizes">
                        ${Object.entries(MAP_SIZES).map(([key, value]) => `
                            <button class="ic-option ic-size-option ${key === selectedMapSizeKey ? 'selected' : ''}"
                                type="button" data-size="${key}">
                                <b>${value.label}</b>
                                <span>${value.min}–${value.max} Inseln</span>
                            </button>
                        `).join('')}
                    </div>

                    <div class="ic-option-label">Map-Typ</div>
                    <div class="ic-option-grid maps">
                        ${Object.entries(MAP_ARCHETYPES).map(([key, value]) => `
                            <button class="ic-option ic-map-option ${key === selectedArchetypeKey ? 'selected' : ''}"
                                type="button" data-archetype="${key}">
                                <b>${value.label}</b>
                                <span>${value.description}</span>
                            </button>
                        `).join('')}
                    </div>

                    <div class="ic-rules">
                        <div class="ic-rule">
                            <b>Angreifen</b>
                            <span>Ziehe von deiner Insel auf eine neutrale oder feindliche Insel.</span>
                        </div>
                        <div class="ic-rule">
                            <b>Verstärken</b>
                            <span>Ziehe Truppen auf eine eigene Insel, um ihre Verteidigung rechtzeitig zu erhöhen.</span>
                        </div>
                        <div class="ic-rule">
                            <b>Abfangen</b>
                            <span>Gegnerische Armeen kämpfen bereits unterwegs, wenn ihre Formationen kollidieren.</span>
                        </div>
                    </div>

                    <button class="ic-start" type="button">Level starten</button>
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
                    <button class="ic-start ic-restart" type="button">Nochmal</button>
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

        const sizeButtons = [...root.querySelectorAll('.ic-size-option')];
        const archetypeButtons = [...root.querySelectorAll('.ic-map-option')];

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
        const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
        const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

        const ownerColor = owner =>
            owner === OWNER.PLAYER
                ? COLORS.player
                : owner === OWNER.AI
                    ? COLORS.ai
                    : COLORS.neutral;

        const ownerBright = owner =>
            owner === OWNER.PLAYER
                ? COLORS.playerBright
                : owner === OWNER.AI
                    ? COLORS.aiBright
                    : '#d0d9e2';

        const formatTime = seconds => {
            const whole = Math.max(0, Math.floor(seconds));
            const minutes = Math.floor(whole / 60).toString().padStart(2, '0');
            const secs = (whole % 60).toString().padStart(2, '0');
            return `${minutes}:${secs}`;
        };

        const shuffle = values => {
            const copy = [...values];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
        };

        const resizeCanvas = () => {
            const rect = root.getBoundingClientRect();
            const cssWidth = Math.max(1, rect.width);
            const cssHeight = Math.max(1, rect.height);
            const dpr = Math.min(2, window.devicePixelRatio || 1);

            if (initialWidth && initialHeight && islands.length) {
                const sx = cssWidth / initialWidth;
                const sy = cssHeight / initialHeight;

                islands.forEach(island => {
                    island.x *= sx;
                    island.y *= sy;
                });

                armies.forEach(army => {
                    army.x *= sx;
                    army.y *= sy;
                });

                effects.forEach(effect => {
                    effect.x *= sx;
                    effect.y *= sy;
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

            const seededRandom = () => {
                state = (state * 1664525 + 1013904223) >>> 0;
                return state / 4294967296;
            };

            for (let i = 0; i < 10; i++) {
                points.push(0.88 + seededRandom() * 0.24);
            }

            return points;
        };

        const resolveArchetype = () => {
            if (selectedArchetypeKey !== 'random') {
                return selectedArchetypeKey;
            }

            const available = ['balanced', 'archipelago', 'centerWar', 'frontline'];
            return available[Math.floor(Math.random() * available.length)];
        };

        const tierWeightsFor = archetype => {
            if (archetype === 'archipelago') {
                return [
                    ['small', 50],
                    ['medium', 34],
                    ['large', 16]
                ];
            }

            if (archetype === 'frontline') {
                return [
                    ['small', 25],
                    ['medium', 48],
                    ['large', 27]
                ];
            }

            return [
                ['small', 25],
                ['medium', 50],
                ['large', 25]
            ];
        };

        const weightedTier = archetype => {
            const weights = tierWeightsFor(archetype);
            const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
            let roll = Math.random() * total;

            for (const [key, weight] of weights) {
                roll -= weight;
                if (roll <= 0) return key;
            }

            return 'medium';
        };

        const createIsland = (x, y, tierKey = 'medium', overrides = {}) => {
            const tier = ISLAND_TIERS[tierKey];
            const radius = overrides.radius ?? rand(tier.radiusMin, tier.radiusMax);

            return {
                id: islands.length + 1,
                x,
                y,
                radius,
                tierKey,
                tierLabel: tier.label,
                productionLevel: tier.productionLevel,
                owner: overrides.owner ?? OWNER.NEUTRAL,
                troops: overrides.troops ?? randInt(CONFIG.neutralTroopsMin, CONFIG.neutralTroopsMax),
                genRate: overrides.genRate ?? rand(tier.genMin, tier.genMax),
                seed: randInt(1, 999999),
                shape: null
            };
        };

        const positionForArchetype = (archetype, index, total, w, h, bounds) => {
            const { left, right, top, bottom } = bounds;

            if (archetype === 'frontline') {
                const lanes = [0.18, 0.37, 0.63, 0.82];
                const lane = lanes[index % lanes.length];
                return {
                    x: left + (right - left) * lane + rand(-34, 34),
                    y: rand(top, bottom)
                };
            }

            return {
                x: rand(left, right),
                y: rand(top, bottom)
            };
        };

        const placeRandomIslands = (total, archetype, w, h, bounds) => {
            const minDimension = Math.min(w, h);
            const densityFactor = archetype === 'archipelago' ? 0.82 : total >= 16 ? 0.76 : 0.92;
            const minGap = clamp(minDimension * 0.115 * densityFactor, 72, 128);

            let attempts = 0;

            while (islands.length < total && attempts < 5500) {
                attempts++;

                const tierKey = weightedTier(archetype);
                const tier = ISLAND_TIERS[tierKey];
                const radius = rand(tier.radiusMin, tier.radiusMax);

                const pos = positionForArchetype(
                    archetype,
                    islands.length,
                    total,
                    w,
                    h,
                    bounds
                );

                const x = clamp(pos.x, bounds.left + radius, bounds.right - radius);
                const y = clamp(pos.y, bounds.top + radius, bounds.bottom - radius);

                const okay = islands.every(other => {
                    const desired = minGap + (radius + other.radius) * 0.44;
                    return Math.hypot(x - other.x, y - other.y) > desired;
                });

                if (!okay) continue;

                islands.push(createIsland(x, y, tierKey, { radius }));
            }

            return minGap;
        };

        const fallbackGrid = (total, archetype, w, h, bounds) => {
            islands = [];

            const usableW = bounds.right - bounds.left;
            const usableH = bounds.bottom - bounds.top;
            const cols = Math.ceil(Math.sqrt(total * (usableW / Math.max(1, usableH))));
            const rows = Math.ceil(total / cols);

            for (let index = 0; index < total; index++) {
                const col = index % cols;
                const row = Math.floor(index / cols);
                const tierKey = weightedTier(archetype);

                const x = bounds.left + (col + 0.5) * (usableW / cols);
                const y = bounds.top + (row + 0.5) * (usableH / rows);

                const radius = clamp(
                    Math.min(usableW / cols, usableH / rows) * 0.21,
                    23,
                    ISLAND_TIERS[tierKey].radiusMax
                );

                islands.push(createIsland(x, y, tierKey, { radius }));
            }
        };

        const generateLevel = () => {
            islands = [];
            armies = [];
            effects = [];
            nextArmyId = 1;
            playerCaptures = 0;
            dragging = null;
            hoverIslandId = null;

            activeArchetypeKey = resolveArchetype();

            const size = MAP_SIZES[selectedMapSizeKey];
            let total = randInt(size.min, size.max);

            if (activeArchetypeKey === 'archipelago') {
                total = Math.min(size.max + 2, total + 2);
            }

            const w = initialWidth;
            const h = initialHeight;

            const bounds = {
                left: Math.max(52, Math.min(90, w * 0.055)),
                right: w - Math.max(52, Math.min(90, w * 0.055)),
                top: 94,
                bottom: h - 126
            };

            // Center War besitzt bewusst eine starke, teure Zentralinsel.
            if (activeArchetypeKey === 'centerWar') {
                const center = createIsland(
                    w * 0.5 + rand(-18, 18),
                    (bounds.top + bounds.bottom) * 0.5 + rand(-18, 18),
                    'capital',
                    {
                        troops: randInt(28, 40),
                        genRate: rand(1.75, 2.05)
                    }
                );

                islands.push(center);
            }

            const existingCount = islands.length;
            const minGap = placeRandomIslands(
                total,
                activeArchetypeKey,
                w,
                h,
                bounds
            );

            if (islands.length < Math.min(total, 7)) {
                fallbackGrid(total, activeArchetypeKey, w, h, bounds);
            }

            islands.forEach(island => {
                island.id = islands.indexOf(island) + 1;
                island.shape = createIslandShape(island.seed);
            });

            const byX = [...islands].sort((a, b) => a.x - b.x);

            const playerStartCount =
                Math.random() < size.startChanceTwo && islands.length >= 11
                    ? 2
                    : 1;

            const aiStartCount =
                Math.random() < size.startChanceTwo && islands.length >= 11
                    ? 2
                    : 1;

            const protectedCenter =
                activeArchetypeKey === 'centerWar'
                    ? islands.reduce((best, island) =>
                        distance(island, { x: w * 0.5, y: (bounds.top + bounds.bottom) * 0.5 }) <
                        distance(best, { x: w * 0.5, y: (bounds.top + bounds.bottom) * 0.5 })
                            ? island
                            : best,
                        islands[0]
                    )
                    : null;

            const chosen = new Set();

            const chooseStarts = (owner, fromLeft, amount) => {
                const pool = (fromLeft ? byX : [...byX].reverse())
                    .filter(island => island !== protectedCenter);

                let picked = 0;

                for (const island of pool) {
                    if (picked >= amount) break;
                    if (chosen.has(island.id)) continue;

                    const tooClose = [...chosen].some(id => {
                        const other = islands.find(candidate => candidate.id === id);
                        return other && distance(island, other) < Math.max(70, minGap * 0.70);
                    });

                    if (tooClose && picked > 0) continue;

                    island.owner = owner;
                    island.troops = randInt(CONFIG.startTroopsMin, CONFIG.startTroopsMax);
                    chosen.add(island.id);
                    picked++;
                }
            };

            chooseStarts(OWNER.PLAYER, true, playerStartCount);
            chooseStarts(OWNER.AI, false, aiStartCount);

            if (!islands.some(island => island.owner === OWNER.PLAYER)) {
                byX[0].owner = OWNER.PLAYER;
                byX[0].troops = CONFIG.startTroopsMax;
            }

            if (!islands.some(island => island.owner === OWNER.AI)) {
                byX[byX.length - 1].owner = OWNER.AI;
                byX[byX.length - 1].troops = CONFIG.startTroopsMax;
            }

            // Nahe neutrale Inseln sind bewusst etwas leichter, damit beide
            // Seiten sinnvolle frühe Expansionen besitzen.
            for (const owner of [OWNER.PLAYER, OWNER.AI]) {
                const starts = islands.filter(island => island.owner === owner);
                const neutrals = islands.filter(island => island.owner === OWNER.NEUTRAL);

                const nearest = neutrals
                    .map(island => ({
                        island,
                        d: Math.min(...starts.map(start => distance(start, island)))
                    }))
                    .sort((a, b) => a.d - b.d)
                    .slice(0, Math.min(2, neutrals.length));

                nearest.forEach((entry, index) => {
                    if (entry.island === protectedCenter) return;
                    entry.island.troops = Math.min(
                        entry.island.troops,
                        randInt(4 + index * 2, 9 + index * 3)
                    );
                });
            }
        };

        const islandAt = (x, y) => {
            let best = null;
            let bestDistance = Infinity;

            for (const island of islands) {
                const d = Math.hypot(x - island.x, y - island.y);

                if (
                    d <= island.radius + 10 &&
                    d < bestDistance
                ) {
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

        // ============================================================
        // EFFECTS
        // ============================================================

        const spawnParticles = (
            x,
            y,
            color,
            count = 12,
            speedMin = 25,
            speedMax = 90,
            life = 0.45
        ) => {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = rand(speedMin, speedMax);

                effects.push({
                    type: 'particle',
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life,
                    maxLife: life,
                    color,
                    size: rand(1.5, 3.8)
                });
            }
        };

        const spawnRing = (
            x,
            y,
            color,
            startRadius,
            endRadius,
            life = 0.55,
            width = 2
        ) => {
            effects.push({
                type: 'ring',
                x,
                y,
                color,
                startRadius,
                endRadius,
                life,
                maxLife: life,
                width
            });
        };

        const spawnFloatText = (
            x,
            y,
            text,
            color,
            life = 0.75
        ) => {
            effects.push({
                type: 'text',
                x,
                y,
                text,
                color,
                life,
                maxLife: life
            });
        };

        const spawnBattleEffect = (x, y, scale = 1) => {
            spawnParticles(x, y, '#ffd2a3', Math.round(9 * scale), 30, 105, 0.38);
            spawnRing(x, y, '#ff9d67', 3, 18 * scale, 0.35, 2);
        };

        const spawnCaptureEffect = (island, owner) => {
            const color = ownerBright(owner);
            spawnParticles(island.x, island.y, color, 22, 35, 120, 0.65);
            spawnRing(
                island.x,
                island.y,
                color,
                island.radius * 0.55,
                island.radius * 1.75,
                0.75,
                3
            );
            spawnFloatText(
                island.x,
                island.y - island.radius - 16,
                owner === OWNER.PLAYER ? 'CAPTURED' : 'LOST',
                color,
                0.95
            );
        };

        const spawnReinforceEffect = (island, owner, amount) => {
            const color = ownerBright(owner);
            spawnParticles(island.x, island.y, color, 8, 18, 55, 0.38);
            spawnRing(
                island.x,
                island.y,
                color,
                island.radius * 0.60,
                island.radius * 1.12,
                0.40,
                1.5
            );
            spawnFloatText(
                island.x,
                island.y - island.radius - 12,
                `+${amount}`,
                color,
                0.60
            );
        };

        const updateEffects = delta => {
            for (let i = effects.length - 1; i >= 0; i--) {
                const effect = effects[i];
                effect.life -= delta;

                if (effect.type === 'particle') {
                    effect.x += effect.vx * delta;
                    effect.y += effect.vy * delta;
                    effect.vx *= Math.pow(0.88, delta * 60);
                    effect.vy *= Math.pow(0.88, delta * 60);
                } else if (effect.type === 'text') {
                    effect.y -= 24 * delta;
                }

                if (effect.life <= 0) {
                    effects.splice(i, 1);
                }
            }
        };

        // ============================================================
        // ARMIES / COMBAT
        // ============================================================

        const launchArmy = (source, target, count, owner = source.owner) => {
            if (!source || !target || source.id === target.id) return false;
            if (source.owner !== owner) return false;

            const available = Math.floor(source.troops);
            const actualCount = Math.min(available, Math.floor(count));
            if (actualCount <= 0) return false;

            source.troops -= actualCount;

            const angle = Math.atan2(target.y - source.y, target.x - source.x);
            const offset = source.radius * 0.72;

            armies.push({
                id: nextArmyId++,
                owner,
                count: actualCount,
                x: source.x + Math.cos(angle) * offset,
                y: source.y + Math.sin(angle) * offset,
                targetIslandId: target.id,
                sourceIslandId: source.id,
                vx: Math.cos(angle),
                vy: Math.sin(angle),
                speed: CONFIG.armySpeed * rand(0.96, 1.04)
            });

            return true;
        };

        const sendArmy = (
            source,
            target,
            percent,
            owner = source.owner
        ) => {
            const available = Math.floor(source?.troops ?? 0);
            const count = Math.floor(available * (percent / 100));
            return launchArmy(source, target, count, owner);
        };

        const resolveArrival = army => {
            const target = islands.find(island => island.id === army.targetIslandId);
            if (!target) return;

            if (target.owner === army.owner) {
                target.troops = Math.min(
                    CONFIG.maxTroopsPerIsland,
                    target.troops + army.count
                );

                spawnReinforceEffect(target, army.owner, army.count);
                return;
            }

            const previousOwner = target.owner;
            const defendersBefore = Math.floor(target.troops);

            spawnBattleEffect(
                target.x,
                target.y,
                clamp((army.count + defendersBefore) / 55, 0.8, 1.8)
            );

            if (army.count > target.troops) {
                target.troops = army.count - target.troops;
                target.owner = army.owner;

                if (
                    army.owner === OWNER.PLAYER &&
                    previousOwner !== OWNER.PLAYER
                ) {
                    playerCaptures++;
                }

                spawnCaptureEffect(target, army.owner);
            } else {
                // Gleichstand: Verteidiger behält die Insel mit 0 Truppen.
                target.troops = Math.max(0, target.troops - army.count);

                spawnFloatText(
                    target.x,
                    target.y - target.radius - 12,
                    `-${Math.min(army.count, defendersBefore)}`,
                    ownerBright(previousOwner),
                    0.55
                );
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

                    if (
                        dead.has(b.id) ||
                        a.owner === b.owner
                    ) {
                        continue;
                    }

                    const hitDistance = Math.max(
                        12,
                        (formationRadius(a) + formationRadius(b)) * 0.75
                    );

                    if (
                        Math.hypot(a.x - b.x, a.y - b.y) >
                        hitDistance
                    ) {
                        continue;
                    }

                    const hitX = (a.x + b.x) / 2;
                    const hitY = (a.y + b.y) / 2;

                    spawnBattleEffect(
                        hitX,
                        hitY,
                        clamp((a.count + b.count) / 70, 0.7, 1.8)
                    );

                    if (a.count === b.count) {
                        dead.add(a.id);
                        dead.add(b.id);
                        break;
                    }

                    if (a.count > b.count) {
                        a.count -= b.count;
                        dead.add(b.id);
                        spawnFloatText(hitX, hitY - 10, `${a.count}`, ownerBright(a.owner), 0.45);
                    } else {
                        b.count -= a.count;
                        dead.add(a.id);
                        spawnFloatText(hitX, hitY - 10, `${b.count}`, ownerBright(b.owner), 0.45);
                        break;
                    }
                }
            }

            if (dead.size) {
                armies = armies.filter(army => !dead.has(army.id));
            }
        };

        const updateArmies = delta => {
            const arrived = new Set();

            for (const army of armies) {
                const target = islands.find(island => island.id === army.targetIslandId);

                if (!target) {
                    arrived.add(army.id);
                    continue;
                }

                const dx = target.x - army.x;
                const dy = target.y - army.y;
                const dist = Math.hypot(dx, dy);
                const step = army.speed * delta;

                if (dist <= target.radius * 0.70 + step) {
                    resolveArrival(army);
                    arrived.add(army.id);
                    continue;
                }

                army.vx = dx / Math.max(0.001, dist);
                army.vy = dy / Math.max(0.001, dist);

                army.x += army.vx * step;
                army.y += army.vy * step;
            }

            if (arrived.size) {
                armies = armies.filter(army => !arrived.has(army.id));
            }

            resolveArmyCollisions();
        };

        // ============================================================
        // INCOMING THREATS
        // ============================================================

        const incomingGroupsForIsland = island => {
            const byOwner = new Map();

            for (const army of armies) {
                if (
                    army.targetIslandId !== island.id ||
                    army.owner === island.owner
                ) {
                    continue;
                }

                const eta =
                    Math.max(
                        0,
                        Math.hypot(island.x - army.x, island.y - army.y) -
                        island.radius * 0.70
                    ) /
                    Math.max(1, army.speed);

                if (!byOwner.has(army.owner)) {
                    byOwner.set(army.owner, {
                        owner: army.owner,
                        count: 0,
                        eta: Infinity
                    });
                }

                const group = byOwner.get(army.owner);
                group.count += army.count;
                group.eta = Math.min(group.eta, eta);
            }

            return [...byOwner.values()]
                .sort((a, b) => a.eta - b.eta);
        };

        const friendlyIncomingBefore = (
            island,
            owner,
            maxEta
        ) => {
            let total = 0;

            for (const army of armies) {
                if (
                    army.targetIslandId !== island.id ||
                    army.owner !== owner
                ) {
                    continue;
                }

                const eta =
                    Math.max(
                        0,
                        Math.hypot(island.x - army.x, island.y - army.y) -
                        island.radius * 0.70
                    ) /
                    Math.max(1, army.speed);

                if (eta <= maxEta + 0.25) {
                    total += army.count;
                }
            }

            return total;
        };

        // ============================================================
        // AI
        // ============================================================

        const chooseAiDefenseAction = () => {
            const threatened = islands
                .filter(island => island.owner === OWNER.AI)
                .map(island => {
                    const playerThreats = incomingGroupsForIsland(island)
                        .filter(group => group.owner === OWNER.PLAYER);

                    if (!playerThreats.length) return null;

                    const incoming = playerThreats.reduce(
                        (sum, group) => sum + group.count,
                        0
                    );

                    const eta = Math.min(...playerThreats.map(group => group.eta));

                    const projectedDefense =
                        island.troops +
                        island.genRate * eta +
                        friendlyIncomingBefore(island, OWNER.AI, eta);

                    return {
                        island,
                        incoming,
                        eta,
                        shortage: incoming - projectedDefense + 7
                    };
                })
                .filter(Boolean)
                .filter(entry => entry.shortage > 0)
                .sort((a, b) =>
                    (b.shortage / Math.max(0.5, b.eta)) -
                    (a.shortage / Math.max(0.5, a.eta))
                );

            for (const threat of threatened) {
                const sources = islands
                    .filter(island =>
                        island.owner === OWNER.AI &&
                        island.id !== threat.island.id &&
                        Math.floor(island.troops) >= 16
                    )
                    .map(source => {
                        const travel =
                            distance(source, threat.island) /
                            CONFIG.armySpeed;

                        const reserve = 9;
                        const available =
                            Math.max(
                                0,
                                Math.floor(source.troops) - reserve
                            );

                        return {
                            source,
                            travel,
                            available
                        };
                    })
                    .filter(entry =>
                        entry.available > 0 &&
                        entry.travel <= threat.eta + 0.35
                    )
                    .sort((a, b) =>
                        a.travel - b.travel ||
                        b.available - a.available
                    );

                if (!sources.length) continue;

                const source = sources[0];
                const desired = Math.min(
                    source.available,
                    Math.ceil(threat.shortage + 5)
                );

                if (desired <= 0) continue;

                launchArmy(
                    source.source,
                    threat.island,
                    desired,
                    OWNER.AI
                );

                return true;
            }

            return false;
        };

        const chooseAiProactiveReinforcement = () => {
            if (Math.random() > 0.22) return false;

            const playerIslands = islands.filter(island => island.owner === OWNER.PLAYER);
            const aiIslands = islands.filter(island => island.owner === OWNER.AI);

            if (!playerIslands.length || aiIslands.length < 2) return false;

            const frontTargets = aiIslands
                .map(island => ({
                    island,
                    enemyDistance: Math.min(...playerIslands.map(player => distance(island, player)))
                }))
                .sort((a, b) => a.enemyDistance - b.enemyDistance)
                .slice(0, Math.min(3, aiIslands.length))
                .sort((a, b) => a.island.troops - b.island.troops);

            const target = frontTargets[0]?.island;
            if (!target || target.troops >= 35) return false;

            const source = aiIslands
                .filter(island =>
                    island.id !== target.id &&
                    island.troops >= 35
                )
                .sort((a, b) =>
                    b.troops - a.troops -
                    distance(a, target) * 0.04
                )[0];

            if (!source) return false;

            const amount = Math.min(
                Math.floor(source.troops * 0.38),
                Math.max(8, Math.ceil(35 - target.troops))
            );

            return launchArmy(
                source,
                target,
                amount,
                OWNER.AI
            );
        };

        const chooseAiAttackAction = () => {
            const sources = islands
                .filter(island =>
                    island.owner === OWNER.AI &&
                    Math.floor(island.troops) >= 9
                )
                .sort((a, b) => b.troops - a.troops);

            if (!sources.length) return false;

            let bestAction = null;

            for (const source of sources.slice(0, 6)) {
                const targets = islands.filter(island =>
                    island.id !== source.id &&
                    island.owner !== OWNER.AI
                );

                for (const target of targets) {
                    const percent =
                        target.owner === OWNER.PLAYER
                            ? clamp(randInt(58, 84), 5, 100)
                            : clamp(randInt(44, 72), 5, 100);

                    const sent = Math.floor(
                        Math.floor(source.troops) *
                        percent /
                        100
                    );

                    if (sent <= 0) continue;

                    const margin = sent - target.troops;
                    const dist = distance(source, target);

                    const captureValue =
                        margin > 0
                            ? 68 + Math.min(42, margin * 1.8)
                            : -Math.abs(margin) * 3.1;

                    const ownerBonus =
                        target.owner === OWNER.PLAYER
                            ? 35
                            : 12;

                    const productionValue =
                        target.genRate * 28 +
                        target.productionLevel * 7;

                    const distancePenalty = dist * 0.064;
                    const randomness = rand(-8, 16);

                    const score =
                        captureValue +
                        ownerBonus +
                        productionValue -
                        distancePenalty +
                        randomness;

                    if (
                        !bestAction ||
                        score > bestAction.score
                    ) {
                        bestAction = {
                            source,
                            target,
                            percent,
                            score,
                            margin
                        };
                    }
                }
            }

            if (!bestAction) return false;

            if (
                bestAction.score < 15 &&
                Math.random() < 0.80
            ) {
                return false;
            }

            if (
                bestAction.margin < -8 &&
                Math.random() < 0.70
            ) {
                return false;
            }

            return sendArmy(
                bestAction.source,
                bestAction.target,
                bestAction.percent,
                OWNER.AI
            );
        };

        const updateAi = delta => {
            aiThinkTimer -= delta;

            if (aiThinkTimer > 0) return;

            aiThinkTimer = rand(
                CONFIG.aiThinkMin,
                CONFIG.aiThinkMax
            );

            if (chooseAiDefenseAction()) return;
            if (chooseAiProactiveReinforcement()) return;
            chooseAiAttackAction();
        };

        // ============================================================
        // GAME FLOW / HUD
        // ============================================================

        const totalTroopsFor = owner => {
            const onIslands = islands
                .filter(island => island.owner === owner)
                .reduce((sum, island) => sum + Math.floor(island.troops), 0);

            const moving = armies
                .filter(army => army.owner === owner)
                .reduce((sum, army) => sum + army.count, 0);

            return onIslands + moving;
        };

        const updateHud = () => {
            playerIslandsEl.textContent =
                islands.filter(island => island.owner === OWNER.PLAYER).length;

            aiIslandsEl.textContent =
                islands.filter(island => island.owner === OWNER.AI).length;

            neutralIslandsEl.textContent =
                islands.filter(island => island.owner === OWNER.NEUTRAL).length;

            playerTroopsEl.textContent =
                totalTroopsFor(OWNER.PLAYER);

            timeEl.textContent =
                formatTime(elapsedTime);
        };

        const calculateScore = () => {
            const troops = totalTroopsFor(OWNER.PLAYER);
            const sizeBonus =
                selectedMapSizeKey === 'large'
                    ? 3200
                    : selectedMapSizeKey === 'medium'
                        ? 1400
                        : 0;

            return Math.max(
                0,
                Math.round(
                    18000 +
                    sizeBonus -
                    elapsedTime * 35 +
                    playerCaptures * 320 +
                    troops * 12
                )
            );
        };

        const checkGameEnd = () => {
            if (
                gameEnded ||
                !gameRunning ||
                !islands.length
            ) {
                return;
            }

            const allPlayer =
                islands.every(island => island.owner === OWNER.PLAYER) &&
                !armies.some(army => army.owner === OWNER.AI);

            const allAi =
                islands.every(island => island.owner === OWNER.AI) &&
                !armies.some(army => army.owner === OWNER.PLAYER);

            if (allPlayer) {
                endGame(true);
            } else if (allAi) {
                endGame(false);
            }
        };

        const endGame = won => {
            gameEnded = true;
            gameRunning = false;
            dragging = null;

            const score = won
                ? calculateScore()
                : 0;

            if (won) {
                services
                    ?.highscores
                    ?.saveHighscore?.(
                        'island-conquest',
                        score
                    );
            }

            endTitleEl.className =
                `ic-end-title ${won ? 'win' : 'lose'}`;

            endTitleEl.textContent =
                won
                    ? 'KARTE EROBERT!'
                    : 'DU WURDEST EROBERT';

            endSubEl.textContent = won
                ? `${MAP_SIZES[selectedMapSizeKey].label} · ${MAP_ARCHETYPES[activeArchetypeKey].label} · Alle Inseln gehören dir.`
                : 'Die KI kontrolliert die gesamte Karte. Verstärke bedrohte Frontinseln früher oder greife mit mehreren Wellen an.';

            endTimeEl.textContent =
                formatTime(elapsedTime);

            endCapturesEl.textContent =
                playerCaptures;

            endScoreEl.textContent =
                score.toLocaleString('de-DE');

            endOverlay.classList.remove('hidden');
        };

        const startGame = () => {
            endOverlay.classList.add('hidden');
            startOverlay.classList.add('hidden');

            elapsedTime = 0;
            aiThinkTimer = rand(1.0, 1.6);
            gameEnded = false;
            gameRunning = true;

            generateLevel();
            updateHud();
        };

        // ============================================================
        // DRAW HELPERS
        // ============================================================

        const drawRoundedRect = (
            x,
            y,
            width,
            height,
            radius
        ) => {
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

            const gradient =
                ctx.createLinearGradient(
                    0,
                    0,
                    w,
                    h
                );

            gradient.addColorStop(
                0,
                COLORS.background
            );

            gradient.addColorStop(
                1,
                COLORS.background2
            );

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);

            const grid = 54;

            ctx.strokeStyle = COLORS.grid;
            ctx.lineWidth = 1;

            ctx.beginPath();

            for (let x = 0; x <= w; x += grid) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
            }

            for (let y = 0; y <= h; y += grid) {
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
            }

            ctx.stroke();

            const glow =
                ctx.createRadialGradient(
                    w * 0.5,
                    h * 0.42,
                    20,
                    w * 0.5,
                    h * 0.42,
                    Math.max(w, h) * 0.58
                );

            glow.addColorStop(
                0,
                'rgba(43,109,166,.09)'
            );

            glow.addColorStop(
                1,
                'rgba(43,109,166,0)'
            );

            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, w, h);
        };

        const drawProductionPips = island => {
            const count = island.productionLevel;
            const gap = 6;
            const totalWidth = (count - 1) * gap;

            ctx.save();
            ctx.translate(
                island.x - totalWidth / 2,
                island.y + island.radius + 8
            );

            for (let i = 0; i < count; i++) {
                ctx.beginPath();
                ctx.arc(i * gap, 0, 2.1, 0, Math.PI * 2);

                ctx.fillStyle =
                    island.owner === OWNER.NEUTRAL
                        ? 'rgba(174,190,208,.40)'
                        : ownerBright(island.owner);

                ctx.globalAlpha =
                    island.owner === OWNER.NEUTRAL
                        ? 0.45
                        : 0.75;

                ctx.fill();
            }

            ctx.restore();
            ctx.globalAlpha = 1;
        };

        const drawIncomingIndicators = island => {
            const groups = incomingGroupsForIsland(island);
            if (!groups.length) return;

            const now = elapsedTime;

            groups.slice(0, 2).forEach((group, index) => {
                const color = ownerBright(group.owner);
                const y =
                    island.y -
                    island.radius -
                    26 -
                    index * 19;

                const text =
                    `▼ ${group.count} · ${group.eta.toFixed(1)}s`;

                ctx.font = '900 10px system-ui, sans-serif';

                const width =
                    Math.max(
                        64,
                        ctx.measureText(text).width + 14
                    );

                drawRoundedRect(
                    island.x - width / 2,
                    y - 8,
                    width,
                    17,
                    8
                );

                ctx.fillStyle =
                    'rgba(5,10,17,.90)';

                ctx.fill();

                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.fillStyle = color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    text,
                    island.x,
                    y + 0.5
                );
            });

            if (
                island.owner === OWNER.PLAYER &&
                groups.some(group => group.owner === OWNER.AI)
            ) {
                ctx.save();

                ctx.strokeStyle =
                    `rgba(255,79,114,${0.45 + Math.sin(now * 6) * 0.18})`;

                ctx.lineWidth = 2.5;
                ctx.setLineDash([7, 6]);

                ctx.beginPath();
                ctx.arc(
                    island.x,
                    island.y,
                    island.radius + 12,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();
                ctx.restore();
            }
        };

        const drawIsland = island => {
            const color = ownerColor(island.owner);
            const bright = ownerBright(island.owner);

            const hovered =
                hoverIslandId === island.id;

            const selected =
                dragging?.sourceId === island.id;

            ctx.save();
            ctx.translate(island.x, island.y);

            const pulse =
                selected
                    ? 1.055
                    : hovered
                        ? 1.025
                        : 1;

            ctx.scale(pulse, pulse);

            const fillGrad =
                ctx.createRadialGradient(
                    -island.radius * 0.28,
                    -island.radius * 0.30,
                    3,
                    0,
                    0,
                    island.radius * 1.1
                );

            if (island.owner === OWNER.PLAYER) {
                fillGrad.addColorStop(0, '#164d62');
                fillGrad.addColorStop(1, '#0c2537');
            } else if (island.owner === OWNER.AI) {
                fillGrad.addColorStop(0, '#63263a');
                fillGrad.addColorStop(1, '#321725');
            } else {
                fillGrad.addColorStop(0, '#384554');
                fillGrad.addColorStop(1, '#202a35');
            }

            ctx.shadowBlur =
                selected
                    ? 24
                    : hovered
                        ? 16
                        : island.owner === OWNER.NEUTRAL
                            ? 6
                            : 10;

            ctx.shadowColor = color;

            ctx.beginPath();

            island.shape.forEach((scale, index) => {
                const angle =
                    (index / island.shape.length) *
                    Math.PI *
                    2 -
                    Math.PI /
                    2;

                const radius =
                    island.radius *
                    scale;

                const x =
                    Math.cos(angle) *
                    radius;

                const y =
                    Math.sin(angle) *
                    radius;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.closePath();
            ctx.fillStyle = fillGrad;
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = color;
            ctx.lineWidth =
                selected
                    ? 4
                    : hovered
                        ? 3
                        : 2;

            ctx.globalAlpha =
                island.owner === OWNER.NEUTRAL
                    ? 0.62
                    : 0.95;

            ctx.stroke();
            ctx.globalAlpha = 1;

            // Kleine Landmassen-Details.
            ctx.fillStyle =
                island.owner === OWNER.PLAYER
                    ? 'rgba(95,232,255,.13)'
                    : island.owner === OWNER.AI
                        ? 'rgba(255,120,150,.12)'
                        : 'rgba(255,255,255,.08)';

            ctx.beginPath();
            ctx.ellipse(
                -island.radius * 0.18,
                -island.radius * 0.15,
                island.radius * 0.27,
                island.radius * 0.14,
                -0.25,
                0,
                Math.PI * 2
            );
            ctx.fill();

            ctx.beginPath();
            ctx.ellipse(
                island.radius * 0.23,
                island.radius * 0.12,
                island.radius * 0.15,
                island.radius * 0.10,
                0.4,
                0,
                Math.PI * 2
            );
            ctx.fill();

            const troopText =
                Math.floor(island.troops).toString();

            const badgeW =
                Math.max(
                    34,
                    18 + troopText.length * 10
                );

            drawRoundedRect(
                -badgeW / 2,
                -12,
                badgeW,
                24,
                12
            );

            ctx.fillStyle =
                'rgba(4,10,18,.84)';

            ctx.fill();

            ctx.strokeStyle =
                island.owner === OWNER.NEUTRAL
                    ? 'rgba(255,255,255,.16)'
                    : color;

            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle =
                island.owner === OWNER.NEUTRAL
                    ? '#eef3f8'
                    : bright;

            ctx.font =
                '900 14px system-ui, sans-serif';

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.fillText(
                troopText,
                0,
                0
            );

            if (hovered) {
                ctx.fillStyle =
                    'rgba(220,233,247,.75)';

                ctx.font =
                    '700 10px system-ui, sans-serif';

                const label =
                    island.owner === OWNER.NEUTRAL
                        ? `${island.tierLabel.toUpperCase()} · keine Produktion`
                        : `${island.tierLabel.toUpperCase()} · +${island.genRate.toFixed(1)}/s`;

                ctx.fillText(
                    label,
                    0,
                    island.radius + 24
                );
            }

            ctx.restore();

            drawProductionPips(island);
            drawIncomingIndicators(island);
        };

        const formationOffsets = count => {
            if (count < 10) {
                return [[0, 0]];
            }

            if (count < 25) {
                return [
                    [7, 0],
                    [-5, -5],
                    [-5, 5]
                ];
            }

            if (count < 50) {
                return [
                    [8, 0],
                    [0, -7],
                    [0, 7],
                    [-8, -5],
                    [-8, 5]
                ];
            }

            if (count < 100) {
                return [
                    [10, 0],
                    [3, -8],
                    [3, 8],
                    [-5, -10],
                    [-5, 10],
                    [-11, -4],
                    [-11, 4]
                ];
            }

            return [
                [11, 0],
                [5, -8],
                [5, 8],
                [-2, -12],
                [-2, 12],
                [-9, -9],
                [-9, 9],
                [-13, -3],
                [-13, 3]
            ];
        };

        const drawArmy = army => {
            const color = ownerColor(army.owner);
            const bright = ownerBright(army.owner);
            const angle = Math.atan2(army.vy, army.vx);
            const offsets = formationOffsets(army.count);

            const size =
                army.count >= 100
                    ? 4.2
                    : army.count >= 50
                        ? 3.8
                        : army.count >= 25
                            ? 3.5
                            : 3.3;

            ctx.save();
            ctx.translate(army.x, army.y);
            ctx.rotate(angle);

            ctx.shadowBlur =
                army.count >= 50
                    ? 13
                    : 8;

            ctx.shadowColor = color;

            for (const [ox, oy] of offsets) {
                ctx.beginPath();
                ctx.moveTo(ox + size * 1.6, oy);
                ctx.lineTo(ox - size, oy - size);
                ctx.lineTo(ox - size * 0.55, oy);
                ctx.lineTo(ox - size, oy + size);
                ctx.closePath();

                ctx.fillStyle = bright;
                ctx.fill();
            }

            if (army.count >= 100) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.4;
                ctx.globalAlpha = 0.55;

                ctx.beginPath();
                ctx.ellipse(-2, 0, 19, 15, 0, 0, Math.PI * 2);
                ctx.stroke();

                ctx.globalAlpha = 1;
            }

            ctx.restore();

            const text =
                army.count.toString();

            ctx.font =
                '900 10px system-ui, sans-serif';

            const width =
                Math.max(
                    24,
                    ctx.measureText(text).width + 12
                );

            drawRoundedRect(
                army.x - width / 2,
                army.y + formationRadius(army) + 5,
                width,
                17,
                8
            );

            ctx.fillStyle =
                'rgba(4,9,16,.83)';

            ctx.fill();

            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = bright;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.fillText(
                text,
                army.x,
                army.y + formationRadius(army) + 13.5
            );
        };

        const drawEffects = () => {
            for (const effect of effects) {
                const progress =
                    1 -
                    effect.life /
                    effect.maxLife;

                const alpha =
                    clamp(
                        effect.life /
                        effect.maxLife,
                        0,
                        1
                    );

                ctx.save();
                ctx.globalAlpha = alpha;

                if (effect.type === 'particle') {
                    ctx.fillStyle = effect.color;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = effect.color;

                    ctx.beginPath();
                    ctx.arc(
                        effect.x,
                        effect.y,
                        effect.size,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();
                }

                if (effect.type === 'ring') {
                    const radius =
                        effect.startRadius +
                        (effect.endRadius - effect.startRadius) *
                        progress;

                    ctx.strokeStyle = effect.color;
                    ctx.lineWidth =
                        effect.width *
                        (1 - progress * 0.45);

                    ctx.beginPath();
                    ctx.arc(
                        effect.x,
                        effect.y,
                        radius,
                        0,
                        Math.PI * 2
                    );

                    ctx.stroke();
                }

                if (effect.type === 'text') {
                    ctx.fillStyle = effect.color;
                    ctx.font = '950 11px system-ui, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = effect.color;

                    ctx.fillText(
                        effect.text,
                        effect.x,
                        effect.y
                    );
                }

                ctx.restore();
            }
        };

        const drawDragConnection = () => {
            if (!dragging) return;

            const source =
                islands.find(island => island.id === dragging.sourceId);

            if (
                !source ||
                source.owner !== OWNER.PLAYER
            ) {
                return;
            }

            const target =
                islandAt(pointer.x, pointer.y);

            const validTarget =
                target &&
                target.id !== source.id;

            const reinforcement =
                validTarget &&
                target.owner === OWNER.PLAYER;

            const endX =
                target
                    ? target.x
                    : pointer.x;

            const endY =
                target
                    ? target.y
                    : pointer.y;

            const lineColor =
                !validTarget
                    ? 'rgba(166,192,216,.65)'
                    : reinforcement
                        ? '#73ffb4'
                        : COLORS.playerBright;

            ctx.save();

            ctx.strokeStyle = lineColor;
            ctx.lineWidth = validTarget ? 3 : 2;
            ctx.setLineDash([9, 7]);

            ctx.shadowBlur =
                validTarget
                    ? 15
                    : 0;

            ctx.shadowColor = lineColor;

            ctx.beginPath();
            ctx.moveTo(source.x, source.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            ctx.setLineDash([]);

            const angle =
                Math.atan2(
                    endY - source.y,
                    endX - source.x
                );

            const arrowX =
                endX -
                Math.cos(angle) *
                (target ? target.radius * 0.72 : 7);

            const arrowY =
                endY -
                Math.sin(angle) *
                (target ? target.radius * 0.72 : 7);

            ctx.translate(arrowX, arrowY);
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.moveTo(9, 0);
            ctx.lineTo(-6, -5);
            ctx.lineTo(-6, 5);
            ctx.closePath();

            ctx.fillStyle = lineColor;
            ctx.fill();

            ctx.restore();

            if (validTarget) {
                const sent =
                    Math.floor(
                        Math.floor(source.troops) *
                        sendPercent /
                        100
                    );

                const label =
                    reinforcement
                        ? `VERSTÄRKEN +${sent}`
                        : `ANGRIFF ${sent}`;

                ctx.font = '900 11px system-ui, sans-serif';

                const width =
                    ctx.measureText(label).width + 18;

                const midX =
                    (source.x + endX) / 2;

                const midY =
                    (source.y + endY) / 2 - 12;

                drawRoundedRect(
                    midX - width / 2,
                    midY - 9,
                    width,
                    18,
                    9
                );

                ctx.fillStyle =
                    'rgba(5,10,18,.86)';

                ctx.fill();

                ctx.strokeStyle = lineColor;
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.fillStyle = lineColor;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, midX, midY);
            }
        };

        const draw = () => {
            drawBackground();

            islands.forEach(drawIsland);
            armies.forEach(drawArmy);

            drawEffects();
            drawDragConnection();
        };

        const update = delta => {
            updateEffects(delta);

            if (!gameRunning) return;

            elapsedTime += delta;

            for (const island of islands) {
                if (island.owner === OWNER.NEUTRAL) continue;

                island.troops =
                    Math.min(
                        CONFIG.maxTroopsPerIsland,
                        island.troops +
                        island.genRate *
                        delta
                    );
            }

            updateAi(delta);
            updateArmies(delta);

            updateHud();
            checkGameEnd();
        };

        const loop = timestamp => {
            if (destroyed) return;

            const delta =
                Math.min(
                    0.05,
                    Math.max(
                        0,
                        (timestamp - lastFrame) /
                        1000
                    )
                );

            lastFrame = timestamp;

            update(delta);
            draw();

            animationId =
                requestAnimationFrame(loop);
        };

        // ============================================================
        // INPUT
        // ============================================================

        const onPointerDown = event => {
            if (!gameRunning) return;

            pointer = getCanvasPoint(event);

            const island =
                islandAt(pointer.x, pointer.y);

            if (
                !island ||
                island.owner !== OWNER.PLAYER ||
                Math.floor(island.troops) <= 0
            ) {
                return;
            }

            dragging = {
                sourceId: island.id,
                pointerId: event.pointerId
            };

            canvas.setPointerCapture?.(
                event.pointerId
            );
        };

        const onPointerMove = event => {
            pointer = getCanvasPoint(event);

            const hovered =
                islandAt(pointer.x, pointer.y);

            hoverIslandId =
                hovered?.id ??
                null;
        };

        const onPointerUp = event => {
            pointer = getCanvasPoint(event);

            if (!dragging) return;

            const source =
                islands.find(
                    island =>
                        island.id === dragging.sourceId
                );

            const target =
                islandAt(pointer.x, pointer.y);

            if (
                source &&
                target &&
                source.id !== target.id
            ) {
                // Eigene Inseln sind jetzt ein gültiges Ziel und dienen
                // als Verstärkung. Feindliche/neutrale Ziele bleiben Angriff.
                sendArmy(
                    source,
                    target,
                    sendPercent,
                    OWNER.PLAYER
                );
            }

            dragging = null;

            try {
                canvas.releasePointerCapture?.(
                    event.pointerId
                );
            } catch {}
        };

        const onPointerLeave = event => {
            hoverIslandId = null;

            if (
                dragging &&
                event.buttons === 0
            ) {
                dragging = null;
            }
        };

        rangeEl.addEventListener('input', () => {
            sendPercent =
                Number(rangeEl.value);

            sendValueEl.textContent =
                `${sendPercent}%`;
        });

        sizeButtons.forEach(button => {
            button.addEventListener('click', () => {
                selectedMapSizeKey =
                    button.dataset.size;

                sizeButtons.forEach(other =>
                    other.classList.toggle(
                        'selected',
                        other === button
                    )
                );
            });
        });

        archetypeButtons.forEach(button => {
            button.addEventListener('click', () => {
                selectedArchetypeKey =
                    button.dataset.archetype;

                archetypeButtons.forEach(other =>
                    other.classList.toggle(
                        'selected',
                        other === button
                    )
                );
            });
        });

        startBtn.addEventListener(
            'click',
            startGame
        );

        restartBtn.addEventListener(
            'click',
            startGame
        );

        mapBtn.addEventListener(
            'click',
            startGame
        );

        canvas.addEventListener(
            'pointerdown',
            onPointerDown
        );

        canvas.addEventListener(
            'pointermove',
            onPointerMove
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

        resizeObserver =
            new ResizeObserver(
                resizeCanvas
            );

        resizeObserver.observe(root);

        resizeCanvas();
        updateHud();

        lastFrame =
            performance.now();

        animationId =
            requestAnimationFrame(loop);

        return {
            destroy: () => {
                destroyed = true;
                gameRunning = false;

                cancelAnimationFrame(
                    animationId
                );

                resizeObserver?.disconnect();

                canvas.removeEventListener(
                    'pointerdown',
                    onPointerDown
                );

                canvas.removeEventListener(
                    'pointermove',
                    onPointerMove
                );

                canvas.removeEventListener(
                    'pointerup',
                    onPointerUp
                );

                canvas.removeEventListener(
                    'pointercancel',
                    onPointerUp
                );

                canvas.removeEventListener(
                    'pointerleave',
                    onPointerLeave
                );

                style.remove();
            }
        };
    }
};

export {
    OWNER,
    CONFIG,
    MAP_SIZES,
    MAP_ARCHETYPES,
    ISLAND_TIERS
};
