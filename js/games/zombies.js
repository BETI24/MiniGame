export default {
    manifest: {
        id: 'zombie-shooter',
        name: 'Neon Breach: Cyber Survival',
        description: 'Ein extrem süchtig machender Neon-Zombieshooter mit dezentem Sidebar-Design, ausbalancierten Bossen, Low-HP-Alarmeffekten, Web-Audio-Sounds, Granaten und Waffen-Drops.',
        icon: '⚡',
        imageUrl: 'js/assets/images/zombie.png',
        tags: ['Action', 'Shooter', 'Neon', 'Arcade']
    },
    init: (container, services) => {
        const style = document.createElement('style');
        style.textContent = `
            .nb-wrapper {
                box-sizing: border-box;
                user-select: none;
                margin: 0;
                padding: 0;
                background: #05050a;
                color: #00ffff;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                overflow: hidden;
                height: 100%;
                width: 100%;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                position: relative;
                gap: 15px;
            }
            .nb-wrapper * {
                box-sizing: border-box;
            }
            .nb-game-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            .nb-hud {
                display: flex;
                gap: 18px;
                margin-bottom: 8px;
                font-size: 14px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
                text-shadow: 0 0 10px rgba(0,255,255,0.6);
                z-index: 10;
            }
            .nb-canvas {
                background: #0b0b16;
                border: 2px solid #00ffff;
                box-shadow: 0 0 25px rgba(0, 255, 255, 0.3), inset 0 0 15px rgba(0, 255, 255, 0.1);
                cursor: crosshair;
                display: block;
                transition: transform 0.05s ease;
            }
            .nb-sidebar {
                width: 180px;
                background: #090910;
                border: 2px solid #2a2a3c;
                box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
                padding: 15px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .nb-sidebar h3 {
                margin: 0 0 5px 0;
                font-size: 14px;
                color: #888899;
                text-align: center;
                border-bottom: 1px solid #2a2a3c;
                padding-bottom: 5px;
                text-shadow: none;
            }
            .nb-key-group {
                display: flex;
                flex-direction: column;
                gap: 3px;
            }
            .nb-key-title {
                color: #aaaaaa;
                font-size: 11px;
                font-weight: bold;
            }
            .nb-key-desc {
                color: #666677;
                font-size: 11px;
            }
        `;
        container.appendChild(style);

        const wrapper = document.createElement('div');
        wrapper.className = 'nb-wrapper';
        wrapper.innerHTML = `
            <div class="nb-sidebar">
                <h3>Steuerung</h3>
                <div class="nb-key-group">
                    <span class="nb-key-title">[ W ] [ A ] [ S ] [ D ]</span>
                    <span class="nb-key-desc">Bewegung</span>
                </div>
                <div class="nb-key-group">
                    <span class="nb-key-title">Maus + Linksklick</span>
                    <span class="nb-key-desc">Zielen & Dauerfeuer</span>
                </div>
                <div class="nb-key-group">
                    <span class="nb-key-title">[ LEERTASTE ]</span>
                    <span class="nb-key-desc">Bombe / Granate platzieren</span>
                </div>
                <div class="nb-key-group">
                    <span class="nb-key-title">[ R ]</span>
                    <span class="nb-key-desc">Neustart (nach Game Over)</span>
                </div>
            </div>
            <div class="nb-game-container">
                <div class="nb-hud">
                    <div>Welle: <span id="nb-wave">1</span></div>
                    <div>Schild: <span id="nb-hp">100</span></div>
                    <div>Waffe: <span id="nb-weapon" style="color: #ffff00;">Standard</span></div>
                    <div>Granaten: <span id="nb-grenades" style="color: #00ff00;">0</span></div>
                    <div>Score: <span id="nb-score">0</span></div>
                    <div>Combo: <span id="nb-combo">1x</span></div>
                </div>
                <canvas id="nb-canvas" width="800" height="550" class="nb-canvas"></canvas>
            </div>
        `;
        container.appendChild(wrapper);

        const canvas = wrapper.querySelector('#nb-canvas');
        const ctx = canvas.getContext('2d');
        const waveEl = wrapper.querySelector('#nb-wave');
        const hpEl = wrapper.querySelector('#nb-hp');
        const weaponEl = wrapper.querySelector('#nb-weapon');
        const grenadesEl = wrapper.querySelector('#nb-grenades');
        const scoreEl = wrapper.querySelector('#nb-score');
        const comboEl = wrapper.querySelector('#nb-combo');

        // --- Web Audio API Sound-System ---
        let audioCtx = null;
        const initAudio = () => {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        };

        const playSound = (type) => {
            if (!audioCtx) return;
            if (audioCtx.state === 'suspended') audioCtx.resume();

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            const now = audioCtx.currentTime;

            if (type === 'Standard') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.linearRampToValueAtTime(0.005, now + 0.08);
                osc.start(now); osc.stop(now + 0.08);
            } else if (type === 'Shotgun') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.linearRampToValueAtTime(0.005, now + 0.15);
                osc.start(now); osc.stop(now + 0.15);
            } else if (type === 'Machinegun') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.linearRampToValueAtTime(0.005, now + 0.05);
                osc.start(now); osc.stop(now + 0.05);
            } else if (type === 'LaserBeam') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.linearRampToValueAtTime(0.005, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
            } else if (type === 'Railgun') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(1500, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
                gain.gain.setValueAtTime(0.075, now);
                gain.gain.linearRampToValueAtTime(0.005, now + 0.25);
                osc.start(now); osc.stop(now + 0.25);
            } else if (type === 'FlameThrower') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150 + Math.random() * 100, now);
                osc.frequency.linearRampToValueAtTime(80, now + 0.08);
                gain.gain.setValueAtTime(0.025, now);
                gain.gain.linearRampToValueAtTime(0.005, now + 0.08);
                osc.start(now); osc.stop(now + 0.08);
            } else if (type === 'ShockWave') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0.005, now + 0.15);
                osc.start(now); osc.stop(now + 0.15);
            } else if (type === 'grenadeBeep') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.linearRampToValueAtTime(0.005, now + 0.05);
                osc.start(now); osc.stop(now + 0.05);
            } else if (type === 'grenade') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(120, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0.005, now + 0.4);
                osc.start(now); osc.stop(now + 0.4);
            } else if (type === 'kill') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.linearRampToValueAtTime(0.005, now + 0.08);
                osc.start(now); osc.stop(now + 0.08);
            } else if (type === 'heal') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.linearRampToValueAtTime(0.005, now + 0.2);
                osc.start(now); osc.stop(now + 0.2);
            } else if (type === 'lowHpHeartbeat') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(120, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0.005, now + 0.15);
                osc.start(now); osc.stop(now + 0.15);
            }
        };

        // Spielvariablen
        let score = 0;
        let wave = 1;
        let combo = 1;
        let comboTimer = 0;
        let gameOver = false;
        let animationId;
        let gameTime = 0;
        let lowHpTimer = 0;

        const player = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: 14,
            speed: 4.5,
            hp: 100,
            maxHp: 100,
            angle: 0,
            shootTimer: 0,
            fireRate: 10,
            damage: 25,
            weaponType: 'Standard',
            weaponTimer: 0,
            grenades: 1
        };

        let keys = {};
        let mouse = { x: 0, y: 0, down: false };
        let bullets = [];
        let bossBullets = [];
        let zombies = [];
        let particles = [];
        let floatTexts = [];
        let drops = [];
        let activeGrenades = [];
        let explosions = [];

        const weaponTypes = {
            Shotgun: { name: 'Schrotflinte', color: '#ffff00' },
            Machinegun: { name: 'Gatling', color: '#ff8800' },
            LaserBeam: { name: 'Plasma-Laser', color: '#00ffff' },
            Railgun: { name: 'Railgun', color: '#bf00ff' },
            FlameThrower: { name: 'Flammen-Strahler', color: '#ff3300' },
            ShockWave: { name: 'Schock-Welle', color: '#33ff33' }
        };

        const resetGame = () => {
            initAudio();
            score = 0;
            wave = 1;
            combo = 1;
            comboTimer = 0;
            gameOver = false;
            lowHpTimer = 0;
            player.x = canvas.width / 2;
            player.y = canvas.height / 2;
            player.hp = 100;
            player.weaponType = 'Standard';
            player.weaponTimer = 0;
            player.fireRate = 10;
            player.damage = 25;
            player.grenades = 1;
            bullets = [];
            bossBullets = [];
            zombies = [];
            particles = [];
            floatTexts = [];
            drops = [];
            activeGrenades = [];
            explosions = [];
            startWave();
        };

        const handleKeyDown = (e) => {
            initAudio();
            keys[e.code] = true;
            if (gameOver && e.code === 'KeyR') {
                resetGame();
            }
            if (!gameOver && e.code === 'Space') {
                e.preventDefault();
                if (player.grenades > 0) {
                    player.grenades--;
                    activeGrenades.push({ x: player.x, y: player.y, timer: 120 });
                    floatTexts.push({ x: player.x, y: player.y - 15, text: '💣 GEPFLANZT!', alpha: 1, color: '#00ff00' });
                }
            }
        };

        const handleKeyUp = (e) => keys[e.code] = false;
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };
        const handleMouseDown = () => {
            initAudio();
            mouse.down = true;
        };
        const handleMouseUp = () => mouse.down = false;

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);

        const triggerShake = (intensity = 4) => {
            canvas.style.transform = `translate(${(Math.random()-0.5)*intensity}px, ${(Math.random()-0.5)*intensity}px)`;
            setTimeout(() => canvas.style.transform = 'translate(0, 0)', 50);
        };

        const startWave = () => {
            if (wave % 5 === 0) {
                let bossTier = wave / 5;
                let bossConfig = getBossConfig(bossTier);

                zombies.push({
                    x: canvas.width / 2,
                    y: -50,
                    radius: 42,
                    speed: bossConfig.speed,
                    hp: bossConfig.hp,
                    maxHp: bossConfig.hp,
                    color: bossConfig.color,
                    type: 'boss',
                    bossName: bossConfig.name,
                    attackTimer: 0,
                    attackInterval: bossConfig.interval,
                    tier: bossTier
                });

                floatTexts.push({ x: canvas.width / 2, y: canvas.height / 2, text: `⚠️ BOSS: ${bossConfig.name.toUpperCase()} ⚠️`, alpha: 2.0, color: bossConfig.color });
                triggerShake(12);
            } else {
                const count = 5 + wave * 3;
                for (let i = 0; i < count; i++) {
                    const edge = Math.floor(Math.random() * 4);
                    let zx, zy;
                    if (edge === 0) { zx = Math.random() * canvas.width; zy = -30; }
                    else if (edge === 1) { zx = canvas.width + 30; zy = Math.random() * canvas.height; }
                    else if (edge === 2) { zx = Math.random() * canvas.width; zy = canvas.height + 30; }
                    else { zx = -30; zy = Math.random() * canvas.height; }

                    let rand = Math.random();
                    let type = 'zombie';
                    let radius = 13;
                    let speed = 1.6 + Math.random() * 0.6 + (wave * 0.08);
                    let hp = 25 + wave * 10;
                    let color = '#ff007f';

                    if (wave >= 2 && rand < 0.25) {
                        type = 'runner'; radius = 10; speed = 2.8 + (wave * 0.05); hp = 15 + wave * 5; color = '#00ffff';
                    } else if (wave >= 3 && rand > 0.75) {
                        type = 'tank'; radius = 22; speed = 0.9 + (wave * 0.04); hp = 80 + wave * 30; color = '#ff8800';
                    } else if (wave >= 4 && rand >= 0.4 && rand <= 0.55) {
                        type = 'stalker'; radius = 12; speed = 2.1 + (wave * 0.06); hp = 40 + wave * 15; color = '#bf00ff';
                    }

                    zombies.push({ x: zx, y: zy, radius, speed, hp, maxHp: hp, color, type });
                }
            }
        };

        const getBossConfig = (tier) => {
            switch(tier) {
                case 1:
                    return { name: 'Cyber-Colossus (Tier I)', color: '#ff0055', hp: 900, speed: 1.35, interval: 55, pattern: 'spread' };
                case 2:
                    return { name: 'Quantum-Overlord (Tier II)', color: '#00ff88', hp: 1600, speed: 1.5, interval: 40, pattern: 'ring' };
                case 3:
                    return { name: 'Neon-Destroyer (Tier III)', color: '#ffbb00', hp: 2400, speed: 1.65, interval: 30, pattern: 'snipe' };
                default:
                    return { name: `Apex-Entity (Tier ${tier})`, color: '#ff00ff', hp: 3200 + (tier * 400), speed: 1.8, interval: 22, pattern: 'chaos' };
            }
        };

        const update = () => {
            if (gameOver) return;
            gameTime++;

            if (player.hp < 30 && player.hp > 0) {
                lowHpTimer++;
                if (lowHpTimer % 45 === 0) {
                    playSound('lowHpHeartbeat');
                }
            } else {
                lowHpTimer = 0;
            }

            if (comboTimer > 0) {
                comboTimer--;
                if (comboTimer === 0) combo = 1;
            }

            if (player.weaponType !== 'Standard') {
                player.weaponTimer--;
                if (player.weaponTimer <= 0) {
                    player.weaponType = 'Standard';
                    player.fireRate = 10;
                    player.damage = 25;
                }
            }

            let dx = 0, dy = 0;
            if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
            if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
            if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
            if (keys['KeyD'] || keys['ArrowRight']) dx = 1;

            if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
            player.x += dx * player.speed;
            player.y += dy * player.speed;

            player.x = Math.max(player.radius + 5, Math.min(canvas.width - player.radius - 5, player.x));
            player.y = Math.max(player.radius + 5, Math.min(canvas.height - player.radius - 5, player.y));

            player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

            for (let i = activeGrenades.length - 1; i >= 0; i--) {
                let g = activeGrenades[i];
                g.timer--;

                if (g.timer % 30 === 0 && g.timer > 0) {
                    playSound('grenadeBeep');
                }

                if (g.timer <= 0) {
                    playSound('grenade');
                    explosions.push({ x: g.x, y: g.y, radius: 10, maxRadius: 150, alpha: 1.0 });
                    triggerShake(13);

                    for (let j = zombies.length - 1; j >= 0; j--) {
                        let z = zombies[j];
                        if (Math.hypot(g.x - z.x, g.y - z.y) < 150) {
                            z.hp -= 85;
                            if (z.hp <= 0) {
                                playSound('kill');
                                score += (z.type === 'boss' ? 1000 : 150) * combo;
                                zombies.splice(j, 1);
                            }
                        }
                    }
                    activeGrenades.splice(i, 1);
                }
            }

            player.shootTimer++;
            if (mouse.down && player.shootTimer >= player.fireRate) {
                player.shootTimer = 0;
                playSound(player.weaponType);

                if (player.weaponType === 'Machinegun') {
                    bullets.push({ x: player.x + Math.cos(player.angle) * 15, y: player.y + Math.sin(player.angle) * 15, vx: Math.cos(player.angle) * 14, vy: Math.sin(player.angle) * 14, angle: player.angle, length: 12, damage: 18, color: '#ff8800' });
                } else if (player.weaponType === 'Shotgun') {
                    for (let aOffset of [-0.3, -0.15, 0, 0.15, 0.3]) {
                        let shotAngle = player.angle + aOffset;
                        bullets.push({ x: player.x + Math.cos(player.angle) * 15, y: player.y + Math.sin(player.angle) * 15, vx: Math.cos(shotAngle) * 11, vy: Math.sin(shotAngle) * 11, angle: shotAngle, length: 14, damage: 20, color: '#ffff00' });
                    }
                } else if (player.weaponType === 'Railgun') {
                    bullets.push({ x: player.x + Math.cos(player.angle) * 15, y: player.y + Math.sin(player.angle) * 15, vx: Math.cos(player.angle) * 18, vy: Math.sin(player.angle) * 18, angle: player.angle, length: 25, damage: 70, color: '#bf00ff' });
                } else if (player.weaponType === 'FlameThrower') {
                    bullets.push({ x: player.x + Math.cos(player.angle) * 15, y: player.y + Math.sin(player.angle) * 15, vx: Math.cos(player.angle) * 8 + (Math.random()-0.5)*2, vy: Math.sin(player.angle) * 8 + (Math.random()-0.5)*2, angle: player.angle, length: 10, damage: 12, color: '#ff3300' });
                } else if (player.weaponType === 'ShockWave') {
                    bullets.push({ x: player.x + Math.cos(player.angle) * 15, y: player.y + Math.sin(player.angle) * 15, vx: Math.cos(player.angle) * 15, vy: Math.sin(player.angle) * 15, angle: player.angle, length: 20, damage: 45, color: '#33ff33' });
                } else if (player.weaponType === 'LaserBeam') {
                    bullets.push({ x: player.x + Math.cos(player.angle) * 15, y: player.y + Math.sin(player.angle) * 15, vx: Math.cos(player.angle) * 16, vy: Math.sin(player.angle) * 16, angle: player.angle, length: 22, damage: 35, color: '#00ffff' });
                } else {
                    bullets.push({ x: player.x + Math.cos(player.angle) * 15, y: player.y + Math.sin(player.angle) * 15, vx: Math.cos(player.angle) * 13, vy: Math.sin(player.angle) * 13, angle: player.angle, length: 18, damage: player.damage, color: '#00ffff' });
                }
            }

            for (let i = bullets.length - 1; i >= 0; i--) {
                let b = bullets[i];
                b.x += b.vx; b.y += b.vy;

                if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
                    bullets.splice(i, 1);
                    continue;
                }

                for (let j = zombies.length - 1; j >= 0; j--) {
                    let z = zombies[j];
                    if (Math.hypot(b.x - z.x, b.y - z.y) < z.radius + 4) {
                        z.hp -= b.damage;
                        bullets.splice(i, 1);

                        for (let p = 0; p < 3; p++) {
                            particles.push({ x: z.x, y: z.y, vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5, life: 12, color: z.color });
                        }

                        if (z.hp <= 0) {
                            playSound('kill');
                            let reward = z.type === 'boss' ? 1500 : 100;
                            score += reward * combo;
                            combo = Math.min(combo + 1, 12);
                            comboTimer = 160;

                            floatTexts.push({ x: z.x, y: z.y, text: `+${reward * combo}`, alpha: 1, color: combo > 4 ? '#ff00ff' : '#00ffff' });

                            if (Math.random() < (z.type === 'boss' ? 1.0 : 0.14)) {
                                let keysArray = Object.keys(weaponTypes);
                                let randomWeaponKey = keysArray[Math.floor(Math.random() * keysArray.length)];
                                let dropType = Math.random() < 0.35 ? 'heal' : (Math.random() < 0.5 ? 'grenade' : randomWeaponKey);
                                drops.push({ x: z.x, y: z.y, radius: 10, type: dropType });
                            }

                            zombies.splice(j, 1);
                        }
                        break;
                    }
                }
            }

            for (let i = bossBullets.length - 1; i >= 0; i--) {
                let bb = bossBullets[i];
                bb.x += bb.vx; bb.y += bb.vy;

                if (bb.x < 0 || bb.x > canvas.width || bb.y < 0 || bb.y > canvas.height) {
                    bossBullets.splice(i, 1);
                    continue;
                }

                if (Math.hypot(player.x - bb.x, player.y - bb.y) < player.radius + 4) {
                    player.hp -= bb.damage;
                    triggerShake(7);
                    bossBullets.splice(i, 1);
                    if (player.hp <= 0) {
                        player.hp = 0;
                        gameOver = true;
                        if (services && services.highscores) services.highscores.saveHighscore('zombie-shooter', score);
                    }
                }
            }

            for (let i = zombies.length - 1; i >= 0; i--) {
                let z = zombies[i];
                let zAngle = Math.atan2(player.y - z.y, player.x - z.x);
                z.x += Math.cos(zAngle) * z.speed;
                z.y += Math.sin(zAngle) * z.speed;

                if (z.type === 'boss') {
                    z.attackTimer++;
                    if (z.attackTimer >= z.attackInterval) {
                        z.attackTimer = 0;
                        let bossCfg = getBossConfig(z.tier);

                        if (bossCfg.pattern === 'spread') {
                            for (let aOffset of [-0.4, -0.2, 0, 0.2, 0.4]) {
                                let shootAngle = zAngle + aOffset;
                                bossBullets.push({ x: z.x, y: z.y, vx: Math.cos(shootAngle) * 4.5, vy: Math.sin(shootAngle) * 4.5, damage: 18 });
                            }
                        } else if (bossCfg.pattern === 'ring') {
                            for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
                                bossBullets.push({ x: z.x, y: z.y, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, damage: 15 });
                            }
                        } else if (bossCfg.pattern === 'snipe') {
                            for (let aOffset of [-0.2, 0, 0.2]) {
                                let shootAngle = zAngle + aOffset;
                                bossBullets.push({ x: z.x, y: z.y, vx: Math.cos(shootAngle) * 7.5, vy: Math.sin(shootAngle) * 7.5, damage: 22 });
                            }
                        } else {
                            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                                bossBullets.push({ x: z.x, y: z.y, vx: Math.cos(a + gameTime*0.12) * 5, vy: Math.sin(a + gameTime*0.12) * 5, damage: 18 });
                            }
                        }
                    }
                }

                if (Math.hypot(player.x - z.x, player.y - z.y) < player.radius + z.radius) {
                    player.hp -= (z.type === 'tank' ? 1.2 : (z.type === 'boss' ? 3.0 : 0.6));
                    triggerShake(5);
                    if (player.hp <= 0) {
                        player.hp = 0;
                        gameOver = true;
                        if (services && services.highscores) services.highscores.saveHighscore('zombie-shooter', score);
                    }
                }
            }

            for (let i = drops.length - 1; i >= 0; i--) {
                let d = drops[i];
                if (Math.hypot(player.x - d.x, player.y - d.y) < player.radius + d.radius) {
                    if (d.type === 'heal') {
                        playSound('heal');
                        player.hp = Math.min(player.maxHp, player.hp + 35);
                        floatTexts.push({ x: player.x, y: player.y - 18, text: '+35 SHIELD', alpha: 1, color: '#00ffcc' });
                    } else if (d.type === 'grenade') {
                        player.grenades++;
                        floatTexts.push({ x: player.x, y: player.y - 18, text: '+1 GRANATE 💣', alpha: 1, color: '#00ff00' });
                    } else {
                        player.weaponType = d.type;
                        if (d.type === 'Shotgun') { player.fireRate = 18; player.damage = 20; }
                        else if (d.type === 'Machinegun') { player.fireRate = 4; player.damage = 18; }
                        else if (d.type === 'Railgun') { player.fireRate = 25; player.damage = 70; }
                        else if (d.type === 'LaserBeam') { player.fireRate = 6; player.damage = 35; }
                        else if (d.type === 'FlameThrower') { player.fireRate = 3; player.damage = 12; }
                        else if (d.type === 'ShockWave') { player.fireRate = 12; player.damage = 45; }

                        player.weaponTimer = 450;
                        floatTexts.push({ x: player.x, y: player.y - 18, text: `🔥 ${weaponTypes[d.type].name.toUpperCase()}!`, alpha: 1, color: weaponTypes[d.type].color });
                    }
                    drops.splice(i, 1);
                }
            }

            explosions.forEach((ex, idx) => {
                ex.radius += 5; ex.alpha -= 0.03;
                if (ex.alpha <= 0) explosions.splice(idx, 1);
            });

            particles.forEach((p, idx) => {
                p.x += p.vx; p.y += p.vy; p.life--;
                if (p.life <= 0) particles.splice(idx, 1);
            });

            floatTexts.forEach((ft, idx) => {
                ft.y -= 0.8; ft.alpha -= 0.02;
                if (ft.alpha <= 0) floatTexts.splice(idx, 1);
            });

            if (zombies.length === 0) {
                wave++;
                startWave();
            }

            waveEl.innerText = wave;
            hpEl.innerText = Math.max(0, Math.floor(player.hp));
            weaponEl.innerText = player.weaponType === 'Standard' ? 'Standard' : weaponTypes[player.weaponType].name;
            weaponEl.style.color = player.weaponType === 'Standard' ? '#ffff00' : weaponTypes[player.weaponType].color;
            grenadesEl.innerText = player.grenades;
            scoreEl.innerText = score;
            comboEl.innerText = `${combo}x`;
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = 'rgba(0, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
            for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

            if (player.hp < 30 && player.hp > 0 && !gameOver) {
                let pulseAlpha = 0.12 + Math.sin(gameTime / 6) * 0.08;
                ctx.save();
                ctx.fillStyle = `rgba(255, 0, 50, ${Math.max(0.04, pulseAlpha)})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            }

            drops.forEach(d => {
                let dropColor = d.type === 'heal' ? '#00ffcc' : (d.type === 'grenade' ? '#00ff00' : weaponTypes[d.type].color);
                let dropName = d.type === 'heal' ? 'Heilung' : (d.type === 'grenade' ? 'Granate' : weaponTypes[d.type].name);

                ctx.shadowBlur = 15; ctx.shadowColor = dropColor;
                ctx.fillStyle = dropColor;
                ctx.fillRect(d.x - 8, d.y - 8, 16, 16);
                ctx.shadowBlur = 0;

                ctx.fillStyle = dropColor;
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.shadowBlur = 8; ctx.shadowColor = dropColor;
                ctx.fillText(dropName, d.x, d.y - 14);
                ctx.shadowBlur = 0;
            });

            activeGrenades.forEach(g => {
                let isWhiteBlink = Math.floor(g.timer / 30) % 2 === 0;
                ctx.shadowBlur = 18; ctx.shadowColor = isWhiteBlink ? '#ffffff' : '#00ff00';
                ctx.fillStyle = isWhiteBlink ? '#ffffff' : '#00ff00';
                ctx.beginPath(); ctx.arc(g.x, g.y, 8, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
            });

            explosions.forEach(ex => {
                ctx.save();
                ctx.globalAlpha = ex.alpha;
                ctx.shadowBlur = 35; ctx.shadowColor = '#ff3300';
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 5;
                ctx.beginPath(); ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2); ctx.stroke();

                ctx.fillStyle = 'rgba(255, 100, 0, 0.35)';
                ctx.beginPath(); ctx.arc(ex.x, ex.y, ex.radius * 0.8, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            });

            particles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, 2.5, 2.5);
            });

            ctx.lineWidth = 3;
            bullets.forEach(b => {
                ctx.shadowBlur = 12; ctx.shadowColor = b.color;
                ctx.strokeStyle = b.color;
                ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - Math.cos(b.angle) * b.length, b.y - Math.sin(b.angle) * b.length); ctx.stroke();
            });

            ctx.fillStyle = '#ff0055';
            bossBullets.forEach(bb => {
                ctx.shadowBlur = 10; ctx.shadowColor = '#ff0055';
                ctx.beginPath(); ctx.arc(bb.x, bb.y, 5, 0, Math.PI * 2); ctx.fill();
            });
            ctx.shadowBlur = 0;

            zombies.forEach(z => {
                ctx.save();
                ctx.translate(z.x, z.y);

                if (z.type === 'boss') {
                    let pulse = Math.sin(gameTime / 10) * 6;
                    let rot = gameTime / 25;
                    let rotReverse = -gameTime / 20;

                    ctx.shadowBlur = 25; ctx.shadowColor = z.color;
                    ctx.strokeStyle = z.color;
                    ctx.lineWidth = 3;

                    ctx.save();
                    ctx.rotate(rot);
                    ctx.beginPath();
                    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
                        ctx.moveTo(Math.cos(a) * (z.radius + 8 + pulse), Math.sin(a) * (z.radius + 8 + pulse));
                        ctx.lineTo(Math.cos(a + 0.5) * (z.radius + 14), Math.sin(a + 0.5) * (z.radius + 14));
                    }
                    ctx.stroke();
                    ctx.restore();

                    ctx.save();
                    ctx.rotate(rotReverse);
                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, z.radius + 5, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();

                    ctx.fillStyle = z.color;
                    ctx.beginPath(); ctx.arc(0, 0, z.radius, 0, Math.PI * 2); ctx.fill();

                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath(); ctx.arc(0, 0, 8 + Math.sin(gameTime / 5) * 3, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(z.bossName, 0, -z.radius - 18);
                } else {
                    ctx.shadowBlur = 14; ctx.shadowColor = z.color;
                    ctx.fillStyle = z.color;
                    ctx.beginPath(); ctx.arc(0, 0, z.radius, 0, Math.PI * 2); ctx.fill();

                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath(); ctx.arc(Math.cos(player.angle)*3, Math.sin(player.angle)*3, 2.5, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;
                }

                ctx.restore();

                if (z.type === 'boss') {
                    ctx.fillStyle = 'rgba(255,0,0,0.5)';
                    ctx.fillRect(z.x - 35, z.y - z.radius - 10, 70, 5);
                    ctx.fillStyle = '#00ff00';
                    ctx.fillRect(z.x - 35, z.y - z.radius - 10, 70 * (z.hp / z.maxHp), 5);
                } else {
                    ctx.fillStyle = 'rgba(255,0,0,0.5)';
                    ctx.fillRect(z.x - z.radius, z.y - z.radius - 8, z.radius * 2, 3);
                    ctx.fillStyle = '#00ff00';
                    ctx.fillRect(z.x - z.radius, z.y - z.radius - 8, (z.radius * 2) * (z.hp / z.maxHp), 3);
                }
            });

            ctx.save();
            ctx.translate(player.x, player.y);
            ctx.rotate(player.angle);

            ctx.shadowBlur = 15; ctx.shadowColor = '#00ffff';
            ctx.fillStyle = '#00ffff';
            ctx.beginPath(); ctx.arc(0, 0, player.radius, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#0088ff';
            ctx.fillRect(-6, -8, 8, 16);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, -3, 18, 6);

            ctx.restore();
            ctx.shadowBlur = 0;

            floatTexts.forEach(ft => {
                ctx.globalAlpha = ft.alpha;
                ctx.fillStyle = ft.color;
                ctx.font = 'bold 15px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.globalAlpha = 1.0;
            });

            if (gameOver) {
                ctx.fillStyle = 'rgba(5, 5, 10, 0.9)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.shadowBlur = 25; ctx.shadowColor = '#ff0055';
                ctx.fillStyle = '#ff0055';
                ctx.font = 'bold 38px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('SYSTEM OVERLOAD (GAME OVER)', canvas.width / 2, canvas.height / 2 - 35);
                ctx.shadowBlur = 0;

                ctx.fillStyle = '#00ffff';
                ctx.font = '18px sans-serif';
                ctx.fillText(`Du hast Welle ${wave} überlebt | Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);

                ctx.fillStyle = '#ffff00';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText('Drücke [ R ] zum Neustarten', canvas.width / 2, canvas.height / 2 + 55);
                ctx.textAlign = 'left';
            }
        };

        const gameLoop = () => {
            update();
            draw();
            animationId = requestAnimationFrame(gameLoop);
        };

        startWave();
        animationId = requestAnimationFrame(gameLoop);

        return {
            destroy: () => {
                cancelAnimationFrame(animationId);
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
                if (services && services.highscores) {
                    services.highscores.saveHighscore('zombie-shooter', score);
                }
            }
        };
    }
};