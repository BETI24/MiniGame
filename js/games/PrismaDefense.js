export default {
    manifest: {
        id: 'prisma-defense',
        name: 'Prisma Defense',
        description: 'Verteidige deinen Quanten-Kern gegen ankommende Neon-Viren. Baue Türme und überlebe so lange wie möglich.',
        icon: '🛡️',
        imageUrl: 'js/assets/images/PrismaDefense.png',
        tags: ['Strategy', 'Action']
    },
    init: (container, services) => {
        // --- Web Audio API (Töne) ---
        let audioCtx = null;
        const initAudio = () => {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        };
        const playCuteSound = (type) => {
            if (!audioCtx || audioCtx.state === 'suspended') return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (type === 'build') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
                osc.start(); osc.stop(audioCtx.currentTime + 0.2);
            } else if (type === 'kill') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                osc.start(); osc.stop(audioCtx.currentTime + 0.1);
            }
        };

        // --- Weg-Generierung ---
        const generateRandomPath = () => {
            const cols = 16;
            const rows = 12;
            let current = { x: 0, y: Math.floor(Math.random() * 6) + 3 };
            let path = [{ ...current }];
            let visited = new Set([`${current.x},${current.y}`]);
            const targetX = cols - 1;

            while (current.x < targetX) {
                let options = [];
                let possibleMoves = [
                    { x: current.x + 1, y: current.y },
                    { x: current.x, y: current.y + 1 },
                    { x: current.x, y: current.y - 1 }
                ];

                for (let m of possibleMoves) {
                    if (m.x >= 0 && m.x < cols && m.y >= 1 && m.y < rows - 1) {
                        let key = `${m.x},${m.y}`;
                        if (!visited.has(key)) {
                            let weight = (m.x > current.x) ? 3 : 1;
                            for (let i = 0; i < weight; i++) options.push(m);
                        }
                    }
                }

                if (options.length === 0) {
                    let forced = { x: current.x + 1, y: current.y };
                    if (forced.x < cols && !visited.has(`${forced.x},${forced.y}`)) {
                        current = forced;
                        path.push({ ...current });
                        visited.add(`${current.x},${current.y}`);
                        continue;
                    } else {
                        break;
                    }
                }

                let next = options[Math.floor(Math.random() * options.length)];
                current = next;
                path.push({ ...current });
                visited.add(`${current.x},${current.y}`);
            }

            let last = path[path.length - 1];
            if (last.x < targetX) {
                for (let x = last.x + 1; x <= targetX; x++) {
                    path.push({ x: x, y: last.y });
                }
            }
            return path;
        };

        // --- Spielzustand ---
        let game = {
            score: 0,
            prisma: 10000,
            health: 25,
            maxHealth: 25,
            wave: 1,
            waveActive: true,
            enemiesInWave: 4,
            enemiesSpawned: 0,
            waveTimer: 0,
            selectedTower: 'blaster',
            hoveredTower: 'blaster',
            selectedInstance: null,
            towersData: {
                blaster: {
                    name: "Prisma-Blaster", cost: 40, range: 120, damage: 18, cooldown: 600, color: '#00ffcc',
                    desc: "Verlässlicher Allrounder mit moderater Schussrate.", shape: 'square', pShape: 'bullet', exp: 'normal',
                    svg: '<svg width="40" height="40"><rect x="5" y="5" width="30" height="30" fill="#161622" stroke="#00ffcc" stroke-width="2"/><circle cx="20" cy="20" r="8" fill="#00ffcc"/></svg>'
                },
                rapid: {
                    name: "Ionen-Gatling", cost: 100, range: 100, damage: 6, cooldown: 120, color: '#0088ff',
                    desc: "Feuert extrem schnell. Perfekt gegen schwache, schnelle Viren.", shape: 'triangle', pShape: 'dash', exp: 'small',
                    svg: '<svg width="40" height="40"><polygon points="20,5 35,35 5,35" fill="#161622" stroke="#0088ff" stroke-width="2"/><circle cx="20" cy="23" r="6" fill="#0088ff"/></svg>'
                },
                sniper: {
                    name: "Quanten-Sniper", cost: 130, range: 300, damage: 70, cooldown: 1800, color: '#ff007f',
                    desc: "Hohe Reichweite und kritischer Schaden, aber langsame Feuerrate.", shape: 'diamond', pShape: 'laser', exp: 'normal',
                    svg: '<svg width="40" height="40"><polygon points="20,5 35,20 20,35 5,20" fill="#161622" stroke="#ff007f" stroke-width="2"/><circle cx="20" cy="20" r="5" fill="#ff007f"/></svg>'
                },
                heavy: {
                    name: "Plasma-Kanone", cost: 220, range: 150, damage: 160, cooldown: 2500, color: '#ff4400',
                    desc: "Verschießt langsame, aber verheerende Plasma-Ladungen.", shape: 'hexagon', pShape: 'orb', exp: 'massive',
                    svg: '<svg width="40" height="40"><polygon points="12,5 28,5 35,20 28,35 12,35 5,20" fill="#161622" stroke="#ff4400" stroke-width="2"/><circle cx="20" cy="20" r="10" fill="#ff4400"/></svg>'
                },
                tesla: {
                    name: "Tesla-Spule", cost: 160, range: 120, damage: 12, cooldown: 3000, color: '#ffff33', isTesla: true,
                    desc: "Verschießt elektrische Projektile, die Kettenblitze mit Stun auslösen.", shape: 'star', pShape: 'dash', exp: 'small',
                    svg: '<svg width="40" height="40"><polygon points="20,5 25,15 35,15 27,22 30,32 20,26 10,32 13,22 5,15 15,15" fill="#161622" stroke="#ffff33" stroke-width="2"/></svg>'
                },
                frost: {
                    name: "Frost-Emitter", cost: 180, range: 130, damage: 8, cooldown: 1100, color: '#00ffff', isFrost: true,
                    desc: "Verschießt eiskalte Energieimpulse, die Gegner verlangsamen.", shape: 'octagon', pShape: 'bullet', exp: 'normal',
                    svg: '<svg width="40" height="40"><rect x="8" y="8" width="24" height="24" transform="rotate(45 20 20)" fill="#161622" stroke="#00ffff" stroke-width="2"/><circle cx="20" cy="20" r="6" fill="#00ffff"/></svg>'
                },
                mortar: {
                    name: "Mörser-Batterie", cost: 280, range: 350, damage: 70, cooldown: 3500, color: '#ff00ff', isMortar: true,
                    desc: "Artilleriegeschütz, das Flächenschaden verursacht.", shape: 'circle', pShape: 'orb', exp: 'massive',
                    svg: '<svg width="40" height="40"><circle cx="20" cy="20" r="16" fill="#161622" stroke="#ff00ff" stroke-width="2"/><circle cx="20" cy="20" r="8" fill="#ff00ff"/></svg>'
                },
                gravity: {
                    name: "Singularitäts-Generator", cost: 240, range: 140, damage: 4, cooldown: 2000, color: '#8844ff', isGravity: true,
                    desc: "Hält Gegner im Umkreis verlangsamend fest und zerrt an ihnen.", shape: 'circle', pShape: 'orb', exp: 'small',
                    svg: '<svg width="40" height="40"><circle cx="20" cy="20" r="15" fill="#161622" stroke="#8844ff" stroke-width="2"/><circle cx="20" cy="20" r="5" fill="#8844ff"/><circle cx="20" cy="20" r="10" fill="none" stroke="#8844ff" stroke-width="1" stroke-dasharray="2,2"/></svg>'
                },
                nanite: {
                    name: "Naniten-Schwarm", cost: 200, range: 130, damage: 50, cooldown: 2200, color: '#55ff55', isNanite: true,
                    desc: "Infiziert Ziele mit Naniten (Verursacht Schaden über Zeit).", shape: 'complexNanite', pShape: 'dash', exp: 'normal',
                    svg: '<svg width="40" height="40"><circle cx="20" cy="20" r="14" fill="#161622" stroke="#55ff55" stroke-width="2"/><path d="M12,20 Q20,10 28,20 Q20,30 12,20 Z" fill="none" stroke="#55ff55" stroke-width="1.5"/><circle cx="20" cy="20" r="4" fill="#55ff55"/></svg>'
                },
                radar: {
                    name: "Quantum-Radar", cost: 190, range: 80, damage: 0, cooldown: 0, color: '#00ff88', isRadar: true,
                    desc: "Buff-Turm: Verstärkt Angriffs-Speed und Reichweite aller Türme in Reichweite.", shape: 'radar', pShape: 'none', exp: 'normal',
                    svg: '<svg width="40" height="40"><circle cx="20" cy="20" r="16" fill="#161622" stroke="#00ff88" stroke-width="2"/><circle cx="20" cy="20" r="6" fill="#00ff88"/><line x1="20" y1="20" x2="32" y2="20" stroke="#00ff88" stroke-width="2"/></svg>'
                },
                bomberpad: {
                    name: "Bomber-Geschwader", cost: 300, range: 0, damage: 18, cooldown: 400, color: '#ffaa00', isBomberpad: true,
                    desc: "Platziert ein Kampfflugzeug, das im Kreis feuert.", shape: 'pad', pShape: 'laser', exp: 'small',
                    svg: '<svg width="40" height="40"><rect x="5" y="5" width="30" height="30" fill="#161622" stroke="#ffaa00" stroke-width="2"/><polygon points="20,10 28,28 20,23 12,28" fill="#ffaa00"/></svg>'
                },
                wind: {
                    name: "Windkraftwerk", cost: 180, range: 0, damage: 0, cooldown: 6000, income: 15, color: '#bf00ff', isEconomy: true,
                    desc: "Generiert regelmäßig passives Prisma.", shape: 'rotor', pShape: 'none', exp: 'none',
                    svg: '<svg width="40" height="40"><circle cx="20" cy="20" r="16" fill="#161622" stroke="#bf00ff" stroke-width="2"/><rect x="18" y="5" width="4" height="30" fill="#bf00ff"/><rect x="5" y="18" width="30" height="4" fill="#bf00ff"/></svg>'
                },
                helipad: {
                    name: "Prisma-Helipad", cost: 260, range: 0, damage: 15, cooldown: 350, color: '#00ff66', isHelipad: true,
                    desc: "Entsendet einen Hubschrauber, der den vordersten Gegner jagt.", shape: 'pad', pShape: 'laser', exp: 'small',
                    svg: '<svg width="40" height="40"><rect x="5" y="5" width="30" height="30" fill="#161622" stroke="#00ff66" stroke-width="2"/><circle cx="20" cy="20" r="10" fill="none" stroke="#00ff66" stroke-width="2"/><text x="20" y="24" font-size="14" fill="#00ff66" text-anchor="middle" font-weight="bold">H</text></svg>'
                }
            },
            entities: { towers: [], enemies: [], projectiles: [], particles: [], texts: [], rings: [], floatingTexts: [], helicopters: [], bomberplanes: [], chainLightnings: [] },
            gridSize: 50,
            path: generateRandomPath(),
            enemyHpMultiplier: 0.85
        };

        let animationId;
        let lastTime = performance.now();
        const CANVAS_WIDTH = 800;
        const CANVAS_HEIGHT = 600;

        // --- Styling ---
        const style = document.createElement('style');
        style.textContent = `
            .td-wrapper { box-sizing: border-box; user-select: none; margin: 0; padding: 0; background: #08080c; color: #ffffff; font-family: 'Segoe UI', Tahoma, sans-serif; height: 100%; width: 100%; display: flex; overflow: hidden; position: relative; }
            
            .td-sidebar { width: 350px; background: #101016; border-right: 2px solid #202030; display: flex; flex-direction: column; padding: 20px 15px 20px 20px; z-index: 1000; overflow-y: auto; overflow-x: hidden; position: relative; max-height: 100vh; box-sizing: border-box; }
            .td-sidebar::-webkit-scrollbar { width: 6px; }
            .td-sidebar::-webkit-scrollbar-track { background: #101016; border-radius: 4px; }
            .td-sidebar::-webkit-scrollbar-thumb { background: #00ffcc; border-radius: 4px; }
            
            .td-game-container { flex: 1; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, #181828 0%, #08080c 100%); overflow: hidden; }
            canvas { background: #0d0d14; border: 2px solid #202030; box-shadow: 0 0 40px rgba(0, 255, 204, 0.1); cursor: crosshair; }
            
            .td-stats { margin-bottom: 12px; flex-shrink: 0; }
            .td-stats div { font-size: 1.1rem; margin-bottom: 6px; font-weight: bold; }
            
            @keyframes scorePop { 0% { transform: scale(1); } 50% { transform: scale(1.4); color: #ffffff; } 100% { transform: scale(1); } }
            .td-stat-val { color: #00ff66; text-shadow: 0 0 10px rgba(0,255,102,0.5); display: inline-block; transition: all 0.2s; }
            .td-stat-val.pop { animation: scorePop 0.3s ease-out; }
            
            .td-upgrade-panel { background: #181824; border: 2px solid #00ffcc; border-radius: 8px; padding: 12px; margin-bottom: 12px; box-shadow: 0 0 15px rgba(0,255,204,0.2); flex-shrink: 0; }
            .td-upgrade-btn, .td-sell-btn { padding: 8px 12px; font-weight: bold; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 6px; transition: 0.2s; border: none; }
            .td-upgrade-btn { background: linear-gradient(135deg, #00ffcc, #0088ff); color: #08080c; box-shadow: 0 0 10px rgba(0,255,204,0.4); }
            .td-upgrade-btn:hover { transform: scale(1.02); filter: brightness(1.2); }
            .td-upgrade-btn:disabled { background: #333; color: #777; cursor: not-allowed; box-shadow: none; transform: none; }
            .td-sell-btn { background: linear-gradient(135deg, #ff007f, #ff4400); color: #ffffff; box-shadow: 0 0 10px rgba(255,0,127,0.4); }
            .td-sell-btn:hover { transform: scale(1.02); filter: brightness(1.2); }

            /* Sauberer Infokasten fest in der Sidebar platziert – kein horizontales Überstehen, kein Scrollbalken */
            .td-info-box { background: #14141e; border: 2px solid #00ffcc; border-radius: 8px; padding: 10px; margin-bottom: 15px; flex-shrink: 0; box-sizing: border-box; }
            .td-info-title { font-weight: bold; font-size: 1rem; margin-bottom: 4px; }
            .td-info-stats { font-size: 0.8rem; color: #00ffcc; background: #08080c; padding: 3px 6px; border-radius: 4px; border: 1px solid #262638; margin-bottom: 6px; display: inline-block; }
            .td-info-desc { font-size: 0.85rem; color: #d0d0f0; line-height: 1.3; }

            #td-shop { display: flex; flex-direction: column; gap: 10px; position: relative; flex-grow: 1; padding-bottom: 20px; }
            
            .td-tower-card { background: #161622; border: 2px solid #262638; border-radius: 8px; padding: 10px; cursor: pointer; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; flex-shrink: 0; }
            .td-tower-card:hover { border-color: #00ffcc; box-shadow: 0 0 10px rgba(0,255,204,0.2); background: #1c1c2e; }
            .td-tower-card.selected { border-color: #00ffcc; box-shadow: 0 0 15px rgba(0,255,204,0.4); background: #1c1c2e; }
            .td-tower-card.locked { opacity: 0.5; cursor: not-allowed; }
            .td-tower-name { font-weight: bold; font-size: 1rem; margin-bottom: 2px; }
            .td-tower-cost { color: #ffff00; font-size: 0.85rem; }

            h2 { color: #00ffcc; margin-top: 0; font-size: 1.1rem; border-bottom: 2px solid #202030; padding-bottom: 6px; text-shadow: 0 0 8px rgba(0,255,204,0.4); margin-bottom: 10px; }
        `;
        container.appendChild(style);

        const wrapper = document.createElement('div');
        wrapper.className = 'td-wrapper';
        wrapper.innerHTML = `
            <div class="td-sidebar">
                <h2>KERN-STATUS</h2>
                <div class="td-stats">
                    <div>Prisma: <span class="td-stat-val" id="td-prisma">0</span> P</div>
                    <div>Welle: <span class="td-stat-val" id="td-wave">1</span></div>
                </div>
                <div id="td-upgrade-container"></div>
                <h2>TURM-INFO</h2>
                <div id="td-info-container" class="td-info-box"></div>
                <h2>SHOP</h2>
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
        const uiUpgradeContainer = wrapper.querySelector('#td-upgrade-container');
        const uiInfoContainer = wrapper.querySelector('#td-info-container');

        const addPrisma = (amount) => {
            game.prisma += amount;
            game.score += amount;
            uiPrisma.classList.remove('pop');
            void uiPrisma.offsetWidth;
            uiPrisma.classList.add('pop');
        };

        const getPathCoordinates = () => {
            let coords = [];
            for (let i = 0; i < game.path.length; i++) {
                let p = game.path[i];
                coords.push({x: p.x * game.gridSize + game.gridSize/2, y: p.y * game.gridSize + game.gridSize/2});
            }
            return coords;
        };
        let pathCoords = getPathCoordinates();
        let basePos = pathCoords[pathCoords.length - 1];

        // --- Hilfsfunktion: Findet den Gegner, der am weitesten vorne ist (am nächsten am Ziel) ---
        const getBestTargetForTower = (towerX, towerY, range) => {
            let inRange = game.entities.enemies.filter(e => Math.hypot(e.x - towerX, e.y - towerY) <= range);
            if (inRange.length === 0) return null;

            inRange.sort((a, b) => {
                if (b.pathIndex !== a.pathIndex) {
                    return b.pathIndex - a.pathIndex;
                }
                let nextPoint = pathCoords[a.pathIndex + 1] || pathCoords[pathCoords.length - 1];
                let distA = Math.hypot(nextPoint.x - a.x, nextPoint.y - a.y);
                let distB = Math.hypot(nextPoint.x - b.x, nextPoint.y - b.y);
                return distA - distB;
            });

            return inRange[0];
        };

        const renderInfoBox = (towerKey) => {
            let t = game.towersData[towerKey];
            if (!t) return;
            let statsHtml = t.isEconomy ? `Einkommen: ${t.income} P` : (t.isRadar ? `Buff-Reichweite: ${t.range}` : (t.isHelipad || t.isBomberpad ? `Schaden: ${t.damage}` : `Schaden: ${t.damage} | Reichweite: ${t.range}`));

            uiInfoContainer.style.borderColor = t.color;
            uiInfoContainer.innerHTML = `
                <div class="td-info-title" style="color: ${t.color}">${t.name}</div>
                <div class="td-info-stats">${statsHtml}</div>
                <div class="td-info-desc">${t.desc}</div>
            `;
        };

        const renderUpgradePanel = () => {
            uiUpgradeContainer.innerHTML = '';
            if (!game.selectedInstance) return;

            let t = game.selectedInstance;
            let info = game.towersData[t.type];
            let upgradeCost = Math.floor(info.cost * 0.8 * t.level);
            let isMaxLevel = t.level >= 3;

            let totalInvested = info.cost;
            for(let l = 1; l < t.level; l++) totalInvested += Math.floor(info.cost * 0.8 * l);
            let sellValue = Math.floor(totalInvested / 2);

            let panel = document.createElement('div');
            panel.className = 'td-upgrade-panel';
            panel.innerHTML = `
                <h3 style="color: #00ffcc; font-size: 1.05rem; margin: 0 0 8px 0;">Ausgewählt: ${info.name} (Stufe ${t.level})</h3>
                <div style="font-size: 0.85rem; color: #a0a0c0; margin-bottom: 8px;">
                    ${info.isEconomy ? `Einkommen: ${t.currentIncome}` : (info.isRadar ? `Buff-Reichweite: ${t.currentRange}` : (info.isHelipad || info.isBomberpad ? `Schaden: ${t.currentDamage}` : `Schaden: ${t.currentDamage} | Reichweite: ${t.currentRange}`))}
                </div>
                ${isMaxLevel ? '<div style="color: #ffff00; font-weight: bold; text-shadow: 0 0 8px rgba(255,255,0,0.5);">MAXIMALE STUFE</div>' : `
                    <button class="td-upgrade-btn" id="td-do-upgrade" ${game.prisma < upgradeCost ? 'disabled' : ''}>
                        ✨ Upgrade für ${upgradeCost} P
                    </button>
                `}
                <button class="td-sell-btn" id="td-do-sell">
                    💸 Verkaufen (+${sellValue} P)
                </button>
            `;

            if (!isMaxLevel) {
                panel.querySelector('#td-do-upgrade').onclick = () => {
                    initAudio();
                    if (game.prisma >= upgradeCost) {
                        game.prisma -= upgradeCost;
                        t.level++;
                        if (info.isEconomy) {
                            t.currentIncome = Math.floor(info.income * Math.pow(1.5, t.level - 1));
                        } else {
                            t.currentDamage = Math.floor(info.damage * Math.pow(1.4, t.level - 1));
                            t.currentRange = Math.floor(info.range * Math.pow(1.15, t.level - 1));
                        }
                        spawnParticles(t.x, t.y, info.color, 'massive');
                        spawnFloatingText(t.x, t.y - 20, "✨ Upgrade!", '#ffb6c1');
                        playCuteSound('build');
                        renderShop();
                        renderUpgradePanel();
                    }
                };
            }

            panel.querySelector('#td-do-sell').onclick = () => {
                initAudio();
                addPrisma(sellValue);
                spawnParticles(t.x, t.y, '#ff007f', 'massive');
                spawnFloatingText(t.x, t.y, `+${sellValue}P`, '#ffff00');

                if (info.isHelipad) game.entities.helicopters = game.entities.helicopters.filter(h => h.towerRef !== t);
                if (info.isBomberpad) game.entities.bomberplanes = game.entities.bomberplanes.filter(b => b.towerRef !== t);

                game.entities.towers = game.entities.towers.filter(item => item !== t);
                game.selectedInstance = null;
                renderShop();
                renderUpgradePanel();
            };

            uiUpgradeContainer.appendChild(panel);
        };

        const renderShop = () => {
            uiShop.innerHTML = '';
            for (let key in game.towersData) {
                let t = game.towersData[key];
                let card = document.createElement('div');
                card.className = `td-tower-card ${game.selectedTower === key && !game.selectedInstance ? 'selected' : ''} ${game.prisma < t.cost ? 'locked' : ''}`;

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div class="td-tower-name" style="color: ${t.color}">${t.name}</div>
                            <div class="td-tower-cost">${t.cost} Prisma</div>
                        </div>
                        <div>${t.svg}</div>
                    </div>
                `;

                card.onmouseenter = () => {
                    game.hoveredTower = key;
                    renderInfoBox(key);
                };

                card.onclick = () => {
                    initAudio();
                    if (game.prisma >= t.cost) {
                        game.selectedTower = key;
                        game.selectedInstance = null;
                        renderShop();
                        renderUpgradePanel();
                    }
                };
                uiShop.appendChild(card);
            }
            uiPrisma.innerText = Math.floor(game.prisma);
            uiWave.innerText = game.wave;
        };

        canvas.addEventListener('click', (e) => {
            initAudio();
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            const gridX = Math.floor(x / game.gridSize);
            const gridY = Math.floor(y / game.gridSize);

            let clickedTower = game.entities.towers.find(t => t.gridX === gridX && t.gridY === gridY);
            if (clickedTower) {
                game.selectedInstance = clickedTower;
                renderShop();
                renderUpgradePanel();
                return;
            }

            const isPath = game.path.some(p => p.x === gridX && p.y === gridY);
            const towerInfo = game.towersData[game.selectedTower];

            if (!isPath && game.prisma >= towerInfo.cost) {
                game.prisma -= towerInfo.cost;
                let newTower = {
                    gridX, gridY,
                    x: gridX * game.gridSize + game.gridSize/2,
                    y: gridY * game.gridSize + game.gridSize/2,
                    type: game.selectedTower,
                    level: 1,
                    currentDamage: towerInfo.damage,
                    currentRange: towerInfo.range,
                    currentIncome: towerInfo.income,
                    lastShot: 0
                };
                game.entities.towers.push(newTower);
                game.selectedInstance = newTower;

                spawnParticles(newTower.x, newTower.y, towerInfo.color, 'massive');
                spawnFloatingText(newTower.x, newTower.y - 20, "💖 Erbaut!", '#ffb6c1');
                playCuteSound('build');
                triggerShake(2);

                if (towerInfo.isHelipad) {
                    game.entities.helicopters.push({
                        x: newTower.x, y: newTower.y, homeX: newTower.x, homeY: newTower.y, speed: 180,
                        towerRef: newTower, cooldown: towerInfo.cooldown, lastShot: 0, color: towerInfo.color
                    });
                }

                if (towerInfo.isBomberpad) {
                    game.entities.bomberplanes.push({
                        x: newTower.x, y: newTower.y, angle: Math.random() * Math.PI * 2, radius: 80 + Math.random() * 40,
                        centerX: newTower.x, centerY: newTower.y, speed: 1.5, towerRef: newTower, cooldown: towerInfo.cooldown, lastShot: 0, color: towerInfo.color
                    });
                }

                renderShop();
                renderUpgradePanel();
            } else if (!clickedTower) {
                game.selectedInstance = null;
                renderShop();
                renderUpgradePanel();
            }
        });

        const spawnParticles = (x, y, color, expType) => {
            let count = expType === 'massive' ? 40 : (expType === 'trail' ? 1 : (expType === 'small' ? 6 : 15));
            let speedMult = expType === 'massive' ? 10 : (expType === 'trail' ? 1 : 5);

            for(let i=0; i<count; i++) {
                game.entities.particles.push({
                    x, y, vx: (Math.random() - 0.5) * speedMult, vy: (Math.random() - 0.5) * speedMult,
                    life: expType === 'trail' ? 0.4 : 1, maxLife: expType === 'trail' ? 0.4 : 1 + Math.random() * 0.5,
                    color, size: expType === 'trail' ? Math.random() * 2 + 1 : Math.random() * 3 + 2
                });
            }
            if (expType === 'massive' || expType === 'normal') {
                game.entities.rings.push({ x, y, radius: 5, maxRadius: expType === 'massive' ? 90 : 50, life: 1, color });
            }
        };

        const spawnFloatingText = (x, y, text, color) => {
            game.entities.floatingTexts.push({ x, y, text, color, life: 1 });
        };

        const spawnEnemy = () => {
            const enemyTypes = [
                { type: 'crawler', name: "Krabbel-Virus", hp: 30, speed: 60, color: '#ff0055', size: 22, reward: 5, legs: 6, shape: 'spider' },
                { type: 'runner', name: "Neon-Spinnen", hp: 18, speed: 110, color: '#00ffcc', size: 16, reward: 6, legs: 8, shape: 'spider' },
                { type: 'mech', name: "Giga-Mech", hp: 150, speed: 28, color: '#ff8800', size: 30, reward: 15, legs: 4, shape: 'walker' },
                { type: 'drone', name: "Cyber-Drohne", hp: 75, speed: 70, color: '#0088ff', size: 20, reward: 10, legs: 0, shape: 'drone' },
                { type: 'stalker', name: "Schatten-Läufer", hp: 95, speed: 85, color: '#00ff44', size: 24, reward: 18, legs: 6, shape: 'spider' },
                { type: 'colossus', name: "Titan-Absorber", hp: 380, speed: 22, color: '#ff00aa', size: 36, reward: 35, legs: 8, shape: 'walker' },
            ];

            let selectedEnemy;
            let isBossWave = (game.wave % 5 === 0);

            if (isBossWave) {
                selectedEnemy = {
                    type: 'boss', name: "Apex-Zerstörer",
                    hp: 800 * (game.wave / 5),
                    speed: 18, color: '#bf00ff', size: 45, reward: 100, legs: 10, shape: 'boss'
                };
            } else {
                let rand = Math.random();
                selectedEnemy = enemyTypes[0];
                if (game.wave >= 7 && rand > 0.85) selectedEnemy = enemyTypes[5];
                else if (game.wave >= 4 && rand > 0.6) selectedEnemy = enemyTypes[4];
                else if (game.wave >= 3 && rand > 0.45) selectedEnemy = enemyTypes[2];
                else if (game.wave >= 2 && rand > 0.25) selectedEnemy = enemyTypes[3];
                else if (game.wave >= 2 && rand > 0.1) selectedEnemy = enemyTypes[1];
            }

            game.entities.enemies.push({
                pathIndex: 0, x: pathCoords[0].x, y: pathCoords[0].y,
                hp: selectedEnemy.hp * game.enemyHpMultiplier,
                maxHp: selectedEnemy.hp * game.enemyHpMultiplier,
                speed: selectedEnemy.speed, baseSpeed: selectedEnemy.speed,
                color: selectedEnemy.color, size: selectedEnemy.size,
                reward: selectedEnemy.reward, legs: selectedEnemy.legs,
                shape: selectedEnemy.shape, expType: selectedEnemy.type === 'boss' ? 'massive' : 'normal',
                legAnimPhase: Math.random() * Math.PI * 2, stunTimer: 0, slowTimer: 0, dotTimer: 0, dotDamage: 0
            });
            game.enemiesSpawned++;
        };

        const handleEnemyDeath = (enemy) => {
            spawnParticles(enemy.x, enemy.y, enemy.color, enemy.expType);
            addPrisma(enemy.reward);
            spawnFloatingText(enemy.x, enemy.y, `+${enemy.reward}P`, '#ffff00');
            playCuteSound('kill');

            if (enemy.reward >= 35) triggerShake(5);

            let idx = game.entities.enemies.indexOf(enemy);
            if (idx > -1) game.entities.enemies.splice(idx, 1);
            renderShop();
            renderUpgradePanel();
        };

        // --- Game Loop ---
        const update = (delta, time) => {
            if (game.health <= 0) return;

            if (game.waveActive) {
                game.waveTimer -= delta;
                if (game.waveTimer <= 0 && game.enemiesSpawned < game.enemiesInWave) {
                    spawnEnemy();
                    game.waveTimer = Math.max(0.4, 1.5 - (game.wave * 0.05));
                }

                if (game.enemiesSpawned >= game.enemiesInWave && game.entities.enemies.length === 0) {
                    game.waveActive = false;
                    setTimeout(() => {
                        game.wave++;
                        game.enemiesSpawned = 0;

                        if (game.wave % 5 === 0) {
                            game.enemiesInWave = 1;
                            spawnFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, `🚨 BOSS-WELLE ${game.wave} 🚨`, '#ff0000');
                            triggerShake(8);
                        } else {
                            game.enemiesInWave = Math.floor(4 + game.wave * 2.5);
                            spawnFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, `WELLE ${game.wave}`, '#00ffcc');
                        }

                        game.enemyHpMultiplier += 0.35;
                        game.waveActive = true;
                        renderShop();
                    }, 2500);
                }
            }

            for (let i = game.entities.enemies.length - 1; i >= 0; i--) {
                let e = game.entities.enemies[i];

                if (e.dotTimer > 0) {
                    e.dotTimer -= delta; e.hp -= e.dotDamage * delta;
                    if (Math.random() < 0.2) spawnParticles(e.x, e.y, '#55ff55', 'small');
                    if (e.hp <= 0) {
                        handleEnemyDeath(e);
                        continue;
                    }
                }

                if (e.slowTimer > 0) { e.slowTimer -= delta; e.speed = e.baseSpeed * 0.4; }
                else { e.speed = e.baseSpeed; }

                if (e.stunTimer > 0) { e.stunTimer -= delta; continue; }

                let target = pathCoords[e.pathIndex + 1];

                if (!target) {
                    game.health--;
                    spawnFloatingText(basePos.x, basePos.y - 40, "-1 HP", '#ff0000');
                    game.entities.enemies.splice(i, 1);
                    triggerShake(4);
                    continue;
                }

                let dx = target.x - e.x, dy = target.y - e.y;
                let dist = Math.hypot(dx, dy), moveDist = e.speed * delta;

                e.legAnimPhase += delta * e.speed * 0.15;

                if (dist <= moveDist) {
                    e.x = target.x; e.y = target.y; e.pathIndex++;
                } else {
                    e.x += (dx / dist) * moveDist; e.y += (dy / dist) * moveDist;
                }
            }

            for (let i = game.entities.chainLightnings.length - 1; i >= 0; i--) {
                let chain = game.entities.chainLightnings[i];
                chain.timer -= delta;
                if (chain.timer <= 0) {
                    let enemy = chain.target;
                    if (game.entities.enemies.includes(enemy)) {
                        enemy.hp -= chain.damage;
                        enemy.stunTimer = 0.4;
                        spawnParticles(enemy.x, enemy.y, '#ffff33', 'small');

                        game.entities.particles.push({
                            x: chain.fromX, y: chain.fromY, vx: (enemy.x - chain.fromX) * 0.1, vy: (enemy.y - chain.fromY) * 0.1,
                            life: 0.3, maxLife: 0.3, color: '#ffff33', size: 3
                        });

                        if (enemy.hp <= 0) handleEnemyDeath(enemy);
                    }
                    game.entities.chainLightnings.splice(i, 1);
                }
            }

            game.entities.towers.forEach(t => {
                let info = game.towersData[t.type];
                if (info.isHelipad || info.isBomberpad || info.isRadar) return;

                // Ausbalancierter Radar-Buff
                let activeRadar = game.entities.towers.find(radar => {
                    let rInfo = game.towersData[radar.type];
                    return rInfo.isRadar && Math.hypot(radar.x - t.x, radar.y - t.y) <= radar.currentRange;
                });

                let buffMultiplier = activeRadar ? (1 - 0.08 * activeRadar.level) : 1;
                let currentCooldown = (info.isEconomy ? (info.cooldown / t.level) * 2 : info.cooldown) * buffMultiplier;

                if (time - t.lastShot > currentCooldown) {
                    if (info.isEconomy) {
                        addPrisma(t.currentIncome);
                        spawnParticles(t.x, t.y, info.color, 'small');
                        spawnFloatingText(t.x, t.y - 15, `+${t.currentIncome}P`, info.color);
                        t.lastShot = time; renderShop();
                    } else if (info.isTesla) {
                        let effectiveRange = activeRadar ? t.currentRange * (1 + 0.1 * activeRadar.level) : t.currentRange;
                        let target = getBestTargetForTower(t.x, t.y, effectiveRange);
                        if (target) {
                            game.entities.projectiles.push({ x: t.x, y: t.y, target: target, speed: 600, damage: t.currentDamage, color: info.color, shape: 'dash', exp: 'small', isTeslaProj: true });
                            t.lastShot = time;
                        }
                    } else if (info.isGravity) {
                        let effectiveRange = activeRadar ? t.currentRange * (1 + 0.1 * activeRadar.level) : t.currentRange;
                        let affected = game.entities.enemies.filter(e => Math.hypot(e.x - t.x, e.y - t.y) <= effectiveRange);
                        if (affected.length > 0) {
                            affected.forEach(e => {
                                e.hp -= t.currentDamage; e.slowTimer = 2.0;
                                let angle = Math.atan2(t.y - e.y, t.x - e.x);
                                e.x += Math.cos(angle) * 10; e.y += Math.sin(angle) * 10;
                                if(e.hp <= 0) handleEnemyDeath(e);
                            });
                            game.entities.rings.push({ x: t.x, y: t.y, radius: 5, maxRadius: effectiveRange, life: 1, color: '#8844ff' });
                            spawnFloatingText(t.x, t.y - 10, "🌀 SOG", '#8844ff');
                            t.lastShot = time;
                        }
                    } else if (info.isNanite) {
                        let effectiveRange = activeRadar ? t.currentRange * (1 + 0.1 * activeRadar.level) : t.currentRange;
                        let target = getBestTargetForTower(t.x, t.y, effectiveRange);
                        if (target) {
                            game.entities.projectiles.push({ x: t.x, y: t.y, target: target, speed: 500, damage: t.currentDamage, color: info.color, shape: 'dash', exp: 'normal', isNaniteProj: true });
                            t.lastShot = time;
                        }
                    } else if (info.isMortar) {
                        let effectiveRange = activeRadar ? t.currentRange * (1 + 0.1 * activeRadar.level) : t.currentRange;
                        let target = getBestTargetForTower(t.x, t.y, effectiveRange);
                        if (target) {
                            game.entities.projectiles.push({ x: t.x, y: t.y, targetX: target.x, targetY: target.y, isArea: true, speed: 350, damage: t.currentDamage, range: 80, color: info.color, shape: info.pShape, exp: info.exp });
                            t.lastShot = time;
                        }
                    } else {
                        let effectiveRange = activeRadar ? t.currentRange * (1 + 0.1 * activeRadar.level) : t.currentRange;
                        let target = getBestTargetForTower(t.x, t.y, effectiveRange);
                        if (target) {
                            let projSpeed = info.pShape === 'laser' ? 1200 : (info.pShape === 'orb' ? 200 : 500);
                            game.entities.projectiles.push({ x: t.x, y: t.y, target: target, speed: projSpeed, damage: t.currentDamage, color: info.color, shape: info.pShape, exp: info.exp });
                            t.lastShot = time;
                        }
                    }
                }
            });

            game.entities.helicopters.forEach(heli => {
                let targetX = heli.homeX, targetY = heli.homeY;
                let towerInfo = game.towersData['helipad'];
                let heliDamage = Math.floor(towerInfo.damage * Math.pow(1.4, heli.towerRef.level - 1));

                if (game.entities.enemies.length > 0) {
                    let frontEnemy = game.entities.enemies.reduce((prev, curr) => {
                        if (curr.pathIndex > prev.pathIndex) return curr;
                        if (curr.pathIndex === prev.pathIndex) {
                            let p = pathCoords[curr.pathIndex + 1] || pathCoords[pathCoords.length - 1];
                            return Math.hypot(p.x - curr.x, p.y - curr.y) < Math.hypot(p.x - prev.x, p.y - prev.y) ? curr : prev;
                        }
                        return prev;
                    });
                    let angleToHome = Math.atan2(heli.homeY - frontEnemy.y, heli.homeX - frontEnemy.x);
                    targetX = frontEnemy.x + Math.cos(angleToHome) * 65; targetY = frontEnemy.y + Math.sin(angleToHome) * 65;

                    if (time - heli.lastShot > heli.cooldown) {
                        game.entities.projectiles.push({ x: heli.x, y: heli.y, target: frontEnemy, speed: 900, damage: heliDamage, color: heli.color, shape: 'laser', exp: 'small' });
                        heli.lastShot = time;
                    }
                }

                let dx = targetX - heli.x, dy = targetY - heli.y, dist = Math.hypot(dx, dy), moveDist = heli.speed * delta;
                if (dist <= moveDist) { heli.x = targetX; heli.y = targetY; }
                else { heli.x += (dx / dist) * moveDist; heli.y += (dy / dist) * moveDist; }
            });

            game.entities.bomberplanes.forEach(plane => {
                plane.centerX = plane.towerRef.x; plane.centerY = plane.towerRef.y;
                plane.angle += plane.speed * delta;
                plane.x = plane.centerX + Math.cos(plane.angle) * plane.radius; plane.y = plane.centerY + Math.sin(plane.angle) * plane.radius;

                let towerInfo = game.towersData['bomberpad'];
                let planeDamage = Math.floor(towerInfo.damage * Math.pow(1.4, plane.towerRef.level - 1));

                if (time - plane.lastShot > towerInfo.cooldown) {
                    for (let a = 0; a < 8; a++) {
                        let angle = (a / 8) * Math.PI * 2;
                        game.entities.projectiles.push({ x: plane.x, y: plane.y, vx: Math.cos(angle) * 400, vy: Math.sin(angle) * 400, isFreeLinear: true, damage: planeDamage, color: plane.color, shape: 'bullet', range: 160, traveled: 0 });
                    }
                    plane.lastShot = time;
                }
            });

            for (let i = game.entities.projectiles.length - 1; i >= 0; i--) {
                let p = game.entities.projectiles[i];

                if (Math.random() > 0.6) spawnParticles(p.x, p.y, p.color, 'trail');

                if (p.isFreeLinear) {
                    let step = p.speed ? p.speed * delta : 350 * delta;
                    p.x += (p.vx / 400) * step; p.y += (p.vy / 400) * step; p.traveled += step;

                    let hit = false;
                    for (let j = game.entities.enemies.length - 1; j >= 0; j--) {
                        let en = game.entities.enemies[j];
                        if (Math.hypot(en.x - p.x, en.y - p.y) <= en.size) {
                            en.hp -= p.damage; hit = true;
                            spawnParticles(p.x, p.y, p.color, 'small');
                            if (en.hp <= 0) handleEnemyDeath(en);
                            break;
                        }
                    }
                    if (hit || p.traveled >= p.range) game.entities.projectiles.splice(i, 1);

                } else if (p.isArea) {
                    let dx = p.targetX - p.x, dy = p.targetY - p.y, dist = Math.hypot(dx, dy), moveDist = p.speed * delta;
                    if (dist <= moveDist) {
                        spawnParticles(p.targetX, p.targetY, p.color, p.exp);
                        game.entities.enemies.forEach(en => {
                            if (Math.hypot(en.x - p.targetX, en.y - p.targetY) <= p.range) {
                                en.hp -= p.damage;
                                if (en.hp <= 0) handleEnemyDeath(en);
                            }
                        });
                        game.entities.projectiles.splice(i, 1);
                    } else { p.x += (dx / dist) * moveDist; p.y += (dy / dist) * moveDist; p.angle = Math.atan2(dy, dx); }
                } else {
                    if (!game.entities.enemies.includes(p.target)) { game.entities.projectiles.splice(i, 1); continue; }

                    let dx = p.target.x - p.x, dy = p.target.y - p.y, dist = Math.hypot(dx, dy), moveDist = p.speed * delta;
                    if (dist <= moveDist) {
                        if (p.isTeslaProj) {
                            p.target.hp -= p.damage; p.target.stunTimer = 0.4;
                            spawnParticles(p.target.x, p.target.y, '#ffff33', 'small');

                            let inRangeEnemies = game.entities.enemies.filter(e => Math.hypot(e.x - p.target.x, e.y - p.target.y) <= 120);
                            inRangeEnemies.sort((a, b) => Math.hypot(a.x - p.target.x, a.y - p.target.y) - Math.hypot(b.x - p.target.x, b.y - p.target.y));

                            let selectedChainTargets = [];
                            for (let e of inRangeEnemies) {
                                if (selectedChainTargets.length < 3 && !selectedChainTargets.includes(e) && e !== p.target) selectedChainTargets.push(e);
                            }
                            selectedChainTargets.forEach((targetEnemy, index) => {
                                game.entities.chainLightnings.push({
                                    target: targetEnemy, damage: p.damage,
                                    fromX: index === 0 ? p.target.x : selectedChainTargets[index - 1].x,
                                    fromY: index === 0 ? p.target.y : selectedChainTargets[index - 1].y,
                                    timer: (index + 1) * 0.3
                                });
                            });
                            spawnFloatingText(p.target.x, p.target.y - 10, "⚡ KETTE!", '#ffff33');
                        } else if (p.isNaniteProj) {
                            p.target.hp -= p.damage; p.target.dotTimer = 4.0; p.target.dotDamage = p.damage * 0.75;
                            spawnParticles(p.target.x, p.target.y, '#55ff55', 'normal');
                            spawnFloatingText(p.target.x, p.target.y - 10, "🦠 INFIZIERT", '#55ff55');
                        } else {
                            p.target.hp -= p.damage;
                            let parentTower = game.entities.towers.find(t => Math.hypot(t.x - p.x, t.y - p.y) < 50 && t.type === 'frost');
                            if (parentTower || p.color === '#00ffff') p.target.slowTimer = 2.5;
                        }

                        game.entities.projectiles.splice(i, 1);
                        if (p.target.hp <= 0) handleEnemyDeath(p.target);
                    } else { p.x += (dx / dist) * moveDist; p.y += (dy / dist) * moveDist; p.angle = Math.atan2(dy, dx); }
                }
            }

            for (let i = game.entities.particles.length - 1; i >= 0; i--) {
                let p = game.entities.particles[i];
                p.x += p.vx; p.y += p.vy; p.life -= delta * 2;
                if (p.life <= 0) game.entities.particles.splice(i, 1);
            }
            for (let i = game.entities.rings.length - 1; i >= 0; i--) {
                let r = game.entities.rings[i];
                r.radius += delta * 200; r.life -= delta * 3;
                if (r.life <= 0) game.entities.rings.splice(i, 1);
            }
            for (let i = game.entities.floatingTexts.length - 1; i >= 0; i--) {
                let txt = game.entities.floatingTexts[i];
                txt.y -= delta * 35; txt.life -= delta;
                if (txt.life <= 0) game.entities.floatingTexts.splice(i, 1);
            }
        };

        // --- Zeichnen ---
        const draw = (time) => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'; ctx.lineWidth = 1;
            for(let i=0; i<=CANVAS_WIDTH; i+=game.gridSize) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,CANVAS_HEIGHT); ctx.stroke(); }
            for(let i=0; i<=CANVAS_HEIGHT; i+=game.gridSize) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(CANVAS_WIDTH,i); ctx.stroke(); }

            ctx.strokeStyle = '#252538';
            ctx.lineWidth = game.gridSize * 0.75;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            if (pathCoords.length > 0) ctx.moveTo(pathCoords[0].x, pathCoords[0].y);
            for (let i=1; i<pathCoords.length; i++) ctx.lineTo(pathCoords[i].x, pathCoords[i].y);
            ctx.stroke();

            let glowIntensity = 10 + Math.sin(time / 200) * 5;
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 6;
            ctx.shadowBlur = glowIntensity;
            ctx.shadowColor = '#00ffcc';
            ctx.beginPath();
            if (pathCoords.length > 0) ctx.moveTo(pathCoords[0].x, pathCoords[0].y);
            for (let i=1; i<pathCoords.length; i++) ctx.lineTo(pathCoords[i].x, pathCoords[i].y);
            ctx.stroke();
            ctx.shadowBlur = 0;

            if (game.selectedInstance) {
                let sInfo = game.towersData[game.selectedInstance.type];
                let activeR = game.selectedInstance.currentRange;
                if (!sInfo.isEconomy && !sInfo.isHelipad && !sInfo.isBomberpad) {
                    ctx.strokeStyle = sInfo.isRadar ? 'rgba(0, 255, 136, 0.6)' : 'rgba(0, 255, 204, 0.6)';
                    ctx.fillStyle = sInfo.isRadar ? 'rgba(0, 255, 136, 0.06)' : 'rgba(0, 255, 204, 0.08)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(game.selectedInstance.x, game.selectedInstance.y, activeR, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
            }

            ctx.fillStyle = '#101016';
            ctx.strokeStyle = '#ff007f';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#ff007f';
            ctx.fillRect(basePos.x - 25, basePos.y - 25, 50, 50);
            ctx.strokeRect(basePos.x - 25, basePos.y - 25, 50, 50);
            ctx.shadowBlur = 0;

            ctx.fillStyle = 'rgba(255,0,0,0.5)';
            ctx.fillRect(basePos.x - 30, basePos.y - 40, 60, 6);
            ctx.fillStyle = '#00ff66';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00ff66';
            ctx.fillRect(basePos.x - 30, basePos.y - 40, 60 * (game.health / game.maxHealth), 6);
            ctx.shadowBlur = 0;

            game.entities.towers.forEach(t => {
                let info = game.towersData[t.type];
                ctx.save();
                ctx.translate(t.x, t.y);

                if (game.selectedInstance === t) {
                    ctx.strokeStyle = '#ffff00';
                    ctx.lineWidth = 3;
                    ctx.shadowBlur = 12;
                    ctx.shadowColor = '#ffff00';
                    ctx.strokeRect(-22, -22, 44, 44);
                    ctx.shadowBlur = 0;
                }

                ctx.fillStyle = '#161622';
                ctx.strokeStyle = info.color;
                ctx.lineWidth = 2;
                let sizeScale = 1 + (t.level - 1) * 0.15;
                ctx.scale(sizeScale, sizeScale);

                ctx.beginPath();
                if (info.shape === 'square') {
                    ctx.rect(-15, -15, 30, 30);
                } else if (info.shape === 'triangle') {
                    ctx.moveTo(0, -18); ctx.lineTo(15, 12); ctx.lineTo(-15, 12);
                } else if (info.shape === 'diamond') {
                    ctx.moveTo(0, -18); ctx.lineTo(18, 0); ctx.lineTo(0, 18); ctx.lineTo(-18, 0);
                } else if (info.shape === 'hexagon') {
                    for(let j=0; j<6; j++) ctx.lineTo(16 * Math.cos(j * Math.PI / 3), 16 * Math.sin(j * Math.PI / 3));
                } else if (info.shape === 'star') {
                    for(let j=0; j<5; j++) {
                        ctx.lineTo(16 * Math.cos(j * Math.PI * 2 / 5), 16 * Math.sin(j * Math.PI * 2 / 5));
                        ctx.lineTo(8 * Math.cos((j + 0.5) * Math.PI * 2 / 5), 8 * Math.sin((j + 0.5) * Math.PI * 2 / 5));
                    }
                } else if (info.shape === 'octagon') {
                    for(let j=0; j<8; j++) ctx.lineTo(16 * Math.cos(j * Math.PI / 4), 16 * Math.sin(j * Math.PI / 4));
                } else if (info.shape === 'circle') {
                    ctx.arc(0, 0, 16, 0, Math.PI*2);
                } else if (info.shape === 'rotor') {
                    ctx.arc(0, 0, 15, 0, Math.PI*2);
                } else if (info.shape === 'pad') {
                    ctx.rect(-18, -18, 36, 36);
                } else if (info.shape === 'complexNanite') {
                    ctx.arc(0, 0, 16, 0, Math.PI*2);
                } else if (info.shape === 'radar') {
                    ctx.arc(0, 0, 16, 0, Math.PI*2);
                }
                ctx.closePath(); ctx.fill(); ctx.stroke();

                if (info.isEconomy) {
                    ctx.rotate((time / 300) * t.level);
                    ctx.fillStyle = info.color; ctx.shadowBlur = 12; ctx.shadowColor = info.color;
                    ctx.fillRect(-12, -2, 24, 4); ctx.fillRect(-2, -12, 4, 24);
                } else if (info.isRadar) {
                    ctx.fillStyle = info.color;
                    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
                    ctx.rotate(time / 300);
                    ctx.strokeStyle = info.color; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = info.color;
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(14, 0); ctx.stroke();
                } else if (info.isHelipad) {
                    ctx.fillStyle = info.color; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('H', 0, 1);
                } else if (info.isBomberpad) {
                    ctx.fillStyle = info.color; ctx.beginPath();
                    ctx.moveTo(0, -8); ctx.lineTo(8, 8); ctx.lineTo(0, 4); ctx.lineTo(-8, 8);
                    ctx.closePath(); ctx.fill();
                } else if (info.isNanite) {
                    ctx.strokeStyle = info.color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.stroke();
                    ctx.fillStyle = info.color; ctx.fillRect(-3, -3, 6, 6);
                } else {
                    ctx.fillStyle = info.color; ctx.shadowBlur = 12; ctx.shadowColor = info.color;
                    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
                    if (t.level >= 2) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke(); }
                }
                ctx.restore();
            });

            game.entities.helicopters.forEach(heli => {
                ctx.save();
                ctx.translate(heli.x, heli.y);
                ctx.fillStyle = heli.color; ctx.shadowBlur = 15; ctx.shadowColor = heli.color;
                ctx.beginPath(); ctx.ellipse(0, 0, 12, 7, 0, 0, Math.PI*2); ctx.fill();
                ctx.rotate(time / 40); ctx.fillRect(-18, -2, 36, 4);
                ctx.restore();
            });

            game.entities.bomberplanes.forEach(plane => {
                ctx.save();
                ctx.translate(plane.x, plane.y); ctx.rotate(plane.angle + Math.PI / 2);
                ctx.fillStyle = plane.color; ctx.shadowBlur = 18; ctx.shadowColor = plane.color;
                ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(8, 10); ctx.lineTo(0, 5); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill();
                ctx.restore();
            });

            game.entities.enemies.forEach(e => {
                ctx.save(); ctx.translate(e.x, e.y);

                let renderColor = e.dotTimer > 0 ? '#55ff55' : (e.stunTimer > 0 ? '#ffff33' : (e.slowTimer > 0 ? '#00ffff' : e.color));

                if (e.legs > 0) {
                    ctx.strokeStyle = renderColor; ctx.lineWidth = 2; let legLength = e.size * 0.9;
                    for (let l = 0; l < e.legs; l++) {
                        let angleOffset = (l / e.legs) * Math.PI * 2;
                        let swing = Math.sin(e.legAnimPhase + angleOffset) * (e.size * 0.4);
                        let lx = Math.cos(angleOffset) * legLength, ly = Math.sin(angleOffset) * legLength + swing;
                        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(lx, ly); ctx.stroke();
                    }
                }

                ctx.fillStyle = '#0d0d14'; ctx.strokeStyle = renderColor; ctx.lineWidth = 3; ctx.shadowBlur = 15; ctx.shadowColor = renderColor;

                if (e.shape === 'spider' || e.shape === 'boss') {
                    ctx.beginPath(); ctx.arc(0, 0, e.size * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = renderColor; ctx.beginPath(); ctx.arc(0, 0, e.size * 0.25, 0, Math.PI * 2); ctx.fill();
                } else if (e.shape === 'walker') {
                    ctx.fillRect(-e.size/2, -e.size/2, e.size, e.size); ctx.strokeRect(-e.size/2, -e.size/2, e.size, e.size);
                } else if (e.shape === 'drone') {
                    ctx.beginPath(); ctx.ellipse(0, 0, e.size * 0.8, e.size * 0.4, time / 300, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                } else {
                    ctx.fillRect(-e.size/2, -e.size/2, e.size, e.size); ctx.strokeRect(-e.size/2, -e.size/2, e.size, e.size);
                }

                ctx.restore();
                ctx.fillStyle = 'rgba(255,0,0,0.5)'; ctx.fillRect(e.x - e.size/2 - 5, e.y - e.size/2 - 12, e.size + 10, 4);
                ctx.fillStyle = '#00ff66'; ctx.shadowBlur = 6; ctx.shadowColor = '#00ff66';
                ctx.fillRect(e.x - e.size/2 - 5, e.y - e.size/2 - 12, (e.size + 10) * Math.max(0, (e.hp / e.maxHp)), 4);
                ctx.shadowBlur = 0;
            });

            game.entities.projectiles.forEach(p => {
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle || 0);
                ctx.fillStyle = p.color; ctx.shadowBlur = 15; ctx.shadowColor = p.color;

                if (p.shape === 'bullet') { ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill(); }
                else if (p.shape === 'dash') { ctx.fillRect(-10, -3, 20, 6); }
                else if (p.shape === 'laser') { ctx.fillRect(-24, -2, 48, 4); }
                else if (p.shape === 'orb') { ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill(); }
                ctx.restore();
            });

            game.entities.particles.forEach(p => {
                ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life / p.maxLife); ctx.shadowBlur = 10; ctx.shadowColor = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
            });

            game.entities.rings.forEach(r => {
                ctx.strokeStyle = r.color; ctx.globalAlpha = Math.max(0, r.life); ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = r.color;
                ctx.beginPath(); ctx.arc(r.x, r.y, r.radius, 0, Math.PI*2); ctx.stroke(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
            });

            game.entities.floatingTexts.forEach(txt => {
                ctx.fillStyle = txt.color; ctx.globalAlpha = Math.max(0, txt.life); ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
                ctx.shadowBlur = 10; ctx.shadowColor = txt.color; ctx.fillText(txt.text, txt.x, txt.y); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
            });

            if (game.health <= 0) {
                ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.fillStyle = '#ff007f'; ctx.font = 'bold 45px sans-serif'; ctx.textAlign = 'center';
                ctx.shadowBlur = 30; ctx.shadowColor = '#ff007f'; ctx.fillText('KERN ZERSTÖRT', CANVAS_WIDTH/2, CANVAS_HEIGHT/2); ctx.shadowBlur = 0;
            }
        };

        const triggerShake = (intensity = 6) => {
            canvas.style.transform = `translate(${intensity}px, ${intensity}px)`;
            setTimeout(() => canvas.style.transform = `translate(-${intensity}px, -${intensity}px)`, 40);
            setTimeout(() => canvas.style.transform = `translate(${intensity/2}px, -${intensity/2}px)`, 80);
            setTimeout(() => canvas.style.transform = 'translate(0, 0)', 120);
        };

        const loop = (time) => {
            let delta = (time - lastTime) / 1000;
            if (delta > 0.1) delta = 0.1;
            lastTime = time; update(delta, time); draw(time);
            if (game.health > 0) {
                animationId = requestAnimationFrame(loop);
            } else if (services && services.highscores) {
                services.highscores.saveHighscore('prisma-defense', Math.floor(game.score));
            }
        };

        renderShop(); renderUpgradePanel(); renderInfoBox(game.hoveredTower); animationId = requestAnimationFrame(loop);
        return { destroy: () => { cancelAnimationFrame(animationId); } };
    }
};