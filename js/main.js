import { Router } from './core/Router.js';
import { HubView } from './ui/HubView.js';

document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('app-root');
    const appRouter = new Router(rootElement);

    // Startet die Plattform direkt in der Hub-Ansicht
    appRouter.navigate((root, router) => new HubView(root, router));
});