export const FINGER_LABELS = {
  LP: "L. kleiner Finger",
  LR: "L. Ringfinger",
  LM: "L. Mittelfinger",
  LI: "L. Zeigefinger",
  RI: "R. Zeigefinger",
  RM: "R. Mittelfinger",
  RR: "R. Ringfinger",
  RP: "R. kleiner Finger",
  TH: "Daumen"
};

export const KEY_TO_FINGER = {
  "1":"LP","q":"LP","a":"LP","y":"LP",
  "2":"LR","w":"LR","s":"LR","x":"LR",
  "3":"LM","e":"LM","d":"LM","c":"LM",
  "4":"LI","5":"LI","r":"LI","t":"LI","f":"LI","g":"LI","v":"LI","b":"LI",
  "6":"RI","7":"RI","z":"RI","u":"RI","h":"RI","j":"RI","n":"RI","m":"RI",
  "8":"RM","i":"RM","k":"RM",",":"RM",
  "9":"RR","o":"RR","l":"RR",".":"RR",
  "0":"RP","p":"RP","ü":"RP","ö":"RP","ä":"RP","ß":"RP","-":"RP",
  " ":"TH"
};

export const KEYBOARD_ROWS = [
  ["1","2","3","4","5","6","7","8","9","0","ß"],
  ["q","w","e","r","t","z","u","i","o","p","ü"],
  ["a","s","d","f","g","h","j","k","l","ö","ä"],
  ["y","x","c","v","b","n","m",",",".","-"]
];

export const GERMAN_WORDS = [
  "haus","baum","wasser","licht","stadt","morgen","abend","leben","schnell","lernen",
  "tippen","finger","tastatur","denken","schule","arbeit","freund","reise","spiel","runde",
  "fenster","garten","wolke","straße","brücke","zimmer","kaffee","papier","tempo","genau",
  "technik","system","projekt","server","daten","konto","motor","signal","kamera","roboter",
  "software","hardware","digital","logik","matrix","speicher","prozess","modul","funktion","klasse",
  "start","ziel","punkt","level","karte","farbe","kreis","quadrat","muster","regel",
  "heute","morgen","wieder","immer","etwas","durch","unter","zwischen","wichtig","richtig",
  "genug","besser","klein","groß","ruhig","stark","klar","direkt","einfach","sauber",
  "entwicklung","geschwindigkeit","genauigkeit","training","fortschritt","reaktion","aufgabe",
  "entscheidung","konzentration","rhythmus","anschlag","zeile","spalte","zeichen","wort","satz"
];

export const SENTENCES = [
  "Schnelles Tippen entsteht durch Rhythmus und nicht durch hektische Bewegungen.",
  "Die Finger kehren nach jedem Anschlag möglichst entspannt in ihre Grundposition zurück.",
  "Genauigkeit ist am Anfang wichtiger als Geschwindigkeit, denn Tempo folgt mit Übung.",
  "Beim Zehnfingerschreiben schaut man auf den Text und nicht ständig auf die Tastatur.",
  "Kurze konzentrierte Einheiten bringen oft mehr als eine sehr lange unaufmerksame Sitzung.",
  "Ein gleichmäßiger Anschlag hilft dabei, Fehler zu vermeiden und den Schreibfluss zu halten.",
  "Schwierige Buchstaben sollten gezielt trainiert werden, statt sie immer wieder zu umgehen.",
  "Wer sauber tippt, kann später deutlich schneller werden, ohne die Kontrolle zu verlieren.",
  "Gute Schreibtechnik spart Zeit bei Schule, Arbeit, Programmierung und alltäglichen Nachrichten.",
  "Die Grundreihe bildet das Zentrum der Handposition und erleichtert den Weg zu den anderen Reihen."
];

export const LESSONS = [
  {
    id:"home-anchors",
    title:"F & J – Orientierung",
    group:"Grundreihe",
    keys:["f","j"," "],
    targetWpm:12,
    description:"Lerne die beiden Orientierungstasten und den Daumen für Leerzeichen.",
    text:"fff jjj fjf jfj ff jj fj jf fff jjj fj jf"
  },
  {
    id:"home-core",
    title:"ASDF + JKLÖ",
    group:"Grundreihe",
    keys:["a","s","d","f","j","k","l","ö"," "],
    targetWpm:16,
    description:"Alle vier Finger jeder Hand auf der Grundreihe.",
    text:"asdf jklö asdf jklö fj dk sl aö as df jk lö"
  },
  {
    id:"home-index",
    title:"G & H",
    group:"Grundreihe",
    keys:["a","s","d","f","g","h","j","k","l","ö"," "],
    targetWpm:19,
    description:"Die Zeigefinger übernehmen zusätzlich G und H.",
    text:"fgh ghj hag fad lag hall gas glas jagd halt"
  },
  {
    id:"upper-middle",
    title:"E R U I",
    group:"Oberreihe",
    keys:["e","r","u","i","a","s","d","f","j","k","l","ö"," "],
    targetWpm:22,
    description:"Mittlere Tasten der oberen Reihe mit kontrollierten Wegen.",
    text:"reise leise ruder user irre drei frei tier hier"
  },
  {
    id:"upper-index",
    title:"T Z",
    group:"Oberreihe",
    keys:["t","z","e","r","u","i","a","s","d","f","g","h","j","k","l","ö"," "],
    targetWpm:24,
    description:"T und Z erweitern die Reichweite der Zeigefinger.",
    text:"zeit tier ziel reiz halt stadt jetzt tritt zart"
  },
  {
    id:"upper-edge",
    title:"Q W O P Ü",
    group:"Oberreihe",
    keys:["q","w","e","r","t","z","u","i","o","p","ü","a","s","d","f","g","h","j","k","l","ö"," "],
    targetWpm:27,
    description:"Die äußeren Tasten der Oberreihe sauber treffen.",
    text:"wort post quer wohl pool plus quiz power wort"
  },
  {
    id:"lower-left",
    title:"Y X C V B",
    group:"Unterreihe",
    keys:["y","x","c","v","b","a","s","d","f","g","q","w","e","r","t"," "],
    targetWpm:28,
    description:"Die linke Hand lernt die komplette Unterreihe.",
    text:"box taxi civil byte vibe copy baby text xbox"
  },
  {
    id:"lower-right",
    title:"N M , . -",
    group:"Unterreihe",
    keys:["n","m",",",".","-","h","j","k","l","ö","z","u","i","o","p"," "],
    targetWpm:30,
    description:"Die rechte Hand ergänzt Buchstaben und Satzzeichen.",
    text:"name mini, mona. nun, im - team. mann, name."
  },
  {
    id:"umlauts",
    title:"Ä Ö Ü ß",
    group:"Deutsch",
    keys:["ä","ö","ü","ß"," "],
    targetWpm:28,
    description:"Deutsche Sonderzeichen gezielt und ohne Hinsehen treffen.",
    text:"größe süß füße lösen grüße höhe mäuse äußern"
  },
  {
    id:"word-flow",
    title:"Wortfluss",
    group:"Anwendung",
    keys:"all",
    targetWpm:34,
    description:"Häufige Wörter mit gleichmäßigem Rhythmus.",
    generate:"words"
  },
  {
    id:"sentences",
    title:"Sätze & Rhythmus",
    group:"Anwendung",
    keys:"all",
    targetWpm:38,
    description:"Längere zusammenhängende Texte ohne auf die Tastatur zu schauen.",
    generate:"sentences"
  },
  {
    id:"mastery",
    title:"Mastery",
    group:"Anwendung",
    keys:"all",
    targetWpm:45,
    description:"Gemischte Wörter, Sätze und anspruchsvollere Kombinationen.",
    generate:"mastery"
  }
];

export const DEFAULT_PROFILE = {
  xp:0,
  level:1,
  streak:0,
  lastPracticeDay:"",
  lessons:{},
  history:[],
  keyStats:{},
  bestTests:{30:0,60:0,120:0},
  settings:{
    showKeyboard:true,
    sound:false
  }
};
