import {REGIONS,SPOTS,RARITY_COLORS} from "./ParadiseAnglerData.js";
import {clamp,fmt} from "./ParadiseAnglerEngine.js";

function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function regionForSpot(spot){return REGIONS.find(r=>r.id===spot.region)||REGIONS[0];}
export function renderFishing(ctx,s,W,H){
  if(!s)return;const spot=SPOTS.find(x=>x.id===s.spotId),region=regionForSpot(spot),shake=s.screenShake||0;
  ctx.clearRect(0,0,W,H);ctx.save();if(shake)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  drawScene(ctx,spot,region,W,H,s.time);drawAngler(ctx,W,H);if(s.phase==="fight"||s.phase==="bite")drawFish(ctx,s,W,H);drawLine(ctx,s,W,H);drawSplashes(ctx,s,W,H);ctx.restore();
  if(s.phase==="cast")drawCast(ctx,s,W,H);if(s.phase==="bite")drawStrike(ctx,W,H);if(s.phase==="fight")drawFightHud(ctx,s,W,H);
  if(s.messageTimer>0){ctx.textAlign="center";ctx.font="1000 22px sans-serif";ctx.lineWidth=5;ctx.strokeStyle="#07131aaa";ctx.strokeText(s.message,W/2,H*.18);ctx.fillStyle="#fff";ctx.fillText(s.message,W/2,H*.18);}
}
function drawScene(ctx,spot,region,W,H,t){
  const g=ctx.createLinearGradient(0,0,0,H*.55);g.addColorStop(0,region.sky);g.addColorStop(1,"#d9dac7");ctx.fillStyle=g;ctx.fillRect(0,0,W,H*.55);
  ctx.fillStyle="rgba(255,238,164,.7)";ctx.beginPath();ctx.arc(W*.78,H*.13,30,0,Math.PI*2);ctx.fill();
  if(["jungle","lake","secret"].includes(spot.scene)){
    ctx.fillStyle=spot.scene==="secret"?"rgba(24,34,41,.58)":"rgba(37,83,52,.48)";ctx.beginPath();ctx.moveTo(0,H*.48);for(let x=0;x<=W;x+=35)ctx.lineTo(x,H*.34+Math.sin(x*.018)*25+Math.sin(x*.051)*8);ctx.lineTo(W,H*.56);ctx.lineTo(0,H*.56);ctx.fill();
  }else if(spot.scene==="med"){
    ctx.fillStyle="rgba(220,211,178,.52)";ctx.fillRect(W*.08,H*.35,W*.18,H*.10);ctx.fillRect(W*.11,H*.29,W*.06,H*.06);
  }else{ctx.fillStyle="rgba(42,79,78,.35)";ctx.beginPath();ctx.moveTo(0,H*.48);ctx.quadraticCurveTo(W*.25,H*.32,W*.46,H*.46);ctx.lineTo(0,H*.56);ctx.fill();}
  const water=ctx.createLinearGradient(0,H*.48,0,H);water.addColorStop(0,region.water);water.addColorStop(1,region.deep);ctx.fillStyle=water;ctx.fillRect(0,H*.48,W,H*.52);
  ctx.strokeStyle="rgba(220,250,255,.20)";ctx.lineWidth=1;for(let y=H*.52;y<H;y+=24){ctx.beginPath();for(let x=0;x<=W;x+=18){const yy=y+Math.sin(x*.028+t*2+y*.017)*3;x?ctx.lineTo(x,yy):ctx.moveTo(x,yy);}ctx.stroke();}
  if(spot.secret){ctx.fillStyle="rgba(116,91,210,.08)";ctx.fillRect(0,H*.48,W,H*.52);}
}
function drawAngler(ctx,W,H){
  const x=W*.20,y=H*.48;ctx.fillStyle="#363f46";ctx.fillRect(x-20,y-70,18,45);ctx.fillStyle="#d8b18b";ctx.beginPath();ctx.arc(x-11,y-81,10,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#382c25";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-3,y-44);ctx.quadraticCurveTo(x+70,y-110,x+145,y-28);ctx.stroke();ctx.fillStyle="#d9b35d";ctx.beginPath();ctx.arc(x,y-45,7,0,Math.PI*2);ctx.fill();
}
function fishPos(s,W,H){const amp=s.phase==="fight"?(s.fishMode==="burst"?30:s.fishMode==="struggle"?18:9):6;return {x:W*.68+Math.sin(s.time*2.2)*amp,y:H*.68+Math.sin(s.time*3.1)*7};}
function drawFish(ctx,s,W,H){
  if(!s.fish)return;const p=fishPos(s,W,H),f=s.fish,scale=clamp(.85+s.weight/f.weight[1]*.55,.7,1.65);ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);ctx.shadowColor=RARITY_COLORS[f.stars];ctx.shadowBlur=f.boss?22:8;ctx.fillStyle=f.color;
  if(f.shape==="shark"){
    ctx.beginPath();ctx.moveTo(-55,0);ctx.quadraticCurveTo(0,-25,48,-3);ctx.lineTo(66,-15);ctx.lineTo(58,2);ctx.lineTo(68,17);ctx.lineTo(47,8);ctx.quadraticCurveTo(0,28,-55,0);ctx.fill();ctx.beginPath();ctx.moveTo(-5,-18);ctx.lineTo(10,-40);ctx.lineTo(18,-15);ctx.fill();
  }else{
    const long=["long","bill","eel","catfish"].includes(f.shape);ctx.beginPath();ctx.ellipse(0,0,long?50:38,long?17:24,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-42,0);ctx.lineTo(long?-70:-60,-23);ctx.lineTo(long?-64:-57,23);ctx.closePath();ctx.fill();if(f.shape==="bill")ctx.fillRect(36,-2,40,4);if(f.shape==="catfish"){ctx.strokeStyle=f.color;ctx.lineWidth=2;for(const y of [-5,3]){ctx.beginPath();ctx.moveTo(32,y);ctx.lineTo(58,y+9);ctx.stroke();}}
  }
  ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(25,-7,4,0,Math.PI*2);ctx.fill();ctx.fillStyle="#10202a";ctx.beginPath();ctx.arc(26,-7,2,0,Math.PI*2);ctx.fill();if(f.boss){ctx.strokeStyle="#f5cb59";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,63,0,Math.PI*2);ctx.stroke();}ctx.restore();
}
function drawLine(ctx,s,W,H){const start={x:W*.20+145,y:H*.48-28},end=s.fish?fishPos(s,W,H):{x:W*.60,y:H*.61};ctx.strokeStyle=s.phase==="fight"?"rgba(245,250,255,.78)":"rgba(245,250,255,.48)";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.quadraticCurveTo(W*.48,H*.48,end.x,end.y);ctx.stroke();}
function drawSplashes(ctx,s,W,H){for(const p of s.splashes||[]){const a=clamp(p.life/.45,0,1);ctx.strokeStyle=p.crit?`rgba(112,255,151,${a})`:`rgba(220,248,255,${a})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x*W,p.y*H,(1-a)*24+5,0,Math.PI*2);ctx.stroke();}}
function drawCast(ctx,s,W,H){
  const w=Math.min(480,W*.62),x=W/2-w/2,y=H*.74;ctx.fillStyle="rgba(5,14,20,.78)";rr(ctx,x-16,y-34,w+32,82,12);ctx.fill();ctx.fillStyle="#22343e";rr(ctx,x,y,w,22,7);ctx.fill();ctx.fillStyle="#4f9e75";ctx.fillRect(x+w*.36,y,w*.28,22);ctx.fillStyle="#65dec0";ctx.fillRect(x+w*.445,y,w*.11,22);ctx.fillStyle="#fff";ctx.fillRect(x+s.castMarker*w-2,y-7,4,36);ctx.textAlign="center";ctx.fillStyle="#dcecf0";ctx.font="900 12px sans-serif";ctx.fillText("CAST TIMING · center = PERFECT (+15% Big Fish)",W/2,y-12);
}
function drawStrike(ctx,W,H){ctx.textAlign="center";ctx.font="1000 38px sans-serif";ctx.fillStyle="#ffe16d";ctx.shadowColor="#ffb84d";ctx.shadowBlur=18;ctx.fillText("STRIKE!",W/2,H*.34);ctx.shadowBlur=0;ctx.font="800 13px sans-serif";ctx.fillStyle="#fff";ctx.fillText("CLICK / SPACE NOW",W/2,H*.38);}
function meter(ctx,x,y,w,h,pct,fill,label,value){ctx.fillStyle="rgba(5,12,17,.72)";rr(ctx,x-2,y-2,w+4,h+4,5);ctx.fill();ctx.fillStyle="#263740";rr(ctx,x,y,w,h,3);ctx.fill();ctx.fillStyle=fill;rr(ctx,x,y,w*clamp(pct,0,1),h,3);ctx.fill();ctx.fillStyle="#fff";ctx.textAlign="left";ctx.font="800 9px sans-serif";ctx.fillText(label,x,y-5);ctx.textAlign="right";ctx.fillText(value,x+w,y-5);}
function drawFightHud(ctx,s,W,H){
  const f=s.fish,combat=s.combat,bw=Math.min(430,W*.47),x=W/2-bw/2;meter(ctx,x,H*.10,bw,14,s.fishHp/s.maxFishHp,"#e5c353","FISH STAMINA",`${fmt(s.fishHp)} / ${fmt(s.maxFishHp)}`);
  const tensionPct=s.tension/combat.tension;meter(ctx,x,H*.16,bw,14,tensionPct,tensionPct>.9?"#ed6461":tensionPct>.72?"#f0c45d":"#65c99d","LINE TENSION",`${Math.round(s.tension)} / ${Math.round(combat.tension)}`);ctx.fillStyle="rgba(255,255,255,.25)";ctx.fillRect(x+bw*.78,H*.16,bw*.15,14);
  meter(ctx,x,H*.22,bw*.48,11,s.power/100,"#6ab6ee","POWER",`${Math.round(s.power)}%`);meter(ctx,x+bw*.52,H*.22,bw*.48,11,s.fever/100,"#e982d8","FEVER",s.feverTime>0?`${s.feverTime.toFixed(1)}s`:`${Math.round(s.fever)}%`);
  ctx.textAlign="center";ctx.fillStyle=RARITY_COLORS[f.stars];ctx.font="1000 13px sans-serif";ctx.fillText(`${"★".repeat(f.stars)} ${f.name} · ${s.weight.toFixed(2)} kg`,W/2,H*.29);ctx.fillStyle="#dce9ed";ctx.font="800 11px sans-serif";ctx.fillText(`${s.fishMode.toUpperCase()} · distance ${Math.round(s.distance)}m / line ${combat.lineLength}m`,W/2,H*.315);if(s.jump){ctx.font="1000 30px sans-serif";ctx.fillStyle="#fff";ctx.fillText(s.jump==="left"?"← YANK LEFT":"YANK RIGHT →",W/2,H*.39);}
}
