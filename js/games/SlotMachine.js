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
        imageUrl: 'js/assets/images/Slots.png',
        tags: ['Casino']
    },

    init: (container, services) => {

        // ─────────────────────────────────────────────────────────────────────
        //  CASINO AUDIO ENGINE  v2  ·  Web Audio API only · no external files
        //  Architecture: Master Bus (Compressor → Gain) → all sound nodes
        // ─────────────────────────────────────────────────────────────────────
        let audioCtx  = null;
        let masterBus = null;   // shared output gain (all sounds route here)
        let reelTickNode = null; // cancelable reel-spin ticker
        let coinRollupId = null; // cancelable coin-rollup loop timeout

        /** Lazy-init AudioContext + master compressor / limiter bus */
        const getCtx = () => {
            if (audioCtx) return audioCtx;
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            // DynamicsCompressor acts as soft limiter – prevents clipping when
            // multiple sounds overlap during big-win sequences
            const comp = audioCtx.createDynamicsCompressor();
            comp.threshold.value = -14;
            comp.knee.value      =  6;
            comp.ratio.value     =  8;
            comp.attack.value    =  0.003;
            comp.release.value   =  0.18;

            masterBus = audioCtx.createGain();
            masterBus.gain.value = 0.82;

            comp.connect(masterBus);
            masterBus.connect(audioCtx.destination);
            return audioCtx;
        };

        // ── Low-level primitives ──────────────────────────────────────────────

        /**
         * Bell-tone via sine+triangle layering (glassy casino-bell character).
         * @param {number} freq        Fundamental frequency in Hz
         * @param {number} dur         Full decay duration in seconds
         * @param {number} peakGain    Peak amplitude (0–1)
         * @param {number} delay       Scheduled delay in seconds
         * @param {number} [fmRatio]   Overtone ratio (default 3.51 for bell)
         * @param {number} [fmMix]     Overtone mix ratio (default 0.28)
         */
        const bell = (freq, dur, peakGain, delay = 0, fmRatio = 3.51, fmMix = 0.28) => {
            try {
                const ctx = getCtx();
                const t   = ctx.currentTime + delay;

                const out = ctx.createGain();
                out.connect(masterBus);

                // Lowpass to round off harshness
                const lp = ctx.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.value = Math.min(freq * 8, 12000);
                lp.connect(out);

                const makePartial = (f, type, mix) => {
                    const osc = ctx.createOscillator();
                    const g   = ctx.createGain();
                    osc.type = type;
                    osc.frequency.setValueAtTime(f, t);
                    // ADSR envelope: instant attack, long exponential decay
                    g.gain.setValueAtTime(0,        t);
                    g.gain.linearRampToValueAtTime(peakGain * mix, t + 0.006);
                    g.gain.exponentialRampToValueAtTime(0.0001,    t + dur);
                    osc.connect(g);
                    g.connect(lp);
                    osc.start(t);
                    osc.stop(t + dur + 0.05);
                };

                makePartial(freq,           'sine',     1.0);
                makePartial(freq * fmRatio, 'triangle', fmMix);
            } catch (e) { /* silent fail */ }
        };

        /**
         * White-noise burst – mechanical / impact / clatter sounds.
         * @param {number} dur      Duration
         * @param {number} gainVal  Peak gain
         * @param {number} delay    Scheduled delay
         * @param {number} [lpHz]   Lowpass cutoff (default 3000)
         * @param {number} [bpHz]   Bandpass center (0 = skip)
         */
        const noise = (dur, gainVal, delay = 0, lpHz = 3000, bpHz = 0) => {
            try {
                const ctx  = getCtx();
                const t    = ctx.currentTime + delay;
                const size = Math.ceil(ctx.sampleRate * dur);
                const buf  = ctx.createBuffer(1, size, ctx.sampleRate);
                const d    = buf.getChannelData(0);
                for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;

                const src = ctx.createBufferSource();
                src.buffer = buf;

                let last = src;

                if (bpHz > 0) {
                    const bp = ctx.createBiquadFilter();
                    bp.type = 'bandpass'; bp.frequency.value = bpHz; bp.Q.value = 1.2;
                    src.connect(bp); last = bp;
                }
                const lp = ctx.createBiquadFilter();
                lp.type = 'lowpass'; lp.frequency.value = lpHz;
                last.connect(lp);

                const g = ctx.createGain();
                g.gain.setValueAtTime(gainVal, t);
                g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
                lp.connect(g);
                g.connect(masterBus);
                src.start(t);
            } catch (e) { /* silent fail */ }
        };

        /**
         * Simple sine tone with quick attack + exponential decay.
         * Used for bass thuds, sub-hits, etc.
         */
        const tone = (freq, dur, peakGain, delay = 0, type = 'sine') => {
            try {
                const ctx = getCtx();
                const t   = ctx.currentTime + delay;
                const osc = ctx.createOscillator();
                const g   = ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, t);
                g.gain.setValueAtTime(0,           t);
                g.gain.linearRampToValueAtTime(peakGain, t + 0.004);
                g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
                osc.connect(g);
                g.connect(masterBus);
                osc.start(t);
                osc.stop(t + dur + 0.05);
            } catch (e) { /* silent fail */ }
        };

        /**
         * Pitched sine with a quick frequency sweep (for thuds / pitch-drops).
         */
        const toneSweep = (freqStart, freqEnd, dur, peakGain, delay = 0) => {
            try {
                const ctx = getCtx();
                const t   = ctx.currentTime + delay;
                const osc = ctx.createOscillator();
                const g   = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freqStart, t);
                osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur * 0.6);
                g.gain.setValueAtTime(0,             t);
                g.gain.linearRampToValueAtTime(peakGain, t + 0.003);
                g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
                osc.connect(g);
                g.connect(masterBus);
                osc.start(t);
                osc.stop(t + dur + 0.05);
            } catch (e) { /* silent fail */ }
        };

        // ── SFX Interface ─────────────────────────────────────────────────────
        const sfx = {

            // ── Reel spin: periodic mechanical click/clatter ─────────────────
            // Returns a cancel function; call it when the reel stops.
            // Guard: idempotent – only one ticker may run at a time.
            spinStart: () => {
                try {
                    if (reelTickNode !== null) return; // already running → skip
                    getCtx(); // ensure context
                    let tick = 0;
                    const intervalMs = 82; // ~12 clicks/sec
                    const id = setInterval(() => {
                        // Short bandpass noise burst = mechanical click
                        noise(0.028, 0.09 + Math.random() * 0.04, 0, 1400, 900 + Math.random() * 400);
                        // Subtle low tick
                        if (tick % 3 === 0) tone(55 + Math.random() * 30, 0.04, 0.05);
                        tick++;
                    }, intervalMs);
                    reelTickNode = id;
                } catch (e) { /* silent fail */ }
            },

            stopSpinTicker: () => {
                if (reelTickNode !== null) { clearInterval(reelTickNode); reelTickNode = null; }
            },

            // ── Reel stop: mechanical thud + metallic ping ──────────────────
            // reelIdx 0–4: pitch rises from reel to reel (tension build-up)
            reel_stop: (reelIdx) => {
                const pitchMult = 1 + reelIdx * 0.12; // each reel slightly higher

                // 1) Low-end "thud" – deep sine that drops in pitch
                toneSweep(90 * pitchMult, 28 * pitchMult, 0.18, 0.55);

                // 2) Mechanical click – short filtered noise
                noise(0.045, 0.22, 0, 2200, 1100 * pitchMult);

                // 3) Subtle metallic ping for definition
                bell(620 + reelIdx * 80, 0.22, 0.12, 0.01, 4.0, 0.2);
            },

            // ── Win tiers ────────────────────────────────────────────────────

            /** Micro win (<1.5×): soft 3-note C-major arpeggio */
            win_micro: () => {
                // C5 E5 G5 – gentle and brief
                [[523.25, 0.00], [659.25, 0.10], [783.99, 0.20]]
                    .forEach(([f, d]) => bell(f, 0.55, 0.18, d, 3.5, 0.2));
            },

            /** Small win (1.5–5×): ascending 4-note bell sequence, metallic resonance */
            win_small: () => {
                // C5 E5 G5 B5 – warm arpeggio
                [[523.25, 0.00], [659.25, 0.11], [783.99, 0.22], [987.77, 0.34]]
                    .forEach(([f, d]) => bell(f, 0.75, 0.22, d, 3.51, 0.25));
                // Subtle shimmer layer
                setTimeout(() => {
                    [[1046.5, 0.0], [1318.5, 0.09]].forEach(([f, d]) => bell(f, 0.4, 0.10, d, 2.76, 0.18));
                }, 460);
            },

            /** Medium win (5–15×): energetic fanfare + coin burst */
            win_medium: () => {
                // Rhythmic 6-note ascending fanfare
                const notes = [523.25, 659.25, 783.99, 1046.5, 987.77, 1318.5];
                notes.forEach((f, i) => {
                    bell(f, 0.65, 0.28, i * 0.095, 3.51, 0.22);
                    // Brass-like sawtooth layer for energy
                    tone(f * 0.5, 0.18, 0.08, i * 0.095, 'sawtooth');
                });
                // Cascading coin pings
                for (let i = 0; i < 6; i++) {
                    bell(1200 + i * 90, 0.12, 0.14, 0.55 + i * 0.07, 4.2, 0.15);
                    noise(0.04, 0.07, 0.55 + i * 0.07, 5000, 2200);
                }
            },

            /** Big win (15–30×): dramatic chord progression + coin-counter loop */
            win_big: () => {
                // Four-chord progression: C – Am – F – G (root + fifth)
                const progression = [
                    { root: 261.63, fifth: 392.00, t: 0.00 },
                    { root: 220.00, fifth: 329.63, t: 0.28 },
                    { root: 174.61, fifth: 261.63, t: 0.56 },
                    { root: 196.00, fifth: 293.66, t: 0.82 },
                ];
                progression.forEach(({ root, fifth, t }) => {
                    tone(root,  0.35, 0.32, t, 'sine');
                    tone(fifth, 0.28, 0.22, t, 'sine');
                    bell(root * 2, 0.4, 0.2, t + 0.01, 3.51, 0.22);
                });

                // Upper melody line
                [1046.5, 1174.66, 1318.5, 1567.98].forEach((f, i) =>
                    bell(f, 0.5, 0.20, 0.12 + i * 0.14, 3.2, 0.18));

                // Cascading coin shower during count-up
                for (let i = 0; i < 12; i++) {
                    const t = 0.9 + i * 0.11;
                    bell(1100 + i * 70, 0.18, 0.15, t, 4.5, 0.12);
                    if (i % 3 === 0) noise(0.05, 0.08, t, 6000, 2500);
                }
            },

            /** Epic/Mega win (≥30×): full Las-Vegas treatment */
            win_epic: () => {
                // ① Sub-bass pulse for power
                for (let i = 0; i < 4; i++) {
                    toneSweep(60, 40, 0.35, 0.55, i * 0.22);
                }

                // ② Triumphant fanfare – dotted 16th arpeggio over two octaves
                const fanfare = [
                    261.63, 329.63, 392.00, 523.25,
                    659.25, 783.99, 987.77, 1046.5,
                    1174.66, 1318.5, 1567.98, 2093.0,
                ];
                fanfare.forEach((f, i) => {
                    bell(f, 0.9, 0.30, i * 0.075, 3.51, 0.28);
                    // Sawtooth harmonic for brass richness
                    tone(f * 0.5, 0.20, 0.12, i * 0.075 + 0.01, 'sawtooth');
                });

                // ③ Chord stabs at peaks
                [[523.25, 659.25, 783.99],   // C-major
                 [880.00, 1046.5, 1318.5]].forEach(([a, b, c], ci) => {
                    const t = 0.50 + ci * 0.48;
                    [a, b, c].forEach(f => bell(f, 0.7, 0.28, t, 3.0, 0.22));
                    noise(0.12, 0.08, t, 8000, 0);
                });

                // ④ Rapid coin shower (0.9 s onward) – density increases
                for (let i = 0; i < 20; i++) {
                    const t = 0.90 + i * 0.09;
                    bell(1050 + i * 55, 0.15, 0.18, t, 4.8, 0.10);
                    if (i % 2 === 0) noise(0.04, 0.06, t, 7000, 3000);
                }

                // ⑤ Final resolution chord at ~2.5 s
                setTimeout(() => {
                    [261.63, 329.63, 392.00, 523.25, 783.99].forEach((f, i) =>
                        bell(f, 1.2, 0.32, i * 0.04, 3.51, 0.25));
                    toneSweep(55, 32, 0.8, 0.45, 0);
                }, 2500);
            },

            /** Single coin ping – called by particle spawner */
            coin: () => {
                bell(1380 + Math.random() * 300, 0.12, 0.13, 0, 4.2, 0.10);
                noise(0.03, 0.06, 0, 6000, 2800);
            },

            /**
             * Coin rollup: rising "ping ping ping" while balance counts up.
             * Call startCoinRollup() before animateCounter, stopCoinRollup() after.
             * @param {number} totalDuration  ms – how long the counter will run
             */
            startCoinRollup: (totalDuration) => {
                sfx.stopCoinRollup();
                let tick = 0;
                const baseFreq  = 980;
                const freqStep  = 28;
                const totalTicks = Math.floor(totalDuration / 80);
                const schedule = () => {
                    if (tick >= totalTicks) return;
                    const f = baseFreq + Math.min(tick, 22) * freqStep;
                    bell(f, 0.08, 0.11, 0, 4.5, 0.08);
                    if (tick % 4 === 0) noise(0.025, 0.05, 0, 5500, 2200);
                    tick++;
                    coinRollupId = setTimeout(schedule, 78 + Math.random() * 18);
                };
                coinRollupId = setTimeout(schedule, 0);
            },

            stopCoinRollup: () => {
                if (coinRollupId !== null) { clearTimeout(coinRollupId); coinRollupId = null; }
            },

            // Legacy alias – no-op: doSpin owns the ticker lifecycle via spinStart/stopSpinTicker
            rollStart: () => {},
        };

        // ─────────────────────────────────────────────────────────────────────
        //  SYMBOL-DEFINITIONEN
        // ─────────────────────────────────────────────────────────────────────
        const SYMBOLS = [
            { id: 'seven',    emoji: '7️⃣',  label: 'Seven',   weight: 2,  mult: [0, 0, 50, 100, 500, 1000] },
            { id: 'diamond',  emoji: '💎',  label: 'Diamond', weight: 4,  mult: [0, 0, 20, 50, 200, 500]  },
            { id: 'crown',    emoji: '👑',  label: 'Crown',   weight: 5,  mult: [0, 0, 15, 30, 100, 250]  },
            { id: 'star',     emoji: '⭐',  label: 'Star',    weight: 8,  mult: [0, 0, 10, 20, 50, 100]   },
            { id: 'bell',     emoji: '🔔',  label: 'Bell',    weight: 10, mult: [0, 0, 5, 10, 25, 50]     },
            { id: 'cherry',   emoji: '🍒',  label: 'Cherry',  weight: 12, mult: [0, 0, 2, 4, 8, 15]       },
            { id: 'lemon',    emoji: '🍋',  label: 'Lemon',   weight: 14, mult: [0, 0, 3, 5, 10, 20]      },
            { id: 'grape',    emoji: '🍇',  label: 'Grape',   weight: 16, mult: [0, 0, 2, 4, 8, 15]       },
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
                    const lineWin = (bet / PAYLINES.length) * mult;
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
        let   SYM_H      = 100; // measured from DOM after first render

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
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    grid-template-rows: 1fr;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 24px;
    box-sizing: border-box;
    background: #06050a;
    font-family: 'Georgia', serif;
    color: #f5e6c0;
    position: relative;
    overflow: hidden;
    user-select: none;
}

/* Ambient glow orbs – behind everything */
.sm-root::before,
.sm-root::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    filter: blur(80px);
}
.sm-root::before {
    width: 55vw; height: 55vw;
    top: -20%; left: -10%;
    background: radial-gradient(ellipse, rgba(180,120,0,0.14) 0%, transparent 70%);
    animation: orbPulse1 9s ease-in-out infinite;
}
.sm-root::after {
    width: 45vw; height: 45vw;
    bottom: -15%; right: -8%;
    background: radial-gradient(ellipse, rgba(120,80,180,0.10) 0%, transparent 70%);
    animation: orbPulse2 11s ease-in-out infinite;
}
@keyframes orbPulse1 {
    0%,100% { transform: scale(1)   translate(0,0);      opacity: 0.7; }
    50%      { transform: scale(1.18) translate(4%, 6%);  opacity: 1; }
}
@keyframes orbPulse2 {
    0%,100% { transform: scale(1)   translate(0,0);      opacity: 0.6; }
    50%      { transform: scale(1.22) translate(-5%,-4%); opacity: 0.9; }
}
/* Win burst: full-screen soft glow */
.sm-dust::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(255,200,0,0.22) 0%, rgba(255,120,0,0.08) 50%, transparent 100%);
    opacity: 0;
    transition: opacity 1.2s ease-out;
    pointer-events: none;
    z-index: -1;
}
.sm-root.win-burst .sm-dust::after {
    opacity: 1;
    transition: opacity 0.1s ease-out;
}

/* Floating gold dust particles (CSS-only, random via nth-child) */
.sm-dust {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
}
.sm-dust-p {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,215,0,0.55);
    animation: dustFloat linear infinite;
}
@keyframes dustFloat {
    0%   { transform: translateY(110%) rotate(0deg);   opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 0.6; }
    100% { transform: translateY(-10%) rotate(540deg); opacity: 0; }
}

/* ── Side Panels ───────────────────────────────────────────── */
.sm-side-panel {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    max-width: 220px;
    width: 100%;
    align-self: stretch;
    justify-content: flex-start;
    padding-top: 8px;
}

/* Jackpot panel */
.sm-jackpot-panel {
    background: linear-gradient(180deg, #140e00 0%, #0a0800 100%);
    border: 1px solid rgba(255,200,50,0.22);
    border-radius: 16px;
    padding: 18px 14px 16px;
    text-align: center;
    box-shadow: 0 0 30px rgba(180,130,0,0.15), inset 0 1px 0 rgba(255,230,100,0.08);
    position: relative;
    overflow: hidden;
}
.sm-jackpot-panel::before {
    content: '';
    position: absolute;
    top: 0; left: 15%; right: 15%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,200,50,0.5), transparent);
}
.sm-jackpot-eye {
    font-size: 1.6rem;
    margin-bottom: 4px;
    animation: jackEye 3s ease-in-out infinite;
}
@keyframes jackEye {
    0%,100% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(255,215,0,0.4)); }
    50%      { transform: scale(1.15); filter: drop-shadow(0 0 14px rgba(255,215,0,0.9)); }
}
.sm-jackpot-label {
    font-size: 0.55rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #7a6020;
    margin-bottom: 8px;
}
.sm-jackpot-title {
    font-size: 0.75rem;
    font-weight: bold;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #c89820;
    margin-bottom: 10px;
}
.sm-jackpot-amount {
    font-size: clamp(1.05rem, 1.6vw, 1.4rem);
    font-weight: 900;
    color: #ffd700;
    letter-spacing: 0.03em;
    text-shadow: 0 0 16px rgba(255,215,0,0.7), 0 0 32px rgba(255,165,0,0.4);
    animation: jackAmtPulse 2.2s ease-in-out infinite alternate;
}
@keyframes jackAmtPulse {
    from { text-shadow: 0 0 10px rgba(255,215,0,0.5); }
    to   { text-shadow: 0 0 24px rgba(255,215,0,0.9), 0 0 50px rgba(255,130,0,0.5); }
}
.sm-jackpot-sub {
    font-size: 0.56rem;
    letter-spacing: 0.16em;
    color: #4a3810;
    text-transform: uppercase;
    margin-top: 8px;
}

/* Last wins panel */
.sm-wins-panel {
    background: linear-gradient(180deg, #0e0c00 0%, #080600 100%);
    border: 1px solid rgba(255,200,50,0.18);
    border-radius: 16px;
    padding: 14px 12px;
    box-shadow: 0 0 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,230,100,0.06);
}
.sm-wins-panel-title {
    font-size: 0.55rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #5a4820;
    margin-bottom: 10px;
    text-align: center;
    padding-bottom: 7px;
    border-bottom: 1px solid rgba(255,200,50,0.08);
}
.sm-wins-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.sm-win-entry {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 8px;
    border-radius: 7px;
    background: rgba(255,200,50,0.04);
    border: 1px solid rgba(255,200,50,0.07);
    animation: winEntryPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
}
@keyframes winEntryPop {
    from { transform: translateX(16px); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
}
.sm-win-entry-sym  { font-size: 1rem; flex-shrink: 0; }
.sm-win-entry-info { flex: 1; min-width: 0; }
.sm-win-entry-desc { font-size: 0.65rem; color: #8a7040; letter-spacing: 0.04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sm-win-entry-amt  { font-size: 0.78rem; font-weight: bold; color: #ffd700; text-align: right; flex-shrink: 0; white-space: nowrap; }
.sm-wins-empty {
    font-size: 0.62rem;
    color: #2a2010;
    text-align: center;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 8px 0;
}

/* ── Responsive: hide panels on tablet/mobile ─────────────────── */
@media (max-width: 1024px) {
    .sm-root {
        grid-template-columns: 1fr;
        grid-template-rows: auto;
        padding: 12px;
        gap: 0;
        align-items: center;
        justify-items: center;
    }
    .sm-side-panel { display: none; }
}

/* ── Cabinet / Frame ──────────────────────────────────────────── */
.sm-cabinet {
    background: linear-gradient(180deg, #1a1408 0%, #0f0c05 100%);
    border: 2px solid #8a6800;
    border-radius: 24px;
    padding: clamp(18px, 3vw, 28px) clamp(18px, 3vw, 32px) clamp(14px, 2vw, 22px);
    box-shadow:
        0 0 0 1px rgba(255,200,50,0.15),
        0 0 40px rgba(180,140,0,0.25),
        inset 0 1px 0 rgba(255,230,100,0.1),
        0 20px 80px rgba(0,0,0,0.8);
    width: min(90vw, 1100px);
    position: relative;
    z-index: 2;
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
    height: calc(var(--sym-h, 100px) * 3);
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
    height: var(--sym-h, 100px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(2rem, 4.5vw, 3.4rem);
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
.sm-sep-top    { top: var(--sym-h, 100px); }
.sm-sep-bottom { top: calc(var(--sym-h, 100px) * 2); }

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
    top: calc(var(--sym-h, 100px) + 4px);
    height: calc(var(--sym-h, 100px) - 8px);
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
/* ── Status message (neutral, non-win) ───────────────────────────── */
.sm-win-msg {
    min-height: 22px;
    text-align: center;
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    margin-top: 6px;
    color: #4a3820;
    transition: color 0.4s, opacity 0.4s;
    text-transform: uppercase;
}
.sm-win-msg.active {
    color: #8a6820;
}

/* ── Win Banner Overlay ──────────────────────────────────── */
.sm-win-banner {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 26;
    text-align: center;
    pointer-events: none;
    opacity: 0;
    border-radius: 18px;
    padding: 0;
    width: max-content;
    max-width: min(88%, 480px);
    /* start state for pop-in */
    transform: translate(-50%, -50%) scale(0.3);
}
.sm-win-banner.wb-show {
    pointer-events: all;
    animation: wbPopIn 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.sm-win-banner.wb-hide {
    pointer-events: none;
    animation: wbFadeOut 0.38s ease forwards;
}
@keyframes wbPopIn {
    from { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
    to   { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
}
@keyframes wbFadeOut {
    from { transform: translate(-50%, -50%) scale(1);    opacity: 1; }
    to   { transform: translate(-50%, -50%) scale(0.82); opacity: 0; }
}

/* ── Mini tier ────────────────────────────────────────────────── */
.sm-win-banner.wb-mini {
    background: rgba(8,7,0,0.88);
    border: 1px solid rgba(255,215,0,0.28);
    padding: 10px 24px 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,230,100,0.07);
}
.sm-win-banner.wb-mini .wb-label {
    font-size: 0.58rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #7a6020;
    margin-bottom: 2px;
}
.sm-win-banner.wb-mini .wb-amount {
    font-size: clamp(1.4rem, 4vw, 1.9rem);
    font-weight: 900;
    color: #ffd700;
    letter-spacing: 0.04em;
    text-shadow: 0 0 12px rgba(255,215,0,0.55), 0 2px 4px rgba(0,0,0,0.7);
}

/* ── Nice tier ────────────────────────────────────────────────── */
.sm-win-banner.wb-nice {
    background: rgba(5,4,0,0.92);
    border: 1px solid rgba(255,215,0,0.4);
    padding: 14px 32px 16px;
    box-shadow:
        0 0 0 1px rgba(255,180,0,0.08),
        0 8px 40px rgba(0,0,0,0.75),
        0 0 60px rgba(255,180,0,0.12),
        inset 0 1px 0 rgba(255,230,100,0.10);
    backdrop-filter: blur(6px);
}
.sm-win-banner.wb-nice .wb-label {
    font-size: 0.65rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #a07830;
    margin-bottom: 3px;
}
.sm-win-banner.wb-nice .wb-amount {
    font-size: clamp(1.9rem, 5.5vw, 2.8rem);
    font-weight: 900;
    letter-spacing: 0.04em;
    background: linear-gradient(180deg, #fff5c0 0%, #ffd700 45%, #c87800 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 10px rgba(255,215,0,0.7));
    animation: niceGlowPulse 1s ease-in-out infinite alternate;
}
@keyframes niceGlowPulse {
    from { filter: drop-shadow(0 0 8px rgba(255,215,0,0.5)); }
    to   { filter: drop-shadow(0 0 22px rgba(255,180,0,0.95)) drop-shadow(0 0 40px rgba(255,120,0,0.5)); }
}
.sm-win-banner.wb-nice .wb-sub {
    font-size: 0.7rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255,215,0,0.45);
    margin-top: 4px;
}

/* ── Bigwin overlay: progress bar auto-dismiss strip ─────────────── */
.sm-bigwin-progress {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: rgba(255,215,0,0.15);
    border-radius: 0 0 24px 24px;
    overflow: hidden;
}
.sm-bigwin-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #b87000, #ffd700, #ffe680);
    transform-origin: left;
    box-shadow: 0 0 8px rgba(255,215,0,0.6);
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

/* ── Win-Line SVG Overlay ─────────────────────────────────── */
.sm-win-line-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 8;
    overflow: visible;
}
.sm-win-line {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 4;
    filter: drop-shadow(0 0 6px currentColor) drop-shadow(0 0 14px currentColor);
    animation: winLineDraw 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.sm-win-line-bg {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 9;
    opacity: 0.18;
    animation: winLineDraw 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@keyframes winLineDraw {
    from { stroke-dashoffset: var(--line-len); opacity: 0; }
    to   { stroke-dashoffset: 0;              opacity: 1; }
}

/* ── Rules / Info Button ──────────────────────────────────────── */
.sm-rules-btn {
    position: absolute;
    top: 14px;
    right: 18px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(255,200,50,0.08);
    border: 1px solid rgba(255,200,50,0.22);
    color: #b8960a;
    font-size: 0.9rem;
    font-weight: 900;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 6;
    font-family: Georgia, serif;
    padding: 0;
    line-height: 1;
    letter-spacing: 0;
}
.sm-rules-btn:hover {
    background: rgba(255,200,50,0.18);
    border-color: rgba(255,200,50,0.55);
    color: #ffd700;
    box-shadow: 0 0 10px rgba(255,215,0,0.25);
    transform: scale(1.1);
}

/* ── Rules Modal Overlay ──────────────────────────────────────── */
.sm-rules-overlay {
    position: absolute;
    inset: 0;
    z-index: 35;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(5,4,0,0.93);
    backdrop-filter: blur(8px);
    border-radius: 22px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.22s ease;
    overflow-y: auto;
    padding: 18px 14px 22px;
    box-sizing: border-box;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,200,50,0.2) transparent;
}
.sm-rules-overlay.visible {
    opacity: 1;
    pointer-events: all;
}
.sm-rules-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 580px;
    margin-bottom: 14px;
    flex-shrink: 0;
}
.sm-rules-title-txt {
    font-size: clamp(0.8rem, 2.5vw, 0.95rem);
    font-weight: bold;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #ffd700;
    text-shadow: 0 0 14px rgba(255,215,0,0.4);
}
.sm-rules-close-btn {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    color: #8a7040;
    font-size: 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.18s;
    flex-shrink: 0;
    font-family: inherit;
    padding: 0;
    line-height: 1;
}
.sm-rules-close-btn:hover {
    background: rgba(255,80,80,0.15);
    border-color: rgba(255,80,80,0.3);
    color: #ff7070;
}
.sm-rules-section {
    width: 100%;
    max-width: 580px;
    margin-bottom: 14px;
    flex-shrink: 0;
}
.sm-rules-sec-hd {
    font-size: 0.58rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #5a4420;
    margin-bottom: 8px;
    padding-bottom: 5px;
    border-bottom: 1px solid rgba(255,200,50,0.1);
}
/* Paytable rows */
.sm-pay-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 10px;
    border-radius: 7px;
    margin-bottom: 3px;
    background: rgba(255,200,50,0.03);
    border: 1px solid rgba(255,200,50,0.07);
    transition: background 0.15s;
}
.sm-pay-row:hover { background: rgba(255,200,50,0.08); }
.sm-pay-emoji { font-size: 1.25rem; width: 30px; text-align: center; flex-shrink: 0; }
.sm-pay-name  { flex: 1; font-size: 0.72rem; color: #b09050; letter-spacing: 0.05em; }
.sm-pay-mults { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
.sm-pay-chip  {
    font-size: 0.62rem;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: bold;
    letter-spacing: 0.04em;
    white-space: nowrap;
}
.sm-chip-2 { background: rgba(100,200,100,0.12); color: #7ec87e; border: 1px solid rgba(100,200,100,0.2); }
.sm-chip-3 { background: rgba(210,210,80,0.12);  color: #ccc840; border: 1px solid rgba(210,210,80,0.2); }
.sm-chip-4 { background: rgba(255,160,40,0.13);  color: #ffa828; border: 1px solid rgba(255,160,40,0.22); }
.sm-chip-5 { background: rgba(255,70,70,0.12);   color: #ff8080; border: 1px solid rgba(255,70,70,0.22); }
/* Paylines */
.sm-paylines-wrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
}
@media (max-width: 380px) { .sm-paylines-wrap { grid-template-columns: 1fr; } }
.sm-pl-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 7px 9px;
    border-radius: 7px;
    background: rgba(255,200,50,0.03);
    border: 1px solid rgba(255,200,50,0.07);
}
.sm-pl-name { font-size: 0.66rem; color: #8a7040; letter-spacing: 0.04em; min-width: 66px; }
.sm-mg {
    display: grid;
    grid-template-columns: repeat(5, 9px);
    grid-template-rows: repeat(3, 7px);
    gap: 2px;
}
.sm-mc { border-radius: 1px; background: rgba(255,255,255,0.07); }
.sm-mc.on { background: #ffd700; box-shadow: 0 0 4px rgba(255,215,0,0.7); }
/* Rules text */
.sm-rules-text {
    font-size: 0.73rem;
    color: #9a8040;
    line-height: 1.75;
    padding: 2px 0;
}
.sm-rules-text strong { color: #ffd700; }
.sm-rules-hint-txt {
    font-size: 0.6rem;
    color: #3a2e10;
    text-align: center;
    margin-top: 4px;
    letter-spacing: 0.12em;
    flex-shrink: 0;
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

        // Gold dust layer (ambient floating particles)
        const dustLayer = document.createElement('div');
        dustLayer.className = 'sm-dust';
        root.appendChild(dustLayer);
        (() => {
            const dustCount = 28;
            for (let i = 0; i < dustCount; i++) {
                const p = document.createElement('div');
                p.className = 'sm-dust-p';
                const sz = 1.5 + Math.random() * 2.5;
                const dur = 14 + Math.random() * 22;
                const delay = -(Math.random() * dur); // stagger
                const leftPct = Math.random() * 100;
                p.style.cssText = `
                    width:${sz}px; height:${sz}px;
                    left:${leftPct}%;
                    bottom:0;
                    opacity:${0.2 + Math.random() * 0.5};
                    animation-duration:${dur}s;
                    animation-delay:${delay}s;
                    filter: blur(${Math.random() > 0.5 ? 0.5 : 0}px);
                `;
                dustLayer.appendChild(p);
            }
        })();

        // Left side panel – Jackpot
        const leftPanel = document.createElement('div');
        leftPanel.className = 'sm-side-panel sm-panel-left';
        leftPanel.innerHTML = `
            <div class="sm-jackpot-panel">
                <div class="sm-jackpot-eye">🎰</div>
                <div class="sm-jackpot-label">Progressive</div>
                <div class="sm-jackpot-title">JACKPOT</div>
                <div class="sm-jackpot-amount" id="sm-jackpot-amount">&euro; 1.284.920,00</div>
                <div class="sm-jackpot-sub">Nexus Network &middot; Live</div>
            </div>
        `;
        root.appendChild(leftPanel);

        // Cabinet
        const cabinet = document.createElement('div');
        cabinet.className = 'sm-cabinet';
        root.appendChild(cabinet);

        // Right side panel – Last wins
        const rightPanel = document.createElement('div');
        rightPanel.className = 'sm-side-panel sm-panel-right';
        rightPanel.innerHTML = `
            <div class="sm-wins-panel">
                <div class="sm-wins-panel-title">Letzte Gewinne</div>
                <div class="sm-wins-list" id="sm-wins-list">
                    <div class="sm-wins-empty">Noch keine Gewinne</div>
                </div>
            </div>
        `;
        root.appendChild(rightPanel);

        // Title
        const title = document.createElement('div');
        title.className = 'sm-title';
        title.innerHTML = '🎰 &nbsp; NEXUS SLOTS &nbsp; 🎰';
        cabinet.appendChild(title);

        // Rules button (top-right corner of cabinet)
        const btnRules = document.createElement('button');
        btnRules.className = 'sm-rules-btn';
        btnRules.id = 'sm-btn-rules';
        btnRules.title = 'Regeln & Gewinntabelle';
        btnRules.textContent = '?';
        cabinet.appendChild(btnRules);

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

        // Win-line SVG overlay (sits above symbols, below reel fade-gradients)
        const winLineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        winLineSvg.setAttribute('class', 'sm-win-line-svg');
        winLineSvg.setAttribute('id', 'sm-win-line-svg');
        reelsFrame.appendChild(winLineSvg);

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

        // Win Banner (mini & nice tiers – overlays reels frame area)
        const winBanner = document.createElement('div');
        winBanner.className = 'sm-win-banner';
        winBanner.id = 'sm-win-banner';
        winBanner.innerHTML = `
            <div class="wb-label" id="wb-label"></div>
            <div class="wb-amount" id="wb-amount"></div>
            <div class="wb-sub" id="wb-sub"></div>
        `;
        cabinet.appendChild(winBanner);

        // ─────────────────────────────────────────────────────────────────────
        //  RULES OVERLAY
        // ─────────────────────────────────────────────────────────────────────
        const rulesOverlay = document.createElement('div');
        rulesOverlay.className = 'sm-rules-overlay';
        rulesOverlay.id = 'sm-rules-overlay';

        // Build paytable rows from SYMBOLS data
        const paytableHTML = SYMBOLS.map(sym => {
            const chips = [];
            for (let n = 1; n <= 5; n++) {
                if (sym.mult[n] > 0)
                    chips.push(`<span class="sm-pay-chip sm-chip-${n}">${n}× &rarr; ${sym.mult[n]}×</span>`);
            }
            return `<div class="sm-pay-row">
                <div class="sm-pay-emoji">${sym.emoji}</div>
                <div class="sm-pay-name">${sym.label}</div>
                <div class="sm-pay-mults">${chips.join('')}</div>
            </div>`;
        }).join('');

        // Build payline mini-grids
        const PAYLINE_NAMES = ['Mitte', 'Oben', 'Unten', 'Zickzack &darr;', 'Zickzack &uarr;'];
        const paylinesHTML = PAYLINES.map((line, li) => {
            let cells = '';
            for (let row = 0; row < 3; row++)
                for (let col = 0; col < 5; col++)
                    cells += `<div class="sm-mc${line[col] === row ? ' on' : ''}"></div>`;
            return `<div class="sm-pl-item">
                <div class="sm-pl-name">Linie ${li + 1}: ${PAYLINE_NAMES[li]}</div>
                <div class="sm-mg">${cells}</div>
            </div>`;
        }).join('');

        rulesOverlay.innerHTML = `
            <div class="sm-rules-header">
                <div class="sm-rules-title-txt">&#x1F4D6; &nbsp; Regeln &amp; Gewinne</div>
                <button class="sm-rules-close-btn" id="sm-rules-close-btn">&times;</button>
            </div>
            <div class="sm-rules-section">
                <div class="sm-rules-sec-hd">Gewinntabelle &mdash; Einsatz &times; Multiplikator = Auszahlung</div>
                ${paytableHTML}
            </div>
            <div class="sm-rules-section">
                <div class="sm-rules-sec-hd">5 Aktive Gewinnlinien</div>
                <div class="sm-paylines-wrap">${paylinesHTML}</div>
            </div>
            <div class="sm-rules-section">
                <div class="sm-rules-sec-hd">Spielregeln</div>
                <div class="sm-pay-row" style="flex-direction:column;align-items:flex-start;gap:4px;">
                    <div class="sm-rules-text">
                        &#x1F3AF; Gleiche Symbole m&uuml;ssen von <strong>links</strong> l&uuml;ckenlos aufeinanderfolgen.<br>
                        &#x1F4B0; Gewinn = Einsatz &times; Multiplikator der jeweiligen Linie.<br>
                        &#x1F504; Treffer auf mehreren Linien werden addiert.<br>
                        &#x1F352; <strong>Kirschen</strong> zahlen bereits ab 2 gleichen Symbolen.<br>
                        &#x2728; <strong>BIG WIN</strong>: Gesamtgewinn &ge; 5&times; des Einsatzes.<br>
                        &#x1F525; <strong>MEGA WIN</strong>: Gesamtgewinn &ge; 20&times; des Einsatzes.
                    </div>
                </div>
            </div>
            <div class="sm-rules-hint-txt">ESC oder &times; zum Schlie&szlig;en</div>
        `;
        cabinet.appendChild(rulesOverlay);

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

        // ── Measure real symbol height so JS animation math is accurate ──────────
        // Set CSS custom property + update SYM_H from actual rendered size
        const measureAndApplySYMH = () => {
            const firstCell = reelEls[0]?.querySelector('.sm-symbol');
            if (firstCell) {
                const h = firstCell.getBoundingClientRect().height;
                if (h > 0) {
                    SYM_H = h;
                    root.style.setProperty('--sym-h', `${h}px`);
                }
            }
        };
        // Run once now; re-run on resize with debounce so spin math stays correct
        measureAndApplySYMH();
        let resizeDebounce = null;
        const onResize = () => {
            clearTimeout(resizeDebounce);
            resizeDebounce = setTimeout(measureAndApplySYMH, 120);
        };
        window.addEventListener('resize', onResize);

        // ── Jackpot ticker (increments ~€1–2 every 2.5 s) ──────────────────
        let jackpotVal = 1_284_920 + Math.random() * 200;
        const fmtJackpot = (v) =>
            '€ ' + Math.floor(v).toLocaleString('de-DE') + ',00';
        const jackpotEl = document.getElementById('sm-jackpot-amount');
        if (jackpotEl) jackpotEl.textContent = fmtJackpot(jackpotVal);
        const jackpotInterval = setInterval(() => {
            jackpotVal += 0.8 + Math.random() * 1.8;
            if (jackpotEl) jackpotEl.textContent = fmtJackpot(jackpotVal);
        }, 2400);

        // ── Last wins feed ──────────────────────────────────────────
        const lastWins = [];  // [{emoji, desc, amount}]
        const MAX_WINS_SHOWN = 5;
        const winsListEl = document.getElementById('sm-wins-list');

        const pushLastWin = (winData) => {
            lastWins.unshift(winData);
            if (lastWins.length > MAX_WINS_SHOWN) lastWins.pop();
            if (!winsListEl) return;
            winsListEl.innerHTML = lastWins.map(w => `
                <div class="sm-win-entry">
                    <div class="sm-win-entry-sym">${w.emoji}</div>
                    <div class="sm-win-entry-info">
                        <div class="sm-win-entry-desc">${w.desc}</div>
                    </div>
                    <div class="sm-win-entry-amt">€ ${w.amount.toFixed(0)}</div>
                </div>
            `).join('');
        };

        // Win burst: briefly pulse the ambient orb gold
        const triggerWinBurst = () => {
            root.classList.add('win-burst');
            setTimeout(() => root.classList.remove('win-burst'), 900);
        };

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

        // One distinct neon color per payline
        const PAYLINE_COLORS = [
            '#FFD700', // 0 Middle   – gold
            '#00E5FF', // 1 Top      – cyan
            '#FF4081', // 2 Bottom   – pink
            '#69FF47', // 3 V-shape  – lime
            '#FF8A00', // 4 inv-V    – orange
        ];

        const highlightWinSymbols = (winningLines) => {
            // Remove glow class from previous spin
            document.querySelectorAll('.sm-symbol.win-glow').forEach(el => el.classList.remove('win-glow'));

            // Clear old SVG lines
            while (winLineSvg.firstChild) winLineSvg.removeChild(winLineSvg.firstChild);

            const svgRect = winLineSvg.getBoundingClientRect();

            for (const line of winningLines) {
                const payline = PAYLINES[line.lineIdx];
                const color   = PAYLINE_COLORS[line.lineIdx] || '#FFD700';
                const points  = [];

                for (let r = 0; r < line.count; r++) {
                    const rowIdx = payline[r];
                    const cell   = document.querySelector(`[data-reel="${r}"][data-row="${rowIdx}"]`);
                    if (!cell) continue;
                    cell.classList.add('win-glow');

                    // Center of this cell in SVG coordinate space
                    const cr = cell.getBoundingClientRect();
                    const cx = cr.left - svgRect.left + cr.width  / 2;
                    const cy = cr.top  - svgRect.top  + cr.height / 2;
                    points.push(`${cx.toFixed(1)},${cy.toFixed(1)}`);
                }

                if (points.length < 2) continue;
                const ptStr = points.join(' ');

                // Measure path length for the draw-on animation
                // We calculate it manually from the point coords
                const coords = points.map(p => p.split(',').map(Number));
                let pathLen = 0;
                for (let i = 1; i < coords.length; i++) {
                    const dx = coords[i][0] - coords[i-1][0];
                    const dy = coords[i][1] - coords[i-1][1];
                    pathLen += Math.hypot(dx, dy);
                }
                const lenStr = pathLen.toFixed(1);

                // Background glow (wide, semi-transparent same color)
                const bg = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                bg.setAttribute('class', 'sm-win-line-bg');
                bg.setAttribute('points', ptStr);
                bg.setAttribute('stroke', color);
                bg.style.setProperty('--line-len', lenStr);
                bg.style.strokeDasharray = lenStr;
                bg.style.strokeDashoffset = lenStr;
                winLineSvg.appendChild(bg);

                // Sharp foreground line
                const fg = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                fg.setAttribute('class', 'sm-win-line');
                fg.setAttribute('points', ptStr);
                fg.setAttribute('stroke', color);
                fg.style.setProperty('--line-len', lenStr);
                fg.style.strokeDasharray = lenStr;
                fg.style.strokeDashoffset = lenStr;
                winLineSvg.appendChild(fg);
            }
        };

        const clearWinHighlights = () => {
            document.querySelectorAll('.sm-symbol.win-glow').forEach(el => el.classList.remove('win-glow'));
            while (winLineSvg.firstChild) winLineSvg.removeChild(winLineSvg.firstChild);
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
        let bigWinAutoTimer = null;

        const showBigWin = (label, amount, winClass) => {
            bigWinPending = true;
            $('sm-bigwin-banner').textContent = label;
            $('sm-bigwin-amount').textContent = `€ 0`;
            bigwinOverlay.classList.add('visible');

            // Animate win amount counter
            const amtEl = $('sm-bigwin-amount');
            const counterDur = winClass === 'epic' ? 3000 : 1800;
            animateCounter(amtEl, 0, amount, counterDur);

            // Particle effects
            if (winClass === 'epic') {
                shakeScreen();
                spawnConfetti(80); spawnCoins(30);
                setTimeout(() => spawnConfetti(60), 700);
                setTimeout(() => spawnCoins(20), 1200);
            } else {
                spawnCoins(20); spawnConfetti(30);
            }

            // Animated auto-dismiss progress bar (4 s)
            const autoDismissMs = 4000;
            // Inject progress bar if not already present
            let prog = bigwinOverlay.querySelector('.sm-bigwin-progress');
            if (!prog) {
                prog = document.createElement('div');
                prog.className = 'sm-bigwin-progress';
                const bar = document.createElement('div');
                bar.className = 'sm-bigwin-progress-bar';
                bar.id = 'sm-bigwin-pb';
                prog.appendChild(bar);
                bigwinOverlay.appendChild(prog);
            }
            const pb = bigwinOverlay.querySelector('.sm-bigwin-progress-bar');
            if (pb) {
                pb.style.transition = 'none';
                pb.style.transform  = 'scaleX(1)';
                // Force reflow then animate to 0
                void pb.offsetWidth;
                pb.style.transition = `transform ${autoDismissMs}ms linear`;
                pb.style.transform  = 'scaleX(0)';
            }

            // Cancel any previous auto-timer
            if (bigWinAutoTimer) clearTimeout(bigWinAutoTimer);
            bigWinAutoTimer = setTimeout(dismissBigWin, autoDismissMs);
        };

        function dismissBigWin() {
            if (!bigWinPending) return;
            if (bigWinAutoTimer) { clearTimeout(bigWinAutoTimer); bigWinAutoTimer = null; }
            bigWinPending = false;
            bigwinOverlay.classList.remove('visible');
            updateUI();
        }

        // ─────────────────────────────────────────────────────────────────────
        //  WIN BANNER  (mini / nice tiers)
        // ─────────────────────────────────────────────────────────────────────
        let winBannerTimer = null;

        /**
         * Show the floating win banner for mini and nice wins.
         * @param {'mini'|'nice'} tier
         * @param {string}        labelText   Header label
         * @param {number}        amount      Win amount in €
         * @param {string}        [subText]   Optional subtitle
         * @param {number}        autoMs      Auto-dismiss delay in ms
         */
        const showWinBanner = (tier, labelText, amount, subText, autoMs) => {
            // Clear any previous banner immediately
            hideWinBanner(true);

            $('wb-label').textContent  = labelText;
            $('wb-amount').textContent = `€ 0`;
            $('wb-sub').textContent    = subText || '';

            winBanner.className = `sm-win-banner wb-${tier} wb-show`;

            // Count up to win amount
            animateCounter($('wb-amount'), 0, amount, Math.min(autoMs * 0.55, 900));

            // Auto-dismiss
            winBannerTimer = setTimeout(() => hideWinBanner(false), autoMs);

            // Click-to-skip
            winBanner.onclick = () => hideWinBanner(false);
        };

        const hideWinBanner = (instant) => {
            if (winBannerTimer) { clearTimeout(winBannerTimer); winBannerTimer = null; }
            winBanner.onclick = null;
            if (instant) {
                winBanner.className = 'sm-win-banner';
            } else {
                winBanner.classList.remove('wb-show');
                winBanner.classList.add('wb-hide');
                setTimeout(() => { winBanner.className = 'sm-win-banner'; }, 400);
            }
        };

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

            // Start mechanical spin ticker
            sfx.spinStart();

            // Generate final outcomes for all reels
            const finalGrids = [];
            for (let r = 0; r < REEL_COUNT; r++) {
                finalGrids[r] = [getRandSymbol(), getRandSymbol(), getRandSymbol()];
            }

            // Spin all reels concurrently (staggered)
            const promises = finalGrids.map((finalSyms, idx) => spinReel(idx, finalSyms, idx * 80));
            await Promise.all(promises);

            // Stop spin ticker once all reels have landed
            sfx.stopSpinTicker();

            // Calculate win
            const { totalWin, winningLines } = calcWin(grid, bet);

            // Apply win
            const prevBalance = balance;
            if (totalWin > 0) {
                balance += totalWin;
                services.highscores.saveHighscore('slot_machine', balance);
                setLastWin(totalWin);

                // Highlight winning symbols
                highlightWinSymbols(winningLines);

            const multiplier = totalWin / bet;

                // ── Visual Win Tiers ───────────────────────────────────
                if (multiplier >= 30) {
                    // MEGA WIN (≥30×)
                    sfx.win_epic();
                    const dur = 3000;
                    sfx.startCoinRollup(dur);
                    animateCounter($('sm-balance'), prevBalance, balance, dur);
                    setTimeout(() => sfx.stopCoinRollup(), dur + 100);
                    setWinMsg('');
                    showBigWin('🔥 MEGA WIN! 🔥', totalWin, 'epic');
                    triggerWinBurst();
                    pushLastWin({ emoji: winningLines[0]?.sym.emoji || '🎰', desc: `${multiplier.toFixed(0)}× – MEGA WIN`, amount: totalWin });

                } else if (multiplier >= 15) {
                    // BIG WIN (15–30×)
                    sfx.win_big();
                    const dur = 2000;
                    sfx.startCoinRollup(dur);
                    animateCounter($('sm-balance'), prevBalance, balance, dur);
                    setTimeout(() => sfx.stopCoinRollup(), dur + 100);
                    setWinMsg('');
                    showBigWin('✨ BIG WIN! ✨', totalWin, 'big');
                    triggerWinBurst();
                    pushLastWin({ emoji: winningLines[0]?.sym.emoji || '✨', desc: `${multiplier.toFixed(0)}× – BIG WIN`, amount: totalWin });

                } else if (multiplier >= 5) {
                    // NICE WIN (5–15×)
                    sfx.win_medium();
                    const dur = 1200;
                    sfx.startCoinRollup(dur);
                    animateCounter($('sm-balance'), prevBalance, balance, dur);
                    setTimeout(() => sfx.stopCoinRollup(), dur + 100);
                    spawnCoins(16); spawnConfetti(20);
                    setWinMsg('');
                    showWinBanner('nice', 'MEDIUM WIN', totalWin, `${multiplier.toFixed(1)}× Einsatz`, 2600);
                    triggerWinBurst();
                    pushLastWin({ emoji: winningLines[0]?.sym.emoji || '⭐', desc: `${multiplier.toFixed(1)}× – Medium Win`, amount: totalWin });

                } else if (multiplier >= 2) {
                    // NICE WIN (2–5×)
                    sfx.win_small();
                    animateCounter($('sm-balance'), prevBalance, balance, 600);
                    spawnCoins(10);
                    setWinMsg('');
                    showWinBanner('nice', 'NICE WIN', totalWin, `${multiplier.toFixed(1)}× Einsatz`, 2000);
                    pushLastWin({ emoji: winningLines[0]?.sym.emoji || '🔔', desc: `${multiplier.toFixed(1)}×`, amount: totalWin });

                } else {
                    // MINI WIN (<2×)
                    sfx.win_micro();
                    animateCounter($('sm-balance'), prevBalance, balance, 400);
                    spawnCoins(4);
                    setWinMsg('');
                    showWinBanner('mini', 'GEWINN', totalWin, '', 1200);
                    pushLastWin({ emoji: winningLines[0]?.sym.emoji || '🍒', desc: `×${multiplier.toFixed(1)}`, amount: totalWin });
                }

            } else {
                setWinMsg('Kein Gewinn – nächstes Mal!');
                updateUI();
            }

            // If balance is 0, reset
            if (balance <= 0) {
                balance = 1000;
                setTimeout(() => setWinMsg('Guthaben aufgefüllt! € 1000'), 1200);
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

        // Rules modal open / close
        const openRules  = () => rulesOverlay.classList.add('visible');
        const closeRules = () => rulesOverlay.classList.remove('visible');
        btnRules.addEventListener('click', openRules);
        document.getElementById('sm-rules-close-btn').addEventListener('click', closeRules);
        rulesOverlay.addEventListener('click', (e) => { if (e.target === rulesOverlay) closeRules(); });

        // Keyboard shortcut
        const onKeyDown = (e) => {
            if (e.code === 'Space' && !spinning && !bigWinPending) {
                e.preventDefault();
                doSpin();
            }
            if ((e.code === 'Enter' || e.code === 'NumpadEnter') && bigWinPending) {
                dismissBigWin();
            }
            if (e.code === 'Escape') {
                closeRules();
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
                window.removeEventListener('resize', onResize);
                clearTimeout(resizeDebounce);
                clearInterval(jackpotInterval);
                // Cancel spin ticker + coin rollup timers
                sfx.stopSpinTicker();
                sfx.stopCoinRollup();
                // Clear legacy reel intervals
                rollIntervals.forEach(clearInterval);
                // Close audio context (frees all nodes)
                if (audioCtx) {
                    try { audioCtx.close(); } catch(e) {}
                    audioCtx = null;
                    masterBus = null;
                }
                // Remove injected styles
                const styleEl = document.getElementById(STYLE_ID);
                if (styleEl) styleEl.remove();
            }
        };
    }
};
