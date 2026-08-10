export default {
    manifest: {
        id: 'reactor-crash',
        name: 'Reactor Crash',
        description: 'High Stakes Krypto-Crash. Lass den Multiplikator steigen, aber rette deinen Einsatz vor dem Absturz!',
        icon: '🚀',
        imageUrl: 'js/assets/images/Crash.png',
        tags: ['Casino', 'Canvas', 'Risk']
    },
    init: (container, services) => {
        // --- State Management ---
        let balance = 1000.00;
        let currentBet = 10;
        let multiplier = 1.00;
        let gameInterval = null;
        let gameState = 'IDLE';
        let crashPoint = 1.00;
        let flightTime = 0;
        let history = [];
        let hasCashedOut = false;

        let animationId; // Für den renderLoop
        let particles = [];
        let winParticles = [];

        // --- Styling (Direkt ins Modul injiziert und isoliert) ---
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Inter:wght@400;600;800&display=swap');

            .rc-wrapper {
                width: 100%;
                height: 100%;
                display: flex;
                background-color: #06070a;
                color: #ffffff;
                font-family: 'Inter', sans-serif;
                user-select: none;
                overflow: hidden;
            }

            .rc-wrapper * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }

            /* Linke Seite: Wett-Steuerung */
            .rc-betting-panel {
                width: 380px;
                background: #0c0e15;
                border-right: 1px solid #1a1e29;
                display: flex;
                flex-direction: column;
                padding: 25px;
                justify-content: space-between;
                z-index: 10;
            }

            .rc-panel-top {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .rc-balance-box {
                background: #131722;
                padding: 15px 20px;
                border-radius: 12px;
                border: 1px solid #222838;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .rc-balance-box .label {
                font-size: 0.85rem;
                color: #7b88a8;
                text-transform: uppercase;
                font-weight: 600;
            }

            .rc-balance-box .amount {
                font-family: 'Orbitron', sans-serif;
                font-size: 1.4rem;
                font-weight: 700;
                color: #00ffcc;
                text-shadow: 0 0 10px rgba(0, 255, 204, 0.3);
            }

            .rc-input-section {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .rc-input-section label {
                font-size: 0.85rem;
                color: #7b88a8;
                font-weight: 600;
            }

            .rc-input-wrapper {
                position: relative;
                display: flex;
                align-items: center;
            }

            .rc-input-wrapper input {
                width: 100%;
                background: #131722;
                border: 2px solid #222838;
                border-radius: 10px;
                color: white;
                padding: 14px 50px 14px 15px;
                font-family: 'Orbitron', sans-serif;
                font-size: 1.1rem;
                outline: none;
                transition: border-color 0.2s;
            }

            .rc-input-wrapper input:focus {
                border-color: #00ffcc;
            }

            .rc-currency-tag {
                position: absolute;
                right: 15px;
                color: #7b88a8;
                font-weight: bold;
            }

            .rc-quick-buttons {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 6px;
            }

            .rc-quick-btn {
                background: #131722;
                border: 1px solid #222838;
                color: #a0aec0;
                padding: 8px;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.1s;
            }

            .rc-quick-btn:hover {
                background: #1c2333;
                color: white;
                border-color: #3b4663;
            }

            .rc-action-btn {
                width: 100%;
                background: linear-gradient(135deg, #00ffcc 0%, #00b386 100%);
                color: #06070a;
                border: none;
                border-radius: 12px;
                padding: 18px;
                font-family: 'Orbitron', sans-serif;
                font-size: 1.3rem;
                font-weight: 900;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0, 255, 204, 0.4);
                transition: all 0.1s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .rc-action-btn:hover {
                filter: brightness(1.1);
                transform: translateY(-2px);
                box-shadow: 0 6px 25px rgba(0, 255, 204, 0.6);
            }

            .rc-action-btn:active {
                transform: translateY(0);
            }

            .rc-action-btn.cashout {
                background: linear-gradient(135deg, #ffc107 0%, #ff8800 100%);
                box-shadow: 0 4px 20px rgba(255, 136, 0, 0.4);
            }

            .rc-action-btn:disabled {
                background: #1a1e29;
                color: #4a5568;
                box-shadow: none;
                cursor: not-allowed;
                transform: none !important;
            }

            /* Rechte Seite: Spiel-Arena */
            .rc-game-main {
                flex: 1;
                display: flex;
                flex-direction: column;
                position: relative;
                background: radial-gradient(circle at center, #101420 0%, #06070a 100%);
                overflow: hidden;
            }

            .rc-history-bar {
                display: flex;
                gap: 10px;
                padding: 20px 30px;
                align-items: center;
                z-index: 5;
            }

            .rc-history-pill {
                background: #131722;
                border: 1px solid #222838;
                padding: 6px 12px;
                border-radius: 20px;
                font-family: 'Orbitron', sans-serif;
                font-size: 0.85rem;
                font-weight: 700;
            }

            .rc-history-pill.high { color: #00ffcc; border-color: rgba(0, 255, 204, 0.4); background: rgba(0, 255, 204, 0.05); }
            .rc-history-pill.mid { color: #ffaa00; border-color: rgba(255, 170, 0, 0.4); }
            .rc-history-pill.low { color: #ff3366; border-color: rgba(255, 51, 102, 0.4); }

            .rc-canvas-arena {
                flex: 1;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .rc-canvas-arena canvas {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }

            .rc-multiplier-display-box {
                z-index: 4;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                pointer-events: none;
            }

            #rc-multiplierDisplay {
                font-family: 'Orbitron', sans-serif;
                font-size: 6rem;
                font-weight: 900;
                color: #ffffff;
                text-shadow: 0 0 30px rgba(255, 255, 204, 0.3);
                letter-spacing: 2px;
                line-height: 1;
            }

            .rc-status-subtext {
                font-family: 'Orbitron', sans-serif;
                font-size: 1.1rem;
                color: #7b88a8;
                margin-top: 10px;
                letter-spacing: 3px;
                text-transform: uppercase;
            }

            .rc-shake { animation: rc-screenShake 0.15s infinite alternate; }

            @keyframes rc-screenShake {
                0% { transform: translate(3px, 3px); }
                100% { transform: translate(-3px, -3px); }
            }

            .rc-flash-overlay {
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(255, 51, 102, 0.15);
                opacity: 0;
                pointer-events: none;
                z-index: 6;
                transition: opacity 0.1s ease;
            }
            .rc-flash-overlay.active { opacity: 1; }

            .rc-win-banner {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%) scale(0);
                z-index: 20;
                background: linear-gradient(135deg, rgba(0, 255, 204, 0.9), rgba(0, 150, 120, 0.9));
                padding: 30px 60px;
                border-radius: 20px;
                border: 3px solid #fff;
                text-align: center;
                box-shadow: 0 0 50px rgba(0, 255, 204, 0.8);
                pointer-events: none;
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .rc-win-banner.show { transform: translate(-50%, -50%) scale(1); }

            .rc-win-banner h2 {
                font-family: 'Orbitron', sans-serif;
                font-size: 2.5rem;
                color: #06070a;
                text-transform: uppercase;
                font-weight: 900;
            }

            .rc-win-banner .rc-win-amount-text {
                font-family: 'Orbitron', sans-serif;
                font-size: 2rem;
                color: #ffffff;
                font-weight: 900;
                text-shadow: 0 2px 10px rgba(0,0,0,0.5);
                margin-top: 5px;
            }
        `;
        container.appendChild(style);

        // --- DOM-Struktur aufbauen ---
        const wrapper = document.createElement('div');
        wrapper.className = 'rc-wrapper';

        wrapper.innerHTML = `
            <div class="rc-betting-panel">
                <div class="rc-panel-top">
                    <div class="rc-balance-box">
                        <span class="label">Guthaben</span>
                        <span class="amount" id="rc-balance">1,000.00 €</span>
                    </div>
                    <div class="rc-input-section">
                        <label>Einsatzbetrag</label>
                        <div class="rc-input-wrapper">
                            <input type="number" id="rc-betInput" value="10" min="1" max="10000">
                            <span class="rc-currency-tag">€</span>
                        </div>
                        <div class="rc-quick-buttons">
                            <button class="rc-quick-btn" id="btn-half">1/2</button>
                            <button class="rc-quick-btn" id="btn-double">2X</button>
                            <button class="rc-quick-btn" id="btn-max">MAX</button>
                            <button class="rc-quick-btn" id="btn-min">MIN</button>
                        </div>
                    </div>
                </div>
                <button id="rc-actionBtn" class="rc-action-btn">WETTE PLATZIEREN</button>
            </div>

            <div class="rc-game-main" id="rc-gameMainContainer">
                <div class="rc-flash-overlay" id="rc-flashOverlay"></div>
                <div class="rc-win-banner" id="rc-winBanner">
                    <h2>EPIC WIN!</h2>
                    <div class="rc-win-amount-text" id="rc-winBannerAmount">+0.00 €</div>
                </div>
                <div class="rc-history-bar" id="rc-historyBar"></div>
                <div class="rc-canvas-arena">
                    <canvas id="rc-gameCanvas"></canvas>
                    <div class="rc-multiplier-display-box">
                        <div id="rc-multiplierDisplay">1.00x</div>
                        <div class="rc-status-subtext" id="rc-statusSubtext">BEREIT ZUM START</div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(wrapper);

        // --- UI Referenzen ---
        const balanceEl = wrapper.querySelector('#rc-balance');
        const betInput = wrapper.querySelector('#rc-betInput');
        const actionBtn = wrapper.querySelector('#rc-actionBtn');
        const multiplierDisplay = wrapper.querySelector('#rc-multiplierDisplay');
        const statusSubtext = wrapper.querySelector('#rc-statusSubtext');
        const gameMainContainer = wrapper.querySelector('#rc-gameMainContainer');
        const flashOverlay = wrapper.querySelector('#rc-flashOverlay');
        const historyBar = wrapper.querySelector('#rc-historyBar');
        const winBanner = wrapper.querySelector('#rc-winBanner');
        const winBannerAmount = wrapper.querySelector('#rc-winBannerAmount');
        const canvas = wrapper.querySelector('#rc-gameCanvas');
        const ctx = canvas.getContext('2d');

        // --- Setup ---
        const resizeCanvas = () => {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const updateUI = () => {
            balanceEl.innerText = balance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
        };

        const setBet = (type) => {
            if (gameState !== 'IDLE') return;
            let val = parseFloat(betInput.value) || 10;
            if (type === 'half') val = Math.max(1, val / 2);
            if (type === 'double') val = val * 2;
            if (type === 'max') val = balance;
            if (type === 'min') val = 10;
            betInput.value = Math.floor(val);
        };

        const addHistory = (mult) => {
            history.unshift(mult);
            if (history.length > 6) history.pop();
            historyBar.innerHTML = '';
            history.forEach(m => {
                let pill = document.createElement('div');
                pill.className = 'rc-history-pill ' + (m >= 10 ? 'high' : m >= 3 ? 'mid' : 'low');
                pill.innerText = m.toFixed(2) + 'x';
                historyBar.appendChild(pill);
            });
        };

        // Algorithmus (House Edge)[cite: 5]
        const generateCrashPoint = () => {
            let h = Math.random();
            if (h < 0.03) return 1.00; // 3% Chance auf Sofort-Crash
            let e = 2 ** 32;
            let result = Math.floor((100 * e - h) / (e - h * e)) / 100;
            return Math.max(1.00, result);
        };

        const triggerWinFX = (amount) => {
            winBannerAmount.innerText = `+${amount.toFixed(2)} €`;
            winBanner.classList.add('show');
            setTimeout(() => winBanner.classList.remove('show'), 2000);

            for (let i = 0; i < 70; i++) {
                winParticles.push({
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    vx: (Math.random() - 0.5) * 14,
                    vy: (Math.random() - 0.5) * 14,
                    size: Math.random() * 6 + 3,
                    color: ['#00ffcc', '#ffcc00', '#ffffff', '#ff3366'][Math.floor(Math.random() * 4)],
                    alpha: 1,
                    decay: Math.random() * 0.02 + 0.01
                });
            }
        };

        const crashGame = () => {
            clearInterval(gameInterval);
            gameMainContainer.classList.remove('rc-shake');

            flashOverlay.classList.add('active');
            setTimeout(() => flashOverlay.classList.remove('active'), 150);

            gameState = 'CRASHED';
            multiplierDisplay.innerText = `${multiplier.toFixed(2)}x`;
            multiplierDisplay.style.color = '#ff3366';

            statusSubtext.innerText = !hasCashedOut ? 'CRASHED! (VERLOREN)' : 'CRASHED!';

            actionBtn.innerText = 'NEU STARTEN';
            actionBtn.className = 'rc-action-btn';
            actionBtn.disabled = false;
            gameState = 'IDLE';

            addHistory(multiplier);

            // Highscore-Update (wie bei Blackjack)
            services.highscores.saveHighscore('reactor-crash', Math.floor(balance));

            if (balance <= 0) {
                setTimeout(() => {
                    alert("Bankrott! Dir werden neue 1.000 € aufgeladen.");
                    balance = 1000;
                    updateUI();
                }, 1000);
            }
        };

        const cashOut = () => {
            if (gameState !== 'RUNNING' || hasCashedOut) return;

            hasCashedOut = true;
            let winAmount = currentBet * multiplier;
            balance += winAmount;
            updateUI();

            actionBtn.innerText = 'AUSGEZAHLT!';
            actionBtn.disabled = true;

            triggerWinFX(winAmount);
        };

        const startRound = () => {
            currentBet = parseFloat(betInput.value);
            if (isNaN(currentBet) || currentBet <= 0) return alert('Ungültiger Einsatz!');
            if (currentBet > balance) return alert('Nicht genug Guthaben!');

            balance -= currentBet;
            updateUI();

            gameState = 'RUNNING';
            hasCashedOut = false;
            actionBtn.innerText = 'CASH OUT';
            actionBtn.className = 'rc-action-btn cashout';
            actionBtn.disabled = false;
            multiplierDisplay.style.color = '#ffffff';
            statusSubtext.innerText = 'FLIEGT...';
            flightTime = 0;
            multiplier = 1.00;
            winBanner.classList.remove('show');

            crashPoint = generateCrashPoint();
            particles = [];

            gameInterval = setInterval(() => {
                flightTime += 0.04;
                multiplier = parseFloat((Math.exp(0.065 * flightTime)).toFixed(2));

                if (multiplier >= crashPoint) {
                    multiplier = crashPoint;
                    crashGame();
                } else {
                    multiplierDisplay.innerText = multiplier.toFixed(2) + 'x';
                    if (multiplier >= 10) {
                        gameMainContainer.classList.add('rc-shake');
                        multiplierDisplay.style.color = '#00ffcc';
                    }
                    if (multiplier >= 50) {
                        multiplierDisplay.style.color = '#ffcc00';
                    }
                }
            }, 40);
        };

        const handleMainAction = () => {
            if (gameState === 'IDLE') startRound();
            else if (gameState === 'RUNNING' && !hasCashedOut) cashOut();
        };

        // --- Event Listener ---
        actionBtn.addEventListener('click', handleMainAction);
        wrapper.querySelector('#btn-half').addEventListener('click', () => setBet('half'));
        wrapper.querySelector('#btn-double').addEventListener('click', () => setBet('double'));
        wrapper.querySelector('#btn-max').addEventListener('click', () => setBet('max'));
        wrapper.querySelector('#btn-min').addEventListener('click', () => setBet('min'));

        // --- Render Loop (Canvas Animation) ---
        const renderLoop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let width = canvas.width;
            let height = canvas.height;
            let padding = 60;

            // Feines Koordinaten-Raster
            ctx.strokeStyle = '#121622';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 1; i < 8; i++) {
                let yPos = (height / 8) * i;
                ctx.moveTo(padding, yPos);
                ctx.lineTo(width - padding, yPos);
            }
            for (let j = 1; j < 8; j++) {
                let xPos = (width / 8) * j;
                ctx.moveTo(xPos, padding);
                ctx.lineTo(xPos, height - padding);
            }
            ctx.stroke();

            // Achsen
            ctx.strokeStyle = '#222838';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(padding, height - padding);
            ctx.lineTo(width - padding, height - padding);
            ctx.moveTo(padding, height - padding);
            ctx.lineTo(padding, padding);
            ctx.stroke();

            // Win Particles
            for (let i = winParticles.length - 1; i >= 0; i--) {
                let wp = winParticles[i];
                wp.x += wp.vx;
                wp.y += wp.vy;
                wp.vy += 0.2;
                wp.alpha -= wp.decay;

                if (wp.alpha <= 0) {
                    winParticles.splice(i, 1);
                    continue;
                }
                ctx.fillStyle = wp.color;
                ctx.globalAlpha = wp.alpha;
                ctx.fillRect(wp.x, wp.y, wp.size, wp.size);
                ctx.globalAlpha = 1.0;
            }

            // Graphen-Linie
            if (gameState === 'RUNNING' || multiplier > 1.00) {
                let maxT = Math.max(8, flightTime * 1.1);
                let maxM = Math.max(2.5, multiplier * 1.25);

                let startX = padding;
                let startY = height - padding;

                let currentX = padding + (flightTime / maxT) * (width - padding * 2);
                let currentY = (height - padding) - ((multiplier - 1) / (maxM - 1)) * (height - padding * 2);

                currentX = Math.min(width - padding, Math.max(startX, currentX));
                currentY = Math.max(padding, Math.min(startY, currentY));

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                let controlX = startX + (currentX - startX) * 0.5;
                let controlY = startY - (startY - currentY) * 0.1;
                ctx.quadraticCurveTo(controlX, controlY, currentX, currentY);

                ctx.strokeStyle = multiplier >= 10 ? '#00ffcc' : '#ff3366';
                ctx.lineWidth = 4;
                ctx.shadowColor = ctx.strokeStyle;
                ctx.shadowBlur = 15;
                ctx.stroke();
                ctx.shadowBlur = 0;

                if (gameState === 'RUNNING') {
                    particles.push({
                        x: currentX - 5 + (Math.random() * 4 - 2),
                        y: currentY + 5 + (Math.random() * 4 - 2),
                        vx: -(Math.random() * 2 + 0.5),
                        vy: Math.random() * 2 + 0.5,
                        size: Math.random() * 3 + 2,
                        alpha: 1
                    });
                }

                for (let i = particles.length - 1; i >= 0; i--) {
                    let p = particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.alpha -= 0.04;

                    if (p.alpha <= 0) {
                        particles.splice(i, 1);
                        continue;
                    }
                    ctx.fillStyle = `rgba(255, 136, 0, ${p.alpha})`;
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                }

                ctx.beginPath();
                ctx.arc(currentX, currentY, 7, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#00ffcc';
                ctx.shadowBlur = 20;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            animationId = requestAnimationFrame(renderLoop);
        };

        // --- Initialisierung ---
        addHistory(1.85);
        addHistory(1.12);
        addHistory(4.50);
        addHistory(2.10);
        updateUI();
        renderLoop();

        // --- Lifecycle Cleanup ---
        return {
            destroy: () => {
                clearInterval(gameInterval); // Stoppt die Zähl-Schleife[cite: 5]
                cancelAnimationFrame(animationId); // Stoppt das Canvas-Rendering
                window.removeEventListener('resize', resizeCanvas); // Verhindert Speicherlecks
            }
        };
    }
};