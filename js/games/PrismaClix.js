export default {
    manifest: {
        id: 'prisma-clix',
        name: 'Prisma Clix',
        description: 'Ein rasantes Idle-Klicker-Spiel. Sammle Prisma, kaufe Upgrades und maximiere deine Produktion.',
        icon: '💎',
        imageUrl: 'js/assets/images/PrismaClix.png',
        tags: ['Clicker', 'Idle', 'Action']
    },
    init: (container, services) => {
        // --- Spielzustand (State) ---
        let game = {
            score: 0,
            totalClicks: 0,
            clickPower: 1,
            sps: 0,
            currentTab: 'auto',
            upgrades: {
                nanoDrone: { name: "Nano-Drohne", cost: 15, sps: 0.6, count: 0, desc: "+0.6 / Sek", type: 'auto' },
                prismLaser: { name: "Prisma-Laser", cost: 110, sps: 4.5, count: 0, desc: "+4.5 / Sek", type: 'auto' },
                quantumCore: { name: "Quanten-Kern", cost: 1200, sps: 35, count: 0, desc: "+35 / Sek", type: 'auto' },
                matrixForge: { name: "Matrix-Schmiede", cost: 13000, sps: 280, count: 0, desc: "+280 / Sek", type: 'auto' },
                hyperSingularity: { name: "Hyper-Singularität", cost: 140000, sps: 1500, count: 0, desc: "+1.5k / Sek", type: 'auto' },
                omegaReactor: { name: "Omega-Reaktor", cost: 1600000, sps: 9200, count: 0, desc: "+9.2k / Sek", type: 'auto' },

                photonFinger: { name: "Photonen-Finger", cost: 50, clickBoost: 1, count: 0, desc: "+1 Prisma pro Klick", type: 'click' },
                plasmaGlove: { name: "Plasma-Handschuh", cost: 350, clickBoost: 5, count: 0, desc: "+5 Prisma pro Klick", type: 'click' },
                laserPointer: { name: "Tachyonen-Strahl", cost: 2400, clickBoost: 25, count: 0, desc: "+25 Prisma pro Klick", type: 'click' },
                novaClicker: { name: "Nova-Klicker", cost: 18000, clickBoost: 150, count: 0, desc: "+150 Prisma pro Klick", type: 'click' },
                godFinger: { name: "Götterhand-Matrix", cost: 150000, clickBoost: 800, count: 0, desc: "+800 Prisma pro Klick", type: 'click' }
            }
        };

        let animationId;
        let lastTime = performance.now();

        // --- Isoliertes Styling ---
        const style = document.createElement('style');
        style.textContent = `
            .pc-wrapper {
                box-sizing: border-box;
                user-select: none;
                margin: 0;
                padding: 0;
                background: #08080c;
                color: #ffffff;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                overflow: hidden;
                height: 100%;
                width: 100%;
                display: flex;
                position: relative;
            }

            .pc-wrapper * {
                box-sizing: border-box;
            }

            @keyframes pc-bgPan {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }

            .pc-game-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                background: linear-gradient(-45deg, #0d0d1a, #1a1025, #101c25, #08080c);
                background-size: 400% 400%;
                animation: pc-bgPan 12s ease infinite;
                overflow: hidden;
            }

            .pc-sidebar {
                width: 420px;
                background: #101016;
                border-left: 2px solid #202030;
                display: flex;
                flex-direction: column;
                padding: 20px;
                z-index: 10;
                box-shadow: -10px 0 30px rgba(0,0,0,0.7);
            }

            .pc-stats {
                position: absolute;
                top: 40px;
                text-align: center;
                z-index: 5;
            }

            .pc-score {
                font-size: 4.5rem;
                font-weight: 900;
                background: linear-gradient(45deg, #00ffcc, #ff007f, #ffff00);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-shadow: 0 0 40px rgba(0,255,204,0.4);
                margin: 0;
                animation: pc-pulseScore 2s infinite alternate;
            }

            @keyframes pc-pulseScore {
                0% { transform: scale(1); }
                100% { transform: scale(1.02); }
            }

            .pc-sps {
                font-size: 1.2rem;
                color: #a0a0c0;
                margin-top: 5px;
                font-weight: 600;
            }

            .pc-clicker-btn {
                width: 260px;
                height: 260px;
                border-radius: 50%;
                background: radial-gradient(circle, #ff007f 0%, #7f00ff 50%, #00ffff 100%);
                border: 6px solid #ffffff;
                cursor: pointer;
                box-shadow: 0 0 80px rgba(255,0,127,0.8), inset 0 0 40px rgba(255,255,255,0.7);
                transition: transform 0.08s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
                outline: none;
                z-index: 5;
            }

            .pc-clicker-btn:active {
                transform: scale(0.85) rotate(5deg);
                box-shadow: 0 0 30px rgba(255,0,127,1);
            }

            .pc-shockwave {
                position: absolute;
                width: 260px;
                height: 260px;
                border-radius: 50%;
                border: 4px solid #00ffcc;
                pointer-events: none;
                animation: pc-expandWave 0.5s ease-out forwards;
                z-index: 4;
            }

            @keyframes pc-expandWave {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(2.8); opacity: 0; }
            }

            .pc-particle {
                position: absolute;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                pointer-events: none;
                animation: pc-flyParticle 0.6s ease-out forwards;
                z-index: 100;
            }

            @keyframes pc-flyParticle {
                0% { transform: translate(0, 0) scale(1.5); opacity: 1; }
                100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
            }

            .pc-orb {
                position: absolute;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: radial-gradient(circle, #fff 0%, #ffd700 60%, #ff8c00 100%);
                box-shadow: 0 0 30px #ffd700;
                cursor: pointer;
                z-index: 50;
                animation: pc-orbFloat 3s ease-in-out infinite, pc-orbPopIn 0.3s ease-out forwards;
            }

            @keyframes pc-orbPopIn {
                0% { transform: scale(0); }
                100% { transform: scale(1); }
            }

            @keyframes pc-orbFloat {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-20px) scale(1.1); }
            }

            .pc-tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }

            .pc-tab-btn {
                flex: 1;
                background: #181824;
                border: 1px solid #28283c;
                color: #8888a0;
                padding: 10px;
                font-weight: bold;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .pc-tab-btn.active {
                background: #ff007f;
                color: white;
                border-color: #ff007f;
                box-shadow: 0 0 15px rgba(255,0,127,0.4);
            }

            .pc-sidebar h2 {
                font-size: 1.1rem;
                color: #00ffcc;
                border-bottom: 2px solid #202030;
                padding-bottom: 8px;
                margin-top: 0;
            }

            .pc-shop-list {
                flex: 1;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding-right: 5px;
            }

            .pc-shop-list::-webkit-scrollbar { width: 6px; }
            .pc-shop-list::-webkit-scrollbar-thumb { background: #28283c; border-radius: 3px; }

            .pc-upgrade-card {
                background: #161622;
                border: 1px solid #262638;
                border-radius: 8px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .pc-upgrade-card:hover:not(.locked) {
                background: #202030;
                border-color: #00ffcc;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,255,204,0.15);
            }

            .pc-upgrade-card.locked {
                opacity: 0.35;
                cursor: not-allowed;
            }

            .pc-upgrade-info h4 { margin: 0 0 4px 0; font-size: 0.95rem; color: #fff; }
            .pc-upgrade-info p { margin: 0; font-size: 0.75rem; color: #8888a0; }
            .pc-upgrade-cost { font-weight: bold; color: #ffd700; font-size: 0.9rem; text-align: right; }

            .pc-floating-text {
                position: absolute;
                font-weight: 900;
                font-size: 1.4rem;
                pointer-events: none;
                animation: pc-floatUp 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                z-index: 100;
                text-shadow: 0 0 10px rgba(0,0,0,0.8);
            }

            @keyframes pc-floatUp {
                0% { opacity: 1; transform: translateY(0) scale(0.8); }
                50% { transform: translateY(-40px) scale(1.3); }
                100% { opacity: 0; transform: translateY(-90px) scale(1); }
            }

            @keyframes pc-shake {
                0% { transform: translate(3px, 3px) rotate(0deg); }
                20% { transform: translate(-5px, 2px) rotate(-1deg); }
                40% { transform: translate(3px, -4px) rotate(1deg); }
                60% { transform: translate(-3px, 4px) rotate(0deg); }
                80% { transform: translate(-5px, 3px) rotate(-1deg); }
                100% { transform: translate(2px, -3px) rotate(1deg); }
            }

            .pc-shake-active {
                animation: pc-shake 0.15s ease-in-out;
            }
        `;
        container.appendChild(style);

        // --- DOM-Struktur aufbauen ---
        const wrapper = document.createElement('div');
        wrapper.className = 'pc-wrapper';

        wrapper.innerHTML = `
            <div class="pc-game-container" id="pc-gameContainer">
                <div class="pc-stats">
                    <div class="pc-score" id="pc-score">0</div>
                    <div class="pc-sps" id="pc-sps">Prisma / Sekunde: 0.0</div>
                </div>
                <button class="pc-clicker-btn" id="pc-clicker-btn"></button>
            </div>

            <div class="pc-sidebar">
                <h2>QUANTEN-SHOP</h2>
                <div class="pc-tabs">
                    <button class="pc-tab-btn active" id="tab-auto">Generator</button>
                    <button class="pc-tab-btn" id="tab-click">Klick-Power</button>
                </div>
                <div class="pc-shop-list" id="pc-shop-container"></div>
            </div>
        `;
        container.appendChild(wrapper);

        // --- UI Referenzen ---
        const scoreEl = wrapper.querySelector('#pc-score');
        const spsEl = wrapper.querySelector('#pc-sps');
        const clickerBtn = wrapper.querySelector('#pc-clicker-btn');
        const shopContainer = wrapper.querySelector('#pc-shop-container');
        const gameContainer = wrapper.querySelector('#pc-gameContainer');
        const tabAuto = wrapper.querySelector('#tab-auto');
        const tabClick = wrapper.querySelector('#tab-click');

        // --- Spiellogik ---
        const updateUI = () => {
            scoreEl.innerText = Math.floor(game.score).toLocaleString();
            spsEl.innerText = `Prisma / Sek: ${game.sps.toFixed(1)} | Klick-Power: +${game.clickPower}`;

            for (let key in game.upgrades) {
                let up = game.upgrades[key];
                let card = wrapper.querySelector(`#upgrade-${key}`);
                if (!card) continue;

                let costEl = wrapper.querySelector(`#cost-${key}`);
                costEl.innerText = `${Math.floor(up.cost).toLocaleString()} P`;

                if (game.score >= up.cost) {
                    card.classList.remove('locked');
                } else {
                    card.classList.add('locked');
                }
                card.querySelector('h4').innerText = `${up.name} (${up.count})`;
            }
        };

        const buyUpgrade = (key) => {
            let up = game.upgrades[key];
            if (game.score >= up.cost) {
                game.score -= up.cost;
                up.count++;
                up.cost *= 1.18;

                if (up.type === 'auto') {
                    game.sps += up.sps;
                } else if (up.type === 'click') {
                    game.clickPower += up.clickBoost;
                }

                updateUI();
                initShop();
            }
        };

        const initShop = () => {
            shopContainer.innerHTML = '';
            for (let key in game.upgrades) {
                let up = game.upgrades[key];
                if (up.type !== game.currentTab) continue;

                let card = document.createElement('div');
                card.className = 'pc-upgrade-card locked';
                card.id = `upgrade-${key}`;
                card.innerHTML = `
                        <div class="pc-upgrade-info">
                            <h4>${up.name} (${up.count})</h4>
                            <p>${up.desc}</p>
                        </div>
                        <div class="pc-upgrade-cost" id="cost-${key}">${Math.floor(up.cost).toLocaleString()} P</div>
                    `;
                card.addEventListener('click', () => buyUpgrade(key));
                shopContainer.appendChild(card);
            }
            updateUI();
        };

        const switchTab = (tab, eventTarget) => {
            game.currentTab = tab;
            tabAuto.classList.remove('active');
            tabClick.classList.remove('active');
            eventTarget.classList.add('active');
            initShop();
        };

        tabAuto.addEventListener('click', (e) => switchTab('auto', e.target));
        tabClick.addEventListener('click', (e) => switchTab('click', e.target));

        // --- Visuelle Effekte ---
        const createFloatingText = (x, y, text, color, isCrit) => {
            let el = document.createElement('div');
            el.className = 'pc-floating-text';
            el.style.left = `${x - 20}px`;
            el.style.top = `${y - 20}px`;
            el.style.color = color;
            el.style.fontSize = isCrit ? '2.5rem' : '1.5rem';
            el.innerText = isCrit ? `${text} CRIT!` : text;
            wrapper.appendChild(el);
            setTimeout(() => el.remove(), 700);
        };

        const createParticleBurst = (x, y, isCrit) => {
            const colors = ['#00ffcc', '#ff007f', '#ffff00', '#ffffff', '#7f00ff'];
            const amount = isCrit ? 25 : 12;

            for (let i = 0; i < amount; i++) {
                let p = document.createElement('div');
                p.className = 'pc-particle';
                p.style.left = `${x}px`;
                p.style.top = `${y}px`;
                p.style.background = colors[Math.floor(Math.random() * colors.length)];

                let angle = Math.random() * Math.PI * 2;
                let distance = 50 + Math.random() * (isCrit ? 150 : 90);
                let dx = Math.cos(angle) * distance;
                let dy = Math.sin(angle) * distance;

                p.style.setProperty('--dx', `${dx}px`);
                p.style.setProperty('--dy', `${dy}px`);

                wrapper.appendChild(p);
                setTimeout(() => p.remove(), 600);
            }
        };

        const triggerScreenShake = () => {
            gameContainer.classList.add('pc-shake-active');
            setTimeout(() => gameContainer.classList.remove('pc-shake-active'), 150);
        };

        const createShockwave = () => {
            const btnRect = clickerBtn.getBoundingClientRect();
            const containerRect = gameContainer.getBoundingClientRect();
            const centerX = (btnRect.left - containerRect.left) + btnRect.width / 2;
            const centerY = (btnRect.top - containerRect.top) + btnRect.height / 2;

            let wave = document.createElement('div');
            wave.className = 'pc-shockwave';
            wave.style.left = `${centerX - 130}px`;
            wave.style.top = `${centerY - 130}px`;
            gameContainer.appendChild(wave);
            setTimeout(() => wave.remove(), 500);
        };

        // --- Zufalls-Event (Goldener Orb) ---
        const spawnBonusOrb = () => {
            let orb = document.createElement('div');
            orb.className = 'pc-orb';

            orb.style.left = 10 + Math.random() * 70 + '%';
            orb.style.top = 15 + Math.random() * 65 + '%';

            gameContainer.appendChild(orb);

            orb.addEventListener('click', (e) => {
                e.stopPropagation();
                let bonus = (game.sps * 45) + (game.clickPower * 100) + 100;
                game.score += bonus;

                const rect = wrapper.getBoundingClientRect();
                const localX = e.clientX - rect.left;
                const localY = e.clientY - rect.top;

                createFloatingText(localX, localY, `+${Math.floor(bonus)} BONUS!`, '#ffff00', true);
                createParticleBurst(localX, localY, true);
                triggerScreenShake();

                orb.remove();
                updateUI();
            });

            setTimeout(() => {
                if (orb.parentNode) orb.remove();
            }, 4000);
        };

        // --- Klick-Logik ---
        clickerBtn.addEventListener('click', (e) => {
            let isCrit = Math.random() < 0.15;
            let gain = game.clickPower;

            if (isCrit) {
                gain *= 5;
                triggerScreenShake();
                createShockwave();
            }

            game.score += gain;
            game.totalClicks++;

            const rect = wrapper.getBoundingClientRect();
            const localX = e.clientX - rect.left;
            const localY = e.clientY - rect.top;

            createFloatingText(localX, localY, `+${Math.floor(gain).toLocaleString()}`, isCrit ? '#ffff00' : '#00ffcc', isCrit);
            createParticleBurst(localX, localY, isCrit);

            updateUI();
        });

        // --- Game Loop ---
        const gameLoop = (time) => {
            let delta = (time - lastTime) / 1000;
            lastTime = time;

            if (game.sps > 0) {
                game.score += game.sps * delta;
                updateUI();
                services.highscores.saveHighscore('prisma-clix', Math.floor(game.score));
            }

            if (Math.random() < 0.002) {
                if (!gameContainer.querySelector('.pc-orb')) {
                    spawnBonusOrb();
                }
            }

            animationId = requestAnimationFrame(gameLoop);
        };

        // --- Initialer Start ---
        initShop();
        animationId = requestAnimationFrame(gameLoop);

        // --- Aufräumen (Destroy) ---
        return {
            destroy: () => {
                cancelAnimationFrame(animationId);
                services.highscores.saveHighscore('prisma-clix', Math.floor(game.score));
            }
        };
    }
};