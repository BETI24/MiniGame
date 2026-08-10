import { services } from '../core/Services.js';
import { HubView } from './HubView.js';

export class GameWrapper {
    constructor(root, router, gameModule) {
        this.root = root;
        this.router = router;
        this.gameModule = gameModule;
        this.gameInstance = null;
        this.render();
    }

    render() {
        const wrapper = document.createElement('div');
        wrapper.className = 'game-wrapper';

        const toolbar = document.createElement('div');
        toolbar.className = 'game-toolbar glass-panel';

        const title = document.createElement('h3');
        title.innerText = this.gameModule.manifest.name;

        const backBtn = document.createElement('button');
        backBtn.className = 'btn-back';
        backBtn.innerText = 'Zurück zum Hub';
        backBtn.addEventListener('click', () => {
            this.router.navigate((root, router) => new HubView(root, router));
        });

        toolbar.appendChild(title);
        toolbar.appendChild(backBtn);

        const container = document.createElement('div');
        container.className = 'game-container';

        wrapper.appendChild(toolbar);
        wrapper.appendChild(container);
        this.root.appendChild(wrapper);

        // Spiel im isolierten Container starten und Services übergeben
        this.gameInstance = this.gameModule.init(container, services);
    }

    destroy() {
        // 1. Spiel-spezifische Ressourcen (Loops, Events) aufräumen
        if (this.gameInstance && typeof this.gameInstance.destroy === 'function') {
            this.gameInstance.destroy();
        }
        // Der DOM wird danach vom Router geleert.
    }
}