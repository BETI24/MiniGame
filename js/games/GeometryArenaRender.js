import { CLASSES, COLORS, DIFFICULTIES, TALENTS, UPGRADE_RARITIES, getClassById, getColorById, getDifficulty } from './GeometryArenaData.js';
import { classUnlocked, talentCost, stageLabel, difficultyIndex, nextDifficulty, clamp, buildStats } from './GeometryArenaEngine.js';

const FONT='"Segoe UI", Arial, sans-serif';
let starsCache=[];
const hexA=(hex,a)=>{if(hex.startsWith('#')&&hex.length===7){const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`}return hex};
const roundRect=(ctx,x,y,w,h,r)=>{r=Math.max(0,Math.min(Math.abs(w)/2,Math.abs(h)/2,Number.isFinite(r)?r:0));ctx.beginPath();ctx.roundRect(x,y,w,h,r);};
const text=(ctx,s,x,y,size=20,color='#fff',align='left',weight=400)=>{ctx.save();ctx.font=`${weight} ${size}px ${FONT}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(String(s),x,y);ctx.restore();};
const glowText=(ctx,s,x,y,size,color,align='center',weight=500,blur=14)=>{ctx.save();ctx.font=`${weight} ${size}px ${FONT}`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.shadowColor=color;ctx.shadowBlur=blur;ctx.fillStyle=color;ctx.fillText(String(s),x,y);ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.globalAlpha=.65;ctx.fillText(String(s),x,y);ctx.restore();};

function ensureStars(w,h){
  const needed=Math.max(260,Math.round(w*h/5200));if(starsCache.length===needed)return;
  let seed=133742;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  starsCache=Array.from({length:needed},()=>({x:rnd(),y:rnd(),r:.35+rnd()*1.45,a:.18+rnd()*.8,t:rnd()*6.28,h:rnd()}));
}
function drawStars(ctx,w,h,time=0){
  ensureStars(w,h);ctx.fillStyle='#010104';ctx.fillRect(0,0,w,h);
  for(const s of starsCache){const a=s.a*(.65+.35*Math.sin(time*.7+s.t));ctx.fillStyle=s.h>.96?`rgba(227,255,184,${a})`:`rgba(255,255,255,${a})`;ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fill();}
}

function drawLogo(ctx,cx,y,scale=1){
  ctx.save();ctx.translate(cx,y);ctx.fillStyle='#dfffc1';ctx.shadowColor='#dfffc1';ctx.shadowBlur=6*scale;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=`900 ${56*scale}px ${FONT}`;ctx.letterSpacing=`${5*scale}px`;ctx.fillText('GEOMETRY',0,0);ctx.font=`900 ${76*scale}px ${FONT}`;ctx.letterSpacing=`${8*scale}px`;ctx.fillText('ARENA',0,65*scale);
  ctx.restore();
}

function button(ctx,hotspots,label,x,y,w,h,action,{color='#dfffc1',fill='rgba(0,0,0,.42)',font=26,border=false,disabled=false,hotkey=''}={}){
  ctx.save();if(border){ctx.shadowColor=color;ctx.shadowBlur=10;ctx.strokeStyle=color;ctx.lineWidth=2;ctx.fillStyle=fill;roundRect(ctx,x,y,w,h,1);ctx.fill();ctx.stroke();}else{ctx.fillStyle=fill;roundRect(ctx,x,y,w,h,2);ctx.fill();}
  text(ctx,label,x+w/2,y+h/2,font,disabled?'#707070':color,'center',400);if(hotkey)text(ctx,hotkey,x+w-9,y+11,11,disabled?'#555':'#a7b2ff','right',500);ctx.restore();if(!disabled)hotspots.push({x,y,w,h,action});
}

function drawClassGlyph(ctx,id,x,y,s,color,rot=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.strokeStyle=color;ctx.fillStyle=hexA(color,.23);ctx.lineWidth=Math.max(2,s*.08);ctx.lineJoin='miter';ctx.shadowColor=color;ctx.shadowBlur=s*.32;
  const poly=(pts,fill=true)=>{ctx.beginPath();pts.forEach((p,i)=>(i?ctx.lineTo(...p):ctx.moveTo(...p)));ctx.closePath();if(fill)ctx.fill();ctx.stroke();};
  switch(id){
    case 'soldier': poly([[-s*.42,-s*.28],[s*.52,0],[-s*.42,s*.28],[-s*.18,0]]);break;
    case 'cannon': ctx.fillRect(-s*.38,-s*.22,s*.46,s*.44);ctx.strokeRect(-s*.38,-s*.22,s*.46,s*.44);ctx.fillRect(-s*.02,-s*.08,s*.55,s*.16);ctx.strokeRect(-s*.02,-s*.08,s*.55,s*.16);break;
    case 'ranger': poly([[-s*.5,0],[s*.15,-s*.35],[s*.15,-s*.13],[s*.5,-s*.13],[s*.5,s*.13],[s*.15,s*.13],[s*.15,s*.35]]);break;
    case 'summoner': ctx.beginPath();ctx.arc(0,0,s*.22,0,6.28);ctx.fill();ctx.stroke();for(let i=0;i<3;i++){const a=i*2.094;ctx.beginPath();ctx.arc(Math.cos(a)*s*.42,Math.sin(a)*s*.42,s*.09,0,6.28);ctx.fill();ctx.stroke();}break;
    case 'core': ctx.beginPath();ctx.arc(0,0,s*.42,0,6.28);ctx.stroke();ctx.beginPath();ctx.arc(0,0,s*.21,0,6.28);ctx.fill();ctx.stroke();for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.strokeRect(s*.25,-s*.08,s*.27,s*.16);}break;
    case 'swordmaster': for(let i=0;i<3;i++){ctx.rotate(2.094);poly([[0,-s*.48],[s*.10,-s*.08],[0,s*.12],[-s*.10,-s*.08]]);}break;
    case 'tornado': for(let i=0;i<3;i++){ctx.rotate(2.094);poly([[0,0],[s*.48,-s*.12],[s*.34,s*.12]],false);}ctx.beginPath();ctx.arc(0,0,s*.12,0,6.28);ctx.fill();break;
    case 'prism': poly([[0,-s*.48],[s*.43,s*.28],[-s*.43,s*.28]]);ctx.beginPath();ctx.moveTo(0,-s*.35);ctx.lineTo(0,s*.2);ctx.stroke();break;
    case 'shotgun': for(let i=-2;i<=2;i++){const a=i*.18;ctx.save();ctx.rotate(a);ctx.fillRect(0,-s*.05,s*.48,s*.1);ctx.strokeRect(0,-s*.05,s*.48,s*.1);ctx.restore();}ctx.beginPath();ctx.arc(-s*.1,0,s*.16,0,6.28);ctx.fill();ctx.stroke();break;
    case 'magician': ctx.beginPath();ctx.arc(0,0,s*.25,0,6.28);ctx.fill();ctx.stroke();for(let i=0;i<4;i++){const a=i*Math.PI/2+.7;ctx.beginPath();ctx.arc(Math.cos(a)*s*.45,Math.sin(a)*s*.45,s*.06,0,6.28);ctx.fill();ctx.stroke();}break;
    case 'destroyer': poly([[0,-s*.5],[s*.48,0],[0,s*.5],[-s*.48,0]]);ctx.beginPath();ctx.arc(0,0,s*.18,0,6.28);ctx.stroke();break;
    case 'sniper': poly([[-s*.48,-s*.16],[s*.15,-s*.16],[s*.48,0],[s*.15,s*.16],[-s*.48,s*.16]],true);ctx.beginPath();ctx.moveTo(-s*.05,0);ctx.lineTo(s*.58,0);ctx.stroke();break;
    default: ctx.beginPath();ctx.arc(0,0,s*.3,0,6.28);ctx.fill();ctx.stroke();
  }
  ctx.restore();
}

function drawUpgradeIcon(ctx,u,x,y,s,color){
  ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.fillStyle=hexA(color,.2);ctx.shadowColor=color;ctx.shadowBlur=s*.35;ctx.lineWidth=Math.max(2,s*.055);
  const diamond=()=>{ctx.beginPath();ctx.moveTo(0,-s*.42);ctx.lineTo(s*.42,0);ctx.lineTo(0,s*.42);ctx.lineTo(-s*.42,0);ctx.closePath();ctx.fill();ctx.stroke();};
  switch(u.icon){
    case 'triangle':ctx.beginPath();ctx.moveTo(0,-s*.45);ctx.lineTo(s*.42,s*.35);ctx.lineTo(-s*.42,s*.35);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.arc(0,s*.1,s*.1,0,6.28);ctx.fill();break;
    case 'crosshair':ctx.beginPath();ctx.arc(0,0,s*.27,0,6.28);ctx.stroke();ctx.beginPath();ctx.moveTo(-s*.45,0);ctx.lineTo(s*.45,0);ctx.moveTo(0,-s*.45);ctx.lineTo(0,s*.45);ctx.stroke();break;
    case 'wheel':for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(s*.38,-s*.13);ctx.lineTo(s*.38,s*.13);ctx.closePath();ctx.stroke();}break;
    case 'amulet':ctx.beginPath();ctx.arc(0,0,s*.35,0,6.28);ctx.stroke();diamond();break;
    case 'burst':for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(s*.12,0);ctx.lineTo(s*.48,0);ctx.stroke();}ctx.beginPath();ctx.arc(0,0,s*.17,0,6.28);ctx.fill();break;
    case 'mine':ctx.beginPath();ctx.arc(0,0,s*.33,0,6.28);ctx.stroke();for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(s*.34,0);ctx.lineTo(s*.47,0);ctx.stroke();}break;
    case 'split':ctx.beginPath();ctx.moveTo(-s*.4,0);ctx.lineTo(0,0);ctx.lineTo(s*.38,-s*.3);ctx.moveTo(0,0);ctx.lineTo(s*.38,s*.3);ctx.stroke();break;
    case 'double':ctx.beginPath();ctx.arc(-s*.15,0,s*.18,0,6.28);ctx.arc(s*.18,0,s*.18,0,6.28);ctx.stroke();break;
    case 'heart':ctx.beginPath();ctx.moveTo(0,s*.35);ctx.bezierCurveTo(-s*.6,-s*.05,-s*.35,-s*.5,0,-s*.22);ctx.bezierCurveTo(s*.35,-s*.5,s*.6,-s*.05,0,s*.35);ctx.fill();ctx.stroke();break;
    default:diamond();
  }
  ctx.restore();
}

export function arenaLayout(w,h){
  const compact=w<980||h<620;
  if(compact){
    const topHud=Math.max(54,Math.min(76,h*.10)),bottomHud=Math.max(118,Math.min(170,h*.22));
    const arena=Math.max(170,Math.min(w-18,h-topHud-bottomHud));
    const ax=(w-arena)/2,ay=Math.max(topHud,(h-arena-bottomHud+topHud)/2);
    return{ax,ay,arena,leftW:ax,rightX:ax+arena,compact,w,h,topHud,bottomHud};
  }
  const top=18,bottom=18,side=Math.max(150,Math.min(280,w*.18));
  const arena=Math.max(260,Math.min(h-top-bottom,w-side*2-44));
  const ax=(w-arena)/2,ay=(h-arena)/2;
  return{ax,ay,arena,leftW:ax,rightX:ax+arena,compact:false,w,h,topHud:0,bottomHud:0};
}

function arenaColor(run){const palette=['#79dfff','#66ffb2','#ee74ff','#dcff70','#7cd8ff'];return palette[((run.stageMajor-1)*5+run.stageMinor-1)%palette.length];}
function drawArenaFrame(ctx,lay,color,time,light=4){
  const {ax,ay,arena}=lay;ctx.save();ctx.fillStyle='rgba(0,0,0,.15)';ctx.fillRect(ax,ay,arena,arena);
  const levels=Math.max(1,Math.min(5,light));for(let i=levels;i>=1;i--){ctx.shadowColor=color;ctx.shadowBlur=i*8;ctx.strokeStyle=hexA(color,.13+i*.15);ctx.lineWidth=1.2+i*.75;ctx.strokeRect(ax+2,ay+2,arena-4,arena-4);}ctx.shadowBlur=0;ctx.strokeStyle='#fff';ctx.globalAlpha=.55;ctx.lineWidth=1;ctx.strokeRect(ax+4,ay+4,arena-8,arena-8);
  const grad=ctx.createRadialGradient(ax+arena/2,ay+arena/2,0,ax+arena/2,ay+arena/2,arena*.7);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(1,hexA(color,.035));ctx.fillStyle=grad;ctx.fillRect(ax,ay,arena,arena);ctx.restore();
}
const toScreen=(lay,x,y)=>({x:lay.ax+x/1000*lay.arena,y:lay.ay+y/1000*lay.arena,s:lay.arena/1000});

function enemyPath(ctx,shape,x,y,r,rot){
  ctx.beginPath();ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);
  if(shape==='triangle'){ctx.moveTo(r,0);ctx.lineTo(-r*.7,-r*.7);ctx.lineTo(-r*.7,r*.7);ctx.closePath();}
  else if(shape==='square'){ctx.rect(-r*.7,-r*.7,r*1.4,r*1.4);}
  else if(shape==='diamond'){ctx.moveTo(0,-r);ctx.lineTo(r,0);ctx.lineTo(0,r);ctx.lineTo(-r,0);ctx.closePath();}
  else if(shape==='cross'){const q=r*.34;ctx.moveTo(-q,-r);ctx.lineTo(q,-r);ctx.lineTo(q,-q);ctx.lineTo(r,-q);ctx.lineTo(r,q);ctx.lineTo(q,q);ctx.lineTo(q,r);ctx.lineTo(-q,r);ctx.lineTo(-q,q);ctx.lineTo(-r,q);ctx.lineTo(-r,-q);ctx.lineTo(-q,-q);ctx.closePath();}
  else if(shape==='ring'||shape==='circle'){ctx.arc(0,0,r,0,6.28);}
  else if(shape==='boss'){for(let i=0;i<12;i++){const a=i*Math.PI/6,rr=i%2?r*.68:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();}
  ctx.restore();
}

function drawWorld(ctx,world,lay,time){
  const col=world.colorDef.hex,scale=lay.arena/1000,light=world.profile.settings.light||4;ctx.save();ctx.beginPath();ctx.rect(lay.ax,lay.ay,lay.arena,lay.arena);ctx.clip();
  const shake=world.profile.settings.screenShake?world.shake:0;ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  ctx.globalCompositeOperation='lighter';
  for(const r of world.rings){const p=toScreen(lay,r.x,r.y),a=clamp(r.life/r.maxLife,0,1);ctx.strokeStyle=hexA(r.color,a*.85);ctx.lineWidth=Math.max(.8,r.width*scale);ctx.shadowColor=r.color;ctx.shadowBlur=light>=4?12:5;ctx.beginPath();ctx.arc(p.x,p.y,r.r*scale,0,6.28);ctx.stroke();}
  for(const l of world.lines){const a=clamp(l.life/l.maxLife,0,1),p1=toScreen(lay,l.x1,l.y1),p2=toScreen(lay,l.x2,l.y2);ctx.strokeStyle=hexA(l.color,a);ctx.lineWidth=Math.max(1,l.width*scale);ctx.shadowColor=l.color;ctx.shadowBlur=light>=4?10:3;ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();}
  const parts=world.particles,start=Math.max(0,parts.length-(light>=4?1500:900));ctx.shadowBlur=0;
  for(let i=start;i<parts.length;i++){const p0=parts[i],p=toScreen(lay,p0.x,p0.y),a=clamp(p0.life/p0.maxLife,0,1);ctx.fillStyle=hexA(p0.color,a);if(p0.kind==='poly'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p0.rot);ctx.fillRect(-p0.size*scale,-p0.size*.4*scale,p0.size*2*scale,p0.size*.8*scale);ctx.restore();}else{ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.6,p0.size*scale),0,6.28);ctx.fill();}}
  ctx.shadowBlur=0;ctx.globalCompositeOperation='source-over';
  for(const m of world.mines){const p=toScreen(lay,m.x,m.y);ctx.save();ctx.strokeStyle=m.color;ctx.lineWidth=2;ctx.shadowColor=m.color;ctx.shadowBlur=light>=3?10:3;ctx.beginPath();ctx.arc(p.x,p.y,m.r*scale,0,6.28);ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,m.r*.35*scale,0,6.28);ctx.fillStyle=hexA(m.color,.28);ctx.fill();ctx.restore();}
  for(const a of world.pickups){const p=toScreen(lay,a.x,a.y);ctx.save();ctx.shadowColor=a.type==='coin'?'#eaff77':'#fff';ctx.shadowBlur=light>=3?10:2;ctx.fillStyle=a.type==='coin'?'#eaff77':'#fff';if(a.type==='fragment'){ctx.fillRect(p.x-3,p.y-3,6,6);ctx.fillRect(p.x+5,p.y-1,4,4)}else{ctx.beginPath();ctx.arc(p.x,p.y,5.5,0,6.28);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();}ctx.restore();}
  for(const e of world.enemies){const p=toScreen(lay,e.x,e.y),r=e.radius*scale;ctx.save();ctx.shadowColor=e.color;ctx.shadowBlur=(light>=4?(e.boss?20:9):3)*(e.elite?1.25:1);ctx.lineWidth=Math.max(1,(e.boss?4:e.elite?3:2)*scale);ctx.strokeStyle=e.hit>0?'#fff':e.color;ctx.fillStyle=hexA(e.color,e.elite?.18:.08);enemyPath(ctx,e.shape,p.x,p.y,r,e.rot);ctx.fill();ctx.stroke();if(e.shape==='ring'){ctx.beginPath();ctx.arc(p.x,p.y,r*.55,0,6.28);ctx.stroke();}if(e.elite&&!e.boss){ctx.beginPath();ctx.arc(p.x,p.y,r*1.35,0,6.28);ctx.strokeStyle=hexA(e.color,.35);ctx.lineWidth=1;ctx.stroke();}ctx.restore();}
  ctx.globalCompositeOperation='lighter';ctx.shadowBlur=light>=4?9:3;
  for(const b of world.enemyBullets){const p=toScreen(lay,b.x,b.y);ctx.fillStyle=b.color;ctx.shadowColor=b.color;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(1,b.r*scale),0,6.28);ctx.fill();}
  for(const b of world.bullets){const p=toScreen(lay,b.x,b.y),pp=toScreen(lay,b.px,b.py);ctx.strokeStyle=hexA(b.color,.78);ctx.lineWidth=Math.max(1.1,b.r*.7*scale);ctx.shadowColor=b.color;ctx.shadowBlur=light>=4?(b.heavy?16:8):2;ctx.beginPath();ctx.moveTo(pp.x,pp.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.fillStyle=b.crit?'#fff6aa':b.color;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.8,b.r*scale),0,6.28);ctx.fill();}
  ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;
  const pp=toScreen(lay,world.player.x,world.player.y);for(const m of world.minions){const p=toScreen(lay,m.x,m.y);ctx.save();ctx.strokeStyle=col;ctx.fillStyle=hexA(col,.2);ctx.shadowColor=col;ctx.shadowBlur=light>=3?8:2;if(m.type==='blade'){ctx.translate(p.x,p.y);ctx.rotate(m.angle+Math.PI/2);ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(4,6);ctx.lineTo(0,11);ctx.lineTo(-4,6);ctx.closePath();ctx.fill();ctx.stroke();}else{ctx.beginPath();ctx.arc(p.x,p.y,6,0,6.28);ctx.fill();ctx.stroke();}ctx.restore();}
  const p=world.player;ctx.save();ctx.globalAlpha=p.invuln>0?.45+.35*Math.sin(time*30):1;drawClassGlyph(ctx,world.classDef.id,pp.x,pp.y,Math.max(12,34*scale),col,world.classDef.id==='tornado'?p.spin:p.angle);ctx.restore();
  for(const t of world.texts){const p2=toScreen(lay,t.x,t.y),a=clamp(t.life/t.maxLife,0,1);text(ctx,t.text,p2.x,p2.y,Math.max(10,t.size*scale),hexA(t.color,a),'center',600);}
  ctx.restore();
  if(world.flash>0){ctx.save();ctx.globalAlpha=clamp(world.flash*1.8,0,.35);ctx.fillStyle=world.flashColor;ctx.fillRect(lay.ax,lay.ay,lay.arena,lay.arena);ctx.restore();}
}

function drawStats(ctx,run,world,lay){
  const s=run.stats;
  if(lay.compact){
    const y=lay.ay+lay.arena+16,size=Math.max(11,Math.min(15,lay.w/34));
    const vals=[['DPS',world?world.dps:0,1],['HP',`${Math.max(0,s.hp).toFixed(0)}/${s.hpMax.toFixed(0)}`,'raw'],['DMG',s.damage,1],['Fire',s.fireRate,1],['Move',s.move,1],['Crit',`${Math.round(s.crit*100)}%`,'raw']];
    const cols=3,cell=lay.w/cols;
    vals.forEach((v,i)=>{const x=(i%cols)*cell+cell/2,yy=y+Math.floor(i/cols)*24;const val=v[2]==='raw'?v[1]:Number(v[1]).toFixed(v[2]);text(ctx,`${v[0]}  ${val}`,x,yy,size,'#ddd','center');});
    return;
  }
  const x=Math.max(20,lay.ax-285),y=lay.ay+lay.arena*.53,size=Math.max(15,Math.min(21,lay.arena*.026));
  const vals=[['DPS',world?world.dps:0,1],['HP Max',s.hpMax,0],['Move Speed',s.move,1],['Fire Rate',s.fireRate,1],['Bullet Damage',s.damage,1],['Bullet Speed',s.bulletSpeed,1],['Range',s.range,1],['Body Size',s.bodySize*100,'pct'],['Bullet Size',s.bulletSize*100,'pct'],['Critical Rate',s.crit*100,'pct'],['Critical Effect',s.critEffect*100,'pct'],['Accuracy',s.accuracy*100,'pct'],['Recoil',s.recoil*100,'pct'],['Knockback',s.knockback*100,'pct']];
  vals.forEach((v,i)=>{const yy=y+i*size*1.38;let val=v[2]==='pct'?`${Math.round(v[1])}%`:Number(v[1]).toLocaleString('en-US',{maximumFractionDigits:v[2]||0});text(ctx,v[0],x,yy,size,'#ddd','left',400);text(ctx,val,x+210,yy,size,'#ddd','right',400)});
}

function drawRunRight(ctx,hotspots,run,world,lay,mode){
  const auto=!!world?.profile.settings.autoFire;
  const remaining=world&&mode==='battle'?Math.max(0,(world.waveTarget-world.spawnedEnemies)+world.enemies.length+(world.bossStage&&!world.spawnBoss?1:0)):0;
  const total=world&&mode==='battle'?Math.max(1,world.waveTarget+(world.bossStage?1:0)):1;
  const progress=world&&mode==='battle'?clamp(1-remaining/total,0,1):0;
  if(lay.compact){
    const fs=Math.max(13,Math.min(19,lay.w/28));
    text(ctx,`Level ${stageLabel(run)} · ${mode==='battle'?'Attack':'Prepare'}`,12,24,fs,'#eee','left');
    text(ctx,`${Math.round(run.stars)} ★   ${Math.round(run.fragments)} ◧`,lay.w/2,24,fs*.9,'#eee','center');
    button(ctx,hotspots,auto?'AUTO [F] ✓':'AUTO [F] □',lay.w-120,7,110,34,'toggleAutoFire',{color:auto?'#9dffb0':'#ddd',fill:'rgba(0,0,0,.45)',font:fs*.72,border:auto});
    if(mode==='battle'){
      ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.strokeRect(lay.ax,lay.ay-18,lay.arena,7);ctx.fillStyle='#fff';ctx.fillRect(lay.ax+2,lay.ay-16,(lay.arena-4)*progress,3);text(ctx,remaining?`${remaining} enemies remaining`:'Arena clear',lay.w/2,lay.ay-30,fs*.72,remaining?'#ddd':'#baffb7','center');
    }else{
      const y=lay.h-52,gap=6,bw=(lay.w-24-gap*2)/3;
      button(ctx,hotspots,'Store [Q]',6,y,bw,40,'store',{color:'#eee',fill:'rgba(0,0,0,.35)',font:fs*.78});
      button(ctx,hotspots,'Challenge [E]',12+bw,y,bw,40,'challenge',{color:'#eee',fill:'rgba(0,0,0,.35)',font:fs*.72});
      button(ctx,hotspots,'Fight [G]',18+bw*2,y,bw,40,'goFight',{color:'#dfffc1',fill:'rgba(0,0,0,.4)',font:fs*.82,border:true});
    }
    return;
  }
  const x=lay.rightX+Math.max(20,(lay.w-lay.rightX-250)/2),cx=x+105,top=lay.ay+34,size=Math.max(20,lay.arena*.038);
  text(ctx,`Level ${stageLabel(run)}`,cx,top,size,'#eee','center',400);text(ctx,mode==='battle'?'Attack Phase':'Prepare Phase',cx,top+56,size*.9,'#eee','center',400);
  if(mode==='battle'){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(cx-55,top+91,110,9);ctx.fillStyle='#fff';ctx.fillRect(cx-53,top+93,106*progress,5);text(ctx,remaining?`${remaining} remaining`:'Arena clear',cx,top+118,size*.5,remaining?'#bbb':'#baffb7','center');}
  text(ctx,`${Math.round(run.stars)} ★`,cx,top+155,size*.72,'#f5f5f5','center',400);text(ctx,`${Math.round(run.fragments)} ◧`,cx,top+205,size*.72,'#f5f5f5','center',400);
  button(ctx,hotspots,auto?'Auto Fire [F]  ☑':'Auto Fire [F]  □',cx-102,top+255,204,40,'toggleAutoFire',{color:auto?'#9dffb0':'#ddd',fill:'rgba(0,0,0,.16)',font:size*.58,border:auto});
  if(mode!=='battle'){
    button(ctx,hotspots,'Store [Q]',cx-90,top+325,180,42,'store',{color:'#eee',fill:'rgba(0,0,0,.15)',font:size*.72});
    button(ctx,hotspots,'Challenge [E]',cx-105,top+392,210,42,'challenge',{color:'#eee',fill:'rgba(0,0,0,.15)',font:size*.72});
    button(ctx,hotspots,'Go Fight [G]',cx-95,top+462,190,48,'goFight',{color:'#dfffc1',fill:'rgba(0,0,0,.25)',font:size*.74,border:true});
  }
}

export function renderGameplay(ctx,w,h,state){
  const hotspots=[];drawStars(ctx,w,h,state.time||0);const lay=arenaLayout(w,h),run=state.run,world=state.world,color=arenaColor(run);drawArenaFrame(ctx,lay,color,state.time||0,state.profile.settings.light);if(world)drawWorld(ctx,world,lay,state.time||0);drawStats(ctx,run,world,lay);drawRunRight(ctx,hotspots,run,world,lay,state.mode);
  if(!lay.compact){const bx=lay.ax-245,by=lay.ay+35,maxBars=Math.min(18,Math.ceil(run.stats.hpMax));for(let i=0;i<maxBars;i++){ctx.fillStyle=i<Math.ceil(run.stats.hp)?'#ff616d':'#371418';ctx.fillRect(bx+i*18,by,13,28)}}
  else{const hp=clamp(run.stats.hp/run.stats.hpMax,0,1);ctx.fillStyle='#30131a';ctx.fillRect(lay.ax,lay.ay-9,Math.min(lay.arena*.32,180),5);ctx.fillStyle='#ff616d';ctx.fillRect(lay.ax,lay.ay-9,Math.min(lay.arena*.32,180)*hp,5);}
  if(world?.boss){const p=world.boss.hp/world.boss.maxHp;text(ctx,'BOSS',lay.ax+lay.arena/2,lay.ay+27,Math.max(11,15*lay.arena/700),'#fff','center',700);ctx.fillStyle='#26131a';ctx.fillRect(lay.ax+lay.arena*.25,lay.ay+42,lay.arena*.5,8);ctx.fillStyle=world.boss.color;ctx.fillRect(lay.ax+lay.arena*.25,lay.ay+42,lay.arena*.5*p,8);}
  if(state.mode==='prepare')text(ctx,'Move and test-fire freely before starting the wave',lay.ax+lay.arena/2,lay.ay+lay.arena-16,Math.max(10,lay.arena*.022),'rgba(255,255,255,.52)','center');
  return hotspots;
}

export function renderTitle(ctx,w,h,state){
  const hotspots=[];drawStars(ctx,w,h,state.time||0);const compact=w<760||h<560,logoScale=compact?Math.max(.38,Math.min(.62,w/800)):Math.min(1,w/1500);drawLogo(ctx,w/2,h*(compact?.15:.17),logoScale);const centerY=h*(compact?.45:.52),mainFont=compact?27:34;
  button(ctx,hotspots,'Start',w/2-(compact?85:105),centerY-26,compact?170:210,50,'start',{color:'#dfffc1',fill:'transparent',font:mainFont});
  const subY=centerY+(compact?72:105),small=compact?17:24;button(ctx,hotspots,'Manual',w/2-(compact?100:122),subY,compact?92:112,36,'manual',{color:'#dfffc1',fill:'transparent',font:small});button(ctx,hotspots,'Updates',w/2+8,subY,compact?92:120,36,'updates',{color:'#dfffc1',fill:'transparent',font:small});button(ctx,hotspots,'Settings',w/2-(compact?100:122),subY+44,compact?92:112,36,'settings',{color:'#dfffc1',fill:'transparent',font:small});button(ctx,hotspots,'Quit',w/2+8,subY+44,compact?92:120,36,'quit',{color:'#dfffc1',fill:'transparent',font:small});
  const sideX=compact?18:Math.max(90,w*.11),sideY=compact?h-116:h*.73;button(ctx,hotspots,'Library',sideX,sideY,compact?105:150,32,'library',{color:'#eee',fill:'transparent',font:compact?15:21});button(ctx,hotspots,'Leaderboard',sideX,sideY+34,compact?120:170,32,'leaderboard',{color:'#eee',fill:'transparent',font:compact?15:21});button(ctx,hotspots,'Credits',sideX,sideY+68,compact?95:140,32,'credits',{color:'#eee',fill:'transparent',font:compact?15:21});
  text(ctx,'English',w-18,h-34,compact?14:20,'#eee','right');text(ctx,'Browser V2',compact?18:Math.max(80,w*.11),h-18,compact?12:18,'#ddd');return hotspots;
}

function smallPanel(ctx,x,y,w,h,title){ctx.save();ctx.strokeStyle='#e4e4e4';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);ctx.fillStyle='rgba(8,8,8,.38)';ctx.fillRect(x,y,w,h);ctx.fillStyle='rgba(255,255,255,.92)';ctx.fillRect(x+3,y+3,w-6,36);text(ctx,title,x+w/2,y+21,22,'#111','center',400);ctx.restore();}

export function renderLoadout(ctx,w,h,state){
  const hotspots=[];drawStars(ctx,w,h,state.time||0);const profile=state.profile,selected=getClassById(profile.selectedClass),selectedCol=getColorById(profile.selectedColor);const compact=w<1000||h<650;
  const hov=state.hovered||{},hoverClass=hov.hoverKind==='class'?getClassById(hov.hoverValue):selected,hoverColor=hov.hoverKind==='color'?getColorById(hov.hoverValue):selectedCol;
  const preview=buildStats(profile,hoverClass.id,hoverColor.id),base=state.previewStats;
  if(compact){
    drawLogo(ctx,82,30,.24);text(ctx,`★ ${Math.round(profile.totalStars).toLocaleString('en-US')}   ◧ ${Math.round(profile.fragments).toLocaleString('en-US')}`,w-12,22,14,'#eee','right');
    const pad=10,top=52,pw=w-20;smallPanel(ctx,pad,top,pw,112,'Classes');const cols=6,cw=(pw-18)/cols,ch=34;
    CLASSES.forEach((c,i)=>{const x=pad+8+(i%cols)*cw,y=top+43+Math.floor(i/cols)*ch,un=classUnlocked(profile,c);ctx.fillStyle=c.id===selected.id?hexA(selectedCol.hex,.18):'rgba(255,255,255,.05)';ctx.fillRect(x,y,cw-4,ch-4);ctx.strokeStyle=c.id===selected.id?selectedCol.hex:'#303030';ctx.strokeRect(x,y,cw-4,ch-4);if(un)drawClassGlyph(ctx,c.id,x+(cw-4)/2,y+(ch-4)/2,Math.min(15,cw*.26),c.id===selected.id?selectedCol.hex:'#ddd');else text(ctx,'×',x+(cw-4)/2,y+(ch-4)/2,15,'#777','center');hotspots.push({x,y,w:cw-4,h:ch-4,action:un?'selectClass':null,value:c.id,hoverKind:'class',hoverValue:c.id});});
    const colorY=top+120;smallPanel(ctx,pad,colorY,pw,82,'Colors');const ccw=(pw-20)/12;COLORS.forEach((c,i)=>{const x=pad+10+i*ccw,y=colorY+45;ctx.fillStyle=c.hex;ctx.globalAlpha=c.id===selectedCol.id?1:.55;ctx.fillRect(x+2,y,Math.max(12,ccw-5),24);ctx.globalAlpha=1;ctx.strokeStyle=c.id===selectedCol.id?'#fff':'#333';ctx.strokeRect(x+2,y,Math.max(12,ccw-5),24);hotspots.push({x,y:y-4,w:Math.max(14,ccw-2),h:32,action:'selectColor',value:c.id,hoverKind:'color',hoverValue:c.id});});
    const midY=colorY+92,leftW=w*.46,rightX=leftW+8;smallPanel(ctx,pad,midY,leftW-16,190,'Preview');drawClassGlyph(ctx,hoverClass.id,pad+(leftW-16)/2,midY+92,48,hoverColor.hex,state.time*.3*(hoverClass.id==='tornado'?1:0));text(ctx,hoverClass.name,pad+(leftW-16)/2,midY+142,18,'#eee','center',500);wrapText(ctx,hoverClass.desc,pad+12,midY+158,leftW-40,15,12,'#bbb');
    smallPanel(ctx,rightX,midY,w-rightX-pad,190,hov.hoverKind?'Hover Stats':'Stats');const rows=[['HP',preview.hpMax,base.hpMax],['Move',preview.move,base.move],['Fire',preview.fireRate,base.fireRate],['Damage',preview.damage,base.damage],['Speed',preview.bulletSpeed,base.bulletSpeed],['Range',preview.range,base.range],['Crit',preview.crit*100,base.crit*100]];rows.forEach((r,i)=>{const yy=midY+49+i*19,d=r[1]-r[2],c=Math.abs(d)<.001?'#ddd':d>0?'#82ff90':'#ff8f96';text(ctx,r[0],rightX+12,yy,12,'#ccc');text(ctx,r[0]==='Crit'?`${Math.round(r[1])}%`:r[1].toFixed(1),w-pad-12,yy,12,c,'right');});
    const ty=midY+200,th=Math.max(112,h-ty-65);smallPanel(ctx,pad,ty,pw,th,'Talents');const tl=profile.talents[selected.id];TALENTS.forEach((t,i)=>{const col=i%2,row=Math.floor(i/2),x=pad+12+col*(pw/2),yy=ty+48+row*25,lv=tl[t.id]||0,cost=talentCost(t,lv);text(ctx,`${t.name}  Lv${lv}`,x,yy,12,'#ddd');text(ctx,lv>=t.max?'MAX':`${cost}  +`,x+pw/2-28,yy,12,profile.totalStars>=cost&&lv<t.max?'#fff':'#666','right');if(lv<t.max)hotspots.push({x:x+pw/2-60,y:yy-11,w:45,h:22,action:'buyTalent',value:t.id});});
    button(ctx,hotspots,'Start',w/2-92,h-50,86,38,'beginRun',{color:'#dfffc1',fill:'rgba(0,0,0,.35)',font:18,border:true});button(ctx,hotspots,'Return',w/2+6,h-50,86,38,'returnTitle',{color:'#eee',fill:'rgba(0,0,0,.2)',font:17});return hotspots;
  }
  drawLogo(ctx,150,58,.42);const left=22,top=96,pw=Math.min(390,w*.27);smallPanel(ctx,left,top,pw,238,'Classes');const cw=(pw-26)/4,ch=51;
  CLASSES.forEach((c,i)=>{const x=left+8+(i%4)*cw,y=top+48+Math.floor(i/4)*ch,un=classUnlocked(profile,c);ctx.fillStyle=c.id===selected.id?hexA(selectedCol.hex,.18):'rgba(255,255,255,.05)';ctx.fillRect(x,y,cw-5,ch-5);ctx.strokeStyle=c.id===selected.id?selectedCol.hex:'#303030';ctx.strokeRect(x,y,cw-5,ch-5);if(un)drawClassGlyph(ctx,c.id,x+(cw-5)/2,y+(ch-5)/2,22,c.id===selected.id?selectedCol.hex:'#ddd');else text(ctx,'🔒',x+(cw-5)/2,y+22,16,'#aaa','center');hotspots.push({x,y,w:cw-5,h:ch-5,action:un?'selectClass':null,value:c.id,hoverKind:'class',hoverValue:c.id});});
  smallPanel(ctx,left,top+252,pw,224,'Colors');COLORS.forEach((c,i)=>{const x=left+10+(i%4)*cw,y=top+300+Math.floor(i/4)*52;ctx.fillStyle=c.hex;ctx.globalAlpha=c.id===selectedCol.id?1:.45;ctx.fillRect(x+7,y+5,cw-20,34);ctx.globalAlpha=1;ctx.strokeStyle=c.id===selectedCol.id?'#fff':'#353535';ctx.lineWidth=c.id===selectedCol.id?2:1;ctx.strokeRect(x+7,y+5,cw-20,34);hotspots.push({x,y,w:cw-5,h:44,action:'selectColor',value:c.id,hoverKind:'color',hoverValue:c.id});});
  const talentY=top+490;smallPanel(ctx,left,talentY,pw,Math.min(330,h-talentY-18),'Talents');const tl=profile.talents[selected.id];TALENTS.forEach((t,i)=>{const yy=talentY+54+i*31,lv=tl[t.id]||0,cost=talentCost(t,lv);text(ctx,t.name,left+12,yy,16,'#ddd');text(ctx,`Level ${lv}`,left+145,yy,16,'#ddd');text(ctx,lv>=t.max?'MAX':cost,left+235,yy,15,'#ddd','right');text(ctx,'+',left+pw-24,yy,24,profile.totalStars>=cost&&lv<t.max?'#fff':'#666','center');if(lv<t.max)hotspots.push({x:left+pw-47,y:yy-14,w:42,h:28,action:'buyTalent',value:t.id});});
  const cx=w*.52,cy=h*.49;drawClassGlyph(ctx,hoverClass.id,cx,cy,92,hoverColor.hex,state.time*.35*(hoverClass.id==='tornado'?1:0));text(ctx,hoverClass.name,cx,cy+105,26,'#eee','center',400);text(ctx,hoverClass.desc,cx,cy+139,16,'#bbb','center',400);text(ctx,hoverColor.name+' · '+hoverColor.desc,cx,cy+167,15,hoverColor.hex,'center',500);if(!classUnlocked(profile,hoverClass))text(ctx,`Unlock at ${hoverClass.unlock.toLocaleString('en-US')} lifetime stars`,cx,cy+194,14,'#ffb0b0','center');
  button(ctx,hotspots,'Start',cx-105,cy+215,210,54,'beginRun',{color:'#eee',fill:'transparent',font:31});button(ctx,hotspots,'Return',cx-105,cy+290,210,50,'returnTitle',{color:'#eee',fill:'transparent',font:29});
  const right=w-Math.min(420,w*.28)-22,rw=Math.min(420,w*.28);smallPanel(ctx,right,top,rw,250,hov.hoverKind?'Hover Preview':'Stats');const rows=[['HP Max',preview.hpMax,base.hpMax,'n'],['Move Speed',preview.move,base.move,'n'],['Fire Rate',preview.fireRate,base.fireRate,'n'],['Bullet Damage',preview.damage,base.damage,'n'],['Bullet Speed',preview.bulletSpeed,base.bulletSpeed,'n'],['Range',preview.range,base.range,'n'],['Critical Rate',preview.crit*100,base.crit*100,'p'],['Accuracy',preview.accuracy*100,base.accuracy*100,'p']];rows.forEach((r,i)=>{const yy=top+55+i*23,d=r[1]-r[2],color=Math.abs(d)<.001?'#ddd':d>0?'#82ff90':'#ff8f96';text(ctx,r[0],right+24,yy,15,'#ddd');text(ctx,r[3]==='p'?`${Math.round(r[1])}%`:r[1].toFixed(r[0]==='HP Max'?0:1),right+rw-24,yy,15,color,'right')});
  smallPanel(ctx,right,top+265,rw,205,'Class Skill');text(ctx,hoverClass.skill,right+rw/2,top+322,24,hoverColor.hex,'center',500);wrapText(ctx,hoverClass.skillDesc,right+24,top+355,rw-48,18,15,'#ccc');text(ctx,`Proficiency  Lv ${profile.classProficiency[hoverClass.id]||0}`,right+rw/2,top+434,15,'#aaa','center');
  text(ctx,`★ ${Math.round(profile.totalStars).toLocaleString('en-US')}`,w-22,40,22,'#eee','right');text(ctx,`◧ ${Math.round(profile.fragments).toLocaleString('en-US')}`,w-22,72,19,'#eee','right');return hotspots;
}

function wrapText(ctx,s,x,y,maxW,lineH,size,color){ctx.save();ctx.font=`${size}px ${FONT}`;ctx.fillStyle=color;ctx.textAlign='left';ctx.textBaseline='top';const words=String(s).split(/\s+/);let line='',yy=y;for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxW&&line){ctx.fillText(line,x,yy);yy+=lineH;line=word}else line=test;}if(line)ctx.fillText(line,x,yy);ctx.restore();}

export function renderStore(ctx,w,h,state){
  renderGameplay(ctx,w,h,{...state,mode:'prepare'});const hotspots=[];ctx.fillStyle='rgba(0,0,0,.82)';ctx.fillRect(0,0,w,h);const run=state.run,items=run.storeRoll||[],compact=w<760||h<610;const panelW=compact?w-12:Math.min(940,w*.82),panelH=compact?h-12:Math.min(650,h*.86),x=(w-panelW)/2,y=(h-panelH)/2,col=arenaColor(run);ctx.save();ctx.shadowColor=col;ctx.shadowBlur=16;ctx.strokeStyle=hexA(col,.78);ctx.lineWidth=2;ctx.strokeRect(x,y,panelW,panelH);ctx.restore();
  text(ctx,'Upgrade Store',w/2,y+(compact?24:34),compact?24:31,'#eee','center',400);text(ctx,`${Math.round(run.fragments)} ◧`,x+panelW-18,y+(compact?24:34),compact?17:20,'#fff','right',500);
  const sideW=compact?0:170;if(!compact){text(ctx,'Unlocked',x+24,y+135,21,'#45ff54');text(ctx,'Refresh [R]',x+24,y+230,21,'#8996ff');text(ctx,`Price ${run.rerollCost} ◧`,x+24,y+265,18,'#62f5ed');button(ctx,hotspots,'Refresh',x+18,y+292,130,38,'reroll',{color:'#8996ff',fill:'transparent',font:18});}
  else button(ctx,hotspots,`Refresh [R] · ${run.rerollCost} ◧`,x+12,y+48,150,30,'reroll',{color:'#8996ff',fill:'rgba(0,0,0,.25)',font:13});
  const areaX=x+(compact?10:sideW+16),areaW=panelW-(compact?20:sideW+30),gap=compact?6:20,cardW=(areaW-gap*2)/3,cardTop=y+(compact?86:84),cardBottom=y+panelH-(compact?54:76),cardH=cardBottom-cardTop;
  items.forEach((u,i)=>{const cx=areaX+i*(cardW+gap)+cardW/2;if(!u){text(ctx,'PURCHASED',cx,cardTop+cardH*.48,compact?14:19,'#65ff89','center',600);return;}const rar=UPGRADE_RARITIES[u.rarity],afford=run.fragments>=u.cost;ctx.fillStyle=hexA(rar.color,.045);ctx.fillRect(cx-cardW/2,cardTop,cardW,cardH);ctx.strokeStyle=hexA(rar.color,.35);ctx.strokeRect(cx-cardW/2,cardTop,cardW,cardH);hotspots.push({x:cx-cardW/2,y:cardTop,w:cardW,h:cardH,action:'buyUpgrade',value:i,hoverKind:'upgrade',hoverValue:i});drawUpgradeIcon(ctx,u,cx,cardTop+(compact?48:70),compact?42:66,rar.color);text(ctx,u.name,cx,cardTop+(compact?88:128),compact?14:21,rar.color,'center',500);text(ctx,rar.name,cx,cardTop+(compact?108:158),compact?10:13,'#bbb','center');if(!compact)text(ctx,u.tags.join('   '),cx,cardTop+188,11,'#8fd983','center');wrapText(ctx,u.desc,cx-cardW*.42,cardTop+(compact?126:218),cardW*.84,compact?14:18,compact?11:14,'#ddd');text(ctx,`Price ${u.cost} ◧`,cx,cardBottom-(compact?50:58),compact?13:18,afford?'#62f5ed':'#ff7d82','center');button(ctx,hotspots,`Buy [${i+1}]`,cx-cardW*.32,cardBottom-(compact?36:43),cardW*.64,compact?28:36,'buyUpgrade',{color:afford?'#9ea7ff':'#8a555a',fill:'rgba(0,0,0,.25)',font:compact?13:19,border:afford});hotspots[hotspots.length-1].value=i;});
  if(run.storeMessageTime>0&&run.storeMessage)text(ctx,run.storeMessage,w/2,y+panelH-(compact?22:28),compact?12:15,run.storeMessage.startsWith('Need')?'#ff8b91':'#a7ffb3','center',500);
  button(ctx,hotspots,'Return [Q]',x+panelW-(compact?112:150),y+(compact?48:panelH-54),compact?100:130,compact?30:38,'closeOverlay',{color:'#eee',fill:'rgba(0,0,0,.28)',font:compact?13:19});return hotspots;
}

export function renderChallenge(ctx,w,h,state){
  renderGameplay(ctx,w,h,{...state,mode:'prepare'});let hotspots=[];ctx.fillStyle='rgba(0,0,0,.79)';ctx.fillRect(0,0,w,h);const run=state.run,current=getDifficulty(run.difficultyId),next=nextDifficulty(run.difficultyId),compact=w<760||h<620;const pw=compact?w-16:Math.min(720,w*.7),ph=compact?h-16:Math.min(620,h*.8),x=(w-pw)/2,y=(h-ph)/2;ctx.save();ctx.shadowColor='#ef6cff';ctx.shadowBlur=18;ctx.strokeStyle='#ef6cff';ctx.lineWidth=3;ctx.strokeRect(x,y,pw,ph);ctx.restore();text(ctx,'Difficulty Level',w/2,y+(compact?24:34),compact?23:30,'#eee','center');const cx1=x+pw*.27,cx2=x+pw*.73;text(ctx,'Current',cx1,y+(compact?64:90),compact?16:24,'#eee','center');text(ctx,'Next',cx2,y+(compact?64:90),compact?16:24,'#eee','center');text(ctx,current.label,cx1,y+(compact?98:145),compact?26:34,'#eee','center');text(ctx,next.label,cx2,y+(compact?98:145),compact?26:34,'#eee','center');
  const statRows=[['Enemy Number',current.enemyCount,next.enemyCount,'x'],['Fragment Drop',current.rare,next.rare,'x'],['Enemy HP',current.hp,next.hp,'x'],['Star Gain',current.star,next.star,'x'],['Elite Rate',current.elite*100,next.elite*100,'%']];const start=y+(compact?140:200),step=compact?42:42;statRows.forEach((r,i)=>{const yy=start+i*step;text(ctx,r[0],w/2,yy,compact?12:16,'#bbb','center');const a=r[3]==='%'?`${r[1].toFixed(0)}%`:`x${r[1].toFixed(1)}`,b=r[3]==='%'?`${r[2].toFixed(0)}%`:`x${r[2].toFixed(1)}`;text(ctx,a,cx1,yy+17,compact?13:17,i===2?'#ff6a6a':'#6fff65','center');text(ctx,b,cx2,yy+17,compact?13:17,i===2?'#ff6a6a':'#d4ed65','center');});
  const atMax=difficultyIndex(current.id)>=DIFFICULTIES.length-1;button(ctx,hotspots,atMax?'MAX difficulty':'Challenge next [R]',w/2-(compact?125:155),y+ph-(compact?82:110),compact?250:310,compact?36:45,'raiseDifficulty',{color:atMax?'#666':'#eee',fill:'transparent',font:compact?16:22,disabled:atMax});button(ctx,hotspots,'Return [E]',w/2-(compact?75:100),y+ph-(compact?42:60),compact?150:200,compact?32:42,'closeOverlay',{color:'#eee',fill:'transparent',font:compact?15:22});return hotspots;
}

export function renderEnd(ctx,w,h,state){
  const hotspots=[];drawStars(ctx,w,h,state.time||0);const run=state.run,col=getColorById(run.colorId).hex;drawLogo(ctx,w/2,h*.16,.65);text(ctx,state.completed?'NORMAL MODE CLEARED':'RUN OVER',w/2,h*.36,42,state.completed?'#dfff9a':'#ff7b84','center',500);text(ctx,`Reached Level ${state.completed?'4-5':stageLabel(run)}`,w/2,h*.43,24,'#ddd','center');text(ctx,`${Math.round(run.earnedStars).toLocaleString('en-US')} ★`,w/2,h*.50,34,'#fff','center');text(ctx,`${Math.round(run.kills)} kills  ·  ${Math.round(run.eliteKills)} elites  ·  ${Math.round(run.bossKills)} bosses`,w/2,h*.56,18,'#aaa','center');button(ctx,hotspots,'Play Again',w/2-130,h*.66,260,48,'playAgain',{color:col,fill:'transparent',font:28,border:true});button(ctx,hotspots,'Return',w/2-100,h*.74,200,44,'returnTitle',{color:'#eee',fill:'transparent',font:25});return hotspots;
}

export function renderSettings(ctx,w,h,state){
  const hotspots=[];drawStars(ctx,w,h,state.time||0);text(ctx,'Settings',w/2,h*.18,42,'#dfffc1','center');const p=state.profile,cy=h*.36;text(ctx,`Light Effects  ${p.settings.light}/5`,w/2,cy,24,'#eee','center');for(let i=1;i<=5;i++){button(ctx,hotspots,String(i),w/2-150+(i-1)*65,cy+38,48,42,'light',{color:i===p.settings.light?'#dfffc1':'#777',fill:'rgba(0,0,0,.3)',font:22,border:i===p.settings.light});hotspots[hotspots.length-1].value=i;}button(ctx,hotspots,`Screen Shake: ${p.settings.screenShake?'ON':'OFF'}`,w/2-145,cy+125,290,46,'toggleShake',{color:'#eee',fill:'transparent',font:23});button(ctx,hotspots,`Auto Fire: ${p.settings.autoFire?'ON':'OFF'} [F]`,w/2-145,cy+180,290,46,'toggleAutoFire',{color:p.settings.autoFire?'#9dffb0':'#eee',fill:'transparent',font:23});button(ctx,hotspots,'Return',w/2-100,cy+245,200,46,'returnTitle',{color:'#dfffc1',fill:'transparent',font:25});return hotspots;
}

export function renderSimpleInfo(ctx,w,h,state,title,lines){const hotspots=[];drawStars(ctx,w,h,state.time||0);text(ctx,title,w/2,h*.18,42,'#dfffc1','center');lines.forEach((l,i)=>text(ctx,l,w/2,h*.33+i*38,19,'#ddd','center'));button(ctx,hotspots,'Return',w/2-100,h*.75,200,46,'returnTitle',{color:'#dfffc1',fill:'transparent',font:25});return hotspots;}
