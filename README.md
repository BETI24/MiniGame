# Pixel Arcade

Ein modulares, browserbasiertes Minispiel-Paket mit drei Canvas-Spielen:

- **Neon Runner:** Springen, ausweichen und möglichst lange überleben
- **Turbo Mash:** A und D innerhalb von zehn Sekunden abwechselnd drücken
- **Color Sort:** Fallende rote und blaue Objekte in den passenden Korb lenken

## Lokal starten

Das Projekt benötigt keine Installation und keine externen Abhängigkeiten. Da es ES6-Module verwendet, sollte es über einen kleinen lokalen HTTP-Server geöffnet werden:

```powershell
python -m http.server 8080
```

Danach `http://localhost:8080` im Browser öffnen. Alternativ kann direkt der integrierte WebStorm-Webserver verwendet werden.

## Steuerung

- Runner: `Leertaste`, `W`, `Pfeil hoch` oder Mausklick
- Clicker: `A` und `D` abwechselnd oder die Canvas-Buttons anklicken
- Sorter: `A`/`D`, `Pfeil links`/`Pfeil rechts` oder eine Bildschirmhälfte anklicken
- In allen Spielen: `Esc` für das Hauptmenü

Highscores werden automatisch im `localStorage` des Browsers gespeichert.
