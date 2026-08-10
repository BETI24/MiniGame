import { GameRegistry } from '../core/GameRegistry.js';
import { GameWrapper } from './GameWrapper.js';

export class HubView {
    constructor(root, router) {
        this.root = root;
        this.router = router;
        this.render();
    }

    render() {
        const container = document.createElement('div');
        container.className = 'hub-container';

        const header = document.createElement('div');
        header.className = 'hub-header';
        header.innerHTML = `
            <h1>Nexus Hub</h1>
            <p>Wähle ein Modul, um das System zu starten.</p>
        `;

        const grid = document.createElement('div');
        grid.className = 'game-grid';

        GameRegistry.forEach(gameModule => {
            const card = this.createGameCard(gameModule);
            grid.appendChild(card);
        });

        container.appendChild(header);
        container.appendChild(grid);
        this.root.appendChild(container);
    }

    createGameCard(gameModule) {
        const manifest = gameModule.manifest;
        const card = document.createElement('div');
        card.className = 'game-card glass-panel';

        const tagsHtml = manifest.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

        card.innerHTML = `
            <div class="game-icon">${manifest.icon}</div>
            <div class="game-info">
                <h2>${manifest.name}</h2>
                <p>${manifest.description}</p>
            </div>
            <div class="tags">${tagsHtml}</div>
        `;

        // Klick auf die Karte startet das Spiel über den Router
        card.addEventListener('click', () => {
            this.router.navigate((root, router) => new GameWrapper(root, router, gameModule));
        });

        return card;
    }

    destroy() {
        // Hier gibt es keine Events auf window/document Ebene aufzuräumen.
        // Der DOM-Inhalt wird vom Router gelöscht.
    }
}