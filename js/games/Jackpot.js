export default {
    manifest: {
        id: 'neon-jackpot-roulette',
        name: 'Cyber-Jackpot Royale',
        description: 'Setze deine Credits in den Pot. Je höher dein Einsatz, desto krasser deine Gewinnchance. High Roller Casino Action.',
        icon: '🎰',
        imageUrl: 'js/assets/images/CyberJackpot.png',
        tags: ['Casino', 'Jackpot', 'Gambling', 'Neon']
    },
    init: (container, services) => {
        // --- Spielzustand & Timer-Logik ---
        let game = {
            balance: 1000,
            totalPot: 0,
            players: [],
            isSpinning: false,
            isPaused: false,
            pauseTimeLeft: 0,
            spinProgress: 0,
            spinDuration: 4.0,
            currentAngle: 0,
            targetAngle: 0,
            roundTimeLeft: 15,
            gameActive: true,
            winnerData: null,
            entities: { particles: [], floatingTexts: [], rings: [] },
            score: 1000
        };

        let animationId;
        let lastTime = performance.now();
        const CANVAS_WIDTH = 800;
        const CANVAS_HEIGHT = 420;

        const botNames = ['CyberShark', 'NeonGamble', 'MatrixKing', 'ViperX', 'GlitchQueen', 'BitMaster', 'CryptoNode', 'ZeroCool'];
        const distinctColors = ['#00b386', '#ffaa00', '#ff3366', '#3b4663', '#0088ff', '#bf00ff', '#ff007f', '#2ecc71'];

        const getPlayerColor = (index, isUser) => {
            if (isUser) return '#00ffcc'; // Eigener Spieler behält sein sauberes Türkis[cite: 17]
            return distinctColors[index % distinctColors.length];
        };

        // --- Design-Anpassungen ---
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Inter:wght@400;600;800&display=swap');

            .jp-wrapper {
                width: 100%;
                height: 100%;
                display: flex;
                background-color: #06070a;
                color: #ffffff;
                font-family: 'Inter', sans-serif;
                user-select: none;
                overflow: hidden;
                border-radius: 12px;
                box-sizing: border-box;
                position: relative;
            }

            .jp-wrapper * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }

            /* Exakt zentriertes Ingame-Fehler-Banner */
            .jp-toast {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                background: rgba(255, 51, 102, 0.95);
                color: #ffffff;
                padding: 14px 28px;
                border-radius: 10px;
                font-family: 'Orbitron', sans-serif;
                font-size: 1rem;
                font-weight: 700;
                box-shadow: 0 4px 25px rgba(255, 51, 102, 0.5);
                z-index: 100;
                opacity: 0;
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
                pointer-events: none;
            }
            .jp-toast.show {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }

            .jp-left-sidebar {
                width: 260px;
                background: #0c0e15;
                border-right: 1px solid #1a1e29;
                display: flex;
                flex-direction: column;
                padding: 20px;
                z-index: 10;
            }

            .jp-left-sidebar h4 {
                font-size: 0.8rem;
                color: #7b88a8;
                text-transform: uppercase;
                margin-bottom: 12px;
                font-family: 'Orbitron', sans-serif;
                letter-spacing: 1px;
            }

            .jp-players-list {
                display: flex;
                flex-direction: column;
                gap: 6px;
                overflow-y: auto;
                max-height: 100%;
            }

            .jp-player-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.85rem;
                background: #131722;
                padding: 8px 12px;
                border-radius: 8px;
                border: 1px solid #222838;
                border-left: 3px solid #00ffcc;
            }

            .jp-game-main {
                flex: 1;
                display: flex;
                flex-direction: column;
                position: relative;
                background: radial-gradient(circle at center, #101420 0%, #06070a 100%);
                overflow: hidden;
            }

            /* Leichtes Cyber-Grid im Hintergrund */
            .jp-game-main::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                background-size: 30px 30px;
                pointer-events: none;
                z-index: 1;
            }

            .jp-top-hud {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 10px;
                background: rgba(12, 14, 21, 0.8);
                border-bottom: 1px solid #1a1e29;
                z-index: 5;
                gap: 20px;
            }

            .jp-timer-badge {
                display: flex;
                align-items: center;
                gap: 10px;
                background: #131722;
                border: 2px solid #00ffcc;
                padding: 6px 16px;
                border-radius: 30px;
                box-shadow: 0 0 15px rgba(0, 255, 204, 0.25);
            }

            .jp-timer-badge .label {
                font-size: 0.75rem;
                color: #7b88a8;
                text-transform: uppercase;
                font-family: 'Orbitron', sans-serif;
                letter-spacing: 1px;
            }

            .jp-timer-badge .value {
                font-family: 'Orbitron', sans-serif;
                font-size: 1.1rem;
                font-weight: 900;
                color: #00ffcc;
                text-shadow: 0 0 10px rgba(0, 255, 204, 0.5);
            }

            .jp-pot-badge {
                display: flex;
                align-items: center;
                gap: 10px;
                background: #131722;
                border: 2px solid #ff3366;
                padding: 6px 16px;
                border-radius: 30px;
                box-shadow: 0 0 15px rgba(255, 51, 102, 0.25);
            }

            .jp-pot-badge .label {
                font-size: 0.75rem;
                color: #7b88a8;
                text-transform: uppercase;
                font-family: 'Orbitron', sans-serif;
                letter-spacing: 1px;
            }

            .jp-pot-badge .value {
                font-family: 'Orbitron', sans-serif;
                font-size: 1.1rem;
                font-weight: 900;
                color: #ff3366;
                text-shadow: 0 0 10px rgba(255, 51, 102, 0.5);
            }

            .jp-canvas-arena {
                flex: 1;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2;
            }

            .jp-canvas-arena canvas {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }

            .jp-center-info {
                position: absolute;
                top: 25px;
                z-index: 4;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                pointer-events: none;
            }

            #jp-centerSub {
                font-family: 'Orbitron', sans-serif;
                font-size: 1.1rem;
                font-weight: 900;
                color: #ffffff;
                letter-spacing: 2px;
                text-transform: uppercase;
                text-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
            }

            .jp-bottom-panel {
                background: #0c0e15;
                border-top: 1px solid #1a1e29;
                padding: 15px 25px;
                display: flex;
                flex-direction: column;
                gap: 15px;
                z-index: 10;
            }

            .jp-bottom-row {
                display: flex;
                gap: 20px;
                align-items: center;
                justify-content: center;
            }

            /* Guthaben-Box und Input mittig gruppiert */
            .jp-bet-control-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
                flex: 1;
                max-width: 380px;
            }

            .jp-balance-box-inline {
                background: #131722;
                padding: 6px 14px;
                border-radius: 8px;
                border: 1px solid #222838;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .jp-balance-box-inline .label { 
                font-size: 0.75rem; 
                color: #7b88a8; 
                text-transform: uppercase; 
                font-weight: 600; 
                font-family: 'Orbitron', sans-serif;
                letter-spacing: 0.5px;
            }
            .jp-balance-box-inline .amount { 
                font-family: 'Orbitron', sans-serif; 
                font-size: 0.95rem; 
                font-weight: 700; 
                color: #00ffcc; 
                text-shadow: 0 0 8px rgba(0, 255, 204, 0.3); 
            }

            .jp-input-section {
                display: flex;
                gap: 10px;
                align-items: center;
                width: 100%;
            }

            .jp-input-wrapper { position: relative; display: flex; align-items: center; flex: 1; }
            .jp-input-wrapper input {
                width: 100%;
                background: #131722;
                border: 2px solid #222838;
                border-radius: 10px;
                color: white;
                padding: 10px 40px 10px 15px;
                font-family: 'Orbitron', sans-serif;
                font-size: 0.95rem;
                outline: none;
                transition: border-color 0.2s;
            }
            .jp-input-wrapper input:focus { border-color: #00ffcc; }
            .jp-currency-tag { position: absolute; right: 15px; color: #7b88a8; font-weight: bold; }

            .jp-quick-buttons { display: flex; gap: 5px; }
            .jp-quick-btn {
                background: #131722;
                border: 1px solid #222838;
                color: #a0aec0;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 0.75rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.1s;
            }
            .jp-quick-btn:hover { background: #1c2333; color: white; border-color: #3b4663; }

            .jp-action-btn {
                background: linear-gradient(135deg, #00ffcc 0%, #00b386 100%);
                color: #06070a;
                border: none;
                border-radius: 10px;
                padding: 12px 24px;
                font-family: 'Orbitron', sans-serif;
                font-size: 1rem;
                font-weight: 900;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0, 255, 204, 0.4);
                transition: all 0.1s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .jp-action-btn:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 6px 25px rgba(0, 255, 204, 0.6); }
            .jp-action-btn:active { transform: translateY(0); }
            .jp-action-btn:disabled { background: #1a1e29; color: #4a5568; box-shadow: none; cursor: not-allowed; transform: none !important; }

            .jp-win-banner {
                position: absolute; top: 50%; left: 50%;
                transform: translate(-50%, -50%) scale(0);
                z-index: 20;
                background: linear-gradient(135deg, rgba(0, 255, 204, 0.9), rgba(0, 150, 120, 0.9));
                padding: 30px 60px; border-radius: 20px; border: 3px solid #fff;
                text-align: center; box-shadow: 0 0 50px rgba(0, 255, 204, 0.8);
                pointer-events: none; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .jp-win-banner.show { transform: translate(-50%, -50%) scale(1); }
            .jp-win-banner h2 { font-family: 'Orbitron', sans-serif; font-size: 2.5rem; color: #06070a; text-transform: uppercase; font-weight: 900; }
            .jp-win-banner .jp-win-amount { font-family: 'Orbitron', sans-serif; font-size: 2rem; color: #ffffff; font-weight: 900; text-shadow: 0 2px 10px rgba(0,0,0,0.5); margin-top: 5px; }
        `;
        container.appendChild(style);

        // --- DOM-Struktur ---
        const wrapper = document.createElement('div');
        wrapper.className = 'jp-wrapper';

        wrapper.innerHTML = `
            <div class="jp-toast" id="jp-toastMsg">Nicht genug Guthaben!</div>
            
            <div class="jp-left-sidebar">
                <h4>Teilnehmer im Pot</h4>
                <div class="jp-players-list" id="jp-playersList"></div>
            </div>

            <div class="jp-game-main">
                <div class="jp-win-banner" id="jp-winBanner">
                    <h2>JACKPOT!</h2>
                    <div class="jp-win-amount" id="jp-winBannerAmount">+0.00 €</div>
                </div>

                <div class="jp-top-hud">
                    <div class="jp-timer-badge">
                        <span class="label">Nächster Roll in:</span>
                        <span class="value" id="jp-timer">15.0s</span>
                    </div>
                    <div class="jp-pot-badge">
                        <span class="label">Gesamt-Pot:</span>
                        <span class="value" id="jp-potTop">0 €</span>
                    </div>
                </div>
                
                <div class="jp-canvas-arena">
                    <div class="jp-center-info">
                        <div id="jp-centerSub">BEREIT ZUR RUNDE</div>
                    </div>
                    <canvas id="jp-canvas"></canvas>
                </div>

                <div class="jp-bottom-panel">
                    <div class="jp-bottom-row">
                        <div class="jp-bet-control-group">
                            <div class="jp-balance-box-inline">
                                <span class="label">Guthaben:</span>
                                <span class="amount" id="jp-balance">1.000,00 €</span>
                            </div>
                            <div class="jp-input-section">
                                <div class="jp-input-wrapper">
                                    <input type="number" id="jp-betInput" value="200" min="10" max="5000">
                                    <span class="jp-currency-tag">€</span>
                                </div>
                                <div class="jp-quick-buttons">
                                    <button class="jp-quick-btn" id="btn-half">1/2</button>
                                    <button class="jp-quick-btn" id="btn-double">2X</button>
                                    <button class="jp-quick-btn" id="btn-max">MAX</button>
                                </div>
                            </div>
                        </div>
                        <button id="jp-actionBtn" class="jp-action-btn">JETZT SETZEN</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(wrapper);

        // --- UI Referenzen ---
        const balanceEl = wrapper.querySelector('#jp-balance');
        const timerEl = wrapper.querySelector('#jp-timer');
        const potTopEl = wrapper.querySelector('#jp-potTop');
        const betInput = wrapper.querySelector('#jp-betInput');
        const actionBtn = wrapper.querySelector('#jp-actionBtn');
        const centerSub = wrapper.querySelector('#jp-centerSub');
        const playersList = wrapper.querySelector('#jp-playersList');
        const winBanner = wrapper.querySelector('#jp-winBanner');
        const winBannerAmount = wrapper.querySelector('#jp-winBannerAmount');
        const toastMsg = wrapper.querySelector('#jp-toastMsg');
        const canvas = wrapper.querySelector('#jp-canvas');
        const ctx = canvas.getContext('2d');

        const showToast = (text) => {
            toastMsg.innerText = text;
            toastMsg.classList.add('show');
            setTimeout(() => {
                toastMsg.classList.remove('show');
            }, 2500);
        };

        const resizeCanvas = () => {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        };
        window.addEventListener('resize', resizeCanvas);
        setTimeout(resizeCanvas, 0);

        const updateUI = () => {
            let total = game.players.reduce((sum, p) => sum + p.bet, 0);
            game.totalPot = total;
            balanceEl.innerText = game.balance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
            potTopEl.innerText = `${total.toLocaleString('de-DE')} €`;

            if (game.isPaused) {
                timerEl.innerText = 'PAUSE';
            } else if (game.isSpinning) {
                timerEl.innerText = 'SPIN';
            } else {
                timerEl.innerText = `${Math.max(0, game.roundTimeLeft).toFixed(1)}s`;
            }

            playersList.innerHTML = '';
            game.players.forEach((p, idx) => {
                p.color = getPlayerColor(idx, p.isUser);
                let percentage = total > 0 ? ((p.bet / total) * 100).toFixed(1) : 0;
                let row = document.createElement('div');
                row.className = 'jp-player-row';
                row.style.borderLeftColor = p.color;
                row.innerHTML = `
                    <span style="color: ${p.color}; font-weight: bold;">${p.name} ${p.isUser ? '(Du)' : ''}</span>
                    <span>${p.bet} € <b style="color: #00ffcc;">(${percentage}%)</b></span>
                `;
                playersList.appendChild(row);
            });
        };

        const setBet = (type) => {
            if (game.isSpinning || game.isPaused) return;
            let val = parseFloat(betInput.value) || 100;
            if (type === 'half') val = Math.max(10, val / 2);
            if (type === 'double') val = val * 2;
            if (type === 'max') val = game.balance;
            betInput.value = Math.floor(Math.min(game.balance, val));
        };

        const scheduleNextBot = () => {
            if (!game.gameActive) return;
            let randomDelay = (Math.random() * 3500 + 1000);
            setTimeout(() => {
                if (!game.gameActive || game.isSpinning || game.isPaused) {
                    scheduleNextBot();
                    return;
                }

                let randomName = botNames[Math.floor(Math.random() * botNames.length)];
                let randomBet = Math.floor(Math.random() * 400) + 50;

                let existingBot = game.players.find(p => p.name === randomName && !p.isUser);
                if (existingBot) {
                    existingBot.bet += randomBet;
                } else {
                    let newIndex = game.players.length;
                    game.players.push({ name: randomName, bet: randomBet, color: getPlayerColor(newIndex, false), isUser: false });
                }

                updateUI();
                scheduleNextBot();
            }, randomDelay);
        };
        scheduleNextBot();

        actionBtn.onclick = () => {
            if (game.isSpinning || game.isPaused) return;

            let betAmount = parseFloat(betInput.value);
            if (isNaN(betAmount) || betAmount <= 0) {
                showToast('Bitte gültigen Einsatz eingeben!');
                return;
            }
            if (betAmount > game.balance) {
                showToast('Nicht genug Guthaben!');
                return;
            }

            game.balance -= betAmount;

            let userEntry = game.players.find(p => p.isUser);
            if (userEntry) {
                userEntry.bet += betAmount;
            } else {
                let newIndex = game.players.length;
                game.players.push({ name: 'Du', bet: betAmount, color: getPlayerColor(newIndex, true), isUser: true });
            }

            updateUI();
        };

        const triggerJackpotSpin = () => {
            if (game.players.length === 0) {
                game.roundTimeLeft = 15;
                return;
            }

            game.isSpinning = true;
            actionBtn.disabled = true;
            betInput.disabled = true;
            centerSub.style.color = '#ffffff';
            centerSub.style.textShadow = '0 0 15px rgba(255, 255, 255, 0.6)';
            centerSub.innerText = 'DREHT...';

            let total = game.totalPot;
            let winningPoint = Math.random() * total;
            let currentSum = 0;
            let chosenWinnerIndex = 0;

            for (let i = 0; i < game.players.length; i++) {
                currentSum += game.players[i].bet;
                if (winningPoint <= currentSum) {
                    chosenWinnerIndex = i;
                    break;
                }
            }

            let chosenWinner = game.players[chosenWinnerIndex];

            let accumulatedBet = 0;
            for (let i = 0; i < chosenWinnerIndex; i++) {
                accumulatedBet += game.players[i].bet;
            }
            let winnerCenterBet = accumulatedBet + chosenWinner.bet / 2;
            let winnerFraction = winnerCenterBet / total;

            let extraRounds = Math.PI * 12;
            let targetSegmentAngle = winnerFraction * Math.PI * 2;

            let angleDiff = (Math.PI * 0.5 - targetSegmentAngle) % (Math.PI * 2);
            if (angleDiff < 0) angleDiff += Math.PI * 2;

            game.targetAngle = game.currentAngle + extraRounds + ((angleDiff - (game.currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
            game.spinProgress = 0;

            setTimeout(() => {
                game.isSpinning = false;

                let wonAmount = total;
                if (chosenWinner.isUser) {
                    game.balance += wonAmount;
                    game.score = game.balance;
                    winBannerAmount.innerText = `+${wonAmount.toLocaleString('de-DE')} €`;
                    winBanner.classList.add('show');
                    setTimeout(() => winBanner.classList.remove('show'), 2500);
                }

                centerSub.style.color = chosenWinner.color;
                centerSub.style.textShadow = `0 0 20px ${chosenWinner.color}`;
                centerSub.innerText = `${chosenWinner.name.toUpperCase()} GEWINNT!`;

                game.isPaused = true;

                setTimeout(() => {
                    game.isPaused = false;
                    actionBtn.disabled = false;
                    betInput.disabled = false;

                    game.players = [];
                    game.roundTimeLeft = 15;
                    centerSub.style.color = '#ffffff';
                    centerSub.style.textShadow = '0 0 15px rgba(255, 255, 255, 0.6)';
                    centerSub.innerText = 'BEREIT ZUR RUNDE';
                    updateUI();
                }, 3500);

                updateUI();

                if (services && services.highscores) {
                    services.highscores.saveHighscore('neon-jackpot-roulette', Math.floor(game.score));
                }
            }, game.spinDuration * 1000);
        };

        wrapper.querySelector('#btn-half').addEventListener('click', () => setBet('half'));
        wrapper.querySelector('#btn-double').addEventListener('click', () => setBet('double'));
        wrapper.querySelector('#btn-max').addEventListener('click', () => setBet('max'));

        const update = (delta, time) => {
            if (game.isPaused) {
                // Pause aktiv
            } else if (!game.isSpinning) {
                game.roundTimeLeft -= delta;
                if (game.roundTimeLeft <= 0) {
                    triggerJackpotSpin();
                }
            } else {
                game.spinProgress += delta / game.spinDuration;
                if (game.spinProgress > 1) game.spinProgress = 1;

                let easeOut = 1 - Math.pow(1 - game.spinProgress, 3);
                if (!game.spinStartAngle) {
                    game.spinStartAngle = game.currentAngle;
                }
                game.currentAngle = game.spinStartAngle + (game.targetAngle - game.spinStartAngle) * easeOut;
            }

            if (!game.isSpinning) {
                game.spinStartAngle = null;
            }

            updateUI();
        };

        const draw = (time) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let centerX = canvas.width / 2;
            let centerY = canvas.height / 2;
            let radius = Math.min(centerX, centerY) - 105;
            if (radius < 50) radius = 50;

            let total = game.totalPot || 1;
            let startAngle = game.currentAngle;

            // Zeiger UNTEN (ohne Glow)
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#00ffcc';
            ctx.beginPath();
            ctx.moveTo(centerX, centerY + radius + 2);
            ctx.lineTo(centerX - 7, centerY + radius + 12);
            ctx.lineTo(centerX + 7, centerY + radius + 12);
            ctx.closePath();
            ctx.fill();

            // Segmente zeichnen
            if (game.players.length === 0) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fillStyle = '#131722';
                ctx.fill();
                ctx.strokeStyle = '#222838';
                ctx.lineWidth = 2.5;
                ctx.stroke();
            } else {
                game.players.forEach((p, idx) => {
                    let sliceAngle = (p.bet / total) * (Math.PI * 2);
                    let endAngle = startAngle + sliceAngle;

                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                    ctx.closePath();

                    ctx.fillStyle = p.color;
                    ctx.shadowBlur = 0;
                    ctx.fill();
                    ctx.strokeStyle = '#06070a';
                    ctx.lineWidth = 2.5;
                    ctx.stroke();

                    startAngle = endAngle;
                });
            }

            // Zentraler Hub
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
            ctx.fillStyle = '#0c0e15';
            ctx.strokeStyle = '#222838';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
        };

        const loop = (time) => {
            let delta = (time - lastTime) / 1000;
            if (delta > 0.1) delta = 0.1;
            lastTime = time;
            update(delta, time);
            draw(time);
            animationId = requestAnimationFrame(loop);
        };

        updateUI();
        animationId = requestAnimationFrame(loop);

        return {
            destroy: () => {
                game.gameActive = false;
                cancelAnimationFrame(animationId);
                window.removeEventListener('resize', resizeCanvas);
            }
        };
    }
};