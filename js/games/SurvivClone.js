import { SurvivGame } from './surviv/SurvivGame.js';

export const manifest = {
    id: 'surviv-clone',
    name: 'Zurviv Zone',
    description: 'Top-down survival sandbox inspired by classic browser battle royale gameplay.',
    tags: ['Shooter', 'Action'],
    imageUrl: "js/assets/images/ZurvivalZone.png",
    
};

export function init(container, services) {
    const game = new SurvivGame(container, services);
    game.start();
    return game;
}

export default { manifest, init };
