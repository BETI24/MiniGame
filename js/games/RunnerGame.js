const COLORS = {
    background: '#080b16', grid: '#182036', cyan: '#41e9ff', lime: '#c9ff59', pink: '#ff5277', white: '#f5f7ff'
};

export function createRunnerGame(api) {
    const groundY = 520;
    const player = { x: 175, y: groundY - 58, width: 58, height: 58, velocityY: 0, grounded: true };
    let obstacles = [];
    let elapsed = 0;
    let spawnTimer = 1.4;
    let speed = 430;
    let score = 0;

    function jump() {
        if (!player.grounded) return;
        player.velocityY = -850;
        player.grounded = false;
    }

    function spawnObstacle() {
        const tall = Math.random() > 0.52;
        const width = tall ? 46 : 68;
        const height = tall ? 96 : 54;
        obstacles.push({ x: api.width + 30, y: groundY - height, width, height });
    }

    function collides(a, b) {
        const padding = 7;
        return a.x + padding < b.x + b.width &&
            a.x + a.width - padding > b.x &&
            a.y + padding < b.y + b.height &&
            a.y + a.height - padding > b.y;
    }

    return {
        init() {
            api.setHUD(0, 'Tempo 1.0×');
        },

        update(delta) {
            elapsed += delta;
            score = Math.floor(elapsed * 10);
            speed = Math.min(780, 430 + elapsed * 11);

            if (api.input.wasPressed('Space', 'KeyW', 'ArrowUp') || api.input.takePointerPresses().length) jump();

            player.velocityY += 2250 * delta;
            player.y += player.velocityY * delta;
            if (player.y >= groundY - player.height) {
                player.y = groundY - player.height;
                player.velocityY = 0;
                player.grounded = true;
            }

            spawnTimer -= delta;
            if (spawnTimer <= 0) {
                spawnObstacle();
                const difficulty = Math.min(0.5, elapsed * 0.006);
                spawnTimer = 1.15 + Math.random() * 0.75 - difficulty;
            }

            obstacles.forEach((obstacle) => { obstacle.x -= speed * delta; });
            obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width > -20);
            if (obstacles.some((obstacle) => collides(player, obstacle))) api.end(score, 'Crash!');
            api.setHUD(score, `Tempo ${(speed / 430).toFixed(1)}×`);
        },

        render(ctx) {
            ctx.fillStyle = COLORS.background;
            ctx.fillRect(0, 0, api.width, api.height);

            ctx.strokeStyle = COLORS.grid;
            ctx.lineWidth = 1;
            const offset = (elapsed * speed * 0.18) % 80;
            for (let x = -offset; x < api.width; x += 80) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, groundY); ctx.stroke();
            }
            for (let y = 40; y < groundY; y += 60) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(api.width, y); ctx.stroke();
            }

            const sunX = 940;
            const glow = ctx.createRadialGradient(sunX, 160, 15, sunX, 160, 170);
            glow.addColorStop(0, 'rgba(164,124,255,.28)');
            glow.addColorStop(1, 'rgba(164,124,255,0)');
            ctx.fillStyle = glow; ctx.fillRect(730, 0, 420, 360);

            ctx.fillStyle = COLORS.cyan;
            ctx.fillRect(0, groundY, api.width, 4);
            ctx.fillStyle = '#10162a';
            ctx.fillRect(0, groundY + 4, api.width, api.height - groundY);
            ctx.strokeStyle = '#27304e';
            for (let x = -offset * 2; x < api.width; x += 90) {
                ctx.beginPath(); ctx.moveTo(x, groundY + 4); ctx.lineTo(x + 80, api.height); ctx.stroke();
            }

            obstacles.forEach((obstacle) => {
                ctx.shadowColor = COLORS.pink; ctx.shadowBlur = 18;
                ctx.fillStyle = COLORS.pink;
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#92294d';
                ctx.fillRect(obstacle.x + 10, obstacle.y + 10, obstacle.width - 20, 9);
            });

            ctx.save();
            ctx.translate(player.x, player.y);
            const tilt = Math.max(-0.18, Math.min(0.18, player.velocityY / 2500));
            ctx.rotate(tilt);
            ctx.shadowColor = COLORS.lime; ctx.shadowBlur = 22;
            ctx.fillStyle = COLORS.lime; ctx.fillRect(0, 0, player.width, player.height);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#17210b';
            ctx.fillRect(35, 13, 9, 9);
            ctx.fillRect(11, 45, 14, 13); ctx.fillRect(36, 45, 14, 13);
            ctx.restore();

            ctx.fillStyle = COLORS.white;
            ctx.font = '700 18px ui-monospace, monospace';
            ctx.fillText('NEON SECTOR 07', 42, 50);
            ctx.fillStyle = '#727a94';
            ctx.font = '14px ui-monospace, monospace';
            ctx.fillText('ÜBERLEBENSZEIT', 42, 78);
            ctx.fillStyle = COLORS.cyan;
            ctx.font = '700 30px ui-monospace, monospace';
            ctx.fillText(`${elapsed.toFixed(1)} s`, 42, 112);
        }
    };
}

createRunnerGame.help = 'Leertaste / W / ↑ / Klick: Springen';
