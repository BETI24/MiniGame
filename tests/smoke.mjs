import assert from 'node:assert/strict';
import { createRunnerGame } from '../js/games/RunnerGame.js';
import { createClickerGame } from '../js/games/ClickerGame.js';
import { createSorterGame } from '../js/games/SorterGame.js';

const input = {
    queuedKeys: [],
    wasPressed: () => false,
    isDown: () => false,
    takePointerPresses: () => [],
    takeKeyPresses() {
        const presses = this.queuedKeys;
        this.queuedKeys = [];
        return presses;
    }
};

function simulate(factory, steps, beforeStep) {
    let result = null;
    const game = factory({
        width: 1280,
        height: 640,
        input,
        setHUD() {},
        end(score, message) { result = { score, message }; }
    });
    game.init();
    for (let step = 0; step < steps && !result; step += 1) {
        beforeStep?.(step);
        game.update(0.1);
    }
    return result;
}

simulate(createRunnerGame, 20);
const clickerResult = simulate(createClickerGame, 110, (step) => {
    input.queuedKeys = [step % 2 === 0 ? 'KeyA' : 'KeyD'];
});
simulate(createSorterGame, 120);

assert.ok(clickerResult, 'Clicker muss nach zehn Sekunden enden.');
assert.ok(clickerResult.score > 0, 'Gültige A/D-Folgen müssen Punkte erzeugen.');
console.log('Smoke-Tests für alle Spielmodule bestanden.');
