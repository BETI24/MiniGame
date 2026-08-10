const COLORS = { background: '#0b0b18', panel: '#15162a', purple: '#a47cff', cyan: '#41e9ff', lime: '#c9ff59', pink: '#ff5277', muted: '#7e849e', white: '#f5f7ff' };

export function createClickerGame(api) {
    const duration = 10;
    const targetPresses = 50;
    const buttonRects = {
        KeyA: { x: 260, y: 300, width: 280, height: 190 },
        KeyD: { x: 740, y: 300, width: 280, height: 190 }
    };
    let timeLeft = duration;
    let presses = 0;
    let expected = 'KeyA';
    let flash = 0;
    let lastKey = null;

    function register(code) {
        if (code !== expected) return;
        presses += 1;
        lastKey = code;
        expected = code === 'KeyA' ? 'KeyD' : 'KeyA';
        flash = 0.12;
    }

    function hitTest(point, rect) {
        return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
    }

    return {
        init() {
            api.setHUD(0, 'Zeit 10.0 s');
        },

        update(delta) {
            timeLeft = Math.max(0, timeLeft - delta);
            flash = Math.max(0, flash - delta);

            for (const code of api.input.takeKeyPresses()) {
                if (code === 'KeyA' || code === 'KeyD') register(code);
            }
            for (const point of api.input.takePointerPresses()) {
                if (hitTest(point, buttonRects.KeyA)) register('KeyA');
                else if (hitTest(point, buttonRects.KeyD)) register('KeyD');
            }

            const score = presses * 100;
            api.setHUD(score, `Zeit ${timeLeft.toFixed(1)} s`);
            if (timeLeft <= 0) api.end(score, presses >= targetPresses ? 'Turbo!' : 'Zeit vorbei');
        },

        render(ctx) {
            ctx.fillStyle = COLORS.background;
            ctx.fillRect(0, 0, api.width, api.height);

            const glow = ctx.createRadialGradient(640, 350, 40, 640, 350, 520);
            glow.addColorStop(0, 'rgba(107,74,190,.18)');
            glow.addColorStop(1, 'rgba(10,10,24,0)');
            ctx.fillStyle = glow; ctx.fillRect(0, 0, api.width, api.height);

            ctx.textAlign = 'center';
            ctx.fillStyle = COLORS.muted;
            ctx.font = '700 17px ui-monospace, monospace';
            ctx.fillText('ABWECHSELND DRÜCKEN', 640, 58);
            ctx.fillStyle = COLORS.white;
            ctx.font = '900 48px ui-sans-serif, system-ui';
            ctx.fillText(`${timeLeft.toFixed(1)} SEKUNDEN`, 640, 112);

            const progress = Math.min(1, presses / targetPresses);
            ctx.fillStyle = '#1d2034'; ctx.fillRect(180, 155, 920, 42);
            const gradient = ctx.createLinearGradient(180, 0, 1100, 0);
            gradient.addColorStop(0, COLORS.purple); gradient.addColorStop(1, COLORS.cyan);
            ctx.fillStyle = gradient; ctx.fillRect(180, 155, 920 * progress, 42);
            ctx.strokeStyle = '#343951'; ctx.lineWidth = 2; ctx.strokeRect(180, 155, 920, 42);
            ctx.fillStyle = COLORS.white; ctx.font = '800 18px ui-monospace, monospace';
            ctx.fillText(`${presses} / ${targetPresses}  POWER`, 640, 183);

            Object.entries(buttonRects).forEach(([code, rect]) => {
                const active = code === expected;
                const hit = code === lastKey && flash > 0;
                ctx.shadowColor = active ? COLORS.cyan : COLORS.purple;
                ctx.shadowBlur = active ? 25 : 0;
                ctx.fillStyle = hit ? COLORS.lime : active ? '#1d3951' : COLORS.panel;
                ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
                ctx.shadowBlur = 0;
                ctx.strokeStyle = active ? COLORS.cyan : '#3c3e59';
                ctx.lineWidth = active ? 5 : 2;
                ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
                ctx.fillStyle = hit ? '#10150b' : active ? COLORS.cyan : COLORS.muted;
                ctx.font = '900 92px ui-monospace, monospace';
                ctx.fillText(code === 'KeyA' ? 'A' : 'D', rect.x + rect.width / 2, rect.y + 125);
                ctx.font = '700 14px ui-monospace, monospace';
                ctx.fillText(active ? 'JETZT!' : 'WARTEN', rect.x + rect.width / 2, rect.y + 165);
            });

            ctx.fillStyle = COLORS.muted;
            ctx.font = '15px ui-monospace, monospace';
            ctx.fillText('Tastatur oder Buttons anklicken', 640, 555);
            ctx.fillStyle = presses >= targetPresses ? COLORS.lime : COLORS.pink;
            ctx.font = '800 20px ui-monospace, monospace';
            ctx.fillText(`${presses * 100} PUNKTE`, 640, 595);
            ctx.textAlign = 'start';
        }
    };
}

createClickerGame.help = 'A und D abwechselnd / Buttons anklicken';
