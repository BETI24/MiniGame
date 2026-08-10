const STORAGE_KEY = 'pixel-arcade-highscores-v1';
const GAME_IDS = ['runner', 'clicker', 'sorter'];

export class ScoreStore {
    constructor() {
        this.scores = this.load();
    }

    load() {
        const defaults = Object.fromEntries(GAME_IDS.map((id) => [id, 0]));
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            for (const id of GAME_IDS) {
                const value = Number(saved[id]);
                if (Number.isFinite(value) && value >= 0) defaults[id] = Math.floor(value);
            }
        } catch {
            // LocalStorage may be disabled. The in-memory defaults keep the arcade usable.
        }
        return defaults;
    }

    get(gameId) {
        return this.scores[gameId] ?? 0;
    }

    save(gameId, score) {
        const normalized = Math.max(0, Math.floor(score));
        const isNew = normalized > this.get(gameId);
        if (!isNew) return false;

        this.scores[gameId] = normalized;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scores));
        } catch {
            // Scores continue to work for this tab when persistent storage is unavailable.
        }
        return true;
    }
}
