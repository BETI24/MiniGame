export default {
    manifest: {
        id: 'casino-craps',
        name: 'Vegas Craps 3D',
        description: 'Der laute Casino-Klassiker mit echter 3D-Physik. Setze auf die Pass Line und werde zum Shooter!',
        icon: '🎲',
        image: 'js/assets/images/games/craps.png',
        tags: ['Casino', 'Dice', '3D', 'Physics']
    },
    init: (container, services) => {
        // --- State Management ---
        let balance = 1000.00;
        let currentBet = 10;
        let lockedBet = 0;
        let phase = 'COME_OUT';
        let pointNumber = null;
        let isRolling = false;

        const destroyCallbacks = [];

        // --- Sound Engine ---
        const sfxRoll = new Audio('js/assets/sounds/roll.mp3');
        const sfxWin = new Audio('js/assets/sounds/epic_win.mp3');
        const sfxLoss = new Audio('js/assets/sounds/crash.mp3');
        const sfxPoint = new Audio('js/assets/sounds/coin.mp3');

        // --- Styling ---
        const style = document.createElement('style');
        style.textContent = [
            "@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Inter:wght@400;600;800&display=swap');",
            ".craps-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; background: #06070a; color: #fff; font-family: 'Inter', sans-serif; overflow: hidden; border-radius: 12px; border: 2px solid #1a2332; position: relative; }",
            ".craps-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 30px; background: #0d131f; border-bottom: 1px solid #1a2332; z-index: 10; }",
            ".craps-stat { text-align: center; }",
            ".craps-stat span { display: block; font-size: 0.8rem; color: #64748b; text-transform: uppercase; font-weight: 600; }",
            ".craps-stat strong { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; color: #00ffcc; text-shadow: 0 0 10px rgba(0,255,204,0.3); }",

            /* Neon Tisch Design */
            ".craps-table { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; background: radial-gradient(circle, #131722 0%, #06070a 100%); border: 2px solid #00ffcc; border-radius: 12px; margin: 20px; box-shadow: 0 0 30px rgba(0,255,204,0.15), inset 0 0 40px rgba(0,255,204,0.1); overflow: hidden; }",

            /* 3D Container */
            ".craps-3d-arena { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }",

            /* Status Banner */
            ".craps-board-status { position: absolute; top: 30px; left: 50%; transform: translateX(-50%); font-family: 'Orbitron', sans-serif; font-size: 2rem; color: #00ffcc; text-transform: uppercase; text-shadow: 0 0 15px rgba(0,255,204,0.8); letter-spacing: 2px; text-align: center; pointer-events: none; z-index: 10; transition: opacity 0.3s, transform 0.1s; background: rgba(6,7,10,0.85); padding: 15px 30px; border-radius: 15px; border: 1px solid #00ffcc; box-shadow: 0 0 20px rgba(0,255,204,0.2); backdrop-filter: blur(4px); white-space: nowrap; }",
            ".craps-board-sub { font-size: 1rem; color: #fff; margin-top: 5px; opacity: 0.9; font-family: 'Inter', sans-serif; text-shadow: none; letter-spacing: normal; }",

            /* UI Controls */
            ".craps-controls { display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; background: #0d131f; border-top: 1px solid #1a2332; z-index: 10; }",
            ".craps-bet-section { display: flex; align-items: center; gap: 8px; }",
            ".craps-btn-small { background: #131722; border: 1px solid #222838; color: #00ffcc; padding: 10px 12px; font-weight: bold; border-radius: 6px; cursor: pointer; transition: 0.2s; font-size: 0.9rem; }",
            ".craps-btn-small:hover { background: #1c2333; border-color: #00ffcc; box-shadow: 0 0 10px rgba(0,255,204,0.2); }",
            ".craps-btn-small:disabled { opacity: 0.4; cursor: not-allowed; border-color: #222838; box-shadow: none; }",
            ".craps-roll-btn { background: linear-gradient(135deg, #00ffcc 0%, #00b386 100%); color: #000; font-family: 'Orbitron', sans-serif; font-size: 1.5rem; font-weight: 900; border: none; border-radius: 30px; padding: 15px 40px; cursor: pointer; box-shadow: 0 0 20px rgba(0,255,204,0.4); text-transform: uppercase; transition: 0.1s; }",
            ".craps-roll-btn:active { transform: scale(0.95); }",
            ".craps-roll-btn:disabled { background: #131722; color: #4a5568; box-shadow: none; cursor: not-allowed; transform: none; }",

            /* Modal für Regeln */
            ".craps-modal { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(6,7,10,0.9); z-index: 100; display: none; justify-content: center; align-items: center; backdrop-filter: blur(8px); }",
            ".craps-modal.show { display: flex; }",
            ".craps-modal-content { background: #0d131f; border: 1px solid #00ffcc; border-radius: 12px; padding: 30px; max-width: 500px; color: #e2e8f0; box-shadow: 0 0 40px rgba(0,255,204,0.1); }",
            ".craps-modal-content h3 { color: #00ffcc; font-family: 'Orbitron', sans-serif; margin-bottom: 20px; font-size: 1.5rem; text-align: center; text-shadow: 0 0 10px rgba(0,255,204,0.5); }",
            ".craps-modal-content ul { padding-left: 20px; margin-bottom: 25px; line-height: 1.6; }",
            ".craps-modal-content li { margin-bottom: 10px; }",
            ".craps-modal-content strong { color: #00ffcc; }",
            ".craps-modal-close { width: 100%; background: #00ffcc; color: #000; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; font-family: 'Orbitron', sans-serif; text-transform: uppercase; }",
            ".craps-modal-close:hover { background: #00e6b8; box-shadow: 0 0 15px rgba(0,255,204,0.4); }"
        ].join('\n');
        container.appendChild(style);

        // --- DOM-Struktur ---
        const wrapper = document.createElement('div');
        wrapper.className = 'craps-wrapper';
        wrapper.innerHTML = [
            '<div class="craps-header">',
            '<div class="craps-stat"><span>Guthaben</span><strong id="craps-balance">1000.00 €</strong></div>',
            '<button class="craps-btn-small" id="craps-btn-rules">Regeln</button>',
            '<div class="craps-stat"><span>Tisch-Einsatz</span><strong id="craps-locked-bet" style="color: #ff00ff; text-shadow: 0 0 10px rgba(255,0,255,0.4);">0.00 €</strong></div>',
            '</div>',
            '<div class="craps-table">',
            '<div class="craps-3d-arena" id="craps-arena"></div>',
            '<div class="craps-board-status" id="craps-status-wrapper">',
            '<div id="craps-status-main">LÄDT 3D ENGINE...</div>',
            '<div id="craps-status-sub" class="craps-board-sub">Bitte warten</div>',
            '</div>',
            '</div>',
            '<div class="craps-controls">',
            '<div class="craps-bet-section">',
            '<button class="craps-btn-small" id="btn-bet-min">MIN</button>',
            '<button class="craps-btn-small" id="btn-bet-m100">-100</button>',
            '<button class="craps-btn-small" id="btn-bet-m10">-10</button>',
            '<div class="craps-stat" style="margin: 0 10px;"><span>Einsatz</span><strong id="craps-bet-display" style="color:#fff; text-shadow: none;">10 €</strong></div>',
            '<button class="craps-btn-small" id="btn-bet-p10">+10</button>',
            '<button class="craps-btn-small" id="btn-bet-p100">+100</button>',
            '<button class="craps-btn-small" id="btn-bet-max">MAX</button>',
            '</div>',
            '<button class="craps-roll-btn" id="craps-roll-btn" disabled>LÄDT...</button>',
            '</div>',

            // Regel-Fenster
            '<div class="craps-modal" id="craps-modal">',
            '<div class="craps-modal-content">',
            '<h3>Spielregeln</h3>',
            '<ul>',
            '<li><strong>Come-Out Roll:</strong> Der erste Wurf. Eine 7 oder 11 gewinnt sofort. Eine 2, 3 oder 12 verliert sofort.</li>',
            '<li><strong>Der Point:</strong> Jede andere Zahl (4, 5, 6, 8, 9, 10) wird zum "Point". Dein Einsatz bleibt auf dem Tisch.</li>',
            '<li><strong>Point Phase:</strong> Du würfelst weiter. Triffst du deinen Point erneut, gewinnst du. Würfelst du vorher eine 7, verlierst du.</li>',
            '</ul>',
            '<button class="craps-modal-close" id="craps-modal-close">Verstanden</button>',
            '</div>',
            '</div>'
        ].join('');
        container.appendChild(wrapper);

        // --- Referenzen ---
        const uiBalance = wrapper.querySelector('#craps-balance');
        const uiLockedBet = wrapper.querySelector('#craps-locked-bet');
        const uiBetDisplay = wrapper.querySelector('#craps-bet-display');
        const uiStatusMain = wrapper.querySelector('#craps-status-main');
        const uiStatusSub = wrapper.querySelector('#craps-status-sub');
        const uiStatusWrapper = wrapper.querySelector('#craps-status-wrapper');
        const btnRoll = wrapper.querySelector('#craps-roll-btn');

        // Buttons
        const btnMin = wrapper.querySelector('#btn-bet-min');
        const btnM100 = wrapper.querySelector('#btn-bet-m100');
        const btnM10 = wrapper.querySelector('#btn-bet-m10');
        const btnP10 = wrapper.querySelector('#btn-bet-p10');
        const btnP100 = wrapper.querySelector('#btn-bet-p100');
        const btnMax = wrapper.querySelector('#btn-bet-max');

        const btnRules = wrapper.querySelector('#craps-btn-rules');
        const modal = wrapper.querySelector('#craps-modal');
        const btnCloseModal = wrapper.querySelector('#craps-modal-close');
        const arenaContainer = wrapper.querySelector('#craps-arena');

        const updateUI = () => {
            uiBalance.innerText = balance.toFixed(2) + ' €';
            uiBetDisplay.innerText = currentBet + ' €';
            uiLockedBet.innerText = lockedBet > 0 ? lockedBet.toFixed(2) + ' €' : '0.00 €';

            const betControlsDisabled = (phase === 'POINT' || isRolling);

            const buttons = [btnMin, btnM100, btnM10, btnP10, btnP100, btnMax];
            for (let i = 0; i < buttons.length; i++) {
                buttons[i].disabled = betControlsDisabled;
            }

            uiBetDisplay.style.opacity = betControlsDisabled ? '0.3' : '1';
        };

        const setStatus = (main, sub, color, borderColor) => {
            uiStatusMain.innerText = main;
            uiStatusMain.style.color = color || '#00ffcc';
            uiStatusMain.style.textShadow = '0 0 15px ' + (color || '#00ffcc');
            uiStatusWrapper.style.borderColor = borderColor || '#00ffcc';

            uiStatusSub.innerText = sub;
            uiStatusWrapper.style.opacity = '1';

            uiStatusWrapper.style.transform = 'translateX(-50%) scale(1.1)';
            setTimeout(() => { uiStatusWrapper.style.transform = 'translateX(-50%) scale(1)'; }, 150);
        };

        const handleWin = (payoutMult, msg) => {
            const winAmount = lockedBet * payoutMult;
            balance += winAmount + lockedBet;
            lockedBet = 0;
            phase = 'COME_OUT';
            pointNumber = null;
            setStatus(msg, '+' + winAmount.toFixed(2) + ' €', '#00ffcc', '#00ffcc');
            sfxWin.currentTime = 0;
            sfxWin.play().catch(e => {});
        };

        const handleLoss = (msg) => {
            lockedBet = 0;
            phase = 'COME_OUT';
            pointNumber = null;
            setStatus(msg, 'Einsatz verloren.', '#ff3366', '#ff3366');
            sfxLoss.currentTime = 0;
            sfxLoss.play().catch(e => {});
        };

        const evaluateDice = (v1, v2) => {
            const sum = v1 + v2;

            if (phase === 'COME_OUT') {
                if (sum === 7 || sum === 11) {
                    handleWin(1, 'NATURAL WIN!');
                } else if (sum === 2 || sum === 3 || sum === 12) {
                    handleLoss('CRAPS!');
                } else {
                    phase = 'POINT';
                    pointNumber = sum;
                    setStatus('POINT IS ' + pointNumber, 'Wirf eine ' + pointNumber + ' zum Gewinnen.', '#ff00ff', '#ff00ff');
                    sfxPoint.currentTime = 0;
                    sfxPoint.play().catch(e => {});
                }
            } else if (phase === 'POINT') {
                if (sum === pointNumber) {
                    handleWin(1, 'POINT HIT!');
                } else if (sum === 7) {
                    handleLoss('SEVEN OUT!');
                } else {
                    setStatus('POINT IS ' + pointNumber, 'Du hast eine ' + sum + ' geworfen. Weiter!', '#ff00ff', '#ff00ff');
                }
            }

            if (services && services.highscores) {
                services.highscores.saveHighscore('casino-craps', Math.floor(balance));
            }
        };

        // --- Einsatzsteuerung ---
        const adjustBet = (type, amount) => {
            if (phase === 'POINT' || isRolling) return;

            if (type === 'MIN') {
                currentBet = 10;
            } else if (type === 'MAX') {
                currentBet = Math.max(10, Math.floor(balance));
            } else if (type === 'ADD') {
                currentBet += amount;
            }

            if (currentBet < 10) currentBet = 10;

            if (currentBet > balance && balance >= 10) {
                currentBet = Math.floor(balance);
            }

            updateUI();
        };

        // --- Helfer zum Laden externer Bibliotheken ---
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                if (document.querySelector('script[src="' + src + '"]')) return resolve();
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        // --- 3D und Physik Setup ---
        let scene, camera, renderer, world;
        let diceMeshes = [];
        let diceBodies = [];
        let animationFrameId;

        const setupPhysicsAnd3D = async () => {
            try {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js');

                scene = new THREE.Scene();
                const aspect = arenaContainer.clientWidth / arenaContainer.clientHeight;

                camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
                camera.position.set(0, 24, 0.1);
                camera.lookAt(0, 0, 0);

                renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                renderer.setSize(arenaContainer.clientWidth, arenaContainer.clientHeight);
                renderer.shadowMap.enabled = true;
                arenaContainer.appendChild(renderer.domElement);

                // Schwaches Umgebungslicht
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
                scene.add(ambientLight);

                // Neon Lichter für Spiegelungen auf den Würfeln
                const neonCyan = new THREE.PointLight(0x00ffcc, 1.5, 50);
                neonCyan.position.set(-8, 10, 0);
                scene.add(neonCyan);

                const neonPink = new THREE.PointLight(0xff00ff, 1.5, 50);
                neonPink.position.set(8, 10, 5);
                scene.add(neonPink);

                // Hauptlicht für den Schatten
                const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
                dirLight.position.set(2, 20, 5);
                dirLight.castShadow = true;
                dirLight.shadow.mapSize.width = 2048;
                dirLight.shadow.mapSize.height = 2048;

                const d = 20;
                dirLight.shadow.camera.left = -d;
                dirLight.shadow.camera.right = d;
                dirLight.shadow.camera.top = d;
                dirLight.shadow.camera.bottom = -d;
                dirLight.shadow.camera.near = 0.1;
                dirLight.shadow.camera.far = 50;

                scene.add(dirLight);

                world = new CANNON.World();
                world.gravity.set(0, -60, 0);
                world.broadphase = new CANNON.NaiveBroadphase();

                const diceMat = new CANNON.Material();
                const floorMat = new CANNON.Material();
                const wallMat = new CANNON.Material();

                world.addContactMaterial(new CANNON.ContactMaterial(diceMat, floorMat, { friction: 0.3, restitution: 0.5 }));
                world.addContactMaterial(new CANNON.ContactMaterial(diceMat, wallMat, { friction: 0.1, restitution: 0.8 }));
                world.addContactMaterial(new CANNON.ContactMaterial(diceMat, diceMat, { friction: 0.3, restitution: 0.6 }));

                const floorBody = new CANNON.Body({ mass: 0, material: floorMat });
                floorBody.addShape(new CANNON.Plane());
                floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
                world.addBody(floorBody);

                const floorMesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(50, 50),
                    new THREE.ShadowMaterial({ opacity: 0.4 })
                );
                floorMesh.rotation.x = -Math.PI / 2;
                floorMesh.receiveShadow = true;
                scene.add(floorMesh);

                const addWall = (x, y, z, rx, ry, rz) => {
                    const wall = new CANNON.Body({ mass: 0, material: wallMat });
                    wall.addShape(new CANNON.Plane());
                    wall.position.set(x, y, z);
                    wall.quaternion.setFromEuler(rx, ry, rz);
                    world.addBody(wall);
                };

                addWall(0, 0, -8, 0, 0, 0);
                addWall(0, 0,  8, 0, Math.PI, 0);
                addWall(-14, 0, 0, 0, Math.PI/2, 0);
                addWall( 14, 0, 0, 0, -Math.PI/2, 0);

// --- Neon Würfel Textur mit extremem Glow ---
                const createDiceTexture = (num) => {
                    const tCanvas = document.createElement('canvas');
                    tCanvas.width = 256; tCanvas.height = 256;
                    const ctx = tCanvas.getContext('2d');

                    // Dunkler Würfel-Körper (Tiefschwarz, damit nur die Neon-Elemente leuchten)
                    ctx.fillStyle = '#020408';
                    ctx.fillRect(0,0,256,256);

                    // Extremes Neon-Leuchten für die Umrandung
                    ctx.shadowColor = '#00ffcc';
                    ctx.shadowBlur = 40;
                    ctx.strokeStyle = '#00ffcc';
                    ctx.lineWidth = 8;
                    // Mehrfach zeichnen = extrem starker Glow auf dem Canvas
                    ctx.strokeRect(4, 4, 248, 248);
                    ctx.strokeRect(4, 4, 248, 248);

                    // Weißer, harter Kern für den authentischen Neon-Röhren-Effekt
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(4, 4, 248, 248);

                    // Neon Leucht-Punkte
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = '#00ffcc';
                    ctx.shadowBlur = 50;

                    const drawDot = (x, y) => {
                        ctx.beginPath();
                        ctx.arc(x, y, 22, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fill(); // Doppelter Fill für strahlenderen Kern
                    };

                    const c = 128, d1 = 60, d2 = 196;
                    if ([1,3,5].includes(num)) drawDot(c, c);
                    if ([2,3,4,5,6].includes(num)) { drawDot(d1, d1); drawDot(d2, d2); }
                    if ([4,5,6].includes(num)) { drawDot(d2, d1); drawDot(d1, d2); }
                    if (num === 6) { drawDot(d1, c); drawDot(d2, c); }

                    return new THREE.CanvasTexture(tCanvas);
                };

                // Material mit Eigenleuchten (Emissive) für die 3D-Engine
                const getMaterial = (num) => {
                    const tex = createDiceTexture(num);
                    return new THREE.MeshStandardMaterial({
                        map: tex,
                        emissiveMap: tex,
                        emissive: 0x00ffcc, // Die Neon-Leuchtfarbe
                        emissiveIntensity: 0.9, // Stärke des aktiven Leuchtens (0 bis 1)
                        roughness: 0.1, // Sehr glatt
                        metalness: 0.8  // Reflektiert die Umgebungslichter
                    });
                };

                const materials = [
                    getMaterial(1), getMaterial(6),
                    getMaterial(2), getMaterial(5),
                    getMaterial(3), getMaterial(4)
                ];

                const diceGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
                const diceShape = new CANNON.Box(new CANNON.Vec3(0.75, 0.75, 0.75));

                for (let i = 0; i < 2; i++) {
                    const mesh = new THREE.Mesh(diceGeo, materials);
                    mesh.castShadow = true;
                    scene.add(mesh);
                    diceMeshes.push(mesh);

                    const body = new CANNON.Body({ mass: 1, material: diceMat });
                    body.addShape(diceShape);
                    body.position.set(i === 0 ? -1.5 : 1.5, 0.75, 0);
                    world.addBody(body);
                    diceBodies.push(body);
                }

                let stopTimer = 0;
                let isPhysicsActive = false;

                const animate = () => {
                    animationFrameId = requestAnimationFrame(animate);

                    if (isPhysicsActive) {
                        world.step(1/60);
                        let isMoving = false;

                        for (let i = 0; i < 2; i++) {
                            diceMeshes[i].position.copy(diceBodies[i].position);
                            diceMeshes[i].quaternion.copy(diceBodies[i].quaternion);

                            if (diceBodies[i].velocity.lengthSquared() > 0.05 || diceBodies[i].angularVelocity.lengthSquared() > 0.05) {
                                isMoving = true;
                            }
                        }

                        if (!isMoving) {
                            stopTimer++;
                            if (stopTimer > 20) {
                                isPhysicsActive = false;
                                const v1 = getDiceValue(diceMeshes[0]);
                                const v2 = getDiceValue(diceMeshes[1]);
                                evaluateDice(v1, v2);

                                isRolling = false;
                                btnRoll.disabled = false;
                                updateUI();
                            }
                        } else {
                            stopTimer = 0;
                        }
                    }

                    renderer.render(scene, camera);
                };

                for (let i = 0; i < 2; i++) {
                    diceMeshes[i].position.copy(diceBodies[i].position);
                    diceMeshes[i].quaternion.copy(diceBodies[i].quaternion);
                }

                animate();

                setStatus('COME OUT ROLL', 'Wirf eine 7 oder 11 um zu gewinnen.', '#00ffcc', '#00ffcc');
                btnRoll.innerText = 'ROLL DICE';
                btnRoll.disabled = false;

                btnRoll.addEventListener('click', () => {
                    if (isRolling) return;

                    if (phase === 'COME_OUT') {
                        if (balance < currentBet) return alert('Nicht genug Guthaben!');
                        balance -= currentBet;
                        lockedBet = currentBet;
                    }

                    isRolling = true;
                    isPhysicsActive = true;
                    stopTimer = 0;
                    btnRoll.disabled = true;
                    updateUI();

                    uiStatusWrapper.style.opacity = '0';
                    sfxRoll.currentTime = 0;
                    sfxRoll.play().catch(e => {});

                    diceBodies.forEach((body, index) => {
                        body.position.set(index === 0 ? -2 : 2, 6, 6);
                        body.velocity.set((Math.random() - 0.5) * 12, -2, -15 - Math.random() * 10);
                        body.angularVelocity.set(Math.random() * 20, Math.random() * 20, Math.random() * 20);
                    });
                });

            } catch (err) {
                console.error("Fehler beim Laden der 3D-Engine:", err);
                setStatus('ENGINE FEHLER', 'Konnte 3D-Bibliotheken nicht laden.', '#ff3366');
            }
        };

        const getDiceValue = (mesh) => {
            const normals = [
                { v: new THREE.Vector3(1, 0, 0), val: 1 },
                { v: new THREE.Vector3(-1, 0, 0), val: 6 },
                { v: new THREE.Vector3(0, 1, 0), val: 2 },
                { v: new THREE.Vector3(0, -1, 0), val: 5 },
                { v: new THREE.Vector3(0, 0, 1), val: 3 },
                { v: new THREE.Vector3(0, 0, -1), val: 4 }
            ];

            let maxDot = -Infinity;
            let bestValue = -1;
            const up = new THREE.Vector3(0, 1, 0);

            for(let i = 0; i < normals.length; i++) {
                const worldNormal = normals[i].v.clone().applyQuaternion(mesh.quaternion).normalize();
                const dot = worldNormal.dot(up);
                if (dot > maxDot) {
                    maxDot = dot;
                    bestValue = normals[i].val;
                }
            }
            return bestValue;
        };

        const resizeRenderer = () => {
            if (renderer && camera && arenaContainer) {
                const width = arenaContainer.clientWidth;
                const height = arenaContainer.clientHeight;
                renderer.setSize(width, height);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
            }
        };
        window.addEventListener('resize', resizeRenderer);

        // --- Modale Events ---
        btnRules.addEventListener('click', () => modal.classList.add('show'));
        btnCloseModal.addEventListener('click', () => modal.classList.remove('show'));

        // --- UI Wett-Events ---
        btnMin.addEventListener('click', () => adjustBet('MIN'));
        btnM100.addEventListener('click', () => adjustBet('ADD', -100));
        btnM10.addEventListener('click', () => adjustBet('ADD', -10));
        btnP10.addEventListener('click', () => adjustBet('ADD', 10));
        btnP100.addEventListener('click', () => adjustBet('ADD', 100));
        btnMax.addEventListener('click', () => adjustBet('MAX'));

        destroyCallbacks.push(() => {
            window.removeEventListener('resize', resizeRenderer);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (renderer) renderer.dispose();
            sfxRoll.pause();
            sfxWin.pause();
            sfxLoss.pause();
        });

        updateUI();
        setupPhysicsAnd3D();

        return {
            destroy: () => {
                destroyCallbacks.forEach(cb => cb());
            }
        };
    }
};