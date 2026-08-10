import { GameManager } from './js/core/GameManager.js';
import { createRunnerGame } from './js/games/RunnerGame.js';
import { createClickerGame } from './js/games/ClickerGame.js';
import { createSorterGame } from './js/games/SorterGame.js';

const byId = (id) => document.getElementById(id);

const elements = {
    canvas: byId('game-canvas'),
    menuScreen: byId('menu-screen'),
    gameScreen: byId('game-screen'),
    gameoverScreen: byId('gameover-screen'),
    gameGrid: byId('game-grid'),
    backButton: byId('back-button'),
    brandLink: byId('brand-link'),
    hud: byId('hud'),
    hudScore: byId('hud-score'),
    hudExtra: byId('hud-extra'),
    gameHelp: byId('game-help'),
    resultKicker: byId('result-kicker'),
    resultTitle: byId('result-title'),
    resultScore: byId('result-score'),
    resultHighscore: byId('result-highscore'),
    restartButton: byId('restart-button'),
    menuButton: byId('menu-button')
};

const gameFactories = {
    runner: createRunnerGame,
    clicker: createClickerGame,
    sorter: createSorterGame
};

new GameManager(elements, gameFactories);
