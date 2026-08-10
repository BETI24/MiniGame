export default {
    manifest: {
        id: 'neon-clicker',
        name: 'Neon Clicker',
        description: 'Klicke auf die erscheinenden Leucht-Orbs, bevor die Zeit abläuft. Teste deine Reaktionszeit.',
        icon: '🎯',
        tags: ['Reflex', 'DOM', 'Speed']
    },
    init: (container, services) => {
        // --- Interner State ---
        let score = 0;
        let timeLeft = 15;
        let timerInterval = null;
        let orbTimeout = null;

        // --- UI Setup ---
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = '100%';

        const uiLayer = document.createElement('div');
        uiLayer.style.position = 'absolute';
        uiLayer.style.top = '20px';
        uiLayer.style.left = '20px';
        uiLayer.style.fontSize = '1.5rem';
        uiLayer.style.fontWeight = 'bold';
        uiLayer.style.textShadow = '0 0 10px #fff';
        container.appendChild(uiLayer);

        const orb = document.createElement('div');
        orb.style.position = 'absolute';
        orb.style.width = '50px';
        orb.style.height = '50px';
        orb.style.borderRadius = '50%';
        orb.style.backgroundColor = '#00d4ff';
        orb.style.boxShadow = '0 0 20px #00d4ff, inset 0 0 10px #fff';
        orb.style.cursor = 'pointer';
        orb.style.transition = 'transform 0.1s';
        orb.style.display = 'none';
        container.appendChild(orb);

        const highscore = services.highscores.getHighscore('neon-clicker');

        // --- Logik ---
        const updateUI = () => {
            uiLayer.innerHTML = `Punkte: ${score} <br> Zeit: ${timeLeft}s <br> <span style="font-size:1rem; color:#8b8b9f;">Highscore: ${highscore}</span>`;
        };

        const moveOrb = () => {
            const maxX = container.clientWidth - 50;
            const maxY = container.clientHeight - 50;
            const randomX = Math.floor(Math.random() * maxX);
            const randomY = Math.floor(Math.random() * maxY);

            orb.style.left = `${randomX}px`;
            orb.style.top = `${randomY}px`;
            orb.style.display = 'block';

            // Verstecke Orb wieder, wenn man zu langsam ist
            clearTimeout(orbTimeout);
            orbTimeout = setTimeout(() => {
                orb.style.display = 'none';
                setTimeout(moveOrb, Math.random() * 500 + 200);
            }, 800);
        };

        const endGame = () => {
            clearInterval(timerInterval);
            clearTimeout(orbTimeout);
            orb.style.display = 'none';
            const isRecord = services.highscores.saveHighscore('neon-clicker', score);
            uiLayer.innerHTML = `Spiel vorbei! Punkte: ${score} ${isRecord ? '(Neuer Rekord!)' : ''}`;
        };

        // --- Events ---
        orb.addEventListener('click', () => {
            score++;
            updateUI();
            orb.style.display = 'none';
            clearTimeout(orbTimeout);
            setTimeout(moveOrb, Math.random() * 300);
        });

        // --- Start ---
        updateUI();
        moveOrb();
        timerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                endGame();
            } else {
                updateUI();
            }
        }, 1000);

        // --- Return API ---
        return {
            // Destroy räumt auf, damit keine Loops weiterlaufen, wenn man zum Hub zurückgeht
            destroy: () => {
                clearInterval(timerInterval);
                clearTimeout(orbTimeout);
            }
        };
    }
};