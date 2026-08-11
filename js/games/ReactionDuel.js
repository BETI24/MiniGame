const MODES = {
    duel: {
        label: 'Duel',
        description: 'First to 5 gegen die KI. Fake-Signale und Fouls entscheiden knappe Runden.',
        targetWins: 5,
        lives: null,
        trainingRounds: null,
        hasAI: true
    },
    endless: {
        label: 'Endless',
        description: '3 Leben. Jede Runde wird schneller, bis deine Reaktion nicht mehr reicht.',
        targetWins: null,
        lives: 3,
        trainingRounds: null,
        hasAI: true
    },
    training: {
        label: 'Training',
        description: '10 reine Reaktionsrunden ohne KI. Ziel: niedriger Durchschnitt und wenige Fouls.',
        targetWins: null,
        lives: null,
        trainingRounds: 10,
        hasAI: false
    }
};

const DIFFICULTIES = {
    easy: {
        label: 'Easy',
        description: 'Langsame KI · wenige Fake-Signale',
        aiMin: 430,
        aiMax: 620,
        delayMin: 1250,
        delayMax: 2500,
        fakeChance: 0.16,
        maxFakes: 1,
        scoreMultiplier: 0.82
    },
    normal: {
        label: 'Normal',
        description: 'Ausgewogene KI · regelmäßige Fakeouts',
        aiMin: 305,
        aiMax: 465,
        delayMin: 950,
        delayMax: 2250,
        fakeChance: 0.36,
        maxFakes: 1,
        scoreMultiplier: 1.0
    },
    hard: {
        label: 'Hard',
        description: 'Schnelle KI · viele Fakeouts',
        aiMin: 235,
        aiMax: 355,
        delayMin: 760,
        delayMax: 1950,
        fakeChance: 0.57,
        maxFakes: 2,
        scoreMultiplier: 1.18
    },
    expert: {
        label: 'Expert',
        description: 'Sehr schnelle KI · aggressive Fakeouts',
        aiMin: 180,
        aiMax: 285,
        delayMin: 620,
        delayMax: 1700,
        fakeChance: 0.74,
        maxFakes: 2,
        scoreMultiplier: 1.38
    }
};

const REACTION_TIERS = [
    { max: 140, label: 'LIGHTNING', bonus: 450 },
    { max: 180, label: 'PERFECT', bonus: 280 },
    { max: 230, label: 'FAST', bonus: 140 },
    { max: 300, label: 'GOOD', bonus: 60 },
    { max: Infinity, label: 'LATE', bonus: 0 }
];

const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default {
    manifest: {
        id: 'reaction-duel',
        name: 'Reaction Duel',
        description: 'Warte auf das echte Signal, reagiere schneller als die KI und lass dich nicht von Fakeouts erwischen.',
        icon: '⚡',
        tags: ['Reaction', 'Arcade', 'Duel', 'Highscore']
    },

    init: (container, services) => {
        let destroyed = false;
        let selectedModeKey = 'duel';
        let selectedDifficultyKey = 'normal';

        let mode = MODES[selectedModeKey];
        let difficulty = DIFFICULTIES[selectedDifficultyKey];

        let phase = 'menu';
        let roundToken = 0;
        let roundNumber = 0;

        let playerWins = 0;
        let aiWins = 0;
        let lives = MODES.endless.lives;
        let score = 0;
        let streak = 0;
        let biggestStreak = 0;
        let correctInputs = 0;
        let totalInputs = 0;
        let foulCount = 0;
        let reactionTimes = [];

        let currentSide = 'left';
        let signalShownAt = 0;
        let currentAiReaction = null;
        let signalResolved = false;

        let muted = false;
        let audioContext = null;
        const timers = new Set();

        const style = document.createElement('style');
        style.textContent = `
            .rd-game {
                --bg:#070b13;
                --panel:#121d2d;
                --panel2:#19283b;
                --text:#f4f8ff;
                --muted:#8295ac;
                --cyan:#31dcff;
                --cyan2:#7ef0ff;
                --pink:#ff557d;
                --pink2:#ff9bb2;
                --gold:#ffd267;
                --green:#55e69a;
                --danger:#ff4969;

                position:relative;
                width:100%;
                height:100%;
                overflow:hidden;
                color:var(--text);
                font-family:inherit;
                background:
                    radial-gradient(circle at 20% 20%,rgba(49,220,255,.07),transparent 32%),
                    radial-gradient(circle at 80% 72%,rgba(255,85,125,.07),transparent 34%),
                    var(--bg);
            }

            .rd-game * { box-sizing:border-box; }

            .rd-arena {
                position:absolute;
                inset:0;
                display:grid;
                grid-template-columns:1fr 1fr;
                overflow:hidden;
            }

            .rd-side {
                position:relative;
                display:flex;
                align-items:center;
                justify-content:center;
                overflow:hidden;
                transition:background .12s ease;
            }

            .rd-side::before {
                content:'';
                position:absolute;
                inset:0;
                opacity:0;
                transition:opacity .12s ease;
                pointer-events:none;
            }

            .rd-side.left::before {
                background:radial-gradient(circle at 68% 50%,rgba(49,220,255,.24),transparent 50%);
            }

            .rd-side.right::before {
                background:radial-gradient(circle at 32% 50%,rgba(255,85,125,.24),transparent 50%);
            }

            .rd-arena.left-active .rd-side.left::before,
            .rd-arena.right-active .rd-side.right::before {
                opacity:1;
            }

            .rd-divider {
                position:absolute;
                left:50%;
                top:0;
                bottom:0;
                width:1px;
                transform:translateX(-50%);
                background:linear-gradient(
                    180deg,
                    transparent,
                    rgba(255,255,255,.12) 18%,
                    rgba(255,255,255,.20) 50%,
                    rgba(255,255,255,.12) 82%,
                    transparent
                );
                z-index:2;
            }

            .rd-side-label {
                position:absolute;
                bottom:88px;
                display:flex;
                flex-direction:column;
                align-items:center;
                gap:5px;
                color:rgba(255,255,255,.34);
                font-size:.72rem;
                font-weight:850;
                letter-spacing:.08em;
                text-transform:uppercase;
                pointer-events:none;
            }

            .rd-key {
                min-width:42px;
                height:34px;
                padding:0 10px;
                display:flex;
                align-items:center;
                justify-content:center;
                border-radius:9px;
                border:1px solid rgba(255,255,255,.14);
                background:rgba(255,255,255,.055);
                color:#dce8f4;
                font-size:.88rem;
                font-weight:950;
                box-shadow:inset 0 -2px 0 rgba(0,0,0,.25);
            }

            .rd-signal-wrap {
                position:absolute;
                left:50%;
                top:50%;
                transform:translate(-50%,-50%);
                z-index:8;
                width:min(460px,72vw);
                height:min(300px,42vh);
                pointer-events:none;
                display:flex;
                align-items:center;
                justify-content:center;
            }

            .rd-signal {
                position:relative;
                width:128px;
                height:128px;
                display:flex;
                align-items:center;
                justify-content:center;
                opacity:0;
                transform:scale(.72);
                border-radius:28px;
                border:2px solid transparent;
                background:rgba(9,16,27,.86);
                box-shadow:0 18px 55px rgba(0,0,0,.28);
            }

            .rd-signal.visible {
                opacity:1;
                transform:scale(1);
                animation:rdSignalPop .13s ease-out;
            }

            .rd-signal.fake {
                opacity:1;
                transform:scale(1);
                border-color:rgba(255,210,103,.58);
                background:rgba(55,42,16,.88);
                animation:rdFake .17s ease-out;
            }

            .rd-arrow {
                width:54px;
                height:54px;
                border-top:10px solid currentColor;
                border-right:10px solid currentColor;
                filter:drop-shadow(0 0 12px currentColor);
            }

            .rd-signal.left-signal {
                color:var(--cyan2);
                border-color:rgba(49,220,255,.72);
                box-shadow:
                    0 0 0 8px rgba(49,220,255,.055),
                    0 0 48px rgba(49,220,255,.24);
            }

            .rd-signal.left-signal .rd-arrow {
                transform:rotate(-135deg);
            }

            .rd-signal.right-signal {
                color:var(--pink2);
                border-color:rgba(255,85,125,.72);
                box-shadow:
                    0 0 0 8px rgba(255,85,125,.055),
                    0 0 48px rgba(255,85,125,.24);
            }

            .rd-signal.right-signal .rd-arrow {
                transform:rotate(45deg);
            }

            .rd-fake-symbol {
                width:46px;
                height:46px;
                border:8px solid var(--gold);
                transform:rotate(45deg);
                box-shadow:0 0 18px rgba(255,210,103,.45);
            }

            .rd-status {
                position:absolute;
                left:50%;
                top:18%;
                transform:translateX(-50%);
                z-index:9;
                text-align:center;
                pointer-events:none;
                min-width:260px;
            }

            .rd-status-main {
                font-size:clamp(1.25rem,3vw,2rem);
                font-weight:950;
                letter-spacing:.025em;
            }

            .rd-status-sub {
                margin-top:5px;
                color:var(--muted);
                font-size:.78rem;
                min-height:1.2em;
            }

            .rd-status.ready .rd-status-main { color:#dce8f4; }
            .rd-status.wait .rd-status-main { color:#9eafc1; }
            .rd-status.win .rd-status-main { color:var(--green); }
            .rd-status.lose .rd-status-main { color:var(--danger); }
            .rd-status.foul .rd-status-main { color:var(--gold); }

            .rd-topbar {
                position:absolute;
                top:14px;
                left:14px;
                right:14px;
                z-index:15;
                display:grid;
                grid-template-columns:1fr auto 1fr;
                align-items:start;
                gap:10px;
                pointer-events:none;
            }

            .rd-top-side {
                display:flex;
                gap:8px;
                flex-wrap:wrap;
            }

            .rd-top-side.right {
                justify-content:flex-end;
            }

            .rd-chip {
                min-width:104px;
                padding:8px 11px;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(13,22,36,.82);
                backdrop-filter:blur(10px);
            }

            .rd-chip-label {
                color:#71869e;
                font-size:.61rem;
                font-weight:850;
                text-transform:uppercase;
                letter-spacing:.08em;
            }

            .rd-chip-value {
                margin-top:2px;
                font-size:.98rem;
                font-weight:950;
            }

            .rd-score { color:var(--cyan2); }
            .rd-streak { color:var(--gold); }
            .rd-ai-value { color:var(--pink2); }

            .rd-round-box {
                padding:8px 13px;
                min-width:118px;
                text-align:center;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(13,22,36,.82);
                backdrop-filter:blur(10px);
            }

            .rd-round-number {
                margin-top:2px;
                font-weight:950;
            }

            .rd-progress {
                position:absolute;
                left:50%;
                bottom:24px;
                transform:translateX(-50%);
                z-index:14;
                width:min(580px,calc(100% - 36px));
                pointer-events:none;
            }

            .rd-duel-score {
                display:flex;
                justify-content:center;
                align-items:center;
                gap:8px;
                margin-bottom:10px;
            }

            .rd-pip {
                width:14px;
                height:14px;
                border-radius:50%;
                border:1px solid rgba(255,255,255,.15);
                background:rgba(255,255,255,.04);
            }

            .rd-pip.player.won {
                background:var(--cyan);
                border-color:var(--cyan2);
                box-shadow:0 0 10px rgba(49,220,255,.55);
            }

            .rd-pip.ai.won {
                background:var(--pink);
                border-color:var(--pink2);
                box-shadow:0 0 10px rgba(255,85,125,.55);
            }

            .rd-result-bar {
                height:8px;
                border-radius:99px;
                background:rgba(255,255,255,.055);
                overflow:hidden;
                position:relative;
                opacity:0;
                transition:opacity .15s ease;
            }

            .rd-result-bar.visible { opacity:1; }

            .rd-result-mid {
                position:absolute;
                left:50%;
                top:0;
                bottom:0;
                width:1px;
                background:rgba(255,255,255,.26);
                transform:translateX(-50%);
            }

            .rd-result-player,
            .rd-result-ai {
                position:absolute;
                top:0;
                bottom:0;
                width:0;
                transition:width .32s ease;
            }

            .rd-result-player {
                right:50%;
                background:linear-gradient(90deg,var(--cyan),var(--cyan2));
            }

            .rd-result-ai {
                left:50%;
                background:linear-gradient(90deg,var(--pink2),var(--pink));
            }

            .rd-result-labels {
                display:flex;
                justify-content:space-between;
                gap:12px;
                margin-top:5px;
                color:#7890a8;
                font-size:.66rem;
                font-weight:800;
            }

            .rd-touch {
                position:absolute;
                inset:0;
                z-index:5;
                display:grid;
                grid-template-columns:1fr 1fr;
            }

            .rd-touch-btn {
                appearance:none;
                border:0;
                background:transparent;
                cursor:pointer;
                -webkit-tap-highlight-color:transparent;
            }

            .rd-flash {
                position:absolute;
                inset:0;
                z-index:20;
                pointer-events:none;
                opacity:0;
            }

            .rd-flash.win { background:rgba(85,230,154,.10); animation:rdFlash .28s ease-out; }
            .rd-flash.lose { background:rgba(255,73,105,.11); animation:rdFlash .28s ease-out; }
            .rd-flash.foul { background:rgba(255,210,103,.10); animation:rdFlash .28s ease-out; }

            .rd-overlay {
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

            .rd-overlay.hidden { display:none; }

            .rd-card {
                width:min(980px,100%);
                max-height:calc(100% - 10px);
                overflow:auto;
                padding:32px;
                border-radius:22px;
                border:1px solid rgba(255,255,255,.09);
                background:linear-gradient(180deg,rgba(27,43,63,.98),rgba(12,22,35,.98));
                box-shadow:0 30px 90px rgba(0,0,0,.44);
            }

            .rd-kicker {
                color:var(--cyan);
                font-size:.72rem;
                font-weight:950;
                letter-spacing:.16em;
                text-transform:uppercase;
            }

            .rd-title {
                margin:6px 0 8px;
                font-size:clamp(2.4rem,5vw,4.1rem);
                line-height:1;
                font-weight:950;
                letter-spacing:-.04em;
            }

            .rd-desc {
                max-width:820px;
                margin-bottom:22px;
                color:#8da1b8;
                line-height:1.55;
            }

            .rd-section-label {
                margin:15px 0 8px;
                color:#c5d4e4;
                font-size:.72rem;
                font-weight:900;
                text-transform:uppercase;
                letter-spacing:.08em;
            }

            .rd-option-grid {
                display:grid;
                gap:9px;
            }

            .rd-mode-grid { grid-template-columns:repeat(3,1fr); }
            .rd-difficulty-grid { grid-template-columns:repeat(4,1fr); }

            .rd-option {
                min-width:0;
                padding:13px 14px;
                border-radius:13px;
                cursor:pointer;
                text-align:left;
                color:var(--text);
                font:inherit;
                border:1px solid rgba(255,255,255,.075);
                background:rgba(255,255,255,.026);
                transition:.15s ease;
            }

            .rd-option:hover {
                transform:translateY(-1px);
                border-color:rgba(49,220,255,.30);
            }

            .rd-option.selected {
                border-color:rgba(49,220,255,.58);
                background:linear-gradient(180deg,rgba(49,220,255,.13),rgba(69,125,255,.06));
            }

            .rd-option b {
                display:block;
                font-size:.9rem;
                margin-bottom:3px;
            }

            .rd-option span {
                display:block;
                color:#7c91aa;
                font-size:.69rem;
                line-height:1.38;
            }

            .rd-rules {
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:9px;
                margin:22px 0;
            }

            .rd-rule {
                padding:12px;
                border-radius:12px;
                border:1px solid rgba(255,255,255,.065);
                background:rgba(255,255,255,.025);
            }

            .rd-rule b {
                display:block;
                margin-bottom:3px;
                font-size:.82rem;
            }

            .rd-rule span {
                color:#8196ad;
                font-size:.7rem;
                line-height:1.4;
            }

            .rd-start {
                width:100%;
                padding:14px 18px;
                border:0;
                border-radius:13px;
                cursor:pointer;
                color:#07131d;
                font:inherit;
                font-weight:950;
                background:linear-gradient(135deg,var(--cyan),#4b8cff);
                box-shadow:0 14px 34px rgba(49,220,255,.16);
            }

            .rd-start:hover {
                filter:brightness(1.08);
                transform:translateY(-1px);
            }

            .rd-audio {
                position:absolute;
                right:14px;
                top:82px;
                z-index:24;
                padding:8px 10px;
                border-radius:10px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(13,22,36,.80);
                color:#aebfd0;
                font:inherit;
                font-size:.72rem;
                cursor:pointer;
            }

            .rd-end-title {
                font-size:2.4rem;
                font-weight:950;
                margin-bottom:7px;
            }

            .rd-end-title.win { color:var(--green); }
            .rd-end-title.lose { color:var(--danger); }

            .rd-end-sub {
                color:#8da1b8;
                line-height:1.5;
                margin-bottom:18px;
            }

            .rd-end-stats {
                display:grid;
                grid-template-columns:repeat(5,1fr);
                gap:8px;
                margin-bottom:18px;
            }

            .rd-end-stat {
                padding:12px;
                text-align:center;
                border-radius:12px;
                background:rgba(255,255,255,.03);
                border:1px solid rgba(255,255,255,.06);
            }

            .rd-end-stat span {
                display:block;
                color:#7a90a8;
                font-size:.62rem;
                font-weight:850;
                text-transform:uppercase;
            }

            .rd-end-stat b {
                display:block;
                margin-top:3px;
                font-size:1.08rem;
            }

            @keyframes rdSignalPop {
                0% { opacity:0; transform:scale(.74); }
                75% { opacity:1; transform:scale(1.06); }
                100% { opacity:1; transform:scale(1); }
            }

            @keyframes rdFake {
                0% { opacity:0; transform:scale(.8) rotate(-8deg); }
                55% { opacity:1; transform:scale(1.05) rotate(4deg); }
                100% { opacity:1; transform:scale(1); }
            }

            @keyframes rdFlash {
                0% { opacity:0; }
                30% { opacity:1; }
                100% { opacity:0; }
            }

            @media (max-width:820px) {
                .rd-card { padding:22px; }
                .rd-difficulty-grid { grid-template-columns:1fr 1fr; }
                .rd-rules { grid-template-columns:1fr 1fr; }
                .rd-end-stats { grid-template-columns:repeat(2,1fr); }
                .rd-chip { min-width:0; padding:7px 8px; }
                .rd-chip-label { font-size:.53rem; }
                .rd-chip-value { font-size:.76rem; }
                .rd-round-box { min-width:76px; padding:7px; font-size:.72rem; }
                .rd-side-label { bottom:82px; }
            }

            @media (max-width:560px) {
                .rd-mode-grid { grid-template-columns:1fr; }
                .rd-rules { grid-template-columns:1fr; }
                .rd-topbar { left:7px; right:7px; top:7px; gap:4px; }
                .rd-top-side { gap:4px; }
                .rd-chip:nth-child(2) { display:none; }
                .rd-signal { width:108px; height:108px; }
                .rd-status { top:20%; }
            }
        `;

        const root = document.createElement('div');
        root.className = 'rd-game';
        root.innerHTML = `
            <div class="rd-arena">
                <div class="rd-side left">
                    <div class="rd-side-label">
                        <div class="rd-key">A / ←</div>
                        <span>Links</span>
                    </div>
                </div>
                <div class="rd-side right">
                    <div class="rd-side-label">
                        <div class="rd-key">D / →</div>
                        <span>Rechts</span>
                    </div>
                </div>
                <div class="rd-divider"></div>
            </div>

            <div class="rd-touch">
                <button class="rd-touch-btn rd-touch-left" type="button" aria-label="Links"></button>
                <button class="rd-touch-btn rd-touch-right" type="button" aria-label="Rechts"></button>
            </div>

            <div class="rd-topbar">
                <div class="rd-top-side">
                    <div class="rd-chip">
                        <div class="rd-chip-label">Score</div>
                        <div class="rd-chip-value rd-score">0</div>
                    </div>
                    <div class="rd-chip">
                        <div class="rd-chip-label">Streak</div>
                        <div class="rd-chip-value rd-streak">x0</div>
                    </div>
                </div>

                <div class="rd-round-box">
                    <div class="rd-chip-label rd-round-label">Runde</div>
                    <div class="rd-round-number">0</div>
                </div>

                <div class="rd-top-side right">
                    <div class="rd-chip">
                        <div class="rd-chip-label rd-opponent-label">KI</div>
                        <div class="rd-chip-value rd-ai-value">0</div>
                    </div>
                    <div class="rd-chip">
                        <div class="rd-chip-label">Bestzeit</div>
                        <div class="rd-chip-value rd-best">—</div>
                    </div>
                </div>
            </div>

            <button class="rd-audio" type="button">Sound: An</button>

            <div class="rd-status ready">
                <div class="rd-status-main">BEREIT?</div>
                <div class="rd-status-sub">Nur auf den echten Pfeil reagieren.</div>
            </div>

            <div class="rd-signal-wrap">
                <div class="rd-signal">
                    <div class="rd-arrow"></div>
                    <div class="rd-fake-symbol"></div>
                </div>
            </div>

            <div class="rd-progress">
                <div class="rd-duel-score"></div>
                <div class="rd-result-bar">
                    <div class="rd-result-player"></div>
                    <div class="rd-result-mid"></div>
                    <div class="rd-result-ai"></div>
                </div>
                <div class="rd-result-labels">
                    <span class="rd-player-result">DU —</span>
                    <span class="rd-ai-result">KI —</span>
                </div>
            </div>

            <div class="rd-flash"></div>

            <div class="rd-overlay rd-menu">
                <div class="rd-card">
                    <div class="rd-kicker">Reaction / Quick Draw</div>
                    <div class="rd-title">Reaction Duel</div>
                    <div class="rd-desc">
                        Zwei Seiten, eine Entscheidung: Warte auf den echten Pfeil und drücke die passende Richtung,
                        bevor die KI reagiert. Fake-Signale bestrafen nervöse Spieler.
                    </div>

                    <div class="rd-section-label">Modus</div>
                    <div class="rd-option-grid rd-mode-grid">
                        ${Object.entries(MODES).map(([key, value]) => `
                            <button class="rd-option rd-mode-option ${key === selectedModeKey ? 'selected' : ''}" data-mode="${key}" type="button">
                                <b>${value.label}</b>
                                <span>${value.description}</span>
                            </button>
                        `).join('')}
                    </div>

                    <div class="rd-section-label">Schwierigkeit</div>
                    <div class="rd-option-grid rd-difficulty-grid">
                        ${Object.entries(DIFFICULTIES).map(([key, value]) => `
                            <button class="rd-option rd-difficulty-option ${key === selectedDifficultyKey ? 'selected' : ''}" data-difficulty="${key}" type="button">
                                <b>${value.label}</b>
                                <span>${value.description}</span>
                            </button>
                        `).join('')}
                    </div>

                    <div class="rd-rules">
                        <div class="rd-rule">
                            <b>← oder A</b>
                            <span>Linker Pfeil = linke Taste bzw. linke Bildschirmhälfte.</span>
                        </div>
                        <div class="rd-rule">
                            <b>→ oder D</b>
                            <span>Rechter Pfeil = rechte Taste bzw. rechte Bildschirmhälfte.</span>
                        </div>
                        <div class="rd-rule">
                            <b>Fakeout</b>
                            <span>Goldene Diamanten sind Täuschungen. Nicht drücken.</span>
                        </div>
                        <div class="rd-rule">
                            <b>Foul</b>
                            <span>Zu früh oder falsche Richtung = Runde sofort verloren.</span>
                        </div>
                    </div>

                    <button class="rd-start" type="button">Duel starten</button>
                </div>
            </div>

            <div class="rd-overlay rd-end hidden">
                <div class="rd-card">
                    <div class="rd-end-title"></div>
                    <div class="rd-end-sub"></div>

                    <div class="rd-end-stats">
                        <div class="rd-end-stat"><span>Score</span><b class="rd-end-score">0</b></div>
                        <div class="rd-end-stat"><span>Ø Reaktion</span><b class="rd-end-average">—</b></div>
                        <div class="rd-end-stat"><span>Bestzeit</span><b class="rd-end-best">—</b></div>
                        <div class="rd-end-stat"><span>Accuracy</span><b class="rd-end-accuracy">0%</b></div>
                        <div class="rd-end-stat"><span>Best Streak</span><b class="rd-end-streak">0</b></div>
                    </div>

                    <button class="rd-start rd-restart" type="button">Nochmal</button>
                </div>
            </div>
        `;

        container.append(style, root);

        const arenaEl = root.querySelector('.rd-arena');
        const signalEl = root.querySelector('.rd-signal');
        const arrowEl = root.querySelector('.rd-arrow');
        const fakeSymbolEl = root.querySelector('.rd-fake-symbol');
        const statusEl = root.querySelector('.rd-status');
        const statusMainEl = root.querySelector('.rd-status-main');
        const statusSubEl = root.querySelector('.rd-status-sub');

        const scoreEl = root.querySelector('.rd-score');
        const streakEl = root.querySelector('.rd-streak');
        const bestEl = root.querySelector('.rd-best');
        const aiValueEl = root.querySelector('.rd-ai-value');
        const opponentLabelEl = root.querySelector('.rd-opponent-label');
        const roundNumberEl = root.querySelector('.rd-round-number');
        const roundLabelEl = root.querySelector('.rd-round-label');

        const duelScoreEl = root.querySelector('.rd-duel-score');
        const resultBarEl = root.querySelector('.rd-result-bar');
        const resultPlayerEl = root.querySelector('.rd-result-player');
        const resultAiEl = root.querySelector('.rd-result-ai');
        const playerResultEl = root.querySelector('.rd-player-result');
        const aiResultEl = root.querySelector('.rd-ai-result');

        const flashEl = root.querySelector('.rd-flash');
        const audioBtn = root.querySelector('.rd-audio');

        const menuOverlay = root.querySelector('.rd-menu');
        const endOverlay = root.querySelector('.rd-end');
        const startBtn = root.querySelector('.rd-menu .rd-start');
        const restartBtn = root.querySelector('.rd-restart');

        const modeButtons = [...root.querySelectorAll('.rd-mode-option')];
        const difficultyButtons = [...root.querySelectorAll('.rd-difficulty-option')];

        const endTitleEl = root.querySelector('.rd-end-title');
        const endSubEl = root.querySelector('.rd-end-sub');
        const endScoreEl = root.querySelector('.rd-end-score');
        const endAverageEl = root.querySelector('.rd-end-average');
        const endBestEl = root.querySelector('.rd-end-best');
        const endAccuracyEl = root.querySelector('.rd-end-accuracy');
        const endStreakEl = root.querySelector('.rd-end-streak');

        const touchLeftBtn = root.querySelector('.rd-touch-left');
        const touchRightBtn = root.querySelector('.rd-touch-right');

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

        const tone = (frequency, duration = 0.06, volume = 0.035, type = 'sine') => {
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

        const playSignalSound = side => {
            tone(side === 'left' ? 720 : 920, 0.075, 0.045, 'square');
        };

        const playFakeSound = () => {
            tone(260, 0.045, 0.018, 'triangle');
        };

        const playWinSound = () => {
            tone(620, 0.06, 0.035, 'sine');
            schedule(() => tone(840, 0.09, 0.04, 'sine'), 55);
        };

        const playLoseSound = () => {
            tone(250, 0.09, 0.03, 'sawtooth');
        };

        const setStatus = (main, sub = '', kind = 'ready') => {
            statusEl.className = `rd-status ${kind}`;
            statusMainEl.textContent = main;
            statusSubEl.textContent = sub;
        };

        const hideSignal = () => {
            signalEl.className = 'rd-signal';
            arrowEl.style.display = 'block';
            fakeSymbolEl.style.display = 'none';
            arenaEl.classList.remove('left-active', 'right-active');
        };

        const showRealSignal = side => {
            hideSignal();

            arrowEl.style.display = 'block';
            fakeSymbolEl.style.display = 'none';

            signalEl.classList.add(
                'visible',
                side === 'left' ? 'left-signal' : 'right-signal'
            );

            arenaEl.classList.add(
                side === 'left' ? 'left-active' : 'right-active'
            );
        };

        const showFakeSignal = () => {
            hideSignal();

            arrowEl.style.display = 'none';
            fakeSymbolEl.style.display = 'block';
            signalEl.classList.add('fake');

            playFakeSound();

            schedule(() => {
                if (phase === 'waiting') {
                    hideSignal();
                }
            }, 160);
        };

        const flash = kind => {
            flashEl.className = `rd-flash ${kind}`;

            schedule(() => {
                flashEl.className = 'rd-flash';
            }, 300);
        };

        const getBestReaction = () => {
            if (!reactionTimes.length) return null;
            return Math.min(...reactionTimes);
        };

        const getAverageReaction = () => {
            if (!reactionTimes.length) return null;
            return reactionTimes.reduce((sum, value) => sum + value, 0) / reactionTimes.length;
        };

        const getReactionTier = ms =>
            REACTION_TIERS.find(tier => ms <= tier.max) ?? REACTION_TIERS[REACTION_TIERS.length - 1];

        const getProgressiveAiReduction = () => {
            if (selectedModeKey !== 'endless') return 0;
            return Math.min(95, Math.floor(Math.max(0, roundNumber - 1) / 4) * 11);
        };

        const rollAiReaction = () => {
            const reduction = getProgressiveAiReduction();
            const base = rand(
                Math.max(115, difficulty.aiMin - reduction),
                Math.max(150, difficulty.aiMax - reduction)
            );

            const rareFastRound = Math.random() < 0.08
                ? rand(18, 42)
                : 0;

            return Math.round(Math.max(105, base - rareFastRound));
        };

        const updateHud = () => {
            scoreEl.textContent = Math.round(score).toLocaleString('de-DE');
            streakEl.textContent = `x${streak}`;

            const best = getBestReaction();
            bestEl.textContent = best === null ? '—' : `${Math.round(best)} ms`;

            roundNumberEl.textContent = roundNumber;

            if (selectedModeKey === 'duel') {
                roundLabelEl.textContent = 'Runde';
                opponentLabelEl.textContent = 'KI Siege';
                aiValueEl.textContent = aiWins;
            } else if (selectedModeKey === 'endless') {
                roundLabelEl.textContent = 'Welle';
                opponentLabelEl.textContent = 'Leben';
                aiValueEl.textContent = '♥'.repeat(Math.max(0, lives)) || '0';
            } else {
                roundLabelEl.textContent = 'Training';
                opponentLabelEl.textContent = 'Treffer';
                aiValueEl.textContent = `${reactionTimes.length}/${mode.trainingRounds}`;
            }

            renderDuelPips();
        };

        const renderDuelPips = () => {
            duelScoreEl.innerHTML = '';

            if (selectedModeKey === 'duel') {
                const playerWrap = document.createElement('div');
                playerWrap.style.display = 'flex';
                playerWrap.style.gap = '5px';

                for (let i = 0; i < mode.targetWins; i++) {
                    const pip = document.createElement('div');
                    pip.className = `rd-pip player ${i < playerWins ? 'won' : ''}`;
                    playerWrap.appendChild(pip);
                }

                const label = document.createElement('div');
                label.textContent = 'VS';
                label.style.cssText = 'font-size:.62rem;color:#657b94;font-weight:900;padding:0 4px;';

                const aiWrap = document.createElement('div');
                aiWrap.style.display = 'flex';
                aiWrap.style.gap = '5px';

                for (let i = 0; i < mode.targetWins; i++) {
                    const pip = document.createElement('div');
                    pip.className = `rd-pip ai ${i < aiWins ? 'won' : ''}`;
                    aiWrap.appendChild(pip);
                }

                duelScoreEl.append(playerWrap, label, aiWrap);
            } else if (selectedModeKey === 'endless') {
                const text = document.createElement('div');
                text.style.cssText = 'color:#8499b0;font-size:.72rem;font-weight:850;';
                text.textContent = `ENDLESS · ${Math.max(0, lives)} Leben · KI wird alle 4 Runden schneller`;
                duelScoreEl.appendChild(text);
            } else {
                const text = document.createElement('div');
                text.style.cssText = 'color:#8499b0;font-size:.72rem;font-weight:850;';
                text.textContent = `TRAINING · ${reactionTimes.length}/${mode.trainingRounds} gültige Reaktionen`;
                duelScoreEl.appendChild(text);
            }
        };

        const showResultComparison = (playerMs, aiMs) => {
            resultBarEl.classList.add('visible');

            if (playerMs !== null) {
                const playerWidth = clamp(8 + (520 - Math.min(520, playerMs)) / 520 * 42, 8, 48);
                resultPlayerEl.style.width = `${playerWidth}%`;
                playerResultEl.textContent = `DU ${Math.round(playerMs)} ms`;
            } else {
                resultPlayerEl.style.width = '4%';
                playerResultEl.textContent = 'DU —';
            }

            if (aiMs !== null) {
                const aiWidth = clamp(8 + (520 - Math.min(520, aiMs)) / 520 * 42, 8, 48);
                resultAiEl.style.width = `${aiWidth}%`;
                aiResultEl.textContent = `KI ${Math.round(aiMs)} ms`;
            } else {
                resultAiEl.style.width = '0%';
                aiResultEl.textContent = selectedModeKey === 'training' ? 'KEINE KI' : 'KI —';
            }
        };

        const resetResultComparison = () => {
            resultBarEl.classList.remove('visible');
            resultPlayerEl.style.width = '0%';
            resultAiEl.style.width = '0%';
            playerResultEl.textContent = 'DU —';
            aiResultEl.textContent = selectedModeKey === 'training' ? 'KEINE KI' : 'KI —';
        };

        const calculateRoundScore = reactionMs => {
            const tier = getReactionTier(reactionMs);
            const speedBase = Math.max(120, 760 - reactionMs * 1.55);
            const streakMultiplier = 1 + Math.min(1.5, streak * 0.14);
            return Math.round(
                (speedBase + tier.bonus) *
                streakMultiplier *
                difficulty.scoreMultiplier
            );
        };

        const finishPlayerWin = reactionMs => {
            if (signalResolved || phase !== 'signal') return;
            signalResolved = true;
            phase = 'result';

            totalInputs++;
            correctInputs++;
            reactionTimes.push(reactionMs);

            streak++;
            biggestStreak = Math.max(biggestStreak, streak);

            const tier = getReactionTier(reactionMs);
            const gained = calculateRoundScore(reactionMs);
            score += gained;

            if (selectedModeKey === 'duel') {
                playerWins++;
            }

            hideSignal();
            flash('win');
            playWinSound();

            setStatus(
                tier.label,
                `Du: ${Math.round(reactionMs)} ms${currentAiReaction !== null ? ` · KI: ${Math.round(currentAiReaction)} ms` : ''} · +${gained.toLocaleString('de-DE')}`,
                'win'
            );

            showResultComparison(reactionMs, currentAiReaction);
            updateHud();

            scheduleAdvance();
        };

        const finishPlayerLoss = (reason, playerMs = null) => {
            if (phase === 'result' || phase === 'ended' || phase === 'menu') return;

            signalResolved = true;
            phase = 'result';

            streak = 0;

            if (reason === 'foul' || reason === 'wrong') {
                totalInputs++;
                foulCount++;
                score = Math.max(0, score - Math.round(120 * difficulty.scoreMultiplier));
            }

            if (selectedModeKey === 'duel') {
                aiWins++;
            } else if (selectedModeKey === 'endless') {
                lives--;
            }

            hideSignal();

            const isFoul = reason === 'foul' || reason === 'wrong';

            flash(isFoul ? 'foul' : 'lose');
            playLoseSound();

            let main = 'ZU LANGSAM';
            let sub = currentAiReaction !== null
                ? `KI: ${Math.round(currentAiReaction)} ms`
                : 'Runde verloren';

            if (reason === 'foul') {
                main = 'ZU FRÜH!';
                sub = 'False Start · Fake-Signale niemals bestätigen.';
            }

            if (reason === 'wrong') {
                main = 'FALSCHE SEITE!';
                sub = 'Die Richtung des echten Pfeils zählt.';
            }

            if (reason === 'timeout') {
                main = 'ZU LANGSAM';
                sub = selectedModeKey === 'training'
                    ? 'Keine Eingabe innerhalb des Zeitfensters.'
                    : `KI war nach ${Math.round(currentAiReaction)} ms schneller.`;
            }

            setStatus(main, sub, isFoul ? 'foul' : 'lose');
            showResultComparison(playerMs, currentAiReaction);
            updateHud();

            scheduleAdvance();
        };

        const isRunFinished = () => {
            if (selectedModeKey === 'duel') {
                return playerWins >= mode.targetWins || aiWins >= mode.targetWins;
            }

            if (selectedModeKey === 'endless') {
                return lives <= 0;
            }

            if (selectedModeKey === 'training') {
                return roundNumber >= mode.trainingRounds;
            }

            return false;
        };

        const scheduleAdvance = () => {
            const token = roundToken;

            schedule(() => {
                if (destroyed || token !== roundToken) return;

                if (isRunFinished()) {
                    endRun();
                } else {
                    beginRound();
                }
            }, 1150);
        };

        const scheduleFakeouts = (token, actualDelay) => {
            if (selectedModeKey === 'training') return;

            let fakeCount = 0;

            if (Math.random() < difficulty.fakeChance) {
                fakeCount = 1;
            }

            if (
                difficulty.maxFakes >= 2 &&
                Math.random() < difficulty.fakeChance * 0.55
            ) {
                fakeCount = 2;
            }

            if (!fakeCount || actualDelay < 850) return;

            const earliest = 220;
            const latest = Math.max(earliest + 120, actualDelay - 260);

            const times = [];

            for (let i = 0; i < fakeCount; i++) {
                let t = rand(earliest, latest);

                if (times.some(other => Math.abs(other - t) < 260)) {
                    t = clamp(t + 310, earliest, latest);
                }

                times.push(t);
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

                    showFakeSignal();
                }, time);
            });
        };

        const showActualSignal = token => {
            if (
                destroyed ||
                token !== roundToken ||
                phase !== 'waiting'
            ) {
                return;
            }

            phase = 'signal';
            signalResolved = false;
            currentSide = Math.random() < 0.5 ? 'left' : 'right';
            signalShownAt = performance.now();

            currentAiReaction = mode.hasAI ? rollAiReaction() : null;

            showRealSignal(currentSide);
            setStatus(
                currentSide === 'left' ? 'LINKS!' : 'RECHTS!',
                mode.hasAI
                    ? 'Jetzt reagieren!'
                    : 'Reaktionszeit läuft…',
                'ready'
            );

            playSignalSound(currentSide);

            if (mode.hasAI) {
                const aiToken = roundToken;
                schedule(() => {
                    if (
                        destroyed ||
                        aiToken !== roundToken ||
                        phase !== 'signal' ||
                        signalResolved
                    ) {
                        return;
                    }

                    finishPlayerLoss('timeout');
                }, currentAiReaction);
            } else {
                const trainingToken = roundToken;
                schedule(() => {
                    if (
                        destroyed ||
                        trainingToken !== roundToken ||
                        phase !== 'signal' ||
                        signalResolved
                    ) {
                        return;
                    }

                    finishPlayerLoss('timeout');
                }, 1000);
            }
        };

        const beginRound = () => {
            clearTimers();
            roundToken++;
            roundNumber++;
            signalResolved = false;
            currentAiReaction = null;

            hideSignal();
            resetResultComparison();
            updateHud();

            phase = 'prep';
            setStatus('BEREIT?', 'Nicht zu früh drücken.', 'ready');

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
                setStatus('WARTEN…', 'Nur der echte Pfeil zählt.', 'wait');

                const actualDelay = rand(
                    difficulty.delayMin,
                    difficulty.delayMax
                );

                scheduleFakeouts(token, actualDelay);

                schedule(() => {
                    showActualSignal(token);
                }, actualDelay);
            }, rand(520, 760));
        };

        const handleDirection = side => {
            ensureAudio();

            if (phase === 'menu' || phase === 'ended') return;

            if (phase === 'prep' || phase === 'waiting') {
                finishPlayerLoss('foul');
                return;
            }

            if (phase !== 'signal' || signalResolved) return;

            const reaction = performance.now() - signalShownAt;

            if (side !== currentSide) {
                finishPlayerLoss('wrong', reaction);
                return;
            }

            finishPlayerWin(reaction);
        };

        const getFinalScore = () => {
            const average = getAverageReaction();
            const best = getBestReaction();

            let finalScore = Math.round(score);

            if (selectedModeKey === 'duel') {
                if (playerWins >= mode.targetWins) {
                    finalScore += 2500;
                }
            }

            if (selectedModeKey === 'training' && average !== null) {
                finalScore += Math.max(0, Math.round(6500 - average * 12));
            }

            if (best !== null && best < 180) {
                finalScore += 700;
            }

            finalScore -= foulCount * 80;

            return Math.max(0, Math.round(finalScore));
        };

        const endRun = () => {
            clearTimers();
            roundToken++;

            phase = 'ended';
            signalResolved = true;

            hideSignal();

            const average = getAverageReaction();
            const best = getBestReaction();
            const accuracy = totalInputs > 0
                ? Math.round((correctInputs / totalInputs) * 100)
                : 0;

            const finalScore = getFinalScore();

            const wonDuel =
                selectedModeKey !== 'duel' ||
                playerWins >= mode.targetWins;

            endTitleEl.className =
                `rd-end-title ${wonDuel ? 'win' : 'lose'}`;

            if (selectedModeKey === 'duel') {
                endTitleEl.textContent =
                    wonDuel
                        ? 'DUELL GEWONNEN!'
                        : 'DUELL VERLOREN';

                endSubEl.textContent =
                    `${playerWins}:${aiWins} · ${difficulty.label} · ${
                        foulCount
                            ? `${foulCount} Foul${foulCount === 1 ? '' : 's'}`
                            : 'keine Fouls'
                    }`;
            } else if (selectedModeKey === 'endless') {
                endTitleEl.textContent = 'RUN BEENDET';
                endSubEl.textContent =
                    `${Math.max(0, roundNumber - 1)} Wellen überstanden · ${difficulty.label}`;
            } else {
                endTitleEl.textContent = 'TRAINING FERTIG';
                endSubEl.textContent =
                    `${reactionTimes.length}/${mode.trainingRounds} gültige Reaktionen`;
            }

            endScoreEl.textContent =
                finalScore.toLocaleString('de-DE');

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
                biggestStreak;

            services?.highscores?.saveHighscore?.(
                `reaction-duel-${selectedModeKey}`,
                finalScore
            );

            endOverlay.classList.remove('hidden');
        };

        const startRun = () => {
            clearTimers();
            ensureAudio();

            mode = MODES[selectedModeKey];
            difficulty = DIFFICULTIES[selectedDifficultyKey];

            phase = 'prep';
            roundToken++;
            roundNumber = 0;

            playerWins = 0;
            aiWins = 0;
            lives = MODES.endless.lives;

            score = 0;
            streak = 0;
            biggestStreak = 0;
            correctInputs = 0;
            totalInputs = 0;
            foulCount = 0;
            reactionTimes = [];

            currentAiReaction = null;
            signalResolved = false;

            menuOverlay.classList.add('hidden');
            endOverlay.classList.add('hidden');

            updateHud();
            beginRound();
        };

        const handleKeyDown = event => {
            const key = event.key.toLowerCase();

            if (
                key === 'a' ||
                key === 'arrowleft'
            ) {
                event.preventDefault();
                handleDirection('left');
            }

            if (
                key === 'd' ||
                key === 'arrowright'
            ) {
                event.preventDefault();
                handleDirection('right');
            }
        };

        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                selectedModeKey = button.dataset.mode;
                mode = MODES[selectedModeKey];

                modeButtons.forEach(other =>
                    other.classList.toggle('selected', other === button)
                );

                startBtn.textContent =
                    selectedModeKey === 'duel'
                        ? 'Duel starten'
                        : selectedModeKey === 'endless'
                            ? 'Endless starten'
                            : 'Training starten';
            });
        });

        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                selectedDifficultyKey = button.dataset.difficulty;
                difficulty = DIFFICULTIES[selectedDifficultyKey];

                difficultyButtons.forEach(other =>
                    other.classList.toggle('selected', other === button)
                );
            });
        });

        audioBtn.addEventListener('click', () => {
            muted = !muted;
            audioBtn.textContent = `Sound: ${muted ? 'Aus' : 'An'}`;

            if (!muted) {
                ensureAudio();
                tone(640, 0.05, 0.025);
            }
        });

        startBtn.addEventListener('click', startRun);
        restartBtn.addEventListener('click', startRun);

        touchLeftBtn.addEventListener('pointerdown', event => {
            event.preventDefault();
            handleDirection('left');
        });

        touchRightBtn.addEventListener('pointerdown', event => {
            event.preventDefault();
            handleDirection('right');
        });

        window.addEventListener('keydown', handleKeyDown);

        updateHud();
        hideSignal();
        resetResultComparison();

        return {
            destroy: () => {
                destroyed = true;
                clearTimers();

                window.removeEventListener('keydown', handleKeyDown);

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
    DIFFICULTIES,
    REACTION_TIERS
};
