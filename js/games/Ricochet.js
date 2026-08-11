const DIFFICULTIES = {
    easy: {
        label: 'Easy',
        description: 'Große Targets · lange Zielhilfe · weniger Hindernisse',
        targetRadius: 18,
        maxBounces: 16,
        previewBounces: 3,
        obstacleBase: 1,
        movingChance: 0.08,
        shotSpeed: 470,
        scoreMultiplier: 0.85
    },
    normal: {
        label: 'Normal',
        description: 'Ausgewogen · 2 Vorschau-Bounces',
        targetRadius: 15,
        maxBounces: 14,
        previewBounces: 2,
        obstacleBase: 2,
        movingChance: 0.18,
        shotSpeed: 500,
        scoreMultiplier: 1.0
    },
    hard: {
        label: 'Hard',
        description: 'Kleinere Targets · mehr Bewegung · kurze Zielhilfe',
        targetRadius: 12.5,
        maxBounces: 12,
        previewBounces: 1,
        obstacleBase: 3,
        movingChance: 0.34,
        shotSpeed: 525,
        scoreMultiplier: 1.22
    }
};

const CONFIG = {
    startLives: 3,
    maxLives: 4,
    ballRadius: 8,
    shotLifetime: 8.5,
    aimMinDeg: -165,
    aimMaxDeg: -15,
    levelTransitionMs: 1050,
    missTransitionMs: 1150,
    clearBonusBase: 500,
    clearBonusPerLevel: 120,
    bounceBonusPerHit: 35,
    targetBaseScore: 100,
    comboStep: 0.35,
    comboMax: 3.5
};

const COLORS = {
    bg: '#07101a',
    bg2: '#0b1725',
    panel: '#111d2c',
    text: '#f4f8ff',
    muted: '#8094aa',
    cyan: '#31dcff',
    cyanBright: '#8ef3ff',
    blue: '#4e84ff',
    green: '#55e69a',
    gold: '#ffd166',
    pink: '#ff5b88',
    red: '#ff4d6d',
    purple: '#b368ff'
};

export default {
    manifest: {
        id: 'ricochet',
        name: 'Ricochet',
        description: 'Plane einen Schuss, nutze Wand-Bounces und räume mit einer Kugel möglichst viele Targets ab.',
        icon: '🎯',
        tags: ['Arcade', 'Skill', 'Physics', 'Highscore']
    },

    init: (container, services) => {
        let destroyed = false;
        let animationId = null;
        let resizeObserver = null;
        let lastFrame = performance.now();

        let selectedDifficultyKey = 'normal';
        let difficulty = DIFFICULTIES[selectedDifficultyKey];

        let gameRunning = false;
        let gameEnded = false;
        let level = 1;
        let lives = CONFIG.startLives;
        let score = 0;
        let bestCombo = 0;
        let totalTargetsHit = 0;
        let totalShots = 0;

        let arena = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            right: 0,
            bottom: 0,
            cannonX: 0,
            cannonY: 0
        };

        let targets = [];
        let obstacles = [];
        let effects = [];
        let ball = null;

        let aimAngle = -Math.PI / 2;
        let pointer = { x: 0, y: 0 };
        let draggingAim = false;

        let roundHitCount = 0;
        let roundCombo = 0;
        let roundBestMultiplier = 1;
        let roundBounces = 0;
        let roundState = 'aim';

        let muted = false;
        let audioContext = null;
        const timers = new Set();

        const style = document.createElement('style');
        style.textContent = `
            .ri-game {
                --bg:${COLORS.bg};
                --panel:${COLORS.panel};
                --text:${COLORS.text};
                --muted:${COLORS.muted};
                --cyan:${COLORS.cyan};
                --cyan2:${COLORS.cyanBright};
                --blue:${COLORS.blue};
                --green:${COLORS.green};
                --gold:${COLORS.gold};
                --pink:${COLORS.pink};
                --red:${COLORS.red};
                --purple:${COLORS.purple};

                position:relative;
                width:100%;
                height:100%;
                overflow:hidden;
                color:var(--text);
                font-family:inherit;
                background:
                    radial-gradient(circle at 50% 30%,rgba(49,220,255,.06),transparent 40%),
                    radial-gradient(circle at 82% 72%,rgba(179,104,255,.045),transparent 35%),
                    var(--bg);
                user-select:none;
            }

            .ri-game * { box-sizing:border-box; }

            .ri-canvas {
                width:100%;
                height:100%;
                display:block;
                touch-action:none;
            }

            .ri-topbar {
                position:absolute;
                z-index:12;
                left:14px;
                right:14px;
                top:14px;
                display:flex;
                align-items:flex-start;
                justify-content:space-between;
                gap:10px;
                pointer-events:none;
            }

            .ri-top-group {
                display:flex;
                gap:7px;
                flex-wrap:wrap;
            }

            .ri-stat {
                min-width:98px;
                padding:8px 10px;
                border-radius:11px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(11,20,33,.80);
                backdrop-filter:blur(10px);
            }

            .ri-stat-label {
                color:#71869e;
                font-size:.59rem;
                font-weight:850;
                text-transform:uppercase;
                letter-spacing:.08em;
            }

            .ri-stat-value {
                margin-top:2px;
                font-size:.94rem;
                font-weight:950;
            }

            .ri-score { color:var(--cyan2); }
            .ri-level { color:#dce8f4; }
            .ri-lives { color:var(--pink); }
            .ri-combo { color:var(--gold); }

            .ri-help {
                position:absolute;
                z-index:11;
                left:50%;
                top:17px;
                transform:translateX(-50%);
                padding:7px 12px;
                border-radius:99px;
                color:#7990a8;
                background:rgba(10,18,30,.62);
                border:1px solid rgba(255,255,255,.055);
                font-size:.65rem;
                font-weight:800;
                pointer-events:none;
                white-space:nowrap;
            }

            .ri-shot-panel {
                position:absolute;
                z-index:13;
                left:50%;
                bottom:17px;
                transform:translateX(-50%);
                width:min(620px,calc(100% - 32px));
                display:grid;
                grid-template-columns:1fr auto 1fr;
                gap:10px;
                align-items:center;
                pointer-events:none;
            }

            .ri-shot-info {
                min-height:42px;
                display:flex;
                align-items:center;
                padding:9px 12px;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.07);
                background:rgba(11,20,33,.78);
                backdrop-filter:blur(10px);
                color:#8499b0;
                font-size:.69rem;
                font-weight:800;
            }

            .ri-shot-info.right {
                justify-content:flex-end;
                text-align:right;
            }

            .ri-fire {
                pointer-events:auto;
                min-width:132px;
                height:46px;
                padding:0 20px;
                border:0;
                border-radius:13px;
                cursor:pointer;
                color:#06121a;
                font:inherit;
                font-weight:950;
                background:linear-gradient(135deg,var(--cyan),var(--blue));
                box-shadow:0 12px 30px rgba(49,220,255,.17);
            }

            .ri-fire:hover { filter:brightness(1.08); }
            .ri-fire:disabled {
                cursor:not-allowed;
                opacity:.42;
                filter:none;
            }

            .ri-status {
                position:absolute;
                z-index:15;
                left:50%;
                top:80px;
                transform:translateX(-50%);
                min-width:270px;
                text-align:center;
                pointer-events:none;
            }

            .ri-status-main {
                font-size:clamp(1.15rem,2.5vw,1.8rem);
                font-weight:950;
                letter-spacing:.025em;
            }

            .ri-status-sub {
                margin-top:4px;
                color:#8196ad;
                font-size:.72rem;
            }

            .ri-status.clear .ri-status-main { color:var(--green); }
            .ri-status.miss .ri-status-main { color:var(--pink); }
            .ri-status.hit .ri-status-main { color:var(--gold); }

            .ri-audio {
                position:absolute;
                z-index:20;
                right:14px;
                bottom:75px;
                padding:8px 10px;
                border-radius:9px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(11,20,33,.78);
                color:#9eb1c4;
                font:inherit;
                font-size:.67rem;
                cursor:pointer;
            }

            .ri-overlay {
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

            .ri-overlay.hidden { display:none; }

            .ri-card {
                width:min(940px,100%);
                max-height:calc(100% - 8px);
                overflow:auto;
                padding:32px;
                border-radius:22px;
                border:1px solid rgba(255,255,255,.09);
                background:linear-gradient(180deg,rgba(27,43,63,.98),rgba(12,22,35,.98));
                box-shadow:0 30px 90px rgba(0,0,0,.44);
            }

            .ri-kicker {
                color:var(--cyan);
                font-size:.72rem;
                font-weight:950;
                text-transform:uppercase;
                letter-spacing:.16em;
            }

            .ri-title {
                margin:6px 0 9px;
                font-size:clamp(2.7rem,5vw,4.4rem);
                line-height:1;
                font-weight:950;
                letter-spacing:-.045em;
            }

            .ri-desc {
                max-width:760px;
                color:#8ea2b9;
                line-height:1.55;
                margin-bottom:22px;
            }

            .ri-how {
                display:grid;
                grid-template-columns:repeat(3,1fr);
                gap:9px;
                margin-bottom:22px;
            }

            .ri-how-card {
                padding:13px;
                border-radius:13px;
                border:1px solid rgba(255,255,255,.065);
                background:rgba(255,255,255,.025);
            }

            .ri-how-icon {
                color:var(--cyan2);
                font-size:1.25rem;
                font-weight:950;
                margin-bottom:5px;
            }

            .ri-how-card b {
                display:block;
                font-size:.82rem;
                margin-bottom:3px;
            }

            .ri-how-card span {
                display:block;
                color:#8095ac;
                font-size:.69rem;
                line-height:1.4;
            }

            .ri-section-label {
                margin:14px 0 8px;
                color:#cbd9e7;
                font-size:.72rem;
                font-weight:900;
                text-transform:uppercase;
                letter-spacing:.08em;
            }

            .ri-difficulty-grid {
                display:grid;
                grid-template-columns:repeat(3,1fr);
                gap:9px;
            }

            .ri-difficulty {
                min-width:0;
                padding:14px;
                border-radius:13px;
                cursor:pointer;
                text-align:left;
                color:var(--text);
                font:inherit;
                border:1px solid rgba(255,255,255,.075);
                background:rgba(255,255,255,.025);
                transition:.15s ease;
            }

            .ri-difficulty:hover {
                transform:translateY(-1px);
                border-color:rgba(49,220,255,.28);
            }

            .ri-difficulty.selected {
                border-color:rgba(49,220,255,.58);
                background:linear-gradient(180deg,rgba(49,220,255,.12),rgba(78,132,255,.05));
            }

            .ri-difficulty b {
                display:block;
                font-size:.9rem;
                margin-bottom:3px;
            }

            .ri-difficulty span {
                display:block;
                color:#7c91aa;
                font-size:.68rem;
                line-height:1.38;
            }

            .ri-start {
                width:100%;
                margin-top:21px;
                padding:14px 18px;
                border:0;
                border-radius:13px;
                cursor:pointer;
                color:#06121a;
                font:inherit;
                font-weight:950;
                background:linear-gradient(135deg,var(--cyan),var(--blue));
                box-shadow:0 14px 34px rgba(49,220,255,.16);
            }

            .ri-start:hover {
                filter:brightness(1.08);
                transform:translateY(-1px);
            }

            .ri-end-title {
                font-size:2.4rem;
                font-weight:950;
                color:var(--cyan2);
                margin-bottom:7px;
            }

            .ri-end-sub {
                color:#8ea2b9;
                line-height:1.5;
                margin-bottom:18px;
            }

            .ri-end-stats {
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:8px;
                margin-bottom:18px;
            }

            .ri-end-stat {
                padding:12px;
                text-align:center;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.06);
                background:rgba(255,255,255,.03);
            }

            .ri-end-stat span {
                display:block;
                color:#788da5;
                font-size:.61rem;
                font-weight:850;
                text-transform:uppercase;
            }

            .ri-end-stat b {
                display:block;
                margin-top:3px;
                font-size:1.08rem;
            }

            @media (max-width:760px) {
                .ri-help { display:none; }
                .ri-card { padding:22px; }
                .ri-how { grid-template-columns:1fr; }
                .ri-difficulty-grid { grid-template-columns:1fr; }
                .ri-shot-panel {
                    grid-template-columns:1fr auto;
                }
                .ri-shot-info.right { display:none; }
                .ri-stat {
                    min-width:0;
                    padding:7px 8px;
                }
                .ri-stat-label { font-size:.51rem; }
                .ri-stat-value { font-size:.76rem; }
                .ri-topbar {
                    left:7px;
                    right:7px;
                    top:7px;
                }
            }
        `;

        const root = document.createElement('div');
        root.className = 'ri-game';
        root.innerHTML = `
            <canvas class="ri-canvas"></canvas>

            <div class="ri-topbar">
                <div class="ri-top-group">
                    <div class="ri-stat">
                        <div class="ri-stat-label">Score</div>
                        <div class="ri-stat-value ri-score">0</div>
                    </div>
                    <div class="ri-stat">
                        <div class="ri-stat-label">Level</div>
                        <div class="ri-stat-value ri-level">1</div>
                    </div>
                </div>

                <div class="ri-top-group">
                    <div class="ri-stat">
                        <div class="ri-stat-label">Lives</div>
                        <div class="ri-stat-value ri-lives">♥♥♥</div>
                    </div>
                    <div class="ri-stat">
                        <div class="ri-stat-label">Shot Combo</div>
                        <div class="ri-stat-value ri-combo">x1.00</div>
                    </div>
                </div>
            </div>

            <div class="ri-help">Maus bewegen = zielen · Klick / SPACE = feuern · A/D oder ←/→ = feinjustieren</div>

            <div class="ri-status">
                <div class="ri-status-main">ZIELEN</div>
                <div class="ri-status-sub">Nutze die Vorschau und plane deine Bounces.</div>
            </div>

            <div class="ri-shot-panel">
                <div class="ri-shot-info ri-left-info">0 / 0 Targets · 0 Bounces</div>
                <button class="ri-fire" type="button">FIRE</button>
                <div class="ri-shot-info right ri-right-info">Ein Schuss pro Level</div>
            </div>

            <button class="ri-audio" type="button">Sound: An</button>

            <div class="ri-overlay ri-menu">
                <div class="ri-card">
                    <div class="ri-kicker">Physics / Skill Shot</div>
                    <div class="ri-title">Ricochet</div>
                    <div class="ri-desc">
                        Du hast pro Level genau einen Schuss. Ziele, nutze Wände und Hindernisse als Banden
                        und versuche mit derselben Kugel möglichst viele Targets zu treffen.
                    </div>

                    <div class="ri-how">
                        <div class="ri-how-card">
                            <div class="ri-how-icon">↗</div>
                            <b>1. Zielen</b>
                            <span>Bewege die Maus. Die gestrichelte Linie zeigt die ersten Bounces.</span>
                        </div>
                        <div class="ri-how-card">
                            <div class="ri-how-icon">◆</div>
                            <b>2. Ricochet nutzen</b>
                            <span>Wände und Neon-Blöcke reflektieren die Kugel. Mehr Bounces erhöhen Hit-Boni.</span>
                        </div>
                        <div class="ri-how-card">
                            <div class="ri-how-icon">◎</div>
                            <b>3. Targets abräumen</b>
                            <span>Mehrere Treffer in einem Schuss bauen eine immer stärkere Combo auf.</span>
                        </div>
                    </div>

                    <div class="ri-section-label">Schwierigkeit</div>

                    <div class="ri-difficulty-grid">
                        ${Object.entries(DIFFICULTIES).map(([key, value]) => `
                            <button class="ri-difficulty ${key === selectedDifficultyKey ? 'selected' : ''}" data-difficulty="${key}" type="button">
                                <b>${value.label}</b>
                                <span>${value.description}</span>
                            </button>
                        `).join('')}
                    </div>

                    <button class="ri-start" type="button">Run starten</button>
                </div>
            </div>

            <div class="ri-overlay ri-end hidden">
                <div class="ri-card">
                    <div class="ri-end-title">RUN BEENDET</div>
                    <div class="ri-end-sub"></div>

                    <div class="ri-end-stats">
                        <div class="ri-end-stat"><span>Score</span><b class="ri-end-score">0</b></div>
                        <div class="ri-end-stat"><span>Level</span><b class="ri-end-level">1</b></div>
                        <div class="ri-end-stat"><span>Targets</span><b class="ri-end-targets">0</b></div>
                        <div class="ri-end-stat"><span>Best Combo</span><b class="ri-end-combo">x1.00</b></div>
                    </div>

                    <button class="ri-start ri-restart" type="button">Nochmal</button>
                </div>
            </div>
        `;

        container.append(style, root);

        const canvas = root.querySelector('.ri-canvas');
        const ctx = canvas.getContext('2d');

        const scoreEl = root.querySelector('.ri-score');
        const levelEl = root.querySelector('.ri-level');
        const livesEl = root.querySelector('.ri-lives');
        const comboEl = root.querySelector('.ri-combo');

        const statusEl = root.querySelector('.ri-status');
        const statusMainEl = root.querySelector('.ri-status-main');
        const statusSubEl = root.querySelector('.ri-status-sub');

        const leftInfoEl = root.querySelector('.ri-left-info');
        const rightInfoEl = root.querySelector('.ri-right-info');
        const fireBtn = root.querySelector('.ri-fire');

        const menuOverlay = root.querySelector('.ri-menu');
        const endOverlay = root.querySelector('.ri-end');

        const startBtn = root.querySelector('.ri-menu .ri-start');
        const restartBtn = root.querySelector('.ri-restart');
        const difficultyButtons = [...root.querySelectorAll('[data-difficulty]')];

        const audioBtn = root.querySelector('.ri-audio');

        const endSubEl = root.querySelector('.ri-end-sub');
        const endScoreEl = root.querySelector('.ri-end-score');
        const endLevelEl = root.querySelector('.ri-end-level');
        const endTargetsEl = root.querySelector('.ri-end-targets');
        const endComboEl = root.querySelector('.ri-end-combo');

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

        const rand = (min, max) => min + Math.random() * (max - min);
        const randInt = (min, max) => Math.floor(rand(min, max + 1));
        const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

        const setStatus = (main, sub = '', kind = '') => {
            statusEl.className = `ri-status ${kind}`;
            statusMainEl.textContent = main;
            statusSubEl.textContent = sub;
        };

        const updateHud = () => {
            scoreEl.textContent = Math.round(score).toLocaleString('de-DE');
            levelEl.textContent = level;
            livesEl.textContent = '♥'.repeat(Math.max(0, lives)) || '0';

            const multiplier =
                1 + Math.min(CONFIG.comboMax - 1, Math.max(0, roundCombo - 1) * CONFIG.comboStep);

            comboEl.textContent = `x${multiplier.toFixed(2)}`;

            leftInfoEl.textContent =
                `${roundHitCount} / ${targets.length} Targets · ${roundBounces} Bounces`;

            rightInfoEl.textContent =
                roundState === 'aim'
                    ? `Vorschau: ${difficulty.previewBounces} Bounce${difficulty.previewBounces === 1 ? '' : 's'}`
                    : `${difficulty.maxBounces} max. Bounces`;

            fireBtn.disabled =
                !gameRunning ||
                roundState !== 'aim';
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

            buildArena(width, height);
        };

        const buildArena = (width, height) => {
            const marginX = width < 720 ? 18 : 42;
            const top = width < 720 ? 72 : 82;
            const bottomUi = width < 720 ? 96 : 86;

            arena.x = marginX;
            arena.y = top;
            arena.width = width - marginX * 2;
            arena.height = height - top - bottomUi;
            arena.right = arena.x + arena.width;
            arena.bottom = arena.y + arena.height;

            arena.cannonX = arena.x + arena.width * 0.5;
            arena.cannonY = arena.bottom - 16;

            if (ball) {
                ball.x = clamp(ball.x, arena.x + CONFIG.ballRadius, arena.right - CONFIG.ballRadius);
                ball.y = clamp(ball.y, arena.y + CONFIG.ballRadius, arena.bottom - CONFIG.ballRadius);
            }
        };

        const circlesOverlap = (x1, y1, r1, x2, y2, r2, padding = 0) =>
            Math.hypot(x1 - x2, y1 - y2) < r1 + r2 + padding;

        const circleRectOverlap = (cx, cy, radius, rect, padding = 0) => {
            const nearestX = clamp(cx, rect.x - padding, rect.x + rect.width + padding);
            const nearestY = clamp(cy, rect.y - padding, rect.y + rect.height + padding);

            return Math.hypot(cx - nearestX, cy - nearestY) < radius + padding;
        };

        const generateObstacles = () => {
            obstacles = [];

            const desired = Math.min(
                6,
                difficulty.obstacleBase + Math.floor((level - 1) / 3)
            );

            let attempts = 0;

            while (obstacles.length < desired && attempts < 500) {
                attempts++;

                const horizontal = Math.random() < 0.55;

                const width = horizontal
                    ? rand(arena.width * 0.12, arena.width * 0.22)
                    : rand(18, 28);

                const height = horizontal
                    ? rand(18, 28)
                    : rand(arena.height * 0.10, arena.height * 0.20);

                const rect = {
                    x: rand(arena.x + 50, arena.right - width - 50),
                    y: rand(arena.y + 80, arena.bottom - height - 120),
                    width,
                    height,
                    glow: Math.random() < 0.35 ? 'purple' : 'blue'
                };

                const cannonDistance =
                    Math.hypot(
                        rect.x + rect.width / 2 - arena.cannonX,
                        rect.y + rect.height / 2 - arena.cannonY
                    );

                if (cannonDistance < 120) continue;

                const overlapsOther = obstacles.some(other =>
                    !(
                        rect.x + rect.width + 22 < other.x ||
                        rect.x > other.x + other.width + 22 ||
                        rect.y + rect.height + 22 < other.y ||
                        rect.y > other.y + other.height + 22
                    )
                );

                if (overlapsOther) continue;

                obstacles.push(rect);
            }
        };

        const generateTargets = () => {
            targets = [];

            const count =
                Math.min(
                    9,
                    3 + Math.floor((level - 1) * 0.55)
                );

            let attempts = 0;

            while (targets.length < count && attempts < 1200) {
                attempts++;

                const radius =
                    difficulty.targetRadius *
                    rand(0.92, 1.08);

                const x =
                    rand(
                        arena.x + radius + 24,
                        arena.right - radius - 24
                    );

                const y =
                    rand(
                        arena.y + radius + 36,
                        arena.bottom - radius - 100
                    );

                const tooCloseToCannon =
                    Math.hypot(x - arena.cannonX, y - arena.cannonY) < 145;

                if (tooCloseToCannon) continue;

                const collidesObstacle =
                    obstacles.some(rect =>
                        circleRectOverlap(
                            x,
                            y,
                            radius,
                            rect,
                            16
                        )
                    );

                if (collidesObstacle) continue;

                const collidesTarget =
                    targets.some(target =>
                        circlesOverlap(
                            x,
                            y,
                            radius,
                            target.x,
                            target.y,
                            target.radius,
                            22
                        )
                    );

                if (collidesTarget) continue;

                const isBonus =
                    targets.length === 0 &&
                    level >= 3 &&
                    Math.random() < 0.75;

                const moving =
                    level >= 3 &&
                    Math.random() < difficulty.movingChance;

                targets.push({
                    id: targets.length + 1,
                    x,
                    y,
                    baseX: x,
                    baseY: y,
                    radius: isBonus ? radius * 0.90 : radius,
                    alive: true,
                    isBonus,
                    moving,
                    moveAxis: Math.random() < 0.5 ? 'x' : 'y',
                    moveRange: rand(18, 46),
                    moveSpeed: rand(0.65, 1.25),
                    movePhase: Math.random() * Math.PI * 2
                });
            }
        };

        const generateLevel = () => {
            generateObstacles();
            generateTargets();

            ball = null;
            effects = [];

            roundHitCount = 0;
            roundCombo = 0;
            roundBestMultiplier = 1;
            roundBounces = 0;
            roundState = 'aim';

            aimAngle = -Math.PI / 2;

            setStatus(
                `LEVEL ${level}`,
                'Plane deinen einzigen Schuss.',
                ''
            );

            updateHud();
        };

        const spawnParticles = (x, y, color, count = 10) => {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = rand(35, 120);

                const life = rand(0.34, 0.64);

                effects.push({
                    type: 'particle',
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: rand(1.6, 3.8),
                    color,
                    life,
                    maxLife: life
                });
            }
        };

        const spawnRing = (x, y, color, from, to, life = 0.45) => {
            effects.push({
                type: 'ring',
                x,
                y,
                color,
                from,
                to,
                life,
                maxLife: life
            });
        };

        const spawnText = (x, y, text, color) => {
            effects.push({
                type: 'text',
                x,
                y,
                text,
                color,
                life: 0.65,
                maxLife: 0.65
            });
        };

        const reflectBallOnArena = () => {
            const r = CONFIG.ballRadius;
            let bounced = false;

            if (ball.x - r <= arena.x && ball.vx < 0) {
                ball.x = arena.x + r;
                ball.vx = Math.abs(ball.vx);
                bounced = true;
            }

            if (ball.x + r >= arena.right && ball.vx > 0) {
                ball.x = arena.right - r;
                ball.vx = -Math.abs(ball.vx);
                bounced = true;
            }

            if (ball.y - r <= arena.y && ball.vy < 0) {
                ball.y = arena.y + r;
                ball.vy = Math.abs(ball.vy);
                bounced = true;
            }

            if (ball.y + r >= arena.bottom && ball.vy > 0) {
                ball.y = arena.bottom - r;
                ball.vy = -Math.abs(ball.vy);
                bounced = true;
            }

            if (bounced) {
                roundBounces++;
                ball.bounces++;

                spawnParticles(
                    ball.x,
                    ball.y,
                    COLORS.cyan,
                    5
                );

                tone(430 + Math.min(260, roundBounces * 18), 0.025, 0.010, 'triangle');
            }
        };

        const resolveBallObstacle = rect => {
            const radius = CONFIG.ballRadius;

            const closestX = clamp(
                ball.x,
                rect.x,
                rect.x + rect.width
            );

            const closestY = clamp(
                ball.y,
                rect.y,
                rect.y + rect.height
            );

            const dx = ball.x - closestX;
            const dy = ball.y - closestY;
            const distSq = dx * dx + dy * dy;

            if (distSq > radius * radius) return false;

            const dist = Math.sqrt(Math.max(0.0001, distSq));
            let nx = dx / dist;
            let ny = dy / dist;

            if (dist < 0.01) {
                const left = Math.abs(ball.x - rect.x);
                const right = Math.abs(ball.x - (rect.x + rect.width));
                const top = Math.abs(ball.y - rect.y);
                const bottom = Math.abs(ball.y - (rect.y + rect.height));

                const min = Math.min(left, right, top, bottom);

                if (min === left) {
                    nx = -1;
                    ny = 0;
                } else if (min === right) {
                    nx = 1;
                    ny = 0;
                } else if (min === top) {
                    nx = 0;
                    ny = -1;
                } else {
                    nx = 0;
                    ny = 1;
                }
            }

            const dot =
                ball.vx * nx +
                ball.vy * ny;

            if (dot < 0) {
                ball.vx -= 2 * dot * nx;
                ball.vy -= 2 * dot * ny;
            }

            ball.x =
                closestX +
                nx * (radius + 0.5);

            ball.y =
                closestY +
                ny * (radius + 0.5);

            roundBounces++;
            ball.bounces++;

            const color =
                rect.glow === 'purple'
                    ? COLORS.purple
                    : COLORS.blue;

            spawnParticles(
                ball.x,
                ball.y,
                color,
                7
            );

            tone(360 + Math.min(260, roundBounces * 16), 0.028, 0.012, 'triangle');

            return true;
        };

        const hitTarget = target => {
            if (!target.alive) return;

            target.alive = false;

            roundHitCount++;
            roundCombo++;
            totalTargetsHit++;

            const comboMultiplier =
                1 +
                Math.min(
                    CONFIG.comboMax - 1,
                    Math.max(0, roundCombo - 1) *
                    CONFIG.comboStep
                );

            roundBestMultiplier =
                Math.max(
                    roundBestMultiplier,
                    comboMultiplier
                );

            bestCombo =
                Math.max(
                    bestCombo,
                    roundBestMultiplier
                );

            const bounceBonus =
                roundBounces *
                CONFIG.bounceBonusPerHit;

            const bonusTargetMultiplier =
                target.isBonus
                    ? 3
                    : 1;

            const gained =
                Math.round(
                    (
                        CONFIG.targetBaseScore +
                        bounceBonus
                    ) *
                    comboMultiplier *
                    bonusTargetMultiplier *
                    difficulty.scoreMultiplier
                );

            score += gained;

            const color =
                target.isBonus
                    ? COLORS.gold
                    : COLORS.green;

            spawnParticles(
                target.x,
                target.y,
                color,
                target.isBonus ? 22 : 13
            );

            spawnRing(
                target.x,
                target.y,
                color,
                target.radius * 0.7,
                target.radius * 2.0,
                0.50
            );

            spawnText(
                target.x,
                target.y - target.radius - 12,
                `+${gained}`,
                color
            );

            tone(
                target.isBonus ? 820 : 620 + roundCombo * 45,
                0.055,
                target.isBonus ? 0.035 : 0.025,
                'sine'
            );

            setStatus(
                target.isBonus ? 'BONUS HIT!' : `COMBO x${comboMultiplier.toFixed(2)}`,
                `${roundBounces} Bounce${roundBounces === 1 ? '' : 's'} · +${gained}`,
                'hit'
            );

            updateHud();

            if (targets.every(candidate => !candidate.alive)) {
                finishLevelClear();
            }
        };

        const updateTargets = delta => {
            for (const target of targets) {
                if (!target.alive || !target.moving) continue;

                target.movePhase += target.moveSpeed * delta;

                const offset =
                    Math.sin(target.movePhase) *
                    target.moveRange;

                if (target.moveAxis === 'x') {
                    target.x =
                        clamp(
                            target.baseX + offset,
                            arena.x + target.radius + 10,
                            arena.right - target.radius - 10
                        );
                } else {
                    target.y =
                        clamp(
                            target.baseY + offset,
                            arena.y + target.radius + 10,
                            arena.bottom - target.radius - 80
                        );
                }
            }
        };

        const updateBall = delta => {
            if (!ball || roundState !== 'flying') return;

            ball.life += delta;

            const steps = Math.max(
                1,
                Math.ceil(
                    difficulty.shotSpeed *
                    delta /
                    7
                )
            );

            const stepDelta =
                delta /
                steps;

            for (let step = 0; step < steps; step++) {
                ball.x += ball.vx * stepDelta;
                ball.y += ball.vy * stepDelta;

                reflectBallOnArena();

                for (const rect of obstacles) {
                    resolveBallObstacle(rect);
                }

                for (const target of targets) {
                    if (!target.alive) continue;

                    if (
                        circlesOverlap(
                            ball.x,
                            ball.y,
                            CONFIG.ballRadius,
                            target.x,
                            target.y,
                            target.radius
                        )
                    ) {
                        hitTarget(target);

                        if (roundState !== 'flying') {
                            return;
                        }
                    }
                }

                if (
                    ball.bounces >= difficulty.maxBounces
                ) {
                    finishShot();
                    return;
                }
            }

            if (
                ball.life >= CONFIG.shotLifetime
            ) {
                finishShot();
            }
        };

        const updateEffects = delta => {
            for (let i = effects.length - 1; i >= 0; i--) {
                const effect = effects[i];
                effect.life -= delta;

                if (effect.type === 'particle') {
                    effect.x += effect.vx * delta;
                    effect.y += effect.vy * delta;

                    effect.vx *= Math.pow(0.94, delta * 60);
                    effect.vy *= Math.pow(0.94, delta * 60);
                }

                if (effect.type === 'text') {
                    effect.y -= 25 * delta;
                }

                if (effect.life <= 0) {
                    effects.splice(i, 1);
                }
            }
        };

        const fire = () => {
            if (
                !gameRunning ||
                gameEnded ||
                roundState !== 'aim'
            ) {
                return;
            }

            ensureAudio();

            roundState = 'flying';
            totalShots++;

            const speed = difficulty.shotSpeed;

            ball = {
                x: arena.cannonX,
                y: arena.cannonY - 22,
                vx: Math.cos(aimAngle) * speed,
                vy: Math.sin(aimAngle) * speed,
                bounces: 0,
                life: 0
            };

            tone(430, 0.065, 0.030, 'square');

            setStatus(
                'SHOT!',
                'Die Kugel ist unterwegs.',
                ''
            );

            updateHud();
        };

        const finishLevelClear = () => {
            if (roundState === 'clear') return;

            roundState = 'clear';
            ball = null;

            const clearBonus =
                Math.round(
                    (
                        CONFIG.clearBonusBase +
                        level *
                        CONFIG.clearBonusPerLevel +
                        Math.max(
                            0,
                            difficulty.maxBounces -
                            roundBounces
                        ) *
                        30
                    ) *
                    difficulty.scoreMultiplier
                );

            score += clearBonus;

            if (
                roundHitCount === targets.length &&
                lives < CONFIG.maxLives &&
                level % 4 === 0
            ) {
                lives++;
            }

            spawnRing(
                arena.cannonX,
                arena.y + arena.height * 0.48,
                COLORS.green,
                24,
                120,
                0.75
            );

            setStatus(
                'PERFECT CLEAR!',
                `Alle Targets · +${clearBonus.toLocaleString('de-DE')} Bonus`,
                'clear'
            );

            tone(660, 0.07, 0.035, 'sine');
            schedule(() => tone(890, 0.10, 0.038, 'sine'), 60);

            updateHud();

            const currentLevel = level;

            schedule(() => {
                if (
                    destroyed ||
                    !gameRunning ||
                    gameEnded ||
                    currentLevel !== level
                ) {
                    return;
                }

                level++;
                generateLevel();
            }, CONFIG.levelTransitionMs);
        };

        const finishShot = () => {
            if (
                roundState !== 'flying'
            ) {
                return;
            }

            ball = null;
            roundState = 'result';

            if (roundHitCount === 0) {
                lives--;

                setStatus(
                    'MISS!',
                    `Kein Target getroffen · ${Math.max(0, lives)} Leben übrig`,
                    'miss'
                );

                tone(230, 0.09, 0.026, 'sawtooth');

                updateHud();

                if (lives <= 0) {
                    schedule(endRun, 850);
                    return;
                }
            } else {
                setStatus(
                    `${roundHitCount} HIT${roundHitCount === 1 ? '' : 'S'}`,
                    `Shot beendet · Combo x${roundBestMultiplier.toFixed(2)}`,
                    'hit'
                );

                updateHud();
            }

            const currentLevel = level;

            schedule(() => {
                if (
                    destroyed ||
                    !gameRunning ||
                    gameEnded ||
                    currentLevel !== level
                ) {
                    return;
                }

                level++;
                generateLevel();
            }, CONFIG.missTransitionMs);
        };

        const rayRectIntersection = (px, py, dx, dy, rect) => {
            const epsilon = 0.00001;
            const invDx = Math.abs(dx) > epsilon ? 1 / dx : Infinity;
            const invDy = Math.abs(dy) > epsilon ? 1 / dy : Infinity;

            let tx1 = (rect.x - px) * invDx;
            let tx2 = (rect.x + rect.width - px) * invDx;
            let ty1 = (rect.y - py) * invDy;
            let ty2 = (rect.y + rect.height - py) * invDy;

            if (tx1 > tx2) [tx1, tx2] = [tx2, tx1];
            if (ty1 > ty2) [ty1, ty2] = [ty2, ty1];

            const tEnter = Math.max(tx1, ty1);
            const tExit = Math.min(tx2, ty2);

            if (
                tExit < 0 ||
                tEnter > tExit ||
                tEnter < 0.001
            ) {
                return null;
            }

            const x = px + dx * tEnter;
            const y = py + dy * tEnter;

            let nx = 0;
            let ny = 0;

            const leftDist = Math.abs(x - rect.x);
            const rightDist = Math.abs(x - (rect.x + rect.width));
            const topDist = Math.abs(y - rect.y);
            const bottomDist = Math.abs(y - (rect.y + rect.height));

            const min = Math.min(leftDist, rightDist, topDist, bottomDist);

            if (min === leftDist) nx = -1;
            else if (min === rightDist) nx = 1;
            else if (min === topDist) ny = -1;
            else ny = 1;

            return {
                t: tEnter,
                x,
                y,
                nx,
                ny
            };
        };

        const nextPreviewCollision = (px, py, dx, dy) => {
            const candidates = [];

            if (dx < -0.0001) {
                const t = (arena.x - px) / dx;
                candidates.push({
                    t,
                    x: arena.x,
                    y: py + dy * t,
                    nx: 1,
                    ny: 0
                });
            }

            if (dx > 0.0001) {
                const t = (arena.right - px) / dx;
                candidates.push({
                    t,
                    x: arena.right,
                    y: py + dy * t,
                    nx: -1,
                    ny: 0
                });
            }

            if (dy < -0.0001) {
                const t = (arena.y - py) / dy;
                candidates.push({
                    t,
                    x: px + dx * t,
                    y: arena.y,
                    nx: 0,
                    ny: 1
                });
            }

            if (dy > 0.0001) {
                const t = (arena.bottom - py) / dy;
                candidates.push({
                    t,
                    x: px + dx * t,
                    y: arena.bottom,
                    nx: 0,
                    ny: -1
                });
            }

            for (const rect of obstacles) {
                const hit =
                    rayRectIntersection(
                        px,
                        py,
                        dx,
                        dy,
                        rect
                    );

                if (hit) {
                    candidates.push(hit);
                }
            }

            return candidates
                .filter(hit =>
                    hit.t > 0.001 &&
                    hit.x >= arena.x - 1 &&
                    hit.x <= arena.right + 1 &&
                    hit.y >= arena.y - 1 &&
                    hit.y <= arena.bottom + 1
                )
                .sort((a, b) => a.t - b.t)[0] ?? null;
        };

        const buildPreviewSegments = () => {
            if (roundState !== 'aim') return [];

            let px = arena.cannonX;
            let py = arena.cannonY - 22;
            let dx = Math.cos(aimAngle);
            let dy = Math.sin(aimAngle);

            const segments = [];

            for (
                let bounce = 0;
                bounce <= difficulty.previewBounces;
                bounce++
            ) {
                const hit =
                    nextPreviewCollision(
                        px,
                        py,
                        dx,
                        dy
                    );

                if (!hit) break;

                segments.push({
                    x1: px,
                    y1: py,
                    x2: hit.x,
                    y2: hit.y
                });

                const dot =
                    dx * hit.nx +
                    dy * hit.ny;

                dx -= 2 * dot * hit.nx;
                dy -= 2 * dot * hit.ny;

                px =
                    hit.x +
                    dx * 0.5;

                py =
                    hit.y +
                    dy * 0.5;
            }

            return segments;
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
            const width = root.clientWidth;
            const height = root.clientHeight;

            const gradient =
                ctx.createLinearGradient(
                    0,
                    0,
                    width,
                    height
                );

            gradient.addColorStop(
                0,
                COLORS.bg
            );

            gradient.addColorStop(
                1,
                COLORS.bg2
            );

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            ctx.strokeStyle =
                'rgba(111,177,223,.045)';

            ctx.lineWidth = 1;

            const grid = 54;

            ctx.beginPath();

            for (let x = 0; x < width; x += grid) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
            }

            for (let y = 0; y < height; y += grid) {
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }

            ctx.stroke();
        };

        const drawArena = () => {
            ctx.save();

            ctx.fillStyle =
                'rgba(8,16,27,.46)';

            drawRoundedRect(
                arena.x,
                arena.y,
                arena.width,
                arena.height,
                18
            );

            ctx.fill();

            ctx.strokeStyle =
                'rgba(49,220,255,.20)';

            ctx.lineWidth = 2;

            drawRoundedRect(
                arena.x,
                arena.y,
                arena.width,
                arena.height,
                18
            );

            ctx.stroke();

            ctx.restore();
        };

        const drawObstacles = () => {
            for (const rect of obstacles) {
                const color =
                    rect.glow === 'purple'
                        ? COLORS.purple
                        : COLORS.blue;

                ctx.save();

                ctx.shadowBlur = 14;
                ctx.shadowColor = color;

                ctx.fillStyle =
                    'rgba(14,25,40,.92)';

                drawRoundedRect(
                    rect.x,
                    rect.y,
                    rect.width,
                    rect.height,
                    8
                );

                ctx.fill();

                ctx.shadowBlur = 0;
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;

                drawRoundedRect(
                    rect.x,
                    rect.y,
                    rect.width,
                    rect.height,
                    8
                );

                ctx.stroke();

                ctx.restore();
            }
        };

        const drawTargets = () => {
            for (const target of targets) {
                if (!target.alive) continue;

                const color =
                    target.isBonus
                        ? COLORS.gold
                        : COLORS.green;

                ctx.save();

                ctx.translate(
                    target.x,
                    target.y
                );

                ctx.shadowBlur =
                    target.isBonus
                        ? 18
                        : 12;

                ctx.shadowColor = color;

                ctx.strokeStyle = color;
                ctx.lineWidth = target.isBonus ? 4 : 3;

                ctx.beginPath();
                ctx.arc(
                    0,
                    0,
                    target.radius,
                    0,
                    Math.PI * 2
                );
                ctx.stroke();

                ctx.globalAlpha = 0.32;
                ctx.beginPath();
                ctx.arc(
                    0,
                    0,
                    target.radius * 0.58,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = color;
                ctx.fill();

                ctx.globalAlpha = 1;
                ctx.fillStyle = '#eefcff';

                ctx.beginPath();
                ctx.arc(
                    0,
                    0,
                    target.radius * 0.16,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                if (target.isBonus) {
                    ctx.font = '950 9px system-ui, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#211a05';
                    ctx.fillText('3x', 0, 0);
                }

                if (target.moving) {
                    ctx.globalAlpha = 0.30;
                    ctx.strokeStyle = color;
                    ctx.setLineDash([4, 5]);
                    ctx.lineWidth = 1;

                    ctx.beginPath();

                    if (target.moveAxis === 'x') {
                        ctx.moveTo(-target.moveRange, target.radius + 9);
                        ctx.lineTo(target.moveRange, target.radius + 9);
                    } else {
                        ctx.moveTo(target.radius + 9, -target.moveRange);
                        ctx.lineTo(target.radius + 9, target.moveRange);
                    }

                    ctx.stroke();
                }

                ctx.restore();
            }
        };

        const drawCannon = () => {
            ctx.save();

            ctx.translate(
                arena.cannonX,
                arena.cannonY
            );

            ctx.rotate(
                aimAngle +
                Math.PI / 2
            );

            ctx.fillStyle =
                'rgba(17,32,49,.96)';

            ctx.strokeStyle = COLORS.cyan;
            ctx.lineWidth = 2;

            drawRoundedRect(
                -9,
                -38,
                18,
                42,
                7
            );

            ctx.fill();
            ctx.stroke();

            ctx.restore();

            ctx.save();

            ctx.shadowBlur = 13;
            ctx.shadowColor = COLORS.cyan;
            ctx.fillStyle = COLORS.cyanBright;

            ctx.beginPath();
            ctx.arc(
                arena.cannonX,
                arena.cannonY,
                13,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.restore();
        };

        const drawPreview = () => {
            if (
                !gameRunning ||
                roundState !== 'aim'
            ) {
                return;
            }

            const segments =
                buildPreviewSegments();

            ctx.save();

            ctx.strokeStyle =
                'rgba(142,243,255,.68)';

            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);

            segments.forEach(
                (segment, index) => {
                    ctx.globalAlpha =
                        1 -
                        index *
                        0.20;

                    ctx.beginPath();
                    ctx.moveTo(
                        segment.x1,
                        segment.y1
                    );

                    ctx.lineTo(
                        segment.x2,
                        segment.y2
                    );

                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(
                        segment.x2,
                        segment.y2,
                        4,
                        0,
                        Math.PI * 2
                    );

                    ctx.fillStyle =
                        COLORS.cyan;

                    ctx.fill();
                }
            );

            ctx.restore();
        };

        const drawBall = () => {
            if (!ball) return;

            ctx.save();

            const gradient =
                ctx.createRadialGradient(
                    ball.x - 3,
                    ball.y - 3,
                    1,
                    ball.x,
                    ball.y,
                    CONFIG.ballRadius * 1.25
                );

            gradient.addColorStop(
                0,
                '#ffffff'
            );

            gradient.addColorStop(
                0.32,
                COLORS.cyanBright
            );

            gradient.addColorStop(
                1,
                '#2387ba'
            );

            ctx.fillStyle = gradient;
            ctx.shadowBlur = 16;
            ctx.shadowColor =
                'rgba(49,220,255,.62)';

            ctx.beginPath();
            ctx.arc(
                ball.x,
                ball.y,
                CONFIG.ballRadius,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.restore();
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
                        effect.from +
                        (effect.to - effect.from) *
                        progress;

                    ctx.strokeStyle = effect.color;
                    ctx.lineWidth =
                        2.3 *
                        (1 - progress * 0.48);

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
                    ctx.font = '950 13px system-ui, sans-serif';
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

        const draw = () => {
            drawBackground();
            drawArena();
            drawObstacles();
            drawTargets();
            drawPreview();
            drawCannon();
            drawBall();
            drawEffects();
        };

        const update = delta => {
            if (gameRunning && !gameEnded) {
                updateTargets(delta);
                updateBall(delta);
            }

            updateEffects(delta);
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

            lastFrame = timestamp;

            update(delta);
            draw();

            animationId =
                requestAnimationFrame(loop);
        };

        const updateAimFromPoint = (x, y) => {
            if (
                !gameRunning ||
                roundState !== 'aim'
            ) {
                return;
            }

            pointer.x = x;
            pointer.y = y;

            let angle =
                Math.atan2(
                    y - arena.cannonY,
                    x - arena.cannonX
                );

            const min =
                CONFIG.aimMinDeg *
                Math.PI /
                180;

            const max =
                CONFIG.aimMaxDeg *
                Math.PI /
                180;

            // Cannon darf nur nach oben zeigen.
            angle =
                clamp(
                    angle,
                    min,
                    max
                );

            aimAngle = angle;
        };

        const getCanvasPoint = event => {
            const rect =
                canvas.getBoundingClientRect();

            return {
                x:
                    event.clientX -
                    rect.left,
                y:
                    event.clientY -
                    rect.top
            };
        };

        const onPointerMove = event => {
            const point =
                getCanvasPoint(event);

            updateAimFromPoint(
                point.x,
                point.y
            );
        };

        const onPointerDown = event => {
            if (
                !gameRunning ||
                roundState !== 'aim'
            ) {
                return;
            }

            ensureAudio();

            const point =
                getCanvasPoint(event);

            updateAimFromPoint(
                point.x,
                point.y
            );

            draggingAim = true;
        };

        const onPointerUp = event => {
            if (!draggingAim) return;

            draggingAim = false;

            const point =
                getCanvasPoint(event);

            updateAimFromPoint(
                point.x,
                point.y
            );

            fire();
        };

        const onKeyDown = event => {
            if (!gameRunning) return;

            const key =
                event.key.toLowerCase();

            if (
                key === ' ' ||
                event.code === 'Space'
            ) {
                event.preventDefault();
                fire();
                return;
            }

            if (
                roundState !== 'aim'
            ) {
                return;
            }

            const adjustment =
                2.2 *
                Math.PI /
                180;

            if (
                key === 'a' ||
                key === 'arrowleft'
            ) {
                event.preventDefault();

                aimAngle =
                    clamp(
                        aimAngle -
                        adjustment,
                        CONFIG.aimMinDeg *
                            Math.PI /
                            180,
                        CONFIG.aimMaxDeg *
                            Math.PI /
                            180
                    );
            }

            if (
                key === 'd' ||
                key === 'arrowright'
            ) {
                event.preventDefault();

                aimAngle =
                    clamp(
                        aimAngle +
                        adjustment,
                        CONFIG.aimMinDeg *
                            Math.PI /
                            180,
                        CONFIG.aimMaxDeg *
                            Math.PI /
                            180
                    );
            }
        };

        const calculateFinalScore = () =>
            Math.max(
                0,
                Math.round(
                    score +
                    level *
                    80 +
                    totalTargetsHit *
                    15
                )
            );

        const endRun = () => {
            if (gameEnded) return;

            clearTimers();

            gameEnded = true;
            gameRunning = false;
            roundState = 'ended';
            ball = null;

            const finalScore =
                calculateFinalScore();

            services
                ?.highscores
                ?.saveHighscore?.(
                    'ricochet',
                    finalScore
                );

            endSubEl.textContent =
                `${difficulty.label} · ${totalShots} Schüsse · ${totalTargetsHit} Targets getroffen`;

            endScoreEl.textContent =
                finalScore.toLocaleString('de-DE');

            endLevelEl.textContent =
                level;

            endTargetsEl.textContent =
                totalTargetsHit;

            endComboEl.textContent =
                `x${bestCombo.toFixed(2)}`;

            endOverlay.classList.remove('hidden');
        };

        const startRun = () => {
            clearTimers();
            ensureAudio();

            difficulty =
                DIFFICULTIES[selectedDifficultyKey];

            gameRunning = true;
            gameEnded = false;

            level = 1;
            lives = CONFIG.startLives;
            score = 0;
            bestCombo = 0;
            totalTargetsHit = 0;
            totalShots = 0;

            menuOverlay.classList.add('hidden');
            endOverlay.classList.add('hidden');

            generateLevel();
            updateHud();
        };

        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                selectedDifficultyKey =
                    button.dataset.difficulty;

                difficulty =
                    DIFFICULTIES[selectedDifficultyKey];

                difficultyButtons.forEach(other => {
                    other.classList.toggle(
                        'selected',
                        other === button
                    );
                });
            });
        });

        startBtn.addEventListener(
            'click',
            startRun
        );

        restartBtn.addEventListener(
            'click',
            startRun
        );

        fireBtn.addEventListener(
            'click',
            fire
        );

        audioBtn.addEventListener(
            'click',
            () => {
                muted = !muted;

                audioBtn.textContent =
                    `Sound: ${muted ? 'Aus' : 'An'}`;

                if (!muted) {
                    ensureAudio();
                    tone(620, 0.04, 0.02);
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
            () => {
                draggingAim = false;
            }
        );

        window.addEventListener(
            'keydown',
            onKeyDown
        );

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

                try {
                    audioContext?.close?.();
                } catch {}

                style.remove();
            }
        };
    }
};

export {
    DIFFICULTIES,
    CONFIG,
    COLORS
};
