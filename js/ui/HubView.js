import { GameRegistry } from '../core/GameRegistry.js';
import { GameWrapper } from './GameWrapper.js';

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

        // Hero Sektion mit Suchleiste aufbauen
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

        // Raster (Grid) für die Spielekarten erstellen
        this.gridContainer = document.createElement('div');
        this.gridContainer.className = 'game-grid';

        // Event-Listener für das Suchfeld (löst bei jedem Tastendruck aus)
        const searchInput = hero.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => {
            this.renderGrid(e.target.value);
        });

        container.appendChild(hero);
        container.appendChild(this.gridContainer);
        this.root.appendChild(container);

        // Grid initial mit allen Spielen füllen
        this.renderGrid('');
    }

    // Leert das aktuelle Raster und füllt es basierend auf dem Suchbegriff neu
    renderGrid(searchQuery) {
        this.gridContainer.innerHTML = '';
        const query = searchQuery.toLowerCase().trim();

        // Spiele filtern, wenn der Suchbegriff im Namen, der Beschreibung oder den Tags vorkommt
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

        // Gefilterte Karten in das HTML-Dokument einfügen
        filteredGames.forEach(gameModule => {
            const card = this.createGameCard(gameModule);
            this.gridContainer.appendChild(card);
        });
    }

    // Erstellt ein einzelnes UI-Element (die anklickbare Karte) für ein Spiel
    createGameCard(gameModule) {
        const manifest = gameModule.manifest;
        const card = document.createElement('div');
        card.className = 'game-card glass-panel';

        // Tags dynamisch als HTML zusammenbauen
        const tagsHtml = manifest.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

        card.innerHTML = `
            <div class="game-icon">${manifest.icon}</div>
            <div class="game-info">
                <h2>${manifest.name}</h2>
                <p>${manifest.description}</p>
            </div>
            <div class="tags">${tagsHtml}</div>
        `;

        // Klick auf die Karte übergibt die Kontrolle an den Router, um das Spiel zu starten
        card.addEventListener('click', () => {
            this.router.navigate((root, router) => new GameWrapper(root, router, gameModule));
        });

        return card;
    }

    destroy() {
        // Der DOM-Inhalt wird vom Router automatisch gelöscht, keine manuellen Event-Listener auf window/document aktiv.
    }
}