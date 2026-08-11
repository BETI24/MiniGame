export default {
    manifest: {
        id: 'neon-swarm',
        name: 'Neon Swarm',
        description: 'Überlebe den endlosen Neon-Schwarm! Weiche aus, sammle Energie und wähle mächtige Upgrades, um zu überleben.',
        icon: '✨',
        imageUrl: 'js/assets/images/NeonSwarm.png',
        tags: ['Action', 'Survivor', 'Neon', 'Arcade']
    },
    init: (container, services) => {
        // --- Web Audio API (Töne) ---
        let audioCtx = null;
        const initAudio = () => {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        };
        const playSound = (type) => {
            if (!audioCtx || audioCtx.state === 'suspended') return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (type === 'shoot') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
                osc.start(); osc.stop(audioCtx.currentTime + 0.1);
            } else if (type === 'exp') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
                osc.start(); osc.stop(audioCtx.currentTime + 0.1);
            } else if (type === 'levelup') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, audioCtx.currentTime);
                osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
                osc.start(); osc.stop(audioCtx.currentTime + 0.3);
            } else if (type === 'hit') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
                osc.start(); osc.stop(audioCtx.currentTime + 0.1);
            } else if (type === 'boss') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(50, audioCtx.currentTime);
                osc.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 1.5);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
                osc.start(); osc.stop(audioCtx.currentTime + 1.5);
            }
        };

        // --- Konstanten & Setup ---
        const CANVAS_WIDTH = 800;
        const CANVAS_HEIGHT = 600;

        const style = document.createElement('style');
        style.textContent = `
            .ns-wrapper { box-sizing: border-box; user-select: none; margin: 0; padding: 0; background: #08080c; color: #ffffff; font-family: 'Segoe UI', Tahoma, sans-serif; height: 100%; width: 100%; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
            .ns-canvas { background: radial-gradient(circle, #12121c 0%, #050508 100%); border: 2px solid #202030; box-shadow: 0 0 40px rgba(0, 255, 204, 0.1); cursor: crosshair; }
            .ns-ui { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; display: flex; flex-direction: column; align-items: center; }
            .ns-top-bar { width: 100%; max-width: 800px; padding: 15px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 1.2rem; text-shadow: 0 0 10px rgba(0,255,204,0.5); }
            
            .ns-exp-container { width: 400px; height: 12px; background: #161622; border: 2px solid #202030; border-radius: 6px; overflow: hidden; margin-top: 10px; position: relative; }
            .ns-exp-bar { height: 100%; background: linear-gradient(90deg, #00ffcc, #0088ff); width: 0%; transition: width 0.2s ease-out; box-shadow: 0 0 10px rgba(0,255,204,0.8); }
            
            .ns-lvl-text { color: #00ffcc; }
            .ns-time-text { color: #ff007f; }

            .ns-levelup-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(5,5,8,0.85); pointer-events: auto; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(4px); opacity: 0; transition: opacity 0.3s; z-index: 10; display: none; }
            .ns-levelup-overlay.active { opacity: 1; display: flex; }
            .ns-levelup-title { color: #ffff00; font-size: 2.5rem; margin-bottom: 30px; text-shadow: 0 0 20px rgba(255,255,0,0.5); letter-spacing: 2px; }
            
            .ns-cards { display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; max-width: 700px; }
            .ns-card { background: #12121c; border: 2px solid #00ffcc; border-radius: 12px; width: 200px; padding: 20px; text-align: center; cursor: pointer; transition: 0.2s; box-shadow: 0 0 15px rgba(0,255,204,0.1); }
            .ns-card:hover { transform: translateY(-10px); box-shadow: 0 10px 25px rgba(0,255,204,0.4); background: #1a1a28; }
            .ns-card-icon { font-size: 3rem; margin-bottom: 10px; }
            .ns-card-title { font-weight: bold; font-size: 1.1rem; margin-bottom: 8px; color: #ffffff; }
            .ns-card-desc { font-size: 0.85rem; color: #a0a0c0; }
            
            .ns-gameover { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); pointer-events: auto; display: none; flex-direction: column; align-items: center; justify-content: center; z-index: 20; }
            .ns-gameover.active { display: flex; }
            .ns-btn { margin-top: 20px; padding: 10px 30px; background: transparent; border: 2px solid #ff007f; color: #ff007f; font-weight: bold; font-size: 1.2rem; cursor: pointer; border-radius: 6px; text-transform: uppercase; transition: 0.2s; }
            .ns-btn:hover { background: #ff007f; color: #fff; box-shadow: 0 0 20px rgba(255,0,127,0.6); }
        `;
        container.appendChild(style);

        const wrapper = document.createElement('div');
        wrapper.className = 'ns-wrapper';
        wrapper.innerHTML = `
            <canvas class="ns-canvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"></canvas>
            <div class="ns-ui">
                <div class="ns-top-bar">
                    <div class="ns-lvl-text">WELLE <span id="ns-wave-val">1</span> | LVL <span id="ns-lvl-val">1</span></div>
                    <div class="ns-exp-container"><div class="ns-exp-bar" id="ns-exp-bar"></div></div>
                    <div class="ns-time-text" id="ns-time-val">00:00</div>
                </div>
            </div>
            <div class="ns-levelup-overlay" id="ns-levelup">
                <div class="ns-levelup-title">SYSTEM UPGRADE</div>
                <div class="ns-cards" id="ns-cards-container"></div>
            </div>
            <div class="ns-gameover" id="ns-gameover">
                <div class="ns-levelup-title" style="color: #ff007f; text-shadow: 0 0 20px rgba(255,0,127,0.5);">KERN ZERSTÖRT</div>
                <div style="color: white; font-size: 1.2rem; margin-bottom: 10px;">Überlebte Zeit: <span id="ns-final-time" style="color: #00ffcc;"></span></div>
                <button class="ns-btn" id="ns-restart-btn">Neustart</button>
            </div>
        `;
        container.appendChild(wrapper);

        const canvas = wrapper.querySelector('.ns-canvas');
        const ctx = canvas.getContext('2d');

        const uiWave = wrapper.querySelector('#ns-wave-val');
        const uiLvl = wrapper.querySelector('#ns-lvl-val');
        const uiExpBar = wrapper.querySelector('#ns-exp-bar');
        const uiTime = wrapper.querySelector('#ns-time-val');
        const uiLevelUp = wrapper.querySelector('#ns-levelup');
        const uiCardsContainer = wrapper.querySelector('#ns-cards-container');
        const uiGameOver = wrapper.querySelector('#ns-gameover');
        const uiFinalTime = wrapper.querySelector('#ns-final-time');
        const btnRestart = wrapper.querySelector('#ns-restart-btn');

        let game = {};
        let animationId;
        let lastTime = 0;

        const availableUpgrades = [
            // Stats
            { id: 'dmg', type: 'stat', icon: '💥', title: 'Überladung', desc: 'Erhöht den verursachten Schaden.', color: '#ff007f' },
            { id: 'rate', type: 'stat', icon: '⚡', title: 'Schnellfeuer', desc: 'Verringert die Nachladezeit.', color: '#ffff00' },
            { id: 'speed', type: 'stat', icon: '💨', title: 'Hyper-Antrieb', desc: 'Erhöht deine Bewegungsgeschwindigkeit.', color: '#0088ff' },
            { id: 'hp', type: 'stat', icon: '🛡️', title: 'Struktur', desc: 'Erhöht die maximale Hülle und heilt.', color: '#00ff66' },
            { id: 'crit', type: 'stat', icon: '🎯', title: 'Analyse', desc: 'Chance auf kritischen Treffer.', color: '#ffaa00' },
            { id: 'regen', type: 'stat', icon: '💖', title: 'Regeneration', desc: 'Stellt langsam Leben wieder her.', color: '#ff5555' },
            { id: 'vamp', type: 'stat', icon: '🦇', title: 'Vampirismus', desc: 'Chance auf Heilung bei Treffern.', color: '#cc0000' },
            { id: 'shield', type: 'stat', icon: '🔰', title: 'Reaktiv-Schild', desc: 'Blockt Schaden und teilt aus.', color: '#00ccff' },

            // Mechanics
            { id: 'multi', type: 'mech', icon: '🚀', title: 'Spalt-Projektile', desc: 'Feuert ein zusätzliches Projektil.', color: '#00ffcc' },
            { id: 'pierce', type: 'mech', icon: '🏹', title: 'Phasen-Schuss', desc: 'Projektile durchschlagen Gegner.', color: '#bf00ff' },
            { id: 'magnet', type: 'mech', icon: '🧲', title: 'Magnetfeld', desc: 'Zieht Energie-Orbs weiter an.', color: '#4444ff' },
            { id: 'bounce', type: 'mech', icon: '🏓', title: 'Querschläger', desc: 'Projektile prallen von Rändern ab.', color: '#00ffff' },
            { id: 'orbital', type: 'mech', icon: '💫', title: 'Plasma-Sonde', desc: 'Sonde kreist um dich und schädigt.', color: '#ff00ff' },
            { id: 'nova', type: 'mech', icon: '🌟', title: 'Nova-Feld', desc: 'Regelmäßige Schockwellen.', color: '#ffffff' },
            { id: 'drone', type: 'mech', icon: '🚁', title: 'Drohne', desc: 'Begleitdrohne, die selbst feuert.', color: '#00ff88' },
            { id: 'chain', type: 'mech', icon: '🌩️', title: 'Kettenblitz', desc: 'Schüsse springen gelegentlich über.', color: '#ffffaa' },
            { id: 'slow', type: 'mech', icon: '⏳', title: 'Zeitverzerrung', desc: 'Aura, die nahe Feinde verlangsamt.', color: '#8800ff' }
        ];

        const initGame = () => {
            game = {
                state: 'playing', time: 0, wave: 1, waveActive: true, waveTime: 0,
                mouse: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
                player: {
                    x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2,
                    speed: 150, radius: 12, hp: 100, maxHp: 100,
                    level: 1, exp: 0, nextExp: 10, fireTimer: 0, fireRate: 0.6, damage: 25, projectiles: 1, pierce: 1,
                    color: '#00ffcc', iFrames: 0,
                    magnet: 80, bounce: 0, regen: 0, crit: 0, orbitals: 0, orbitalAngle: 0, vamp: 0, nova: 0, novaTimer: 0,
                    drone: 0, droneAngle: 0, droneTimer: 0, chain: 0, slow: 0, shield: 0,
                    upgrades: {}
                },
                enemies: [], projectiles: [], orbs: [], particles: [], floatingTexts: [], rings: [], lightnings: [],
                bosses: [], enemyProjectiles: [], bossActive: false, spawnTimer: 0
            };

            availableUpgrades.forEach(u => game.player.upgrades[u.id] = 0);
            uiGameOver.classList.remove('active');
            uiLevelUp.classList.remove('active');
            updateUI();
        };

        const updateUI = () => {
            uiWave.innerText = game.wave;
            uiLvl.innerText = game.player.level;
            const pct = (game.player.exp / game.player.nextExp) * 100;
            uiExpBar.style.width = `${pct}%`;

            const mins = Math.floor(game.time / 60).toString().padStart(2, '0');
            const secs = Math.floor(game.time % 60).toString().padStart(2, '0');
            uiTime.innerText = `${mins}:${secs}`;
        };

        canvas.addEventListener('mousemove', (e) => {
            initAudio();
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            game.mouse.x = (e.clientX - rect.left) * scaleX;
            game.mouse.y = (e.clientY - rect.top) * scaleY;
        });

        btnRestart.addEventListener('click', () => { initGame(); });

        const getNearestEnemy = (x, y) => {
            let targets = [...game.enemies, ...game.bosses];
            if (targets.length === 0) return null;
            let nearest = null;
            let minDist = Infinity;
            targets.forEach(e => {
                const dist = Math.hypot(e.x - x, e.y - y);
                if (dist < minDist) { minDist = dist; nearest = e; }
            });
            return nearest;
        };

        const spawnParticles = (x, y, color, count, speedMult = 1) => {
            for(let i=0; i<count; i++) {
                game.particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 200 * speedMult, vy: (Math.random() - 0.5) * 200 * speedMult,
                    life: 1, maxLife: 0.5 + Math.random() * 0.5,
                    color, size: Math.random() * 3 + 2
                });
            }
        };

        const spawnFloatingText = (x, y, text, color) => {
            game.floatingTexts.push({ x, y, text, color, life: 1 });
        };

        const triggerLevelUp = () => {
            game.state = 'levelup';
            game.player.exp -= game.player.nextExp;
            game.player.level++;
            game.player.nextExp = Math.floor(game.player.nextExp * 1.5);
            updateUI();
            playSound('levelup');

            uiLevelUp.classList.add('active');
            uiCardsContainer.innerHTML = '';

            // Intelligentes Auswahl-System: 1 Stat, 1 Mech, 1 Random
            let stats = availableUpgrades.filter(u => u.type === 'stat');
            let mechs = availableUpgrades.filter(u => u.type === 'mech');

            let s = stats[Math.floor(Math.random() * stats.length)];
            let m = mechs[Math.floor(Math.random() * mechs.length)];
            let pool = availableUpgrades.filter(u => u.id !== s.id && u.id !== m.id);
            let r = pool[Math.floor(Math.random() * pool.length)];

            let choices = [s, m, r].sort(() => 0.5 - Math.random());

            choices.forEach(choice => {
                const card = document.createElement('div');
                card.className = 'ns-card';
                card.style.borderColor = choice.color;
                let currentLvl = game.player.upgrades[choice.id] || 0;

                card.innerHTML = `
                    <div class="ns-card-icon">${choice.icon}</div>
                    <div class="ns-card-title" style="color: ${choice.color}">${choice.title} (Lvl ${currentLvl + 1})</div>
                    <div class="ns-card-desc">${choice.desc}</div>
                `;
                card.onclick = () => {
                    applyUpgrade(choice.id);
                    uiLevelUp.classList.remove('active');
                    game.state = 'playing';
                    playSound('exp');
                };
                uiCardsContainer.appendChild(card);
            });
        };

        const applyUpgrade = (id) => {
            const p = game.player;
            p.upgrades[id]++;

            if (id === 'dmg') p.damage *= 1.3;
            else if (id === 'rate') p.fireRate = Math.max(0.1, p.fireRate * 0.8);
            else if (id === 'multi') p.projectiles += 1;
            else if (id === 'speed') p.speed += 30;
            else if (id === 'hp') { p.maxHp += 25; p.hp = p.maxHp; }
            else if (id === 'pierce') p.pierce += 1;
            else if (id === 'magnet') p.magnet += 60;
            else if (id === 'bounce') p.bounce += 1;
            else if (id === 'regen') p.regen += 2;
            else if (id === 'crit') p.crit += 0.15;
            else if (id === 'orbital') p.orbitals += 1;
            else if (id === 'vamp') p.vamp += 0.05;
            else if (id === 'nova') p.nova += 1;
            else if (id === 'drone') p.drone += 1;
            else if (id === 'chain') p.chain += 1;
            else if (id === 'slow') p.slow += 1;
            else if (id === 'shield') p.shield += 1;

            spawnFloatingText(p.x, p.y - 20, "SYSTEM OPTIMIERT", '#ffff00');
        };

        const spawnEnemy = () => {
            let x, y;
            if (Math.random() > 0.5) { x = Math.random() > 0.5 ? -30 : CANVAS_WIDTH + 30; y = Math.random() * CANVAS_HEIGHT; }
            else { x = Math.random() * CANVAS_WIDTH; y = Math.random() > 0.5 ? -30 : CANVAS_HEIGHT + 30; }

            let type = 0; let rand = Math.random();
            if (game.wave >= 5 && rand > 0.85) type = 4;
            else if (game.wave >= 3 && rand > 0.7) type = 3;
            else if (game.wave >= 2 && rand > 0.5) type = 2;
            else if (game.wave >= 1 && rand > 0.4) type = 1;

            let waveMult = 1 + (game.wave - 1) * 0.35;
            let hp = 30 * waveMult; let speed = 60 + (game.wave * 2); let radius = 10;
            let color = '#ff0055'; let exp = 1 + Math.floor(game.wave / 3);
            let isSplitter = false; let dashPhase = 0;

            if (type === 1) { hp *= 0.5; speed = 110 + (game.wave * 2); color = '#ffaa00'; radius = 8; exp += 1; }
            if (type === 2) { hp *= 4; speed = 35 + game.wave; color = '#bf00ff'; radius = 18; exp += 3; }
            if (type === 3) { hp *= 0.8; speed = 80 + game.wave; color = '#00ffcc'; radius = 12; exp += 2; dashPhase = Math.random() * Math.PI * 2; }
            if (type === 4) { hp *= 6; speed = 25 + game.wave; color = '#ff5500'; radius = 24; exp += 10; isSplitter = true; }

            game.enemies.push({ x, y, hp, maxHp: hp, speed, radius, color, exp, type, isSplitter, dashPhase, waveMult });
        };

        const spawnBoss = () => {
            playSound('boss');
            game.bosses.push({
                x: CANVAS_WIDTH / 2, y: -100, targetY: 150,
                hp: 1500 * game.wave, maxHp: 1500 * game.wave,
                radius: 50, color: '#ff0055', rotation: 0,
                attackTimer: 3, spawnTimer: 5, waveMult: 1 + (game.wave - 1) * 0.35
            });
            triggerShake(15);
        };

        const handleEnemyDeath = (e, index) => {
            spawnParticles(e.x, e.y, e.color, 15, 1.5);
            game.orbs.push({ x: e.x, y: e.y, exp: e.exp, color: '#00ffcc', radius: e.type === 4 ? 8 : 4 });

            if (e.isSplitter) {
                for(let k = 0; k < 3; k++) {
                    game.enemies.push({
                        x: e.x + (Math.random() - 0.5) * 40, y: e.y + (Math.random() - 0.5) * 40,
                        hp: 25 * e.waveMult, maxHp: 25 * e.waveMult, speed: 120, radius: 8, color: '#ffaa00', exp: 2, type: 1
                    });
                }
                triggerShake();
            }
            game.enemies.splice(index, 1);
        };

        const applyDamageToPlayer = (amount, sourceX, sourceY) => {
            const p = game.player;
            if (p.iFrames > 0) return;

            // Schild-Logik
            let dmg = amount * Math.max(0.1, (1 - p.shield * 0.1));
            p.hp -= dmg;
            p.iFrames = 1.0;
            spawnParticles(p.x, p.y, '#ff0000', 20, 2);
            playSound('hit');
            triggerShake();

            if (p.shield > 0 && sourceX && sourceY) {
                let sDmg = p.damage * p.shield * 2;
                game.lightnings.push({x1: p.x, y1: p.y, x2: sourceX, y2: sourceY, life: 0.3, color: '#00ccff'});

                let target = game.enemies.find(en => Math.hypot(en.x - sourceX, en.y - sourceY) < 20) ||
                    game.bosses.find(b => Math.hypot(b.x - sourceX, b.y - sourceY) < 60);
                if (target) {
                    target.hp -= sDmg;
                    spawnFloatingText(sourceX, sourceY - 10, Math.floor(sDmg), '#00ccff');
                    if (target.hp <= 0 && game.enemies.includes(target)) handleEnemyDeath(target, game.enemies.indexOf(target));
                }
            }

            if (p.hp <= 0) {
                game.state = 'gameover';
                uiFinalTime.innerText = uiTime.innerText;
                uiGameOver.classList.add('active');
            }
        };

        const update = (delta) => {
            if (game.state !== 'playing') return;

            game.time += delta;
            let isBossWave = game.wave % 5 === 0;

            if (game.waveActive) {
                game.waveTime += delta;

                if (isBossWave) {
                    if (!game.bossActive && game.waveTime > 2) {
                        spawnBoss();
                        game.bossActive = true;
                    }
                    if (game.bossActive && game.bosses.length === 0) {
                        game.waveActive = false; game.waveTime = 0; game.bossActive = false;
                        spawnFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40, "MUTTERSCHIFF ZERSTÖRT", '#00ffcc');
                        game.player.exp += 150 * game.wave; // Boss Reward
                        playSound('exp');
                    }
                } else {
                    if (game.waveTime >= 45) {
                        game.waveActive = false; game.waveTime = 0;
                        spawnFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40, "WELLE ABGESCHLOSSEN", '#00ffcc');
                    }
                }
            } else {
                game.waveTime += delta;
                if (game.waveTime >= 5) {
                    game.wave++; game.waveActive = true; game.waveTime = 0;
                    spawnFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40, `WELLE ${game.wave}`, '#ff007f');
                }
            }

            updateUI();

            const p = game.player;

            if (p.regen > 0) p.hp = Math.min(p.maxHp, p.hp + p.regen * delta);
            p.orbitalAngle += 3 * delta;

            if (p.nova > 0) {
                p.novaTimer -= delta;
                if (p.novaTimer <= 0) {
                    p.novaTimer = 3.0;
                    let nRadius = 80 + (p.nova * 20); let nDmg = p.damage * 2 * p.nova;
                    game.rings.push({ x: p.x, y: p.y, radius: 10, maxRadius: nRadius, life: 1, color: '#ffffff' });

                    [...game.enemies, ...game.bosses].forEach((e, i) => {
                        if (Math.hypot(e.x - p.x, e.y - p.y) <= nRadius) {
                            e.hp -= nDmg; spawnFloatingText(e.x, e.y, Math.floor(nDmg), '#ffffff');
                            if (e.hp <= 0 && game.enemies.includes(e)) handleEnemyDeath(e, game.enemies.indexOf(e));
                        }
                    });
                }
            }

            if (p.drone > 0) {
                p.droneTimer -= delta; p.droneAngle += delta * 2;
                let dx = p.x + Math.cos(p.droneAngle) * 60; let dy = p.y + Math.sin(p.droneAngle) * 60;
                game.dronePos = {x: dx, y: dy}; // For drawing

                if (p.droneTimer <= 0) {
                    p.droneTimer = Math.max(0.2, 1.0 - p.drone*0.1);
                    let target = getNearestEnemy(dx, dy);
                    if (target) {
                        let a = Math.atan2(target.y - dy, target.x - dx);
                        game.projectiles.push({
                            x: dx, y: dy, vx: Math.cos(a)*500, vy: Math.sin(a)*500,
                            damage: p.damage * 0.6 * p.drone, pierce: 1, hitIds: new Set(), color: '#00ff88', radius: 4, life: 2, bounce: 0
                        });
                    }
                }
            }

            const dx = game.mouse.x - p.x; const dy = game.mouse.y - p.y;
            if (Math.hypot(dx, dy) > 5) {
                p.x += (dx / Math.hypot(dx, dy)) * p.speed * delta;
                p.y += (dy / Math.hypot(dx, dy)) * p.speed * delta;
            }

            p.x = Math.max(p.radius, Math.min(CANVAS_WIDTH - p.radius, p.x));
            p.y = Math.max(p.radius, Math.min(CANVAS_HEIGHT - p.radius, p.y));

            if (p.iFrames > 0) p.iFrames -= delta;

            p.fireTimer -= delta;
            if (p.fireTimer <= 0) {
                const target = getNearestEnemy(p.x, p.y);
                if (target) {
                    playSound('shoot'); p.fireTimer = p.fireRate;
                    const angleToTarget = Math.atan2(target.y - p.y, target.x - p.x);
                    const spread = 0.2; const startAngle = angleToTarget - (spread * (p.projectiles - 1)) / 2;

                    for(let i=0; i<p.projectiles; i++) {
                        const a = startAngle + (i * spread);
                        game.projectiles.push({
                            x: p.x, y: p.y, vx: Math.cos(a) * 400, vy: Math.sin(a) * 400,
                            damage: p.damage, pierce: p.pierce, hitIds: new Set(), color: '#00ffcc', radius: 4, life: 3, bounce: p.bounce
                        });
                    }
                }
            }

            if (game.waveActive && (!isBossWave || game.waveTime < 2)) {
                game.spawnTimer -= delta;
                if (game.spawnTimer <= 0) {
                    spawnEnemy(); game.spawnTimer = Math.max(0.15, 1.5 - (game.wave * 0.15));
                }
            }

            // Boss Logik
            game.bosses.forEach((b, i) => {
                b.rotation += delta * 0.5;
                if (b.y < b.targetY) b.y += 50 * delta;

                b.attackTimer -= delta;
                if (b.attackTimer <= 0 && b.y >= b.targetY) {
                    b.attackTimer = Math.max(1, 3 - game.wave*0.05);
                    playSound('shoot');
                    for(let a=0; a<Math.PI*2; a+=Math.PI/8) {
                        game.enemyProjectiles.push({
                            x: b.x, y: b.y, vx: Math.cos(a)*200, vy: Math.sin(a)*200,
                            radius: 6, color: '#ff0055', damage: 20
                        });
                    }
                }

                b.spawnTimer -= delta;
                if (b.spawnTimer <= 0 && b.y >= b.targetY) {
                    b.spawnTimer = 4;
                    for(let k=0; k<4; k++) {
                        game.enemies.push({
                            x: b.x, y: b.y + 30, hp: 40 * b.waveMult, maxHp: 40 * b.waveMult,
                            speed: 130 + game.wave*2, radius: 8, color: '#ffaa00',
                            exp: 3, type: 1, isSplitter: false, dashPhase: 0, waveMult: b.waveMult
                        });
                    }
                }

                if (p.iFrames <= 0 && Math.hypot(b.x - p.x, b.y - p.y) < b.radius + p.radius) {
                    applyDamageToPlayer(40, b.x, b.y);
                }
            });

            // Feindliche Projektile
            for (let i = game.enemyProjectiles.length - 1; i >= 0; i--) {
                let ep = game.enemyProjectiles[i];
                ep.x += ep.vx * delta; ep.y += ep.vy * delta;

                if (ep.x < 0 || ep.x > CANVAS_WIDTH || ep.y < 0 || ep.y > CANVAS_HEIGHT) {
                    game.enemyProjectiles.splice(i, 1); continue;
                }

                if (p.iFrames <= 0 && Math.hypot(ep.x - p.x, ep.y - p.y) < ep.radius + p.radius) {
                    applyDamageToPlayer(ep.damage, ep.x, ep.y);
                    game.enemyProjectiles.splice(i, 1);
                }
            }

            // Spieler Projektile
            for (let i = game.projectiles.length - 1; i >= 0; i--) {
                let proj = game.projectiles[i];
                proj.x += proj.vx * delta; proj.y += proj.vy * delta; proj.life -= delta;

                if (Math.random() > 0.5) spawnParticles(proj.x, proj.y, proj.color, 1, 0.2);

                if (proj.x < 0 || proj.x > CANVAS_WIDTH) {
                    if (proj.bounce > 0) { proj.vx *= -1; proj.bounce--; proj.x = Math.max(0, Math.min(CANVAS_WIDTH, proj.x)); }
                    else { game.projectiles.splice(i, 1); continue; }
                }
                if (proj.y < 0 || proj.y > CANVAS_HEIGHT) {
                    if (proj.bounce > 0) { proj.vy *= -1; proj.bounce--; proj.y = Math.max(0, Math.min(CANVAS_HEIGHT, proj.y)); }
                    else { game.projectiles.splice(i, 1); continue; }
                }

                if (proj.life <= 0) { game.projectiles.splice(i, 1); continue; }

                let projRemoved = false;
                let targets = [...game.enemies, ...game.bosses];

                for (let j = targets.length - 1; j >= 0; j--) {
                    let e = targets[j];
                    if (Math.hypot(e.x - proj.x, e.y - proj.y) < e.radius + proj.radius) {
                        if (!proj.hitIds.has(e)) {
                            proj.hitIds.add(e);

                            let isCrit = Math.random() < p.crit;
                            let finalDmg = isCrit ? proj.damage * 2 : proj.damage;
                            e.hp -= finalDmg;

                            playSound('hit'); spawnParticles(e.x, e.y, proj.color, 3, 0.5);

                            if (isCrit) spawnFloatingText(e.x, e.y - 10, "CRIT!", '#ffaa00');
                            else spawnFloatingText(e.x, e.y - 10, Math.floor(finalDmg), '#ffffff');

                            if (p.vamp > 0 && Math.random() < p.vamp) {
                                p.hp = Math.min(p.maxHp, p.hp + 2); spawnFloatingText(p.x, p.y - 20, "+2", '#cc0000');
                            }

                            // Kettenblitz
                            if (p.chain > 0 && Math.random() < 0.15 + (p.chain * 0.05)) {
                                let nearby = game.enemies.filter(en => en !== e && Math.hypot(en.x - e.x, en.y - e.y) < 150);
                                if (nearby.length > 0) {
                                    let next = nearby[Math.floor(Math.random() * nearby.length)];
                                    next.hp -= proj.damage * 0.5 * p.chain;
                                    game.lightnings.push({x1: e.x, y1: e.y, x2: next.x, y2: next.y, life: 0.3, color: '#ffff00'});
                                    if (next.hp <= 0) handleEnemyDeath(next, game.enemies.indexOf(next));
                                }
                            }

                            if (e.hp <= 0) {
                                if (game.enemies.includes(e)) handleEnemyDeath(e, game.enemies.indexOf(e));
                                else if (game.bosses.includes(e)) {
                                    spawnParticles(e.x, e.y, e.color, 50, 3);
                                    triggerShake(20);
                                    game.bosses.splice(game.bosses.indexOf(e), 1);
                                }
                            }

                            proj.pierce--;
                            if (proj.pierce <= 0) { game.projectiles.splice(i, 1); projRemoved = true; break; }
                        }
                    }
                }
            }

            for (let i = game.enemies.length - 1; i >= 0; i--) {
                let e = game.enemies[i]; let isDead = false;
                const angle = Math.atan2(p.y - e.y, p.x - e.x);

                let moveSpeed = e.speed;
                if (e.type === 3) {
                    e.dashPhase += delta * 5; moveSpeed = e.speed + Math.sin(e.dashPhase) * 120;
                    if (moveSpeed < 0) moveSpeed = 0;
                }

                // Zeitverzerrung Aura
                if (p.slow > 0 && Math.hypot(e.x - p.x, e.y - p.y) < 120 + p.slow * 20) {
                    moveSpeed *= Math.max(0.2, 0.8 - p.slow * 0.1);
                }

                e.x += Math.cos(angle) * moveSpeed * delta; e.y += Math.sin(angle) * moveSpeed * delta;

                if (p.orbitals > 0) {
                    for(let o = 0; o < p.orbitals; o++) {
                        let orbAngle = p.orbitalAngle + (o / p.orbitals) * Math.PI * 2;
                        let ox = p.x + Math.cos(orbAngle) * 45; let oy = p.y + Math.sin(orbAngle) * 45;

                        if (Math.hypot(e.x - ox, e.y - oy) < e.radius + 6) {
                            e.hp -= (p.damage * 1.5) * delta;
                            if (Math.random() < 0.2) spawnParticles(e.x, e.y, '#ff00ff', 1, 0.5);
                            if (e.hp <= 0) { handleEnemyDeath(e, i); isDead = true; break; }
                        }
                    }
                }
                if (isDead) continue;

                if (p.iFrames <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius - 2) {
                    applyDamageToPlayer(15, e.x, e.y);
                }
            }

            for (let i = game.orbs.length - 1; i >= 0; i--) {
                let orb = game.orbs[i];
                if (Math.hypot(p.x - orb.x, p.y - orb.y) < p.magnet) {
                    const angle = Math.atan2(p.y - orb.y, p.x - orb.x);
                    orb.x += Math.cos(angle) * 350 * delta; orb.y += Math.sin(angle) * 350 * delta;
                }

                if (Math.hypot(p.x - orb.x, p.y - orb.y) < p.radius + orb.radius) {
                    p.exp += orb.exp; playSound('exp'); game.orbs.splice(i, 1);
                    if (p.exp >= p.nextExp) { triggerLevelUp(); updateUI(); }
                    updateUI();
                }
            }

            game.particles.forEach((pt, i) => { pt.x += pt.vx * delta; pt.y += pt.vy * delta; pt.life -= delta * 2; if (pt.life <= 0) game.particles.splice(i, 1); });
            game.floatingTexts.forEach((ft, i) => { ft.y -= 30 * delta; ft.life -= delta; if (ft.life <= 0) game.floatingTexts.splice(i, 1); });
            game.rings.forEach((r, i) => { r.radius += delta * 300; r.life -= delta * 2; if (r.life <= 0) game.rings.splice(i, 1); });
            game.lightnings.forEach((l, i) => { l.life -= delta * 2; if (l.life <= 0) game.lightnings.splice(i, 1); });
            game.gridOffset = (game.gridOffset + 10 * delta) % 40;
        };

        const triggerShake = (intensity = 8) => {
            canvas.style.transform = `translate(${intensity}px, ${intensity}px)`;
            setTimeout(() => canvas.style.transform = `translate(-${intensity}px, -${intensity}px)`, 40);
            setTimeout(() => canvas.style.transform = `translate(${intensity/2}px, -${intensity/2}px)`, 80);
            setTimeout(() => canvas.style.transform = 'translate(0, 0)', 120);
        };

        const draw = () => {
            ctx.fillStyle = 'rgba(8, 8, 12, 0.4)'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.strokeStyle = 'rgba(0, 255, 204, 0.05)'; ctx.lineWidth = 1; ctx.beginPath();
            for(let i=game.gridOffset; i<=CANVAS_WIDTH; i+=40) { ctx.moveTo(i,0); ctx.lineTo(i,CANVAS_HEIGHT); }
            for(let i=game.gridOffset; i<=CANVAS_HEIGHT; i+=40) { ctx.moveTo(0,i); ctx.lineTo(CANVAS_WIDTH,i); }
            ctx.stroke();

            const p = game.player;
            // Draw Slow Aura
            if (p.slow > 0) {
                ctx.fillStyle = 'rgba(136, 0, 255, 0.05)'; ctx.strokeStyle = 'rgba(136, 0, 255, 0.2)';
                ctx.beginPath(); ctx.arc(p.x, p.y, 120 + p.slow * 20, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            }

            game.rings.forEach(r => {
                ctx.strokeStyle = r.color; ctx.globalAlpha = Math.max(0, r.life); ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(r.x, r.y, r.radius, 0, Math.PI*2); ctx.stroke(); ctx.globalAlpha = 1;
            });

            game.lightnings.forEach(l => {
                ctx.strokeStyle = l.color; ctx.globalAlpha = Math.max(0, l.life); ctx.lineWidth = 2;
                ctx.shadowBlur = 10; ctx.shadowColor = l.color;
                ctx.beginPath(); ctx.moveTo(l.x1, l.y1);
                // Mache den Blitz etwas zackig
                let mx = (l.x1 + l.x2)/2 + (Math.random() - 0.5)*20;
                let my = (l.y1 + l.y2)/2 + (Math.random() - 0.5)*20;
                ctx.lineTo(mx, my); ctx.lineTo(l.x2, l.y2); ctx.stroke();
                ctx.globalAlpha = 1; ctx.shadowBlur = 0;
            });

            game.orbs.forEach(orb => {
                ctx.fillStyle = orb.color; ctx.shadowBlur = 10; ctx.shadowColor = orb.color;
                ctx.beginPath(); ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI*2); ctx.fill();
            });
            ctx.shadowBlur = 0;

            game.enemies.forEach(e => {
                ctx.strokeStyle = e.color; ctx.fillStyle = '#050508'; ctx.lineWidth = 2;
                ctx.shadowBlur = 10; ctx.shadowColor = e.color;
                ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.atan2(game.player.y - e.y, game.player.x - e.x));

                if (e.type === 0) { ctx.beginPath(); ctx.moveTo(-e.radius, -e.radius); ctx.lineTo(e.radius, 0); ctx.lineTo(-e.radius, e.radius); ctx.closePath(); ctx.fill(); ctx.stroke(); }
                else if (e.type === 1) { ctx.beginPath(); ctx.moveTo(-e.radius, -e.radius*0.5); ctx.lineTo(e.radius, 0); ctx.lineTo(-e.radius, e.radius*0.5); ctx.closePath(); ctx.fill(); ctx.stroke(); }
                else if (e.type === 2) { ctx.beginPath(); for(let j=0; j<6; j++) ctx.lineTo(e.radius * Math.cos(j * Math.PI / 3), e.radius * Math.sin(j * Math.PI / 3)); ctx.closePath(); ctx.fill(); ctx.stroke(); }
                else if (e.type === 3) {
                    ctx.beginPath();
                    for(let j=0; j<5; j++) { ctx.lineTo(e.radius * Math.cos(j * Math.PI * 2 / 5), e.radius * Math.sin(j * Math.PI * 2 / 5)); ctx.lineTo((e.radius/2) * Math.cos((j + 0.5) * Math.PI * 2 / 5), (e.radius/2) * Math.sin((j + 0.5) * Math.PI * 2 / 5)); }
                    ctx.closePath(); ctx.fill(); ctx.stroke();
                }
                else if (e.type === 4) { ctx.beginPath(); ctx.moveTo(0, -e.radius); ctx.lineTo(e.radius, 0); ctx.lineTo(0, e.radius); ctx.lineTo(-e.radius, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
                ctx.restore();
            });

            // Boss Draw
            game.bosses.forEach(b => {
                ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rotation);

                ctx.strokeStyle = b.color; ctx.fillStyle = '#050508'; ctx.lineWidth = 4;
                ctx.shadowBlur = 20; ctx.shadowColor = b.color;
                ctx.beginPath();
                for(let i=0; i<8; i++) {
                    ctx.lineTo(b.radius * Math.cos(i*Math.PI/4), b.radius * Math.sin(i*Math.PI/4));
                    ctx.lineTo((b.radius+20) * Math.cos((i+0.5)*Math.PI/4), (b.radius+20) * Math.sin((i+0.5)*Math.PI/4));
                }
                ctx.closePath(); ctx.fill(); ctx.stroke();

                ctx.rotate(-b.rotation * 2);
                ctx.fillStyle = '#ffaa00'; ctx.shadowBlur = 10; ctx.shadowColor = '#ffaa00';
                ctx.beginPath();
                for(let j=0; j<6; j++) ctx.lineTo(25 * Math.cos(j * Math.PI / 3), 25 * Math.sin(j * Math.PI / 3));
                ctx.closePath(); ctx.fill();
                ctx.restore();

                // Boss HP Bar
                ctx.fillStyle = 'rgba(255,0,0,0.3)'; ctx.fillRect(CANVAS_WIDTH/2 - 150, 20, 300, 15);
                ctx.fillStyle = '#ff0055'; ctx.fillRect(CANVAS_WIDTH/2 - 150, 20, 300 * (Math.max(0, b.hp)/b.maxHp), 15);
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(CANVAS_WIDTH/2 - 150, 20, 300, 15);
                ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText("MUTTERSCHIFF", CANVAS_WIDTH/2, 15);
            });
            ctx.shadowBlur = 0;

            game.enemyProjectiles.forEach(ep => {
                ctx.fillStyle = ep.color; ctx.shadowBlur = 15; ctx.shadowColor = ep.color;
                ctx.beginPath(); ctx.arc(ep.x, ep.y, ep.radius, 0, Math.PI*2); ctx.fill();
            });

            game.projectiles.forEach(pj => {
                ctx.fillStyle = pj.color; ctx.shadowBlur = 15; ctx.shadowColor = pj.color;
                ctx.beginPath(); ctx.arc(pj.x, pj.y, pj.radius, 0, Math.PI*2); ctx.fill();
            });
            ctx.shadowBlur = 0;

            game.particles.forEach(pt => {
                ctx.fillStyle = pt.color; ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
                ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI*2); ctx.fill();
            });
            ctx.globalAlpha = 1;

            if (game.state !== 'gameover') {
                ctx.save(); ctx.translate(p.x, p.y);
                if (p.iFrames > 0 && Math.floor(game.time * 10) % 2 === 0) ctx.globalAlpha = 0.3;

                // Player Shield
                if (p.shield > 0) {
                    ctx.strokeStyle = 'rgba(0, 204, 255, 0.5)'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.arc(0, 0, p.radius + 6, 0, Math.PI*2); ctx.stroke();
                }

                ctx.strokeStyle = p.color; ctx.fillStyle = '#08080c'; ctx.lineWidth = 3;
                ctx.shadowBlur = 20; ctx.shadowColor = p.color;
                ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();

                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(0, 0, p.radius * 0.4, 0, Math.PI*2); ctx.fill();

                if (p.orbitals > 0) {
                    for(let o = 0; o < p.orbitals; o++) {
                        let orbAngle = p.orbitalAngle + (o / p.orbitals) * Math.PI * 2;
                        let ox = Math.cos(orbAngle) * 45; let oy = Math.sin(orbAngle) * 45;
                        ctx.fillStyle = '#ff00ff'; ctx.shadowBlur = 15; ctx.shadowColor = '#ff00ff';
                        ctx.beginPath(); ctx.arc(ox, oy, 5, 0, Math.PI*2); ctx.fill();
                    }
                }
                ctx.restore();

                // Draw Drone
                if (p.drone > 0 && game.dronePos) {
                    ctx.save(); ctx.translate(game.dronePos.x, game.dronePos.y);
                    ctx.fillStyle = '#050508'; ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 2;
                    ctx.shadowBlur = 10; ctx.shadowColor = '#00ff88';
                    ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, 0); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
                    ctx.restore();
                }

                ctx.fillStyle = 'rgba(255,0,0,0.5)'; ctx.fillRect(p.x - 15, p.y + 25, 30, 4);
                ctx.fillStyle = '#00ff66'; ctx.shadowBlur = 5; ctx.shadowColor = '#00ff66';
                ctx.fillRect(p.x - 15, p.y + 25, 30 * (Math.max(0, p.hp) / p.maxHp), 4);
                ctx.shadowBlur = 0;
            }

            game.floatingTexts.forEach(ft => {
                ctx.fillStyle = ft.color; ctx.globalAlpha = Math.max(0, ft.life);
                ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
                ctx.shadowBlur = 5; ctx.shadowColor = ft.color; ctx.fillText(ft.text, ft.x, ft.y);
            });
            ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        };

        const loop = (timestamp) => {
            if (!lastTime) lastTime = timestamp;
            let delta = (timestamp - lastTime) / 1000;
            if (delta > 0.1) delta = 0.1;
            lastTime = timestamp;
            update(delta); draw();
            animationId = requestAnimationFrame(loop);
        };

        initGame(); animationId = requestAnimationFrame(loop);
        return { destroy: () => { cancelAnimationFrame(animationId); } };
    }
};