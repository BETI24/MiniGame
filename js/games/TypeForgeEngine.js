import { DEFAULT_PROFILE, GERMAN_WORDS, SENTENCES, KEY_TO_FINGER } from "./TypeForgeData.js";

const STORAGE_KEY = "typeforge-profile-v1";

export function clamp(v,a,b){
  return Math.max(a,Math.min(b,v));
}

export function shuffle(input,rng=Math.random){
  const a=[...input];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(rng()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

export function loadProfile(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return structuredClone(DEFAULT_PROFILE);
    const parsed=JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_PROFILE),
      ...parsed,
      settings:{...DEFAULT_PROFILE.settings,...(parsed.settings||{})},
      lessons:{...(parsed.lessons||{})},
      history:Array.isArray(parsed.history)?parsed.history:[],
      keyStats:{...(parsed.keyStats||{})},
      bestTests:{...DEFAULT_PROFILE.bestTests,...(parsed.bestTests||{})}
    };
  }catch{
    return structuredClone(DEFAULT_PROFILE);
  }
}

export function saveProfile(profile){
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(profile));
  }catch{}
}

export function xpForLevel(level){
  return 350 + (level-1)*170;
}

export function recalcLevel(profile){
  let remaining=profile.xp;
  let level=1;
  while(remaining>=xpForLevel(level)){
    remaining-=xpForLevel(level);
    level++;
  }
  profile.level=level;
  return {level,current:remaining,needed:xpForLevel(level)};
}

export function addXp(profile,amount){
  profile.xp=Math.max(0,Math.round(profile.xp+amount));
  return recalcLevel(profile);
}

export function updateStreak(profile){
  const today=new Date().toISOString().slice(0,10);
  if(profile.lastPracticeDay===today)return;
  const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
  profile.streak=profile.lastPracticeDay===yesterday ? profile.streak+1 : 1;
  profile.lastPracticeDay=today;
}

export function calcWpm(correctChars,elapsedSeconds){
  if(elapsedSeconds<=0)return 0;
  return Math.round((correctChars/5)/(elapsedSeconds/60));
}

export function calcAccuracy(correct,errors){
  const total=correct+errors;
  return total?Math.round(correct/total*100):100;
}

export function starsForResult(wpm,accuracy,targetWpm){
  if(accuracy<88)return 0;
  if(accuracy>=97 && wpm>=targetWpm*1.25)return 3;
  if(accuracy>=94 && wpm>=targetWpm)return 2;
  return 1;
}

export function recordKeyStroke(profile,key,correct){
  const k=key.toLowerCase();
  if(!profile.keyStats[k]){
    profile.keyStats[k]={correct:0,errors:0};
  }
  if(correct)profile.keyStats[k].correct++;
  else profile.keyStats[k].errors++;
}

export function getKeyAccuracy(profile,key){
  const s=profile.keyStats[key];
  if(!s)return 100;
  const total=s.correct+s.errors;
  return total?Math.round(s.correct/total*100):100;
}

export function getWeakKeys(profile,limit=6){
  const entries=Object.entries(profile.keyStats)
    .filter(([key,s])=>key!==" " && s.correct+s.errors>=3)
    .map(([key,s])=>{
      const total=s.correct+s.errors;
      return {key,accuracy:s.correct/total,attempts:total};
    })
    .sort((a,b)=>{
      if(a.accuracy!==b.accuracy)return a.accuracy-b.accuracy;
      return b.attempts-a.attempts;
    });
  return entries.slice(0,limit).map(x=>x.key);
}

export function buildWordText(count=35,focusKeys=[]){
  let pool=GERMAN_WORDS;
  if(focusKeys.length){
    const preferred=GERMAN_WORDS.filter(w=>focusKeys.some(k=>w.includes(k)));
    if(preferred.length>=8)pool=[...preferred,...preferred,...GERMAN_WORDS];
  }
  const out=[];
  let last="";
  for(let i=0;i<count;i++){
    let word=pool[Math.floor(Math.random()*pool.length)];
    let guard=0;
    while(word===last && guard++<8){
      word=pool[Math.floor(Math.random()*pool.length)];
    }
    last=word;
    out.push(word);
  }
  return out.join(" ");
}

export function buildSentenceText(minChars=330){
  const out=[];
  while(out.join(" ").length<minChars){
    out.push(SENTENCES[Math.floor(Math.random()*SENTENCES.length)]);
  }
  return out.join(" ");
}

export function buildLessonText(lesson){
  if(lesson.generate==="words")return buildWordText(38);
  if(lesson.generate==="sentences")return buildSentenceText(420);
  if(lesson.generate==="mastery"){
    return buildSentenceText(250)+" "+buildWordText(28)+".";
  }
  return lesson.text;
}

export function buildWeakKeyText(profile){
  const weak=getWeakKeys(profile,6);
  if(!weak.length)return buildWordText(38,["e","r","t","n","i","s"]);
  return buildWordText(42,weak);
}

export function pushHistory(profile,result){
  profile.history.unshift({
    ...result,
    date:Date.now()
  });
  profile.history=profile.history.slice(0,50);
}

export function averageRecent(profile,count=10){
  const rows=profile.history.slice(0,count);
  if(!rows.length)return {wpm:0,accuracy:0};
  return {
    wpm:Math.round(rows.reduce((s,r)=>s+(r.wpm||0),0)/rows.length),
    accuracy:Math.round(rows.reduce((s,r)=>s+(r.accuracy||0),0)/rows.length)
  };
}

export function formatTime(seconds){
  const s=Math.max(0,Math.ceil(seconds));
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
}

export function fingerForKey(key){
  return KEY_TO_FINGER[key.toLowerCase()] || null;
}

export function sanitizeCustomText(text){
  return String(text||"")
    .replace(/\s+/g," ")
    .trim()
    .slice(0,2200);
}
