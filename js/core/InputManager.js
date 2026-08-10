export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.down = new Set();
        this.pressed = new Set();
        this.keyPresses = [];
        this.pointerPresses = [];

        this.onKeyDown = (event) => {
            const code = event.code;
            if (this.isGameKey(code)) event.preventDefault();
            if (!this.down.has(code)) {
                this.pressed.add(code);
                this.keyPresses.push(code);
            }
            this.down.add(code);
        };
        this.onKeyUp = (event) => {
            if (this.isGameKey(event.code)) event.preventDefault();
            this.down.delete(event.code);
        };
        this.onPointerDown = (event) => {
            const rect = this.canvas.getBoundingClientRect();
            this.pointerPresses.push({
                x: (event.clientX - rect.left) * (this.canvas.width / rect.width),
                y: (event.clientY - rect.top) * (this.canvas.height / rect.height)
            });
            this.canvas.focus({ preventScroll: true });
        };
        this.onBlur = () => this.down.clear();

        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.onBlur);
        canvas.addEventListener('pointerdown', this.onPointerDown);
    }

    isGameKey(code) {
        return ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(code);
    }

    isDown(...codes) {
        return codes.some((code) => this.down.has(code));
    }

    wasPressed(...codes) {
        return codes.some((code) => this.pressed.has(code));
    }

    takePointerPresses() {
        const presses = this.pointerPresses;
        this.pointerPresses = [];
        return presses;
    }

    takeKeyPresses() {
        const presses = this.keyPresses;
        this.keyPresses = [];
        return presses;
    }

    endFrame() {
        this.pressed.clear();
        this.keyPresses = [];
        this.pointerPresses = [];
    }

    reset() {
        this.down.clear();
        this.pressed.clear();
        this.keyPresses = [];
        this.pointerPresses = [];
    }
}
