import { GameRegistry } from '../core/GameRegistry.js';
import { GameWrapper } from './GameWrapper.js';
import { services } from '../core/Services.js';

export class HubView {
    constructor(root, router) {
        this.root = root;
        this.router = router;
        this.gridContainer = null;
        this.hideCasino = false;
        this.heroStats = { moduleCount: null, recordValue: null };
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
                background: rgba(255, 255, 255, 0.25);
                overflow: hidden;
                transition: transform 0.3s ease, background 0.3s ease;
                cursor: pointer;
            }

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
                                <span class="stat-value stat-active-count">00</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Global Record</span>
                                <span class="stat-value text-cyan stat-global-record">$0</span>
                            </div>
                        </div>
                        <div class="panel-ring"></div>
                    </div>
                </div>
            </div>
        `;

        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'search-container sticky-search';
        searchWrapper.innerHTML = `
            <span class="search-icon">🔍</span>
            <input type="text" class="search-input" placeholder="Spiele oder Tags suchen..." aria-label="Spiele suchen">
        `;

        const searchInput = searchWrapper.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => {
            this.renderGrid(e.target.value);
        });

        this.gridContainer = document.createElement('div');
        this.gridContainer.className = 'game-grid';

        this.heroStats.moduleCount = hero.querySelector('.stat-active-count');
        this.heroStats.recordValue = hero.querySelector('.stat-global-record');

        const heroRight = hero.querySelector('.hero-right');
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-casino-btn';
        toggleBtn.innerText = this.hideCasino ? 'Hier klicken für Spaß' : 'Für Langweiler';
        toggleBtn.setAttribute('aria-pressed', String(this.hideCasino));
        toggleBtn.addEventListener('click', () => {
            this.hideCasino = !this.hideCasino;
            toggleBtn.innerText = this.hideCasino ? 'Hier klicken für Spaß ☀️' : 'Für Langweiler';
            toggleBtn.setAttribute('aria-pressed', String(this.hideCasino));
            this.renderGrid(searchInput.value);
        });

        heroRight.insertBefore(toggleBtn, heroRight.firstChild);

        if (!document.getElementById('toggle-casino-styles')) {
            const s = document.createElement('style');
            s.id = 'toggle-casino-styles';
            s.innerHTML = `
                .toggle-casino-btn {
                    position: fixed;
                    top: 1.5rem;
                    right: 2rem;
                    z-index: 60;
                    background: rgba(20,20,30,0.6);
                    color: var(--text-main);
                    border: 1px solid rgba(255,255,255,0.06);
                    padding: 0.6rem 1rem;
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                    cursor:pointer;
                    font-weight:700;
                    box-shadow: 0 6px 20px rgba(0,212,255,0.12);
                }
                .toggle-casino-btn[aria-pressed="true"] {
                    background: var(--accent-color);
                    color: #0b0b0e;
                    border-color: rgba(0,0,0,0.1);
                }
            `;
            document.head.appendChild(s);
        }

        container.appendChild(hero);
        container.appendChild(searchWrapper);
        container.appendChild(this.gridContainer);
        this.root.appendChild(container);

        this.renderGrid('');
    }

    updateHeroStats(filteredGames) {
        if (!this.heroStats.moduleCount || !this.heroStats.recordValue) return;

        const visibleCount = filteredGames.length;
        let totalRecord = 0;

        filteredGames.forEach(gameModule => {
            totalRecord += services.highscores.getHighscore(gameModule.manifest.id) || 0;
        });

        this.heroStats.moduleCount.textContent = String(visibleCount).padStart(2, '0');
        this.heroStats.recordValue.textContent = `$${totalRecord.toLocaleString('de-DE')}`;
    }

    renderGrid(searchQuery) {
        this.gridContainer.innerHTML = '';
        const query = searchQuery.toLowerCase().trim();

        const filteredGames = GameRegistry.filter(gameModule => {
            const manifest = gameModule.manifest;
            if (this.hideCasino && manifest.tags.some(tag => tag.toLowerCase() === 'casino')) {
                return false;
            }
            const inName = manifest.name.toLowerCase().includes(query);
            const inDesc = manifest.description.toLowerCase().includes(query);
            const inTags = manifest.tags.some(tag => tag.toLowerCase().includes(query));

            return inName || inDesc || inTags;
        });

        this.updateHeroStats(filteredGames);

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