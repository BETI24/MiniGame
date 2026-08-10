export default {
    manifest: {
        id: 'prisma-defense',
        name: 'Prisma Defense',
        description: 'Verteidige deinen Quanten-Kern gegen ankommende Neon-Viren. Baue Türme und überlebe so lange wie möglich.',
        icon: '🛡️',
        tags: ['Tower Defense', 'Action', 'Neon']
    },
    init: (container, services) => {
        // --- Spielzustand ---
        let game = {
            score: 0,
            prisma: 150,
            health: 20,
            maxHealth: 20,
            wave: 1,
            selectedTower: 'blaster',
            towersData: {
                blaster: {
                    name: "Prisma-Blaster", cost: 50, range: 120, damage: 15, cooldown: 600, color: '#00ffcc',
                    desc: "Verlässlicher Allrounder mit moderater Schussrate.", shape: 'square', pShape: 'bullet', exp: 'normal',
                    svg: '<svg width="40" height="40"><rect x="5" y="5" width="30" height="30" fill="#161622" stroke="#00ffcc" stroke-width="2"/><circle cx="20" cy="20" r="8" fill="#00ffcc"/></svg>'
                },
                rapid: {
                    name: "Ionen-Gatling", cost: 120, range: 100, damage: 5, cooldown: 120, color: '#0088ff',
                    desc: "Feuert extrem schnell. Perfekt gegen schwache, schnelle Viren.", shape: 'triangle', pShape: 'dash', exp: 'small',
                    svg: '<svg width="40" height="40"><polygon points="20,5 35,35 5,35" fill="#161622" stroke="#0088ff" stroke-width="2"/><circle cx="20" cy="23" r="6" fill="#0088ff"/></svg>'
                },
                sniper: {
                    name: "Quanten-Sniper", cost: 150, range: 300, damage: 60, cooldown: 1800, color: '#ff007f',
                    desc: "Hohe Reichweite und kritischer Schaden, aber langsame Feuerrate.", shape: 'diamond', pShape: 'laser', exp: 'normal',
                    svg: '<svg width="40" height="40"><polygon points="20,5 35,20 20,35 5,20" fill="#161622" stroke="#ff007f" stroke-width="2"/><circle cx="20" cy="20" r="5" fill="#ff007f"/></svg>'
                },
                heavy: {
                    name: "Plasma-Kanone", cost: 250, range: 150, damage: 140, cooldown: 2500, color: '#ff4400',
                    desc: "Verschießt langsame, aber verheerende Plasma-Ladungen.", shape: 'hexagon', pShape: 'orb', exp: 'massive',
                    svg: '<svg width="40" height="40"><polygon points="12,5 28,5 35,20 28,35 12,35 5,20" fill="#161622" stroke="#ff4400" stroke-width="2"/><circle cx="20" cy="20" r="10" fill="#ff4400"/></svg>'
                },
                wind: {
                    name: "Windkraftwerk", cost: 200, range: 0, damage: 0, cooldown: 3000, income: 25, color: '#ffff00', isEconomy: true,
                    desc: "Generiert regelmäßig passives Prisma zur Finanzierung.", shape: 'rotor', pShape: 'none', exp: 'none',
                    svg: '<svg width="40" height="40"><circle cx="20" cy="20" r="16" fill="#161622" stroke="#ffff00" stroke-width="2"/><rect x="18" y="5" width="4" height="30" fill="#ffff00"/><rect x="5" y="18" width="30" height="4" fill="#ffff00"/></svg>'
                },
                helipad: {
                    name: "Prisma-Helipad", cost: 300, range: 0, damage: 10, cooldown: 400, color: '#00ff66', isHelipad: true,
                    desc: "Platziert einen Landeplatz. Entsendet einen Hubschrauber, der den vordersten Gegner jagt.", shape: 'pad', pShape: 'laser', exp: 'small',
                    svg: '<svg width="40" height="40"><rect x="5" y="5" width="30" height="30" fill="#161622" stroke="#00ff66" stroke-width="2"/><circle cx="20" cy="20" r="10" fill="none" stroke="#00ff66" stroke-width="2"/><text x="20" y="24" font-size="14" fill="#00ff66" text-anchor="middle" font-weight="bold">H</text></svg>'
                }
            },
            entities: { towers: [], enemies: [], projectiles: [], particles: [], texts: [], rings: [], helicopters: [] },
            gridSize: 50,
            path: [
                {x: 0, y: 2}, {x: 3, y: 2}, {x: 3, y: 8}, {x: 8, y: 8},
                {x: 8, y: 3}, {x: 13, y: 3}, {x: 13, y: 10}, {x: 16, y: 10}
            ],
            spawnTimer: 0,
            enemyHpMultiplier: 1
        };

        let animationId;
        let lastTime = performance.now();
        const CANVAS_WIDTH = 800;
        const CANVAS_HEIGHT = 600;

        // --- Styling ---
        const style = document.createElement('style');
        style.textContent = `
            .td-wrapper { box-sizing: border-box; user-select: none; margin: 0; padding: 0; background: #08080c; color: #ffffff; font-family: 'Segoe UI', Tahoma, sans-serif; overflow: hidden; height: 100%; width: 100%; display: flex; }
            .td-sidebar { width: 340px; background: #101016; border-right: 2px solid #202030; display: flex; flex-direction: column; padding: 20px; z-index: 10; overflow-y: visible; position: relative; }
            .td-sidebar::-webkit-scrollbar { width: 8px; }
            .td-sidebar::-webkit-scrollbar-thumb { background: #202030; border-radius: 4px; }
            .td-game-container { flex: 1; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, #181828 0%, #08080c 100%); }
            canvas { background: #0d0d14; border: 2px solid #202030; box-shadow: 0 0 40px rgba(0, 255, 204, 0.1); cursor: crosshair; }
            
            .td-stats { margin-bottom: 20px; flex-shrink: 0; }
            .td-stats div { font-size: 1.2rem; margin-bottom: 8px; font-weight: bold; }
            .td-stat-val { color: #00ffcc; text-shadow: 0 0 10px rgba(0,255,204,0.5); }
            
            #td-shop { flex-grow: 1; display: flex; flex-direction: column; gap: 12px; }
            .td-tower-card { background: #161622; border: 2px solid #262638; border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.2s; position: relative; }
            .td-tower-card:hover { border-color: #8888a0; z-index: 100; }
            .td-tower-card.selected { border-color: #00ffcc; box-shadow: 0 0 15px rgba(0,255,204,0.3); }
            .td-tower-card.locked { opacity: 0.5; cursor: not-allowed; }
            .td-tower-name { font-weight: bold; font-size: 1.1rem; margin-bottom: 4px; }
            .td-tower-cost { color: #ffff00; font-size: 0.9rem; }
            
            .td-tooltip { display: none; position: absolute; left: 102%; top: 0; width: 220px; background: #161622; border: 1px solid #303040; padding: 15px; border-radius: 8px; box-shadow: 5px 5px 20px rgba(0,0,0,0.8); z-index: 1000; pointer-events: none; }
            .td-tower-card:hover .td-tooltip { display: block; }
            .td-tt-img { margin-bottom: 10px; text-align: center; }
            .td-tt-desc { font-size: 0.9rem; color: #a0a0c0; margin-bottom: 10px; line-height: 1.4; }
            .td-tt-stats { font-size: 0.8rem; color: #fff; background: #08080c; padding: 8px; border-radius: 4px; }
            
            h2 { color: #00ffcc; margin-top: 0; font-size: 1.2rem; border-bottom: 2px solid #202030; padding-bottom: 10px; }
        `;
        container.appendChild(style);

        // --- DOM-Struktur ---
        const wrapper = document.createElement('div');
        wrapper.className = 'td-wrapper';
        wrapper.innerHTML = `
            <div class="td-sidebar">
                <h2>KERN-STATUS</h2>
                <div class="td-stats">
                    <div>Prisma: <span class="td-stat-val" id="td-prisma">0</span> P</div>
                    <div>Welle: <span class="td-stat-val" id="td-wave">1</span></div>
                </div>
                <h2>TÜRME & EINHEITEN</h2>
                <div id="td-shop"></div>
            </div>
            <div class="td-game-container">
                <canvas id="td-canvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"></canvas>
            </div>
        `;
        container.appendChild(wrapper);

        const canvas = wrapper.querySelector('#td-canvas');
        const ctx = canvas.getContext('2d');
        const uiPrisma = wrapper.querySelector('#td-prisma');
        const uiWave = wrapper.querySelector('#td-wave');
        const uiShop = wrapper.querySelector('#td-shop');

        // --- Shop Initialisierung ---
        const renderShop = () => {
            uiShop.innerHTML = '';
            for (let key in game.towersData) {
                let t = game.towersData[key];
                let card = document.createElement('div');
                card.className = `td-tower-card ${game.selectedTower === key ? 'selected' : ''} ${game.prisma < t.cost ? 'locked' : ''}`;

                let statsHtml = t.isEconomy ? `Einkommen: ${t.income} / Schuss` : (t.isHelipad ? `Helikopter-Schaden: ${t.damage}` : `Schaden: ${t.damage}<br>Reichweite: ${t.range}`);

                card.innerHTML = `
                    <div class="td-tower-name" style="color: ${t.color}">${t.name}</div>
                    <div class="td-tower-cost">${t.cost} Prisma</div>
                    <div class="td-tooltip">
                        <div class="td-tt-img">${t.svg}</div>
                        <div class="td-tt-desc">${t.desc}</div>
                        <div class="td-tt-stats">${statsHtml}</div>
                    </div>
                `;
                card.onclick = () => { if (game.prisma >= t.cost) { game.selectedTower = key; renderShop(); } };
                uiShop.appendChild(card);
            }
            uiPrisma.innerText = game.prisma;
            uiWave.innerText = Math.floor(game.wave);
        };

        // --- Hilfsfunktionen für Pfad ---
        const getPathCoordinates = () => {
            let coords = [];
            for (let i = 0; i < game.path.length - 1; i++) {
                let p1 = game.path[i];
                let p2 = game.path[i+1];
                let dx = Math.sign(p2.x - p1.x);
                let dy = Math.sign(p2.y - p1.y);
                let cx = p1.x;
                let cy = p1.y;
                while (cx !== p2.x || cy !== p2.y) {
                    coords.push({x: cx * game.gridSize + game.gridSize/2, y: cy * game.gridSize + game.gridSize/2});
                    cx += dx;
                    cy += dy;
                }
            }
            let last = game.path[game.path.length-1];
            coords.push({x: last.x * game.gridSize + game.gridSize/2, y: last.y * game.gridSize + game.gridSize/2});
            return coords;
        };
        const pathCoords = getPathCoordinates();
        const basePos = pathCoords[pathCoords.length - 1];

        // --- Turm Bauen ---
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            const gridX = Math.floor(x / game.gridSize);
            const gridY = Math.floor(y / game.gridSize);

            const isPath = pathCoords.some(p => Math.abs(p.x - (gridX*game.gridSize + game.gridSize/2)) < game.gridSize/2 && Math.abs(p.y - (gridY*game.gridSize + game.gridSize/2)) < game.gridSize/2);
            const hasTower = game.entities.towers.some(t => t.gridX === gridX && t.gridY === gridY);
            const towerInfo = game.towersData[game.selectedTower];

            if (!isPath && !hasTower && game.prisma >= towerInfo.cost) {
                game.prisma -= towerInfo.cost;
                let newTower = {
                    gridX, gridY,
                    x: gridX * game.gridSize + game.gridSize/2,
                    y: gridY * game.gridSize + game.gridSize/2,
                    type: game.selectedTower,
                    lastShot: 0
                };
                game.entities.towers.push(newTower);

                // Wenn es ein Helipad ist, spawne direkt einen Hubschrauber darauf
                if (towerInfo.isHelipad) {
                    game.entities.helicopters.push({
                        x: newTower.x,
                        y: newTower.y,
                        homeX: newTower.x,
                        homeY: newTower.y,
                        speed: 180,
                        damage: towerInfo.damage,
                        cooldown: towerInfo.cooldown,
                        lastShot: 0,
                        color: towerInfo.color
                    });
                }

                renderShop();
            }
        });

        const spawnParticles = (x, y, color, expType) => {
            let count = expType === 'massive' ? 20 : (expType === 'small' ? 3 : 8);
            let speedMult = expType === 'massive' ? 8 : 4;
            for(let i=0; i<count; i++) {
                game.entities.particles.push({
                    x, y, vx: (Math.random() - 0.5) * speedMult, vy: (Math.random() - 0.5) * speedMult, life: 1, color
                });
            }
            if (expType === 'massive') {
                game.entities.rings.push({ x, y, radius: 5, life: 1, color });
            }
        };

        const spawnEnemy = () => {
            const enemyTypes = [
                { type: 'basic', hp: 40, speed: 60, color: '#ff007f', size: 20, reward: 10 },
                { type: 'fast', hp: 25, speed: 110, color: '#00ffcc', size: 14, reward: 12 },
                { type: 'tank', hp: 150, speed: 35, color: '#ff8800', size: 26, reward: 25 },
                { type: 'boss', hp: 600, speed: 25, color: '#9900ff', size: 36, reward: 100 }
            ];
            let rand = Math.random();
            let selectedEnemy = enemyTypes[0];

            if (game.wave > 5 && rand > 0.95) selectedEnemy = enemyTypes[3];
            else if (game.wave > 3 && rand > 0.75) selectedEnemy = enemyTypes[2];
            else if (game.wave > 2 && rand > 0.4) selectedEnemy = enemyTypes[1];

            game.entities.enemies.push({
                pathIndex: 0, x: pathCoords[0].x, y: pathCoords[0].y,
                hp: selectedEnemy.hp * game.enemyHpMultiplier, maxHp: selectedEnemy.hp * game.enemyHpMultiplier,
                speed: selectedEnemy.speed, color: selectedEnemy.color, size: selectedEnemy.size, reward: selectedEnemy.reward
            });
        };

        // --- Game Loop Logik ---
        const update = (delta, time) => {
            if (game.health <= 0) return;

            game.spawnTimer -= delta;
            if (game.spawnTimer <= 0) {
                spawnEnemy();
                game.spawnTimer = Math.max(0.5, 2 - (game.wave * 0.1));
                game.wave += 0.05; game.enemyHpMultiplier += 0.02;
                uiWave.innerText = Math.floor(game.wave);
            }

            for (let i = game.entities.enemies.length - 1; i >= 0; i--) {
                let e = game.entities.enemies[i];
                let target = pathCoords[e.pathIndex + 1];

                if (!target) {
                    game.health--;
                    game.entities.texts.push({ x: basePos.x, y: basePos.y - 40, text: "-1", life: 1.5, color: '#ff0000' });
                    game.entities.enemies.splice(i, 1);
                    triggerShake();
                    continue;
                }

                let dx = target.x - e.x, dy = target.y - e.y;
                let dist = Math.hypot(dx, dy), moveDist = e.speed * delta;
                if (dist <= moveDist) {
                    e.x = target.x; e.y = target.y; e.pathIndex++;
                } else {
                    e.x += (dx / dist) * moveDist; e.y += (dy / dist) * moveDist;
                }
            }

            // Normale Türme Logik
            game.entities.towers.forEach(t => {
                let info = game.towersData[t.type];
                if (info.isHelipad) return; // Hubschrauber wird separat gesteuert

                if (time - t.lastShot > info.cooldown) {
                    if (info.isEconomy) {
                        game.prisma += info.income;
                        spawnParticles(t.x, t.y, info.color, 'small');
                        game.entities.texts.push({ x: t.x, y: t.y - 15, text: `+${info.income}`, life: 1, color: info.color });
                        t.lastShot = time; renderShop();
                    } else {
                        let target = game.entities.enemies.find(e => Math.hypot(e.x - t.x, e.y - t.y) <= info.range);
                        if (target) {
                            let projSpeed = info.pShape === 'laser' ? 1200 : (info.pShape === 'orb' ? 200 : 500);
                            game.entities.projectiles.push({
                                x: t.x, y: t.y, target: target, speed: projSpeed, damage: info.damage,
                                color: info.color, shape: info.pShape, exp: info.exp
                            });
                            t.lastShot = time;
                        }
                    }
                }
            });

            // Hubschrauber Logik: Fliegt zum vordersten Gegner (höchster pathIndex oder weitest im Pfad)
            game.entities.helicopters.forEach(heli => {
                let targetX = heli.homeX;
                let targetY = heli.homeY;

                if (game.entities.enemies.length > 0) {
                    // Finde den vordersten Gegner (höchster pathIndex, bei gleichen Index am nächsten zum nächsten Punkt)
                    let frontEnemy = game.entities.enemies.reduce((prev, curr) => {
                        if (curr.pathIndex > prev.pathIndex) return curr;
                        if (curr.pathIndex === prev.pathIndex) {
                            let p = pathCoords[curr.pathIndex + 1] || pathCoords[pathCoords.length - 1];
                            let distCurr = Math.hypot(p.x - curr.x, p.y - curr.y);
                            let distPrev = Math.hypot(p.x - prev.x, p.y - prev.y);
                            return distCurr < distPrev ? curr : prev;
                        }
                        return prev;
                    });

                    // Verfolge den vordersten Gegner mit etwas Abstand/Schwebeposition
                    targetX = frontEnemy.x;
                    targetY = frontEnemy.y - 20;

                    // Schießen
                    if (time - heli.lastShot > heli.cooldown) {
                        game.entities.projectiles.push({
                            x: heli.x, y: heli.y, target: frontEnemy, speed: 900, damage: heli.damage,
                            color: heli.color, shape: 'laser', exp: 'small'
                        });
                        heli.lastShot = time;
                    }
                }

                // Heli bewegt sich Richtung Ziel
                let dx = targetX - heli.x;
                let dy = targetY - heli.y;
                let dist = Math.hypot(dx, dy);
                let moveDist = heli.speed * delta;
                if (dist <= moveDist) {
                    heli.x = targetX; heli.y = targetY;
                } else {
                    heli.x += (dx / dist) * moveDist;
                    heli.y += (dy / dist) * moveDist;
                }
            });

            for (let i = game.entities.projectiles.length - 1; i >= 0; i--) {
                let p = game.entities.projectiles[i];
                if (!game.entities.enemies.includes(p.target)) { game.entities.projectiles.splice(i, 1); continue; }

                let dx = p.target.x - p.x, dy = p.target.y - p.y;
                let dist = Math.hypot(dx, dy), moveDist = p.speed * delta;

                if (dist <= moveDist) {
                    p.target.hp -= p.damage;
                    spawnParticles(p.target.x, p.target.y, p.color, p.exp);
                    game.entities.projectiles.splice(i, 1);
                    if (p.target.hp <= 0) {
                        game.prisma += p.target.reward; game.score += p.target.reward;
                        let eIdx = game.entities.enemies.indexOf(p.target);
                        if(eIdx > -1) game.entities.enemies.splice(eIdx, 1);
                        renderShop();
                    }
                } else {
                    p.x += (dx / dist) * moveDist; p.y += (dy / dist) * moveDist;
                    p.angle = Math.atan2(dy, dx);
                }
            }

            for (let i = game.entities.particles.length - 1; i >= 0; i--) {
                let p = game.entities.particles[i];
                p.x += p.vx; p.y += p.vy; p.life -= delta * 2;
                if (p.life <= 0) game.entities.particles.splice(i, 1);
            }
            for (let i = game.entities.rings.length - 1; i >= 0; i--) {
                let r = game.entities.rings[i];
                r.radius += delta * 150; r.life -= delta * 3;
                if (r.life <= 0) game.entities.rings.splice(i, 1);
            }
            for (let i = game.entities.texts.length - 1; i >= 0; i--) {
                let txt = game.entities.texts[i];
                txt.y -= delta * 25; txt.life -= delta;
                if (txt.life <= 0) game.entities.texts.splice(i, 1);
            }
        };

        // --- Zeichnen ---
        const draw = (time) => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'; ctx.lineWidth = 1;
            for(let i=0; i<=CANVAS_WIDTH; i+=game.gridSize) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,CANVAS_HEIGHT); ctx.stroke(); }
            for(let i=0; i<=CANVAS_HEIGHT; i+=game.gridSize) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(CANVAS_WIDTH,i); ctx.stroke(); }

            ctx.strokeStyle = 'rgba(0, 255, 204, 0.15)'; ctx.lineWidth = game.gridSize * 0.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.beginPath();
            if (pathCoords.length > 0) ctx.moveTo(pathCoords[0].x, pathCoords[0].y);
            for (let i=1; i<pathCoords.length; i++) ctx.lineTo(pathCoords[i].x, pathCoords[i].y);
            ctx.stroke();

            // Kern Basis am Ende
            ctx.fillStyle = '#101016';
            ctx.strokeStyle = '#ff007f';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff007f';
            ctx.fillRect(basePos.x - 25, basePos.y - 25, 50, 50);
            ctx.strokeRect(basePos.x - 25, basePos.y - 25, 50, 50);
            ctx.shadowBlur = 0;

            // Kern HP Bar
            ctx.fillStyle = 'rgba(255,0,0,0.5)';
            ctx.fillRect(basePos.x - 30, basePos.y - 40, 60, 6);
            ctx.fillStyle = '#00ffcc';
            ctx.fillRect(basePos.x - 30, basePos.y - 40, 60 * (game.health / game.maxHealth), 6);

            // Türme zeichnen
            game.entities.towers.forEach(t => {
                let info = game.towersData[t.type];
                ctx.save();
                ctx.translate(t.x, t.y);

                ctx.fillStyle = '#161622';
                ctx.strokeStyle = info.color;
                ctx.lineWidth = 2;

                ctx.beginPath();
                if (info.shape === 'square') {
                    ctx.rect(-15, -15, 30, 30);
                } else if (info.shape === 'triangle') {
                    ctx.moveTo(0, -18); ctx.lineTo(15, 12); ctx.lineTo(-15, 12);
                } else if (info.shape === 'diamond') {
                    ctx.moveTo(0, -18); ctx.lineTo(18, 0); ctx.lineTo(0, 18); ctx.lineTo(-18, 0);
                } else if (info.shape === 'hexagon') {
                    for(let i=0; i<6; i++) {
                        ctx.lineTo(16 * Math.cos(i * Math.PI / 3), 16 * Math.sin(i * Math.PI / 3));
                    }
                } else if (info.shape === 'rotor') {
                    ctx.arc(0, 0, 15, 0, Math.PI*2);
                } else if (info.shape === 'pad') {
                    ctx.rect(-18, -18, 36, 36);
                }
                ctx.closePath();
                ctx.fill(); ctx.stroke();

                if (info.isEconomy) {
                    ctx.rotate(time / 400);
                    ctx.fillStyle = info.color; ctx.shadowBlur = 10; ctx.shadowColor = info.color;
                    ctx.fillRect(-12, -2, 24, 4); ctx.fillRect(-2, -12, 4, 24);
                } else if (info.isHelipad) {
                    ctx.fillStyle = info.color;
                    ctx.font = 'bold 14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('H', 0, 1);
                } else {
                    ctx.fillStyle = info.color; ctx.shadowBlur = 10; ctx.shadowColor = info.color;
                    ctx.beginPath();
                    ctx.arc(0, 0, info.shape === 'hexagon' ? 8 : 5, 0, Math.PI*2);
                    ctx.fill();
                }
                ctx.restore();
            });

            // Hubschrauber zeichnen
            game.entities.helicopters.forEach(heli => {
                ctx.save();
                ctx.translate(heli.x, heli.y);
                ctx.fillStyle = heli.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = heli.color;
                // Heli-Rumpf
                ctx.beginPath();
                ctx.ellipse(0, 0, 12, 7, 0, 0, Math.PI*2);
                ctx.fill();
                // Heli-Rotor (rotiert schnell)
                ctx.rotate(time / 50);
                ctx.fillRect(-18, -2, 36, 4);
                ctx.restore();
            });

            game.entities.enemies.forEach(e => {
                ctx.fillStyle = e.color; ctx.shadowBlur = 15; ctx.shadowColor = e.color;
                ctx.fillRect(e.x - e.size/2, e.y - e.size/2, e.size, e.size);
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255,0,0,0.5)';
                ctx.fillRect(e.x - e.size/2 - 5, e.y - e.size/2 - 8, e.size + 10, 4);
                ctx.fillStyle = '#00ffcc';
                ctx.fillRect(e.x - e.size/2 - 5, e.y - e.size/2 - 8, (e.size + 10) * (e.hp / e.maxHp), 4);
            });

            game.entities.projectiles.forEach(p => {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle || 0);
                ctx.fillStyle = p.color; ctx.shadowBlur = 10; ctx.shadowColor = p.color;

                if (p.shape === 'bullet') {
                    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
                } else if (p.shape === 'dash') {
                    ctx.fillRect(-8, -2, 16, 4);
                } else if (p.shape === 'laser') {
                    ctx.fillRect(-20, -1, 40, 2);
                } else if (p.shape === 'orb') {
                    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
                }
                ctx.restore();
            });

            game.entities.particles.forEach(p => {
                ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life);
                ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
            });

            game.entities.rings.forEach(r => {
                ctx.strokeStyle = r.color; ctx.globalAlpha = Math.max(0, r.life); ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(r.x, r.y, r.radius, 0, Math.PI*2); ctx.stroke(); ctx.globalAlpha = 1;
            });

            game.entities.texts.forEach(txt => {
                ctx.fillStyle = txt.color; ctx.globalAlpha = Math.max(0, txt.life);
                ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
                ctx.shadowBlur = 8; ctx.shadowColor = txt.color;
                ctx.fillText(txt.text, txt.x, txt.y); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
            });

            if (game.health <= 0) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.fillStyle = '#ff007f'; ctx.font = '40px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('KERN ZERSTÖRT', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
            }
        };

        const triggerShake = () => {
            canvas.style.transform = 'translate(5px, 5px)';
            setTimeout(() => canvas.style.transform = 'translate(-5px, -5px)', 50);
            setTimeout(() => canvas.style.transform = 'translate(0, 0)', 100);
        };

        const loop = (time) => {
            let delta = (time - lastTime) / 1000;
            if (delta > 0.1) delta = 0.1;
            lastTime = time;
            update(delta, time);
            draw(time);
            if (game.health > 0) {
                animationId = requestAnimationFrame(loop);
            } else if (services && services.highscores) {
                services.highscores.saveHighscore('prisma-defense', Math.floor(game.score));
            }
        };

        renderShop();
        animationId = requestAnimationFrame(loop);

        return { destroy: () => { cancelAnimationFrame(animationId); } };
    }
};