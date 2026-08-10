export default {
    manifest: {
        id: 'blackjack',
        name: 'Blackjack',
        description: 'Der Casino-Klassiker. Versuche näher an 21 Punkte zu kommen als der Dealer, ohne dich zu überkaufen.',
        icon: '🃏',
        tags: ['Karten', 'Casino', 'Logik']
    },
    init: (container, services) => {
        let deck = [];
        let playerHand = [];
        let dealerHand = [];
        let winStreak = 0;
        let gameActive = true;

        const style = document.createElement('style');
        style.textContent = `
            .bj-wrapper {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 2rem;
                color: #fff;
                background: radial-gradient(circle at 50% 50%, #1a3c28 0%, #0a1710 100%);
                overflow: hidden;
            }
            .bj-area {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
            }
            .bj-cards {
                display: flex;
                gap: 15px;
                min-height: 120px;
            }
            .bj-card {
                width: 80px;
                height: 120px;
                background: white;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2rem;
                font-weight: bold;
                box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                position: relative;
                
                /* Animations-Setup */
                opacity: 0;
                animation: dealCard 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
            .bj-card.red { color: #e63946; }
            .bj-card.black { color: #1d3557; }
            .bj-card.hidden {
                background: repeating-linear-gradient(45deg, #1d3557, #1d3557 10px, #457b9d 10px, #457b9d 20px);
                color: transparent;
            }
            .bj-controls {
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin-top: 1rem;
            }
            .bj-btn {
                padding: 0.8rem 1.5rem;
                border: none;
                border-radius: 25px;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                background: #00d4ff;
                color: #000;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .bj-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            .bj-btn:not(:disabled):hover {
                transform: translateY(-3px);
                box-shadow: 0 5px 15px rgba(0, 212, 255, 0.4);
            }
            .bj-message {
                text-align: center;
                font-size: 2rem;
                font-weight: bold;
                min-height: 2.5rem;
                text-shadow: 0 2px 4px rgba(0,0,0,0.8);
                transition: all 0.3s;
            }
            
            /* Status-Klassen für die Nachrichten */
            .bj-message.win {
                color: #00ff88;
                animation: winPulse 1.5s infinite;
            }
            .bj-message.lose {
                color: #ff3366;
                animation: shake 0.5s ease-in-out;
            }
            .bj-message.draw {
                color: #f4a261;
            }

            .bj-streak {
                position: absolute;
                top: 80px;
                right: 20px;
                background: rgba(0,0,0,0.5);
                padding: 0.5rem 1rem;
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,0.2);
            }

            /* Keyframe Definitionen */
            @keyframes dealCard {
                0% { transform: translateY(-150px) rotate(-15deg) scale(0.5); opacity: 0; }
                100% { transform: translateY(0) rotate(0) scale(1); opacity: 1; }
            }
            @keyframes winPulse {
                0%, 100% { text-shadow: 0 0 10px #00ff88; transform: scale(1); }
                50% { text-shadow: 0 0 30px #00ff88, 0 0 50px #00ff88; transform: scale(1.1); }
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
            <div class="bj-streak">Siegesserie: <span id="streak-counter">0</span></div>
            
            <div class="bj-area" id="dealer-area">
                <h2>Dealer: <span id="dealer-score">?</span></h2>
                <div class="bj-cards" id="dealer-cards"></div>
            </div>

            <div class="bj-message" id="game-message"></div>

            <div class="bj-area" id="player-area">
                <div class="bj-cards" id="player-cards"></div>
                <h2>Spieler: <span id="player-score">0</span></h2>
                
                <div class="bj-controls">
                    <button class="bj-btn" id="btn-hit">Karte ziehen</button>
                    <button class="bj-btn" id="btn-stand">Halten</button>
                    <button class="bj-btn" id="btn-restart" style="display: none;">Nächste Runde</button>
                </div>
            </div>
        `;
        container.appendChild(wrapper);

        const dealerCardsEl = wrapper.querySelector('#dealer-cards');
        const playerCardsEl = wrapper.querySelector('#player-cards');
        const dealerScoreEl = wrapper.querySelector('#dealer-score');
        const playerScoreEl = wrapper.querySelector('#player-score');
        const messageEl = wrapper.querySelector('#game-message');
        const streakEl = wrapper.querySelector('#streak-counter');

        const btnHit = wrapper.querySelector('#btn-hit');
        const btnStand = wrapper.querySelector('#btn-stand');
        const btnRestart = wrapper.querySelector('#btn-restart');

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

        // Erweiterte Render-Funktion für saubere Animationen
        const renderCards = (hand, containerEl, hideSecondCard = false, isHit = false) => {
            containerEl.innerHTML = '';
            hand.forEach((card, index) => {
                const cardEl = document.createElement('div');
                let className = 'bj-card';

                if (hideSecondCard && index === 1) {
                    className += ' hidden';
                } else {
                    className += ` ${card.suit.color}`;
                    cardEl.innerHTML = `${card.value}<br>${card.suit.icon}`;
                }

                cardEl.className = className;

                // Logik: Bei einem "Hit" wird nur die neu gezogene Karte animiert.
                // Beim Rundenstart fliegen die Karten zeitversetzt ein.
                if (!isHit) {
                    cardEl.style.animationDelay = `${index * 0.15}s`;
                } else if (index === hand.length - 1) {
                    cardEl.style.animationDelay = `0s`; // Neue Karte sofort animieren
                } else {
                    // Alte Karten statisch anzeigen
                    cardEl.style.animation = 'none';
                    cardEl.style.opacity = '1';
                }

                containerEl.appendChild(cardEl);
            });
        };

        const updateUI = (showDealerFull = false, isHit = false) => {
            // Die Berechnung wird direkt übergeben (kein pScore mehr nötig)
            playerScoreEl.innerText = calculateScore(playerHand);
            renderCards(playerHand, playerCardsEl, false, isHit);

            if (showDealerFull) {
                // Die Berechnung wird direkt übergeben (kein dScore mehr nötig)
                dealerScoreEl.innerText = calculateScore(dealerHand);
                renderCards(dealerHand, dealerCardsEl, false, isHit);
            } else {
                // Auch hier direktes Einsetzen für die verdeckte Dealer-Karte
                dealerScoreEl.innerText = calculateScore([dealerHand[0]]) + ' + ?';
                renderCards(dealerHand, dealerCardsEl, true, isHit);
            }
        };

        const endGame = (message, status) => {
            gameActive = false;
            btnHit.disabled = true;
            btnStand.disabled = true;

            // Verzögert den Neustart-Button leicht, damit die Animationen wirken
            setTimeout(() => {
                btnRestart.style.display = 'block';
            }, 600);

            updateUI(true, true);

            // Klassen-Zuweisung für CSS-Effekte
            messageEl.className = `bj-message ${status}`;
            messageEl.innerText = message;

            if (status === 'win') {
                winStreak++;
                services.highscores.saveHighscore('blackjack', winStreak);
            } else if (status === 'lose') {
                winStreak = 0;
            }
            streakEl.innerText = winStreak;
        };

        const startRound = () => {
            createDeck();
            playerHand = [deck.pop(), deck.pop()];
            dealerHand = [deck.pop(), deck.pop()];

            gameActive = true;
            btnHit.disabled = false;
            btnStand.disabled = false;
            btnRestart.style.display = 'none';

            messageEl.className = 'bj-message';
            messageEl.innerText = '';

            updateUI(false, false);

            if (calculateScore(playerHand) === 21) {
                endGame('Blackjack! Du gewinnst.', 'win');
            }
        };

        btnHit.addEventListener('click', () => {
            if (!gameActive) return;
            playerHand.push(deck.pop());
            updateUI(false, true);

            if (calculateScore(playerHand) > 21) {
                endGame('Überkauft! Du verlierst.', 'lose');
            }
        });

        btnStand.addEventListener('click', () => {
            if (!gameActive) return;

            // Simuliert eine kleine Denkpause des Dealers für mehr Spannung
            btnHit.disabled = true;
            btnStand.disabled = true;

            const dealerPlay = () => {
                if (calculateScore(dealerHand) < 17) {
                    dealerHand.push(deck.pop());
                    updateUI(true, true);
                    setTimeout(dealerPlay, 500); // Nächste Karte zeitverzögert ziehen
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
                    endGame('Dealer gewinnt!', 'lose');
                } else {
                    endGame('Unentschieden! (Push)', 'draw');
                }
            };

            updateUI(true, false);
            setTimeout(dealerPlay, 500);
        });

        btnRestart.addEventListener('click', startRound);

        startRound();

        return {
            destroy: () => {}
        };
    }
};