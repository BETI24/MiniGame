const BOARD_SIZE = 25;
const STARTING_BALANCE = 1000;
const HOUSE_EDGE = 0.01;
const MINE_OPTIONS = [1, 3, 5, 10, 20];

// Multiplier-Tabelle für jede mögliche Anzahl aufgedeckter Gems.
// Formel: 0.99 / P(k sichere Picks hintereinander)
// Dadurch ergibt sich bei jedem festen Cashout-Punkt ungefähr 1 % House Edge.
const MULTIPLIER_TABLES = Object.fromEntries(
    MINE_OPTIONS.map((mineCount) => {
        const safeTiles = BOARD_SIZE - mineCount;
        const multipliers = [];
        let survivalProbability = 1;

        for (
            let revealedGems = 1;
            revealedGems <= safeTiles;
            revealedGems++
        ) {
            survivalProbability *=
                (safeTiles - (revealedGems - 1)) /
                (BOARD_SIZE - (revealedGems - 1));

            multipliers.push(
                (1 - HOUSE_EDGE) / survivalProbability
            );
        }

        return [mineCount, multipliers];
    })
);


function formatTokens(value) {
    return Number(value).toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function getRandomIndex(maxExclusive) {

    if (globalThis.crypto?.getRandomValues) {

        const buffer = new Uint32Array(1);

        globalThis.crypto.getRandomValues(buffer);

        return Math.floor(
            (buffer[0] / 4294967296) * maxExclusive
        );
    }

    return Math.floor(Math.random() * maxExclusive);
}


function createMineSet(mineCount) {

    const indices = Array.from(
        { length: BOARD_SIZE },
        (_, index) => index
    );

    // Fisher-Yates Shuffle
    for (let i = indices.length - 1; i > 0; i--) {

        const j = getRandomIndex(i + 1);

        [indices[i], indices[j]] =
            [indices[j], indices[i]];
    }

    return new Set(
        indices.slice(0, mineCount)
    );
}


export default {

    manifest: {
        id: 'mines',
        name: 'Nexus Mines',
        description:
            'Decke Edelsteine auf, meide die Minen und sichere deinen Gewinn rechtzeitig.',
        icon: '💎',
        imageUrl: 'js/assets/images/Mines.png',
        tags: ['Casino', 'Logic']
    },


    init: (container, services) => {

        // ================================
        // GAME STATE
        // ================================

        let balance = STARTING_BALANCE;

        let selectedMines = 3;
        let betAmount = 10;

        let roundBet = 0;

        let roundActive = false;

        let minePositions = new Set();
        let revealedTiles = new Set();

        let revealedGems = 0;

        let currentMultiplier = 1;
        let potentialPayout = 0;

        let destroyed = false;

        // ================================
        // SOUNDS
        // ================================

        const soundUrls = {
            bet: new URL(
                '../assets/sounds/mines-bet.ogg',
                import.meta.url
            ),

            gem: new URL(
                '../assets/sounds/mines-gem.ogg',
                import.meta.url
            ),

            hit: new URL(
                '../assets/sounds/mines-bet.ogg',
                import.meta.url
            ),

            cashout: new URL(
                '../assets/sounds/mines-cashout.ogg',
                import.meta.url
            )
        };


        const sounds = {
            bet: new Audio(soundUrls.bet),
            hit: new Audio(soundUrls.hit),
            cashout: new Audio(soundUrls.cashout)
        };


        // Mehrere Instanzen für schnell aufeinanderfolgende Gem-Sounds
        const gemSoundPool = Array.from(
            { length: 6 },
            () => new Audio(soundUrls.gem)
        );

        let nextGemSound = 0;


        // Lautstärke pro Sound
        sounds.bet.volume = 0.45;
        sounds.hit.volume = 0.55;
        sounds.cashout.volume = 0.55;


        gemSoundPool.forEach((sound) => {
            sound.volume = 0.45;
            sound.preload = 'auto';
        });


        sounds.bet.preload = 'auto';
        sounds.hit.preload = 'auto';
        sounds.cashout.preload = 'auto';


        // Sound immer von vorne abspielen.
        // catch() verhindert Fehler, falls der Browser Audio blockiert.
        const playSound = (sound) => {

            if (!sound) {
                return;
            }

            sound.currentTime = 0;

            sound.play().catch(() => {
                // Browser konnte Sound nicht abspielen.
                // Für das Spiel selbst nicht kritisch.
            });
        };

        const playGemSound = () => {

            const sound =
                gemSoundPool[nextGemSound];


            nextGemSound =
                (nextGemSound + 1) %
                gemSoundPool.length;


            // Falls genau diese Pool-Instanz doch noch läuft,
            // wird nur diese eine zurückgesetzt.
            sound.currentTime = 0;


            sound.play().catch(() => {
                // Sound konnte nicht abgespielt werden.
            });
        };

        // ================================
        // STYLE
        // ================================

        const style = document.createElement('style');

        style.textContent = `

            .mines-game {

                --mines-bg: #090e17;

                --mines-panel:
                    rgba(18, 27, 43, 0.92);

                --mines-panel-2:
                    rgba(25, 38, 58, 0.92);

                --mines-border:
                    rgba(255,255,255,0.08);

                --mines-muted: #8ea1b8;

                --mines-text: #f5f9ff;

                --mines-cyan: #27d8ff;

                --mines-blue: #3a8dff;

                --mines-purple: #9b6cff;

                --mines-green: #56e39f;

                --mines-red: #ff5f76;


                width: 100%;
                height: 100%;

                overflow: auto;

                color: var(--mines-text);

                background:

                    radial-gradient(
                        circle at 74% 35%,
                        rgba(39, 216, 255, 0.08),
                        transparent 30%
                    ),

                    radial-gradient(
                        circle at 25% 70%,
                        rgba(155, 108, 255, 0.07),
                        transparent 35%
                    ),

                    var(--mines-bg);

                font-family: inherit;
            }


            .mines-game * {
                box-sizing: border-box;
            }


            .mines-layout {

                width: min(
                    1220px,
                    calc(100% - 40px)
                );

                min-height: 100%;

                margin: 0 auto;

                padding: 28px 0;

                display: grid;

                grid-template-columns:
                    320px minmax(0, 1fr);

                gap: 34px;

                align-items: center;
            }



            /* ========================
               SIDEBAR
            ======================== */

            .mines-sidebar {

                background:
                    linear-gradient(
                        180deg,
                        var(--mines-panel-2),
                        var(--mines-panel)
                    );

                border:
                    1px solid var(--mines-border);

                border-radius: 20px;

                padding: 22px;

                box-shadow:
                    0 24px 70px
                    rgba(0,0,0,0.34);
            }


            .mines-heading {

                display: flex;

                align-items: center;

                justify-content: space-between;

                gap: 12px;

                margin-bottom: 22px;
            }


            .mines-title {

                font-size: 1.2rem;

                font-weight: 800;
            }


            .mines-subtitle {

                color: var(--mines-muted);

                font-size: 0.82rem;

                margin-top: 4px;
            }


            .mines-balance-chip {

                padding: 8px 10px;

                border:
                    1px solid
                    rgba(39,216,255,0.18);

                background:
                    rgba(39,216,255,0.08);

                border-radius: 12px;

                text-align: right;

                white-space: nowrap;
            }


            .mines-balance-label {

                color: var(--mines-muted);

                font-size: 0.68rem;

                text-transform: uppercase;

                letter-spacing: .08em;
            }


            .mines-balance {

                font-weight: 800;

                color: #fff;

                margin-top: 2px;
            }



            /* ========================
               INPUTS
            ======================== */

            .mines-field {

                margin-bottom: 18px;
            }


            .mines-label-row {

                display: flex;

                justify-content: space-between;

                align-items: center;

                margin-bottom: 8px;
            }


            .mines-label {

                color: #bfd0e2;

                font-size: 0.82rem;

                font-weight: 700;
            }


            .mines-label-value {

                color: var(--mines-muted);

                font-size: 0.78rem;
            }


            .mines-bet-row {

                display: grid;

                grid-template-columns:
                    1fr auto auto;

                border:
                    1px solid
                    rgba(255,255,255,0.10);

                background:
                    rgba(6, 13, 22, 0.42);

                border-radius: 12px;

                overflow: hidden;
            }


            .mines-bet-input {

                min-width: 0;

                border: 0;

                outline: 0;

                color: white;

                background: transparent;

                padding: 12px 13px;

                font: inherit;

                font-weight: 700;
            }


            .mines-mini-btn {

                width: 45px;

                border: 0;

                border-left:
                    1px solid
                    rgba(255,255,255,0.08);

                color: #dcecff;

                background:
                    rgba(255,255,255,0.035);

                cursor: pointer;

                font-weight: 800;
            }


            .mines-mini-btn:hover:not(:disabled) {

                background:
                    rgba(255,255,255,0.08);
            }


            .mines-mini-btn:disabled,
            .mines-bet-input:disabled {

                opacity: .45;

                cursor: not-allowed;
            }



            /* ========================
               MINE OPTIONS
            ======================== */

            .mines-options {

                display: grid;

                grid-template-columns:
                    repeat(5, 1fr);

                gap: 7px;
            }


            .mines-option {

                border:
                    1px solid
                    rgba(255,255,255,0.09);

                background:
                    rgba(255,255,255,0.035);

                color: #b8c9dc;

                border-radius: 10px;

                padding: 10px 0;

                cursor: pointer;

                font-weight: 800;

                transition: .18s ease;
            }


            .mines-option:hover:not(:disabled) {

                transform:
                    translateY(-1px);

                border-color:
                    rgba(39,216,255,.36);
            }


            .mines-option.selected {

                color: white;

                border-color:
                    rgba(39,216,255,.58);

                background:
                    linear-gradient(
                        180deg,
                        rgba(39,216,255,.22),
                        rgba(58,141,255,.15)
                    );

                box-shadow:
                    inset 0 0 18px
                    rgba(39,216,255,.06);
            }


            .mines-option:disabled {

                opacity: .45;

                cursor: not-allowed;
            }



            /* ========================
               STATISTICS
            ======================== */

            .mines-stats {

                display: grid;

                grid-template-columns:
                    1fr 1fr;

                gap: 9px;

                margin: 20px 0;
            }


            .mines-stat {

                border:
                    1px solid
                    rgba(255,255,255,0.07);

                background:
                    rgba(255,255,255,0.025);

                border-radius: 12px;

                padding: 11px 12px;
            }


            .mines-stat-label {

                color: var(--mines-muted);

                font-size: .72rem;

                margin-bottom: 4px;
            }


            .mines-stat-value {

                font-size: 1rem;

                font-weight: 850;
            }


            .mines-stat-value.accent {

                color: var(--mines-cyan);
            }



            /* ========================
               BUTTONS
            ======================== */

            .mines-action,
            .mines-random {

                width: 100%;

                border: 0;

                border-radius: 12px;

                padding: 13px 16px;

                font: inherit;

                font-weight: 850;

                cursor: pointer;

                transition:
                    transform .16s ease,
                    filter .16s ease,
                    opacity .16s ease;
            }


            .mines-action {

                color: #06111d;

                background:
                    linear-gradient(
                        135deg,
                        var(--mines-cyan),
                        var(--mines-blue)
                    );

                box-shadow:
                    0 12px 28px
                    rgba(39,216,255,.16);
            }


            .mines-action.cashout {

                background:
                    linear-gradient(
                        135deg,
                        #65efad,
                        #2fc889
                    );
            }


            .mines-action:hover:not(:disabled),
            .mines-random:hover:not(:disabled) {

                transform:
                    translateY(-1px);

                filter:
                    brightness(1.08);
            }


            .mines-action:disabled,
            .mines-random:disabled {

                opacity: .42;

                cursor: not-allowed;

                transform: none;
            }


            .mines-random {

                margin-top: 9px;

                color: #c5d4e5;

                background:
                    rgba(255,255,255,.055);

                border:
                    1px solid
                    rgba(255,255,255,.08);
            }


            .mines-message {

                min-height: 40px;

                margin-top: 14px;

                color: var(--mines-muted);

                font-size: .78rem;

                line-height: 1.45;

                text-align: center;
            }


            .mines-message.good {

                color: var(--mines-green);
            }


            .mines-message.bad {

                color: var(--mines-red);
            }



            /* ========================
               GAME BOARD
            ======================== */

            .mines-board-wrap {

                display: flex;

                flex-direction: column;

                justify-content: center;

                min-width: 0;
            }


            .mines-board-top {

                width: min(100%, 720px);

                margin: 0 auto 14px;

                display: flex;

                justify-content: space-between;

                align-items: end;

                gap: 18px;
            }


            .mines-board-kicker {

                color: var(--mines-cyan);

                font-size: .72rem;

                font-weight: 850;

                letter-spacing: .13em;

                text-transform: uppercase;
            }


            .mines-board-title {

                font-size:
                    clamp(
                        1.45rem,
                        2vw,
                        2rem
                    );

                font-weight: 900;

                margin-top: 4px;
            }


            .mines-risk {

                color: var(--mines-muted);

                font-size: .8rem;

                text-align: right;

                line-height: 1.45;
            }


            .mines-board {

                position: relative;

                width: min(100%, 720px);

                aspect-ratio: 1 / 1;

                margin: 0 auto;

                display: grid;

                grid-template-columns:
                    repeat(5, 1fr);

                gap:
                    clamp(
                        7px,
                        1vw,
                        12px
                    );

                padding:
                    clamp(
                        8px,
                        1vw,
                        12px
                    );

                border:
                    1px solid
                    rgba(255,255,255,.055);

                background:
                    rgba(3, 9, 17, .38);

                border-radius: 24px;

                box-shadow:
                    0 30px 80px
                    rgba(0,0,0,.28);
            }

            /* ========================
            CASHOUT POPUP
            ======================== */

            .mines-cashout-popup {

                position: absolute;

                left: 50%;
                top: 50%;

                transform:
                    translate(-50%, -50%)
                    scale(0.85);

                z-index: 50;

                min-width: 180px;

                padding: 22px 28px;

                border-radius: 18px;

                background:
                    linear-gradient(
                        180deg,
                        #20384a,
                        #172b3b
                    );

                border:
                    4px solid var(--mines-green);

                box-shadow:
                    0 0 0 5px rgba(86, 227, 159, 0.12),
                    0 16px 45px rgba(0, 0, 0, 0.45),
                    0 0 30px rgba(86, 227, 159, 0.20);

                text-align: center;

                pointer-events: none;

                opacity: 0;

                visibility: hidden;

                transition:
                    opacity .18s ease,
                    transform .18s ease,
                    visibility .18s ease;
            }


            .mines-cashout-popup.visible {

                opacity: 1;

                visibility: visible;

                transform:
                    translate(-50%, -50%)
                    scale(1);
            }


            .mines-cashout-multiplier {

                color: var(--mines-green);

                font-size: 2rem;

                line-height: 1;

                font-weight: 900;
            }


            .mines-cashout-divider {

                width: 70%;

                height: 2px;

                margin: 14px auto;

                border-radius: 10px;

                background:
                    rgba(255,255,255,0.12);
            }


            .mines-cashout-win {

                color: var(--mines-green);

                font-size: 1.15rem;

                font-weight: 850;
            }


            .mines-cashout-win-label {

                display: block;

                color: var(--mines-muted);

                font-size: .67rem;

                font-weight: 700;

                text-transform: uppercase;

                letter-spacing: .09em;

                margin-bottom: 4px;
            }

            /* ========================
               TILES
            ======================== */

            .mines-tile {

                position: relative;

                border:
                    1px solid
                    rgba(255,255,255,.065);

                border-radius:
                    clamp(
                        9px,
                        1vw,
                        14px
                    );

                background:
                    linear-gradient(
                        180deg,
                        #273b50 0%,
                        #1d3043 100%
                    );

                box-shadow:
                    0 6px 0 #132536,
                    0 10px 20px
                    rgba(0,0,0,.16);

                cursor: pointer;

                overflow: hidden;

                transition:
                    transform .12s ease,
                    filter .12s ease,
                    border-color .12s ease;
            }


            .mines-tile::before {

                content: '';

                position: absolute;

                inset: 0;

                background:
                    linear-gradient(
                        135deg,
                        rgba(255,255,255,.08),
                        transparent 42%
                    );

                pointer-events: none;
            }


            .mines-tile:hover:not(:disabled) {

                transform:
                    translateY(-3px);

                filter:
                    brightness(1.13);

                border-color:
                    rgba(39,216,255,.28);
            }


            .mines-tile:disabled {

                cursor: default;
            }


            .mines-tile.safe {

                background:
                    linear-gradient(
                        180deg,
                        #173a48 0%,
                        #102b36 100%
                    );

                box-shadow:
                    0 4px 0 #0a2029,
                    inset 0 0 24px
                    rgba(39,216,255,.08);

                transform:
                    translateY(2px);
            }


            .mines-tile.mine {

                background:
                    linear-gradient(
                        180deg,
                        #4a2330 0%,
                        #341925 100%
                    );

                box-shadow:
                    0 4px 0 #26111a,
                    inset 0 0 25px
                    rgba(255,95,118,.10);

                transform:
                    translateY(2px);
            }


            .mines-tile.mine.faded {

                opacity: .58;
            }



            /* ========================
               GEM
            ======================== */

            .mines-gem {

                position: absolute;

                width: 39%;

                aspect-ratio: 1;

                left: 50%;

                top: 50%;

                transform:
                    translate(-50%, -50%)
                    rotate(45deg);

                border-radius:
                    18% 42% 18% 42%;

                background:
                    linear-gradient(
                        135deg,
                        #c9fbff 0 22%,
                        #54eaff 23% 58%,
                        #2f8fff 59% 100%
                    );

                border:
                    2px solid
                    rgba(255,255,255,.55);

                box-shadow:
                    0 0 18px
                    rgba(39,216,255,.35);

                animation:
                    mines-pop .18s ease-out;
            }


            .mines-gem::after {

                content: '';

                position: absolute;

                inset:
                    16% 50% 50% 16%;

                background:
                    rgba(255,255,255,.65);

                border-radius: 3px;
            }



            /* ========================
               BOMB
            ======================== */

            .mines-bomb {

                position: absolute;

                left: 50%;

                top: 52%;

                width: 39%;

                aspect-ratio: 1;

                transform:
                    translate(-50%, -50%);

                border-radius: 50%;

                background: #ff6078;

                border:
                    3px solid #ff9cac;

                box-shadow:
                    0 0 18px
                    rgba(255,95,118,.25);

                animation:
                    mines-pop .18s ease-out;
            }


            .mines-bomb::before {

                content: '';

                position: absolute;

                width: 33%;

                height: 30%;

                right: -15%;

                top: -18%;

                border-top:
                    4px solid #ffd36b;

                border-right:
                    4px solid #ffd36b;

                border-radius:
                    0 10px 0 0;

                transform:
                    rotate(-18deg);
            }


            .mines-bomb::after {

                content: '';

                position: absolute;

                width: 19%;

                height: 19%;

                right: -24%;

                top: -29%;

                border-radius: 50%;

                background: #fff08a;

                box-shadow:
                    0 0 10px #ffc857;
            }



            @keyframes mines-pop {

                from {
                    opacity: 0;
                    scale: .55;
                }

                to {
                    opacity: 1;
                    scale: 1;
                }
            }



            /* ========================
               RESPONSIVE
            ======================== */

            @media (max-width: 920px) {

                .mines-layout {

                    width:
                        min(
                            720px,
                            calc(100% - 24px)
                        );

                    grid-template-columns:
                        1fr;

                    align-items: start;

                    gap: 20px;

                    padding:
                        18px 0 28px;
                }


                .mines-sidebar {
                    order: 2;
                }


                .mines-board-wrap {
                    order: 1;
                }


                .mines-board {

                    max-height: 62vh;

                    max-width: 62vh;
                }
            }


            @media (max-width: 560px) {

                .mines-layout {

                    width:
                        calc(100% - 14px);
                }


                .mines-board-top {

                    padding: 0 4px;
                }


                .mines-risk {

                    display: none;
                }


                .mines-sidebar {

                    padding: 16px;

                    border-radius: 16px;
                }


                .mines-options {

                    gap: 5px;
                }


                .mines-option {

                    padding: 9px 0;
                }


                .mines-board {

                    border-radius: 16px;

                    gap: 6px;

                    padding: 7px;
                }


                .mines-tile {

                    border-radius: 8px;

                    box-shadow:
                        0 4px 0 #132536;
                }
            }
        `;



        // ================================
        // HTML
        // ================================

        const root =
            document.createElement('div');

        root.className = 'mines-game';


        root.innerHTML = `

            <div class="mines-layout">

                <aside class="mines-sidebar">

                    <div class="mines-heading">

                        <div>
                            <div class="mines-title">
                                Mines
                            </div>

                            <div class="mines-subtitle">
                                1% House Edge
                            </div>
                        </div>


                        <div class="mines-balance-chip">

                            <div class="mines-balance-label">
                                Balance
                            </div>

                            <div class="mines-balance">
                                1.000,00
                            </div>

                        </div>

                    </div>



                    <div class="mines-field">

                        <div class="mines-label-row">

                            <span class="mines-label">
                                Einsatz
                            </span>

                            <span class="mines-label-value">
                                Tokens
                            </span>

                        </div>


                        <div class="mines-bet-row">

                            <input
                                class="mines-bet-input"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value="10.00"
                                aria-label="Einsatz"
                            >


                            <button
                                class="
                                    mines-mini-btn
                                    mines-half
                                "
                                type="button"
                                title="Einsatz halbieren"
                            >
                                ½
                            </button>


                            <button
                                class="
                                    mines-mini-btn
                                    mines-double
                                "
                                type="button"
                                title="Einsatz verdoppeln"
                            >
                                2×
                            </button>

                        </div>

                    </div>



                    <div class="mines-field">

                        <div class="mines-label-row">

                            <span class="mines-label">
                                Minen
                            </span>

                            <span
                                class="
                                    mines-label-value
                                    mines-safe-count
                                "
                            >
                                22 sichere Felder
                            </span>

                        </div>


                        <div class="mines-options">

                            ${
                                MINE_OPTIONS
                                    .map(
                                        (value) => `
                                            <button
                                                class="
                                                    mines-option
                                                    ${
                                                        value ===
                                                        selectedMines
                                                            ? 'selected'
                                                            : ''
                                                    }
                                                "
                                                type="button"
                                                data-mines="${value}"
                                            >
                                                ${value}
                                            </button>
                                        `
                                    )
                                    .join('')
                            }

                        </div>

                    </div>



                    <div class="mines-stats">

                        <div class="mines-stat">

                            <div class="mines-stat-label">
                                Gefundene Gems
                            </div>

                            <div
                                class="
                                    mines-stat-value
                                    mines-gems-stat
                                "
                            >
                                0
                            </div>

                        </div>



                        <div class="mines-stat">

                            <div class="mines-stat-label">
                                Multiplier
                            </div>

                            <div
                                class="
                                    mines-stat-value
                                    accent
                                    mines-multiplier
                                "
                            >
                                1,00×
                            </div>

                        </div>



                        <div class="mines-stat">

                            <div class="mines-stat-label">
                                Mögliche Auszahlung
                            </div>

                            <div
                                class="
                                    mines-stat-value
                                    mines-payout
                                "
                            >
                                0,00
                            </div>

                        </div>



                        <div class="mines-stat">

                            <div class="mines-stat-label">
                                Nächster Gem
                            </div>

                            <div
                                class="
                                    mines-stat-value
                                    mines-next-multiplier
                                "
                            >
                                1,12×
                            </div>

                        </div>

                    </div>



                    <button
                        class="mines-action"
                        type="button"
                    >
                        Wette starten
                    </button>


                    <button
                        class="mines-random"
                        type="button"
                        disabled
                    >
                        Zufälliges Feld wählen
                    </button>


                    <div class="mines-message">
                        Wähle Einsatz und Minenanzahl
                        und starte die Runde.
                    </div>

                </aside>



                <section class="mines-board-wrap">

                    <div class="mines-board-top">

                        <div>

                            <div class="mines-board-kicker">
                                Risk / Reward
                            </div>

                            <div class="mines-board-title">
                                Finde die Edelsteine.
                            </div>

                        </div>


                        <div class="mines-risk">

                            Mehr Minen =
                            höherer Multiplikator.

                            <br>

                            Cashout jederzeit
                            nach dem ersten Gem.

                        </div>

                    </div>



                    <div
                        class="mines-board"
                        aria-label="Mines Spielfeld"
                    >

                            ${
                                Array
                                    .from(
                                        { length: BOARD_SIZE },
                                        (_, index) => `

                                            <button
                                                class="mines-tile"
                                                type="button"
                                                data-index="${index}"
                                                aria-label="Feld ${index + 1}"
                                                disabled
                                            >
                                            </button>

                                        `
                                    )
                                    .join('')
                            }


                            <div class="mines-cashout-popup">

                                <div class="mines-cashout-multiplier">
                                    1,00x
                                </div>

                                <div class="mines-cashout-divider"></div>

                                <div class="mines-cashout-win">

                                    <span class="mines-cashout-win-label">
                                        Gewinn
                                    </span>

                                    <span class="mines-cashout-win-value">
                                        0,00 Tokens
                                    </span>

                                </div>

                            </div>

                        </div>

                </section>

            </div>
        `;



        container.appendChild(style);
        container.appendChild(root);



        // ================================
        // DOM REFERENCES
        // ================================

        const balanceEl =
            root.querySelector(
                '.mines-balance'
            );

        const betInput =
            root.querySelector(
                '.mines-bet-input'
            );

        const halfBtn =
            root.querySelector(
                '.mines-half'
            );

        const doubleBtn =
            root.querySelector(
                '.mines-double'
            );


        const mineOptionButtons =
            [
                ...root.querySelectorAll(
                    '.mines-option'
                )
            ];


        const safeCountEl =
            root.querySelector(
                '.mines-safe-count'
            );


        const gemsStatEl =
            root.querySelector(
                '.mines-gems-stat'
            );


        const multiplierEl =
            root.querySelector(
                '.mines-multiplier'
            );


        const payoutEl =
            root.querySelector(
                '.mines-payout'
            );


        const nextMultiplierEl =
            root.querySelector(
                '.mines-next-multiplier'
            );


        const actionBtn =
            root.querySelector(
                '.mines-action'
            );


        const randomBtn =
            root.querySelector(
                '.mines-random'
            );


        const messageEl =
            root.querySelector(
                '.mines-message'
            );


        const tileButtons =
            [
                ...root.querySelectorAll(
                    '.mines-tile'
                )
            ];

        const cashoutPopup =
            root.querySelector(
                '.mines-cashout-popup'
            );


        const cashoutMultiplierEl =
            root.querySelector(
                '.mines-cashout-multiplier'
            );


        const cashoutWinEl =
            root.querySelector(
                '.mines-cashout-win-value'
            );



        // ================================
        // HELPERS
        // ================================
        const hideCashoutPopup = () => {

            cashoutPopup.classList.remove(
                'visible'
            );
        };


        const showCashoutPopup = (
            multiplier,
            payout
        ) => {

            cashoutMultiplierEl.textContent =
                `${
                    multiplier.toLocaleString(
                        'de-DE',
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    )
                }×`;


            cashoutWinEl.textContent =
                `${formatTokens(payout)} Tokens`;


            cashoutPopup.classList.add(
                'visible'
            );
        };
        const setMessage = (
            text,
            type = ''
        ) => {

            messageEl.textContent = text;

            messageEl.className =
                `mines-message${
                    type
                        ? ` ${type}`
                        : ''
                }`;
        };



        const getMultiplier = (
            gemCount = revealedGems
        ) => {

            if (gemCount <= 0) {
                return 1;
            }


            return (
                MULTIPLIER_TABLES[selectedMines]
                    [gemCount - 1]
                ?? 1
            );
        };



        const getNextMultiplier = () => {

            const table =
                MULTIPLIER_TABLES[
                    selectedMines
                ];


            return (
                table[
                    Math.min(
                        revealedGems,
                        table.length - 1
                    )
                ]
                ?? table[
                    table.length - 1
                ]
            );
        };



        const updateControlsLockedState = () => {

            betInput.disabled =
                roundActive;

            halfBtn.disabled =
                roundActive;

            doubleBtn.disabled =
                roundActive;


            mineOptionButtons.forEach(
                (button) => {

                    button.disabled =
                        roundActive;
                }
            );
        };



        const updateUI = () => {

            if (destroyed) {
                return;
            }


            balanceEl.textContent =
                formatTokens(balance);


            safeCountEl.textContent =
                `${
                    BOARD_SIZE -
                    selectedMines
                } sichere Felder`;


            gemsStatEl.textContent =
                String(revealedGems);


            multiplierEl.textContent =
                `${
                    currentMultiplier
                        .toLocaleString(
                            'de-DE',
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }
                        )
                }×`;


            payoutEl.textContent =
                formatTokens(
                    potentialPayout
                );


            nextMultiplierEl.textContent =
                `${
                    getNextMultiplier()
                        .toLocaleString(
                            'de-DE',
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }
                        )
                }×`;



            mineOptionButtons.forEach(
                (button) => {

                    button.classList.toggle(
                        'selected',
                        Number(
                            button.dataset.mines
                        ) === selectedMines
                    );
                }
            );


            updateControlsLockedState();



            if (roundActive) {

                actionBtn.classList.add(
                    'cashout'
                );


                actionBtn.textContent =
                    revealedGems > 0

                        ? `Cashout · ${
                            formatTokens(
                                potentialPayout
                            )
                        } Tokens`

                        : 'Cashout nach dem ersten Gem';


                actionBtn.disabled =
                    revealedGems === 0;


                randomBtn.disabled =
                    false;

            } else {

                actionBtn.classList.remove(
                    'cashout'
                );


                actionBtn.textContent =
                    'Wette starten';


                actionBtn.disabled =
                    balance < 0.01;


                randomBtn.disabled =
                    true;
            }
        };



        const resetBoardVisuals = () => {

            tileButtons.forEach(
                (tile) => {

                    tile.disabled = false;

                    tile.className =
                        'mines-tile';

                    tile.innerHTML = '';
                }
            );
        };



        const revealMine = (
            index,
            faded = false
        ) => {

            const tile =
                tileButtons[index];


            tile.classList.add(
                'mine'
            );


            if (faded) {

                tile.classList.add(
                    'faded'
                );
            }


            tile.innerHTML =
                '<span class="mines-bomb" aria-hidden="true"></span>';


            tile.disabled = true;
        };



        const revealGem = (index) => {

            const tile =
                tileButtons[index];


            tile.classList.add(
                'safe'
            );


            tile.innerHTML =
                '<span class="mines-gem" aria-hidden="true"></span>';


            tile.disabled = true;
        };



        const revealAllTiles = (
            hitMineIndex = null
        ) => {

            for (
                let index = 0;
                index < BOARD_SIZE;
                index++
            ) {

                // Bereits aufgedeckte Gems nicht nochmal verändern
                if (
                    revealedTiles.has(index) &&
                    !minePositions.has(index)
                ) {
                    continue;
                }


                if (
                    minePositions.has(index)
                ) {

                    // Die tatsächlich getroffene Mine bleibt voll sichtbar.
                    // Andere Minen werden etwas abgedunkelt.
                    const faded =
                        hitMineIndex !== null &&
                        index !== hitMineIndex;


                    revealMine(
                        index,
                        faded
                    );

                } else {

                    // Noch nicht gefundene sichere Felder ebenfalls zeigen
                    revealGem(index);
                }
            }
        };



        const endRound = () => {

            roundActive = false;


            tileButtons.forEach(
                (tile) => {

                    tile.disabled = true;
                }
            );


            updateUI();
        };



        // ================================
        // CASHOUT
        // ================================

        const cashOut = (
            automatic = false
        ) => {

            if (
                !roundActive ||
                revealedGems === 0
            ) {
                return;
            }


            const payout =
                potentialPayout;


            const finalMultiplier =
                currentMultiplier;


            const profit =
                payout - roundBet;


            balance += payout;


            playSound(
                sounds.cashout
            );


            // Nach Cashout das komplette Board zeigen
            revealAllTiles();


            endRound();


            // Multiplier + Gewinn zentral anzeigen
            showCashoutPopup(
                finalMultiplier,
                payout
            );


            services
                ?.highscores
                ?.saveHighscore?.(
                    'mines',
                    Number(
                        balance.toFixed(2)
                    )
                );


            setMessage(

                automatic

                    ? `Perfekte Runde! Alle sicheren Felder gefunden. +${
                        formatTokens(profit)
                    } Tokens Profit.`

                    : `Cashout erfolgreich: ${
                        formatTokens(payout)
                    } Tokens (${
                        profit >= 0 ? '+' : ''
                    }${
                        formatTokens(profit)
                    } Profit).`,

                'good'
            );
        };



        // ================================
        // LOSE
        // ================================

        const loseRound = (
            mineIndex
        ) => {


            hideCashoutPopup();

            playSound(
                sounds.hit
            );


            revealMine(
                mineIndex,
                false
            );


            revealAllTiles(
                mineIndex
            );


            potentialPayout = 0;

            currentMultiplier = 0;


            endRound();


            setMessage(
                `Mine getroffen. Einsatz von ${
                    formatTokens(roundBet)
                } Tokens verloren.`,
                'bad'
            );
        };



        // ================================
        // PICK TILE
        // ================================

        const pickTile = (index) => {

            if (
                !roundActive ||
                revealedTiles.has(index)
            ) {
                return;
            }


            revealedTiles.add(index);



            // Mine getroffen
            if (
                minePositions.has(index)
            ) {

                loseRound(index);

                return;
            }



            // Gem getroffen
            revealGem(index);

            playGemSound();


            revealedGems += 1;


            currentMultiplier =
                getMultiplier(
                    revealedGems
                );


            potentialPayout =
                roundBet *
                currentMultiplier;



            const totalSafeTiles =
                BOARD_SIZE -
                selectedMines;



            // Alle Gems gefunden
            if (
                revealedGems >=
                totalSafeTiles
            ) {

                updateUI();

                cashOut(true);

                return;
            }



            setMessage(

                `Gem gefunden. Cashout jetzt mit ${
                    currentMultiplier.toFixed(2)
                }× oder weiter riskieren.`,

                'good'
            );


            updateUI();
        };



        // ================================
        // START ROUND
        // ================================

        const startRound = () => {

            const parsedBet =
                Number.parseFloat(

                    betInput.value.replace?.(
                        ',',
                        '.'
                    )
                    ??
                    betInput.value
                );



            if (
                !Number.isFinite(
                    parsedBet
                )
                ||
                parsedBet <= 0
            ) {

                setMessage(
                    'Bitte gib einen gültigen Einsatz größer als 0 ein.',
                    'bad'
                );

                return;
            }



            if (
                parsedBet > balance
            ) {

                setMessage(
                    'Dein Einsatz ist höher als dein aktuelles Guthaben.',
                    'bad'
                );

                return;
            }



            betAmount =
                Math.round(
                    parsedBet * 100
                ) / 100;


            roundBet =
                betAmount;


            balance =
                Math.round(
                    (
                        balance -
                        roundBet
                    ) * 100
                ) / 100;



            roundActive = true;

            playSound(
                sounds.bet
            );

            minePositions =
                createMineSet(
                    selectedMines
                );


            revealedTiles =
                new Set();


            revealedGems = 0;

            currentMultiplier = 1;

            potentialPayout = 0;



            resetBoardVisuals();

            hideCashoutPopup();
            setMessage(
                `Runde gestartet: ${
                    selectedMines
                } Minen sind verdeckt im Feld verteilt.`
            );


            updateUI();
        };



        // ================================
        // BET INPUT
        // ================================

        const setBetInput = (value) => {

            const clamped =
                Math.max(
                    0.01,
                    Math.min(
                        balance,
                        Math.round(
                            value * 100
                        ) / 100
                    )
                );


            betAmount =
                clamped;


            betInput.value =
                clamped.toFixed(2);
        };



        // ================================
        // EVENTS
        // ================================

        mineOptionButtons.forEach(
            (button) => {

                button.addEventListener(
                    'click',
                    () => {

                        if (roundActive) {
                            return;
                        }


                        selectedMines =
                            Number(
                                button.dataset.mines
                            );


                        revealedGems = 0;

                        currentMultiplier = 1;

                        potentialPayout = 0;


                        setMessage(
                            `${
                                selectedMines
                            } Minen ausgewählt. ${
                                BOARD_SIZE -
                                selectedMines
                            } Felder sind sicher.`
                        );


                        updateUI();
                    }
                );
            }
        );



        betInput.addEventListener(
            'input',
            () => {

                const value =
                    Number.parseFloat(
                        betInput.value
                    );


                if (
                    Number.isFinite(value)
                ) {

                    betAmount = value;
                }
            }
        );



        halfBtn.addEventListener(
            'click',
            () => {

                setBetInput(

                    (
                        Number.parseFloat(
                            betInput.value
                        )
                        ||
                        betAmount
                    )
                    / 2
                );
            }
        );



        doubleBtn.addEventListener(
            'click',
            () => {

                setBetInput(

                    (
                        Number.parseFloat(
                            betInput.value
                        )
                        ||
                        betAmount
                    )
                    * 2
                );
            }
        );



        actionBtn.addEventListener(
            'click',
            () => {

                if (roundActive) {

                    cashOut(false);

                } else {

                    startRound();
                }
            }
        );



        randomBtn.addEventListener(
            'click',
            () => {

                if (!roundActive) {
                    return;
                }


                const available =
                    tileButtons

                        .map(
                            (_, index) =>
                                index
                        )

                        .filter(
                            (index) =>
                                !revealedTiles
                                    .has(index)
                        );


                if (
                    available.length === 0
                ) {
                    return;
                }


                pickTile(
                    available[
                        getRandomIndex(
                            available.length
                        )
                    ]
                );
            }
        );



        tileButtons.forEach(
            (tile) => {

                tile.addEventListener(
                    'click',
                    () => {

                        pickTile(
                            Number(
                                tile.dataset.index
                            )
                        );
                    }
                );
            }
        );



        // ================================
        // INITIAL STATE
        // ================================

        // Bei jedem Öffnen des Spiels
        // wieder 1000 Tokens.
        tileButtons.forEach(
            (tile) => {

                tile.disabled = true;
            }
        );


        updateUI();



        // ================================
        // DESTROY
        // ================================

        return {

            destroy: () => {

                destroyed = true;

                roundActive = false;


                Object.values(
                    sounds
                ).forEach(
                    (sound) => {

                        sound.pause();

                        sound.currentTime = 0;
                    }
                );


                gemSoundPool.forEach(
                    (sound) => {

                        sound.pause();

                        sound.currentTime = 0;
                    }
                );


                style.remove();
            }
        };
    }
};


// Optional exportiert,
// falls wir die Werte später testen wollen.
export {
    MULTIPLIER_TABLES,
    HOUSE_EDGE,
    MINE_OPTIONS
};