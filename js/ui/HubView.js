import { GameRegistry } from '../core/GameRegistry.js';
import { GameWrapper } from './GameWrapper.js';
import { services } from '../core/Services.js';

export class HubView {
    constructor(root, router) {
        this.root = root;
        this.router = router;
        this.gridContainer = null;
        this.render();
    }

    render() {
        const container = document.createElement('div');
        container.className = 'hub-container';

        const hero = document.createElement('div');
        hero.className = 'hero-section';
        hero.innerHTML = `
            <h1>Nexus</h1>
            <p>Wähle ein Modul aus oder suche nach bestimmten Tags und Spielen, um das System zu starten.</p>
            <div class="search-container">
                <span class="search-icon">🔍</span>
                <input type="text" class="search-input" placeholder="Spiele oder Tags suchen..." aria-label="Spiele suchen">
            </div>
        `;

        this.gridContainer = document.createElement('div');
        this.gridContainer.className = 'game-grid';

        const searchInput = hero.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => {
            this.renderGrid(e.target.value);
        });

        container.appendChild(hero);
        container.appendChild(this.gridContainer);
        this.root.appendChild(container);

        this.renderGrid('');
    }

    renderGrid(searchQuery) {
        this.gridContainer.innerHTML = '';
        const query = searchQuery.toLowerCase().trim();

        const filteredGames = GameRegistry.filter(gameModule => {
            const manifest = gameModule.manifest;
            const inName = manifest.name.toLowerCase().includes(query);
            const inDesc = manifest.description.toLowerCase().includes(query);
            const inTags = manifest.tags.some(tag => tag.toLowerCase().includes(query));

            return inName || inDesc || inTags;
        });

        if (filteredGames.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerText = 'Keine Module für diese Suche gefunden.';
            this.gridContainer.appendChild(noResults);
            return;
        }

        filteredGames.forEach(gameModule => {
            const card = this.createGameCard(gameModule);
            this.gridContainer.appendChild(card);
        });
    }

    createGameCard(gameModule) {
        const manifest = gameModule.manifest;
        const card = document.createElement('div');
        card.className = 'game-card glass-panel';

        // Highscore aus dem Service laden
        const highscore = services.highscores.getHighscore(manifest.id);

        const tagsHtml = manifest.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

        card.innerHTML = `
            <div class="game-icon">${manifest.icon}</div>
            <div class="game-info">
                <div class="title-row">
                    <h2>${manifest.name}</h2>
                    <span class="highscore-badge">🏆 ${highscore}</span>
                </div>
                <p>${manifest.description}</p>
            </div>
            <div class="tags">${tagsHtml}</div>
        `;

        card.addEventListener('click', () => {
            this.router.navigate((root, router) => new GameWrapper(root, router, gameModule));
        });

        return card;
    }

    destroy() {
    }
}