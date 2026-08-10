export default {
    manifest: {
        id: 'shape-dodger',
        name: 'Void Dodger',
        description: 'Steuere dein Schiff (Pfeiltasten) und weiche den roten Asteroiden aus. Ein Canvas-basiertes Überlebensspiel.',
        icon: '🚀',
        tags: ['Survival', 'Canvas', 'Arcade']
    },
    init: (container, services) => {
        // --- Setup Canvas ---
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.style.display = 'block';
        container.appendChild(canvas);

        const resize = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // --- Game State ---
        let animationId;
        let isGameOver = false;
        let score = 0;

        const player = { x: canvas.width / 2, y: canvas.height - 50, size: 20, speed: 7 };
        const enemies = [];

        const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };

        const onKeyDown = (e) => { if(keys.hasOwnProperty(e.key)) keys[e.key] = true; };
        const onKeyUp = (e) => { if(keys.hasOwnProperty(e.key)) keys[e.key] = false; };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        // --- Game Loop (Der Render-Zyklus) ---
        const loop = () => {
            if (isGameOver) return;

            // Player Movement
            if (keys.ArrowLeft && player.x > player.size) player.x -= player.speed;
            if (keys.ArrowRight && player.x < canvas.width - player.size) player.x += player.speed;
            if (keys.ArrowUp && player.y > player.size) player.y -= player.speed;
            if (keys.ArrowDown && player.y < canvas.height - player.size) player.y += player.speed;

            // Enemy Spawn
            if (Math.random() < 0.05 + (score * 0.0001)) {
                enemies.push({
                    x: Math.random() * canvas.width,
                    y: -30,
                    size: Math.random() * 15 + 10,
                    speed: Math.random() * 3 + 2 + (score * 0.001)
                });
            }

            // Draw Background
            ctx.fillStyle = '#0d0d12';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Player
            ctx.fillStyle = '#00ff88';
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
            ctx.fill();

            // Update & Draw Enemies & Collision
            ctx.fillStyle = '#ff3366';
            for (let i = enemies.length - 1; i >= 0; i--) {
                let e = enemies[i];
                e.y += e.speed;

                ctx.beginPath();
                ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
                ctx.fill();

                // Kollisionserkennung (Satz des Pythagoras)
                const dx = player.x - e.x;
                const dy = player.y - e.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < player.size + e.size - 5) { // -5 für gnädigere Hitbox
                    isGameOver = true;
                    services.highscores.saveHighscore('shape-dodger', Math.floor(score));
                }

                if (e.y > canvas.height + 30) {
                    enemies.splice(i, 1);
                }
            }

            score += 0.1;

            // UI
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '20px sans-serif';
            ctx.fillText(`Punkte: ${Math.floor(score)}`, 20, 40);

            if (!isGameOver) {
                animationId = requestAnimationFrame(loop);
            } else {
                ctx.fillStyle = 'white';
                ctx.font = '40px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('CRASH! Spiel vorbei', canvas.width / 2, canvas.height / 2);
            }
        };

        // Start the loop
        animationId = requestAnimationFrame(loop);

        // --- Return API ---
        return {
            // Unbedingt nötig, da Canvas-Loops und Window-Events sonst ewig weiterlaufen
            destroy: () => {
                isGameOver = true;
                cancelAnimationFrame(animationId);
                window.removeEventListener('resize', resize);
                window.removeEventListener('keydown', onKeyDown);
                window.removeEventListener('keyup', onKeyUp);
            }
        };
    }
};