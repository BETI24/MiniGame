import { GameRegistry } from '../core/GameRegistry.js';
import { GameWrapper } from './GameWrapper.js';
import { services } from '../core/Services.js';

export class HubView {
    constructor(root, router) {
        this.root = root;
        this.router = router;
        this.gridContainer = null;
        this.hideCasino = false;
        this.selectedTag = null;
        this.sortMode = 'standard';
        this.tagsExpanded = false;
        this.heroStats = { moduleCount: null, recordValue: null };
        this.injectStyles();
        this.render();
    }

    getAllTags() {
        const tagSet = new Set();
        GameRegistry.forEach(gameModule => {
            gameModule.manifest.tags.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
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
            .tag-bar {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                justify-content: center;
                margin: 0;
            }
            .controls-row {
                display: flex;
                flex-direction: column;
                gap: 16px;
                max-width: 800px;
                margin: 0 auto 24px auto;
                padding: 0 16px;
            }
            .search-and-sort {
                display: flex;
                gap: 12px;
                width: 100%;
            }
            .search-container {
                flex: 1;
                margin: 0 !important;
            }
            .sort-select {
                background: rgba(20, 20, 30, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #a0a0b0;
                padding: 0 16px;
                border-radius: 12px;
                font-family: inherit;
                font-size: 0.95rem;
                cursor: pointer;
                outline: none;
                backdrop-filter: blur(8px);
                transition: all 0.25s ease;
            }
            .sort-select:hover, .sort-select:focus {
                color: #fff;
                border-color: rgba(0, 255, 255, 0.4);
                box-shadow: 0 0 12px rgba(0, 255, 255, 0.15);
            }
            .sort-select option {
                background: #1a1a24;
                color: #fff;
            }
            .tag-pill {
                background: rgba(20, 20, 30, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #a0a0b0;
                padding: 8px 18px;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: 600;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                cursor: pointer;
                backdrop-filter: blur(8px);
                transition: all 0.25s ease;
            }
            .tag-pill:hover {
                color: #fff;
                border-color: rgba(0, 255, 255, 0.4);
                box-shadow: 0 0 12px rgba(0, 255, 255, 0.15);
            }
            .tag-pill.active {
                background: rgba(0, 255, 255, 0.15);
                color: #00ffff;
                border-color: #00ffff;
                box-shadow: 0 0 16px rgba(0, 255, 255, 0.4), inset 0 0 8px rgba(0, 255, 255, 0.2);
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

        const controlsRow = document.createElement('div');
        controlsRow.className = 'controls-row';

        const searchAndSort = document.createElement('div');
        searchAndSort.className = 'search-and-sort';

        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'search-container sticky-search';
        searchWrapper.innerHTML = `
            <span class="search-icon">🔍</span>
            <input type="text" class="search-input" placeholder="Spiele oder Tags suchen..." aria-label="Spiele suchen">
        `;

        const sortSelect = document.createElement('select');
        sortSelect.className = 'sort-select';
        sortSelect.innerHTML = `
            <option value="standard">Standard</option>
            <option value="alphabetical">Alphabetisch (A-Z)</option>
            <option value="highscore">Nach Highscore</option>
        `;

        searchAndSort.appendChild(searchWrapper);
        searchAndSort.appendChild(sortSelect);

        const searchInput = searchWrapper.querySelector('.search-input');
        
        const tagBar = document.createElement('div');
        tagBar.className = 'tag-bar';
        tagBar.style.transition = 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        tagBar.style.overflow = 'hidden';
        
        const renderTags = () => {
            const oldHeight = tagBar.offsetHeight;
            if (oldHeight > 0) {
                tagBar.style.height = oldHeight + 'px';
            }

            tagBar.innerHTML = '';
            const allTags = this.getAllTags();
            const displayTags = this.tagsExpanded ? allTags : allTags.slice(0, 3);
            
            const createTagBtn = (tagName, isSpecial = false, onClick = null) => {
                const btn = document.createElement('button');
                btn.className = 'tag-pill';
                
                if (!isSpecial && this.selectedTag === tagName) btn.classList.add('active');
                if (isSpecial && tagName === 'ALLE' && !this.selectedTag) btn.classList.add('active');
                
                btn.textContent = tagName;
                btn.addEventListener('click', onClick);
                return btn;
            };

            tagBar.appendChild(createTagBtn('ALLE', true, () => {
                this.selectedTag = null;
                renderTags();
                this.renderGrid(searchInput.value);
            }));

            displayTags.forEach(tag => {
                tagBar.appendChild(createTagBtn(tag, false, () => {
                    this.selectedTag = this.selectedTag === tag ? null : tag;
                    renderTags();
                    this.renderGrid(searchInput.value);
                }));
            });

            if (!this.tagsExpanded && allTags.length > 3) {
                tagBar.appendChild(createTagBtn('+ Mehr', true, () => {
                    this.tagsExpanded = true;
                    renderTags();
                }));
            } else if (this.tagsExpanded && allTags.length > 3) {
                tagBar.appendChild(createTagBtn('- Weniger', true, () => {
                    this.tagsExpanded = false;
                    renderTags();
                }));
            }

            if (oldHeight > 0) {
                // Determine new height
                tagBar.style.height = 'auto';
                const newHeight = tagBar.offsetHeight;
                
                // Revert to old height and force reflow
                tagBar.style.height = oldHeight + 'px';
                tagBar.offsetHeight; 
                
                // Animate to new height
                tagBar.style.height = newHeight + 'px';

                // Fade in pills smoothly
                Array.from(tagBar.children).forEach((child, index) => {
                    child.style.opacity = '0';
                    child.style.transform = 'scale(0.95) translateY(-5px)';
                    child.style.transition = `all 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.02}s`;
                    requestAnimationFrame(() => {
                        child.style.opacity = '1';
                        child.style.transform = 'scale(1) translateY(0)';
                    });
                });

                // Cleanup explicit height after animation completes
                setTimeout(() => {
                    tagBar.style.height = 'auto';
                }, 350);
            }
        };
        renderTags();

        controlsRow.appendChild(searchAndSort);
        controlsRow.appendChild(tagBar);

        searchInput.addEventListener('input', (e) => {
            this.renderGrid(e.target.value);
        });
        sortSelect.addEventListener('change', (e) => {
            this.sortMode = e.target.value;
            this.renderGrid(searchInput.value);
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
        container.appendChild(controlsRow);
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
            if (this.selectedTag && !manifest.tags.includes(this.selectedTag)) {
                return false;
            }
            const inName = manifest.name.toLowerCase().includes(query);
            const inDesc = manifest.description.toLowerCase().includes(query);
            const inTags = manifest.tags.some(tag => tag.toLowerCase().includes(query));

            return inName || inDesc || inTags;
        }).sort((a, b) => {
            if (this.sortMode === 'alphabetical') {
                return a.manifest.name.localeCompare(b.manifest.name);
            }
            if (this.sortMode === 'highscore') {
                const scoreA = services.highscores.getHighscore(a.manifest.id) || 0;
                const scoreB = services.highscores.getHighscore(b.manifest.id) || 0;
                return scoreB - scoreA;
            }
            // default: 'standard'
            const hasImgA = !!a.manifest.imageUrl;
            const hasImgB = !!b.manifest.imageUrl;
            if (hasImgA && !hasImgB) return -1;
            if (!hasImgA && hasImgB) return 1;
            return a.manifest.name.localeCompare(b.manifest.name);
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