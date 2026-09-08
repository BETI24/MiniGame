import { CLASSES, COLORS, DIFFICULTIES, TALENTS, UPGRADE_RARITIES, getClassById, getColorById, getDifficulty } from './GeometryArenaData.js';
import { classUnlocked, talentCost, stageLabel, difficultyIndex, nextDifficulty, clamp } from './GeometryArenaEngine.js';

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
  const top=18,bottom=18;const side=Math.max(150,Math.min(280,w*.18));let arena=Math.min(h-top-bottom,w-side*2-44);arena=Math.max(260,arena);const ax=(w-arena)/2,ay=(h-arena)/2;return{ax,ay,arena,leftW:ax,rightX:ax+arena};
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
  const col=world.colorDef.hex,scale=lay.arena/1000;ctx.save();ctx.beginPath();ctx.rect(lay.ax,lay.ay,lay.arena,lay.arena);ctx.clip();
  const shake=world.profile.settings.screenShake?world.shake:0;ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  ctx.globalCompositeOperation='lighter';
  for(const r of world.rings){const p=toScreen(lay,r.x,r.y),a=clamp(r.life/r.maxLife,0,1);ctx.strokeStyle=hexA(r.color,a*.85);ctx.lineWidth=r.width*scale;ctx.shadowColor=r.color;ctx.shadowBlur=16;ctx.beginPath();ctx.arc(p.x,p.y,r.r*scale,0,6.28);ctx.stroke();}
  for(const l of world.lines){const a=clamp(l.life/l.maxLife,0,1),p1=toScreen(lay,l.x1,l.y1),p2=toScreen(lay,l.x2,l.y2);ctx.strokeStyle=hexA(l.color,a);ctx.lineWidth=l.width*scale;ctx.shadowColor=l.color;ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();}
  for(const p0 of world.particles){const p=toScreen(lay,p0.x,p0.y),a=clamp(p0.life/p0.maxLife,0,1);ctx.fillStyle=hexA(p0.color,a);ctx.shadowColor=p0.color;ctx.shadowBlur=8;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p0.rot);if(p0.kind==='poly'){ctx.fillRect(-p0.size*scale,-p0.size*.4*scale,p0.size*2*scale,p0.size*.8*scale)}else{ctx.beginPath();ctx.arc(0,0,p0.size*scale,0,6.28);ctx.fill();}ctx.restore();}
  ctx.shadowBlur=0;ctx.globalCompositeOperation='source-over';
  for(const m of world.mines){const p=toScreen(lay,m.x,m.y);ctx.save();ctx.strokeStyle=m.color;ctx.lineWidth=2;ctx.shadowColor=m.color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(p.x,p.y,m.r*scale,0,6.28);ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,m.r*.35*scale,0,6.28);ctx.fillStyle=hexA(m.color,.28);ctx.fill();ctx.restore();}
  for(const a of world.pickups){const p=toScreen(lay,a.x,a.y);ctx.save();ctx.shadowColor=a.type==='coin'?'#eaff77':'#fff';ctx.shadowBlur=13;ctx.fillStyle=a.type==='coin'?'#eaff77':'#fff';if(a.type==='fragment'){ctx.fillRect(p.x-3,p.y-3,6,6);ctx.fillRect(p.x+5,p.y-1,4,4)}else{ctx.beginPath();ctx.arc(p.x,p.y,5.5,0,6.28);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();}ctx.restore();}
  for(const e of world.enemies){const p=toScreen(lay,e.x,e.y),r=e.radius*scale;ctx.save();ctx.shadowColor=e.color;ctx.shadowBlur=(e.boss?24:12)*(e.elite?1.45:1);ctx.lineWidth=(e.boss?4:e.elite?3:2)*scale;ctx.strokeStyle=e.hit>0?'#fff':e.color;ctx.fillStyle=hexA(e.color,e.elite?.18:.08);enemyPath(ctx,e.shape,p.x,p.y,r,e.rot);ctx.fill();ctx.stroke();if(e.shape==='ring'){ctx.beginPath();ctx.arc(p.x,p.y,r*.55,0,6.28);ctx.stroke();}if(e.elite&&!e.boss){ctx.beginPath();ctx.arc(p.x,p.y,r*1.35,0,6.28);ctx.strokeStyle=hexA(e.color,.35);ctx.lineWidth=1;ctx.stroke();}ctx.restore();}
  ctx.globalCompositeOperation='lighter';
  for(const b of world.enemyBullets){const p=toScreen(lay,b.x,b.y);ctx.fillStyle=b.color;ctx.shadowColor=b.color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(p.x,p.y,b.r*scale,0,6.28);ctx.fill();}
  for(const b of world.bullets){const p=toScreen(lay,b.x,b.y),pp=toScreen(lay,b.px,b.py);ctx.strokeStyle=hexA(b.color,.78);ctx.lineWidth=Math.max(1.2,b.r*.7*scale);ctx.shadowColor=b.color;ctx.shadowBlur=b.heavy?22:12;ctx.beginPath();ctx.moveTo(pp.x,pp.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.fillStyle=b.crit?'#fff6aa':b.color;ctx.beginPath();ctx.arc(p.x,p.y,b.r*scale,0,6.28);ctx.fill();}
  ctx.globalCompositeOperation='source-over';
  const pp=toScreen(lay,world.player.x,world.player.y);for(const m of world.minions){const p=toScreen(lay,m.x,m.y);ctx.save();ctx.strokeStyle=col;ctx.fillStyle=hexA(col,.2);ctx.shadowColor=col;ctx.shadowBlur=10;if(m.type==='blade'){ctx.translate(p.x,p.y);ctx.rotate(m.angle+Math.PI/2);ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(4,6);ctx.lineTo(0,11);ctx.lineTo(-4,6);ctx.closePath();ctx.fill();ctx.stroke();}else{ctx.beginPath();ctx.arc(p.x,p.y,6,0,6.28);ctx.fill();ctx.stroke();}ctx.restore();}
  const p=world.player;ctx.save();ctx.globalAlpha=p.invuln>0?.45+.35*Math.sin(time*30):1;drawClassGlyph(ctx,world.classDef.id,pp.x,pp.y,34*scale,col,world.classDef.id==='tornado'?p.spin:p.angle);ctx.restore();
  for(const t of world.texts){const p2=toScreen(lay,t.x,t.y),a=clamp(t.life/t.maxLife,0,1);text(ctx,t.text,p2.x,p2.y,t.size*scale,hexA(t.color,a),'center',600);}
  ctx.restore();
  if(world.flash>0){ctx.save();ctx.globalAlpha=clamp(world.flash*1.8,0,.35);ctx.fillStyle=world.flashColor;ctx.fillRect(lay.ax,lay.ay,lay.arena,lay.arena);ctx.restore();}
}

function drawStats(ctx,run,world,lay){
  const s=run.stats,x=Math.max(20,lay.ax-285),y=lay.ay+lay.arena*.53;const size=Math.max(15,Math.min(21,lay.arena*.026));
  const vals=[['DPS',world?world.dps:0,1],['HP Max',s.hpMax,0],['Move Speed',s.move,1],['Fire Rate',s.fireRate,1],['Bullet Damage',s.damage,1],['Bullet Speed',s.bulletSpeed,1],['Range',s.range,1],['Body Size',s.bodySize*100,'pct'],['Bullet Size',s.bulletSize*100,'pct'],['Critical Rate',s.crit*100,'pct'],['Critical Effect',s.critEffect*100,'pct'],['Accuracy',s.accuracy*100,'pct'],['Recoil',s.recoil*100,'pct'],['Knockback',s.knockback*100,'pct']];
  vals.forEach((v,i)=>{const yy=y+i*size*1.38;let val=v[2]==='pct'?`${Math.round(v[1])}%`:Number(v[1]).toLocaleString('en-US',{maximumFractionDigits:v[2]||0});text(ctx,v[0],x,yy,size,'#ddd','left',400);text(ctx,val,x+210,yy,size,'#ddd','right',400)});
}

function drawRunRight(ctx,hotspots,run,world,lay,mode){
  const x=lay.rightX+Math.max(20,(ctx.canvas.width-lay.rightX-250)/2),cx=x+105;const top=lay.ay+34;const size=Math.max(20,lay.arena*.038);
  text(ctx,`Level ${stageLabel(run)}`,cx,top,size,'#eee','center',400);text(ctx,mode==='battle'?'Attack Phase':'Prepare Phase',cx,top+56,size*.9,'#eee','center',400);
  if(mode==='battle'){const pct=world?clamp(1-world.time/world.battleTime,0,1):1;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(cx-55,top+91,110,9);ctx.fillStyle='#fff';ctx.fillRect(cx-53,top+93,106*pct,5);}
  text(ctx,`${Math.round(run.stars)} ★`,cx,top+145,size*.72,'#f5f5f5','center',400);text(ctx,`${Math.round(run.fragments)} ◧`,cx,top+198,size*.72,'#f5f5f5','center',400);
  if(mode!=='battle'){
    button(ctx,hotspots,'Store [Q]',cx-90,top+295,180,42,'store',{color:'#eee',fill:'rgba(0,0,0,.15)',font:size*.72});
    button(ctx,hotspots,'Challenge [E]',cx-105,top+365,210,42,'challenge',{color:'#eee',fill:'rgba(0,0,0,.15)',font:size*.72});
    button(ctx,hotspots,'Go Fight [G]',cx-95,top+440,190,48,'goFight',{color:'#dfffc1',fill:'rgba(0,0,0,.25)',font:size*.74,border:true});
  }else text(ctx,world?.profile.settings.autoFire?'Auto Fire [F]  ☑':'Auto Fire [F]  □',cx,top+285,size*.68,'#ddd','center',400);
}

export function renderGameplay(ctx,w,h,state){
  const hotspots=[];drawStars(ctx,w,h,state.time||0);const lay=arenaLayout(w,h),run=state.run,world=state.world,color=arenaColor(run);drawArenaFrame(ctx,lay,color,state.time||0,state.profile.settings.light);if(world)drawWorld(ctx,world,lay,state.time||0);drawStats(ctx,run,world,lay);drawRunRight(ctx,hotspots,run,world,lay,state.mode);
  const hp=run.stats.hp/run.stats.hpMax;const bx=lay.ax-245,by=lay.ay+35;for(let i=0;i<Math.ceil(run.stats.hpMax);i++){ctx.fillStyle=i<Math.ceil(run.stats.hp)?'#ff616d':'#371418';ctx.fillRect(bx+i*18,by,13,28)}
  if(world?.boss){const p=world.boss.hp/world.boss.maxHp;text(ctx,'BOSS',lay.ax+lay.arena/2,lay.ay+27,15,'#fff','center',700);ctx.fillStyle='#26131a';ctx.fillRect(lay.ax+lay.arena*.25,lay.ay+42,lay.arena*.5,8);ctx.fillStyle=world.boss.color;ctx.fillRect(lay.ax+lay.arena*.25,lay.ay+42,lay.arena*.5*p,8);}
  return hotspots;
}

export function renderTitle(ctx,w,h,state){
  const hotspots=[];drawStars(ctx,w,h,state.time||0);drawLogo(ctx,w/2,h*.17,Math.min(1,w/1500));const centerY=h*.52;
  button(ctx,hotspots,'Start',w/2-105,centerY-26,210,55,'start',{color:'#dfffc1',fill:'transparent',font:34});
  const subY=centerY+105;button(ctx,hotspots,'Library',Math.max(90,w*.11),h*.73,150,38,'library',{color:'#eee',fill:'transparent',font:21});button(ctx,hotspots,'Leaderboard',Math.max(90,w*.11),h*.78,170,38,'leaderboard',{color:'#eee',fill:'transparent',font:21});button(ctx,hotspots,'Credits',Math.max(90,w*.11),h*.83,140,38,'credits',{color:'#eee',fill:'transparent',font:21});
  button(ctx,hotspots,'Manual',w/2-122,subY,112,40,'manual',{color:'#dfffc1',fill:'transparent',font:24});ctx.strokeStyle='#4a4a4a';ctx.beginPath();ctx.moveTo(w/2,subY+2);ctx.lineTo(w/2,subY+38);ctx.stroke();button(ctx,hotspots,'Updates',w/2+10,subY,120,40,'updates',{color:'#dfffc1',fill:'transparent',font:24});
  button(ctx,hotspots,'Settings',w/2-122,subY+52,112,40,'settings',{color:'#dfffc1',fill:'transparent',font:24});ctx.strokeStyle='#4a4a4a';ctx.beginPath();ctx.moveTo(w/2,subY+54);ctx.lineTo(w/2,subY+90);ctx.stroke();button(ctx,hotspots,'Quit',w/2+10,subY+52,120,40,'quit',{color:'#dfffc1',fill:'transparent',font:24});
  text(ctx,'English',w-100,h-70,20,'#eee','right');text(ctx,'v0.1 browser prototype',Math.max(80,w*.11),h-45,18,'#ddd');return hotspots;
}

function smallPanel(ctx,x,y,w,h,title){ctx.save();ctx.strokeStyle='#e4e4e4';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);ctx.fillStyle='rgba(8,8,8,.38)';ctx.fillRect(x,y,w,h);ctx.fillStyle='rgba(255,255,255,.92)';ctx.fillRect(x+3,y+3,w-6,36);text(ctx,title,x+w/2,y+21,22,'#111','center',400);ctx.restore();}

export function renderLoadout(ctx,w,h,state){
  const hotspots=[];drawStars(ctx,w,h,state.time||0);const profile=state.profile,selected=getClassById(profile.selectedClass),col=getColorById(profile.selectedColor);drawLogo(ctx,150,58,.42);
  const left=22,top=96,pw=Math.min(390,w*.27);smallPanel(ctx,left,top,pw,238,'Classes');const cw=(pw-26)/4,ch=51;
  CLASSES.forEach((c,i)=>{const x=left+8+(i%4)*cw,y=top+48+Math.floor(i/4)*ch,un=classUnlocked(profile,c);ctx.fillStyle=c.id===selected.id?hexA(col.hex,.18):'rgba(255,255,255,.05)';ctx.fillRect(x,y,cw-5,ch-5);ctx.strokeStyle=c.id===selected.id?col.hex:'#303030';ctx.strokeRect(x,y,cw-5,ch-5);if(un){drawClassGlyph(ctx,c.id,x+(cw-5)/2,y+(ch-5)/2,22,c.id===selected.id?col.hex:'#ddd');hotspots.push({x,y,w:cw-5,h:ch-5,action:'selectClass',value:c.id});}else{text(ctx,'🔒',x+(cw-5)/2,y+22,16,'#aaa','center');}});
  smallPanel(ctx,left,top+252,pw,224,'Colors');COLORS.forEach((c,i)=>{const x=left+10+(i%4)*cw,y=top+300+Math.floor(i/4)*52;ctx.fillStyle=c.hex;ctx.globalAlpha=c.id===col.id?1:.45;ctx.fillRect(x+7,y+5,cw-20,34);ctx.globalAlpha=1;ctx.strokeStyle=c.id===col.id?'#fff':'#353535';ctx.lineWidth=c.id===col.id?2:1;ctx.strokeRect(x+7,y+5,cw-20,34);hotspots.push({x,y,w:cw-5,h:44,action:'selectColor',value:c.id});});
  const talentY=top+490;smallPanel(ctx,left,talentY,pw,Math.min(330,h-talentY-18),'Talents');const tl=profile.talents[selected.id];TALENTS.forEach((t,i)=>{const yy=talentY+54+i*31,lv=tl[t.id]||0,cost=talentCost(t,lv);text(ctx,t.name,left+12,yy,16,'#ddd');text(ctx,`Level ${lv}`,left+145,yy,16,'#ddd');text(ctx,lv>=t.max?'MAX':cost,left+235,yy,15,'#ddd','right');text(ctx,'+',left+pw-24,yy,24,profile.totalStars>=cost&&lv<t.max?'#fff':'#666','center');if(lv<t.max)hotspots.push({x:left+pw-47,y:yy-14,w:42,h:28,action:'buyTalent',value:t.id});});
  const cx=w*.52,cy=h*.49;drawClassGlyph(ctx,selected.id,cx,cy,92,col.hex,state.time*.35*(selected.id==='tornado'?1:0));text(ctx,selected.name,cx,cy+105,26,'#eee','center',400);text(ctx,selected.desc,cx,cy+139,16,'#bbb','center',400);text(ctx,col.name+' · '+col.desc,cx,cy+167,15,col.hex,'center',500);
  button(ctx,hotspots,'Start',cx-105,cy+215,210,54,'beginRun',{color:'#eee',fill:'transparent',font:31});button(ctx,hotspots,'Return',cx-105,cy+290,210,50,'returnTitle',{color:'#eee',fill:'transparent',font:29});
  const right=w-Math.min(420,w*.28)-22,rw=Math.min(420,w*.28);smallPanel(ctx,right,top,rw,220,'Stats');const temp=state.previewStats;const rows=[['HP Max',temp.hpMax.toFixed(0)],['Move Speed',temp.move.toFixed(1)],['Fire Rate',temp.fireRate.toFixed(1)],['Bullet Damage',temp.damage.toFixed(1)],['Bullet Speed',temp.bulletSpeed.toFixed(1)],['Range',temp.range.toFixed(1)],['Critical Rate',`${Math.round(temp.crit*100)}%`],['Accuracy',`${Math.round(temp.accuracy*100)}%`]];rows.forEach((r,i)=>{const yy=top+55+i*20;text(ctx,r[0],right+24,yy,15,'#ddd');text(ctx,r[1],right+rw-24,yy,15,'#ddd','right')});
  smallPanel(ctx,right,top+235,rw,205,'Class Skill');text(ctx,selected.skill,right+rw/2,top+292,24,col.hex,'center',500);wrapText(ctx,selected.skillDesc,right+24,top+325,rw-48,18,15,'#ccc');text(ctx,`Proficiency  Lv ${profile.classProficiency[selected.id]||0}`,right+rw/2,top+404,15,'#aaa','center');
  text(ctx,`★ ${Math.round(profile.totalStars).toLocaleString('en-US')}`,w-22,40,22,'#eee','right');text(ctx,`◧ ${Math.round(profile.fragments).toLocaleString('en-US')}`,w-22,72,19,'#eee','right');
  return hotspots;
}

function wrapText(ctx,s,x,y,maxW,lineH,size,color){ctx.save();ctx.font=`${size}px ${FONT}`;ctx.fillStyle=color;ctx.textAlign='left';ctx.textBaseline='top';const words=String(s).split(/\s+/);let line='',yy=y;for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxW&&line){ctx.fillText(line,x,yy);yy+=lineH;line=word}else line=test;}if(line)ctx.fillText(line,x,yy);ctx.restore();}

export function renderStore(ctx,w,h,state){
  renderGameplay(ctx,w,h,{...state,mode:'prepare'});const hotspots=[];ctx.fillStyle='rgba(0,0,0,.78)';ctx.fillRect(0,0,w,h);const run=state.run,items=run.storeRoll||[];const panelW=Math.min(900,w*.78),panelH=Math.min(650,h*.86),x=(w-panelW)/2,y=(h-panelH)/2;const col=arenaColor(run);ctx.save();ctx.shadowColor=col;ctx.shadowBlur=16;ctx.strokeStyle=hexA(col,.7);ctx.lineWidth=2;ctx.strokeRect(x,y,panelW,panelH);ctx.restore();text(ctx,'Upgrade Store',w/2,y+34,31,'#eee','center',400);
  text(ctx,`Unlocked`,x+24,y+135,21,'#45ff54');text(ctx,`Refresh [R]`,x+24,y+230,21,'#8996ff');text(ctx,`Price  ${run.rerollCost}  ◧`,x+24,y+265,18,'#62f5ed');hotspots.push({x:x+15,y:y+205,w:150,h:90,action:'reroll'});
  const cardStart=x+panelW*.23,cardW=panelW*.235,gap=panelW*.035;
  items.forEach((u,i)=>{if(!u)return;const cx=cardStart+i*(cardW+gap)+cardW/2,rar=UPGRADE_RARITIES[u.rarity];drawUpgradeIcon(ctx,u,cx,y+142,70,rar.color);text(ctx,u.name,cx,y+205,23,rar.color,'center',400);text(ctx,rar.name,cx,y+236,14,'#bbb','center');text(ctx,u.tags.join('   '),cx,y+266,12,'#8fd983','center');wrapText(ctx,u.desc,cx-cardW*.44,y+300,cardW*.88,18,14,'#ddd');text(ctx,`Price  ${u.cost}  ◧`,cx,y+430,18,'#62f5ed','center');button(ctx,hotspots,`Buy [${i+1}]`,cx-70,y+465,140,42,'buyUpgrade',{color:'#9ea7ff',fill:'transparent',font:22});hotspots[hotspots.length-1].value=i;});
  button(ctx,hotspots,'Return [Q]',w/2-110,y+panelH-62,220,44,'closeOverlay',{color:'#eee',fill:'transparent',font:25});return hotspots;
}

export function renderChallenge(ctx,w,h,state){
  renderGameplay(ctx,w,h,{...state,mode:'prepare'});let hotspots=[];ctx.fillStyle='rgba(0,0,0,.76)';ctx.fillRect(0,0,w,h);const run=state.run,current=getDifficulty(run.difficultyId),next=nextDifficulty(run.difficultyId);const pw=Math.min(720,w*.7),ph=Math.min(620,h*.8),x=(w-pw)/2,y=(h-ph)/2;ctx.save();ctx.shadowColor='#ef6cff';ctx.shadowBlur=18;ctx.strokeStyle='#ef6cff';ctx.lineWidth=3;ctx.strokeRect(x,y,pw,ph);ctx.restore();text(ctx,'Difficulty Level',w/2,y+34,30,'#eee','center');const cx1=x+pw*.27,cx2=x+pw*.73;text(ctx,'Current level',cx1,y+90,24,'#eee','center');text(ctx,'Next level',cx2,y+90,24,'#eee','center');text(ctx,current.label,cx1,y+145,34,'#eee','center');text(ctx,next.label,cx2,y+145,34,'#eee','center');
  const statRows=[['Enemy Number',current.enemyCount,next.enemyCount],['Fragment Drop',current.rare,next.rare],['Enemy HP',current.hp,next.hp],['Star Gain',current.star,next.star],['Elite Rate',current.elite*100,next.elite*100]];statRows.forEach((r,i)=>{const yy=y+200+i*42;text(ctx,r[0],w/2,yy,16,'#bbb','center');text(ctx,`x${r[1].toFixed(r[0]==='Elite Rate'?0:1)}${r[0]==='Elite Rate'?'%':''}`,cx1,yy+18,17,i===2?'#ff6a6a':'#6fff65','center');text(ctx,`x${r[2].toFixed(r[0]==='Elite Rate'?0:1)}${r[0]==='Elite Rate'?'%':''}`,cx2,yy+18,17,i===2?'#ff6a6a':'#d4ed65','center');});
  const atMax=difficultyIndex(current.id)>=DIFFICULTIES.length-1;button(ctx,hotspots,atMax?'MAX difficulty':'Challenge next level [R]',w/2-155,y+ph-110,310,45,'raiseDifficulty',{color:atMax?'#666':'#eee',fill:'transparent',font:22,disabled:atMax});button(ctx,hotspots,'Return [E]',w/2-100,y+ph-60,200,42,'closeOverlay',{color:'#eee',fill:'transparent',font:22});return hotspots;
}

export function renderEnd(ctx,w,h,state){
  const hotspots=[];drawStars(ctx,w,h,state.time||0);const run=state.run,col=getColorById(run.colorId).hex;drawLogo(ctx,w/2,h*.16,.65);text(ctx,state.completed?'NORMAL MODE CLEARED':'RUN OVER',w/2,h*.36,42,state.completed?'#dfff9a':'#ff7b84','center',500);text(ctx,`Reached Level ${state.completed?'4-5':stageLabel(run)}`,w/2,h*.43,24,'#ddd','center');text(ctx,`${Math.round(run.earnedStars).toLocaleString('en-US')} ★`,w/2,h*.50,34,'#fff','center');text(ctx,`${Math.round(run.kills)} kills  ·  ${Math.round(run.eliteKills)} elites  ·  ${Math.round(run.bossKills)} bosses`,w/2,h*.56,18,'#aaa','center');button(ctx,hotspots,'Play Again',w/2-130,h*.66,260,48,'playAgain',{color:col,fill:'transparent',font:28,border:true});button(ctx,hotspots,'Return',w/2-100,h*.74,200,44,'returnTitle',{color:'#eee',fill:'transparent',font:25});return hotspots;
}

export function renderSettings(ctx,w,h,state){
  const hotspots=[];drawStars(ctx,w,h,state.time||0);text(ctx,'Settings',w/2,h*.18,42,'#dfffc1','center');const p=state.profile,cy=h*.36;text(ctx,`Light Effects  ${p.settings.light}/5`,w/2,cy,24,'#eee','center');for(let i=1;i<=5;i++){button(ctx,hotspots,String(i),w/2-150+(i-1)*65,cy+38,48,42,'light',{color:i===p.settings.light?'#dfffc1':'#777',fill:'rgba(0,0,0,.3)',font:22,border:i===p.settings.light});hotspots[hotspots.length-1].value=i;}button(ctx,hotspots,`Screen Shake: ${p.settings.screenShake?'ON':'OFF'}`,w/2-145,cy+125,290,46,'toggleShake',{color:'#eee',fill:'transparent',font:23});button(ctx,hotspots,'Return',w/2-100,cy+220,200,46,'returnTitle',{color:'#dfffc1',fill:'transparent',font:25});return hotspots;
}

export function renderSimpleInfo(ctx,w,h,state,title,lines){const hotspots=[];drawStars(ctx,w,h,state.time||0);text(ctx,title,w/2,h*.18,42,'#dfffc1','center');lines.forEach((l,i)=>text(ctx,l,w/2,h*.33+i*38,19,'#ddd','center'));button(ctx,hotspots,'Return',w/2-100,h*.75,200,46,'returnTitle',{color:'#dfffc1',fill:'transparent',font:25});return hotspots;}
