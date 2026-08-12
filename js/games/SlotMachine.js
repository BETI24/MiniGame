// =============================================================================
//  SLOT MACHINE – Nexus Game Hub Module
//  5 Walzen × 3 Reihen | CSS-Strip-Roll | Gestaffelte Gewinn-Effekte | WebAudio
// =============================================================================

export default {
    manifest: {
        id: 'slot_machine',
        name: 'Nexus Slots',
        description: 'Klassischer 5-Walzen Slot mit epischen Gewinnen.',
        icon: '🎰',
        tags: ['Casino', 'Glück', 'Slots']
    },

    init: (container, services) => {

        // ─────────────────────────────────────────────────────────────────────
        //  AUDIO ENGINE (Web Audio API – keine externen Dateien nötig)
        // ─────────────────────────────────────────────────────────────────────
        let audioCtx = null;
        const getAudioCtx = () => {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            return audioCtx;
        };

        const playTone = (freq, type, duration, gain = 0.3, delay = 0) => {
            try {
                const ctx = getAudioCtx();
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);
                osc.type = type;
                osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
                gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
                gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
                osc.start(ctx.currentTime + delay);
                osc.stop(ctx.currentTime + delay + duration + 0.05);
            } catch (e) { /* silent fail */ }
        };

        const playNoise = (duration, gainVal = 0.1, delay = 0) => {
            try {
                const ctx = getAudioCtx();
                const bufSize = ctx.sampleRate * duration;
                const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
                const src = ctx.createBufferSource();
                src.buffer = buf;
                const gainNode = ctx.createGain();
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 800;
                filter.Q.value = 0.5;
                src.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(ctx.destination);
                gainNode.gain.setValueAtTime(gainVal, ctx.currentTime + delay);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
                src.start(ctx.currentTime + delay);
            } catch (e) { /* silent fail */ }
        };

        const sfx = {
            rollStart: () => playNoise(0.08, 0.15),
            rolling: () => { /* continuous noise handled per-spin */ },
            reel_stop: (idx) => {
                playTone(180 + idx * 30, 'square', 0.06, 0.4);
                playNoise(0.04, 0.25);
            },
            win_small: () => {
                playTone(523, 'sine', 0.15, 0.3);
                playTone(659, 'sine', 0.15, 0.3, 0.15);
                playTone(784, 'sine', 0.2, 0.3, 0.30);
            },
            win_big: () => {
                [523, 659, 784, 880, 1047].forEach((f, i) => playTone(f, 'sine', 0.2, 0.35, i * 0.1));
            },
            win_epic: () => {
                const fanfare = [523, 659, 784, 1047, 784, 880, 1047, 1319];
                fanfare.forEach((f, i) => playTone(f, 'sawtooth', 0.25, 0.4, i * 0.12));
                setTimeout(() => {
                    [262, 330, 392, 523].forEach((f, i) => playTone(f, 'sine', 0.5, 0.5, i * 0.15));
                }, 800);
            },
            coin: () => {
                playTone(1200, 'square', 0.05, 0.2);
                playTone(1600, 'square', 0.04, 0.15, 0.05);
            }
        };

        // ─────────────────────────────────────────────────────────────────────
        //  SYMBOL-DEFINITIONEN
        // ─────────────────────────────────────────────────────────────────────
        const SYMBOLS = [
            { id: 'seven',    emoji: '7️⃣',  label: 'Seven',   weight: 2,  mult: [0, 0, 50, 100, 500]  },
            { id: 'diamond',  emoji: '💎',  label: 'Diamond', weight: 4,  mult: [0, 0, 20,  50, 200]  },
            { id: 'crown',    emoji: '👑',  label: 'Crown',   weight: 5,  mult: [0, 0, 15,  30, 100]  },
            { id: 'star',     emoji: '⭐',  label: 'Star',    weight: 8,  mult: [0, 0, 10,  20,  50]  },
            { id: 'bell',     emoji: '🔔',  label: 'Bell',    weight: 10, mult: [0, 0,  5,  10,  25]  },
            { id: 'cherry',   emoji: '🍒',  label: 'Cherry',  weight: 12, mult: [0, 2,  4,   8,  15]  },
            { id: 'lemon',    emoji: '🍋',  label: 'Lemon',   weight: 14, mult: [0, 0,  3,   5,  10]  },
            { id: 'grape',    emoji: '🍇',  label: 'Grape',   weight: 16, mult: [0, 0,  2,   4,   8]  },
        ];

        // Gewichtete Auswahl
        const totalWeight = SYMBOLS.reduce((s, sym) => s + sym.weight, 0);
        const weightedPool = [];
        for (const sym of SYMBOLS) {
            for (let i = 0; i < sym.weight; i++) weightedPool.push(sym.id);
        }

        const getRandSymbol = () => {
            const id = weightedPool[Math.floor(Math.random() * weightedPool.length)];
            return SYMBOLS.find(s => s.id === id);
        };

        // Erzeuge ein langes Symbol-Strip für eine Walze (genug für Animation)
        const buildStrip = (finalRow) => {
            // finalRow: Array[3] der endgültigen Symbole (top, mid, bot)
            const strip = [];
            for (let i = 0; i < 30; i++) strip.push(getRandSymbol()); // Puffer oben
            strip.push(finalRow[0], finalRow[1], finalRow[2]);         // Ziel-Symbole am Ende
            return strip;
        };

        // ─────────────────────────────────────────────────────────────────────
        //  GEWINN-BERECHNUNG (5 Walzen × 3 Reihen → 5 Gewinnlinien)
        // ─────────────────────────────────────────────────────────────────────
        const PAYLINES = [
            [1, 1, 1, 1, 1],  // Mittlere Reihe (row idx 1)
            [0, 0, 0, 0, 0],  // Obere Reihe
            [2, 2, 2, 2, 2],  // Untere Reihe
            [0, 1, 2, 1, 0],  // V-Form
            [2, 1, 0, 1, 2],  // Umgekehrtes V
        ];

        const calcWin = (grid, bet) => {
            // grid[reel][row] → symbol
            let totalWin = 0;
            const winningLines = [];

            for (let li = 0; li < PAYLINES.length; li++) {
                const line = PAYLINES[li];
                const firstSym = grid[0][line[0]];
                let count = 1;
                for (let r = 1; r < 5; r++) {
                    if (grid[r][line[r]].id === firstSym.id) count++;
                    else break;
                }
                const mult = firstSym.mult[count];
                if (mult > 0) {
                    const lineWin = bet * mult;
                    totalWin += lineWin;
                    winningLines.push({ lineIdx: li, count, sym: firstSym, win: lineWin });
                }
            }
            return { totalWin, winningLines };
        };

        // ─────────────────────────────────────────────────────────────────────
        //  STATE
        // ─────────────────────────────────────────────────────────────────────
        const REEL_COUNT = 5;
        const ROW_COUNT  = 3;
        const SYM_H      = 100; // px pro Symbol (CSS)

        let balance     = services.highscores.getHighscore('slot_machine') || 1000;
        let bet         = 10;
        const MIN_BET   = 1;
        const MAX_BET   = 500;
        const BET_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500];

        let spinning    = false;
        let grid        = []; // grid[reel][row] → symbol
        let rollIntervals = [];

        // Initialisiere zufälliges Start-Grid
        for (let r = 0; r < REEL_COUNT; r++) {
            grid[r] = [getRandSymbol(), getRandSymbol(), getRandSymbol()];
        }

        // ─────────────────────────────────────────────────────────────────────
        //  CSS – injiziert in <head>
        // ─────────────────────────────────────────────────────────────────────
        const STYLE_ID = 'slot-machine-styles';
        if (!document.getElementById(STYLE_ID)) {
            const style = document.createElement('style');
            style.id = STYLE_ID;
            style.textContent = `
/* ── Slot Machine Wrapper ─────────────────────────────────────── */
.sm-root {
    width: 100%;
    height: 100%;
    min-height: 580px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #0a0a0f;
    background-image:
        radial-gradient(ellipse at 20% 10%, rgba(180,120,0,0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 90%, rgba(180,120,0,0.08) 0%, transparent 50%);
    font-family: 'Georgia', serif;
    color: #f5e6c0;
    position: relative;
    overflow: hidden;
    user-select: none;
}

/* ── Cabinet / Frame ──────────────────────────────────────────── */
.sm-cabinet {
    background: linear-gradient(180deg, #1a1408 0%, #0f0c05 100%);
    border: 2px solid #8a6800;
    border-radius: 24px;
    padding: 24px 28px 20px;
    box-shadow:
        0 0 0 1px rgba(255,200,50,0.15),
        0 0 40px rgba(180,140,0,0.25),
        inset 0 1px 0 rgba(255,230,100,0.1),
        0 20px 80px rgba(0,0,0,0.8);
    width: min(95vw, 700px);
    position: relative;
}

/* ── Cabinet top shine ─────────────────────────────────────────── */
.sm-cabinet::before {
    content: '';
    position: absolute;
    top: 0; left: 10%; right: 10%;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255,220,60,0.6), transparent);
    border-radius: 50%;
}

/* ── Title Banner ─────────────────────────────────────────────── */
.sm-title {
    text-align: center;
    font-size: clamp(1.2rem, 3vw, 1.8rem);
    font-weight: bold;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    margin-bottom: 16px;
    color: #ffd700;
    text-shadow: 0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,165,0,0.3);
}

/* ── Reels Frame ──────────────────────────────────────────────── */
.sm-reels-frame {
    background: #050505;
    border: 2px solid #5a4200;
    border-radius: 12px;
    padding: 4px;
    box-shadow:
        inset 0 0 40px rgba(0,0,0,0.9),
        inset 0 0 8px rgba(255,200,0,0.05);
    position: relative;
    overflow: hidden;
}

/* Payline indicator lines */
.sm-reels-frame::before,
.sm-reels-frame::after {
    content: '';
    position: absolute;
    left: 0; right: 0;
    height: 2px;
    pointer-events: none;
    z-index: 10;
}
.sm-reels-frame::before { top: calc(33.333% + 2px); background: rgba(255,215,0,0.15); }
.sm-reels-frame::after  { bottom: calc(33.333% + 2px); background: rgba(255,215,0,0.08); }

/* ── Reels Container ──────────────────────────────────────────── */
.sm-reels {
    display: flex;
    gap: 4px;
}

/* ── Single Reel ──────────────────────────────────────────────── */
.sm-reel {
    flex: 1;
    height: 300px;
    overflow: hidden;
    border-radius: 6px;
    position: relative;
    background: #0c0c0c;
}

/* Top & bottom gradient fade for reel depth */
.sm-reel::before,
.sm-reel::after {
    content: '';
    position: absolute;
    left: 0; right: 0;
    height: 60px;
    pointer-events: none;
    z-index: 5;
}
.sm-reel::before { top: 0;    background: linear-gradient(to bottom, rgba(5,5,5,0.95), transparent); }
.sm-reel::after  { bottom: 0; background: linear-gradient(to top,   rgba(5,5,5,0.95), transparent); }

/* ── Symbol Strip ─────────────────────────────────────────────── */
.sm-strip {
    display: flex;
    flex-direction: column;
    will-change: transform;
}

/* ── Individual Symbol Cell ───────────────────────────────────── */
.sm-symbol {
    width: 100%;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(2rem, 4vw, 2.8rem);
    border-bottom: 1px solid rgba(255,255,255,0.04);
    position: relative;
    transition: filter 0.2s;
}

/* Separator line between rows (middle payline highlight) */
.sm-reel-separator {
    position: absolute;
    left: 0; right: 0;
    height: 1px;
    background: rgba(255,200,0,0.2);
    pointer-events: none;
    z-index: 6;
}
.sm-sep-top    { top: 100px; }
.sm-sep-bottom { top: 200px; }

/* ── Win Highlight on symbol cells ───────────────────────────── */
.sm-symbol.win-glow {
    animation: symWinPulse 0.8s ease-in-out infinite alternate;
}
@keyframes symWinPulse {
    from { filter: brightness(1) drop-shadow(0 0 4px rgba(255,215,0,0.4)); }
    to   { filter: brightness(1.4) drop-shadow(0 0 18px rgba(255,215,0,0.9)); }
}

/* ── Center Payline Highlight Bar ─────────────────────────────── */
.sm-payline-bar {
    position: absolute;
    left: 4px; right: 4px;
    top: 104px;
    height: 96px;
    pointer-events: none;
    z-index: 3;
    border-radius: 4px;
    background: linear-gradient(90deg,
        rgba(255,215,0,0.0),
        rgba(255,215,0,0.04),
        rgba(255,215,0,0.0));
    border-top: 1px solid rgba(255,215,0,0.3);
    border-bottom: 1px solid rgba(255,215,0,0.3);
}

/* ── Info Bar ─────────────────────────────────────────────────── */
.sm-info-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
    gap: 8px;
}
.sm-stat-block {
    background: rgba(255,200,50,0.06);
    border: 1px solid rgba(255,200,50,0.15);
    border-radius: 10px;
    padding: 8px 16px;
    text-align: center;
    flex: 1;
}
.sm-stat-label {
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #8a7040;
    margin-bottom: 2px;
}
.sm-stat-value {
    font-size: clamp(0.9rem, 2.5vw, 1.2rem);
    font-weight: bold;
    color: #ffd700;
    text-shadow: 0 0 10px rgba(255,215,0,0.4);
    transition: all 0.3s;
}
.sm-stat-value.win-flash {
    color: #fff;
    text-shadow: 0 0 20px rgba(255,215,0,1);
}

/* ── Controls ─────────────────────────────────────────────────── */
.sm-controls {
    margin-top: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
}

/* Bet controls */
.sm-bet-controls {
    display: flex;
    align-items: center;
    gap: 6px;
}

/* Generic button base */
.sm-btn {
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: inherit;
    font-weight: bold;
    letter-spacing: 0.05em;
    transition: all 0.15s ease;
    position: relative;
    overflow: hidden;
}
.sm-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0);
    transition: background 0.15s;
}
.sm-btn:hover:not(:disabled)::after { background: rgba(255,255,255,0.08); }
.sm-btn:active:not(:disabled) { transform: translateY(1px) scale(0.98); }
.sm-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* Bet amount buttons */
.sm-btn-sm {
    background: rgba(255,200,50,0.1);
    border: 1px solid rgba(255,200,50,0.25);
    color: #ffd700;
    padding: 8px 12px;
    font-size: 0.8rem;
}
.sm-btn-sm:hover:not(:disabled) { background: rgba(255,200,50,0.2); border-color: rgba(255,200,50,0.5); }

/* Bet display */
.sm-bet-display {
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(255,200,50,0.2);
    border-radius: 8px;
    padding: 8px 18px;
    font-size: 1rem;
    color: #ffd700;
    text-align: center;
    min-width: 70px;
}

/* SPIN button */
.sm-btn-spin {
    background: linear-gradient(135deg, #b8860b 0%, #ffd700 50%, #b8860b 100%);
    color: #0a0a00;
    padding: 14px 40px;
    font-size: clamp(0.9rem, 2.5vw, 1.1rem);
    border-radius: 50px;
    box-shadow:
        0 4px 20px rgba(255,215,0,0.35),
        inset 0 1px 0 rgba(255,255,255,0.25),
        inset 0 -2px 0 rgba(0,0,0,0.2);
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    letter-spacing: 0.1em;
    font-size: 1rem;
    font-weight: 900;
    flex-shrink: 0;
}
.sm-btn-spin:hover:not(:disabled) {
    box-shadow:
        0 6px 30px rgba(255,215,0,0.55),
        inset 0 1px 0 rgba(255,255,255,0.3),
        inset 0 -2px 0 rgba(0,0,0,0.2);
    transform: translateY(-1px);
}
.sm-btn-spin.spinning-state {
    background: linear-gradient(135deg, #444 0%, #666 50%, #444 100%);
    box-shadow: none;
    color: #999;
}

/* ── Win Message ──────────────────────────────────────────────── */
.sm-win-msg {
    min-height: 28px;
    text-align: center;
    font-size: 0.85rem;
    letter-spacing: 0.08em;
    margin-top: 8px;
    color: #8a7040;
    transition: all 0.3s;
}
.sm-win-msg.active {
    color: #ffd700;
    text-shadow: 0 0 12px rgba(255,215,0,0.5);
}

/* ── Particles Layer ──────────────────────────────────────────── */
.sm-particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 20;
}
.sm-particle {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
}

/* ── BIG WIN Overlay ──────────────────────────────────────────── */
.sm-bigwin-overlay {
    position: absolute;
    inset: 0;
    z-index: 30;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    border-radius: 24px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
}
.sm-bigwin-overlay.visible {
    opacity: 1;
    pointer-events: all;
}
.sm-bigwin-banner {
    font-size: clamp(1.8rem, 6vw, 3.5rem);
    font-weight: 900;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #ffd700;
    text-shadow:
        0 0 20px rgba(255,215,0,0.9),
        0 0 60px rgba(255,165,0,0.6),
        0 4px 8px rgba(0,0,0,0.8);
    animation: bigWinPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes bigWinPop {
    from { transform: scale(0.3) rotate(-5deg); opacity: 0; }
    to   { transform: scale(1) rotate(0deg); opacity: 1; }
}
.sm-bigwin-amount {
    font-size: clamp(1.5rem, 5vw, 2.8rem);
    font-weight: bold;
    color: #fff;
    text-shadow: 0 0 30px rgba(255,215,0,0.8);
    margin-top: 8px;
}
.sm-bigwin-tap {
    margin-top: 20px;
    font-size: 0.75rem;
    color: rgba(255,215,0,0.5);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    animation: tapBlink 1.2s ease-in-out infinite;
}
@keyframes tapBlink {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 1; }
}

/* ── Screen Shake ─────────────────────────────────────────────── */
@keyframes screenShake {
    0%   { transform: translate(0, 0) rotate(0deg); }
    10%  { transform: translate(-4px, -3px) rotate(-0.4deg); }
    20%  { transform: translate(4px, 3px) rotate(0.4deg); }
    30%  { transform: translate(-5px, 2px) rotate(-0.3deg); }
    40%  { transform: translate(5px, -2px) rotate(0.3deg); }
    50%  { transform: translate(-3px, 3px) rotate(-0.2deg); }
    60%  { transform: translate(3px, -3px) rotate(0.2deg); }
    70%  { transform: translate(-2px, 2px) rotate(-0.1deg); }
    80%  { transform: translate(2px, -2px) rotate(0.1deg); }
    90%  { transform: translate(-1px, 1px) rotate(0deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
}
.sm-shake {
    animation: screenShake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

/* ── Coin Particle ────────────────────────────────────────────── */
@keyframes coinFly {
    0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
    100% { transform: translateY(-200px) rotate(720deg) scale(0.3); opacity: 0; }
}

/* ── Confetti ─────────────────────────────────────────────────── */
@keyframes confettiFall {
    0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(350px) rotate(600deg); opacity: 0; }
}

/* ── Balance change animation ─────────────────────────────────── */
@keyframes balancePop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.3); color: #fff; }
    100% { transform: scale(1); }
}
.sm-balance-pop { animation: balancePop 0.4s ease; }

/* ── Reel motion blur during spin ────────────────────────────── */
.sm-reel.spinning .sm-strip {
    filter: blur(2px);
}
.sm-reel.stopping .sm-strip {
    filter: blur(0.5px);
    transition: filter 0.2s;
}
            `;
            document.head.appendChild(style);
        }

        // ─────────────────────────────────────────────────────────────────────
        //  DOM-STRUKTUR
        // ─────────────────────────────────────────────────────────────────────
        const root = document.createElement('div');
        root.className = 'sm-root';
        container.appendChild(root);

        // Particles layer (behind cabinet)
        const particlesLayer = document.createElement('div');
        particlesLayer.className = 'sm-particles';
        root.appendChild(particlesLayer);

        // Cabinet
        const cabinet = document.createElement('div');
        cabinet.className = 'sm-cabinet';
        root.appendChild(cabinet);

        // Title
        const title = document.createElement('div');
        title.className = 'sm-title';
        title.innerHTML = '🎰 &nbsp; NEXUS SLOTS &nbsp; 🎰';
        cabinet.appendChild(title);

        // Reels Frame
        const reelsFrame = document.createElement('div');
        reelsFrame.className = 'sm-reels-frame';
        cabinet.appendChild(reelsFrame);

        // Payline bar
        const paylineBar = document.createElement('div');
        paylineBar.className = 'sm-payline-bar';
        reelsFrame.appendChild(paylineBar);

        // Reels container
        const reelsContainer = document.createElement('div');
        reelsContainer.className = 'sm-reels';
        reelsFrame.appendChild(reelsContainer);

        // Build reel DOM elements
        const reelEls = [];
        const stripEls = [];
        for (let r = 0; r < REEL_COUNT; r++) {
            const reel = document.createElement('div');
            reel.className = 'sm-reel';
            reel.id = `sm-reel-${r}`;

            // Separator lines
            const sepTop = document.createElement('div');
            sepTop.className = 'sm-reel-separator sm-sep-top';
            const sepBot = document.createElement('div');
            sepBot.className = 'sm-reel-separator sm-sep-bottom';
            reel.appendChild(sepTop);
            reel.appendChild(sepBot);

            const strip = document.createElement('div');
            strip.className = 'sm-strip';
            strip.id = `sm-strip-${r}`;
            reel.appendChild(strip);

            reelsContainer.appendChild(reel);
            reelEls.push(reel);
            stripEls.push(strip);
        }

        // Info bar
        const infoBar = document.createElement('div');
        infoBar.className = 'sm-info-bar';
        cabinet.appendChild(infoBar);

        const makeStatBlock = (label, valId) => {
            const block = document.createElement('div');
            block.className = 'sm-stat-block';
            const lbl = document.createElement('div');
            lbl.className = 'sm-stat-label';
            lbl.textContent = label;
            const val = document.createElement('div');
            val.className = 'sm-stat-value';
            val.id = valId;
            val.textContent = '—';
            block.appendChild(lbl);
            block.appendChild(val);
            return block;
        };

        const balanceBlock = makeStatBlock('Guthaben', 'sm-balance');
        const betBlock     = makeStatBlock('Einsatz',  'sm-bet-val');
        const winBlock     = makeStatBlock('Gewinn',   'sm-last-win');

        infoBar.appendChild(balanceBlock);
        infoBar.appendChild(betBlock);
        infoBar.appendChild(winBlock);

        // Controls
        const controls = document.createElement('div');
        controls.className = 'sm-controls';
        cabinet.appendChild(controls);

        // Bet controls
        const betControls = document.createElement('div');
        betControls.className = 'sm-bet-controls';

        const btnBetMin = document.createElement('button');
        btnBetMin.className = 'sm-btn sm-btn-sm';
        btnBetMin.id = 'sm-btn-bet-min';
        btnBetMin.textContent = 'MIN';

        const btnBetDown = document.createElement('button');
        btnBetDown.className = 'sm-btn sm-btn-sm';
        btnBetDown.id = 'sm-btn-bet-down';
        btnBetDown.textContent = '−';

        const betDisplay = document.createElement('div');
        betDisplay.className = 'sm-bet-display';
        betDisplay.id = 'sm-bet-display';

        const btnBetUp = document.createElement('button');
        btnBetUp.className = 'sm-btn sm-btn-sm';
        btnBetUp.id = 'sm-btn-bet-up';
        btnBetUp.textContent = '+';

        const btnBetMax = document.createElement('button');
        btnBetMax.className = 'sm-btn sm-btn-sm';
        btnBetMax.id = 'sm-btn-bet-max';
        btnBetMax.textContent = 'MAX';

        betControls.append(btnBetMin, btnBetDown, betDisplay, btnBetUp, btnBetMax);

        // Spin button
        const btnSpin = document.createElement('button');
        btnSpin.className = 'sm-btn sm-btn-spin';
        btnSpin.id = 'sm-btn-spin';
        btnSpin.textContent = 'SPIN';

        controls.appendChild(betControls);
        controls.appendChild(btnSpin);

        // Win message
        const winMsg = document.createElement('div');
        winMsg.className = 'sm-win-msg';
        winMsg.id = 'sm-win-msg';
        cabinet.appendChild(winMsg);

        // Big Win Overlay
        const bigwinOverlay = document.createElement('div');
        bigwinOverlay.className = 'sm-bigwin-overlay';
        bigwinOverlay.id = 'sm-bigwin-overlay';
        bigwinOverlay.innerHTML = `
            <div class="sm-bigwin-banner" id="sm-bigwin-banner">BIG WIN!</div>
            <div class="sm-bigwin-amount" id="sm-bigwin-amount"></div>
            <div class="sm-bigwin-tap">Tippen zum Fortfahren</div>
        `;
        cabinet.appendChild(bigwinOverlay);
        bigwinOverlay.addEventListener('click', dismissBigWin);

        // ─────────────────────────────────────────────────────────────────────
        //  UI HELPERS
        // ─────────────────────────────────────────────────────────────────────
        const $ = (id) => document.getElementById(id);

        const updateUI = () => {
            $('sm-balance').textContent  = `€ ${balance.toFixed(0)}`;
            $('sm-bet-val').textContent  = `€ ${bet}`;
            betDisplay.textContent       = `€ ${bet}`;
        };

        const setWinMsg = (text, isActive = false) => {
            winMsg.textContent = text;
            winMsg.classList.toggle('active', isActive);
        };

        const setLastWin = (amount) => {
            $('sm-last-win').textContent = amount > 0 ? `€ ${amount.toFixed(0)}` : '—';
        };

        const lockControls = (locked) => {
            spinning = locked;
            btnSpin.disabled       = locked;
            btnBetMin.disabled     = locked;
            btnBetDown.disabled    = locked;
            btnBetUp.disabled      = locked;
            btnBetMax.disabled     = locked;
            btnSpin.classList.toggle('spinning-state', locked);
        };

        // ─────────────────────────────────────────────────────────────────────
        //  REEL RENDERING
        // ─────────────────────────────────────────────────────────────────────
        // Renders current grid (static display)
        const renderStaticReels = () => {
            for (let r = 0; r < REEL_COUNT; r++) {
                const strip = stripEls[r];
                strip.innerHTML = '';
                strip.style.transition = 'none';
                strip.style.transform  = 'translateY(0)';
                for (let row = 0; row < ROW_COUNT; row++) {
                    const cell = document.createElement('div');
                    cell.className = 'sm-symbol';
                    cell.dataset.reel = r;
                    cell.dataset.row  = row;
                    cell.textContent = grid[r][row].emoji;
                    strip.appendChild(cell);
                }
            }
        };

        renderStaticReels();
        updateUI();
        setLastWin(0);

        // ─────────────────────────────────────────────────────────────────────
        //  SPIN ANIMATION
        // ─────────────────────────────────────────────────────────────────────
        const spinReel = (reelIdx, finalSymbols, delay) => {
            return new Promise(resolve => {
                const reel  = reelEls[reelIdx];
                const strip = stripEls[reelIdx];

                // Build the full symbol strip
                const stripData = buildStrip(finalSymbols);
                const totalSymbols = stripData.length;

                // Populate strip DOM (all symbols)
                strip.innerHTML = '';
                strip.style.transition = 'none';
                // Start position: top of strip
                const startOffset = 0;
                strip.style.transform = `translateY(${startOffset}px)`;

                for (const sym of stripData) {
                    const cell = document.createElement('div');
                    cell.className = 'sm-symbol';
                    cell.textContent = sym.emoji;
                    strip.appendChild(cell);
                }

                // Target offset: show last 3 symbols (index totalSymbols-3, -2, -1)
                const targetOffset = -((totalSymbols - ROW_COUNT) * SYM_H);

                setTimeout(() => {
                    reel.classList.add('spinning');
                    sfx.rollStart();

                    // Phase 1: Fast spin (overshoot)
                    const overshotOffset = targetOffset - 30; // 30px bounce
                    const spinDuration   = 1800 + reelIdx * 320; // stagger

                    // Use CSS transition for smooth spin
                    strip.style.transition = `transform ${spinDuration}ms cubic-bezier(0.15, 0, 0.25, 1)`;
                    strip.style.transform  = `translateY(${overshotOffset}px)`;

                    setTimeout(() => {
                        // Phase 2: Bounce back to exact position
                        reel.classList.remove('spinning');
                        reel.classList.add('stopping');
                        strip.style.transition = 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)';
                        strip.style.transform  = `translateY(${targetOffset}px)`;

                        sfx.reel_stop(reelIdx);

                        setTimeout(() => {
                            reel.classList.remove('stopping');
                            // Update grid from final symbols
                            grid[reelIdx] = finalSymbols;
                            // Replace strip with clean 3-symbol display
                            strip.style.transition = 'none';
                            strip.innerHTML = '';
                            strip.style.transform = 'translateY(0)';
                            for (let row = 0; row < ROW_COUNT; row++) {
                                const cell = document.createElement('div');
                                cell.className = 'sm-symbol';
                                cell.dataset.reel = reelIdx;
                                cell.dataset.row  = row;
                                cell.textContent = finalSymbols[row].emoji;
                                strip.appendChild(cell);
                            }
                            resolve();
                        }, 220);
                    }, spinDuration + 20);
                }, delay);
            });
        };

        // ─────────────────────────────────────────────────────────────────────
        //  PARTICLES & EFFECTS
        // ─────────────────────────────────────────────────────────────────────
        const spawnCoins = (count) => {
            const colors = ['#FFD700', '#FFA500', '#FFEC8B', '#DAA520'];
            const cabinet_rect = cabinet.getBoundingClientRect();
            const particles_rect = particlesLayer.getBoundingClientRect();
            const offsetX = cabinet_rect.left - particles_rect.left + cabinet_rect.width / 2;
            const offsetY = cabinet_rect.top  - particles_rect.top  + cabinet_rect.height * 0.5;

            for (let i = 0; i < count; i++) {
                const p = document.createElement('div');
                p.className = 'sm-particle';
                const size = 8 + Math.random() * 12;
                const angle = (Math.random() - 0.5) * 160;
                const dist  = 80 + Math.random() * 200;
                const dur   = 600 + Math.random() * 800;
                const color = colors[Math.floor(Math.random() * colors.length)];

                p.style.cssText = `
                    width: ${size}px; height: ${size}px;
                    background: ${color};
                    left: ${offsetX + (Math.random() - 0.5) * 100}px;
                    top: ${offsetY}px;
                    box-shadow: 0 0 ${size}px ${color};
                `;
                particlesLayer.appendChild(p);

                const radians = (angle * Math.PI) / 180;
                p.animate([
                    { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
                    { transform: `translate(${Math.sin(radians)*dist}px, ${-Math.abs(Math.cos(radians)*dist*0.8)}px) rotate(${360 + Math.random()*360}deg) scale(0.2)`, opacity: 0 }
                ], { duration: dur, delay: Math.random() * 300, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' })
                    .onfinish = () => p.remove();

                setTimeout(() => sfx.coin(), Math.random() * 400);
            }
        };

        const spawnConfetti = (count) => {
            const confettiColors = ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8'];
            const cabinet_rect = cabinet.getBoundingClientRect();
            const particles_rect = particlesLayer.getBoundingClientRect();

            for (let i = 0; i < count; i++) {
                const p = document.createElement('div');
                const size = 6 + Math.random() * 10;
                const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
                const startX = cabinet_rect.left - particles_rect.left + Math.random() * cabinet_rect.width;
                const startY = cabinet_rect.top  - particles_rect.top  + Math.random() * 50;
                const dur = 1200 + Math.random() * 1500;
                const driftX = (Math.random() - 0.5) * 200;

                p.style.cssText = `
                    position: absolute;
                    width: ${size}px; height: ${size * 0.5}px;
                    background: ${color};
                    border-radius: 2px;
                    left: ${startX}px; top: ${startY}px;
                `;
                particlesLayer.appendChild(p);

                p.animate([
                    { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
                    { transform: `translate(${driftX}px, ${300 + Math.random()*200}px) rotate(${Math.random()*720}deg)`, opacity: 0 }
                ], { duration: dur, delay: Math.random() * 600, easing: 'ease-in', fill: 'forwards' })
                    .onfinish = () => p.remove();
            }
        };

        const highlightWinSymbols = (winningLines) => {
            // Remove all existing win highlights
            document.querySelectorAll('.sm-symbol.win-glow').forEach(el => el.classList.remove('win-glow'));

            for (const line of winningLines) {
                const payline = PAYLINES[line.lineIdx];
                for (let r = 0; r < line.count; r++) {
                    const rowIdx = payline[r];
                    const cell = document.querySelector(`[data-reel="${r}"][data-row="${rowIdx}"]`);
                    if (cell) cell.classList.add('win-glow');
                }
            }
        };

        const clearWinHighlights = () => {
            document.querySelectorAll('.sm-symbol.win-glow').forEach(el => el.classList.remove('win-glow'));
        };

        const shakeScreen = () => {
            cabinet.classList.remove('sm-shake');
            void cabinet.offsetWidth; // reflow
            cabinet.classList.add('sm-shake');
            cabinet.addEventListener('animationend', () => cabinet.classList.remove('sm-shake'), { once: true });
        };

        // ─────────────────────────────────────────────────────────────────────
        //  COUNTER ANIMATION
        // ─────────────────────────────────────────────────────────────────────
        const animateCounter = (el, from, to, duration) => {
            const start = performance.now();
            const update = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
                const current = Math.round(from + (to - from) * eased);
                el.textContent = `€ ${current}`;
                if (progress < 1) requestAnimationFrame(update);
            };
            requestAnimationFrame(update);
        };

        // ─────────────────────────────────────────────────────────────────────
        //  BIG WIN OVERLAY
        // ─────────────────────────────────────────────────────────────────────
        let bigWinPending = false;

        const showBigWin = (label, amount, winClass) => {
            bigWinPending = true;
            $('sm-bigwin-banner').textContent = label;
            $('sm-bigwin-amount').textContent = `€ 0`;
            bigwinOverlay.classList.add('visible');

            // Animate counter
            let startAmt = 0;
            const amtEl = $('sm-bigwin-amount');
            const counterDur = winClass === 'epic' ? 3000 : 1500;
            animateCounter(amtEl, 0, amount, counterDur);

            // Add confetti for epic
            if (winClass === 'epic') {
                shakeScreen();
                spawnConfetti(80);
                spawnCoins(30);
                setTimeout(() => spawnConfetti(60), 700);
                setTimeout(() => spawnCoins(20), 1200);
            } else {
                spawnCoins(20);
                spawnConfetti(30);
            }
        };

        function dismissBigWin() {
            if (!bigWinPending) return;
            bigWinPending = false;
            bigwinOverlay.classList.remove('visible');
            updateUI();
        }

        // ─────────────────────────────────────────────────────────────────────
        //  MAIN SPIN LOGIC
        // ─────────────────────────────────────────────────────────────────────
        const doSpin = async () => {
            if (spinning || bigWinPending) return;
            if (balance < bet) {
                setWinMsg('Nicht genug Guthaben!', true);
                return;
            }

            // Deduct bet
            balance -= bet;
            $('sm-balance').textContent = `€ ${balance.toFixed(0)}`;
            setLastWin(0);
            setWinMsg('Viel Glück...', false);
            clearWinHighlights();
            lockControls(true);

            // Generate final outcomes for all reels
            const finalGrids = [];
            for (let r = 0; r < REEL_COUNT; r++) {
                finalGrids[r] = [getRandSymbol(), getRandSymbol(), getRandSymbol()];
            }

            // Spin all reels concurrently (staggered)
            const REEL_DELAY = 0; // All start immediately, stagger via spinReel duration
            const promises = finalGrids.map((finalSyms, idx) => spinReel(idx, finalSyms, idx * 80));
            await Promise.all(promises);

            // Calculate win
            const { totalWin, winningLines } = calcWin(grid, bet);

            // Apply win
            const prevBalance = balance;
            if (totalWin > 0) {
                balance += totalWin;
                services.highscores.saveHighscore('slot_machine', balance);
                setLastWin(totalWin);

                // Animate balance counter
                animateCounter($('sm-balance'), prevBalance, balance, 600);

                // Highlight winning symbols
                highlightWinSymbols(winningLines);

                const multiplier = totalWin / bet;

                if (multiplier >= 20) {
                    // EPIC WIN
                    sfx.win_epic();
                    setWinMsg('🔥 MEGA WIN! 🔥', true);
                    showBigWin('🔥 MEGA WIN! 🔥', totalWin, 'epic');
                } else if (multiplier >= 5) {
                    // BIG WIN
                    sfx.win_big();
                    setWinMsg('✨ BIG WIN! ✨', true);
                    showBigWin('✨ BIG WIN! ✨', totalWin, 'big');
                } else {
                    // Standard win
                    sfx.win_small();
                    spawnCoins(8);
                    setWinMsg(`Gewinn: € ${totalWin.toFixed(0)}`, true);
                }
            } else {
                setWinMsg('Kein Gewinn – nächstes Mal!', false);
                updateUI();
            }

            // If balance is 0, reset
            if (balance <= 0) {
                balance = 1000;
                setTimeout(() => setWinMsg('Guthaben aufgefüllt! € 1000', true), 1200);
            }

            lockControls(false);
        };

        // ─────────────────────────────────────────────────────────────────────
        //  BET CONTROLS
        // ─────────────────────────────────────────────────────────────────────
        const adjustBet = (dir) => {
            const idx = BET_STEPS.indexOf(bet);
            if (dir === 1 && idx < BET_STEPS.length - 1) {
                bet = BET_STEPS[idx + 1];
            } else if (dir === -1 && idx > 0) {
                bet = BET_STEPS[idx - 1];
            }
            updateUI();
        };

        btnBetUp.addEventListener('click',  () => adjustBet(1));
        btnBetDown.addEventListener('click', () => adjustBet(-1));
        btnBetMin.addEventListener('click',  () => { bet = MIN_BET; updateUI(); });
        btnBetMax.addEventListener('click',  () => { bet = Math.min(MAX_BET, balance); updateUI(); });
        btnSpin.addEventListener('click', doSpin);

        // Keyboard shortcut
        const onKeyDown = (e) => {
            if (e.code === 'Space' && !spinning && !bigWinPending) {
                e.preventDefault();
                doSpin();
            }
            if ((e.code === 'Enter' || e.code === 'NumpadEnter') && bigWinPending) {
                dismissBigWin();
            }
        };
        document.addEventListener('keydown', onKeyDown);

        // ─────────────────────────────────────────────────────────────────────
        //  INITIAL RENDER
        // ─────────────────────────────────────────────────────────────────────
        updateUI();

        // ─────────────────────────────────────────────────────────────────────
        //  DESTROY / CLEANUP
        // ─────────────────────────────────────────────────────────────────────
        return {
            destroy: () => {
                document.removeEventListener('keydown', onKeyDown);
                // Clear all intervals
                rollIntervals.forEach(clearInterval);
                // Close audio context
                if (audioCtx) {
                    try { audioCtx.close(); } catch(e) {}
                }
                // Remove injected styles
                const styleEl = document.getElementById(STYLE_ID);
                if (styleEl) styleEl.remove();
            }
        };
    }
};
