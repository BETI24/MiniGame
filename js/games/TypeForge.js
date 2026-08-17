import {
  LESSONS,
  KEYBOARD_ROWS,
  KEY_TO_FINGER,
  FINGER_LABELS,
  GERMAN_WORDS
} from "./TypeForgeData.js";

import {
  clamp,
  loadProfile,
  saveProfile,
  recalcLevel,
  addXp,
  updateStreak,
  calcWpm,
  calcAccuracy,
  starsForResult,
  recordKeyStroke,
  getKeyAccuracy,
  getWeakKeys,
  buildWordText,
  buildSentenceText,
  buildLessonText,
  buildWeakKeyText,
  pushHistory,
  averageRecent,
  formatTime,
  fingerForKey,
  sanitizeCustomText
} from "./TypeForgeEngine.js";

export default {
  manifest:{
    id:"typeforge",
    name:"TypeForge",
    description:"10-Finger-Schreiben lernen: Lektionen, adaptive Übungen, Speedtests, Word Rush und Fortschrittsanalyse.",
    icon:"⌨️",
    tags:["Typing","Learning","Skill","Training"]
  },

  init:(container,services)=>{
    let destroyed=false;
    let profile=loadProfile();
    updateStreak(profile);
    recalcLevel(profile);
    saveProfile(profile);

    let currentView="dashboard";
    let activeSession=null;
    let sessionTimer=0;
    let raf=0;
    let lastFrame=performance.now();
    let rushTimer=null;

    const style=document.createElement("style");
    style.textContent=`
      .tf{
        position:relative;width:100%;height:100%;min-height:650px;overflow:auto;
        color:#eaf1f5;background:
          radial-gradient(circle at 20% 0%,rgba(64,133,170,.20),transparent 34%),
          linear-gradient(180deg,#10171d,#0b1015);
        font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      }
      .tf *{box-sizing:border-box}
      .tf button,.tf textarea{font:inherit}
      .tf-shell{width:min(1180px,calc(100% - 28px));margin:0 auto;padding:18px 0 40px}
      .tf-top{
        position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;
        gap:16px;padding:12px 14px;margin-bottom:14px;background:#111a21e8;border:1px solid #ffffff12;
        border-radius:14px;backdrop-filter:blur(12px)
      }
      .tf-brand{display:flex;align-items:center;gap:10px}
      .tf-logo{
        width:40px;height:40px;border-radius:11px;display:grid;place-items:center;
        background:linear-gradient(135deg,#58b8de,#7a78f0);font-size:1.3rem;box-shadow:0 8px 24px #0005
      }
      .tf-brand b{font-size:1.08rem}
      .tf-brand small{display:block;margin-top:1px;color:#7f909d;font-size:.68rem;font-weight:700}
      .tf-profile{display:flex;align-items:center;gap:14px}
      .tf-mini-stat{text-align:right}
      .tf-mini-stat span{display:block;color:#718391;font-size:.56rem;font-weight:900;text-transform:uppercase}
      .tf-mini-stat b{font-size:.82rem}
      .tf-xp{width:122px}
      .tf-xpbar{height:7px;margin-top:5px;border-radius:99px;background:#26313a;overflow:hidden}
      .tf-xpfill{height:100%;background:linear-gradient(90deg,#59bddf,#807cf2)}
      .tf-nav{
        display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px;padding:6px;
        background:#111920;border:1px solid #ffffff0d;border-radius:12px
      }
      .tf-nav button{
        border:0;border-radius:9px;padding:9px 13px;background:transparent;color:#8394a1;
        cursor:pointer;font-size:.72rem;font-weight:850
      }
      .tf-nav button.on{background:#273540;color:#fff}
      .tf-main{min-height:540px}
      .tf-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:12px}
      .tf-card{
        border:1px solid #ffffff10;background:linear-gradient(180deg,#17222a,#121b22);
        border-radius:14px;padding:16px;box-shadow:0 8px 24px #0002
      }
      .tf-card h2,.tf-card h3{margin:0}
      .tf-kicker{color:#66c2e4;font-size:.62rem;font-weight:950;letter-spacing:.11em;text-transform:uppercase}
      .tf-muted{color:#81919d}
      .tf-hero{grid-column:span 8;padding:22px;min-height:220px;display:flex;flex-direction:column;justify-content:center}
      .tf-hero h1{margin:7px 0 8px;font-size:clamp(2rem,4vw,3.35rem);line-height:.98;letter-spacing:-.045em}
      .tf-hero p{max-width:690px;margin:0;color:#91a1ad;line-height:1.55;font-size:.88rem}
      .tf-hero-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
      .tf-btn{
        border:1px solid #ffffff12;border-radius:10px;background:#23313c;color:#eaf1f5;
        padding:10px 13px;font-size:.72rem;font-weight:900;cursor:pointer
      }
      .tf-btn:hover{filter:brightness(1.1)}
      .tf-btn.primary{background:linear-gradient(135deg,#55b8df,#6d80ef);color:#06131a;border:0}
      .tf-btn.good{background:#55b77e;color:#091b11;border:0}
      .tf-side{grid-column:span 4}
      .tf-statrow{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:12px}
      .tf-statbox{padding:11px;background:#0f171d;border:1px solid #ffffff0c;border-radius:10px}
      .tf-statbox span{display:block;color:#738794;font-size:.57rem;font-weight:900;text-transform:uppercase}
      .tf-statbox b{display:block;margin-top:3px;font-size:1.1rem}
      .tf-section-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:12px}
      .tf-section-head h2{margin:0;font-size:1.2rem}
      .tf-section-head p{margin:3px 0 0;color:#7d8e9a;font-size:.72rem}
      .tf-lesson-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .tf-lesson{
        position:relative;min-height:150px;border:1px solid #ffffff0f;border-radius:12px;
        background:#151f26;padding:14px;cursor:pointer
      }
      .tf-lesson:hover:not(.locked){border-color:#5fbadd77;transform:translateY(-1px)}
      .tf-lesson.locked{opacity:.42;cursor:not-allowed}
      .tf-lesson-num{font-size:.57rem;color:#6f8290;font-weight:900;text-transform:uppercase}
      .tf-lesson h3{margin:6px 0 5px;font-size:.89rem}
      .tf-lesson p{margin:0;color:#788a97;font-size:.66rem;line-height:1.45}
      .tf-stars{margin-top:12px;color:#f2c95c;font-size:.86rem;letter-spacing:.05em}
      .tf-mode-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .tf-mode{padding:18px;min-height:160px;cursor:pointer}
      .tf-mode-icon{font-size:1.7rem}
      .tf-mode h3{margin:8px 0 5px}
      .tf-mode p{margin:0;color:#7f909d;font-size:.69rem;line-height:1.48}
      .tf-session{
        max-width:980px;margin:0 auto
      }
      .tf-session-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:10px}
      .tf-session-title h2{margin:0;font-size:1.05rem}
      .tf-session-title p{margin:3px 0 0;color:#7a8d9b;font-size:.67rem}
      .tf-live-stats{display:flex;gap:7px}
      .tf-live{
        min-width:82px;padding:8px 10px;text-align:center;background:#111920;border:1px solid #ffffff0e;border-radius:9px
      }
      .tf-live span{display:block;color:#708493;font-size:.51rem;font-weight:900;text-transform:uppercase}
      .tf-live b{font-size:.88rem}
      .tf-text{
        position:relative;min-height:210px;padding:22px;border-radius:14px;border:1px solid #ffffff12;
        background:#111a20;font-family:"SFMono-Regular",Consolas,monospace;font-size:clamp(1.05rem,2.3vw,1.45rem);
        line-height:1.8;letter-spacing:.015em;overflow:hidden
      }
      .tf-char{color:#63727c}
      .tf-char.done{color:#dce5ea}
      .tf-char.current{
        color:#fff;background:#2f85a8;border-radius:3px;box-shadow:0 0 0 2px #2f85a855
      }
      .tf-char.error{color:#ff7d84;text-decoration:underline}
      .tf-session-controls{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:10px}
      .tf-session-tip{color:#728592;font-size:.64rem}
      .tf-keyboard{
        margin-top:14px;padding:12px;border-radius:13px;background:#10181e;border:1px solid #ffffff0c
      }
      .tf-key-row{display:flex;justify-content:center;gap:5px;margin:5px 0}
      .tf-key{
        position:relative;min-width:38px;height:38px;padding:0 7px;display:grid;place-items:center;border-radius:7px;
        border:1px solid #ffffff10;background:#1c2830;color:#8fa0aa;font-size:.67rem;font-weight:850;
        transition:.08s ease
      }
      .tf-key.home::after{content:"";position:absolute;bottom:4px;width:12px;height:2px;border-radius:99px;background:#cad5db88}
      .tf-key.active{
        color:#08131a;background:#7ad1ee;border-color:#d7f4ff;transform:translateY(-2px);
        box-shadow:0 5px 17px #4bb8db55
      }
      .tf-key.space{width:260px}
      .tf-finger-guide{
        display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:10px
      }
      .tf-finger{
        padding:5px 8px;border-radius:7px;background:#172129;color:#718592;font-size:.55rem;font-weight:850
      }
      .tf-finger.active{background:#364854;color:#fff}
      .tf-result{
        max-width:690px;margin:20px auto;padding:22px;text-align:center
      }
      .tf-result h2{margin:5px 0;font-size:1.8rem}
      .tf-result-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}
      .tf-result-grid>div{padding:12px;border-radius:10px;background:#0f171d}
      .tf-result-grid span{display:block;color:#70818e;font-size:.55rem;font-weight:900;text-transform:uppercase}
      .tf-result-grid b{display:block;margin-top:3px;font-size:1.1rem}
      .tf-settings-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
      .tf-chip{
        border:1px solid #ffffff10;border-radius:99px;background:#151f26;color:#83949f;padding:7px 11px;
        font-size:.63rem;font-weight:850;cursor:pointer
      }
      .tf-chip.on{background:#2b4655;color:#fff;border-color:#5bb8db88}
      .tf-custom{
        width:100%;min-height:130px;padding:12px;border-radius:10px;border:1px solid #ffffff12;
        background:#0e151a;color:#e7edf0;resize:vertical
      }
      .tf-history{display:grid;gap:6px}
      .tf-history-row{
        display:grid;grid-template-columns:1.3fr .7fr .7fr .7fr;gap:8px;padding:9px 10px;
        border-radius:8px;background:#111920;font-size:.67rem
      }
      .tf-history-row span{color:#7d8f9b}
      .tf-keystats{display:grid;grid-template-columns:repeat(11,1fr);gap:5px}
      .tf-kstat{
        min-height:48px;padding:5px;border-radius:7px;background:#172129;text-align:center
      }
      .tf-kstat b{display:block;font-size:.72rem}
      .tf-kstat span{display:block;margin-top:2px;font-size:.52rem;color:#718590}
      .tf-kstat.weak{background:#49252a}
      .tf-kstat.mid{background:#463d25}
      .tf-kstat.good{background:#1c3d31}
      .tf-rush{
        max-width:780px;margin:0 auto;text-align:center
      }
      .tf-rush-arena{
        position:relative;height:300px;margin-top:14px;border-radius:14px;border:1px solid #ffffff10;
        background:radial-gradient(circle at 50% 30%,#1e3440,#0e161b);overflow:hidden
      }
      .tf-rush-word{
        position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);
        font-family:Consolas,monospace;font-size:2.3rem;font-weight:950;letter-spacing:.05em
      }
      .tf-rush-word .done{color:#63d3a1}
      .tf-rush-entry{margin-top:12px;color:#8da0ac;font-family:Consolas,monospace;font-size:1rem}
      .tf-timebar{height:9px;background:#24313a;overflow:hidden;border-radius:99px;margin-top:12px}
      .tf-timefill{height:100%;background:linear-gradient(90deg,#62d6a1,#f1cc5f,#ef7474)}
      .tf-toast{
        position:fixed;z-index:50;left:50%;bottom:24px;transform:translateX(-50%) translateY(15px);
        padding:9px 13px;border-radius:9px;background:#ecf2f5;color:#142027;font-size:.68rem;font-weight:900;
        opacity:0;pointer-events:none;transition:.15s ease
      }
      .tf-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
      @media(max-width:900px){
        .tf-hero,.tf-side{grid-column:span 12}
        .tf-lesson-grid,.tf-mode-grid{grid-template-columns:1fr 1fr}
        .tf-keystats{grid-template-columns:repeat(8,1fr)}
      }
      @media(max-width:620px){
        .tf-shell{width:min(100% - 14px,1180px)}
        .tf-top{position:relative}
        .tf-profile .tf-mini-stat:nth-child(2){display:none}
        .tf-lesson-grid,.tf-mode-grid{grid-template-columns:1fr}
        .tf-session-top{grid-template-columns:1fr}
        .tf-live-stats{justify-content:space-between}
        .tf-live{min-width:0;flex:1}
        .tf-result-grid{grid-template-columns:1fr 1fr}
        .tf-key{min-width:25px;height:32px;padding:0 4px;font-size:.56rem}
        .tf-key.space{width:180px}
        .tf-keystats{grid-template-columns:repeat(6,1fr)}
      }
    `;

    const root=document.createElement("div");
    root.className="tf";
    root.innerHTML=`
      <div class="tf-shell">
        <div class="tf-top">
          <div class="tf-brand">
            <div class="tf-logo">⌨️</div>
            <div><b>TypeForge</b><small>10-Finger Training Platform</small></div>
          </div>
          <div class="tf-profile"></div>
        </div>
        <div class="tf-nav"></div>
        <main class="tf-main"></main>
      </div>
      <div class="tf-toast"></div>
    `;
    container.append(style,root);

    const main=root.querySelector(".tf-main");
    const nav=root.querySelector(".tf-nav");
    const profileEl=root.querySelector(".tf-profile");
    const toastEl=root.querySelector(".tf-toast");

    const NAV=[
      ["dashboard","Dashboard"],
      ["lessons","Lektionen"],
      ["practice","Üben"],
      ["test","Speedtest"],
      ["rush","Word Rush"],
      ["stats","Statistik"]
    ];

    function toast(text){
      toastEl.textContent=text;
      toastEl.classList.add("show");
      setTimeout(()=>toastEl.classList.remove("show"),1600);
    }

    function renderTop(){
      const p=recalcLevel(profile);
      profileEl.innerHTML=`
        <div class="tf-mini-stat"><span>Streak</span><b>🔥 ${profile.streak}</b></div>
        <div class="tf-mini-stat"><span>Level</span><b>${p.level}</b></div>
        <div class="tf-xp">
          <div class="tf-mini-stat"><span>XP</span><b>${p.current} / ${p.needed}</b></div>
          <div class="tf-xpbar"><div class="tf-xpfill" style="width:${clamp(p.current/p.needed*100,0,100)}%"></div></div>
        </div>
      `;
      nav.innerHTML=NAV.map(([id,label])=>
        `<button data-view="${id}" class="${currentView===id?"on":""}">${label}</button>`
      ).join("");
      nav.querySelectorAll("button").forEach(btn=>{
        btn.onclick=()=>showView(btn.dataset.view);
      });
    }

    function showView(view){
      stopActiveSession();
      currentView=view;
      renderTop();
      if(view==="dashboard")renderDashboard();
      if(view==="lessons")renderLessons();
      if(view==="practice")renderPractice();
      if(view==="test")renderTestMenu();
      if(view==="rush")renderRushMenu();
      if(view==="stats")renderStats();
    }

    function lessonUnlocked(index){
      if(index===0)return true;
      const prev=profile.lessons[LESSONS[index-1].id];
      return !!prev?.completed;
    }

    function recommendedLessonIndex(){
      for(let i=0;i<LESSONS.length;i++){
        if(!profile.lessons[LESSONS[i].id]?.completed)return i;
      }
      return LESSONS.length-1;
    }

    function renderDashboard(){
      const avg=averageRecent(profile,10);
      const weak=getWeakKeys(profile,5);
      const ri=recommendedLessonIndex();
      const lesson=LESSONS[ri];
      main.innerHTML=`
        <div class="tf-grid">
          <section class="tf-card tf-hero">
            <div class="tf-kicker">Empfohlenes Training</div>
            <h1>${lesson.title}</h1>
            <p>${lesson.description} Arbeite zuerst sauber und gleichmäßig; die Geschwindigkeit kommt mit Wiederholung.</p>
            <div class="tf-hero-actions">
              <button class="tf-btn primary" data-action="recommended">Training starten</button>
              <button class="tf-btn" data-action="weak">Schwache Tasten üben</button>
              <button class="tf-btn" data-action="test">60s Speedtest</button>
            </div>
          </section>
          <aside class="tf-card tf-side">
            <div class="tf-kicker">Dein Fortschritt</div>
            <h3 style="margin-top:5px">Level ${profile.level}</h3>
            <div class="tf-statrow">
              <div class="tf-statbox"><span>Ø WPM</span><b>${avg.wpm}</b></div>
              <div class="tf-statbox"><span>Ø Accuracy</span><b>${avg.accuracy}%</b></div>
              <div class="tf-statbox"><span>Lektionen</span><b>${Object.values(profile.lessons).filter(x=>x.completed).length}/${LESSONS.length}</b></div>
              <div class="tf-statbox"><span>Weak Keys</span><b>${weak.length?weak.join(" ").toUpperCase():"—"}</b></div>
            </div>
          </aside>
          <section class="tf-card" style="grid-column:span 12">
            <div class="tf-section-head"><div><h2>Trainingsbereiche</h2><p>Wechsle zwischen Technik, Tempo und spielerischen Übungen.</p></div></div>
            <div class="tf-mode-grid">
              <div class="tf-card tf-mode" data-mode="lessons"><div class="tf-mode-icon">🧭</div><h3>10-Finger Kurs</h3><p>Schrittweise von F/J bis zu kompletten Sätzen und Sonderzeichen.</p></div>
              <div class="tf-card tf-mode" data-mode="practice"><div class="tf-mode-icon">🎯</div><h3>Adaptive Practice</h3><p>Übe gezielt problematische Tasten oder frei gewählte Texte.</p></div>
              <div class="tf-card tf-mode" data-mode="rush"><div class="tf-mode-icon">⚡</div><h3>Word Rush</h3><p>Schnelle Wörter, Combo und Zeitdruck für Reaktion und Rhythmus.</p></div>
            </div>
          </section>
        </div>
      `;
      main.querySelector('[data-action="recommended"]').onclick=()=>startLesson(ri);
      main.querySelector('[data-action="weak"]').onclick=()=>startTypingSession({
        title:"Weak Key Drill",subtitle:"Adaptive Übung für deine schwächsten Tasten",
        text:buildWeakKeyText(profile),mode:"weak",strict:true,targetWpm:30
      });
      main.querySelector('[data-action="test"]').onclick=()=>startTest(60);
      main.querySelectorAll("[data-mode]").forEach(el=>el.onclick=()=>showView(el.dataset.mode));
    }

    function renderLessons(){
      main.innerHTML=`
        <div class="tf-section-head">
          <div><h2>10-Finger Kurs</h2><p>Neue Lektionen werden nacheinander freigeschaltet.</p></div>
        </div>
        <div class="tf-lesson-grid">
          ${LESSONS.map((l,i)=>{
            const state=profile.lessons[l.id]||{};
            const unlocked=lessonUnlocked(i);
            return `
              <div class="tf-lesson ${unlocked?"":"locked"}" data-i="${i}">
                <div class="tf-lesson-num">${l.group} · ${i+1}/${LESSONS.length}</div>
                <h3>${unlocked?l.title:"🔒 "+l.title}</h3>
                <p>${l.description}</p>
                <div class="tf-stars">${"★".repeat(state.stars||0)}${"☆".repeat(3-(state.stars||0))}</div>
              </div>`;
          }).join("")}
        </div>
      `;
      main.querySelectorAll(".tf-lesson").forEach(el=>{
        el.onclick=()=>{
          const i=Number(el.dataset.i);
          if(!lessonUnlocked(i)){toast("Schließe zuerst die vorherige Lektion ab.");return;}
          startLesson(i);
        };
      });
    }

    function startLesson(index){
      const lesson=LESSONS[index];
      startTypingSession({
        title:lesson.title,
        subtitle:`${lesson.group} · Ziel ${lesson.targetWpm} WPM`,
        text:buildLessonText(lesson),
        mode:"lesson",
        lessonIndex:index,
        strict:true,
        targetWpm:lesson.targetWpm
      });
    }

    function renderPractice(){
      main.innerHTML=`
        <div class="tf-section-head">
          <div><h2>Freies Training</h2><p>Wähle eine Übung, die zu deinem aktuellen Ziel passt.</p></div>
        </div>
        <div class="tf-mode-grid">
          <div class="tf-card tf-mode" data-p="weak"><div class="tf-mode-icon">🎯</div><h3>Weak Keys</h3><p>Automatisch auf deine Tasten mit der niedrigsten Genauigkeit zugeschnitten.</p></div>
          <div class="tf-card tf-mode" data-p="flow"><div class="tf-mode-icon">🌊</div><h3>Word Flow</h3><p>Kontinuierliche Wörter für Rhythmus, Muskelgedächtnis und saubere Übergänge.</p></div>
          <div class="tf-card tf-mode" data-p="sentences"><div class="tf-mode-icon">📝</div><h3>Satztraining</h3><p>Längere deutsche Sätze für alltagsnahes Schreiben.</p></div>
        </div>
        <section class="tf-card" style="margin-top:12px">
          <div class="tf-section-head"><div><h2>Eigener Text</h2><p>Füge Code, Lernstoff, Texte oder eigene Wortlisten ein.</p></div></div>
          <textarea class="tf-custom" placeholder="Eigenen Text hier einfügen..."></textarea>
          <div style="margin-top:8px"><button class="tf-btn primary tf-custom-start">Custom Practice starten</button></div>
        </section>
      `;
      main.querySelector('[data-p="weak"]').onclick=()=>startTypingSession({
        title:"Weak Key Drill",subtitle:"Adaptive Übung",text:buildWeakKeyText(profile),
        mode:"weak",strict:true,targetWpm:30
      });
      main.querySelector('[data-p="flow"]').onclick=()=>startTypingSession({
        title:"Word Flow",subtitle:"Freies Rhythmustraining",text:buildWordText(55),
        mode:"practice",strict:true,targetWpm:34
      });
      main.querySelector('[data-p="sentences"]').onclick=()=>startTypingSession({
        title:"Satztraining",subtitle:"Längere zusammenhängende Texte",text:buildSentenceText(600),
        mode:"practice",strict:true,targetWpm:36
      });
      main.querySelector(".tf-custom-start").onclick=()=>{
        const text=sanitizeCustomText(main.querySelector(".tf-custom").value);
        if(text.length<10){toast("Bitte mindestens 10 Zeichen eingeben.");return;}
        startTypingSession({
          title:"Custom Practice",subtitle:"Eigener Text",text,mode:"custom",strict:true,targetWpm:0
        });
      };
    }

    function renderTestMenu(){
      main.innerHTML=`
        <div class="tf-section-head"><div><h2>Speedtest</h2><p>Klassischer Test: Fehler zählen, aber der Cursor läuft weiter.</p></div></div>
        <div class="tf-mode-grid">
          ${[30,60,120].map(s=>`
            <div class="tf-card tf-mode" data-time="${s}">
              <div class="tf-mode-icon">⏱️</div>
              <h3>${s} Sekunden</h3>
              <p>Bestwert: <b>${profile.bestTests[s]||0} WPM</b></p>
            </div>`).join("")}
        </div>
      `;
      main.querySelectorAll("[data-time]").forEach(el=>el.onclick=()=>startTest(Number(el.dataset.time)));
    }

    function startTest(seconds){
      startTypingSession({
        title:`${seconds}s Speedtest`,
        subtitle:"Tempo + Genauigkeit unter Zeitdruck",
        text:buildSentenceText(1200),
        mode:"test",
        strict:false,
        duration:seconds,
        targetWpm:0
      });
    }

    function keyboardHtml(activeKey=""){
      const show=profile.settings.showKeyboard;
      if(!show)return "";
      const rows=KEYBOARD_ROWS.map(row=>`
        <div class="tf-key-row">
          ${row.map(k=>{
            const finger=KEY_TO_FINGER[k]||"";
            return `<div class="tf-key ${activeKey===k?"active":""} ${(k==="f"||k==="j")?"home":""}" data-key="${k}" title="${FINGER_LABELS[finger]||""}">${k.toUpperCase()}</div>`;
          }).join("")}
        </div>`).join("");
      const fingers=["LP","LR","LM","LI","RI","RM","RR","RP"].map(f=>
        `<div class="tf-finger ${activeKey && fingerForKey(activeKey)===f?"active":""}">${FINGER_LABELS[f]}</div>`
      ).join("");
      return `<div class="tf-keyboard">${rows}<div class="tf-key-row"><div class="tf-key space ${activeKey===" "?"active":""}" data-key=" ">SPACE</div></div><div class="tf-finger-guide">${fingers}</div></div>`;
    }

    function startTypingSession(config){
      stopActiveSession();
      const text=config.text.replace(/\s+/g," ").trim();
      activeSession={
        ...config,
        text,
        index:0,
        correct:0,
        errors:0,
        started:false,
        startAt:0,
        elapsed:0,
        charStates:Array(text.length).fill(""),
        ended:false
      };
      renderSession();
      setTimeout(()=>window.addEventListener("keydown",onTypingKey),0);
      lastFrame=performance.now();
      raf=requestAnimationFrame(tick);
    }

    function renderSession(){
      const s=activeSession;
      if(!s)return;
      const next=s.text[s.index]||"";
      main.innerHTML=`
        <div class="tf-session">
          <div class="tf-session-top">
            <div class="tf-session-title"><h2>${s.title}</h2><p>${s.subtitle}</p></div>
            <div class="tf-live-stats">
              <div class="tf-live"><span>WPM</span><b class="live-wpm">0</b></div>
              <div class="tf-live"><span>Accuracy</span><b class="live-acc">100%</b></div>
              <div class="tf-live"><span>${s.duration?"Zeit":"Fortschritt"}</span><b class="live-third">${s.duration?formatTime(s.duration):"0%"}</b></div>
            </div>
          </div>
          <div class="tf-text" tabindex="0">${renderTextSpans(s)}</div>
          <div class="tf-session-controls">
            <div class="tf-session-tip">${s.strict?"Fehler müssen korrigiert werden, bevor du weiterkommst.":"Im Speedtest zählt jeder Anschlag – bleib im Rhythmus."}</div>
            <div style="display:flex;gap:6px">
              <button class="tf-btn toggle-kb">${profile.settings.showKeyboard?"Keyboard ausblenden":"Keyboard anzeigen"}</button>
              <button class="tf-btn stop-session">Beenden</button>
            </div>
          </div>
          <div class="kb-wrap">${keyboardHtml(next)}</div>
        </div>
      `;
      main.querySelector(".toggle-kb").onclick=()=>{
        profile.settings.showKeyboard=!profile.settings.showKeyboard;
        saveProfile(profile);
        renderSession();
      };
      main.querySelector(".stop-session").onclick=()=>showView(config.mode==="lesson"?"lessons":"dashboard");
      main.querySelector(".tf-text").focus();
    }

    function renderTextSpans(s){
      const from=Math.max(0,s.index-90);
      const to=Math.min(s.text.length,from+520);
      let html="";
      if(from>0)html=`<span class="tf-char done">… </span>`;
      for(let i=from;i<to;i++){
        const ch=s.text[i];
        let cls="tf-char";
        if(i<s.index)cls+=" "+(s.charStates[i]==="error"?"error":"done");
        if(i===s.index)cls+=" current";
        html+=`<span class="${cls}" data-ci="${i}">${escapeHtml(ch)}</span>`;
      }
      return html;
    }

    function escapeHtml(ch){
      return ch===" "?"&nbsp;":ch.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
    }

    function updateSessionVisuals(){
      const s=activeSession;
      if(!s)return;
      const wpm=calcWpm(s.correct,s.elapsed);
      const acc=calcAccuracy(s.correct,s.errors);
      const a=main.querySelector(".live-wpm");
      const b=main.querySelector(".live-acc");
      const c=main.querySelector(".live-third");
      if(a)a.textContent=wpm;
      if(b)b.textContent=acc+"%";
      if(c){
        c.textContent=s.duration
          ?formatTime(Math.max(0,s.duration-s.elapsed))
          :Math.round(s.index/s.text.length*100)+"%";
      }
      const current=main.querySelector('.tf-char.current');
      if(current && Number(current.dataset.ci)!==s.index){
        main.querySelector(".tf-text").innerHTML=renderTextSpans(s);
      }
      const next=s.text[s.index]||"";
      main.querySelectorAll(".tf-key").forEach(k=>{
        k.classList.toggle("active",k.dataset.key===next.toLowerCase());
      });
      main.querySelectorAll(".tf-finger").forEach(f=>f.classList.remove("active"));
      const finger=fingerForKey(next);
      if(finger){
        [...main.querySelectorAll(".tf-finger")].find(el=>el.textContent===FINGER_LABELS[finger])?.classList.add("active");
      }
    }

    function onTypingKey(e){
      const s=activeSession;
      if(!s||s.ended)return;
      if(e.ctrlKey||e.metaKey||e.altKey)return;
      if(e.key==="Escape"){showView(s.mode==="lesson"?"lessons":"dashboard");return;}
      if(e.key.length!==1 && e.key!=="Backspace")return;
      e.preventDefault();
      if(e.key==="Backspace"){
        if(!s.strict && s.index>0){
          s.index--;
          s.charStates[s.index]="";
        }
        return;
      }
      const typed=e.key;
      const expected=s.text[s.index];
      if(!s.started){
        s.started=true;
        s.startAt=performance.now();
      }
      const correct=typed===expected;
      recordKeyStroke(profile,expected||typed,correct);
      if(correct){
        s.correct++;
        s.charStates[s.index]="done";
        s.index++;
      }else{
        s.errors++;
        if(s.strict){
          const current=main.querySelector('.tf-char.current');
          current?.classList.add("error");
          setTimeout(()=>current?.classList.remove("error"),120);
        }else{
          s.charStates[s.index]="error";
          s.index++;
        }
      }
      if(s.index>=s.text.length){
        finishTypingSession();
        return;
      }
      const textBox=main.querySelector(".tf-text");
      if(textBox)textBox.innerHTML=renderTextSpans(s);
      updateSessionVisuals();
      saveProfile(profile);
    }

    function tick(now){
      if(destroyed||!activeSession)return;
      const s=activeSession;
      if(s.started){
        s.elapsed=(now-s.startAt)/1000;
      }
      if(s.duration && s.elapsed>=s.duration){
        finishTypingSession();
        return;
      }
      updateSessionVisuals();
      raf=requestAnimationFrame(tick);
    }

    function finishTypingSession(){
      const s=activeSession;
      if(!s||s.ended)return;
      s.ended=true;
      window.removeEventListener("keydown",onTypingKey);
      cancelAnimationFrame(raf);
      const elapsed=Math.max(.5,s.elapsed || (performance.now()-s.startAt)/1000 || .5);
      const wpm=calcWpm(s.correct,elapsed);
      const accuracy=calcAccuracy(s.correct,s.errors);
      let stars=0;
      let xp=Math.max(12,Math.round(wpm*.7+accuracy*.25));
      if(s.mode==="lesson"){
        stars=starsForResult(wpm,accuracy,s.targetWpm);
        const lesson=LESSONS[s.lessonIndex];
        const old=profile.lessons[lesson.id]||{stars:0,bestWpm:0};
        profile.lessons[lesson.id]={
          completed:stars>=1,
          stars:Math.max(old.stars||0,stars),
          bestWpm:Math.max(old.bestWpm||0,wpm),
          bestAccuracy:Math.max(old.bestAccuracy||0,accuracy)
        };
        xp+=stars*35;
      }
      if(s.mode==="test" && s.duration){
        profile.bestTests[s.duration]=Math.max(profile.bestTests[s.duration]||0,wpm);
        xp+=20;
      }
      addXp(profile,xp);
      updateStreak(profile);
      pushHistory(profile,{
        mode:s.mode,
        title:s.title,
        wpm,accuracy,
        errors:s.errors,
        seconds:Math.round(elapsed)
      });
      if(services?.highscores?.saveHighscore){
        services.highscores.saveHighscore("typeforge",Math.round(wpm*10+accuracy+profile.level*15));
      }
      saveProfile(profile);
      activeSession=null;
      renderTop();
      main.innerHTML=`
        <div class="tf-card tf-result">
          <div class="tf-kicker">${s.mode==="lesson"?"Lesson Complete":"Training Complete"}</div>
          <h2>${accuracy>=95?"Sehr sauber!":accuracy>=88?"Gute Runde":"Accuracy zuerst"}</h2>
          ${s.mode==="lesson"?`<div class="tf-stars" style="font-size:1.5rem">${"★".repeat(stars)}${"☆".repeat(3-stars)}</div>`:""}
          <div class="tf-result-grid">
            <div><span>WPM</span><b>${wpm}</b></div>
            <div><span>Accuracy</span><b>${accuracy}%</b></div>
            <div><span>Errors</span><b>${s.errors}</b></div>
            <div><span>XP</span><b>+${xp}</b></div>
          </div>
          <p class="tf-muted" style="font-size:.75rem;line-height:1.5">
            ${accuracy<92
              ?"Für langfristig hohes Tempo lohnt es sich, dieselbe Übung langsamer mit höherer Genauigkeit zu wiederholen."
              :"Gute Grundlage. Versuche beim nächsten Durchgang denselben Rhythmus mit etwas weniger bewusster Anstrengung zu halten."}
          </p>
          <div style="display:flex;gap:7px;justify-content:center;margin-top:15px;flex-wrap:wrap">
            <button class="tf-btn primary repeat">Nochmal</button>
            <button class="tf-btn dashboard">Dashboard</button>
          </div>
        </div>
      `;
      main.querySelector(".repeat").onclick=()=>{
        if(s.mode==="lesson")startLesson(s.lessonIndex);
        else if(s.mode==="test")startTest(s.duration);
        else startTypingSession({...s,text:s.mode==="weak"?buildWeakKeyText(profile):s.text});
      };
      main.querySelector(".dashboard").onclick=()=>showView("dashboard");
    }

    function stopActiveSession(){
      window.removeEventListener("keydown",onTypingKey);
      cancelAnimationFrame(raf);
      if(rushTimer){clearInterval(rushTimer);rushTimer=null;}
      activeSession=null;
    }

    function renderRushMenu(){
      main.innerHTML=`
        <div class="tf-section-head"><div><h2>Word Rush</h2><p>Tippe Wörter schnell und sauber, bevor die Zeit pro Wort abläuft.</p></div></div>
        <div class="tf-card" style="max-width:760px;margin:0 auto">
          <div class="tf-mode-icon">⚡</div>
          <h2 style="margin:7px 0">60 Sekunden Combo Rush</h2>
          <p class="tf-muted" style="line-height:1.5;font-size:.75rem">Jedes richtige Wort erhöht die Combo. Fehler kosten Zeit und Combo. Gut für schnelle Worterkennung und flüssige Übergänge.</p>
          <button class="tf-btn primary start-rush" style="margin-top:12px">Word Rush starten</button>
        </div>
      `;
      main.querySelector(".start-rush").onclick=startRush;
    }

    function startRush(){
      stopActiveSession();
      const state={
        word:"",
        typed:"",
        score:0,
        combo:0,
        bestCombo:0,
        correctWords:0,
        errors:0,
        totalLeft:60,
        wordLeft:5.2,
        wordMax:5.2,
        running:true
      };
      activeSession={mode:"rush",rush:state};
      const nextWord=()=>{
        const pool=GERMAN_WORDS.filter(w=>w.length>=3 && w.length<=10);
        state.word=pool[Math.floor(Math.random()*pool.length)];
        state.typed="";
        state.wordMax=Math.max(1.8,5.2-Math.min(2.5,state.correctWords*.035));
        state.wordLeft=state.wordMax;
      };
      nextWord();
      const render=()=>{
        const chars=state.word.split("").map((c,i)=>
          `<span class="${i<state.typed.length?"done":""}">${c}</span>`
        ).join("");
        main.innerHTML=`
          <div class="tf-rush">
            <div class="tf-section-head"><div><h2>Word Rush</h2><p>Schreibe das Wort vollständig.</p></div></div>
            <div class="tf-live-stats" style="justify-content:center">
              <div class="tf-live"><span>Score</span><b>${state.score}</b></div>
              <div class="tf-live"><span>Combo</span><b>×${Math.max(1,state.combo)}</b></div>
              <div class="tf-live"><span>Zeit</span><b>${Math.ceil(state.totalLeft)}s</b></div>
            </div>
            <div class="tf-rush-arena">
              <div class="tf-rush-word">${chars}</div>
            </div>
            <div class="tf-timebar"><div class="tf-timefill" style="width:${clamp(state.wordLeft/state.wordMax*100,0,100)}%"></div></div>
            <div class="tf-rush-entry">${state.typed || "…"}</div>
            <button class="tf-btn quit-rush" style="margin-top:13px">Beenden</button>
          </div>
        `;
        main.querySelector(".quit-rush").onclick=()=>finishRush(state);
      };
      render();
      const onKey=e=>{
        if(!activeSession?.rush||!state.running)return;
        if(e.ctrlKey||e.metaKey||e.altKey)return;
        if(e.key==="Escape"){finishRush(state);return;}
        if(e.key.length!==1)return;
        e.preventDefault();
        const expected=state.word[state.typed.length];
        if(e.key===expected){
          state.typed+=e.key;
          recordKeyStroke(profile,expected,true);
          if(state.typed===state.word){
            state.correctWords++;
            state.combo++;
            state.bestCombo=Math.max(state.bestCombo,state.combo);
            state.score+=100+state.combo*15+Math.round(state.wordLeft*12);
            nextWord();
          }
        }else{
          state.errors++;
          state.combo=0;
          state.wordLeft=Math.max(0,state.wordLeft-.65);
          recordKeyStroke(profile,expected||e.key,false);
        }
        render();
      };
      activeSession.rushKeyHandler=onKey;
      window.addEventListener("keydown",onKey);
      rushTimer=setInterval(()=>{
        if(!state.running)return;
        state.totalLeft-=.1;
        state.wordLeft-=.1;
        if(state.wordLeft<=0){
          state.errors++;
          state.combo=0;
          nextWord();
        }
        if(state.totalLeft<=0){
          finishRush(state);
          return;
        }
        render();
      },100);
    }

    function finishRush(state){
      if(!state.running)return;
      state.running=false;
      clearInterval(rushTimer);rushTimer=null;
      if(activeSession?.rushKeyHandler)window.removeEventListener("keydown",activeSession.rushKeyHandler);
      activeSession=null;
      const accuracy=state.correctWords+state.errors
        ?Math.round(state.correctWords/(state.correctWords+state.errors)*100)
        :100;
      const xp=Math.max(15,Math.round(state.score/55));
      addXp(profile,xp);
      updateStreak(profile);
      pushHistory(profile,{
        mode:"rush",title:"Word Rush",wpm:state.correctWords*2,
        accuracy,errors:state.errors,seconds:60
      });
      saveProfile(profile);
      renderTop();
      main.innerHTML=`
        <div class="tf-card tf-result">
          <div class="tf-kicker">Rush Complete</div>
          <h2>${state.score} Punkte</h2>
          <div class="tf-result-grid">
            <div><span>Words</span><b>${state.correctWords}</b></div>
            <div><span>Accuracy</span><b>${accuracy}%</b></div>
            <div><span>Best Combo</span><b>×${state.bestCombo}</b></div>
            <div><span>XP</span><b>+${xp}</b></div>
          </div>
          <div><button class="tf-btn primary again">Nochmal</button> <button class="tf-btn home">Dashboard</button></div>
        </div>
      `;
      main.querySelector(".again").onclick=startRush;
      main.querySelector(".home").onclick=()=>showView("dashboard");
    }

    function renderStats(){
      const avg=averageRecent(profile,10);
      const allKeys=[...new Set(Object.keys(KEY_TO_FINGER))].filter(k=>k!==" ");
      main.innerHTML=`
        <div class="tf-section-head"><div><h2>Statistik</h2><p>Erkenne Schwächen und beobachte deinen Fortschritt.</p></div></div>
        <div class="tf-grid">
          <section class="tf-card" style="grid-column:span 4">
            <div class="tf-kicker">Recent Average</div>
            <div class="tf-statrow">
              <div class="tf-statbox"><span>WPM</span><b>${avg.wpm}</b></div>
              <div class="tf-statbox"><span>Accuracy</span><b>${avg.accuracy}%</b></div>
              <div class="tf-statbox"><span>Streak</span><b>${profile.streak}</b></div>
              <div class="tf-statbox"><span>Level</span><b>${profile.level}</b></div>
            </div>
          </section>
          <section class="tf-card" style="grid-column:span 8">
            <div class="tf-kicker">Key Accuracy</div>
            <div class="tf-keystats" style="margin-top:10px">
              ${allKeys.map(k=>{
                const acc=getKeyAccuracy(profile,k);
                const stat=profile.keyStats[k];
                const cls=!stat?"":acc<90?"weak":acc<96?"mid":"good";
                return `<div class="tf-kstat ${cls}"><b>${k.toUpperCase()}</b><span>${stat?acc+"%":"—"}</span></div>`;
              }).join("")}
            </div>
          </section>
          <section class="tf-card" style="grid-column:span 12">
            <div class="tf-section-head"><div><h2>Letzte Sessions</h2><p>Die letzten 50 Trainings werden lokal gespeichert.</p></div></div>
            <div class="tf-history">
              ${profile.history.length
                ?profile.history.slice(0,14).map(r=>`
                  <div class="tf-history-row">
                    <b>${r.title}</b>
                    <span>${r.wpm} WPM</span>
                    <span>${r.accuracy}%</span>
                    <span>${new Date(r.date).toLocaleDateString("de-DE")}</span>
                  </div>`).join("")
                :`<div class="tf-muted">Noch keine Sessions vorhanden.</div>`}
            </div>
          </section>
        </div>
      `;
    }

    renderTop();
    renderDashboard();

    return {
      destroy:()=>{
        destroyed=true;
        stopActiveSession();
        style.remove();
      }
    };
  }
};
