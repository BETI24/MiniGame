import { InputManager } from './InputManager.js';
import { ScoreStore } from './ScoreStore.js';

export class GameManager {
    constructor(elements, gameFactories) {
        this.el = elements;
        this.gameFactories = gameFactories;
        this.ctx = elements.canvas.getContext('2d');
        this.input = new InputManager(elements.canvas);
        this.scores = new ScoreStore();
        this.currentGame = null;
        this.currentGameId = null;
        this.state = 'menu';
        this.lastTime = 0;
        this.frameId = null;

        this.handleFrame = this.handleFrame.bind(this);
        this.bindUI();
        this.refreshHighscores();
        this.showMenu();
    }

    bindUI() {
        this.el.gameGrid.addEventListener('click', (event) => {
            const button = event.target.closest('[data-game]');
            if (button) this.startGame(button.dataset.game);
        });
        this.el.backButton.addEventListener('click', () => this.showMenu());
        this.el.menuButton.addEventListener('click', () => this.showMenu());
        this.el.restartButton.addEventListener('click', () => this.startGame(this.currentGameId));
        this.el.brandLink.addEventListener('click', (event) => {
            event.preventDefault();
            this.showMenu();
        });
        window.addEventListener('keydown', (event) => {
            if (event.code === 'Escape' && this.state !== 'menu') this.showMenu();
        });
    }

    showOnly(name) {
        this.el.menuScreen.classList.toggle('is-hidden', name !== 'menu');
        this.el.gameScreen.classList.toggle('is-hidden', name !== 'game');
        this.el.gameoverScreen.classList.toggle('is-hidden', name !== 'gameover');
    }

    showMenu() {
        this.stopLoop();
        this.currentGame?.destroy?.();
        this.currentGame = null;
        this.state = 'menu';
        this.input.reset();
        this.showOnly('menu');
        this.el.backButton.classList.add('is-hidden');
        this.el.hud.classList.add('is-hidden');
        this.refreshHighscores();
    }

    startGame(gameId) {
        const createGame = this.gameFactories[gameId];
        if (!createGame) return;

        this.stopLoop();
        this.currentGame?.destroy?.();
        this.currentGameId = gameId;
        this.state = 'playing';
        this.input.reset();
        this.showOnly('game');
        this.el.backButton.classList.remove('is-hidden');
        this.el.hud.classList.remove('is-hidden');
        this.el.gameHelp.textContent = createGame.help;

        const gameApi = {
            width: this.el.canvas.width,
            height: this.el.canvas.height,
            input: this.input,
            setHUD: (score, extra = '') => this.setHUD(score, extra),
            end: (score, message) => this.endGame(score, message)
        };
        this.currentGame = createGame(gameApi);
        this.currentGame.init();
        this.el.canvas.focus({ preventScroll: true });
        this.lastTime = performance.now();
        this.frameId = requestAnimationFrame(this.handleFrame);
    }

    handleFrame(now) {
        if (this.state !== 'playing' || !this.currentGame) return;
        const delta = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;
        this.currentGame.update(delta);
        this.currentGame.render(this.ctx);
        this.input.endFrame();
        if (this.state === 'playing') this.frameId = requestAnimationFrame(this.handleFrame);
    }

    endGame(score, message = 'Game Over') {
        if (this.state !== 'playing') return;
        this.state = 'gameover';
        this.stopLoop();
        const normalized = Math.max(0, Math.floor(score));
        const isNewHighscore = this.scores.save(this.currentGameId, normalized);
        this.el.resultTitle.textContent = message;
        this.el.resultScore.textContent = normalized.toLocaleString('de-DE');
        this.el.resultKicker.textContent = isNewHighscore ? 'Neuer Highscore!' : 'Runde beendet';
        this.el.resultHighscore.textContent = isNewHighscore
            ? 'Persönliche Bestleistung gespeichert.'
            : `Highscore: ${this.scores.get(this.currentGameId).toLocaleString('de-DE')}`;
        this.showOnly('gameover');
        this.el.hud.classList.add('is-hidden');
        this.refreshHighscores();
    }

    setHUD(score, extra) {
        this.el.hudScore.textContent = Math.max(0, Math.floor(score)).toLocaleString('de-DE');
        this.el.hudExtra.textContent = extra;
    }

    refreshHighscores() {
        document.querySelectorAll('[data-highscore]').forEach((element) => {
            element.textContent = this.scores.get(element.dataset.highscore).toLocaleString('de-DE');
        });
    }

    stopLoop() {
        if (this.frameId !== null) cancelAnimationFrame(this.frameId);
        this.frameId = null;
    }
}
