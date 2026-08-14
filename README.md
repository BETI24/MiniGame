# Nexus Game Hub 🕹️✨

Ein modularer, moderner und browserbasierter Gaming-Hub im Cyberpunk- und Glassmorphism-Design mit über 20 Mini- und Arcade-Spielen. Das Projekt läuft vollständig ohne externe Bibliotheken oder Frameworks (Vanilla JavaScript, HTML5 Canvas & CSS3).

---

## 🌟 Features

- **🎮 Modulare Plugin-Architektur:** Jedes Spiel ist ein isoliertes Modul mit eigenem Lebenszyklus (`init` & `destroy`). Neue Spiele können per Plug-and-Play hinzugefügt werden.
- **✨ Cyberpunk & Glassmorphism UI:** Dynamische Hintergrund-Lichteffekte (Ambient Orbs), flüssige Conic-Gradient-Hovereffekte, animierte Raster und ansprechende Micro-Interactions.
- **🔍 Filter- & Sortiersystem:** 
  - Tag-basierte Filterung (z. B. *Action*, *Arcade*, *Casino*, *Strategie*, *Puzzle*).
  - Schnellsuche und Sortierung (Standard, A–Z, Z–A, Beliebtheit/Tags).
  - Casino-Modus ein-/ausblendbar ("Hide Casino").
- **🏆 Persistente Highscores:** Rekorde werden automatisch über den zentralen `HighscoreService` im `localStorage` des Browsers gesichert.
- **⚡ Zero Dependencies:** Keine NPM-Pakete, kein Build-Schritt erforderlich – direkt lauffähig.

---

## 🕹️ Spiele-Übersicht

| Kategorie | Spiele | Beschreibung |
| :--- | :--- | :--- |
| **Arcade & Reflexe** | **Neon Clicker** | Reaktionsschnelles Anklicken erscheinender Neon-Orbs gegen die Zeit. |
| | **Shape Dodger** | Schnelles Ausweichen vor herabfallenden Hindernissen. |
| | **Block Buster** | Retro-Brick-Breaker mit Power-Ups und dynamischer Ballphysik. |
| | **Neon Serpent / Snake** | Klassisches Snake-Gameplay im modernen Leucht-Design. |
| | **Neon Flail** | Physikbasierter Action-Brawler mit schwingendem Flegel. |
| | **Prisma Clix** | Klick-basiertes Farb- und Timing-Spiel. |
| **Action & Survival** | **Survival Royale** | 2D-Battle-Royale mit KI-Gegnern, Loot, Waffen und schrumpfender Zone. |
| | **Zombies** | Top-Down Wave-Survival gegen Zombiehorden. |
| | **Neon Swarm** | Twin-Stick-Shooter gegen immer dichtere Gegnerwellen. |
| | **Cell Arena** | Agario-inspiriertes Fressen-und-Wachsen in einer Zelle-Arena. |
| | **SurvivClone** | Top-Down Survival-Shooter. |
| **Casino & Risiko** | **Blackjack** | Klassisches Kartenspiel gegen den Dealer. |
| | **Crash** | Multiplikator-Glücksspiel: Rechtzeitig aussteigen, bevor der Kurs crasht. |
| | **Mines** | Minenfeld-Aufdecken mit steigendem Multiplikator. |
| | **Plinko** | Physikalischer Kugel-Drop über Pins in Multiplikator-Fächer. |
| | **Slot Machine & Jackpot** | Klassische Spielautomaten mit Walzen und Gewinnlinien. |
| | **Craps** | Authentisches Würfelspiel mit diversen Wettfeldern. |
| **Strategie & Puzzle**| **Prisma Defense** | Taktisches Tower-Defense mit Farbabstimmung und Upgrades. |
| | **Island Conquest** | Runden- / Echtzeit-Strategie zur Übernahme feindlicher Inseln. |
| | **Forest Frenzy** | Reaktions- und Management-Puzzle. |
| | **Quick Thinker** | Logik- und Mathe-Rätsel mit integriertem Rule-Generator und Solver. |
| | **MyClank** | Deck-Building & Dungeon-Crawler Minispiel. |

---

## 🚀 Lokales Starten

Da das Projekt native ES6-Module (`import`/`export`) verwendet, wird ein lokaler HTTP-Server benötigt (direktes Öffnen über `file://` wird von den meisten Browsern aus Sicherheitsgründen blockiert).

### Option 1: Python HTTP-Server (empfohlen)
```powershell
python -m http.server 8080
```
Anschließend im Browser `http://localhost:8080` öffnen.

### Option 2: WebStorm / VS Code
- **WebStorm:** Rechtsklick auf `index.html` ➔ *Open in Browser*.
- **VS Code:** Erweiterung *Live Server* aktivieren und auf `index.html` ➔ *Open with Live Server*.

### Option 3: Node.js `npx serve`
```powershell
npx serve .
```

---

## 📁 Projektstruktur

```
MiniGame/
├── index.html              # Startseite mit App-Root Container
├── style.css               # Globales Design-System, Ambient-Effekte & Komponenten
├── js/
│   ├── main.js             # Einstiegspunkt & App-Initialisierung
│   ├── core/
│   │   ├── Router.js       # Client-seitiger Router (Hub <-> Game)
│   │   ├── GameRegistry.js # Zentrale Registrierung aller Spielmodule
│   │   └── Services.js     # Shared Services (Highscore-Storage etc.)
│   ├── ui/
│   │   ├── HubView.js      # Hauptmenü mit Grid, Hero, Filtern & Tags
│   │   └── GameWrapper.js  # Wrapper mit Zurück-Button & Lifecycle-Cleanup
│   ├── games/              # Alle eigenständigen Spiele-Module
│   └── assets/             # Bilder, Icons und Sprites
└── README.md
```

---

## ➕ Neues Spiel hinzufügen

Dank der modularen Architektur ist das Hinzufügen neuer Spiele in 2 Schritten erledigt:

1. **Neues Spielmodul erstellen** (`js/games/MeinNeuesSpiel.js`):
   ```javascript
   export default {
       manifest: {
           id: 'mein-neues-spiel',
           name: 'Mein Neues Spiel',
           description: 'Kurze Beschreibung des Spielprinzips.',
           icon: '🎮',
           tags: ['Arcade', 'Action']
       },
       init: (container, services) => {
           // Spiel-DOM im container aufbauen
           // z. B. Canvas erstellen oder Buttons anhängen
           
           // Highscore abrufen:
           const highscore = services.highscores.getHighscore('mein-neues-spiel');

           return {
               destroy: () => {
                   // Aufräumen: Animation-Frames stoppen, Intervalle & Event-Listener leeren
               }
           };
       }
   };
   ```

2. **In `js/core/GameRegistry.js` registrieren:**
   ```javascript
   import MeinNeuesSpiel from "../games/MeinNeuesSpiel.js";

   export const GameRegistry = [
       // ... bestehende Spiele
       MeinNeuesSpiel
   ];
   ```

---

## 🎯 Steuerung & Bedienung

- **Im Hub:** Klick auf eine Spielkarte zum Starten. Über die Filter-Leiste oben können Genres ausgewählt oder Spiele gesucht werden.
- **Im Spiel:** Button **"Zurück zum Hub"** oben rechts bringt dich jederzeit zurück ins Hauptmenü und pausiert/beendet das aktuelle Spiel sauber.
- **Highscores:** Werden nach Rundenende automatisch gespeichert, sobald ein neuer persönlicher Rekord aufgestellt wird.
