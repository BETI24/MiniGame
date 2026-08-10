const COLORS = { background: '#081019', panel: '#101c2a', red: '#ff5277', blue: '#41e9ff', lime: '#c9ff59', muted: '#78859b', white: '#f5f7ff' };

export function createSorterGame(api) {
    const basketY = 515;
    const basketWidth = 360;
    const basketHeight = 82;
    const baskets = {
        red: { x: 110, y: basketY, width: basketWidth, height: basketHeight },
        blue: { x: 810, y: basketY, width: basketWidth, height: basketHeight }
    };
    let item;
    let score = 0;
    let errors = 0;
    let sorted = 0;
    let elapsed = 0;
    let feedback = null;
    let feedbackTimer = 0;

    function spawnItem() {
        item = {
            type: Math.random() < 0.5 ? 'red' : 'blue',
            x: api.width / 2,
            y: 70,
            radius: 31,
            speed: Math.min(320, 165 + sorted * 8)
        };
    }

    function resolveItem() {
        const side = item.x < api.width / 2 ? 'red' : 'blue';
        if (side === item.type) {
            score += 100;
            sorted += 1;
            feedback = '+100 RICHTIG';
        } else {
            score = Math.max(0, score - 50);
            errors += 1;
            feedback = '-50 FEHLER';
        }
        feedbackTimer = 0.55;
        if (errors >= 3) api.end(score, '3 Fehler!');
        else spawnItem();
    }

    return {
        init() {
            spawnItem();
            api.setHUD(0, 'Fehler 0 / 3');
        },

        update(delta) {
            elapsed += delta;
            feedbackTimer = Math.max(0, feedbackTimer - delta);
            const direction = (api.input.isDown('ArrowRight', 'KeyD') ? 1 : 0) - (api.input.isDown('ArrowLeft', 'KeyA') ? 1 : 0);
            item.x += direction * 510 * delta;
            item.x = Math.max(item.radius + 25, Math.min(api.width - item.radius - 25, item.x));
            item.y += item.speed * delta;

            // Mouse clicks instantly guide the current item toward a basket.
            for (const point of api.input.takePointerPresses()) {
                item.x = point.x < api.width / 2 ? baskets.red.x + basketWidth / 2 : baskets.blue.x + basketWidth / 2;
            }

            if (item.y + item.radius >= basketY + 16) resolveItem();
            api.setHUD(score, `Fehler ${errors} / 3`);
        },

        render(ctx) {
            ctx.fillStyle = COLORS.background;
            ctx.fillRect(0, 0, api.width, api.height);

            ctx.strokeStyle = 'rgba(65,233,255,.07)';
            for (let x = 0; x <= api.width; x += 64) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, api.height); ctx.stroke();
            }
            for (let y = 0; y <= api.height; y += 64) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(api.width, y); ctx.stroke();
            }

            ctx.fillStyle = 'rgba(255,255,255,.025)';
            ctx.fillRect(0, 0, api.width / 2, api.height);
            ctx.strokeStyle = '#2a3241'; ctx.setLineDash([8, 12]);
            ctx.beginPath(); ctx.moveTo(api.width / 2, 35); ctx.lineTo(api.width / 2, basketY - 20); ctx.stroke();
            ctx.setLineDash([]);

            ctx.textAlign = 'center';
            ctx.fillStyle = COLORS.muted;
            ctx.font = '700 15px ui-monospace, monospace';
            ctx.fillText('ROT NACH LINKS', 290, 45);
            ctx.fillText('BLAU NACH RECHTS', 990, 45);

            const itemColor = item.type === 'red' ? COLORS.red : COLORS.blue;
            ctx.shadowColor = itemColor; ctx.shadowBlur = 28;
            ctx.fillStyle = itemColor;
            ctx.beginPath(); ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,.42)';
            ctx.beginPath(); ctx.arc(item.x - 10, item.y - 11, 8, 0, Math.PI * 2); ctx.fill();

            Object.entries(baskets).forEach(([type, basket]) => {
                const color = type === 'red' ? COLORS.red : COLORS.blue;
                ctx.fillStyle = COLORS.panel;
                ctx.fillRect(basket.x, basket.y, basket.width, basket.height);
                ctx.strokeStyle = color; ctx.lineWidth = 4;
                ctx.strokeRect(basket.x, basket.y, basket.width, basket.height);
                for (let x = basket.x + 25; x < basket.x + basket.width; x += 48) {
                    ctx.beginPath(); ctx.moveTo(x, basket.y + 3); ctx.lineTo(x + 25, basket.y + basket.height - 3); ctx.stroke();
                }
                ctx.fillStyle = color; ctx.font = '900 18px ui-monospace, monospace';
                ctx.fillText(type === 'red' ? 'ROT' : 'BLAU', basket.x + basket.width / 2, basket.y + 52);
            });

            ctx.fillStyle = COLORS.white;
            ctx.font = '800 18px ui-monospace, monospace';
            ctx.fillText(`SORTIERT: ${sorted}`, 640, 555);
            ctx.fillStyle = errors === 0 ? COLORS.lime : errors === 1 ? '#ffca59' : COLORS.red;
            ctx.fillText(`FEHLER: ${'●'.repeat(errors)}${'○'.repeat(3 - errors)}`, 640, 590);

            if (feedbackTimer > 0) {
                ctx.globalAlpha = Math.min(1, feedbackTimer * 3);
                ctx.fillStyle = feedback.startsWith('+') ? COLORS.lime : COLORS.red;
                ctx.font = '900 25px ui-monospace, monospace';
                ctx.fillText(feedback, 640, 120);
                ctx.globalAlpha = 1;
            }
            ctx.textAlign = 'start';
        }
    };
}

createSorterGame.help = '← / A und → / D: Lenken · Klick: Seite wählen';
