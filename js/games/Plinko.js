const RISK_PROFILES = {
    low: {
        label: 'Low',
        description: 'Ruhiger Verlauf · kleine, häufigere Gewinne',
        color: '#55e69a',
        multipliers: {
            8:  [5.6, 2.1, 1.3, 1.1, 0.9, 1.1, 1.3, 2.1, 5.6],
            10: [5.6, 2.1, 1.4, 1.15, 1.0, 0.85, 1.0, 1.15, 1.4, 2.1, 5.6],
            12: [8.0, 3.0, 1.7, 1.25, 1.05, 0.9, 0.8, 0.9, 1.05, 1.25, 1.7, 3.0, 8.0],
            14: [10.0, 3.4, 2.0, 1.4, 1.15, 1.0, 0.9, 0.8, 0.9, 1.0, 1.15, 1.4, 2.0, 3.4, 10.0],
            16: [12.0, 4.0, 2.4, 1.6, 1.25, 1.05, 0.95, 0.85, 0.75, 0.85, 0.95, 1.05, 1.25, 1.6, 2.4, 4.0, 12.0]
        }
    },
    medium: {
        label: 'Medium',
        description: 'Ausgewogen · stärkere Außenfelder',
        color: '#ffd166',
        multipliers: {
            8:  [16, 4.0, 1.8, 1.15, 0.55, 1.15, 1.8, 4.0, 16],
            10: [22, 5.0, 2.2, 1.35, 0.85, 0.45, 0.85, 1.35, 2.2, 5.0, 22],
            12: [30, 7.0, 3.0, 1.6, 1.05, 0.7, 0.35, 0.7, 1.05, 1.6, 3.0, 7.0, 30],
            14: [42, 10, 4.2, 2.2, 1.35, 0.9, 0.55, 0.3, 0.55, 0.9, 1.35, 2.2, 4.2, 10, 42],
            16: [60, 14, 6.0, 3.0, 1.8, 1.15, 0.75, 0.45, 0.25, 0.45, 0.75, 1.15, 1.8, 3.0, 6.0, 14, 60]
        }
    },
    high: {
        label: 'High',
        description: 'Extreme Außenfelder · hohe Varianz',
        color: '#ff5b88',
        multipliers: {
            8:  [45, 9.0, 3.0, 0.9, 0.2, 0.9, 3.0, 9.0, 45],
            10: [75, 16, 5.0, 1.5, 0.45, 0.12, 0.45, 1.5, 5.0, 16, 75],
            12: [110, 24, 8.0, 2.6, 0.8, 0.32, 0.1, 0.32, 0.8, 2.6, 8.0, 24, 110],
            14: [180, 38, 12, 4.2, 1.4, 0.5, 0.2, 0.06, 0.2, 0.5, 1.4, 4.2, 12, 38, 180],
            16: [260, 55, 18, 6.5, 2.2, 0.8, 0.3, 0.12, 0.04, 0.12, 0.3, 0.8, 2.2, 6.5, 18, 55, 260]
        }
    }
};

const ROW_OPTIONS = [8, 10, 12, 14, 16];

const CONFIG = {
    startingCredits: 1000,
    minBet: 5,
    maxBet: 250,
    betStep: 5,
    maxBalls: 30,
    gravity: 900,
    restitution: 0.48,
    sideBounce: 0.68,
    pegRadius: 4.2,
    ballRadius: 7.2,
    dropCooldownMs: 95
};

export default {
    manifest: {
        id: 'plinko',
        name: 'Plinko',
        description: 'Lass Kugeln durch das Peg-Feld fallen, wähle Risiko und Reihenanzahl und jage hohe Multiplikatoren.',
        icon: '🔻',
        tags: ['Arcade', 'Chance', 'Physics', 'Highscore']
    },

    init: (container, services) => {
        let destroyed = false;
        let animationId = null;
        let resizeObserver = null;
        let lastFrame = performance.now();

        let rows = 12;
        let riskKey = 'medium';
        let bet = 25;

        let credits = CONFIG.startingCredits;
        let peakCredits = credits;
        let totalDropped = 0;
        let totalReturned = 0;
        let biggestWin = 0;
        let ballsDropped = 0;

        let board = {
            width: 0,
            height: 0,
            top: 80,
            bottom: 0,
            left: 0,
            right: 0,
            pegGapX: 0,
            pegGapY: 0,
            centerX: 0,
            slotY: 0,
            slotHeight: 54,
            pegs: [],
            slots: []
        };

        let balls = [];
        let effects = [];
        let nextBallId = 1;
        let lastDropAt = 0;

        let autoMode = false;
        let autoRemaining = 0;
        let autoTimer = 0;

        let muted = false;
        let audioContext = null;

        const style = document.createElement('style');
        style.textContent = `
            .pl-game {
                --bg:#07101a;
                --panel:#111d2c;
                --panel2:#18283c;
                --text:#f5f8ff;
                --muted:#8196ad;
                --cyan:#31dcff;
                --blue:#4d86ff;
                --green:#55e69a;
                --gold:#ffd166;
                --pink:#ff5b88;
                --danger:#ff4d6d;

                width:100%;
                height:100%;
                position:relative;
                overflow:hidden;
                color:var(--text);
                font-family:inherit;
                background:
                    radial-gradient(circle at 50% 15%,rgba(49,220,255,.08),transparent 38%),
                    radial-gradient(circle at 15% 85%,rgba(77,134,255,.05),transparent 32%),
                    var(--bg);
            }

            .pl-game * { box-sizing:border-box; }

            .pl-canvas {
                position:absolute;
                inset:0;
                width:100%;
                height:100%;
                display:block;
            }

            .pl-topbar {
                position:absolute;
                z-index:10;
                left:14px;
                right:14px;
                top:14px;
                display:flex;
                align-items:flex-start;
                justify-content:space-between;
                gap:10px;
                pointer-events:none;
            }

            .pl-top-group {
                display:flex;
                gap:8px;
                flex-wrap:wrap;
            }

            .pl-stat {
                min-width:112px;
                padding:8px 11px;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(12,21,34,.82);
                backdrop-filter:blur(10px);
            }

            .pl-stat-label {
                color:#71869f;
                font-size:.60rem;
                font-weight:850;
                text-transform:uppercase;
                letter-spacing:.08em;
            }

            .pl-stat-value {
                margin-top:2px;
                font-size:.98rem;
                font-weight:950;
            }

            .pl-credits { color:var(--cyan); }
            .pl-profit.positive { color:var(--green); }
            .pl-profit.negative { color:var(--pink); }
            .pl-biggest { color:var(--gold); }

            .pl-controls {
                position:absolute;
                z-index:14;
                left:16px;
                top:82px;
                width:270px;
                padding:16px;
                border-radius:17px;
                border:1px solid rgba(255,255,255,.085);
                background:rgba(12,21,34,.90);
                backdrop-filter:blur(14px);
                box-shadow:0 18px 48px rgba(0,0,0,.28);
            }

            .pl-panel-title {
                font-size:.72rem;
                font-weight:950;
                text-transform:uppercase;
                letter-spacing:.10em;
                color:#c8d6e5;
                margin-bottom:13px;
            }

            .pl-label-row {
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:10px;
                margin:12px 0 7px;
            }

            .pl-label {
                color:#869ab1;
                font-size:.67rem;
                font-weight:850;
                text-transform:uppercase;
                letter-spacing:.07em;
            }

            .pl-label-value {
                color:#e7f0f8;
                font-size:.76rem;
                font-weight:900;
            }

            .pl-segment {
                display:grid;
                grid-template-columns:repeat(3,1fr);
                gap:5px;
            }

            .pl-segment.rows {
                grid-template-columns:repeat(5,1fr);
            }

            .pl-seg-btn {
                min-width:0;
                padding:8px 5px;
                border-radius:9px;
                border:1px solid rgba(255,255,255,.07);
                background:rgba(255,255,255,.025);
                color:#8ea3ba;
                font:inherit;
                font-size:.67rem;
                font-weight:850;
                cursor:pointer;
            }

            .pl-seg-btn:hover {
                border-color:rgba(49,220,255,.25);
            }

            .pl-seg-btn.selected {
                color:#06121a;
                background:var(--cyan);
                border-color:var(--cyan);
            }

            .pl-bet-row {
                display:grid;
                grid-template-columns:34px 1fr 34px;
                gap:6px;
                align-items:center;
            }

            .pl-mini-btn {
                height:36px;
                border-radius:9px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(255,255,255,.035);
                color:#dce8f5;
                font:inherit;
                font-weight:950;
                cursor:pointer;
            }

            .pl-mini-btn:hover {
                background:rgba(255,255,255,.07);
            }

            .pl-bet-input {
                width:100%;
                height:36px;
                border-radius:9px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(5,11,19,.60);
                color:#f4f8ff;
                text-align:center;
                font:inherit;
                font-weight:950;
                outline:none;
            }

            .pl-range {
                width:100%;
                margin-top:8px;
                accent-color:var(--cyan);
                cursor:pointer;
            }

            .pl-drop-btn {
                width:100%;
                margin-top:14px;
                height:46px;
                border:0;
                border-radius:11px;
                cursor:pointer;
                color:#06121a;
                font:inherit;
                font-weight:950;
                background:linear-gradient(135deg,var(--cyan),var(--blue));
                box-shadow:0 12px 28px rgba(49,220,255,.14);
            }

            .pl-drop-btn:hover { filter:brightness(1.08); }
            .pl-drop-btn:disabled {
                cursor:not-allowed;
                opacity:.45;
                filter:none;
            }

            .pl-auto-row {
                display:grid;
                grid-template-columns:1fr 1fr 1fr;
                gap:5px;
                margin-top:7px;
            }

            .pl-auto-btn {
                height:32px;
                border-radius:8px;
                border:1px solid rgba(255,255,255,.07);
                background:rgba(255,255,255,.025);
                color:#8196ad;
                font:inherit;
                font-size:.65rem;
                font-weight:850;
                cursor:pointer;
            }

            .pl-auto-btn:hover {
                border-color:rgba(49,220,255,.24);
                color:#cfe2f2;
            }

            .pl-auto-btn.stop {
                color:#ffd6df;
                border-color:rgba(255,91,136,.28);
            }

            .pl-help {
                margin-top:10px;
                color:#697e96;
                font-size:.63rem;
                line-height:1.42;
            }

            .pl-result-feed {
                position:absolute;
                z-index:12;
                right:16px;
                top:82px;
                width:184px;
                display:flex;
                flex-direction:column;
                gap:7px;
                pointer-events:none;
            }

            .pl-result-card {
                padding:8px 10px;
                border-radius:10px;
                border:1px solid rgba(255,255,255,.07);
                background:rgba(12,21,34,.78);
                backdrop-filter:blur(9px);
                animation:plResultIn .22s ease-out;
            }

            .pl-result-card.win {
                border-color:rgba(85,230,154,.22);
            }

            .pl-result-card.loss {
                border-color:rgba(255,91,136,.18);
            }

            .pl-result-top {
                display:flex;
                justify-content:space-between;
                gap:8px;
                font-size:.67rem;
            }

            .pl-result-multi {
                font-weight:950;
                color:#eaf5ff;
            }

            .pl-result-value {
                font-weight:950;
            }

            .pl-result-card.win .pl-result-value { color:var(--green); }
            .pl-result-card.loss .pl-result-value { color:var(--pink); }

            .pl-result-sub {
                margin-top:2px;
                color:#6f849b;
                font-size:.58rem;
            }

            .pl-audio {
                position:absolute;
                z-index:15;
                right:16px;
                bottom:15px;
                padding:8px 10px;
                border-radius:9px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(12,21,34,.78);
                color:#9eb1c4;
                font:inherit;
                font-size:.68rem;
                cursor:pointer;
            }

            .pl-tip {
                position:absolute;
                left:50%;
                top:78px;
                transform:translateX(-50%);
                z-index:11;
                color:#698096;
                font-size:.66rem;
                font-weight:750;
                pointer-events:none;
            }

            @keyframes plResultIn {
                0% { opacity:0; transform:translateX(12px); }
                100% { opacity:1; transform:translateX(0); }
            }

            @media (max-width:850px) {
                .pl-controls {
                    left:8px;
                    top:auto;
                    bottom:8px;
                    width:250px;
                    padding:12px;
                }

                .pl-result-feed {
                    right:8px;
                    top:70px;
                    width:145px;
                }

                .pl-stat {
                    min-width:0;
                    padding:7px 8px;
                }

                .pl-stat-label {
                    font-size:.52rem;
                }

                .pl-stat-value {
                    font-size:.76rem;
                }

                .pl-topbar {
                    left:7px;
                    right:7px;
                    top:7px;
                    gap:4px;
                }

                .pl-tip { display:none; }
            }

            @media (max-width:620px) {
                .pl-controls {
                    width:calc(100% - 16px);
                    max-width:none;
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:0 12px;
                }

                .pl-controls .pl-panel-title,
                .pl-controls .pl-drop-btn,
                .pl-controls .pl-auto-row,
                .pl-controls .pl-help {
                    grid-column:1 / -1;
                }

                .pl-result-feed {
                    display:none;
                }

                .pl-top-group .pl-stat:nth-child(2) {
                    display:none;
                }
            }
        `;

        const root = document.createElement('div');
        root.className = 'pl-game';
        root.innerHTML = `
            <canvas class="pl-canvas"></canvas>

            <div class="pl-topbar">
                <div class="pl-top-group">
                    <div class="pl-stat">
                        <div class="pl-stat-label">Demo Credits</div>
                        <div class="pl-stat-value pl-credits">1,000</div>
                    </div>
                    <div class="pl-stat">
                        <div class="pl-stat-label">Profit</div>
                        <div class="pl-stat-value pl-profit">0</div>
                    </div>
                </div>

                <div class="pl-top-group">
                    <div class="pl-stat">
                        <div class="pl-stat-label">Biggest Win</div>
                        <div class="pl-stat-value pl-biggest">0</div>
                    </div>
                    <div class="pl-stat">
                        <div class="pl-stat-label">Drops</div>
                        <div class="pl-stat-value pl-drops">0</div>
                    </div>
                </div>
            </div>

            <div class="pl-tip">SPACE = Drop · Die Kugel fällt physikalisch durch das Peg-Feld.</div>

            <div class="pl-controls">
                <div class="pl-panel-title">Plinko Settings</div>

                <div>
                    <div class="pl-label-row">
                        <span class="pl-label">Risk</span>
                        <span class="pl-label-value pl-risk-label">Medium</span>
                    </div>

                    <div class="pl-segment pl-risk-buttons">
                        ${Object.entries(RISK_PROFILES).map(([key, value]) => `
                            <button class="pl-seg-btn ${key === riskKey ? 'selected' : ''}" data-risk="${key}" type="button">
                                ${value.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <div class="pl-label-row">
                        <span class="pl-label">Rows</span>
                        <span class="pl-label-value pl-rows-label">${rows}</span>
                    </div>

                    <div class="pl-segment rows pl-row-buttons">
                        ${ROW_OPTIONS.map(value => `
                            <button class="pl-seg-btn ${value === rows ? 'selected' : ''}" data-rows="${value}" type="button">
                                ${value}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <div class="pl-label-row">
                        <span class="pl-label">Bet</span>
                        <span class="pl-label-value">Credits</span>
                    </div>

                    <div class="pl-bet-row">
                        <button class="pl-mini-btn pl-bet-minus" type="button">−</button>
                        <input class="pl-bet-input" value="${bet}" inputmode="numeric">
                        <button class="pl-mini-btn pl-bet-plus" type="button">+</button>
                    </div>

                    <input class="pl-range" type="range"
                        min="${CONFIG.minBet}"
                        max="${CONFIG.maxBet}"
                        step="${CONFIG.betStep}"
                        value="${bet}">
                </div>

                <button class="pl-drop-btn" type="button">DROP BALL</button>

                <div class="pl-auto-row">
                    <button class="pl-auto-btn" data-auto="10" type="button">Auto ×10</button>
                    <button class="pl-auto-btn" data-auto="25" type="button">Auto ×25</button>
                    <button class="pl-auto-btn pl-stop-auto" type="button">Stop</button>
                </div>

                <div class="pl-help">
                    Virtuelle Credits ohne Echtgeld. Mehr Rows und höheres Risk erzeugen extremere Multiplikatoren.
                </div>
            </div>

            <div class="pl-result-feed"></div>

            <button class="pl-audio" type="button">Sound: An</button>
        `;

        container.append(style, root);

        const canvas = root.querySelector('.pl-canvas');
        const ctx = canvas.getContext('2d');

        const creditsEl = root.querySelector('.pl-credits');
        const profitEl = root.querySelector('.pl-profit');
        const biggestEl = root.querySelector('.pl-biggest');
        const dropsEl = root.querySelector('.pl-drops');

        const riskLabelEl = root.querySelector('.pl-risk-label');
        const rowsLabelEl = root.querySelector('.pl-rows-label');

        const riskButtons = [...root.querySelectorAll('[data-risk]')];
        const rowButtons = [...root.querySelectorAll('[data-rows]')];

        const betInput = root.querySelector('.pl-bet-input');
        const betRange = root.querySelector('.pl-range');
        const betMinus = root.querySelector('.pl-bet-minus');
        const betPlus = root.querySelector('.pl-bet-plus');

        const dropBtn = root.querySelector('.pl-drop-btn');
        const autoButtons = [...root.querySelectorAll('[data-auto]')];
        const stopAutoBtn = root.querySelector('.pl-stop-auto');

        const feedEl = root.querySelector('.pl-result-feed');
        const audioBtn = root.querySelector('.pl-audio');

        const timers = new Set();

        const schedule = (fn, delay) => {
            const id = setTimeout(() => {
                timers.delete(id);
                if (!destroyed) fn();
            }, delay);

            timers.add(id);
            return id;
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

        const tone = (frequency, duration = 0.04, volume = 0.022, type = 'sine') => {
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

        const currentProfile = () => RISK_PROFILES[riskKey];

        const currentMultipliers = () =>
            currentProfile().multipliers[rows];

        const formatNumber = value =>
            Math.round(value).toLocaleString('de-DE');

        const updateHud = () => {
            creditsEl.textContent = formatNumber(credits);

            const profit = credits - CONFIG.startingCredits;

            profitEl.textContent =
                `${profit >= 0 ? '+' : ''}${formatNumber(profit)}`;

            profitEl.classList.toggle('positive', profit > 0);
            profitEl.classList.toggle('negative', profit < 0);

            biggestEl.textContent = formatNumber(biggestWin);
            dropsEl.textContent = ballsDropped.toLocaleString('de-DE');

            dropBtn.disabled =
                credits < bet ||
                balls.length >= CONFIG.maxBalls;

            riskLabelEl.textContent = currentProfile().label;
            rowsLabelEl.textContent = rows;
        };

        const setBet = value => {
            const maxAllowed = Math.min(
                CONFIG.maxBet,
                Math.max(CONFIG.minBet, Math.floor(Math.max(credits, CONFIG.minBet) / CONFIG.betStep) * CONFIG.betStep)
            );

            bet = clamp(
                Math.round(Number(value) / CONFIG.betStep) * CONFIG.betStep,
                CONFIG.minBet,
                Math.max(CONFIG.minBet, maxAllowed)
            );

            betInput.value = bet;
            betRange.value = bet;

            updateHud();
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

            buildBoard(width, height);
        };

        const buildBoard = (width, height) => {
            const mobile = width < 680;

            const controlAllowance = mobile ? 8 : Math.min(300, width * 0.29);
            const rightAllowance = mobile ? 8 : Math.min(120, width * 0.12);

            const usableLeft = mobile ? 18 : controlAllowance + 20;
            const usableRight = width - (mobile ? 18 : rightAllowance + 15);

            const boardWidth = Math.min(
                usableRight - usableLeft,
                Math.max(420, height * 0.85)
            );

            board.centerX = (usableLeft + usableRight) / 2;
            board.left = board.centerX - boardWidth / 2;
            board.right = board.centerX + boardWidth / 2;
            board.top = mobile ? 70 : 72;
            board.slotHeight = mobile ? 46 : 54;
            board.slotY = height - (mobile ? 235 : 68);
            board.bottom = board.slotY;

            const availableHeight = board.bottom - board.top - 20;

            board.pegGapY = availableHeight / (rows + 1.4);
            board.pegGapX = Math.min(
                boardWidth / (rows + 2.8),
                board.pegGapY * 1.15
            );

            board.pegs = [];

            for (let row = 0; row < rows; row++) {
                const count = row + 3;
                const y = board.top + (row + 1) * board.pegGapY;
                const rowWidth = (count - 1) * board.pegGapX;
                const startX = board.centerX - rowWidth / 2;

                for (let col = 0; col < count; col++) {
                    board.pegs.push({
                        x: startX + col * board.pegGapX,
                        y,
                        row
                    });
                }
            }

            const multipliers = currentMultipliers();
            const slotCount = multipliers.length;
            const slotWidth = board.pegGapX;

            board.slots = multipliers.map((multiplier, index) => {
                const x = board.centerX + (index - (slotCount - 1) / 2) * slotWidth;

                return {
                    index,
                    multiplier,
                    x,
                    width: slotWidth * 0.88
                };
            });

            balls.forEach(ball => {
                ball.x = clamp(ball.x, board.left, board.right);
                ball.y = Math.min(ball.y, board.slotY - 12);
            });
        };

        const pegHit = (ball, peg) => {
            const dx = ball.x - peg.x;
            const dy = ball.y - peg.y;
            const minDist = CONFIG.ballRadius + CONFIG.pegRadius;
            const distSq = dx * dx + dy * dy;

            if (distSq >= minDist * minDist) return false;

            const dist = Math.max(0.001, Math.sqrt(distSq));
            const nx = dx / dist;
            const ny = dy / dist;

            const overlap = minDist - dist;

            ball.x += nx * overlap;
            ball.y += ny * overlap;

            const velocityAlongNormal = ball.vx * nx + ball.vy * ny;

            if (velocityAlongNormal < 0) {
                ball.vx -= (1 + CONFIG.restitution) * velocityAlongNormal * nx;
                ball.vy -= (1 + CONFIG.restitution) * velocityAlongNormal * ny;
            }

            const horizontalKick =
                (ball.x >= peg.x ? 1 : -1) *
                rand(18, 52);

            ball.vx += horizontalKick;

            if (ball.lastPegId !== peg.id) {
                ball.lastPegId = peg.id;
                ball.lastPegTime = performance.now();
                tone(360 + peg.row * 18 + Math.random() * 70, 0.025, 0.008, 'triangle');
            }

            return true;
        };

        const getSlotIndexForX = x => {
            if (!board.slots.length) return 0;

            let bestIndex = 0;
            let bestDistance = Infinity;

            board.slots.forEach(slot => {
                const distance = Math.abs(x - slot.x);

                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestIndex = slot.index;
                }
            });

            return bestIndex;
        };

        const spawnParticles = (x, y, color, count = 12) => {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = rand(30, 115);

                effects.push({
                    type: 'particle',
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 25,
                    life: rand(0.38, 0.66),
                    maxLife: 0,
                    color,
                    size: rand(1.5, 3.6)
                });

                effects[effects.length - 1].maxLife =
                    effects[effects.length - 1].life;
            }
        };

        const addResultFeed = (multiplier, payout, stake) => {
            const net = payout - stake;
            const card = document.createElement('div');

            card.className =
                `pl-result-card ${net >= 0 ? 'win' : 'loss'}`;

            card.innerHTML = `
                <div class="pl-result-top">
                    <span class="pl-result-multi">${multiplier}×</span>
                    <span class="pl-result-value">${net >= 0 ? '+' : ''}${formatNumber(net)}</span>
                </div>
                <div class="pl-result-sub">${formatNumber(stake)} → ${formatNumber(payout)}</div>
            `;

            feedEl.prepend(card);

            while (feedEl.children.length > 6) {
                feedEl.lastElementChild?.remove();
            }

            schedule(() => {
                card.style.opacity = '0.55';
            }, 4200);
        };

        const resolveBall = ball => {
            const slotIndex = getSlotIndexForX(ball.x);
            const slot = board.slots[slotIndex];
            const multiplier = slot.multiplier;

            const payout = Math.round(ball.bet * multiplier);
            credits += payout;
            totalReturned += payout;

            const net = payout - ball.bet;

            biggestWin = Math.max(biggestWin, payout);
            peakCredits = Math.max(peakCredits, credits);

            const color =
                multiplier >= 10
                    ? '#ffd166'
                    : multiplier >= 2
                        ? '#55e69a'
                        : multiplier >= 1
                            ? '#31dcff'
                            : '#ff5b88';

            effects.push({
                type: 'ring',
                x: slot.x,
                y: board.slotY + 4,
                radius: 8,
                maxRadius: slot.width * 0.72,
                life: 0.48,
                maxLife: 0.48,
                color
            });

            effects.push({
                type: 'text',
                x: slot.x,
                y: board.slotY - 8,
                text: `${multiplier}×`,
                life: 0.72,
                maxLife: 0.72,
                color
            });

            spawnParticles(
                slot.x,
                board.slotY,
                color,
                multiplier >= 10 ? 22 : multiplier >= 2 ? 14 : 8
            );

            addResultFeed(multiplier, payout, ball.bet);

            if (multiplier >= 10) {
                tone(620, 0.06, 0.03);
                schedule(() => tone(860, 0.08, 0.035), 55);
            } else if (multiplier >= 1) {
                tone(560, 0.055, 0.018);
            } else {
                tone(220, 0.06, 0.015, 'sawtooth');
            }

            updateHud();

            services?.highscores?.saveHighscore?.(
                'plinko',
                Math.round(peakCredits)
            );
        };

        const dropBall = () => {
            const now = performance.now();

            if (
                now - lastDropAt < CONFIG.dropCooldownMs ||
                balls.length >= CONFIG.maxBalls ||
                credits < bet
            ) {
                return false;
            }

            ensureAudio();

            lastDropAt = now;

            credits -= bet;
            totalDropped += bet;
            ballsDropped++;

            const jitter = rand(-1.8, 1.8);

            balls.push({
                id: nextBallId++,
                x: board.centerX + jitter,
                y: board.top - 22,
                vx: rand(-7, 7),
                vy: 0,
                bet,
                lastPegId: null,
                lastPegTime: 0,
                resolved: false
            });

            tone(510, 0.035, 0.015, 'sine');

            updateHud();
            return true;
        };

        const updateBalls = delta => {
            const resolvedIds = new Set();

            for (const ball of balls) {
                ball.vy += CONFIG.gravity * delta;

                ball.x += ball.vx * delta;
                ball.y += ball.vy * delta;

                const leftBound = board.left - 8;
                const rightBound = board.right + 8;

                if (ball.x - CONFIG.ballRadius < leftBound) {
                    ball.x = leftBound + CONFIG.ballRadius;
                    ball.vx = Math.abs(ball.vx) * CONFIG.sideBounce;
                }

                if (ball.x + CONFIG.ballRadius > rightBound) {
                    ball.x = rightBound - CONFIG.ballRadius;
                    ball.vx = -Math.abs(ball.vx) * CONFIG.sideBounce;
                }

                for (let pass = 0; pass < 2; pass++) {
                    for (let i = 0; i < board.pegs.length; i++) {
                        const peg = board.pegs[i];

                        if (
                            Math.abs(ball.y - peg.y) > board.pegGapY * 0.55 ||
                            Math.abs(ball.x - peg.x) > board.pegGapX * 0.7
                        ) {
                            continue;
                        }

                        peg.id = i;
                        pegHit(ball, peg);
                    }
                }

                if (ball.y >= board.slotY - 4) {
                    resolveBall(ball);
                    resolvedIds.add(ball.id);
                }
            }

            if (resolvedIds.size) {
                balls = balls.filter(ball => !resolvedIds.has(ball.id));
            }
        };

        const updateEffects = delta => {
            for (let i = effects.length - 1; i >= 0; i--) {
                const effect = effects[i];
                effect.life -= delta;

                if (effect.type === 'particle') {
                    effect.vy += 180 * delta;
                    effect.x += effect.vx * delta;
                    effect.y += effect.vy * delta;
                }

                if (effect.type === 'text') {
                    effect.y -= 24 * delta;
                }

                if (effect.life <= 0) {
                    effects.splice(i, 1);
                }
            }
        };

        const updateAuto = delta => {
            if (!autoMode) return;

            if (
                autoRemaining <= 0 ||
                credits < bet
            ) {
                autoMode = false;
                autoRemaining = 0;
                return;
            }

            autoTimer -= delta;

            if (autoTimer <= 0) {
                const dropped = dropBall();

                if (dropped) {
                    autoRemaining--;
                    autoTimer = 0.18;
                } else {
                    autoTimer = 0.08;
                }
            }
        };

        const slotColor = multiplier => {
            if (riskKey === 'high') {
                if (multiplier >= 20) return '#ff5b88';
                if (multiplier >= 3) return '#ff986b';
                if (multiplier >= 1) return '#ffd166';
                return '#9b3b67';
            }

            if (riskKey === 'medium') {
                if (multiplier >= 10) return '#ffd166';
                if (multiplier >= 2) return '#55e69a';
                if (multiplier >= 1) return '#31dcff';
                return '#475a83';
            }

            if (multiplier >= 4) return '#55e69a';
            if (multiplier >= 1) return '#31dcff';
            return '#53657a';
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

            ctx.fillStyle = '#07101a';
            ctx.fillRect(0, 0, width, height);

            const radial = ctx.createRadialGradient(
                board.centerX,
                board.top + (board.bottom - board.top) * 0.38,
                20,
                board.centerX,
                board.top + (board.bottom - board.top) * 0.38,
                Math.max(280, (board.bottom - board.top) * 0.8)
            );

            radial.addColorStop(0, 'rgba(49,220,255,.065)');
            radial.addColorStop(1, 'rgba(49,220,255,0)');

            ctx.fillStyle = radial;
            ctx.fillRect(0, 0, width, height);

            ctx.strokeStyle = 'rgba(111,177,223,.045)';
            ctx.lineWidth = 1;

            const grid = 56;

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

        const drawBoardGuide = () => {
            ctx.save();

            const topY = board.top - 28;

            ctx.strokeStyle = 'rgba(49,220,255,.16)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 7]);

            ctx.beginPath();
            ctx.moveTo(board.centerX, topY);
            ctx.lineTo(board.centerX, board.top + 3);
            ctx.stroke();

            ctx.setLineDash([]);

            ctx.fillStyle = '#89f2ff';
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#31dcff';

            ctx.beginPath();
            ctx.arc(board.centerX, topY - 3, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        };

        const drawPegs = () => {
            for (const peg of board.pegs) {
                ctx.save();

                const glowStrength =
                    0.18 + peg.row / Math.max(1, rows - 1) * 0.12;

                ctx.fillStyle = '#d9ecf7';
                ctx.shadowBlur = 8;
                ctx.shadowColor = `rgba(49,220,255,${glowStrength})`;

                ctx.beginPath();
                ctx.arc(
                    peg.x,
                    peg.y,
                    CONFIG.pegRadius,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.restore();
            }
        };

        const drawSlots = () => {
            for (const slot of board.slots) {
                const color = slotColor(slot.multiplier);

                const x = slot.x - slot.width / 2;
                const y = board.slotY + 5;

                ctx.save();

                ctx.fillStyle = 'rgba(10,18,29,.88)';
                drawRoundedRect(
                    x,
                    y,
                    slot.width,
                    board.slotHeight,
                    8
                );
                ctx.fill();

                ctx.globalAlpha = 0.82;
                ctx.fillStyle = color;

                drawRoundedRect(
                    x + 2,
                    y + 2,
                    slot.width - 4,
                    6,
                    4
                );
                ctx.fill();

                ctx.globalAlpha = 1;

                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.38;
                drawRoundedRect(
                    x,
                    y,
                    slot.width,
                    board.slotHeight,
                    8
                );
                ctx.stroke();

                ctx.globalAlpha = 1;

                ctx.fillStyle = color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const label =
                    slot.multiplier >= 100
                        ? `${slot.multiplier}x`
                        : `${slot.multiplier}×`;

                const fontSize =
                    Math.max(8, Math.min(12, slot.width * 0.25));

                ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
                ctx.fillText(
                    label,
                    slot.x,
                    y + board.slotHeight * 0.55
                );

                ctx.restore();
            }
        };

        const drawBalls = () => {
            for (const ball of balls) {
                ctx.save();

                const gradient = ctx.createRadialGradient(
                    ball.x - 2.5,
                    ball.y - 3,
                    1,
                    ball.x,
                    ball.y,
                    CONFIG.ballRadius * 1.2
                );

                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.35, '#9cf5ff');
                gradient.addColorStop(1, '#31b7e9');

                ctx.fillStyle = gradient;
                ctx.shadowBlur = 14;
                ctx.shadowColor = 'rgba(49,220,255,.58)';

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
            }
        };

        const drawEffects = () => {
            for (const effect of effects) {
                const alpha =
                    clamp(
                        effect.life / effect.maxLife,
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
                    const progress =
                        1 - effect.life / effect.maxLife;

                    const radius =
                        effect.radius +
                        (effect.maxRadius - effect.radius) * progress;

                    ctx.strokeStyle = effect.color;
                    ctx.lineWidth = 2 * (1 - progress * 0.5);

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
                    ctx.font = '950 15px system-ui, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowBlur = 10;
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
            drawBoardGuide();
            drawPegs();
            drawSlots();
            drawBalls();
            drawEffects();
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

            updateAuto(delta);
            updateBalls(delta);
            updateEffects(delta);
            draw();

            animationId = requestAnimationFrame(loop);
        };

        const updateRiskSelection = () => {
            riskButtons.forEach(button => {
                button.classList.toggle(
                    'selected',
                    button.dataset.risk === riskKey
                );
            });

            buildBoard(root.clientWidth, root.clientHeight);
            updateHud();
        };

        const updateRowsSelection = () => {
            rowButtons.forEach(button => {
                button.classList.toggle(
                    'selected',
                    Number(button.dataset.rows) === rows
                );
            });

            buildBoard(root.clientWidth, root.clientHeight);
            updateHud();
        };

        riskButtons.forEach(button => {
            button.addEventListener('click', () => {
                riskKey = button.dataset.risk;
                updateRiskSelection();
            });
        });

        rowButtons.forEach(button => {
            button.addEventListener('click', () => {
                rows = Number(button.dataset.rows);
                updateRowsSelection();
            });
        });

        betMinus.addEventListener('click', () => {
            setBet(bet - CONFIG.betStep);
        });

        betPlus.addEventListener('click', () => {
            setBet(bet + CONFIG.betStep);
        });

        betRange.addEventListener('input', () => {
            setBet(Number(betRange.value));
        });

        betInput.addEventListener('change', () => {
            setBet(Number(betInput.value));
        });

        betInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                setBet(Number(betInput.value));
                betInput.blur();
            }
        });

        dropBtn.addEventListener('click', dropBall);

        autoButtons.forEach(button => {
            button.addEventListener('click', () => {
                autoRemaining = Number(button.dataset.auto);
                autoMode = true;
                autoTimer = 0;
            });
        });

        stopAutoBtn.addEventListener('click', () => {
            autoMode = false;
            autoRemaining = 0;
        });

        audioBtn.addEventListener('click', () => {
            muted = !muted;
            audioBtn.textContent = `Sound: ${muted ? 'Aus' : 'An'}`;

            if (!muted) {
                ensureAudio();
                tone(620, 0.04, 0.02);
            }
        });

        const onKeyDown = event => {
            if (
                event.code === 'Space' &&
                !event.repeat &&
                document.activeElement !== betInput
            ) {
                event.preventDefault();
                dropBall();
            }
        };

        window.addEventListener('keydown', onKeyDown);

        resizeObserver =
            new ResizeObserver(resizeCanvas);

        resizeObserver.observe(root);

        resizeCanvas();
        setBet(bet);
        updateHud();

        animationId =
            requestAnimationFrame(loop);

        return {
            destroy: () => {
                destroyed = true;

                cancelAnimationFrame(animationId);
                resizeObserver?.disconnect();

                timers.forEach(id => clearTimeout(id));
                timers.clear();

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
    RISK_PROFILES,
    ROW_OPTIONS,
    CONFIG
};
