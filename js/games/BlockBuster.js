const BOARD_PRESETS = {
    small:  { label: 'Small',  rows: 8,  cols: 8,  seconds: 25, fillRatio: 0.52, minStartMoves: 4,  minMoveRegions: 2 },
    medium: { label: 'Medium', rows: 12, cols: 15, seconds: 60, fillRatio: 0.50, minStartMoves: 8,  minMoveRegions: 3 },
    normal: { label: 'Normal', rows: 15, cols: 23, seconds: 90, fillRatio: 0.48, minStartMoves: 12, minMoveRegions: 3 },
    large:  { label: 'Large',  rows: 18, cols: 25, seconds: 120, fillRatio: 0.46, minStartMoves: 15, minMoveRegions: 3 }
};

const SCORE_BY_MATCH_COUNT = { 2: 100, 3: 250, 4: 500 };

// Balancing-Werte für die neuen Score-/Streak-Systeme.
const COMBO_WINDOW_SECONDS = 2.5;
const COMBO_MULTIPLIERS = [1, 1.2, 1.5, 2]; // 4+ Combo bleibt bei 2x.
const MULTI_MATCH_BONUS_PER_EXTRA_GROUP = 50;
const CLEAR_BONUS_PER_SECOND = 25;
const HOT_STREAK_TARGET = 6;
const HOT_STREAK_TIME_BONUS = 1;

// Wenn keine gültigen Züge mehr existieren, wird das verbleibende Board
// automatisch in eine neue garantiert lösbare Form umgebaut. Ein Rescue
// kostet Punkte und reduziert zusätzlich den späteren Zeitbonus.
const RESCUE_BASE_PENALTY = 250;
const RESCUE_SCORE_PERCENT = 0.12;
const RESCUE_PENALTY_PER_BLOCK = 10;
const RESCUE_CLEAR_BONUS_MULTIPLIER = 0.80;
const RESCUE_GENERATOR_CANDIDATES = 10;
const RESCUE_DISPLAY_MS = 2200;
const RESCUE_SWAP_DELAY_MS = 700;

// Schwierigkeit verändert bewusst nicht die Grundregeln, sondern wie viele
// offensichtliche Lösungen ein erzeugtes Board anbietet. Normal ist bereits
// deutlich kniffliger als die bisherige V4-Generierung.
const DIFFICULTY_PRESETS = {
    easy: {
        label: 'Easy', description: 'Mehr Zeit · offenere Boards · viele starke Kombos', timeMultiplier: 1.16,
        mistakePenalty: 3, fillMultiplier: 0.95,
        targetMoveRatio: 0.50, targetMultiRatio: 0.14, targetStrongRatio: 0.20,
        pairWeight: 42, tripleWeight: 25, quadWeight: 11, doublePairWeight: 22,
        maxRayDistance: 3, candidateCount: 18, minMoveFactor: 1.0, minRegionFactor: 1.0
    },
    normal: {
        label: 'Normal', description: 'Klassische Regeln · ausgewogener Start', timeMultiplier: 1.0,
        mistakePenalty: 3, fillMultiplier: 1.0,
        targetMoveRatio: 0.28, targetMultiRatio: 0.09, targetStrongRatio: 0.13,
        pairWeight: 60, tripleWeight: 18, quadWeight: 7, doublePairWeight: 15,
        maxRayDistance: 3, candidateCount: 26, minMoveFactor: 0.85, minRegionFactor: 1.0
    },
    hard: {
        label: 'Hard', description: 'Dichtere Boards · weniger offensichtliche Züge', timeMultiplier: 0.93,
        mistakePenalty: 4, fillMultiplier: 1.07,
        targetMoveRatio: 0.19, targetMultiRatio: 0.045, targetStrongRatio: 0.06,
        pairWeight: 76, tripleWeight: 12, quadWeight: 3, doublePairWeight: 9,
        maxRayDistance: 5, candidateCount: 36, minMoveFactor: 0.72, minRegionFactor: 0.80
    },
    expert: {
        label: 'Expert', description: 'Sehr dichte Boards · knapper Timer · wenige Gratis-Kombos', timeMultiplier: 0.84,
        mistakePenalty: 5, fillMultiplier: 1.14,
        targetMoveRatio: 0.11, targetMultiRatio: 0.018, targetStrongRatio: 0.026,
        pairWeight: 86, tripleWeight: 8, quadWeight: 1, doublePairWeight: 5,
        maxRayDistance: 6, candidateCount: 46, minMoveFactor: 0.56, minRegionFactor: 0.70
    }
};

// Fallback-Export / Defaultwerte. Die eigentliche Generierung benutzt die
// aktuell ausgewählte Difficulty aus DIFFICULTY_PRESETS.
const GENERATOR_CANDIDATES = DIFFICULTY_PRESETS.normal.candidateCount;
const GENERATOR_MAX_RAY_DISTANCE = DIFFICULTY_PRESETS.normal.maxRayDistance;
const GENERATOR_TARGET_MOVE_RATIO = DIFFICULTY_PRESETS.normal.targetMoveRatio;

const TILE_COLORS = [
    {
        name: 'Cyan', value: '#25d9e8', symbol: '●',
        pattern: 'repeating-linear-gradient(135deg, transparent 0 4px, rgba(5,12,22,.28) 4px 6px)'
    },
    {
        name: 'Blue', value: '#2f78ff', symbol: '◆',
        pattern: 'radial-gradient(circle, rgba(255,255,255,.34) 0 1.2px, transparent 1.4px)'
    },
    {
        name: 'Green', value: '#28d95a', symbol: '▲',
        pattern: 'repeating-linear-gradient(90deg, transparent 0 5px, rgba(5,12,22,.28) 5px 7px)'
    },
    {
        name: 'Orange', value: '#ff9c2a', symbol: '✚',
        pattern: 'repeating-linear-gradient(0deg, transparent 0 5px, rgba(5,12,22,.26) 5px 7px)'
    },
    {
        name: 'Purple', value: '#ba5ae8', symbol: '✦',
        pattern: 'repeating-linear-gradient(45deg, transparent 0 5px, rgba(5,12,22,.24) 5px 7px), repeating-linear-gradient(-45deg, transparent 0 5px, rgba(255,255,255,.12) 5px 7px)'
    },
    {
        name: 'Pink', value: '#ff69dc', symbol: '×',
        pattern: 'repeating-linear-gradient(-135deg, transparent 0 4px, rgba(5,12,22,.28) 4px 6px)'
    },
    {
        name: 'Red', value: '#ff6174', symbol: '■',
        pattern: 'repeating-linear-gradient(45deg, rgba(5,12,22,.22) 0 3px, transparent 3px 8px)'
    },
    {
        name: 'Gold', value: '#d7d563', symbol: '○',
        pattern: 'repeating-linear-gradient(0deg, transparent 0 6px, rgba(5,12,22,.23) 6px 7px), repeating-linear-gradient(90deg, transparent 0 6px, rgba(5,12,22,.23) 6px 7px)'
    }
];

export default {
    manifest: {
        id: 'block-buster',
        name: 'BlockBuster',
        description: 'Finde Farbpaare auf horizontalen und vertikalen Achsen, räume das Feld leer und jage den Highscore.',
        icon: '🧩',
        imageUrl: 'js/assets/images/BlockBuster.png',
        tags: ['Puzzle', 'Time Attack', 'Strategy']
    },

    init: (container, services) => {
        let selectedPresetKey = 'normal';
        let selectedDifficultyKey = 'normal';
        let currentPreset = null;
        let currentDifficulty = DIFFICULTY_PRESETS[selectedDifficultyKey];
        let roundDuration = 120;
        let board = [];
        let score = 0;
        let remainingTime = 0;
        let remainingBlocks = 0;
        let gameRunning = false;
        let timerAnimationId = null;
        let lastTimerFrame = performance.now();
        let destroyed = false;
        let resizeObserver = null;

        let initialBlockCount = 0;
        let successfulClicks = 0;
        let failedClicks = 0;
        let comboCount = 0;
        let biggestCombo = 0;
        let comboTimeLeft = 0;
        let hotStreak = 0;
        let colorBlindMode = false;
        let rescueCount = 0;
        let rescueInProgress = false;
        let demoScenarioIndex = 0;
        let demoTimer = null;
        let demoTimeouts = [];

        const style = document.createElement('style');
        style.textContent = `
            .bb-game {
                --bg:#090d16; --panel:#152136; --panel2:#1c2d45;
                --border:rgba(255,255,255,.08); --text:#f5f8ff; --muted:#8799ad;
                --cyan:#26d9ff; --blue:#4087ff; --green:#54e49c; --red:#ff5c78;
                width:100%; height:100%; overflow:hidden; color:var(--text); font-family:inherit;
                background:
                    radial-gradient(circle at 18% 12%,rgba(38,217,255,.06),transparent 30%),
                    radial-gradient(circle at 85% 78%,rgba(164,88,255,.06),transparent 36%),
                    var(--bg);
            }
            .bb-game * { box-sizing:border-box; }

            .bb-menu { width:100%; height:100%; display:flex; align-items:center; justify-content:center; padding:34px; }
            .bb-menu-card {
                width:min(1180px,94vw); padding:42px 44px; border:1px solid var(--border); border-radius:22px;
                background:linear-gradient(180deg,rgba(32,48,70,.97),rgba(16,25,40,.97));
                box-shadow:0 30px 90px rgba(0,0,0,.38);
            }
            .bb-kicker { color:var(--cyan); font-size:.9rem; font-weight:900; letter-spacing:.16em; text-transform:uppercase; }
            .bb-title { margin:8px 0 12px; font-size:clamp(3rem,5vw,4.9rem); font-weight:950; letter-spacing:-.04em; line-height:1; }
            .bb-desc { color:var(--muted); line-height:1.62; max-width:980px; margin:0 0 30px; font-size:1rem; }
            .bb-label { color:#d7e4f2; font-size:.92rem; font-weight:850; margin-bottom:10px; }

            .bb-colorblind-option {
                display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:14px; padding:15px 18px;
                border:1px solid rgba(255,255,255,.07); border-radius:12px; background:rgba(255,255,255,.025); cursor:pointer;
            }
            .bb-colorblind-copy b { display:block; font-size:.95rem; }
            .bb-colorblind-copy span { display:block; margin-top:4px; color:var(--muted); font-size:.82rem; }
            .bb-colorblind-toggle {
                appearance:none; -webkit-appearance:none; width:44px; height:24px; flex:0 0 44px; margin:0; cursor:pointer;
                border:1px solid rgba(255,255,255,.14); border-radius:99px; background:rgba(255,255,255,.08); position:relative; transition:.16s ease;
            }
            .bb-colorblind-toggle::after {
                content:''; position:absolute; width:18px; height:18px; left:2px; top:2px; border-radius:50%; background:#c3cfdd; transition:.16s ease;
            }
            .bb-colorblind-toggle:checked { background:rgba(38,217,255,.25); border-color:rgba(38,217,255,.58); }
            .bb-colorblind-toggle:checked::after { left:22px; background:var(--cyan); box-shadow:0 0 12px rgba(38,217,255,.45); }

            /* =========================
               HOW TO PLAY DEMO
            ========================= */

            .bb-howto {
                display:grid; grid-template-columns:180px minmax(0,1fr); gap:24px; align-items:center;
                margin:20px 0 28px; padding:18px 20px; border:1px solid rgba(38,217,255,.12); border-radius:16px;
                background:linear-gradient(135deg,rgba(38,217,255,.055),rgba(186,90,232,.035));
            }
            .bb-demo-wrap { display:flex; align-items:center; justify-content:center; min-height:154px; }
            .bb-demo-grid {
                display:grid; grid-template-columns:repeat(3,44px); grid-template-rows:repeat(3,44px); gap:5px;
                padding:8px; border-radius:13px; background:rgba(5,11,19,.52); border:1px solid rgba(255,255,255,.06);
            }
            .bb-demo-cell {
                position:relative; display:flex; align-items:center; justify-content:center; border-radius:6px;
                background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.035);
                transition:transform .22s ease,opacity .26s ease,filter .22s ease,box-shadow .22s ease,background .22s ease;
            }
            .bb-demo-cell.alt { background:rgba(255,255,255,.055); }
            .bb-demo-cell.block {
                background:var(--demo-color);
                box-shadow:inset 0 3px 0 rgba(255,255,255,.20),inset 0 -4px 0 rgba(0,0,0,.16),0 0 8px rgba(0,0,0,.22);
            }
            .bb-demo-cell.block::after {
                content:''; position:absolute; left:15%; right:15%; top:10%; height:18%; border-radius:99px; background:rgba(255,255,255,.14);
            }
            .bb-demo-symbol { display:none; position:relative; z-index:2; color:rgba(8,15,24,.72); font-size:1rem; font-weight:950; text-shadow:0 1px 0 rgba(255,255,255,.20); }
            .bb-game.colorblind-mode .bb-demo-cell.block { background:var(--demo-pattern),var(--demo-color); background-size:10px 10px,auto; }
            .bb-game.colorblind-mode .bb-demo-symbol { display:block; }

            .bb-demo-cell.target {
                border:1px dashed rgba(38,217,255,.48); background:rgba(38,217,255,.055);
                box-shadow:inset 0 0 18px rgba(38,217,255,.035);
            }
            .bb-demo-click-dot {
                width:10px; height:10px; border-radius:50%; background:var(--cyan); opacity:.46;
                box-shadow:0 0 0 0 rgba(38,217,255,.30); transition:.18s ease;
            }
            .bb-demo-cell.target.clicked .bb-demo-click-dot {
                opacity:1; transform:scale(.82); animation:bbDemoClick .45s ease;
            }
            @keyframes bbDemoClick {
                0% { box-shadow:0 0 0 0 rgba(38,217,255,.55); transform:scale(.65); }
                60% { box-shadow:0 0 0 14px rgba(38,217,255,0); transform:scale(1.18); }
                100% { box-shadow:0 0 0 0 rgba(38,217,255,0); transform:scale(.82); }
            }
            .bb-demo-cell.matched {
                z-index:3; transform:scale(1.10); filter:saturate(1.22) brightness(1.12);
                box-shadow:0 0 0 2px rgba(255,255,255,.82),0 0 18px var(--demo-color),inset 0 3px 0 rgba(255,255,255,.28);
            }
            .bb-demo-cell.removed { transform:scale(.35) rotate(8deg); opacity:0; }

            .bb-howto-copy { min-width:0; }
            .bb-howto-top { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:5px; }
            .bb-howto-title { font-size:1rem; font-weight:900; color:#fff; }
            .bb-demo-step {
                flex:0 0 auto; padding:4px 8px; border-radius:99px; color:var(--cyan); font-size:.69rem; font-weight:900;
                background:rgba(38,217,255,.08); border:1px solid rgba(38,217,255,.16);
            }
            .bb-demo-scenario { margin-top:5px; font-size:1.12rem; font-weight:950; color:#fff; }
            .bb-demo-explain { margin-top:5px; color:#9fb1c4; font-size:.86rem; line-height:1.48; min-height:40px; }
            .bb-demo-result {
                display:inline-flex; align-items:center; gap:7px; margin-top:10px; min-height:30px; padding:6px 10px; border-radius:9px;
                color:#b8c6d6; font-size:.79rem; font-weight:850; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.055);
                transition:.18s ease;
            }
            .bb-demo-result.success { color:var(--green); border-color:rgba(84,228,156,.22); background:rgba(84,228,156,.07); }
            .bb-demo-result strong { color:inherit; font-size:.9rem; }

            .bb-size-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
            .bb-size-card {
                color:var(--text); text-align:left; padding:18px 16px; border-radius:14px; cursor:pointer;
                border:1px solid rgba(255,255,255,.09); background:rgba(255,255,255,.035); transition:.16s ease;
            }
            .bb-size-card:hover { transform:translateY(-2px); border-color:rgba(38,217,255,.32); }
            .bb-size-card.selected {
                border-color:rgba(38,217,255,.62);
                background:linear-gradient(180deg,rgba(38,217,255,.15),rgba(64,135,255,.09));
            }
            .bb-size-card b { display:block; font-size:1.12rem; margin-bottom:4px; }
            .bb-size-card span { color:var(--muted); font-size:.9rem; }

            .bb-difficulty-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:4px; }
            .bb-difficulty-card {
                color:var(--text); text-align:left; padding:16px 15px; border-radius:14px; cursor:pointer;
                border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.025); transition:.16s ease;
            }
            .bb-difficulty-card:hover { border-color:rgba(255,105,220,.30); transform:translateY(-1px); }
            .bb-difficulty-card.selected {
                border-color:rgba(255,105,220,.55);
                background:linear-gradient(180deg,rgba(255,105,220,.10),rgba(186,90,232,.07));
            }
            .bb-difficulty-card b { display:block; font-size:1rem; margin-bottom:4px; }
            .bb-difficulty-card span { display:block; color:var(--muted); font-size:.82rem; line-height:1.38; }

            .bb-rules { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin:26px 0; }
            .bb-rule {
                padding:13px 14px; border-radius:13px; border:1px solid rgba(255,255,255,.06);
                background:rgba(255,255,255,.025); color:#acbdd0; font-size:.86rem; line-height:1.42;
            }
            .bb-rule b { display:block; color:#fff; margin-bottom:4px; font-size:.92rem; }

            .bb-primary {
                width:100%; border:0; border-radius:13px; padding:16px 20px; cursor:pointer;
                color:#07121b; font:inherit; font-weight:900;
                background:linear-gradient(135deg,var(--cyan),var(--blue));
                box-shadow:0 14px 32px rgba(38,217,255,.15);
            }
            .bb-primary:hover { filter:brightness(1.08); }

            .bb-play { width:100%; height:100%; display:none; padding:14px 18px 18px; }
            .bb-play.visible { display:flex; flex-direction:column; }

            .bb-hud { flex:0 0 auto; display:grid; grid-template-columns:minmax(200px,1fr) repeat(4,auto) auto auto; gap:10px; margin-bottom:12px; }
            .bb-timer,.bb-stat,.bb-secondary {
                border:1px solid var(--border); border-radius:13px; background:rgba(21,33,54,.94);
            }
            .bb-timer { padding:10px 13px; }
            .bb-timer-top { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:7px; }
            .bb-small-label { color:var(--muted); font-size:.67rem; font-weight:850; text-transform:uppercase; letter-spacing:.08em; }
            .bb-time { font-size:1.3rem; font-weight:950; font-variant-numeric:tabular-nums; }
            .bb-time.danger { color:var(--red); }
            .bb-track { height:7px; border-radius:99px; overflow:hidden; background:rgba(255,255,255,.08); }
            .bb-fill { width:100%; height:100%; transform-origin:left; background:linear-gradient(90deg,var(--cyan),var(--blue)); }
            .bb-fill.danger { background:linear-gradient(90deg,#ffb34d,var(--red)); }

            .bb-stat { min-width:112px; padding:10px 14px; display:flex; flex-direction:column; justify-content:center; }
            .bb-stat-value { margin-top:2px; font-size:1.07rem; font-weight:900; }
            .bb-score { color:var(--green); }
            .bb-combo { color:#c7a8ff; transition:.16s ease; }
            .bb-combo.active { color:#ff78da; text-shadow:0 0 14px rgba(255,120,218,.42); transform:scale(1.04); }
            .bb-streak-stat { min-width:132px; }
            .bb-streak-row { display:flex; align-items:center; gap:8px; margin-top:5px; }
            .bb-streak-value { min-width:28px; color:#ffd56d; font-size:.88rem; font-weight:900; }
            .bb-streak-track { width:62px; height:6px; border-radius:99px; overflow:hidden; background:rgba(255,255,255,.08); }
            .bb-streak-fill { width:100%; height:100%; transform:scaleX(0); transform-origin:left; transition:transform .16s ease; background:linear-gradient(90deg,#ffd45f,#ff8e4d); }
            .bb-secondary { padding:0 16px; color:#c8d5e4; font:inherit; font-weight:800; cursor:pointer; }
            .bb-secondary:hover { background:rgba(255,255,255,.07); }
            .bb-secondary.active-mode { color:var(--cyan); border-color:rgba(38,217,255,.38); background:rgba(38,217,255,.08); }

            .bb-board-area {
                --combo-rgb:38,217,255; --combo-opacity:0;
                position:relative; flex:1 1 auto; min-height:0; display:flex; align-items:center; justify-content:center;
                overflow:hidden; border:1px solid rgba(255,255,255,.05); border-radius:18px;
                background:radial-gradient(circle at center,rgba(38,217,255,.025),transparent 55%),rgba(4,9,17,.36);
                transition:border-color .18s ease,background .18s ease;
            }
            .bb-board-area::after {
                content:''; position:absolute; inset:0; z-index:8; pointer-events:none; border-radius:inherit;
                border:1px solid rgba(var(--combo-rgb),calc(var(--combo-opacity) * .8));
                box-shadow:inset 0 0 52px rgba(var(--combo-rgb),calc(var(--combo-opacity) * .34)),0 0 24px rgba(var(--combo-rgb),calc(var(--combo-opacity) * .18));
                opacity:calc(.15 + var(--combo-opacity)); transition:.18s ease;
            }
            .bb-board-area.combo-tier-2 { --combo-rgb:38,217,255; --combo-opacity:.22; }
            .bb-board-area.combo-tier-3 { --combo-rgb:255,105,220; --combo-opacity:.34; }
            .bb-board-area.combo-tier-4 { --combo-rgb:255,213,109; --combo-opacity:.48; }
            .bb-board-area.combo-hit .bb-board { animation:bbComboHit .18s ease-out; }
            @keyframes bbComboHit {
                0%,100% { transform:scale(1); }
                50% { transform:scale(1.006); }
            }
            .bb-board {
                display:grid; gap:3px; padding:7px; border-radius:15px; user-select:none;
                background:rgba(12,20,31,.96); border:1px solid rgba(255,255,255,.07);
                box-shadow:0 24px 70px rgba(0,0,0,.32);
            }
            .bb-cell {
                position:relative; min-width:0; min-height:0; border:0; border-radius:4px; padding:0; cursor:pointer;
                background:rgba(255,255,255,.035); transition:transform .12s,opacity .14s,background .12s,box-shadow .12s;
            }
            .bb-cell.alt { background:rgba(255,255,255,.055); }
            .bb-cell.empty:hover { background:rgba(38,217,255,.13); box-shadow:inset 0 0 0 1px rgba(38,217,255,.24); }
            .bb-cell.block {
                cursor:default; background:var(--tile-color); border-radius:5px;
                box-shadow:inset 0 3px 0 rgba(255,255,255,.2),inset 0 -4px 0 rgba(0,0,0,.16),0 0 7px rgba(0,0,0,.2);
            }
            .bb-cell.block::before { content:''; }
            .bb-cell.block::after {
                content:''; position:absolute; left:14%; right:14%; top:11%; height:18%; border-radius:99px;
                background:rgba(255,255,255,.13); pointer-events:none;
            }
            .bb-game.colorblind-mode .bb-cell.block {
                background-color:var(--tile-color); background-image:var(--tile-pattern); background-size:8px 8px;
                box-shadow:inset 0 0 0 1px rgba(255,255,255,.16),inset 0 3px 0 rgba(255,255,255,.16),inset 0 -4px 0 rgba(0,0,0,.18),0 0 7px rgba(0,0,0,.2);
            }
            .bb-game.colorblind-mode .bb-cell.block::before {
                content:attr(data-symbol); position:absolute; inset:0; display:grid; place-items:center; z-index:2;
                color:rgba(6,13,22,.76); font-size:var(--bb-symbol-size,12px); font-weight:950; line-height:1;
                text-shadow:0 1px 0 rgba(255,255,255,.3); pointer-events:none;
            }
            .bb-game.colorblind-mode .bb-cell.block::after { opacity:.55; }
            .bb-cell.removing { transform:scale(.35) rotate(8deg); opacity:0; }
            .bb-cell.removing.power-3 { transform:scale(.22) rotate(-12deg); filter:brightness(1.45); }
            .bb-cell.removing.power-4 { transform:scale(.08) rotate(20deg); filter:brightness(1.8); }

            .bb-board-area.match-2 { animation:bbMatch2 .22s ease; }
            .bb-board-area.match-3 { animation:bbMatch3 .30s ease; }
            .bb-board-area.match-4 { animation:bbMatch4 .40s ease; }
            .bb-board-area.multi-match { animation:bbMultiMatch .38s ease; }
            @keyframes bbMatch2 { 50% { box-shadow:inset 0 0 35px rgba(84,228,156,.08); } }
            @keyframes bbMatch3 { 50% { box-shadow:inset 0 0 55px rgba(38,217,255,.14); } }
            @keyframes bbMatch4 { 50% { box-shadow:inset 0 0 85px rgba(255,213,109,.22),0 0 28px rgba(255,213,109,.10); } }
            @keyframes bbMultiMatch { 50% { box-shadow:inset 0 0 75px rgba(255,105,220,.18),0 0 24px rgba(186,90,232,.12); } }

            .bb-board-area.wrong { animation:bbWrong .25s ease; }
            @keyframes bbWrong {
                0%,100% { box-shadow:inset 0 0 0 rgba(255,92,120,0); }
                50% { box-shadow:inset 0 0 60px rgba(255,92,120,.18); }
            }

            .bb-popup {
                position:absolute; z-index:30; pointer-events:none; padding:8px 13px; border-radius:10px;
                background:rgba(11,18,29,.92); border:1px solid rgba(255,255,255,.12);
                font-weight:950; animation:bbPopup .75s ease forwards;
            }
            .bb-popup.good { color:var(--green); }
            .bb-popup.bad { color:var(--red); }
            .bb-popup.match-3 { color:var(--cyan); font-size:1.12rem; box-shadow:0 0 24px rgba(38,217,255,.16); }
            .bb-popup.match-4 { color:#ffd56d; font-size:1.34rem; border-color:rgba(255,213,109,.38); box-shadow:0 0 34px rgba(255,213,109,.22); }
            .bb-popup.multi { color:#ff8cde; font-size:1.18rem; border-color:rgba(255,105,220,.32); box-shadow:0 0 28px rgba(255,105,220,.18); }
            @keyframes bbPopup {
                0% { opacity:0; transform:translate(-50%,-20%) scale(.8); }
                18% { opacity:1; transform:translate(-50%,-50%) scale(1); }
                100% { opacity:0; transform:translate(-50%,-110%) scale(.96); }
            }

            .bb-rescue {
                position:absolute; inset:0; z-index:42; display:none; align-items:center; justify-content:center;
                pointer-events:none; background:rgba(5,10,18,.62); backdrop-filter:blur(3px);
            }
            .bb-rescue.visible { display:flex; animation:bbRescueBackdrop 2.2s ease both; }
            .bb-rescue-card {
                min-width:min(390px,84%); padding:20px 24px; text-align:center; border-radius:16px;
                border:1px solid rgba(38,217,255,.42);
                background:linear-gradient(180deg,rgba(28,48,69,.98),rgba(12,23,36,.98));
                box-shadow:0 18px 55px rgba(0,0,0,.46),0 0 32px rgba(38,217,255,.14);
                animation:bbRescueCard 2.2s cubic-bezier(.2,.9,.2,1) both;
            }
            .bb-rescue-kicker { color:var(--red); font-size:.68rem; font-weight:950; letter-spacing:.14em; text-transform:uppercase; }
            .bb-rescue-title { margin-top:4px; color:#fff; font-size:1.5rem; font-weight:950; }
            .bb-rescue-copy { margin-top:7px; color:#aebed0; font-size:.79rem; line-height:1.48; }
            .bb-rescue-penalty { margin-top:10px; color:#ff8aa0; font-size:.94rem; font-weight:900; }
            .bb-board.rewiring { opacity:.20; transform:scale(.985); filter:saturate(.35) brightness(.7); transition:.45s ease; }
            .bb-board.rewired { animation:bbRewired .62s cubic-bezier(.2,.85,.2,1); }
            .bb-cell.orphan-recycle { animation:bbOrphanRecycle .52s ease forwards; }
            @keyframes bbRewired { 0% { opacity:.18; transform:scale(.985); filter:brightness(.8); } 55% { opacity:1; transform:scale(1.008); filter:brightness(1.18); } 100% { transform:scale(1); filter:none; } }
            @keyframes bbOrphanRecycle { to { opacity:0; transform:scale(.1) rotate(35deg); filter:brightness(1.8); } }
            @keyframes bbRescueBackdrop {
                0% { opacity:0; } 10%,84% { opacity:1; } 100% { opacity:0; }
            }
            @keyframes bbRescueCard {
                0% { opacity:0; transform:scale(.84) translateY(12px); }
                10%,78% { opacity:1; transform:scale(1) translateY(0); }
                100% { opacity:0; transform:scale(.97) translateY(-6px); }
            }

            .bb-end {
                position:absolute; inset:0; z-index:50; display:none; align-items:center; justify-content:center;
                padding:24px; background:rgba(5,9,15,.72); backdrop-filter:blur(7px);
            }
            .bb-end.visible { display:flex; }
            .bb-end-card {
                width:min(460px,100%); padding:26px; text-align:center; border-radius:18px;
                background:linear-gradient(180deg,#1e3046,#111d2c); border:1px solid rgba(255,255,255,.11);
                box-shadow:0 25px 80px rgba(0,0,0,.5);
            }
            .bb-end-title { font-size:1.8rem; font-weight:950; margin-bottom:6px; }
            .bb-end-title.perfect { animation:bbPerfectPulse 1.25s ease-in-out infinite alternate; }
            .bb-end-sub { color:var(--muted); line-height:1.45; margin-bottom:18px; }
            .bb-end-score { color:var(--green); font-size:2.05rem; font-weight:950; margin-bottom:16px; }
            .bb-end-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:18px; }
            .bb-end-stat { padding:10px 8px; border-radius:11px; background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.06); }
            .bb-end-stat-label { color:var(--muted); font-size:.64rem; font-weight:850; text-transform:uppercase; letter-spacing:.07em; }
            .bb-end-stat-value { margin-top:4px; font-size:1rem; font-weight:950; }
            .bb-end-clear.perfect {
                color:transparent; background:linear-gradient(90deg,#36f3ff,#6dff9a,#ffd75f,#ff7ee8,#36f3ff);
                background-size:260% 100%; background-clip:text; -webkit-background-clip:text;
                animation:bbPerfectGradient 1.4s linear infinite,bbPerfectPulse .85s ease-in-out infinite alternate;
            }
            @keyframes bbPerfectGradient { to { background-position:260% 0; } }
            @keyframes bbPerfectPulse { from { filter:drop-shadow(0 0 2px rgba(84,228,156,.2)); } to { filter:drop-shadow(0 0 10px rgba(38,217,255,.65)); transform:scale(1.035); } }
            .bb-end-actions { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
            .bb-end-btn {
                border:1px solid rgba(255,255,255,.09); border-radius:11px; padding:12px; cursor:pointer;
                color:white; background:rgba(255,255,255,.055); font:inherit; font-weight:850;
            }
            .bb-end-btn.primary { border:0; color:#07121b; background:linear-gradient(135deg,var(--cyan),var(--blue)); }

            @media (max-width:760px) {
                .bb-menu { padding:14px; }
                .bb-menu-card { width:min(96vw, 760px); padding:24px; }
                .bb-howto { grid-template-columns:1fr; gap:12px; padding:16px; text-align:center; }
                .bb-howto-top { justify-content:center; }
                .bb-demo-wrap { min-height:auto; }
                .bb-demo-grid { grid-template-columns:repeat(3,40px); grid-template-rows:repeat(3,40px); }
                .bb-size-grid,.bb-difficulty-grid,.bb-rules { grid-template-columns:1fr 1fr; }
                .bb-hud { grid-template-columns:1fr 1fr 1fr; }
                .bb-timer { grid-column:1/-1; }
                .bb-stat { min-width:0; }
                .bb-secondary { min-height:52px; }
            }
        `;

        const root = document.createElement('div');
        root.className = 'bb-game';
        root.innerHTML = `
            <section class="bb-menu">
                <div class="bb-menu-card">
                    <div class="bb-kicker">Puzzle / Time Attack</div>
                    <h1 class="bb-title">BlockBuster</h1>
                    <p class="bb-desc">
                        Klicke ein leeres Feld. In jeder Richtung zählt das jeweils nächste belegte Feld.
                        Haben mindestens zwei dieser Felder dieselbe Farbe, werden alle passenden Felder entfernt.
                    </p>

                    <div class="bb-howto" aria-label="Animiertes Spielbeispiel">
                        <div class="bb-demo-wrap">
                            <div class="bb-demo-grid" aria-hidden="true"></div>
                        </div>
                        <div class="bb-howto-copy">
                            <div class="bb-howto-top">
                                <div class="bb-howto-title">So funktioniert's</div>
                                <div class="bb-demo-step">Beispiel 1 / 6</div>
                            </div>
                            <div class="bb-demo-scenario">Ein einfaches Paar</div>
                            <div class="bb-demo-explain">Klicke das leere Feld in der Mitte. Zwei gleiche Farben auf den Achsen verschwinden.</div>
                            <div class="bb-demo-result"><span>●</span><strong>Klicke die Mitte</strong></div>
                        </div>
                    </div>

                    <div class="bb-label">Kartengröße</div>
                    <div class="bb-size-grid">
                        ${Object.entries(BOARD_PRESETS).map(([key,p]) => `
                            <button class="bb-size-card ${key === selectedPresetKey ? 'selected' : ''}" data-size="${key}" type="button">
                                <b>${p.label}</b><span>${p.rows} × ${p.cols}</span>
                            </button>
                        `).join('')}
                    </div>

                    <div class="bb-label" style="margin-top:16px">Schwierigkeit</div>
                    <div class="bb-difficulty-grid">
                        ${Object.entries(DIFFICULTY_PRESETS).map(([key,d]) => `
                            <button class="bb-difficulty-card ${key === selectedDifficultyKey ? 'selected' : ''}" data-difficulty="${key}" type="button">
                                <b>${d.label}</b><span>${d.description}</span>
                            </button>
                        `).join('')}
                    </div>

                    <label class="bb-colorblind-option">
                        <span class="bb-colorblind-copy">
                            <b>Farbenblindenmodus</b>
                            <span>Zeigt für jede Farbe zusätzlich ein eigenes Symbol und Muster.</span>
                        </span>
                        <input class="bb-colorblind-toggle" type="checkbox" aria-label="Farbenblindenmodus aktivieren">
                    </label>

                    <div class="bb-rules">
                        <div class="bb-rule"><b>2 gleiche</b>100 Punkte</div>
                        <div class="bb-rule"><b>3 gleiche</b>250 Punkte</div>
                        <div class="bb-rule"><b>4 gleiche</b>500 Punkte</div>
                        <div class="bb-rule"><b>Fehlklick</b>−3 Sekunden</div>
                    </div>

                    <button class="bb-primary" type="button">Spiel starten</button>
                </div>
            </section>

            <section class="bb-play">
                <div class="bb-hud">
                    <div class="bb-timer">
                        <div class="bb-timer-top">
                            <span class="bb-small-label bb-timer-label">Verbleibende Zeit · Normal</span>
                            <span class="bb-time">120.0s</span>
                        </div>
                        <div class="bb-track"><div class="bb-fill"></div></div>
                    </div>

                    <div class="bb-stat">
                        <div class="bb-small-label">Punkte</div>
                        <div class="bb-stat-value bb-score">0</div>
                    </div>

                    <div class="bb-stat">
                        <div class="bb-small-label">Combo</div>
                        <div class="bb-stat-value bb-combo">—</div>
                    </div>

                    <div class="bb-stat bb-streak-stat">
                        <div class="bb-small-label">Hot Streak</div>
                        <div class="bb-streak-row">
                            <span class="bb-streak-value">0/${HOT_STREAK_TARGET}</span>
                            <span class="bb-streak-track"><span class="bb-streak-fill"></span></span>
                        </div>
                    </div>

                    <div class="bb-stat">
                        <div class="bb-small-label">Blöcke</div>
                        <div class="bb-stat-value bb-blocks">0</div>
                    </div>

                    <button class="bb-secondary bb-pattern-btn" type="button">Muster: Aus</button>
                    <button class="bb-secondary bb-new-map-btn" type="button">Neue Karte</button>
                </div>

                <div class="bb-board-area">
                    <div class="bb-board" aria-label="BlockBuster Spielfeld"></div>

                    <div class="bb-rescue">
                        <div class="bb-rescue-card">
                            <div class="bb-rescue-kicker">Keine Züge mehr</div>
                            <div class="bb-rescue-title">BOARD REWIRE</div>
                            <div class="bb-rescue-copy">Positionen werden neu verdrahtet. Farben bleiben erhalten; unpaarbare Einzelblöcke werden recycelt.</div>
                            <div class="bb-rescue-penalty"></div>
                        </div>
                    </div>

                    <div class="bb-end">
                        <div class="bb-end-card">
                            <div class="bb-end-title">Runde beendet</div>
                            <div class="bb-end-sub"></div>
                            <div class="bb-end-score">0 Punkte</div>
                            <div class="bb-end-stats">
                                <div class="bb-end-stat">
                                    <div class="bb-end-stat-label">Accuracy</div>
                                    <div class="bb-end-stat-value bb-end-accuracy">0%</div>
                                </div>
                                <div class="bb-end-stat">
                                    <div class="bb-end-stat-label">Größte Combo</div>
                                    <div class="bb-end-stat-value bb-end-combo">0</div>
                                </div>
                                <div class="bb-end-stat">
                                    <div class="bb-end-stat-label">Clear</div>
                                    <div class="bb-end-stat-value bb-end-clear">0%</div>
                                </div>
                            </div>
                            <div class="bb-end-actions">
                                <button class="bb-end-btn bb-end-menu" type="button">Kartengröße</button>
                                <button class="bb-end-btn primary bb-end-retry" type="button">Nochmal</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;

        container.append(style, root);

        const menuEl = root.querySelector('.bb-menu');
        const playEl = root.querySelector('.bb-play');
        const boardAreaEl = root.querySelector('.bb-board-area');
        const boardEl = root.querySelector('.bb-board');
        const sizeButtons = [...root.querySelectorAll('.bb-size-card')];
        const difficultyButtons = [...root.querySelectorAll('.bb-difficulty-card')];
        const startBtn = root.querySelector('.bb-primary');
        const colorBlindToggleEl = root.querySelector('.bb-colorblind-toggle');
        const demoGridEl = root.querySelector('.bb-demo-grid');
        const demoStepEl = root.querySelector('.bb-demo-step');
        const demoScenarioEl = root.querySelector('.bb-demo-scenario');
        const demoExplainEl = root.querySelector('.bb-demo-explain');
        const demoResultEl = root.querySelector('.bb-demo-result');
        const patternBtn = root.querySelector('.bb-pattern-btn');
        const newMapBtn = root.querySelector('.bb-new-map-btn');
        const timeEl = root.querySelector('.bb-time');
        const timerLabelEl = root.querySelector('.bb-timer-label');
        const fillEl = root.querySelector('.bb-fill');
        const scoreEl = root.querySelector('.bb-score');
        const comboEl = root.querySelector('.bb-combo');
        const streakValueEl = root.querySelector('.bb-streak-value');
        const streakFillEl = root.querySelector('.bb-streak-fill');
        const blocksEl = root.querySelector('.bb-blocks');
        const rescueEl = root.querySelector('.bb-rescue');
        const rescuePenaltyEl = root.querySelector('.bb-rescue-penalty');
        const endEl = root.querySelector('.bb-end');
        const endTitleEl = root.querySelector('.bb-end-title');
        const endSubEl = root.querySelector('.bb-end-sub');
        const endScoreEl = root.querySelector('.bb-end-score');
        const endAccuracyEl = root.querySelector('.bb-end-accuracy');
        const endComboEl = root.querySelector('.bb-end-combo');
        const endClearEl = root.querySelector('.bb-end-clear');
        const endMenuBtn = root.querySelector('.bb-end-menu');
        const endRetryBtn = root.querySelector('.bb-end-retry');

        // ============================================================
        // MATCH LOGIC
        // ============================================================

        const indexOf = (row, col, cols) => row * cols + col;

        const nearestAxisTiles = (cellIndex, source, rows, cols) => {
            const row = Math.floor(cellIndex / cols);
            const col = cellIndex % cols;
            const found = [];
            const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

            for (let direction = 0; direction < dirs.length; direction++) {
                const [dr,dc] = dirs[direction];
                let r = row + dr;
                let c = col + dc;
                let distance = 1;

                while (r >= 0 && r < rows && c >= 0 && c < cols) {
                    const check = indexOf(r,c,cols);

                    // Leere Felder zählen nicht und werden übersprungen.
                    if (source[check] !== null) {
                        found.push({ index: check, color: source[check], direction, distance });
                        break;
                    }

                    r += dr;
                    c += dc;
                    distance++;
                }
            }

            return found;
        };

        const evaluateMove = (cellIndex, source, rows, cols) => {
            if (source[cellIndex] !== null) {
                return { valid:false, groups:[], score:0, removeIndices:[] };
            }

            const byColor = new Map();

            for (const tile of nearestAxisTiles(cellIndex, source, rows, cols)) {
                if (!byColor.has(tile.color)) {
                    byColor.set(tile.color, []);
                }
                byColor.get(tile.color).push(tile);
            }

            const groups = [];
            const removeSet = new Set();
            let gainedScore = 0;

            for (const [color, tiles] of byColor.entries()) {
                if (tiles.length < 2) continue;

                const indices = tiles.map(tile => tile.index);
                const directions = tiles.map(tile => tile.direction);

                groups.push({ color, indices, directions });
                gainedScore += SCORE_BY_MATCH_COUNT[indices.length] ?? 0;
                indices.forEach(i => removeSet.add(i));
            }

            return {
                valid: groups.length > 0,
                groups,
                score: gainedScore,
                removeIndices: [...removeSet]
            };
        };

        const findValidMoves = (source, rows, cols) => {
            const moves = [];

            for (let i = 0; i < source.length; i++) {
                if (
                    source[i] === null &&
                    evaluateMove(i, source, rows, cols).valid
                ) {
                    moves.push(i);
                }
            }

            return moves;
        };

        const countMoveRegions = (moves, rows, cols) => {
            const regions = new Set();

            for (const move of moves) {
                const row = Math.floor(move / cols);
                const col = move % cols;
                regions.add(`${row < rows/2 ? 0 : 1}-${col < cols/2 ? 0 : 1}`);
            }

            return regions.size;
        };

        // ============================================================
        // MAP GENERATION
        // ============================================================

        const shuffle = values => {
            const copy = [...values];

            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }

            return copy;
        };

        const sameIndexSet = (a, b) => {
            if (a.length !== b.length) return false;
            const set = new Set(a);
            return b.every(value => set.has(value));
        };

        // Liefert pro Richtung alle freien Felder bis zum ersten Block.
        // Neue garantierte Match-Blöcke dürfen nur auf diesen Rays landen,
        // damit sie aus dem gewählten Pivot tatsächlich die nächsten Blöcke sind.
        const getEmptyDirectionRays = (pivot, source, rows, cols) => {
            const row = Math.floor(pivot / cols);
            const col = pivot % cols;
            const directions = [[-1,0],[1,0],[0,-1],[0,1]];

            return directions.map(([dr, dc]) => {
                const cells = [];
                let r = row + dr;
                let c = col + dc;

                while (r >= 0 && r < rows && c >= 0 && c < cols) {
                    const cellIndex = indexOf(r, c, cols);
                    if (source[cellIndex] !== null) break;

                    cells.push(cellIndex);
                    r += dr;
                    c += dc;
                }

                return cells;
            });
        };

        const pickRayTarget = ray => {
            const usable = ray.slice(0, currentDifficulty.maxRayDistance);
            if (!usable.length) return null;

            // Nahe Tiles sind etwas wahrscheinlicher, längere Sichtlinien
            // kommen aber regelmäßig vor und machen die Karte weniger künstlich.
            const roll = Math.random();
            const position = roll < 0.52 ? 0 : roll < 0.82 ? 1 : 2;
            return usable[Math.min(position, usable.length - 1)];
        };

        const colorUsage = source => {
            const counts = Array(TILE_COLORS.length).fill(0);
            source.forEach(color => {
                if (color !== null) counts[color]++;
            });
            return counts;
        };

        const pickBalancedColor = (counts, excluded = [], additionallyExcluded = []) => {
            const blocked = new Set([...excluded, ...additionallyExcluded]);
            let options = counts
                .map((count, color) => ({ color, count, jitter: Math.random() * 1.4 }))
                .filter(entry => !blocked.has(entry.color));

            if (!options.length) {
                options = counts.map((count, color) => ({ color, count, jitter: Math.random() * 1.4 }));
            }

            options.sort((a, b) => (a.count + a.jitter) - (b.count + b.jitter));
            return options[Math.floor(Math.random() * Math.min(3, options.length))].color;
        };

        const choosePairDirections = available => {
            const oppositePairs = [[0,1],[2,3]].filter(pair => pair.every(dir => available.includes(dir)));
            const preferOppositeChance = selectedDifficultyKey === 'easy'
                ? 0.66
                : selectedDifficultyKey === 'normal'
                    ? 0.58
                    : selectedDifficultyKey === 'hard'
                        ? 0.42
                        : 0.32;

            if (oppositePairs.length && Math.random() < preferOppositeChance) {
                return oppositePairs[Math.floor(Math.random() * oppositePairs.length)];
            }

            return shuffle(available).slice(0, 2);
        };

        // Der Generator baut das Board rückwärts auf:
        // Start = komplett leer. Jeder Schritt fügt 2-4 Blöcke so hinzu,
        // dass genau diese Blöcke mit einem bekannten leeren Pivot wieder
        // entfernt werden können. In umgekehrter Reihenfolge entsteht dadurch
        // ein verifizierbarer Lösungsweg bis zum komplett leeren Board.
        const tryAddGuaranteedStep = (source, preset, remainingToTarget) => {
            const { rows, cols } = preset;
            const emptyPivots = [];

            for (let i = 0; i < source.length; i++) {
                if (source[i] === null) emptyPivots.push(i);
            }

            const counts = colorUsage(source);

            for (const pivot of shuffle(emptyPivots).slice(0, 70)) {
                const rays = getEmptyDirectionRays(pivot, source, rows, cols);
                const available = [0,1,2,3].filter(dir => rays[dir].length > 0);
                if (available.length < 2) continue;

                const patterns = [];
                const canUseSize = size =>
                    size <= remainingToTarget && remainingToTarget - size !== 1;

                if (canUseSize(2)) {
                    patterns.push({ type:'pair', size:2, weight:currentDifficulty.pairWeight });
                }
                if (available.length >= 3 && canUseSize(3)) patterns.push({ type:'triple', size:3, weight:currentDifficulty.tripleWeight });
                if (available.length >= 4 && canUseSize(4)) {
                    patterns.push({ type:'quad', size:4, weight:currentDifficulty.quadWeight });
                    patterns.push({ type:'doublePair', size:4, weight:currentDifficulty.doublePairWeight });
                }

                if (!patterns.length) continue;

                const totalWeight = patterns.reduce((sum, pattern) => sum + pattern.weight, 0);
                let roll = Math.random() * totalWeight;
                let chosenPattern = patterns[0];

                for (const pattern of patterns) {
                    roll -= pattern.weight;
                    if (roll <= 0) {
                        chosenPattern = pattern;
                        break;
                    }
                }

                const candidate = source.slice();
                let targetIndices = [];

                if (chosenPattern.type === 'doublePair') {
                    if (![0,1,2,3].every(dir => available.includes(dir))) continue;

                    const verticalTargets = [pickRayTarget(rays[0]), pickRayTarget(rays[1])];
                    const horizontalTargets = [pickRayTarget(rays[2]), pickRayTarget(rays[3])];
                    if ([...verticalTargets, ...horizontalTargets].some(value => value === null)) continue;

                    const firstColor = pickBalancedColor(counts);
                    const secondColor = pickBalancedColor(counts, [firstColor]);

                    verticalTargets.forEach(index => candidate[index] = firstColor);
                    horizontalTargets.forEach(index => candidate[index] = secondColor);
                    targetIndices = [...verticalTargets, ...horizontalTargets];
                } else {
                    let directions;

                    if (chosenPattern.size === 2) {
                        directions = choosePairDirections(available);
                        if (!directions) continue;
                    } else {
                        directions = shuffle(available).slice(0, chosenPattern.size);
                    }

                    targetIndices = directions.map(dir => pickRayTarget(rays[dir]));
                    if (targetIndices.some(value => value === null)) continue;

                    // Ein Farbwert, der bei den bereits sichtbaren Nachbarblöcken
                    // möglichst noch nicht vorkommt, reduziert unbeabsichtigte
                    // "Gratis-Matches" und hält die Map strategischer.
                    const existingAxisColors = nearestAxisTiles(
                        pivot,
                        source,
                        rows,
                        cols
                    ).map(tile => tile.color);

                    const color = pickBalancedColor(counts, existingAxisColors);
                    targetIndices.forEach(index => candidate[index] = color);
                }

                const check = evaluateMove(pivot, candidate, rows, cols);

                // Nur Schritte übernehmen, bei denen exakt die neu gesetzten
                // Tiles verschwinden würden. Das ist die Garantie des Lösungswegs.
                if (check.valid && sameIndexSet(check.removeIndices, targetIndices)) {
                    return {
                        board: candidate,
                        step: {
                            pivot,
                            removeIndices: targetIndices
                        }
                    };
                }
            }

            return null;
        };

        const verifyGeneratedSolution = (source, solution, preset) => {
            const simulated = source.slice();

            for (let i = solution.length - 1; i >= 0; i--) {
                const step = solution[i];
                const result = evaluateMove(step.pivot, simulated, preset.rows, preset.cols);

                if (!result.valid || !sameIndexSet(result.removeIndices, step.removeIndices)) {
                    return false;
                }

                result.removeIndices.forEach(index => simulated[index] = null);
            }

            return simulated.every(value => value === null);
        };

        const buildSolvableCandidate = (preset, requestedTargetBlocks = null) => {
            const total = preset.rows * preset.cols;
            const targetBlocks = requestedTargetBlocks === null
                ? Math.max(2, Math.round(total * Math.min(0.82, preset.fillRatio * currentDifficulty.fillMultiplier)))
                : Math.max(2, Math.min(total, Math.round(requestedTargetBlocks)));
            let candidate = Array(total).fill(null);
            const solution = [];
            let blockCount = 0;
            let failedAttempts = 0;
            const maxFailures = total * 7;

            while (blockCount < targetBlocks && failedAttempts < maxFailures) {
                const remaining = targetBlocks - blockCount;
                const result = tryAddGuaranteedStep(candidate, preset, remaining);

                if (!result) {
                    failedAttempts++;
                    continue;
                }

                candidate = result.board;
                solution.push(result.step);
                blockCount += result.step.removeIndices.length;
                failedAttempts = 0;
            }

            return {
                board: candidate,
                solution,
                blockCount,
                targetBlocks,
                solved: blockCount === targetBlocks && verifyGeneratedSolution(candidate, solution, preset)
            };
        };

        const analyzeGeneratedBoard = (candidate, preset) => {
            const { rows, cols } = preset;
            const moves = findValidMoves(candidate, rows, cols);
            const regions = countMoveRegions(moves, rows, cols);
            const emptyCount = candidate.length - candidate.filter(value => value !== null).length;
            const moveRatio = emptyCount > 0 ? moves.length / emptyCount : 0;

            let multiMatches = 0;
            let strongMatches = 0;

            for (const move of moves) {
                const result = evaluateMove(move, candidate, rows, cols);
                if (result.groups.length > 1) multiMatches++;
                if (result.groups.some(group => group.indices.length >= 3)) strongMatches++;
            }

            const colors = colorUsage(candidate);
            const usedColors = colors.filter(value => value > 0);
            const colorAverage = usedColors.reduce((sum, value) => sum + value, 0) / Math.max(1, usedColors.length);
            const colorSpread = usedColors.length
                ? 1 - Math.min(1, (Math.max(...usedColors) - Math.min(...usedColors)) / Math.max(1, colorAverage))
                : 0;

            const quadrants = [0,0,0,0];
            candidate.forEach((value, index) => {
                if (value === null) return;
                const row = Math.floor(index / cols);
                const col = index % cols;
                const q = (row < rows / 2 ? 0 : 2) + (col < cols / 2 ? 0 : 1);
                quadrants[q]++;
            });

            const quadrantAverage = quadrants.reduce((sum, value) => sum + value, 0) / 4;
            const quadrantSpread = 1 - Math.min(
                1,
                (Math.max(...quadrants) - Math.min(...quadrants)) / Math.max(1, quadrantAverage)
            );

            const ratioFit = (value, target, tolerance) =>
                Math.max(0, 1 - Math.abs(value - target) / Math.max(0.001, tolerance));

            const moveTargetFit = ratioFit(
                moveRatio,
                currentDifficulty.targetMoveRatio,
                Math.max(0.055, currentDifficulty.targetMoveRatio * 0.65)
            );

            const multiRatio = moves.length ? multiMatches / moves.length : 0;
            const strongRatio = moves.length ? strongMatches / moves.length : 0;
            const multiFit = ratioFit(multiRatio, currentDifficulty.targetMultiRatio, Math.max(0.035, currentDifficulty.targetMultiRatio * 1.1));
            const strongFit = ratioFit(strongRatio, currentDifficulty.targetStrongRatio, Math.max(0.045, currentDifficulty.targetStrongRatio * 0.9));

            // Zu viele gültige Leerfelder machen das Puzzle trivial. Dieser
            // Überschuss wird auf Hard/Expert besonders stark bestraft.
            const excessMoves = Math.max(0, moveRatio - currentDifficulty.targetMoveRatio);
            const excessPenalty = excessMoves * (selectedDifficultyKey === 'easy' ? 35 : selectedDifficultyKey === 'normal' ? 105 : selectedDifficultyKey === 'hard' ? 155 : 210);

            const quality =
                moveTargetFit * 38 +
                (regions / 4) * 15 +
                multiFit * 11 +
                strongFit * 9 +
                colorSpread * 10 +
                quadrantSpread * 10 +
                Math.min(1, moves.length / Math.max(1, preset.minStartMoves)) * 7 -
                excessPenalty;

            return {
                moves,
                regions,
                multiMatches,
                strongMatches,
                quality
            };
        };

        const generatePlayableBoard = preset => {
            let bestCandidate = null;
            let bestQuality = -Infinity;

            for (let attempt = 0; attempt < currentDifficulty.candidateCount; attempt++) {
                const generated = buildSolvableCandidate(preset);
                if (!generated.solved) continue;

                const analysis = analyzeGeneratedBoard(generated.board, preset);

                // Ein lösbarer Kandidat wird nur als "Premium" akzeptiert,
                // wenn mehrere Startmöglichkeiten über die Karte verteilt sind.
                const requiredMoves = Math.max(2, Math.round(preset.minStartMoves * currentDifficulty.minMoveFactor));
                const requiredRegions = Math.max(2, Math.round(preset.minMoveRegions * currentDifficulty.minRegionFactor));
                const openingIsHealthy =
                    analysis.moves.length >= requiredMoves &&
                    analysis.regions >= requiredRegions;

                const quality = analysis.quality + (openingIsHealthy ? 30 : 0);

                if (quality > bestQuality) {
                    bestQuality = quality;
                    bestCandidate = generated.board;
                }
            }

            // Der konstruktive Generator erreicht normalerweise immer einen
            // verifizierten Kandidaten. Dieser Fallback verhindert trotzdem,
            // dass ein exotischer Browser-/Random-Fall den Spielstart blockiert.
            if (bestCandidate) return bestCandidate;

            for (let fallback = 0; fallback < 80; fallback++) {
                const random = Array.from({ length:preset.rows * preset.cols }, () =>
                    Math.random() > preset.fillRatio
                        ? null
                        : Math.floor(Math.random() * TILE_COLORS.length)
                );

                const moves = findValidMoves(random, preset.rows, preset.cols);
                if (moves.length >= preset.minStartMoves) return random;
            }

            return Array(preset.rows * preset.cols).fill(null);
        };

        // Rewire-Generator mit Farberhalt:
        // Der alte Rescue hat ein komplett neues Board erzeugt und dadurch Farben
        // neu ausgewürfelt. Diese Variante benutzt exakt das vorhandene Farbinventar.
        // Nur Farben, von denen tatsächlich nur noch EIN Block existiert, sind nach
        // den Spielregeln unrettbar und werden separat als "Orphan" recycelt.
        const getColorCounts = source => {
            const counts = Array(TILE_COLORS.length).fill(0);
            source.forEach(color => {
                if (color !== null) counts[color]++;
            });
            return counts;
        };

        const getOrphanIndices = source => {
            const counts = getColorCounts(source);
            const orphanColors = new Set(
                counts.map((count, color) => count === 1 ? color : null).filter(color => color !== null)
            );

            const indices = [];
            source.forEach((color, index) => {
                if (color !== null && orphanColors.has(color)) indices.push(index);
            });
            return indices;
        };

        const tryAddPreservedColorStep = (source, preset, remainingCounts) => {
            const { rows, cols } = preset;
            const options = [];

            remainingCounts.forEach((count, color) => {
                if (count < 2) return;

                // 2er und 3er reichen mathematisch aus, jede Anzahl >=2
                // vollständig zu zerlegen (4=2+2, 5=2+3, ...).
                for (const size of [2,3]) {
                    const rest = count - size;
                    if (rest < 0 || rest === 1) continue;
                    options.push({ color, size });
                }
            });

            for (const option of shuffle(options)) {
                const emptyPivots = [];
                for (let i = 0; i < source.length; i++) {
                    if (source[i] === null) emptyPivots.push(i);
                }

                for (const pivot of shuffle(emptyPivots).slice(0, 100)) {
                    // Wenn dieselbe Farbe an einer anderen sichtbaren Achse bereits
                    // liegt, würde der Klick mehr Blöcke entfernen als geplant.
                    const visibleColors = nearestAxisTiles(pivot, source, rows, cols).map(tile => tile.color);
                    if (visibleColors.includes(option.color)) continue;

                    const rays = getEmptyDirectionRays(pivot, source, rows, cols);
                    const available = [0,1,2,3].filter(dir => rays[dir].length > 0);
                    if (available.length < option.size) continue;

                    const directions = option.size === 2
                        ? choosePairDirections(available)
                        : shuffle(available).slice(0, option.size);
                    if (!directions) continue;

                    const targets = directions.map(dir => pickRayTarget(rays[dir]));
                    if (targets.some(index => index === null)) continue;

                    const candidate = source.slice();
                    targets.forEach(index => candidate[index] = option.color);
                    const check = evaluateMove(pivot, candidate, rows, cols);

                    if (check.valid && sameIndexSet(check.removeIndices, targets)) {
                        return {
                            board: candidate,
                            step: { pivot, removeIndices: targets },
                            color: option.color,
                            size: option.size
                        };
                    }
                }
            }

            return null;
        };

        const buildColorPreservingCandidate = (preset, colorCounts) => {
            const total = preset.rows * preset.cols;

            for (let fullAttempt = 0; fullAttempt < 36; fullAttempt++) {
                let candidate = Array(total).fill(null);
                const remaining = [...colorCounts];
                const solution = [];
                let guard = 0;

                while (remaining.some(count => count > 0) && guard < total * 5) {
                    const step = tryAddPreservedColorStep(candidate, preset, remaining);
                    if (!step) break;

                    candidate = step.board;
                    remaining[step.color] -= step.size;
                    solution.push(step.step);
                    guard++;
                }

                if (
                    remaining.every(count => count === 0) &&
                    verifyGeneratedSolution(candidate, solution, preset)
                ) {
                    return { board:candidate, solution };
                }
            }

            return null;
        };

        const generateRescueBoard = (preset, sourceBoard) => {
            const counts = getColorCounts(sourceBoard);

            // Singleton-Farben werden vor diesem Aufruf bereits entfernt.
            if (counts.some(count => count === 1)) return null;
            if (counts.every(count => count === 0)) return Array(sourceBoard.length).fill(null);

            let bestCandidate = null;
            let bestQuality = -Infinity;

            for (let attempt = 0; attempt < RESCUE_GENERATOR_CANDIDATES; attempt++) {
                const generated = buildColorPreservingCandidate(preset, counts);
                if (!generated) continue;

                const analysis = analyzeGeneratedBoard(generated.board, preset);
                const quality = analysis.quality + Math.min(12, analysis.moves.length * 0.45);

                if (quality > bestQuality) {
                    bestQuality = quality;
                    bestCandidate = generated.board;
                }
            }

            return bestCandidate;
        };

        // ============================================================
        // BOARD
        // ============================================================

        const fitBoard = () => {
            if (!currentPreset || !playEl.classList.contains('visible')) {
                return;
            }

            const availableWidth = Math.max(100, boardAreaEl.clientWidth - 28);
            const availableHeight = Math.max(100, boardAreaEl.clientHeight - 28);
            const ratio = currentPreset.cols / currentPreset.rows;

            let width = Math.min(availableWidth, availableHeight * ratio);
            let height = width / ratio;

            if (height > availableHeight) {
                height = availableHeight;
                width = height * ratio;
            }

            boardEl.style.width = `${Math.floor(width)}px`;
            boardEl.style.height = `${Math.floor(height)}px`;
            boardEl.style.gridTemplateColumns = `repeat(${currentPreset.cols},1fr)`;
            boardEl.style.gridTemplateRows = `repeat(${currentPreset.rows},1fr)`;

            const cellSize = Math.min(width / currentPreset.cols, height / currentPreset.rows);
            boardEl.style.setProperty('--bb-symbol-size', `${Math.max(8, Math.min(18, cellSize * 0.52))}px`);
        };

        const renderBoard = () => {
            const { rows, cols } = currentPreset;
            const fragment = document.createDocumentFragment();
            boardEl.innerHTML = '';

            board.forEach((colorIndex, i) => {
                const row = Math.floor(i / cols);
                const col = i % cols;
                const cell = document.createElement('button');

                cell.type = 'button';
                cell.dataset.index = i;
                cell.className = `bb-cell ${((row+col)%2) ? 'alt' : ''}`;

                if (colorIndex === null) {
                    cell.classList.add('empty');
                } else {
                    const tileStyle = TILE_COLORS[colorIndex];
                    cell.classList.add('block');
                    cell.style.setProperty('--tile-color', tileStyle.value);
                    cell.style.setProperty('--tile-pattern', tileStyle.pattern);
                    cell.dataset.symbol = tileStyle.symbol;
                }

                fragment.appendChild(cell);
            });

            boardEl.appendChild(fragment);
            fitBoard();
        };

        const visuallyRemoveCell = (cellIndex, power = 2) => {
            const cell = boardEl.querySelector(`[data-index="${cellIndex}"]`);
            if (!cell) return;

            cell.classList.add('removing', `power-${Math.max(2, Math.min(4, power))}`);

            setTimeout(() => {
                if (destroyed || !cell.isConnected) return;

                const row = Math.floor(cellIndex / currentPreset.cols);
                const col = cellIndex % currentPreset.cols;

                cell.className = `bb-cell empty ${((row+col)%2) ? 'alt' : ''}`;
                cell.style.removeProperty('--tile-color');
                cell.style.removeProperty('--tile-pattern');
                delete cell.dataset.symbol;
            }, 120);
        };

        // ============================================================
        // SCORE / COMBO / STREAK
        // ============================================================

        const getComboMultiplier = combo =>
            COMBO_MULTIPLIERS[Math.min(Math.max(combo, 1), COMBO_MULTIPLIERS.length) - 1];

        const registerSuccessfulClick = () => {
            successfulClicks++;

            comboCount = comboTimeLeft > 0 ? comboCount + 1 : 1;
            comboTimeLeft = COMBO_WINDOW_SECONDS;
            biggestCombo = Math.max(biggestCombo, comboCount);

            hotStreak++;
            let streakReward = false;

            if (hotStreak >= HOT_STREAK_TARGET) {
                remainingTime += HOT_STREAK_TIME_BONUS;
                hotStreak = 0;
                streakReward = true;
            }

            return {
                multiplier: getComboMultiplier(comboCount),
                streakReward
            };
        };

        const registerFailedClick = () => {
            failedClicks++;
            comboCount = 0;
            comboTimeLeft = 0;
            hotStreak = 0;
        };

        const getAccuracy = () => {
            const total = successfulClicks + failedClicks;
            return total > 0 ? successfulClicks / total * 100 : 0;
        };

        const getClearPercent = () => {
            if (initialBlockCount <= 0) return 0;
            return Math.max(0, Math.min(100, (initialBlockCount - remainingBlocks) / initialBlockCount * 100));
        };

        const triggerMatchFeedback = (matchPower, isMulti) => {
            const classes = ['match-2', 'match-3', 'match-4', 'multi-match'];
            boardAreaEl.classList.remove(...classes);
            void boardAreaEl.offsetWidth;

            const feedbackClass = isMulti
                ? 'multi-match'
                : `match-${Math.max(2, Math.min(4, matchPower))}`;

            boardAreaEl.classList.add(feedbackClass);
            setTimeout(() => boardAreaEl.classList.remove(feedbackClass), 430);
        };

        const triggerComboFieldFeedback = () => {
            if (comboCount < 2) return;
            boardAreaEl.classList.remove('combo-hit');
            void boardAreaEl.offsetWidth;
            boardAreaEl.classList.add('combo-hit');
            setTimeout(() => boardAreaEl.classList.remove('combo-hit'), 260);
        };

        // ============================================================
        // ACCESSIBILITY / COLORBLIND MODE
        // ============================================================

        const applyColorBlindMode = () => {
            root.classList.toggle('colorblind-mode', colorBlindMode);
            colorBlindToggleEl.checked = colorBlindMode;
            patternBtn.textContent = colorBlindMode ? 'Muster: An' : 'Muster: Aus';
            patternBtn.classList.toggle('active-mode', colorBlindMode);
        };

        // ============================================================
        // MAIN MENU HOW-TO DEMO
        // ============================================================

        const DEMO_SCENARIOS = [
            {
                title: 'Ein einfaches Paar',
                explain: 'Klicke das markierte leere Feld. Zwei gleiche Farben auf den Achsen verschwinden.',
                score: 100,
                clickIndex: 4,
                cells: { 0:4, 1:6, 2:2, 3:0, 5:0, 6:5, 7:7, 8:3 },
                matched: [3,5]
            },
            {
                title: 'Drei gleiche Farben',
                explain: 'Sind drei der nächsten Achsen-Blöcke gleich, verschwinden alle drei auf einmal.',
                score: 250,
                clickIndex: 4,
                cells: { 0:1, 1:4, 2:6, 3:4, 5:4, 6:2, 7:3, 8:7 },
                matched: [1,3,5]
            },
            {
                title: 'Vierer-Match',
                explain: 'Treffen sich dieselben Farben aus allen vier Richtungen, räumst du vier Blöcke mit einem Klick ab.',
                score: 500,
                clickIndex: 4,
                cells: { 0:0, 1:6, 2:2, 3:6, 5:6, 6:5, 7:6, 8:3 },
                matched: [1,3,5,7]
            },
            {
                title: 'Zwei Paare gleichzeitig',
                explain: 'Auch zwei verschiedene Farbpaare zählen gleichzeitig: hier Blau horizontal und Orange vertikal.',
                score: 200,
                clickIndex: 4,
                cells: { 0:4, 1:3, 2:5, 3:1, 5:1, 6:2, 7:3, 8:6 },
                matched: [1,3,5,7]
            },
            {
                title: 'Leere Felder werden übersprungen',
                explain: 'Klickst du unten rechts, schaut das Spiel nach oben und links weiter, bis der nächste Block kommt. Die beiden blauen Eckblöcke bilden deshalb ein Paar.',
                score: 100,
                clickIndex: 8,
                cells: { 0:3, 2:1, 4:5, 6:1 },
                matched: [2,6]
            },
            {
                title: 'Matches funktionieren auch auf Distanz',
                explain: 'Auch vom oberen linken Feld aus zählen die ersten sichtbaren Blöcke rechts und unten – selbst wenn mehrere leere Felder dazwischen liegen.',
                score: 100,
                clickIndex: 0,
                cells: { 2:3, 4:6, 6:3, 8:5 },
                matched: [2,6]
            }
        ];

        const clearDemoTimeouts = () => {
            demoTimeouts.forEach(timeout => clearTimeout(timeout));
            demoTimeouts = [];
        };

        const renderDemoScenario = scenario => {
            demoGridEl.innerHTML = '';

            for (let i = 0; i < 9; i++) {
                const cell = document.createElement('div');
                cell.className = `bb-demo-cell ${i % 2 ? 'alt' : ''}`;
                cell.dataset.demoIndex = i;

                if (i === scenario.clickIndex) {
                    cell.classList.add('target');
                    cell.innerHTML = '<span class="bb-demo-click-dot"></span>';
                } else if (Object.prototype.hasOwnProperty.call(scenario.cells, i)) {
                    const colorIndex = scenario.cells[i];
                    const color = TILE_COLORS[colorIndex];
                    cell.classList.add('block');
                    cell.style.setProperty('--demo-color', color.value);
                    cell.style.setProperty('--demo-pattern', color.pattern);
                    cell.innerHTML = `<span class="bb-demo-symbol">${color.symbol}</span>`;
                }

                demoGridEl.appendChild(cell);
            }

            demoStepEl.textContent = `Beispiel ${demoScenarioIndex + 1} / ${DEMO_SCENARIOS.length}`;
            demoScenarioEl.textContent = scenario.title;
            demoExplainEl.textContent = scenario.explain;
            demoResultEl.classList.remove('success');
            demoResultEl.innerHTML = '<span>●</span><strong>Klicke das markierte Feld</strong>';
        };

        const playDemoScenario = () => {
            clearDemoTimeouts();
            const scenario = DEMO_SCENARIOS[demoScenarioIndex];
            renderDemoScenario(scenario);

            demoTimeouts.push(setTimeout(() => {
                demoGridEl.querySelector(`[data-demo-index="${scenario.clickIndex}"]`)?.classList.add('clicked');
                demoResultEl.innerHTML = '<span>◎</span><strong>Achsen werden geprüft …</strong>';
            }, 850));

            demoTimeouts.push(setTimeout(() => {
                scenario.matched.forEach(index =>
                    demoGridEl.querySelector(`[data-demo-index="${index}"]`)?.classList.add('matched')
                );
            }, 1250));

            demoTimeouts.push(setTimeout(() => {
                scenario.matched.forEach(index =>
                    demoGridEl.querySelector(`[data-demo-index="${index}"]`)?.classList.add('removed')
                );
                demoResultEl.classList.add('success');
                demoResultEl.innerHTML = `<span>✓</span><strong>+${scenario.score} Punkte</strong>`;
            }, 1850));

            demoTimeouts.push(setTimeout(() => {
                demoScenarioIndex = (demoScenarioIndex + 1) % DEMO_SCENARIOS.length;
                playDemoScenario();
            }, 3400));
        };

        const startMenuDemo = () => {
            if (demoTimer !== null) return;
            playDemoScenario();
            // Marker verhindert doppelte Starts; das eigentliche Timing läuft
            // bewusst über rekursive Timeouts, damit jede Szene vollständig bleibt.
            demoTimer = 1;
        };

        const stopMenuDemo = () => {
            clearDemoTimeouts();
            demoTimer = null;
        };

        // ============================================================
        // STUCK RESCUE / BOARD REWIRE
        // ============================================================

        const getRescuePenalty = () => Math.max(
            RESCUE_BASE_PENALTY,
            Math.round(score * RESCUE_SCORE_PERCENT),
            remainingBlocks * RESCUE_PENALTY_PER_BLOCK
        );

        const showRescueOverlay = (lostPoints, orphanCount = 0) => {
            const orphanText = orphanCount > 0
                ? ` · ${orphanCount} unpaarbare${orphanCount === 1 ? 'r' : ''} Einzelblock${orphanCount === 1 ? '' : 'e'} recycelt`
                : '';

            rescuePenaltyEl.textContent =
                `−${lostPoints.toLocaleString('de-DE')} Punkte${orphanText} · Farben bleiben erhalten`;

            rescueEl.classList.remove('visible');
            void rescueEl.offsetWidth;
            rescueEl.classList.add('visible');
        };

        const restartTimerAfterRescue = () => {
            if (destroyed || !gameRunning) return;
            lastTimerFrame = performance.now();
            timerAnimationId = requestAnimationFrame(timerLoop);
        };

        const rescueStuckBoard = () => {
            if (!gameRunning || rescueInProgress || remainingBlocks <= 0) return;

            rescueInProgress = true;
            rescueCount++;
            stopTimer(); // Die 2.2s Rewire-Animation kostet keine zusätzliche Spielzeit.

            comboCount = 0;
            comboTimeLeft = 0;
            hotStreak = 0;
            updateHUD();

            const originalBoard = board.slice();
            const originalRemainingBlocks = remainingBlocks;
            const requestedPenalty = getRescuePenalty();
            const lostPoints = Math.min(score, requestedPenalty);
            score -= lostPoints;

            // Farben mit nur einem verbleibenden Block können nach den Regeln
            // niemals mehr entfernt werden. Sie werden sichtbar recycelt statt
            // heimlich in eine andere Farbe umgewandelt.
            const orphanIndices = getOrphanIndices(board);
            orphanIndices.forEach(index => {
                const cell = boardEl.querySelector(`[data-index="${index}"]`);
                cell?.classList.add('orphan-recycle');
            });

            showRescueOverlay(lostPoints, orphanIndices.length);
            boardEl.classList.add('rewiring');

            setTimeout(() => {
                if (destroyed || !gameRunning) return;

                orphanIndices.forEach(index => {
                    if (board[index] !== null) {
                        board[index] = null;
                        remainingBlocks--;
                    }
                });

                if (remainingBlocks <= 0) {
                    remainingBlocks = 0;
                    board = Array(currentPreset.rows * currentPreset.cols).fill(null);
                    renderBoard();
                    boardEl.classList.remove('rewiring');
                    boardEl.classList.add('rewired');
                    updateHUD();
                    return;
                }

                const rewired = generateRescueBoard(currentPreset, board);

                if (!rewired) {
                    // Kein Farbumschreiben als Fallback. Falls der konstruktive
                    // Rewire extrem selten scheitert, wird einfach erneut mit
                    // denselben Farben versucht.
                    let fallback = null;
                    for (let attempt = 0; attempt < 70 && !fallback; attempt++) {
                        const candidate = buildColorPreservingCandidate(currentPreset, getColorCounts(board));
                        if (candidate) fallback = candidate.board;
                    }

                    if (!fallback) {
                        board = originalBoard;
                        remainingBlocks = originalRemainingBlocks;
                        score += lostPoints;
                        rescueCount--;
                        rescueInProgress = false;
                        rescueEl.classList.remove('visible');
                        boardEl.classList.remove('rewiring');
                        renderBoard();
                        updateHUD();
                        restartTimerAfterRescue();
                        return;
                    }

                    board = fallback;
                } else {
                    board = rewired;
                }

                // remainingBlocks bleibt identisch: nur Positionen wurden geändert.
                renderBoard();
                boardEl.classList.remove('rewiring');
                boardEl.classList.add('rewired');
                setTimeout(() => boardEl.classList.remove('rewired'), 700);
                updateHUD();
            }, RESCUE_SWAP_DELAY_MS);

            setTimeout(() => {
                if (destroyed || !gameRunning) return;

                rescueEl.classList.remove('visible');
                boardEl.classList.remove('rewiring');
                rescueInProgress = false;

                if (remainingBlocks <= 0) {
                    endGame('cleared');
                } else {
                    restartTimerAfterRescue();
                }
            }, RESCUE_DISPLAY_MS);
        };

        // ============================================================
        // UI / TIMER
        // ============================================================

        const updateHUD = () => {
            scoreEl.textContent = score.toLocaleString('de-DE');
            blocksEl.textContent = remainingBlocks.toLocaleString('de-DE');

            if (comboCount > 0) {
                const multiplier = getComboMultiplier(comboCount);
                comboEl.textContent = `${comboCount} · ${multiplier.toLocaleString('de-DE', { maximumFractionDigits: 1 })}×`;
            } else {
                comboEl.textContent = '—';
            }

            comboEl.classList.toggle('active', comboCount >= 2);

            const comboTierClasses = ['combo-tier-2', 'combo-tier-3', 'combo-tier-4'];
            const desiredComboTier = comboCount >= 4
                ? 'combo-tier-4'
                : comboCount >= 3
                    ? 'combo-tier-3'
                    : comboCount >= 2
                        ? 'combo-tier-2'
                        : null;

            const activeComboTier = comboTierClasses.find(className =>
                boardAreaEl.classList.contains(className)
            ) ?? null;

            // Nur ändern, wenn sich die Combo-Stufe wirklich ändert.
            // Vorher wurden die Klassen bei jedem HUD-Frame entfernt und neu
            // gesetzt, wodurch Glow/Animationen ständig neu gestartet wurden.
            if (activeComboTier !== desiredComboTier) {
                boardAreaEl.classList.remove(...comboTierClasses);
                if (desiredComboTier) boardAreaEl.classList.add(desiredComboTier);
            }

            streakValueEl.textContent = `${hotStreak}/${HOT_STREAK_TARGET}`;
            streakFillEl.style.transform = `scaleX(${hotStreak / HOT_STREAK_TARGET})`;

            const time = Math.max(0, remainingTime);
            timeEl.textContent = `${time.toFixed(1)}s`;

            timerLabelEl.textContent = currentDifficulty
                ? `Verbleibende Zeit · ${currentDifficulty.label}`
                : 'Verbleibende Zeit';

            const fraction = currentPreset
                ? Math.max(0, Math.min(1, time / roundDuration))
                : 1;

            fillEl.style.transform = `scaleX(${fraction})`;

            const danger = fraction <= 0.2;
            timeEl.classList.toggle('danger', danger);
            fillEl.classList.toggle('danger', danger);
        };

        const showPopup = (text, type, cellIndex, extraClass = '') => {
            const popup = document.createElement('div');
            popup.className = `bb-popup ${type} ${extraClass}`.trim();
            popup.textContent = text;

            const cell = boardEl.querySelector(`[data-index="${cellIndex}"]`);
            if (cell) {
                const areaRect = boardAreaEl.getBoundingClientRect();
                const cellRect = cell.getBoundingClientRect();
                popup.style.left = `${cellRect.left - areaRect.left + cellRect.width/2}px`;
                popup.style.top = `${cellRect.top - areaRect.top + cellRect.height/2}px`;
            }

            boardAreaEl.appendChild(popup);
            setTimeout(() => popup.remove(), 800);
        };

        const wrongFeedback = cellIndex => {
            boardAreaEl.classList.remove('wrong');
            void boardAreaEl.offsetWidth;
            boardAreaEl.classList.add('wrong');
            showPopup(`-${currentDifficulty.mistakePenalty}s`, 'bad', cellIndex);
        };

        const stopTimer = () => {
            if (timerAnimationId !== null) {
                cancelAnimationFrame(timerAnimationId);
                timerAnimationId = null;
            }
        };

        const timerLoop = timestamp => {
            if (!gameRunning || destroyed) return;

            const delta = Math.min(
                0.1,
                Math.max(0, (timestamp - lastTimerFrame) / 1000)
            );

            lastTimerFrame = timestamp;
            remainingTime -= delta;

            if (comboTimeLeft > 0) {
                comboTimeLeft -= delta;
                if (comboTimeLeft <= 0) {
                    comboTimeLeft = 0;
                    comboCount = 0;
                }
            }

            if (remainingTime <= 0) {
                remainingTime = 0;
                updateHUD();
                endGame('time');
                return;
            }

            updateHUD();
            timerAnimationId = requestAnimationFrame(timerLoop);
        };

        // ============================================================
        // ROUND FLOW
        // ============================================================

        const countBlocks = () =>
            board.reduce((sum,value) => sum + (value !== null ? 1 : 0), 0);

        const endGame = reason => {
            if (!gameRunning) return;

            gameRunning = false;
            stopTimer();

            const clearPercent = reason === 'cleared' ? 100 : getClearPercent();
            const accuracy = getAccuracy();
            let clearBonus = 0;

            if (reason === 'cleared') {
                const rescueFactor = Math.pow(RESCUE_CLEAR_BONUS_MULTIPLIER, rescueCount);
                clearBonus = Math.max(0, Math.round(remainingTime * CLEAR_BONUS_PER_SECOND * rescueFactor));
                score += clearBonus;
                remainingBlocks = 0;
                updateHUD();
            }

            services?.highscores?.saveHighscore?.('block-buster', score);

            let title = 'Zeit abgelaufen';
            let sub = `${currentDifficulty.label} · Du hast ${remainingBlocks} Blöcke übrig gelassen.`;

            if (reason === 'cleared') {
                title = 'PERFECT CLEAR!';
                const rescueInfo = rescueCount > 0
                    ? ` · ${rescueCount} Rewire${rescueCount === 1 ? '' : 's'}`
                    : '';
                sub = `${currentDifficulty.label} · Alle Blöcke entfernt · Zeitbonus +${clearBonus.toLocaleString('de-DE')} Punkte${rescueInfo}`;
            } else if (reason === 'stuck') {
                title = 'Keine Züge mehr';
                sub = 'Auf dieser Karte existieren keine gültigen Matches mehr.';
            }

            endTitleEl.textContent = title;
            endTitleEl.classList.toggle('perfect', clearPercent >= 100);
            endSubEl.textContent = sub;
            endScoreEl.textContent = `${score.toLocaleString('de-DE')} Punkte`;
            endAccuracyEl.textContent = `${accuracy.toLocaleString('de-DE', { maximumFractionDigits: 1 })}%`;
            endComboEl.textContent = biggestCombo.toLocaleString('de-DE');
            endClearEl.textContent = `${clearPercent.toLocaleString('de-DE', { maximumFractionDigits: 1 })}%`;
            endClearEl.classList.toggle('perfect', clearPercent >= 100);
            endEl.classList.add('visible');
        };

        const startRound = (presetKey = selectedPresetKey) => {
            stopTimer();
            stopMenuDemo();

            selectedPresetKey = presetKey;
            currentPreset = BOARD_PRESETS[presetKey];
            currentDifficulty = DIFFICULTY_PRESETS[selectedDifficultyKey];
            board = generatePlayableBoard(currentPreset);
            score = 0;
            roundDuration = Math.round(currentPreset.seconds * currentDifficulty.timeMultiplier);
            remainingTime = roundDuration;
            remainingBlocks = countBlocks();
            initialBlockCount = remainingBlocks;
            successfulClicks = 0;
            failedClicks = 0;
            comboCount = 0;
            biggestCombo = 0;
            comboTimeLeft = 0;
            hotStreak = 0;
            rescueCount = 0;
            rescueInProgress = false;
            gameRunning = true;

            menuEl.style.display = 'none';
            playEl.classList.add('visible');
            endEl.classList.remove('visible');

            renderBoard();
            updateHUD();
            requestAnimationFrame(fitBoard);

            lastTimerFrame = performance.now();
            timerAnimationId = requestAnimationFrame(timerLoop);
        };

        const returnToMenu = () => {
            stopTimer();
            gameRunning = false;
            endEl.classList.remove('visible');
            playEl.classList.remove('visible');
            boardAreaEl.classList.remove('combo-tier-2', 'combo-tier-3', 'combo-tier-4', 'combo-hit');
            menuEl.style.display = 'flex';
            demoScenarioIndex = 0;
            startMenuDemo();
        };

        // ============================================================
        // CLICK HANDLING
        // ============================================================

        const handleCellClick = cellIndex => {
            if (!gameRunning || rescueInProgress || board[cellIndex] !== null) {
                return;
            }

            const result = evaluateMove(
                cellIndex,
                board,
                currentPreset.rows,
                currentPreset.cols
            );

            if (!result.valid) {
                registerFailedClick();
                remainingTime = Math.max(0, remainingTime - currentDifficulty.mistakePenalty);
                wrongFeedback(cellIndex);
                updateHUD();

                if (remainingTime <= 0) {
                    endGame('time');
                }
                return;
            }

            const { multiplier, streakReward } = registerSuccessfulClick();
            const multiMatchBonus = Math.max(0, result.groups.length - 1) * MULTI_MATCH_BONUS_PER_EXTRA_GROUP;
            const scoreBeforeCombo = result.score + multiMatchBonus;
            const gainedScore = Math.round(scoreBeforeCombo * multiplier);
            const matchPower = Math.max(...result.groups.map(group => group.indices.length));
            const isMultiMatch = result.groups.length > 1;

            result.removeIndices.forEach(removeIndex => {
                board[removeIndex] = null;
                visuallyRemoveCell(removeIndex, matchPower);
            });

            score += gainedScore;
            remainingBlocks -= result.removeIndices.length;

            triggerMatchFeedback(matchPower, isMultiMatch);
            triggerComboFieldFeedback();

            const popupParts = [`+${gainedScore.toLocaleString('de-DE')}`];
            if (multiMatchBonus > 0) popupParts.push(`Multi +${multiMatchBonus}`);
            if (multiplier > 1) popupParts.push(`${multiplier.toLocaleString('de-DE', { maximumFractionDigits: 1 })}× Combo`);
            if (streakReward) popupParts.push(`Hot Streak +${HOT_STREAK_TIME_BONUS}s`);

            const popupClass = isMultiMatch
                ? 'multi'
                : matchPower >= 4
                    ? 'match-4'
                    : matchPower >= 3
                        ? 'match-3'
                        : '';

            showPopup(popupParts.join(' · '), 'good', cellIndex, popupClass);
            updateHUD();

            if (remainingBlocks <= 0) {
                remainingBlocks = 0;
                updateHUD();
                setTimeout(() => !destroyed && endGame('cleared'), 180);
                return;
            }

            const movesLeft = findValidMoves(
                board,
                currentPreset.rows,
                currentPreset.cols
            );

            if (movesLeft.length === 0) {
                setTimeout(() => {
                    if (!destroyed && gameRunning) rescueStuckBoard();
                }, 180);
            }
        };

        // ============================================================
        // EVENTS
        // ============================================================

        sizeButtons.forEach(button => {
            button.addEventListener('click', () => {
                selectedPresetKey = button.dataset.size;

                sizeButtons.forEach(other =>
                    other.classList.toggle('selected', other === button)
                );
            });
        });

        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                selectedDifficultyKey = button.dataset.difficulty;
                currentDifficulty = DIFFICULTY_PRESETS[selectedDifficultyKey];

                difficultyButtons.forEach(other =>
                    other.classList.toggle('selected', other === button)
                );
            });
        });

        colorBlindToggleEl.addEventListener('change', () => {
            colorBlindMode = colorBlindToggleEl.checked;
            applyColorBlindMode();
        });

        patternBtn.addEventListener('click', () => {
            colorBlindMode = !colorBlindMode;
            applyColorBlindMode();
        });

        startBtn.addEventListener('click', () => startRound(selectedPresetKey));
        newMapBtn.addEventListener('click', returnToMenu);
        endMenuBtn.addEventListener('click', returnToMenu);
        endRetryBtn.addEventListener('click', () => startRound(selectedPresetKey));

        boardEl.addEventListener('click', event => {
            const cell = event.target.closest('.bb-cell');
            if (!cell || !boardEl.contains(cell)) return;

            handleCellClick(Number(cell.dataset.index));
        });

        resizeObserver = new ResizeObserver(fitBoard);
        resizeObserver.observe(boardAreaEl);
        applyColorBlindMode();
        startMenuDemo();

        return {
            destroy: () => {
                destroyed = true;
                gameRunning = false;
                rescueInProgress = false;
                stopTimer();
                stopMenuDemo();
                resizeObserver?.disconnect();
                style.remove();
            }
        };
    }
};

export {
    BOARD_PRESETS,
    SCORE_BY_MATCH_COUNT,
    TILE_COLORS,
    DIFFICULTY_PRESETS,
    GENERATOR_CANDIDATES,
    GENERATOR_TARGET_MOVE_RATIO,
    RESCUE_BASE_PENALTY,
    RESCUE_SCORE_PERCENT,
    RESCUE_CLEAR_BONUS_MULTIPLIER
};
