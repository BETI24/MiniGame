export class HighscoreService {
    constructor() {
        this.storageKey = 'nexus_highscores';
    }

    getHighscore(gameId) {
        const scores = JSON.parse(localStorage.getItem(this.storageKey)) || {};
        return scores[gameId] || 0;
    }

    saveHighscore(gameId, score) {
        const currentHigh = this.getHighscore(gameId);
        if (score > currentHigh) {
            const scores = JSON.parse(localStorage.getItem(this.storageKey)) || {};
            scores[gameId] = score;
            localStorage.setItem(this.storageKey, JSON.stringify(scores));
            return true; // Neuer Rekord
        }
        return false; // Kein Rekord
    }
}

// Zentrale Service-Instanz, die an Spiele weitergegeben wird
export const services = {
    highscores: new HighscoreService()
};