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

        // Globale Ambient-Effekte
        const ambientBg = document.createElement('div');
        ambientBg.className = 'ambient-background';
        ambientBg.innerHTML = `
            <div class="ambient-orb orb-1"></div>
            <div class="ambient-orb orb-2"></div>
            <div class="ambient-orb orb-3"></div>
            <div class="ambient-orb orb-4"></div>
            <div class="cyber-grid-global"></div>
        `;
        container.appendChild(ambientBg);

        // --- DYNAMISCHE WERTE BERECHNEN ---

        // 1. Anzahl der Spiele aus der Registry auslesen (z.B. "04")
        const totalGames = String(GameRegistry.length).padStart(2, '0');

        // 2. Globalen Highscore aus allen Spielen zusammenrechnen
        let globalRecord = 0;
        GameRegistry.forEach(game => {
            globalRecord += services.highscores.getHighscore(game.manifest.id) || 0;
        });

        // Zahl formatieren (macht aus 24080 z.B. 24.080)
        const formattedRecord = globalRecord.toLocaleString('de-DE');


        const hero = document.createElement('div');
        hero.className = 'hero-section';
        hero.innerHTML = `
            <div class="hero-content">
                <!-- Linke Seite: Text und Suche -->
                <div class="hero-left">
                    <div class="hero-text">
                        <p class="eyebrow">Nexus System · Arcade Hub</p>
                        <h1>Enter the<br><span>Nexus.</span></h1>
                        <p class="hero-desc">Keine Ladezeiten, pure Action. Starte ein Minispiel, setze deinen Einsatz und knacke den Highscore.</p>
                    </div>
                    <div class="search-container">
                        <span class="search-icon">🔍</span>
                        <input type="text" class="search-input" placeholder="Spiele oder Tags suchen..." aria-label="Spiele suchen">
                    </div>
                </div>

                <!-- Rechte Seite: Dynamisches System Status Panel -->
                <div class="hero-right">
                    <div class="status-panel glass-panel">
                        <div class="status-header">
                            <div class="status-dot"></div>
                            <span>System Online</span>
                        </div>
                        <div class="status-stats">
                            <div class="stat-item">
                                <span class="stat-label">Aktive Module</span>
                                <!-- Hier wird die dynamische Anzahl eingesetzt -->
                                <span class="stat-value">${totalGames}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Global Record</span>
                                <!-- Hier wird der berechnete Gesamt-Highscore eingesetzt -->
                                <span class="stat-value text-cyan">$${formattedRecord}</span>
                            </div>
                        </div>
                        <div class="panel-ring"></div>
                    </div>
                </div>
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
        card.className = 'game-card';

        const highscore = services.highscores.getHighscore(manifest.id) || 0;
        const tagsHtml = manifest.tags.map(tag => `<span class="card-tag">${tag.toUpperCase()}</span>`).join('');
        const bgStyle = manifest.imageUrl ? `background-image: url('${manifest.imageUrl}');` : `background: #1a1a24;`;

        const titleParts = manifest.name.split(' ');
        const formattedTitle = titleParts.length > 1
            ? `${titleParts[0]} <span class="text-cyan">${titleParts.slice(1).join(' ')}</span>`
            : titleParts[0];

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-bg" style="${bgStyle}"></div>
                <div class="card-overlay"></div>
                <div class="card-content">
                    <div class="card-top">
                        <h2>${formattedTitle.toUpperCase()}</h2>
                        <p class="card-desc">${manifest.description}</p>
                        <div class="card-highscore">
                            <span class="trophy">🏆</span> $${highscore}
                        </div>
                    </div>
                    <div class="card-bottom">
                        <div class="card-tags">${tagsHtml}</div>
                        <button class="play-btn">PLAY NOW &gt;</button>
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            this.router.navigate((root, router) => new GameWrapper(root, router, gameModule));
        });

        return card;
    }

    destroy() {
    }
}