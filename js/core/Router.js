export class Router {
    constructor(rootElement) {
        this.root = rootElement;
        this.activeModule = null;
    }

    // Lifecycle (Lebenszyklus): Räumt das alte Modul auf, bevor ein neues geladen wird
    navigate(viewFactoryCallback) {
        if (this.activeModule && typeof this.activeModule.destroy === 'function') {
            this.activeModule.destroy();
        }

        this.root.innerHTML = '';
        this.activeModule = viewFactoryCallback(this.root, this);
    }
}