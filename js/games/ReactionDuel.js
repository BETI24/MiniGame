const MODES = {
    classic: {
        label: 'Classic',
        icon: '↔',
        short: 'Links oder rechts. Schnell und direkt.',
        rounds: 12,
        directions: ['left', 'right'],
        fakeChance: 0.18,
        maxFakes: 1,
        timeoutMs: 950,
        endless: false
    },
    fourway: {
        label: '4-Way',
        icon: '✦',
        short: 'WASD in alle vier Richtungen.',
        rounds: 15,
        directions: ['up', 'left', 'down', 'right'],
        fakeChance: 0.16,
        maxFakes: 1,
        timeoutMs: 950,
        endless: false
    },
    focus: {
        label: 'Focus',
        icon: '◇',
        short: 'Viele Fakeouts. Nicht nervös werden.',
        rounds: 16,
        directions: ['up', 'left', 'down', 'right'],
        fakeChance: 0.46,
        maxFakes: 2,
        timeoutMs: 900,
        endless: false
    },
    endurance: {
        label: 'Endurance',
        icon: '∞',
        short: '3 Leben. Wird immer schneller.',
        rounds: null,
        directions: ['up', 'left', 'down', 'right'],
        fakeChance: 0.28,
        maxFakes: 2,
        timeoutMs: 900,
        endless: true
    }
};

const INTENSITIES = {
    relaxed: {
        label: 'Relaxed',
        delayMin: 1250,
        delayMax: 2650,
        fakeMultiplier: 0.70,
        timeoutMultiplier: 1.18,
        scoreMultiplier: 0.85
    },
    normal: {
        label: 'Normal',
        delayMin: 900,
        delayMax: 2200,
        fakeMultiplier: 1.00,
        timeoutMultiplier: 1.00,
        scoreMultiplier: 1.00
    },
    fast: {
        label: 'Fast',
        delayMin: 700,
        delayMax: 1750,
        fakeMultiplier: 1.22,
        timeoutMultiplier: 0.88,
        scoreMultiplier: 1.15
    },
    chaos: {
        label: 'Chaos',
        delayMin: 540,
        delayMax: 1450,
        fakeMultiplier: 1.48,
        timeoutMultiplier: 0.78,
        scoreMultiplier: 1.32
    }
};

const REACTION_TIERS = [
    { max: 140, label: 'LIGHTNING', bonus: 520 },
    { max: 180, label: 'PERFECT', bonus: 330 },
    { max: 230, label: 'FAST', bonus: 170 },
    { max: 300, label: 'GOOD', bonus: 75 },
    { max: Infinity, label: 'LATE', bonus: 0 }
];

const DIRECTION_META = {
    up:    { key: 'W', arrow: '↑', keyAlt: '↑', rotation: -45 },
    left:  { key: 'A', arrow: '←', keyAlt: '←', rotation: -135 },
    down:  { key: 'S', arrow: '↓', keyAlt: '↓', rotation: 135 },
    right: { key: 'D', arrow: '→', keyAlt: '→', rotation: 45 }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rand = (min, max) => min + Math.random() * (max - min);

export default {
    manifest: {
        id: 'reaction-duel',
        name: 'Reaction Challenge',
        description: 'Reagiere auf Richtungssignale, ignoriere Fakeouts und verbessere deine Reaktionszeit.',
        icon: '⚡',
        tags: ['Reaction', 'Arcade', 'Challenge', 'Highscore']
    },

    init: (container, services) => {
        let destroyed = false;

        let selectedModeKey = 'classic';
        let selectedIntensityKey = 'normal';
        let mode = MODES[selectedModeKey];
        let intensity = INTENSITIES[selectedIntensityKey];

        let phase = 'menu';
        let roundToken = 0;
        let roundNumber = 0;
        let completedRounds = 0;

        let score = 0;
        let streak = 0;
        let bestStreak = 0;
        let lives = 3;

        let attempts = 0;
        let correct = 0;
        let fouls = 0;
        let wrongInputs = 0;
        let reactionTimes = [];

        let currentDirection = 'left';
        let signalShownAt = 0;
        let resolved = false;

        let muted = false;
        let audioContext = null;
        const timers = new Set();

        const style = document.createElement('style');
        style.textContent = `
            .rc-game {
                --bg:#070b13;
                --panel:#111c2b;
                --panel2:#19283b;
                --text:#f4f8ff;
                --muted:#8296ae;
                --cyan:#31dcff;
                --cyan2:#89f2ff;
                --blue:#4b87ff;
                --purple:#b368ff;
                --pink:#ff5b88;
                --gold:#ffd166;
                --green:#55e69a;
                --danger:#ff4d6d;

                position:relative;
                width:100%;
                height:100%;
                overflow:hidden;
                color:var(--text);
                font-family:inherit;
                background:
                    radial-gradient(circle at 18% 18%,rgba(49,220,255,.07),transparent 32%),
                    radial-gradient(circle at 83% 76%,rgba(179,104,255,.07),transparent 34%),
                    var(--bg);
            }

            .rc-game * { box-sizing:border-box; }

            .rc-arena {
                position:absolute;
                inset:0;
                overflow:hidden;
            }

            .rc-zone {
                position:absolute;
                opacity:.12;
                transition:opacity .11s ease, background .11s ease;
                pointer-events:none;
            }

            .rc-zone.up {
                left:25%;
                right:25%;
                top:0;
                height:28%;
                background:linear-gradient(180deg,rgba(49,220,255,.34),transparent);
            }

            .rc-zone.down {
                left:25%;
                right:25%;
                bottom:0;
                height:28%;
                background:linear-gradient(0deg,rgba(179,104,255,.34),transparent);
            }

            .rc-zone.left {
                top:22%;
                bottom:22%;
                left:0;
                width:28%;
                background:linear-gradient(90deg,rgba(49,220,255,.28),transparent);
            }

            .rc-zone.right {
                top:22%;
                bottom:22%;
                right:0;
                width:28%;
                background:linear-gradient(-90deg,rgba(255,91,136,.28),transparent);
            }

            .rc-arena.active-up .rc-zone.up,
            .rc-arena.active-down .rc-zone.down,
            .rc-arena.active-left .rc-zone.left,
            .rc-arena.active-right .rc-zone.right {
                opacity:1;
            }

            .rc-topbar {
                position:absolute;
                z-index:14;
                left:14px;
                right:14px;
                top:14px;
                display:grid;
                grid-template-columns:1fr auto 1fr;
                gap:9px;
                align-items:start;
                pointer-events:none;
            }

            .rc-top-side {
                display:flex;
                gap:8px;
                flex-wrap:wrap;
            }

            .rc-top-side.right { justify-content:flex-end; }

            .rc-chip,
            .rc-round-chip {
                padding:8px 11px;
                min-width:104px;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(13,22,36,.82);
                backdrop-filter:blur(10px);
            }

            .rc-round-chip {
                min-width:126px;
                text-align:center;
            }

            .rc-chip-label {
                color:#72879f;
                font-size:.61rem;
                font-weight:850;
                text-transform:uppercase;
                letter-spacing:.08em;
            }

            .rc-chip-value {
                margin-top:2px;
                font-size:.98rem;
                font-weight:950;
            }

            .rc-score { color:var(--cyan2); }
            .rc-streak { color:var(--gold); }
            .rc-best { color:#dbe8f4; }
            .rc-lives { color:var(--pink); }

            .rc-center {
                position:absolute;
                left:50%;
                top:50%;
                transform:translate(-50%,-50%);
                z-index:8;
                display:flex;
                flex-direction:column;
                align-items:center;
                width:min(560px,84vw);
                pointer-events:none;
            }

            .rc-status {
                margin-bottom:16px;
                text-align:center;
                min-height:58px;
            }

            .rc-status-main {
                font-size:clamp(1.35rem,3vw,2.1rem);
                font-weight:950;
                letter-spacing:.03em;
            }

            .rc-status-sub {
                margin-top:5px;
                color:var(--muted);
                font-size:.78rem;
            }

            .rc-status.wait .rc-status-main { color:#9fb0c2; }
            .rc-status.go .rc-status-main { color:#f3f8ff; }
            .rc-status.success .rc-status-main { color:var(--green); }
            .rc-status.fail .rc-status-main { color:var(--danger); }
            .rc-status.foul .rc-status-main { color:var(--gold); }

            .rc-signal {
                width:144px;
                height:144px;
                display:flex;
                align-items:center;
                justify-content:center;
                border-radius:30px;
                border:2px solid rgba(255,255,255,.08);
                background:rgba(9,16,27,.88);
                box-shadow:0 18px 58px rgba(0,0,0,.30);
                opacity:0;
                transform:scale(.76);
            }

            .rc-signal.visible {
                opacity:1;
                transform:scale(1);
                color:var(--cyan2);
                border-color:rgba(49,220,255,.72);
                box-shadow:
                    0 0 0 8px rgba(49,220,255,.05),
                    0 0 48px rgba(49,220,255,.25);
                animation:rcPop .13s ease-out;
            }

            .rc-signal.fake {
                opacity:1;
                transform:scale(1);
                color:var(--gold);
                border-color:rgba(255,209,102,.64);
                box-shadow:
                    0 0 0 8px rgba(255,209,102,.045),
                    0 0 38px rgba(255,209,102,.20);
                animation:rcFake .16s ease-out;
            }

            .rc-arrow {
                font-size:4.6rem;
                line-height:1;
                font-weight:950;
                filter:drop-shadow(0 0 14px currentColor);
            }

            .rc-fake-mark {
                display:none;
                font-size:4rem;
                line-height:1;
                font-weight:950;
                transform:rotate(45deg);
                filter:drop-shadow(0 0 13px rgba(255,209,102,.55));
            }

            .rc-signal.fake .rc-arrow { display:none; }
            .rc-signal.fake .rc-fake-mark { display:block; }

            .rc-control-hint {
                margin-top:18px;
                display:flex;
                align-items:center;
                justify-content:center;
                gap:6px;
                min-height:38px;
            }

            .rc-key {
                min-width:36px;
                height:32px;
                padding:0 8px;
                display:flex;
                align-items:center;
                justify-content:center;
                border-radius:8px;
                border:1px solid rgba(255,255,255,.14);
                background:rgba(255,255,255,.055);
                color:#dce8f4;
                font-size:.82rem;
                font-weight:950;
                box-shadow:inset 0 -2px 0 rgba(0,0,0,.25);
            }

            .rc-key.active {
                color:#06121a;
                background:var(--cyan2);
                border-color:var(--cyan2);
                box-shadow:0 0 16px rgba(49,220,255,.34);
            }

            .rc-fake-hint {
                margin-left:9px;
                color:#8095ac;
                font-size:.68rem;
                font-weight:800;
            }

            .rc-fake-hint b { color:var(--gold); }

            .rc-bottom {
                position:absolute;
                left:50%;
                bottom:20px;
                transform:translateX(-50%);
                z-index:13;
                width:min(610px,calc(100% - 32px));
                text-align:center;
                pointer-events:none;
            }

            .rc-track {
                height:8px;
                overflow:hidden;
                border-radius:99px;
                background:rgba(255,255,255,.055);
            }

            .rc-track-fill {
                height:100%;
                width:0%;
                background:linear-gradient(90deg,var(--cyan),var(--blue),var(--purple));
                transition:width .25s ease;
            }

            .rc-result {
                margin-bottom:9px;
                min-height:18px;
                color:#8498af;
                font-size:.7rem;
                font-weight:800;
            }

            .rc-touch-grid {
                position:absolute;
                inset:0;
                z-index:5;
                display:grid;
                grid-template-columns:1fr 1fr;
                grid-template-rows:1fr 1fr;
            }

            .rc-touch-btn {
                appearance:none;
                border:0;
                background:transparent;
                cursor:pointer;
                -webkit-tap-highlight-color:transparent;
            }

            .rc-flash {
                position:absolute;
                inset:0;
                z-index:20;
                pointer-events:none;
                opacity:0;
            }

            .rc-flash.success {
                background:rgba(85,230,154,.10);
                animation:rcFlash .27s ease-out;
            }

            .rc-flash.fail {
                background:rgba(255,77,109,.10);
                animation:rcFlash .27s ease-out;
            }

            .rc-flash.foul {
                background:rgba(255,209,102,.10);
                animation:rcFlash .27s ease-out;
            }

            .rc-audio {
                position:absolute;
                z-index:24;
                right:14px;
                top:82px;
                padding:8px 10px;
                border-radius:10px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(13,22,36,.80);
                color:#aebfd0;
                font:inherit;
                font-size:.72rem;
                cursor:pointer;
            }

            .rc-overlay {
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

            .rc-overlay.hidden { display:none; }

            .rc-menu-card {
                width:min(1020px,100%);
                max-height:calc(100% - 8px);
                overflow:auto;
                padding:34px;
                border-radius:23px;
                border:1px solid rgba(255,255,255,.09);
                background:linear-gradient(180deg,rgba(27,43,63,.98),rgba(12,22,35,.98));
                box-shadow:0 30px 90px rgba(0,0,0,.44);
            }

            .rc-menu-top {
                display:grid;
                grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr);
                gap:28px;
                align-items:center;
            }

            .rc-kicker {
                color:var(--cyan);
                font-size:.72rem;
                font-weight:950;
                letter-spacing:.16em;
                text-transform:uppercase;
            }

            .rc-title {
                margin:6px 0 9px;
                font-size:clamp(2.6rem,5vw,4.4rem);
                line-height:1;
                font-weight:950;
                letter-spacing:-.045em;
            }

            .rc-desc {
                max-width:610px;
                color:#8fa3ba;
                font-size:.94rem;
                line-height:1.52;
            }

            .rc-how {
                padding:18px;
                border-radius:17px;
                border:1px solid rgba(49,220,255,.16);
                background:linear-gradient(145deg,rgba(49,220,255,.065),rgba(75,135,255,.025));
            }

            .rc-how-title {
                color:#d9e8f6;
                font-size:.72rem;
                font-weight:900;
                text-transform:uppercase;
                letter-spacing:.08em;
                margin-bottom:12px;
            }

            .rc-how-flow {
                display:grid;
                grid-template-columns:1fr auto 1fr auto 1fr;
                align-items:center;
                gap:7px;
            }

            .rc-how-step {
                min-width:0;
                text-align:center;
            }

            .rc-how-icon {
                height:45px;
                display:flex;
                align-items:center;
                justify-content:center;
                margin-bottom:6px;
                color:#edf7ff;
                font-size:1.5rem;
                font-weight:950;
            }

            .rc-how-step b {
                display:block;
                font-size:.72rem;
            }

            .rc-how-step span {
                display:block;
                margin-top:2px;
                color:#7c91a9;
                font-size:.62rem;
                line-height:1.3;
            }

            .rc-how-arrow {
                color:#49647e;
                font-size:1.1rem;
                font-weight:950;
            }

            .rc-how-keys {
                display:grid;
                grid-template-columns:repeat(3,27px);
                grid-template-rows:repeat(2,27px);
                gap:3px;
                justify-content:center;
            }

            .rc-mini-key {
                display:flex;
                align-items:center;
                justify-content:center;
                border-radius:6px;
                border:1px solid rgba(255,255,255,.14);
                background:rgba(255,255,255,.055);
                color:#dce8f4;
                font-size:.65rem;
                font-weight:950;
            }

            .rc-mini-key.w { grid-column:2; grid-row:1; }
            .rc-mini-key.a { grid-column:1; grid-row:2; }
            .rc-mini-key.s { grid-column:2; grid-row:2; }
            .rc-mini-key.d { grid-column:3; grid-row:2; }

            .rc-menu-section {
                margin-top:24px;
            }

            .rc-section-head {
                display:flex;
                align-items:baseline;
                justify-content:space-between;
                gap:12px;
                margin-bottom:9px;
            }

            .rc-section-label {
                color:#cbd9e7;
                font-size:.74rem;
                font-weight:900;
                text-transform:uppercase;
                letter-spacing:.08em;
            }

            .rc-section-note {
                color:#6f849b;
                font-size:.66rem;
            }

            .rc-mode-grid {
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:10px;
            }

            .rc-mode-card {
                min-width:0;
                padding:16px 14px;
                border-radius:15px;
                cursor:pointer;
                text-align:left;
                color:var(--text);
                font:inherit;
                border:1px solid rgba(255,255,255,.07);
                background:rgba(255,255,255,.025);
                transition:.15s ease;
                position:relative;
                overflow:hidden;
            }

            .rc-mode-card::before {
                content:'';
                position:absolute;
                left:0;
                right:0;
                top:0;
                height:3px;
                opacity:.35;
                background:var(--mode-color,var(--cyan));
            }

            .rc-mode-card:nth-child(1) { --mode-color:var(--cyan); }
            .rc-mode-card:nth-child(2) { --mode-color:var(--blue); }
            .rc-mode-card:nth-child(3) { --mode-color:var(--gold); }
            .rc-mode-card:nth-child(4) { --mode-color:var(--purple); }

            .rc-mode-card:hover {
                transform:translateY(-2px);
                border-color:rgba(255,255,255,.16);
            }

            .rc-mode-card.selected {
                border-color:var(--mode-color);
                background:rgba(255,255,255,.055);
                box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--mode-color) 30%,transparent);
            }

            .rc-mode-icon {
                margin-bottom:9px;
                color:var(--mode-color);
                font-size:1.55rem;
                font-weight:950;
            }

            .rc-mode-card b {
                display:block;
                font-size:.91rem;
                margin-bottom:3px;
            }

            .rc-mode-card span {
                display:block;
                color:#7e93aa;
                font-size:.68rem;
                line-height:1.35;
            }

            .rc-settings-row {
                display:grid;
                grid-template-columns:1fr auto;
                gap:14px;
                align-items:end;
                margin-top:20px;
            }

            .rc-intensity {
                display:flex;
                flex-wrap:wrap;
                gap:6px;
            }

            .rc-intensity-btn {
                padding:9px 13px;
                border-radius:99px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(255,255,255,.025);
                color:#98aac0;
                font:inherit;
                font-size:.72rem;
                font-weight:850;
                cursor:pointer;
            }

            .rc-intensity-btn:hover {
                border-color:rgba(49,220,255,.28);
            }

            .rc-intensity-btn.selected {
                color:#06121a;
                background:var(--cyan2);
                border-color:var(--cyan2);
            }

            .rc-control-copy {
                color:#8499b0;
                font-size:.7rem;
                text-align:right;
            }

            .rc-control-copy b {
                display:block;
                color:#d5e2ee;
                margin-bottom:2px;
                font-size:.72rem;
            }

            .rc-start {
                width:100%;
                margin-top:21px;
                padding:15px 18px;
                border:0;
                border-radius:13px;
                cursor:pointer;
                color:#06121a;
                font:inherit;
                font-weight:950;
                background:linear-gradient(135deg,var(--cyan),var(--blue));
                box-shadow:0 14px 34px rgba(49,220,255,.16);
            }

            .rc-start:hover {
                filter:brightness(1.08);
                transform:translateY(-1px);
            }

            .rc-end-title {
                font-size:2.45rem;
                font-weight:950;
                margin-bottom:7px;
                color:var(--cyan2);
            }

            .rc-end-sub {
                color:#8da1b8;
                line-height:1.5;
                margin-bottom:18px;
            }

            .rc-end-stats {
                display:grid;
                grid-template-columns:repeat(5,1fr);
                gap:8px;
                margin-bottom:18px;
            }

            .rc-end-stat {
                padding:12px;
                text-align:center;
                border-radius:12px;
                background:rgba(255,255,255,.03);
                border:1px solid rgba(255,255,255,.06);
            }

            .rc-end-stat span {
                display:block;
                color:#7a90a8;
                font-size:.61rem;
                font-weight:850;
                text-transform:uppercase;
            }

            .rc-end-stat b {
                display:block;
                margin-top:3px;
                font-size:1.08rem;
            }

            @keyframes rcPop {
                0% { opacity:0; transform:scale(.74); }
                75% { opacity:1; transform:scale(1.06); }
                100% { opacity:1; transform:scale(1); }
            }

            @keyframes rcFake {
                0% { opacity:0; transform:scale(.8) rotate(-7deg); }
                55% { opacity:1; transform:scale(1.05) rotate(4deg); }
                100% { opacity:1; transform:scale(1); }
            }

            @keyframes rcFlash {
                0% { opacity:0; }
                28% { opacity:1; }
                100% { opacity:0; }
            }

            @media (max-width:860px) {
                .rc-menu-top { grid-template-columns:1fr; gap:18px; }
                .rc-mode-grid { grid-template-columns:1fr 1fr; }
                .rc-end-stats { grid-template-columns:repeat(2,1fr); }
                .rc-menu-card { padding:23px; }
            }

            @media (max-width:600px) {
                .rc-topbar { left:7px; right:7px; top:7px; gap:4px; }
                .rc-top-side { gap:4px; }
                .rc-chip { min-width:0; padding:7px 8px; }
                .rc-chip-label { font-size:.52rem; }
                .rc-chip-value { font-size:.76rem; }
                .rc-round-chip { min-width:78px; padding:7px; }
                .rc-mode-grid { grid-template-columns:1fr; }
                .rc-settings-row { grid-template-columns:1fr; }
                .rc-control-copy { text-align:left; }
                .rc-how-flow { grid-template-columns:1fr; }
                .rc-how-arrow { transform:rotate(90deg); }
                .rc-center { top:48%; }
                .rc-signal { width:118px; height:118px; }
                .rc-arrow { font-size:3.8rem; }
                .rc-fake-mark { font-size:3.4rem; }
            }
        `;

        const root = document.createElement('div');
        root.className = 'rc-game';
        root.innerHTML = `
            <div class="rc-arena">
                <div class="rc-zone up"></div>
                <div class="rc-zone left"></div>
                <div class="rc-zone right"></div>
                <div class="rc-zone down"></div>
            </div>

            <div class="rc-touch-grid">
                <button class="rc-touch-btn" data-touch="up" type="button" aria-label="Oben"></button>
                <button class="rc-touch-btn" data-touch="right" type="button" aria-label="Rechts"></button>
                <button class="rc-touch-btn" data-touch="left" type="button" aria-label="Links"></button>
                <button class="rc-touch-btn" data-touch="down" type="button" aria-label="Unten"></button>
            </div>

            <div class="rc-topbar">
                <div class="rc-top-side">
                    <div class="rc-chip">
                        <div class="rc-chip-label">Score</div>
                        <div class="rc-chip-value rc-score">0</div>
                    </div>
                    <div class="rc-chip">
                        <div class="rc-chip-label">Streak</div>
                        <div class="rc-chip-value rc-streak">x0</div>
                    </div>
                </div>

                <div class="rc-round-chip">
                    <div class="rc-chip-label rc-round-label">Runde</div>
                    <div class="rc-chip-value rc-round-value">0 / 12</div>
                </div>

                <div class="rc-top-side right">
                    <div class="rc-chip">
                        <div class="rc-chip-label">Bestzeit</div>
                        <div class="rc-chip-value rc-best">—</div>
                    </div>
                    <div class="rc-chip rc-lives-chip">
                        <div class="rc-chip-label">Leben</div>
                        <div class="rc-chip-value rc-lives">♥♥♥</div>
                    </div>
                </div>
            </div>

            <button class="rc-audio" type="button">Sound: An</button>

            <div class="rc-center">
                <div class="rc-status wait">
                    <div class="rc-status-main">BEREIT?</div>
                    <div class="rc-status-sub">Warte auf das echte Richtungssignal.</div>
                </div>

                <div class="rc-signal">
                    <div class="rc-arrow">←</div>
                    <div class="rc-fake-mark">◇</div>
                </div>

                <div class="rc-control-hint"></div>
            </div>

            <div class="rc-bottom">
                <div class="rc-result">Goldenes ◇ = Fakeout · nichts drücken</div>
                <div class="rc-track"><div class="rc-track-fill"></div></div>
            </div>

            <div class="rc-flash"></div>

            <div class="rc-overlay rc-menu">
                <div class="rc-menu-card">
                    <div class="rc-menu-top">
                        <div>
                            <div class="rc-kicker">Reaction / Highscore</div>
                            <div class="rc-title">Reaction Challenge</div>
                            <div class="rc-desc">
                                Kein Gegner, kein Glück: Sammle in kurzen Reaktions-Challenges möglichst viele Punkte
                                und verbessere dabei Bestzeit, Durchschnitt und Accuracy.
                            </div>
                        </div>

                        <div class="rc-how">
                            <div class="rc-how-title">So spielst du</div>
                            <div class="rc-how-flow">
                                <div class="rc-how-step">
                                    <div class="rc-how-icon">…</div>
                                    <b>1. Warten</b>
                                    <span>Nicht vorher drücken.</span>
                                </div>

                                <div class="rc-how-arrow">›</div>

                                <div class="rc-how-step">
                                    <div class="rc-how-icon">↑</div>
                                    <b>2. Signal</b>
                                    <span>Richtung erkennen.</span>
                                </div>

                                <div class="rc-how-arrow">›</div>

                                <div class="rc-how-step">
                                    <div class="rc-how-icon">
                                        <div class="rc-how-keys">
                                            <span class="rc-mini-key w">W</span>
                                            <span class="rc-mini-key a">A</span>
                                            <span class="rc-mini-key s">S</span>
                                            <span class="rc-mini-key d">D</span>
                                        </div>
                                    </div>
                                    <b>3. Reagieren</b>
                                    <span>WASD oder Pfeiltasten.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="rc-menu-section">
                        <div class="rc-section-head">
                            <div class="rc-section-label">Challenge wählen</div>
                            <div class="rc-section-note">Jeder Modus hat einen eigenen Highscore.</div>
                        </div>

                        <div class="rc-mode-grid">
                            ${Object.entries(MODES).map(([key, value]) => `
                                <button class="rc-mode-card ${key === selectedModeKey ? 'selected' : ''}" data-mode="${key}" type="button">
                                    <div class="rc-mode-icon">${value.icon}</div>
                                    <b>${value.label}</b>
                                    <span>${value.short}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="rc-settings-row">
                        <div>
                            <div class="rc-section-label" style="margin-bottom:8px;">Intensität</div>
                            <div class="rc-intensity">
                                ${Object.entries(INTENSITIES).map(([key, value]) => `
                                    <button class="rc-intensity-btn ${key === selectedIntensityKey ? 'selected' : ''}" data-intensity="${key}" type="button">
                                        ${value.label}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div class="rc-control-copy">
                            <b>Steuerung</b>
                            WASD + Pfeiltasten · auf Touchscreen die passende Richtung antippen
                        </div>
                    </div>

                    <button class="rc-start" type="button">Classic Challenge starten</button>
                </div>
            </div>

            <div class="rc-overlay rc-end hidden">
                <div class="rc-menu-card">
                    <div class="rc-end-title">Challenge beendet</div>
                    <div class="rc-end-sub"></div>

                    <div class="rc-end-stats">
                        <div class="rc-end-stat"><span>Score</span><b class="rc-end-score">0</b></div>
                        <div class="rc-end-stat"><span>Ø Reaktion</span><b class="rc-end-average">—</b></div>
                        <div class="rc-end-stat"><span>Bestzeit</span><b class="rc-end-best">—</b></div>
                        <div class="rc-end-stat"><span>Accuracy</span><b class="rc-end-accuracy">0%</b></div>
                        <div class="rc-end-stat"><span>Best Streak</span><b class="rc-end-streak">0</b></div>
                    </div>

                    <button class="rc-start rc-restart" type="button">Nochmal</button>
                </div>
            </div>
        `;

        container.append(style, root);

        const arenaEl = root.querySelector('.rc-arena');
        const signalEl = root.querySelector('.rc-signal');
        const arrowEl = root.querySelector('.rc-arrow');

        const statusEl = root.querySelector('.rc-status');
        const statusMainEl = root.querySelector('.rc-status-main');
        const statusSubEl = root.querySelector('.rc-status-sub');

        const scoreEl = root.querySelector('.rc-score');
        const streakEl = root.querySelector('.rc-streak');
        const bestEl = root.querySelector('.rc-best');
        const livesEl = root.querySelector('.rc-lives');
        const livesChipEl = root.querySelector('.rc-lives-chip');
        const roundLabelEl = root.querySelector('.rc-round-label');
        const roundValueEl = root.querySelector('.rc-round-value');

        const controlHintEl = root.querySelector('.rc-control-hint');
        const resultEl = root.querySelector('.rc-result');
        const trackFillEl = root.querySelector('.rc-track-fill');

        const flashEl = root.querySelector('.rc-flash');
        const audioBtn = root.querySelector('.rc-audio');

        const menuOverlay = root.querySelector('.rc-menu');
        const endOverlay = root.querySelector('.rc-end');
        const startBtn = root.querySelector('.rc-menu .rc-start');
        const restartBtn = root.querySelector('.rc-restart');

        const modeButtons = [...root.querySelectorAll('.rc-mode-card')];
        const intensityButtons = [...root.querySelectorAll('.rc-intensity-btn')];
        const touchButtons = [...root.querySelectorAll('.rc-touch-btn')];

        const endSubEl = root.querySelector('.rc-end-sub');
        const endScoreEl = root.querySelector('.rc-end-score');
        const endAverageEl = root.querySelector('.rc-end-average');
        const endBestEl = root.querySelector('.rc-end-best');
        const endAccuracyEl = root.querySelector('.rc-end-accuracy');
        const endStreakEl = root.querySelector('.rc-end-streak');

        const clearTimers = () => {
            timers.forEach(id => clearTimeout(id));
            timers.clear();
        };

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

        const tone = (frequency, duration = 0.055, volume = 0.033, type = 'sine') => {
            if (muted) return;

            const ac = ensureAudio();
            if (!ac) return;

            const oscillator = ac.createOscillator();
            const gain = ac.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, ac.currentTime);

            gain.gain.setValueAtTime(volume, ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);

            oscillator.connect(gain);
            gain.connect(ac.destination);

            oscillator.start();
            oscillator.stop(ac.currentTime + duration);
        };

        const playGo = direction => {
            const frequencies = {
                up: 980,
                left: 720,
                down: 610,
                right: 860
            };

            tone(frequencies[direction], 0.065, 0.042, 'square');
        };

        const playFake = () => tone(260, 0.045, 0.018, 'triangle');
        const playSuccess = () => {
            tone(650, 0.05, 0.03);
            schedule(() => tone(890, 0.08, 0.035), 45);
        };
        const playFail = () => tone(225, 0.08, 0.03, 'sawtooth');

        const getBestReaction = () =>
            reactionTimes.length
                ? Math.min(...reactionTimes)
                : null;

        const getAverageReaction = () =>
            reactionTimes.length
                ? reactionTimes.reduce((sum, value) => sum + value, 0) / reactionTimes.length
                : null;

        const getReactionTier = ms =>
            REACTION_TIERS.find(tier => ms <= tier.max) ??
            REACTION_TIERS[REACTION_TIERS.length - 1];

        const setStatus = (main, sub = '', kind = 'wait') => {
            statusEl.className = `rc-status ${kind}`;
            statusMainEl.textContent = main;
            statusSubEl.textContent = sub;
        };

        const hideSignal = () => {
            signalEl.className = 'rc-signal';
            arenaEl.className = 'rc-arena';
        };

        const showSignal = direction => {
            hideSignal();

            arrowEl.textContent = DIRECTION_META[direction].arrow;
            signalEl.classList.add('visible');
            arenaEl.classList.add(`active-${direction}`);
        };

        const showFake = () => {
            hideSignal();
            signalEl.classList.add('fake');
            playFake();

            schedule(() => {
                if (phase === 'waiting') {
                    hideSignal();
                }
            }, 160);
        };

        const doFlash = kind => {
            flashEl.className = `rc-flash ${kind}`;

            schedule(() => {
                flashEl.className = 'rc-flash';
            }, 285);
        };

        const renderControls = () => {
            const directions = mode.directions;

            controlHintEl.innerHTML = directions.map(direction => `
                <span class="rc-key" data-hint="${direction}">
                    ${DIRECTION_META[direction].key}
                </span>
            `).join('') + `
                <span class="rc-fake-hint"><b>◇</b> = nicht drücken</span>
            `;
        };

        const highlightControl = direction => {
            root.querySelectorAll('[data-hint]').forEach(key => {
                key.classList.toggle(
                    'active',
                    key.dataset.hint === direction
                );
            });
        };

        const getEnduranceRamp = () => {
            if (!mode.endless) return 0;
            return Math.min(0.42, Math.floor(Math.max(0, completedRounds) / 5) * 0.045);
        };

        const currentTimeout = () => {
            const ramp = getEnduranceRamp();

            return Math.max(
                430,
                Math.round(
                    mode.timeoutMs *
                    intensity.timeoutMultiplier *
                    (1 - ramp)
                )
            );
        };

        const currentDelayRange = () => {
            const ramp = getEnduranceRamp();

            return {
                min: Math.max(
                    390,
                    intensity.delayMin * (1 - ramp * 0.70)
                ),
                max: Math.max(
                    760,
                    intensity.delayMax * (1 - ramp)
                )
            };
        };

        const currentFakeChance = () =>
            clamp(
                mode.fakeChance *
                intensity.fakeMultiplier +
                getEnduranceRamp() * 0.42,
                0,
                0.88
            );

        const calculateScore = reactionMs => {
            const tier = getReactionTier(reactionMs);
            const speedScore = Math.max(120, 770 - reactionMs * 1.55);
            const streakMultiplier = 1 + Math.min(1.7, streak * 0.14);

            return Math.round(
                (speedScore + tier.bonus) *
                streakMultiplier *
                intensity.scoreMultiplier
            );
        };

        const updateHud = () => {
            scoreEl.textContent = Math.round(score).toLocaleString('de-DE');
            streakEl.textContent = `x${streak}`;

            const best = getBestReaction();
            bestEl.textContent = best === null ? '—' : `${Math.round(best)} ms`;

            livesChipEl.style.display = mode.endless ? '' : 'none';
            livesEl.textContent = '♥'.repeat(Math.max(0, lives)) || '0';

            if (mode.endless) {
                roundLabelEl.textContent = 'Welle';
                roundValueEl.textContent = roundNumber;
                trackFillEl.style.width = `${clamp((completedRounds % 20) / 20 * 100, 0, 100)}%`;
            } else {
                roundLabelEl.textContent = 'Runde';
                roundValueEl.textContent = `${Math.min(roundNumber, mode.rounds)} / ${mode.rounds}`;
                trackFillEl.style.width = `${clamp(completedRounds / mode.rounds * 100, 0, 100)}%`;
            }
        };

        const missRound = (reason, reactionMs = null) => {
            if (phase === 'result' || phase === 'ended' || phase === 'menu') return;

            resolved = true;
            phase = 'result';

            attempts++;
            completedRounds++;
            streak = 0;

            if (reason === 'foul') {
                fouls++;
                score = Math.max(0, score - Math.round(130 * intensity.scoreMultiplier));
            }

            if (reason === 'wrong') {
                wrongInputs++;
                score = Math.max(0, score - Math.round(95 * intensity.scoreMultiplier));
            }

            if (mode.endless) {
                lives--;
            }

            hideSignal();
            highlightControl(null);
            doFlash(reason === 'foul' ? 'foul' : 'fail');
            playFail();

            if (reason === 'foul') {
                setStatus(
                    'ZU FRÜH!',
                    'Warte auf einen echten Pfeil. Goldene ◇ sind Fakeouts.',
                    'foul'
                );
                resultEl.textContent = 'Foul · Runde zählt als Fehler';
            } else if (reason === 'wrong') {
                setStatus(
                    'FALSCHE RICHTUNG!',
                    `${DIRECTION_META[currentDirection].arrow} bedeutet ${DIRECTION_META[currentDirection].key} oder ${DIRECTION_META[currentDirection].keyAlt}.`,
                    'fail'
                );
                resultEl.textContent = reactionMs === null
                    ? 'Falsche Taste'
                    : `Falsche Taste nach ${Math.round(reactionMs)} ms`;
            } else {
                setStatus(
                    'ZU LANGSAM!',
                    `Du hattest ${currentTimeout()} ms Zeit.`,
                    'fail'
                );
                resultEl.textContent = 'Keine Reaktion innerhalb des Zeitfensters';
            }

            updateHud();
            scheduleNext();
        };

        const successRound = reactionMs => {
            if (phase !== 'signal' || resolved) return;

            resolved = true;
            phase = 'result';

            attempts++;
            correct++;
            completedRounds++;
            reactionTimes.push(reactionMs);

            streak++;
            bestStreak = Math.max(bestStreak, streak);

            const tier = getReactionTier(reactionMs);
            const gained = calculateScore(reactionMs);
            score += gained;

            hideSignal();
            highlightControl(null);
            doFlash('success');
            playSuccess();

            setStatus(
                tier.label,
                `${Math.round(reactionMs)} ms · +${gained.toLocaleString('de-DE')} Punkte`,
                'success'
            );

            resultEl.textContent =
                `Reaktion ${Math.round(reactionMs)} ms · Streak x${streak}`;

            updateHud();
            scheduleNext();
        };

        const isRunFinished = () => {
            if (mode.endless) {
                return lives <= 0;
            }

            return completedRounds >= mode.rounds;
        };

        const scheduleNext = () => {
            const token = roundToken;

            schedule(() => {
                if (destroyed || token !== roundToken) return;

                if (isRunFinished()) {
                    endRun();
                } else {
                    beginRound();
                }
            }, 980);
        };

        const scheduleFakeouts = (token, actualDelay) => {
            const chance = currentFakeChance();

            let fakeCount = 0;

            if (Math.random() < chance) {
                fakeCount = 1;
            }

            const canDoubleFake =
                mode.maxFakes >= 2 ||
                selectedIntensityKey === 'chaos';

            if (
                canDoubleFake &&
                Math.random() < chance * 0.42
            ) {
                fakeCount = 2;
            }

            if (!fakeCount || actualDelay < 760) return;

            const earliest = 190;
            const latest = Math.max(earliest + 120, actualDelay - 245);
            const times = [];

            for (let i = 0; i < fakeCount; i++) {
                let time = rand(earliest, latest);

                if (times.some(other => Math.abs(other - time) < 250)) {
                    time = clamp(time + 285, earliest, latest);
                }

                times.push(time);
            }

            times.sort((a, b) => a - b);

            times.forEach(time => {
                schedule(() => {
                    if (
                        destroyed ||
                        token !== roundToken ||
                        phase !== 'waiting'
                    ) {
                        return;
                    }

                    showFake();
                }, time);
            });
        };

        const showRealSignal = token => {
            if (
                destroyed ||
                token !== roundToken ||
                phase !== 'waiting'
            ) {
                return;
            }

            phase = 'signal';
            resolved = false;

            currentDirection =
                mode.directions[
                    Math.floor(Math.random() * mode.directions.length)
                ];

            signalShownAt = performance.now();

            showSignal(currentDirection);
            highlightControl(currentDirection);

            setStatus(
                `${DIRECTION_META[currentDirection].arrow} ${DIRECTION_META[currentDirection].key}`,
                'JETZT reagieren!',
                'go'
            );

            playGo(currentDirection);

            const timeout = currentTimeout();
            const timeoutToken = roundToken;

            schedule(() => {
                if (
                    destroyed ||
                    timeoutToken !== roundToken ||
                    phase !== 'signal' ||
                    resolved
                ) {
                    return;
                }

                missRound('timeout');
            }, timeout);
        };

        const beginRound = () => {
            clearTimers();

            roundToken++;
            roundNumber++;

            phase = 'prep';
            resolved = false;

            hideSignal();
            highlightControl(null);

            resultEl.textContent =
                'Goldenes ◇ = Fakeout · nichts drücken';

            updateHud();

            setStatus(
                'BEREIT?',
                mode.directions.length === 2
                    ? 'A / D oder ← / →'
                    : 'WASD oder Pfeiltasten',
                'wait'
            );

            const token = roundToken;

            schedule(() => {
                if (
                    destroyed ||
                    token !== roundToken ||
                    phase !== 'prep'
                ) {
                    return;
                }

                phase = 'waiting';

                setStatus(
                    'WARTEN…',
                    'Noch nicht drücken.',
                    'wait'
                );

                const range = currentDelayRange();
                const actualDelay = rand(range.min, range.max);

                scheduleFakeouts(token, actualDelay);

                schedule(() => {
                    showRealSignal(token);
                }, actualDelay);
            }, rand(440, 650));
        };

        const handleDirection = direction => {
            ensureAudio();

            if (
                phase === 'menu' ||
                phase === 'ended' ||
                phase === 'result'
            ) {
                return;
            }

            if (
                !mode.directions.includes(direction)
            ) {
                return;
            }

            if (
                phase === 'prep' ||
                phase === 'waiting'
            ) {
                missRound('foul');
                return;
            }

            if (phase !== 'signal' || resolved) return;

            const reactionMs =
                performance.now() -
                signalShownAt;

            if (direction !== currentDirection) {
                missRound('wrong', reactionMs);
                return;
            }

            successRound(reactionMs);
        };

        const finalScore = () => {
            const average = getAverageReaction();
            const best = getBestReaction();

            let value = Math.round(score);

            if (
                !mode.endless &&
                completedRounds >= mode.rounds
            ) {
                value += 1100;
            }

            if (
                average !== null &&
                average < 230
            ) {
                value += Math.round((230 - average) * 10);
            }

            if (
                best !== null &&
                best < 170
            ) {
                value += 600;
            }

            value -= fouls * 70;
            return Math.max(0, Math.round(value));
        };

        const endRun = () => {
            clearTimers();
            roundToken++;

            phase = 'ended';
            resolved = true;

            hideSignal();
            highlightControl(null);

            const average = getAverageReaction();
            const best = getBestReaction();

            const accuracy =
                attempts > 0
                    ? Math.round(correct / attempts * 100)
                    : 0;

            const final = finalScore();

            endSubEl.textContent = mode.endless
                ? `${completedRounds} Wellen · ${intensity.label} · ${fouls} Fouls`
                : `${mode.label} · ${correct}/${mode.rounds} Treffer · ${intensity.label}`;

            endScoreEl.textContent =
                final.toLocaleString('de-DE');

            endAverageEl.textContent =
                average === null
                    ? '—'
                    : `${Math.round(average)} ms`;

            endBestEl.textContent =
                best === null
                    ? '—'
                    : `${Math.round(best)} ms`;

            endAccuracyEl.textContent =
                `${accuracy}%`;

            endStreakEl.textContent =
                bestStreak;

            services
                ?.highscores
                ?.saveHighscore?.(
                    `reaction-duel-${selectedModeKey}`,
                    final
                );

            endOverlay.classList.remove('hidden');
        };

        const startRun = () => {
            clearTimers();
            ensureAudio();

            mode = MODES[selectedModeKey];
            intensity = INTENSITIES[selectedIntensityKey];

            roundToken++;
            roundNumber = 0;
            completedRounds = 0;

            score = 0;
            streak = 0;
            bestStreak = 0;
            lives = 3;

            attempts = 0;
            correct = 0;
            fouls = 0;
            wrongInputs = 0;
            reactionTimes = [];

            resolved = false;

            menuOverlay.classList.add('hidden');
            endOverlay.classList.add('hidden');

            renderControls();
            updateHud();
            beginRound();
        };

        const directionFromKey = key => {
            switch (key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    return 'up';

                case 'a':
                case 'arrowleft':
                    return 'left';

                case 's':
                case 'arrowdown':
                    return 'down';

                case 'd':
                case 'arrowright':
                    return 'right';

                default:
                    return null;
            }
        };

        const onKeyDown = event => {
            const direction =
                directionFromKey(event.key);

            if (!direction) return;

            event.preventDefault();
            handleDirection(direction);
        };

        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                selectedModeKey =
                    button.dataset.mode;

                mode =
                    MODES[selectedModeKey];

                modeButtons.forEach(other => {
                    other.classList.toggle(
                        'selected',
                        other === button
                    );
                });

                startBtn.textContent =
                    `${mode.label} Challenge starten`;
            });
        });

        intensityButtons.forEach(button => {
            button.addEventListener('click', () => {
                selectedIntensityKey =
                    button.dataset.intensity;

                intensity =
                    INTENSITIES[selectedIntensityKey];

                intensityButtons.forEach(other => {
                    other.classList.toggle(
                        'selected',
                        other === button
                    );
                });
            });
        });

        touchButtons.forEach(button => {
            button.addEventListener('pointerdown', event => {
                event.preventDefault();

                let direction =
                    button.dataset.touch;

                // Classic bleibt auf Touch intuitiv: obere linke/rechte
                // Hälfte fungiert ebenfalls als links/rechts.
                if (
                    mode.directions.length === 2 &&
                    (direction === 'up' || direction === 'down')
                ) {
                    const rect =
                        button.getBoundingClientRect();

                    const center =
                        rect.left + rect.width / 2;

                    direction =
                        event.clientX < center
                            ? 'left'
                            : 'right';
                }

                if (
                    !mode.directions.includes(direction)
                ) {
                    if (mode.directions.length === 2) {
                        direction =
                            event.clientX <
                            window.innerWidth / 2
                                ? 'left'
                                : 'right';
                    } else {
                        return;
                    }
                }

                handleDirection(direction);
            });
        });

        audioBtn.addEventListener('click', () => {
            muted = !muted;

            audioBtn.textContent =
                `Sound: ${muted ? 'Aus' : 'An'}`;

            if (!muted) {
                ensureAudio();
                tone(640, 0.05, 0.025);
            }
        });

        startBtn.addEventListener('click', startRun);
        restartBtn.addEventListener('click', startRun);

        window.addEventListener('keydown', onKeyDown);

        renderControls();
        updateHud();

        return {
            destroy: () => {
                destroyed = true;
                clearTimers();

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
    MODES,
    INTENSITIES,
    REACTION_TIERS,
    DIRECTION_META
};
