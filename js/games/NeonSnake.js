export default {
    manifest: {
        id: 'neonSnake', // Wichtig: Diese ID muss eindeutig sein, damit das Highscore-System sie erkennt
        name: 'Neon Snake',
        description: 'Ein spannender Twist des Snake-Klassikers im Neon-Look.',
        icon: '🐍',
        imageUrl: 'js/assets/images/Snake.png', // Passe den Pfad an, falls nötig
        tags: ['Arcade', 'Action']
    },
    init: (container, services) => {

        // 1. CSS Design (Neon-Look & neue Highscore-Elemente)
        const style = document.createElement('style');
        style.textContent = `
            .snake-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                background-color: #0b0b0e;
                color: #fff;
                font-family: 'Segoe UI', sans-serif;
                overflow: hidden; /* Verhindert Scrollbalken innerhalb des Wrappers */
            }
            .snake-header {
                display: flex;
                justify-content: space-between;
                width: 100%; /* Wird dynamisch per JS angepasst */
                margin-bottom: 15px;
                align-items: center;
                background: rgba(20, 20, 30, 0.4);
                backdrop-filter: blur(12px);
                padding: 1rem 1.5rem;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.05);
                box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
            }
            .snake-title {
                margin: 0;
                font-size: 1.5rem;
                font-weight: bold;
                color: #ffffff;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .text-cyan { color: #00d4ff; text-shadow: 0 0 10px rgba(0, 212, 255, 0.4); }
            
            .snake-stats {
                display: flex;
                gap: 20px;
                align-items: center;
            }
            #score {
                font-size: 1.2rem;
                font-weight: bold;
                color: #ff3366;
                text-shadow: 0 0 10px rgba(255, 51, 102, 0.6);
            }
            .snake-record {
                color: #ffd700;
                font-weight: bold;
                background: rgba(255, 215, 0, 0.1);
                padding: 0.4rem 1rem;
                border-radius: 20px;
                border: 1px solid rgba(255, 215, 0, 0.3);
                text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
            }
            .trophy { margin-right: 5px; }

            #gameCanvas {
                background-color: #12121a;
                border: 2px solid #00d4ff;
                box-shadow: 0 0 20px rgba(0, 212, 255, 0.3), inset 0 0 15px rgba(0, 212, 255, 0.1);
                border-radius: 8px;
            }
            .snake-controls {
                margin-top: 20px;
                z-index: 10; /* Stellt sicher, dass der Button klickbar ist */
            }
            #btn-start {
                background: transparent;
                color: #00d4ff;
                border: 1px solid #00d4ff;
                padding: 10px 20px;
                font-size: 1rem;
                font-weight: bold;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 0 10px rgba(0, 212, 255, 0.2);
            }
            #btn-start:hover {
                background: rgba(0, 212, 255, 0.2);
                box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
            }
        `;
        container.appendChild(style);

        // 2. HTML Struktur einfügen (mit neuen Highscore-Elementen)
        const wrapper = document.createElement('div');
        wrapper.className = 'snake-wrapper';
        wrapper.innerHTML = `
            <div class="snake-header">
                <h2 class="snake-title">NEON <span class="text-cyan">SNAKE</span></h2>
                <div class="snake-stats">
                    <div id="score">Score: 0</div>
                    <div class="snake-record"><span class="trophy">🏆</span> REKORD: <span id="highscore">0</span></div>
                </div>
            </div>
            <canvas id="gameCanvas" width="600" height="600"></canvas>
            <div class="snake-controls">
                <button id="btn-start">Spiel starten</button>
            </div>
        `;
        container.appendChild(wrapper);

        // 3. Wichtige Elemente für deine Spiellogik abgreifen
        const canvas = wrapper.querySelector('#gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreDisplay = wrapper.querySelector('#score');
        const highscoreDisplay = wrapper.querySelector('#highscore');
        const btnStart = wrapper.querySelector('#btn-start');

        // Raster- und Spielvariablen
        const gridSize = 20;
        let tileCountX = 0;
        let tileCountY = 0;

        function resizeCanvas() {
            // Breite und Höhe des verfügbaren Platzes ermitteln
            const maxWidth = container.clientWidth - 50;
            // 200 Pixel Abzug für Header und Button, damit alles ins Bild passt
            const maxHeight = window.innerHeight - 200;

            // Wir nehmen den kleineren Wert, damit das Spielfeld immer quadratisch bleibt
            // Maximale Größe setzen wir auf 800 Pixel
            const containerSize = Math.min(maxWidth, maxHeight, 800);

            canvas.width = Math.floor(containerSize / gridSize) * gridSize;
            canvas.height = canvas.width;

            wrapper.querySelector('.snake-header').style.width = `${canvas.width}px`;

            tileCountX = canvas.width / gridSize;
            tileCountY = canvas.height / gridSize;

            // Nur neu zeichnen, wenn das Spiel nicht gerade läuft
            if (!gameInterval) {
                draw();
            }
        }
        window.addEventListener('resize', resizeCanvas);


        // --- DEINE SPIELLOGIK STARTET HIER ---

        // 1. Zuerst die Variablen definieren!
        let highscore = services.highscores.getHighscore('neonSnake') || 0; // Initialen Highscore laden
        let snake = [ {x: 10, y: 10} ];
        let dx = 0;
        let dy = 0;
        let foodX = 15;
        let foodY = 15;
        let score = 0;
        let gameInterval;

        // Anzeige des geladenen Highscores initialisieren
        highscoreDisplay.innerText = highscore;

        // 2. Dann erst das Canvas berechnen und initial zeichnen lassen
        resizeCanvas();

        // 3. Steuerung
        const handleInput = (e) => {
            if ((e.key === 'ArrowUp' || e.key === 'w') && dy === 0) { dx = 0; dy = -1; }
            if ((e.key === 'ArrowDown' || e.key === 's') && dy === 0) { dx = 0; dy = 1; }
            if ((e.key === 'ArrowLeft' || e.key === 'a') && dx === 0) { dx = -1; dy = 0; }
            if ((e.key === 'ArrowRight' || e.key === 'd') && dx === 0) { dx = 1; dy = 0; }
        };
        window.addEventListener('keydown', handleInput);

        function update() {
            if (dx === 0 && dy === 0) return;
            const newHead = { x:  snake[0].x + dx, y: snake[0].y + dy };

            // Kollision mit Wand
            if (newHead.x < 0 || newHead.x >= tileCountX || newHead.y < 0 || newHead.y >= tileCountY) {
                return gameOver();
            }

            // Kollision mit Körper
            for (let part of snake) {
                if (part.x === newHead.x && part.y === newHead.y) {
                    return gameOver();
                }
            }

            snake.unshift(newHead);

            if (newHead.x === foodX && newHead.y === foodY) {
                score += 100;
                scoreDisplay.innerHTML = `Score: ${score}`;

                foodX = Math.floor(Math.random() * tileCountX);
                // Korrektur: Nutze tileCountY für die Y-Achse
                foodY = Math.floor(Math.random() * tileCountY);

            } else {
                snake.pop();
            }
        }

        function draw() {
            // Hintergrund zeichnen
            ctx.fillStyle = '#12121a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Schlange zeichnen
            ctx.fillStyle = '#00ff88';
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 10;
            snake.forEach(part => {
                ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
            });
            ctx.shadowBlur = 0; // Glow für Futter deaktivieren

            // Futter zeichnen
            ctx.fillStyle = '#d077ff';
            ctx.shadowColor = '#d077ff';
            ctx.fillRect(foodX * gridSize, foodY * gridSize, gridSize - 2, gridSize - 2);
        }

        function gameLoop() {
            update();
            // Nur zeichnen, wenn das Spiel nicht durch gameOver beendet wurde
            if (gameInterval) {
                draw();
            }
        }

        function gameOver() {
            clearInterval(gameInterval);
            gameInterval = 0;

            services.highscores.saveHighscore('neonSnake', score);

            highscore = services.highscores.getHighscore('neonSnake');
            highscoreDisplay.innerText = highscore;

            // 1. Roter Overlay-Schleier zeichnen
            ctx.fillStyle = 'rgba(255, 51, 102, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 2. Game Over Text direkt zentriert auf das Canvas zeichnen
            ctx.fillStyle = '#ff3366';
            ctx.font = 'bold 40px "Segoe UI"';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#ff3366';
            ctx.shadowBlur = 15;
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);

            // 3. Den erreichten Score darunter anzeigen
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px "Segoe UI"';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ffffff';
            ctx.fillText(`SCORE: ${score}`, canvas.width / 2, canvas.height / 2 + 30);

            // Den Text in der Leiste oben wieder auf Standard zurücksetzen
            scoreDisplay.innerText = `Score: ${score}`;

            btnStart.innerText = `Neu starten`;
            btnStart.style.display = 'block';
        }

        // 4. Spiel starten
        btnStart.addEventListener('click', () => {
            window.focus(); // Setzt den Fokus, damit Tastatureingaben sofort erkannt werden

            dx = 1; // Startrichtung rechts
            dy = 0;

            // Schlange auf Startposition zurücksetzen
            snake = [ {x: 10, y: 10} ];

            if (gameInterval) clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, 100);

            btnStart.style.display = 'none';

            score = 0;
            scoreDisplay.innerText = `Score: 0`;
        });

        // 5. Cleanup-Funktion zurückgeben
        return {
            destroy: () => {
                window.removeEventListener('resize', resizeCanvas);
                window.removeEventListener('keydown', handleInput);
                if (gameInterval) clearInterval(gameInterval);
            }
        }
    }
}