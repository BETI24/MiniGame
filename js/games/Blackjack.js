export default {
    manifest: {
        id: 'blackjack',
        name: 'Blackjack',
        description: 'Der Casino-Klassiker.',
        icon: '🃏',
        imageUrl: 'js/assets/images/blackjack.png',
        tags: ['Karten', 'Casino', 'Logik']
    },
    init: (container, services) => {
        // --- State Management ---
        let deck = [];
        let playerHand = [];
        let dealerHand = [];
        let gameActive = false;

        let balance = 1000;
        let currentBet = 0;

        let recordBalance = services.highscores.getHighscore('blackjack') || 0;

        const style = document.createElement('style');
        style.textContent = `
            .bj-wrapper {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 2rem;
                color: #ffffff;
                /* Neuer moderner Dark-Mode Hintergrund mit Neon-Akzenten */
                background-color: #0b0b0e;
                background-image: 
                    radial-gradient(circle at 15% 80%, rgba(0, 212, 255, 0.08) 0%, transparent 40%),
                    radial-gradient(circle at 85% 20%, rgba(255, 51, 102, 0.08) 0%, transparent 40%);
                overflow: hidden;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .bj-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                /* Glassmorphismus für den Header */
                background: rgba(20, 20, 30, 0.4);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                padding: 1rem 1.5rem;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.05);
                box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
            }
            .bj-stats {
                font-size: 1.2rem;
                font-weight: bold;
                letter-spacing: 0.5px;
            }
            .val-balance { color: #00d4ff; text-shadow: 0 0 10px rgba(0, 212, 255, 0.4); }
            .val-bet { color: #f4a261; text-shadow: 0 0 10px rgba(244, 162, 97, 0.4); }
            .bj-record {
                color: #ffd700;
                font-weight: bold;
                background: rgba(255, 215, 0, 0.1);
                padding: 0.4rem 1rem;
                border-radius: 20px;
                border: 1px solid rgba(255, 215, 0, 0.3);
                text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
            }
            .bj-area {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1.5rem;
            }
            .bj-area h2 {
                font-size: 1.2rem;
                color: #8b8b9f;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin: 0;
            }
            .bj-area h2 span {
                color: #ffffff;
                font-size: 1.5rem;
            }
            .bj-cards {
                display: flex;
                gap: 15px;
                min-height: 130px;
            }
            
            /* Neue Dark-Neon Karten */
            .bj-card {
                width: 85px;
                height: 130px;
                background: rgba(15, 15, 20, 0.85);
                backdrop-filter: blur(5px);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2.2rem;
                font-weight: bold;
                box-shadow: 0 10px 20px rgba(0,0,0,0.6), inset 0 0 15px rgba(0,0,0,0.8);
                position: relative;
                opacity: 0;
                animation: dealCard 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                border: 1px solid rgba(255,255,255,0.05);
            }
            .bj-card.red { 
                border-color: rgba(255, 51, 102, 0.5); 
                color: #ff3366; 
                text-shadow: 0 0 12px rgba(255, 51, 102, 0.6);
            }
            .bj-card.black { 
                border-color: rgba(0, 212, 255, 0.5); 
                color: #00d4ff; 
                text-shadow: 0 0 12px rgba(0, 212, 255, 0.6);
            }
            .bj-card.hidden {
                background: repeating-linear-gradient(45deg, #1a1a24, #1a1a24 10px, #2a2a35 10px, #2a2a35 20px);
                border-color: #333;
                box-shadow: inset 0 0 20px rgba(0,0,0,0.9);
                color: transparent;
            }
            
            .bj-controls {
                display: flex;
                justify-content: center;
                flex-wrap: wrap;
                gap: 1rem;
                margin-top: 1rem;
            }
            
            /* Glassmorphism Buttons */
            .bj-btn {
                padding: 0.8rem 1.8rem;
                border-radius: 30px;
                font-size: 1rem;
                font-weight: 700;
                cursor: pointer;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #ffffff;
                backdrop-filter: blur(8px);
                transition: all 0.3s ease;
            }
            
            .bj-btn.bet-btn { border-color: rgba(244, 162, 97, 0.4); color: #f4a261; }
            .bj-btn.bet-btn:hover:not(:disabled) { background: rgba(244, 162, 97, 0.2); box-shadow: 0 0 15px rgba(244, 162, 97, 0.3); }
            
            .bj-btn.action-btn { border-color: rgba(0, 212, 255, 0.4); color: #00d4ff; }
            .bj-btn.action-btn:hover:not(:disabled) { background: rgba(0, 212, 255, 0.2); box-shadow: 0 0 15px rgba(0, 212, 255, 0.4); }
            
            .bj-btn.danger-btn { border-color: rgba(255, 51, 102, 0.4); color: #ff3366; }
            .bj-btn.danger-btn:hover:not(:disabled) { background: rgba(255, 51, 102, 0.2); box-shadow: 0 0 15px rgba(255, 51, 102, 0.4); }
            
            .bj-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
                transform: none !important;
                box-shadow: none !important;
            }
            .bj-btn:not(:disabled):hover {
                transform: translateY(-3px);
            }
            
            .bj-message {
                text-align: center;
                font-size: 1.8rem;
                font-weight: 800;
                min-height: 2.5rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                transition: all 0.3s;
            }
            
            .bj-message.win { color: #00ff88; animation: winPulse 1.5s infinite; }
            .bj-message.lose { color: #ff3366; animation: shake 0.5s ease-in-out; }
            .bj-message.draw { color: #f4a261; }
            
            @keyframes dealCard {
                0% { transform: translateY(-100px) scale(0.8); opacity: 0; }
                100% { transform: translateY(0) scale(1); opacity: 1; }
            }
            @keyframes winPulse {
                0%, 100% { text-shadow: 0 0 10px rgba(0, 255, 136, 0.5); transform: scale(1); }
                50% { text-shadow: 0 0 25px rgba(0, 255, 136, 0.8); transform: scale(1.05); }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                20%, 60% { transform: translateX(-10px); }
                40%, 80% { transform: translateX(10px); }
            }
        `;
        container.appendChild(style);

        const wrapper = document.createElement('div');
        wrapper.className = 'bj-wrapper';

        wrapper.innerHTML = `
            <div class="bj-header">
                <div class="bj-stats">
                    Guthaben: $<span id="balance-display" class="val-balance">1000</span> &nbsp;|&nbsp; 
                    Einsatz: $<span id="bet-display" class="val-bet">0</span>
                </div>
                <div class="bj-record">Rekord: $<span id="record-counter">${recordBalance}</span></div>
            </div>
            
            <div class="bj-area" id="dealer-area">
                <h2>Dealer <span id="dealer-score">?</span></h2>
                <div class="bj-cards" id="dealer-cards"></div>
            </div>

            <div class="bj-message" id="game-message">Bitte Einsatz wählen</div>

            <div class="bj-area" id="player-area">
                <div class="bj-cards" id="player-cards"></div>
                <h2>Spieler <span id="player-score">0</span></h2>
                
                <div class="bj-controls" id="betting-controls">
                    <button class="bj-btn bet-btn" id="btn-bet-10">+$10</button>
                    <button class="bj-btn bet-btn" id="btn-bet-50">+$50</button>
                    <button class="bj-btn bet-btn" id="btn-bet-100">+$100</button>
                    <button class="bj-btn bet-btn" id="btn-bet-all">All-In</button>
                    <button class="bj-btn" id="btn-bet-clear">Löschen</button>
                    <button class="bj-btn action-btn" id="btn-deal" disabled>Karten geben</button>
                </div>

                <div class="bj-controls" id="playing-controls" style="display: none;">
                    <button class="bj-btn action-btn" id="btn-hit">Karte ziehen</button>
                    <button class="bj-btn" id="btn-stand">Halten</button>
                    <button class="bj-btn action-btn" id="btn-restart" style="display: none;">Nächste Runde</button>
                    <button class="bj-btn danger-btn" id="btn-bankrupt" style="display: none;">Neues Geld holen ($1000)</button>
                </div>
            </div>
        `;
        container.appendChild(wrapper);

        // --- UI Referenzen ---
        const dealerCardsEl = wrapper.querySelector('#dealer-cards');
        const playerCardsEl = wrapper.querySelector('#player-cards');
        const dealerScoreEl = wrapper.querySelector('#dealer-score');
        const playerScoreEl = wrapper.querySelector('#player-score');
        const messageEl = wrapper.querySelector('#game-message');
        const recordEl = wrapper.querySelector('#record-counter');
        const balanceDisplay = wrapper.querySelector('#balance-display');
        const betDisplay = wrapper.querySelector('#bet-display');

        const bettingControls = wrapper.querySelector('#betting-controls');
        const playingControls = wrapper.querySelector('#playing-controls');

        const btnBet10 = wrapper.querySelector('#btn-bet-10');
        const btnBet50 = wrapper.querySelector('#btn-bet-50');
        const btnBet100 = wrapper.querySelector('#btn-bet-100');
        const btnBetAll = wrapper.querySelector('#btn-bet-all');
        const btnBetClear = wrapper.querySelector('#btn-bet-clear');
        const btnDeal = wrapper.querySelector('#btn-deal');

        const btnHit = wrapper.querySelector('#btn-hit');
        const btnStand = wrapper.querySelector('#btn-stand');
        const btnRestart = wrapper.querySelector('#btn-restart');
        const btnBankrupt = wrapper.querySelector('#btn-bankrupt');

        // --- Logik für Geld & Einsätze ---
        const updateMoneyUI = () => {
            balanceDisplay.innerText = balance;
            betDisplay.innerText = currentBet;

            btnDeal.disabled = currentBet === 0;
            btnBet10.disabled = balance < 10;
            btnBet50.disabled = balance < 50;
            btnBet100.disabled = balance < 100;
            btnBetAll.disabled = balance === 0;
            btnBetClear.disabled = currentBet === 0;
        };

        const placeBet = (amount) => {
            if (balance >= amount) {
                balance -= amount;
                currentBet += amount;
                updateMoneyUI();
            }
        };

        btnBet10.addEventListener('click', () => placeBet(10));
        btnBet50.addEventListener('click', () => placeBet(50));
        btnBet100.addEventListener('click', () => placeBet(100));

        btnBetAll.addEventListener('click', () => {
            if (balance > 0) {
                currentBet += balance;
                balance = 0;
                updateMoneyUI();
            }
        });

        btnBetClear.addEventListener('click', () => {
            balance += currentBet;
            currentBet = 0;
            updateMoneyUI();
        });

        btnBankrupt.addEventListener('click', () => {
            balance = 1000;
            startBettingPhase();
        });

        // --- Kartendeck Logik ---
        const suits = [{ id: 'H', icon: '♥', color: 'red' }, { id: 'D', icon: '♦', color: 'red' }, { id: 'C', icon: '♣', color: 'black' }, { id: 'S', icon: '♠', color: 'black' }];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        const createDeck = () => {
            deck = [];
            for (let suit of suits) {
                for (let value of values) {
                    deck.push({ value, suit });
                }
            }
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
        };

        const calculateScore = (hand) => {
            let score = 0;
            let aces = 0;
            for (let card of hand) {
                if (['J', 'Q', 'K'].includes(card.value)) {
                    score += 10;
                } else if (card.value === 'A') {
                    score += 11;
                    aces += 1;
                } else {
                    score += parseInt(card.value);
                }
            }
            while (score > 21 && aces > 0) {
                score -= 10;
                aces -= 1;
            }
            return score;
        };

        const renderCards = (hand, containerEl, hideSecondCard = false, isHit = false) => {
            if (!isHit) containerEl.innerHTML = '';

            hand.forEach((card, index) => {
                const existingCard = containerEl.children[index];

                if (existingCard) {
                    if (hideSecondCard && index === 1) {
                        existingCard.className = 'bj-card hidden';
                        existingCard.innerHTML = '';
                    } else {
                        existingCard.className = `bj-card ${card.suit.color}`;
                        existingCard.innerHTML = `${card.value}<br>${card.suit.icon}`;
                        existingCard.style.animation = 'none';
                        existingCard.style.opacity = '1';
                    }
                } else {
                    const cardEl = document.createElement('div');
                    if (hideSecondCard && index === 1) {
                        cardEl.className = 'bj-card hidden';
                    } else {
                        cardEl.className = `bj-card ${card.suit.color}`;
                        cardEl.innerHTML = `${card.value}<br>${card.suit.icon}`;
                    }
                    cardEl.style.animationDelay = !isHit ? `${index * 0.15}s` : `0s`;
                    containerEl.appendChild(cardEl);
                }
            });
        };

        const updateUI = (showDealerFull = false, isHit = false) => {
            playerScoreEl.innerText = calculateScore(playerHand);
            renderCards(playerHand, playerCardsEl, false, isHit);

            if (showDealerFull) {
                dealerScoreEl.innerText = calculateScore(dealerHand);
                renderCards(dealerHand, dealerCardsEl, false, isHit);
            } else {
                dealerScoreEl.innerText = calculateScore([dealerHand[0]]) + ' + ?';
                renderCards(dealerHand, dealerCardsEl, true, isHit);
            }
        };

        // --- Spielablauf ---
        const startBettingPhase = () => {
            gameActive = false;

            bettingControls.style.display = 'flex';
            playingControls.style.display = 'none';
            btnRestart.style.display = 'none';
            btnBankrupt.style.display = 'none';

            playerCardsEl.innerHTML = '';
            dealerCardsEl.innerHTML = '';
            playerScoreEl.innerText = '0';
            dealerScoreEl.innerText = '?';

            messageEl.className = 'bj-message';
            messageEl.innerText = 'Bitte Einsatz wählen';

            updateMoneyUI();
        };

        const endGame = (message, status) => {
            gameActive = false;
            btnHit.disabled = true;
            btnStand.disabled = true;

            updateUI(true, true);
            messageEl.className = `bj-message ${status}`;
            messageEl.innerText = message;

            if (status === 'win') {
                balance += currentBet * 2;
            } else if (status === 'blackjack') {
                balance += Math.floor(currentBet * 2.5);
            } else if (status === 'draw') {
                balance += currentBet;
            }

            services.highscores.saveHighscore('blackjack', balance);

            recordBalance = services.highscores.getHighscore('blackjack');
            recordEl.innerText = recordBalance;

            currentBet = 0;
            updateMoneyUI();

            setTimeout(() => {
                if (balance === 0) {
                    btnBankrupt.style.display = 'block';
                } else {
                    btnRestart.style.display = 'block';
                }
            }, 600);
        };

        const startRound = () => {
            createDeck();
            playerHand = [deck.pop(), deck.pop()];
            dealerHand = [deck.pop(), deck.pop()];

            gameActive = true;
            bettingControls.style.display = 'none';
            playingControls.style.display = 'flex';

            btnHit.disabled = false;
            btnStand.disabled = false;

            messageEl.className = 'bj-message';
            messageEl.innerText = '';

            updateUI(false, false);

            if (calculateScore(playerHand) === 21) {
                endGame('Blackjack! Du gewinnst (3:2).', 'blackjack');
            }
        };

        btnDeal.addEventListener('click', startRound);
        btnRestart.addEventListener('click', startBettingPhase);

        btnHit.addEventListener('click', () => {
            if (!gameActive) return;
            playerHand.push(deck.pop());
            updateUI(false, true);

            if (calculateScore(playerHand) > 21) {
                endGame('Überkauft! Du verlierst deinen Einsatz.', 'lose');
            }
        });

        btnStand.addEventListener('click', () => {
            if (!gameActive) return;

            btnHit.disabled = true;
            btnStand.disabled = true;

            const dealerPlay = () => {
                if (calculateScore(dealerHand) < 17) {
                    dealerHand.push(deck.pop());
                    updateUI(true, true);
                    setTimeout(dealerPlay, 500);
                } else {
                    evaluateWinner();
                }
            };

            const evaluateWinner = () => {
                const pScore = calculateScore(playerHand);
                const dScore = calculateScore(dealerHand);

                if (dScore > 21) {
                    endGame('Dealer überkauft! Du gewinnst.', 'win');
                } else if (pScore > dScore) {
                    endGame('Du gewinnst!', 'win');
                } else if (dScore > pScore) {
                    endGame('Dealer gewinnt.', 'lose');
                } else {
                    endGame('Unentschieden! (Push)', 'draw');
                }
            };

            updateUI(true, true);
            setTimeout(dealerPlay, 500);
        });

        startBettingPhase();

        return {
            destroy: () => {}
        };
    }
};