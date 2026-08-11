import { GameRegistry } from '../core/GameRegistry.js';
import { GameWrapper } from './GameWrapper.js';
import { services } from '../core/Services.js';

export class HubView {
    constructor(root, router) {
        this.root = root;
        this.router = router;
        this.gridContainer = null;
        this.injectStyles();
        this.render();
    }

    injectStyles() {
        if (document.getElementById('hub-view-dynamic-styles')) return;
        const styleEl = document.createElement('style');
        styleEl.id = 'hub-view-dynamic-styles';
        styleEl.innerHTML = `
            .game-card {
                position: relative;
                border-radius: 16px;
                padding: 2px;
                /* Saubere weiße Standard-Border im Ruhezustand */
                background: rgba(255, 255, 255, 0.25);
                overflow: hidden;
                transition: transform 0.3s ease, background 0.3s ease;
                cursor: pointer;
            }

            /* Container für den animierten Dreh-Effekt */
            .game-card::before {
                content: '';
                position: absolute;
                top: -150%;
                left: -150%;
                right: -150%;
                bottom: -150%;
                background: conic-gradient(from 0deg, #00ffff, #ff00ff, #7928ca, #0070f3, #00ffff);
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 0;
            }

            .game-card:hover::before {
                opacity: 1;
                /* Startet kurz schnell (0.6s) und geht dann in eine flüssige, dauerhafte Rotation (3s) über */
                animation: borderSpinStart 0.6s cubic-bezier(0, 0.8, 0.2, 1) 1, borderRotate 3s linear 0.6s infinite;
            }

            @keyframes borderSpinStart {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @keyframes borderRotate {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Innerer Bereich deckt das Innere ab, sodass nur der 2px Rand leuchtet */
            .game-card .card-inner {
                position: relative;
                z-index: 1;
                border-radius: 14px;
                background: #12121a;
                width: 100%;
                height: 100%;
                box-sizing: border-box;
                overflow: hidden;
            }

            .game-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 30px rgba(0, 255, 255, 0.15);
            }
        `;
        document.head.appendChild(styleEl);
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

        const totalGames = String(GameRegistry.length).padStart(2, '0');

        let globalRecord = 0;
        GameRegistry.forEach(game => {
            globalRecord += services.highscores.getHighscore(game.manifest.id) || 0;
        });

        const formattedRecord = globalRecord.toLocaleString('de-DE');

        const hero = document.createElement('div');
        hero.className = 'hero-section';
        hero.innerHTML = `
            <div class="hero-content">
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

                <div class="hero-right">
                    <div class="status-panel glass-panel">
                        <div class="status-header">
                            <div class="status-dot"></div>
                            <span>System Online</span>
                        </div>
                        <div class="status-stats">
                            <div class="stat-item">
                                <span class="stat-label">Aktive Module</span>
                                <span class="stat-value">${totalGames}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Global Record</span>
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