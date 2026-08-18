import {WEAPONS} from "./CraterClashData.js";
import {terrainY,terrainSlope,currentTank,clamp} from "./CraterClashEngine.js";
import {getWeaponTierStats} from "./CraterClashProgression.js";
import {weaponVisual,polygon,tierRoman} from "./CraterClashWeaponFX.js";

function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}

export function render(ctx,state,W,H){
  ctx.clearRect(0,0,W,H);
  ctx.save();
  if(state.cameraShake>0)ctx.translate((Math.random()-.5)*state.cameraShake,(Math.random()-.5)*state.cameraShake);
  drawSky(ctx,state,W,H);
  drawTraces(ctx,state);
  drawTerrain(ctx,state,W,H);
  drawFires(ctx,state);
  drawFields(ctx,state);
  drawSkillObjects(ctx,state);
  drawCrate(ctx,state);
  drawTanks(ctx,state);
  drawProjectiles(ctx,state);
  drawFx(ctx,state);
  ctx.restore();
  drawAim(ctx,state,W,H);
  drawHud(ctx,state,W,H);
}

function drawSky(ctx,s,W,H){
  const [a,b]=s.arena.sky,g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,a);g.addColorStop(.65,b);g.addColorStop(1,"#111821");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle="rgba(255,255,255,.55)";
  for(let i=0;i<55;i++){const x=(i*193.7)%W,y=(i*71.3)%Math.max(80,H*.5);ctx.globalAlpha=.35+.35*Math.sin(s.round*.2+i);ctx.fillRect(x,y,1.5,1.5);}
  ctx.globalAlpha=1;ctx.fillStyle="rgba(10,16,25,.25)";
  for(let x=0;x<W;x+=90){const h=25+(x*7%70);ctx.fillRect(x,H*.43-h,60,h);}
}

function drawTraces(ctx,s){
  if(!s.settings?.tracer||!s.lastShotTraces?.length)return;
  ctx.save();ctx.strokeStyle="rgba(190,229,255,.26)";ctx.lineWidth=1.5;ctx.setLineDash([5,7]);
  for(const path of s.lastShotTraces){
    if(path.length<2)continue;ctx.beginPath();ctx.moveTo(path[0].x,path[0].y);
    for(let i=1;i<path.length;i++)ctx.lineTo(path[i].x,path[i].y);ctx.stroke();
  }
  ctx.restore();
}

function drawTerrain(ctx,s,W,H){
  const g=ctx.createLinearGradient(0,H*.45,0,H);g.addColorStop(0,"#385d52");g.addColorStop(.15,"#29483f");g.addColorStop(1,"#162825");
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,H);
  for(let x=0;x<s.terrain.length;x+=2)ctx.lineTo(x,s.terrain[x]);ctx.lineTo(W,H);ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(116,232,202,.32)";ctx.lineWidth=2;ctx.beginPath();
  for(let x=0;x<s.terrain.length;x+=3){if(x===0)ctx.moveTo(x,s.terrain[x]);else ctx.lineTo(x,s.terrain[x]);}ctx.stroke();
  ctx.strokeStyle="rgba(79,176,154,.06)";ctx.lineWidth=1;
  for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,H*.55);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=Math.floor(H*.55/30)*30;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
}

function drawSkillObjects(ctx,s){
  for(const o of s.skillObjects||[]){
    if(o.kind==="multiplier"){
      ctx.save();ctx.translate(o.x,o.y);ctx.shadowColor="#ffe96c";ctx.shadowBlur=20;
      const g=ctx.createRadialGradient(0,0,2,0,0,o.r+8);g.addColorStop(0,"rgba(255,247,170,.95)");g.addColorStop(.55,"rgba(255,210,65,.35)");g.addColorStop(1,"rgba(255,210,65,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,o.r+8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fff6b3";ctx.font="1000 15px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("×2",0,1);ctx.restore();
    }else if(o.kind==="bumper"){
      const dx=Math.cos(o.angle)*o.len/2,dy=Math.sin(o.angle)*o.len/2;
      ctx.save();ctx.strokeStyle="#ff73ce";ctx.shadowColor="#ff73ce";ctx.shadowBlur=14;ctx.lineWidth=7;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(o.x-dx,o.y-dy);ctx.lineTo(o.x+dx,o.y+dy);ctx.stroke();
      ctx.strokeStyle="#ffe1f5";ctx.lineWidth=2;ctx.stroke();ctx.restore();
    }else if(o.kind==="portal"){
      ctx.save();ctx.translate(o.x,o.y);ctx.strokeStyle=o.color;ctx.shadowColor=o.color;ctx.shadowBlur=18;ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(0,0,o.r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.45;ctx.beginPath();ctx.arc(0,0,o.r-8,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
  }
}

function drawTanks(ctx,s){
  for(const t of s.tanks){
    if(!t.alive)continue;
    const slope=terrainSlope(s,t.x);ctx.save();ctx.translate(t.x,t.y);ctx.rotate(slope*.7);
    if(currentTank(s)?.id===t.id){ctx.shadowColor=t.color;ctx.shadowBlur=18;}
    ctx.fillStyle=t.color;rr(ctx,-16,-11,32,14,5);ctx.fill();ctx.fillStyle="#131b22";rr(ctx,-11,-16,22,9,4);ctx.fill();
    ctx.strokeStyle=t.color;ctx.lineWidth=5;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(Math.cos(t.angle)*22,-13-Math.sin(t.angle)*22);ctx.stroke();
    ctx.fillStyle="#1a2027";ctx.beginPath();ctx.arc(-10,5,6,0,Math.PI*2);ctx.arc(10,5,6,0,Math.PI*2);ctx.fill();ctx.restore();

    ctx.textAlign="center";ctx.font="800 10px sans-serif";ctx.fillStyle="#edf4f7";ctx.fillText(t.name,t.x,t.y-31);
    const w=56;ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(t.x-w/2,t.y-26,w,5);
    ctx.fillStyle=t.hp/t.maxHp>.45?"#65dc86":"#ef6d75";ctx.fillRect(t.x-w/2,t.y-26,w*clamp(t.hp/t.maxHp,0,1),5);
    if(t.armor>0){ctx.fillStyle="#62bdf2";ctx.fillRect(t.x-w/2,t.y-20,w*clamp(t.armor/Math.max(35,t.armor),0,1),3);}
    if(t.overchargeReady){ctx.strokeStyle="#f1d95a";ctx.lineWidth=2;ctx.beginPath();ctx.arc(t.x,t.y-4,24,0,Math.PI*2);ctx.stroke();}
    if(currentTank(s)?.id===t.id&&s.phase==="aim"){
      const fuelPct=t.maxFuel>9000?1:clamp(t.fuel/t.maxFuel,0,1);
      ctx.fillStyle="rgba(3,8,13,.70)";ctx.fillRect(t.x-28,t.y+15,56,4);ctx.fillStyle="#6ce7c2";ctx.fillRect(t.x-28,t.y+15,56*fuelPct,4);
    }
  }
}

function drawProjectileTrail(ctx,p,d,v){
  const pts=(p.trace||[]).slice(-18);if(pts.length<2)return;
  ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
  const alpha=.16+v.tier*.045;
  if(["droplets","embers","acid","spark","dust","disco","slime","rainbowSpark","redSmoke","greenSmoke","flareSmoke","electricTrail","thread","formation"].includes(v.trail)){
    const step=v.trail==="disco"?2:3;
    for(let i=0;i<pts.length;i+=step){
      const q=pts[i],fade=(i+1)/pts.length;
      ctx.globalAlpha=alpha*fade;
      ctx.fillStyle=v.trail==="acid"?"#a6ff65":v.trail==="embers"?(i%2?"#ff6a42":"#ffd06e"):v.trail==="disco"?(["#ff72cf","#72eaff","#ffe66d"][i%3]):v.trail==="rainbowSpark"?(["#ff5b75","#66dfff","#ffe46c","#9b7cff"][i%4]):v.trail==="redSmoke"?"#ff5d69":v.trail==="greenSmoke"?"#4bdb86":v.trail==="flareSmoke"?"#e7eef4":v.trail==="slime"?"#7bec62":v.trail==="electricTrail"?"#dfff72":v.trail==="thread"?"#eef3ff":d.color;
      const r=(v.trail==="dust"||v.trail.includes("Smoke")?2.8:2.1)*fade*v.scale;
      ctx.beginPath();ctx.arc(q.x,q.y,r,0,Math.PI*2);ctx.fill();
    }
  }else if(v.trail==="helix"){
    ctx.strokeStyle=d.color;ctx.globalAlpha=.30;ctx.lineWidth=v.trailWidth;
    ctx.beginPath();
    for(let i=0;i<pts.length;i++){
      const q=pts[i],prev=pts[Math.max(0,i-1)],dx=q.x-prev.x,dy=q.y-prev.y,len=Math.max(1,Math.hypot(dx,dy)),nx=-dy/len,ny=dx/len,off=Math.sin(i*.95+p.age*10)*6*v.scale;
      const x=q.x+nx*off,y=q.y+ny*off;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }ctx.stroke();
  }else if(v.trail==="smoke"){
    for(let i=0;i<pts.length;i+=2){const q=pts[i],fade=(i+1)/pts.length;ctx.globalAlpha=.12*fade;ctx.fillStyle="#d6d8d1";ctx.beginPath();ctx.arc(q.x,q.y,4.5*(1-fade*.35)*v.scale,0,Math.PI*2);ctx.fill();}
  }else{
    ctx.strokeStyle=v.trail==="ghost"?"#ccbaff":d.color;ctx.globalAlpha=v.trail==="thin"?.28:.20;ctx.lineWidth=v.trail==="thin"?1:v.trailWidth;
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.stroke();
    if(v.trail==="plasma"||v.trail==="void"){ctx.globalAlpha=.12;ctx.lineWidth=v.trailWidth*3;ctx.stroke();}
  }
  ctx.restore();
}

function drawStar(ctx,r,points=5,inner=.45){
  ctx.beginPath();
  for(let i=0;i<points*2;i++){const rr=i%2?r*inner:r,a=-Math.PI/2+i*Math.PI/points,x=Math.cos(a)*rr,y=Math.sin(a)*rr;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();
}
function drawProjectileBody(ctx,p,d,v){
  const ang=Math.atan2(p.vy||0,p.vx||1),r=(p.kind==="deadDrop"?10:(p.radius||4))*v.scale;
  const bodyColor=p.customColor||d.color;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(ang);ctx.shadowColor=bodyColor;ctx.shadowBlur=v.glow;ctx.fillStyle=bodyColor;ctx.strokeStyle=v.accent;ctx.lineWidth=Math.max(1,1.2*v.scale);
  switch(v.shape){
    case "hex":polygon(ctx,6,r*1.25,Math.PI/6);ctx.fill();ctx.stroke();break;
    case "diamond":polygon(ctx,4,r*1.35,Math.PI/4);ctx.fill();ctx.stroke();break;
    case "prism":polygon(ctx,3,r*1.5,0);ctx.fill();ctx.stroke();break;
    case "drill":ctx.beginPath();ctx.moveTo(r*1.8,0);ctx.lineTo(-r*.9,-r);ctx.lineTo(-r*.9,r);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle=v.accent;ctx.beginPath();ctx.moveTo(-r*.55,-r*.65);ctx.lineTo(r*.65,.65*r);ctx.stroke();break;
    case "flare":ctx.beginPath();ctx.ellipse(0,0,r*1.35,r*.80,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(r*.75,0,r*.22,0,Math.PI*2);ctx.fill();break;
    case "meteor":polygon(ctx,7,r*1.45,.2);ctx.fill();ctx.stroke();break;
    case "needle":ctx.lineWidth=Math.max(2,r*.48);ctx.beginPath();ctx.moveTo(-r*2,0);ctx.lineTo(r*2,0);ctx.stroke();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(r*1.6,0,Math.max(1,r*.25),0,Math.PI*2);ctx.fill();break;
    case "dart":ctx.beginPath();ctx.moveTo(r*1.8,0);ctx.lineTo(-r,-r*.75);ctx.lineTo(-r*.55,0);ctx.lineTo(-r,r*.75);ctx.closePath();ctx.fill();ctx.stroke();break;
    case "gravity":case "void":ctx.fillStyle=v.shape==="void"?"#06030d":d.color;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.globalAlpha=.75;ctx.beginPath();ctx.ellipse(0,0,r*1.7,r*.55,.25,0,Math.PI*2);ctx.stroke();break;
    case "seed":ctx.beginPath();ctx.ellipse(0,0,r*1.35,r*.78,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=v.accent;ctx.beginPath();ctx.ellipse(-r*.5,-r*.7,r*.45,r*.22,-.5,0,Math.PI*2);ctx.fill();break;
    case "star":case "spark":drawStar(ctx,r*1.55,v.shape==="spark"?6:5,.42);ctx.fill();ctx.stroke();break;
    case "flame":ctx.beginPath();ctx.moveTo(r*1.5,0);ctx.quadraticCurveTo(-r*.3,-r*1.2,-r*1.2,0);ctx.quadraticCurveTo(-r*.3,r*1.2,r*1.5,0);ctx.fill();ctx.stroke();break;
    case "electric":ctx.lineWidth=Math.max(2,r*.45);ctx.beginPath();ctx.moveTo(-r*1.6,-r*.3);ctx.lineTo(-r*.3,r*.55);ctx.lineTo(r*.15,-r*.55);ctx.lineTo(r*1.6,r*.25);ctx.stroke();break;
    case "moon":ctx.beginPath();ctx.arc(0,0,r*1.25,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation="destination-out";ctx.beginPath();ctx.arc(r*.45,-r*.15,r,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation="source-over";ctx.stroke();break;
    case "block":ctx.fillRect(-r,-r,r*2,r*2);ctx.strokeRect(-r,-r,r*2,r*2);break;
    case "rock":polygon(ctx,7,r*1.35,.35);ctx.fill();ctx.stroke();break;
    case "spiral":ctx.lineWidth=Math.max(2,r*.36);ctx.beginPath();for(let i=0;i<22;i++){const q=i/21,a=q*Math.PI*4,rr=q*r*1.4,x=Math.cos(a)*rr,y=Math.sin(a)*rr;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();break;
    case "drone":ctx.beginPath();ctx.moveTo(r*1.5,0);ctx.lineTo(-r*.8,-r*.75);ctx.lineTo(-r*.35,0);ctx.lineTo(-r*.8,r*.75);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeRect(-r*1.1,-r*.95,r*.45,r*.4);ctx.strokeRect(-r*1.1,r*.55,r*.45,r*.4);break;
    case "saw":for(let i=0;i<12;i++){ctx.rotate(Math.PI/6);ctx.beginPath();ctx.moveTo(r*.8,-r*.22);ctx.lineTo(r*1.5,0);ctx.lineTo(r*.8,r*.22);ctx.fill();}ctx.beginPath();ctx.arc(0,0,r*.9,0,Math.PI*2);ctx.fill();ctx.stroke();break;
    case "ring":ctx.lineWidth=Math.max(2,r*.45);ctx.beginPath();ctx.arc(0,0,r*1.25,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.45,0,Math.PI*2);ctx.stroke();break;
    case "mirror":polygon(ctx,4,r*1.5,Math.PI/4);ctx.fill();ctx.strokeStyle="#fff";ctx.beginPath();ctx.moveTo(-r*.55,-r*.55);ctx.lineTo(r*.55,r*.55);ctx.stroke();break;
    case "snake":ctx.lineWidth=Math.max(2,r*.5);ctx.beginPath();ctx.moveTo(-r*1.5,0);ctx.bezierCurveTo(-r*.6,-r,r*.5,r,r*1.5,0);ctx.stroke();break;
    case "sprout":ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,r);ctx.lineTo(0,-r*.5);ctx.moveTo(0,-r*.2);ctx.quadraticCurveTo(r,-r,r*1.15,-r*.3);ctx.moveTo(0,r*.1);ctx.quadraticCurveTo(-r,-r*.5,-r*1.1,.15*r);ctx.stroke();break;
    case "clock":ctx.beginPath();ctx.arc(0,0,r*1.2,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-r*.75);ctx.moveTo(0,0);ctx.lineTo(r*.55,r*.25);ctx.stroke();break;
    case "grenade":ctx.beginPath();ctx.arc(0,0,r*1.08,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeRect(-r*.25,-r*1.45,r*.6,r*.5);ctx.beginPath();ctx.arc(r*.35,-r*1.55,r*.35,Math.PI*.7,Math.PI*1.9);ctx.stroke();break;
    case "drop":ctx.beginPath();ctx.moveTo(r*1.35,0);ctx.quadraticCurveTo(-r*.4,-r*1.1,-r*1.2,0);ctx.quadraticCurveTo(-r*.4,r*1.1,r*1.35,0);ctx.fill();ctx.stroke();break;
    case "breaker":ctx.beginPath();ctx.moveTo(r*1.5,0);ctx.lineTo(0,-r*.8);ctx.lineTo(-r*1.25,0);ctx.lineTo(0,r*.8);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-r*.8);ctx.lineTo(0,r*.8);ctx.stroke();break;
    case "spring":ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<7;i++){const x=-r*1.2+i*(r*2.4/6),y=(i%2?1:-1)*r*.55;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();break;
    case "acid":ctx.fillStyle="#9eff5d";ctx.beginPath();ctx.moveTo(r*1.2,0);ctx.quadraticCurveTo(0,-r*1.3,-r*.9,0);ctx.quadraticCurveTo(0,r*1.3,r*1.2,0);ctx.fill();break;
    case "hover":ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.globalAlpha=.55;ctx.beginPath();ctx.ellipse(0,0,r*1.7,r*.45,0,0,Math.PI*2);ctx.stroke();break;
    case "boomerang":ctx.lineWidth=Math.max(3,r*.55);ctx.beginPath();ctx.arc(0,0,r*1.1,-1.0,1.0);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*1.1,2.1,4.1);ctx.stroke();break;
    case "bumper":ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r*1.2,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.stroke();break;
    case "spike":for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(r*.6,-r*.18);ctx.lineTo(r*1.5,0);ctx.lineTo(r*.6,r*.18);ctx.fill();}ctx.beginPath();ctx.arc(0,0,r*.65,0,Math.PI*2);ctx.fill();break;
    case "bullet":ctx.beginPath();ctx.roundRect(-r*1.35,-r*.42,r*2.7,r*.84,r*.4);ctx.fill();break;
    case "clover":for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.ellipse(r*.6,0,r*.7,r*.45,0,0,Math.PI*2);ctx.fill();}break;
    case "disco":ctx.beginPath();ctx.arc(0,0,r*1.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=1;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-r*1.05,i*r*.42);ctx.lineTo(r*1.05,i*r*.42);ctx.stroke();ctx.beginPath();ctx.moveTo(i*r*.42,-r*1.05);ctx.lineTo(i*r*.42,r*1.05);ctx.stroke();}break;
    case "ghost":ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(0,-r*.25,r,Math.PI,0);ctx.lineTo(r,r*.9);ctx.lineTo(r*.45,r*.55);ctx.lineTo(0,r*.9);ctx.lineTo(-r*.45,r*.55);ctx.lineTo(-r,r*.9);ctx.closePath();ctx.fill();ctx.globalAlpha=1;break;
    case "fish":ctx.beginPath();ctx.ellipse(0,0,r*1.05,r*.58,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-r*.9,0);ctx.lineTo(-r*1.65,-r*.7);ctx.lineTo(-r*1.65,r*.7);ctx.closePath();ctx.fill();break;
    case "leaf":ctx.beginPath();ctx.ellipse(0,0,r*1.35,r*.6,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.stroke();break;
    case "wave":ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-r*1.5,0);ctx.quadraticCurveTo(-r*.75,-r,r*0,0);ctx.quadraticCurveTo(r*.75,r,r*1.5,0);ctx.stroke();break;

    case "snakehead":ctx.fillStyle=d.color;ctx.beginPath();ctx.ellipse(0,0,r*1.5,r*.72,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#1b2b18";ctx.beginPath();ctx.arc(r*.55,-r*.24,r*.18,0,Math.PI*2);ctx.arc(r*.55,r*.24,r*.18,0,Math.PI*2);ctx.fill();ctx.strokeStyle=v.accent;ctx.beginPath();ctx.moveTo(-r*1.1,0);ctx.bezierCurveTo(-r*1.8,-r*.8,-r*2.0,r*.7,-r*2.6,0);ctx.stroke();break;
    case "counter":ctx.fillStyle=d.color;ctx.beginPath();ctx.roundRect(-r*1.5,-r*.38,r*3,r*.76,r*.35);ctx.fill();ctx.fillStyle=v.accent;ctx.fillRect(-r*.1,-r*.55,r*.8,r*1.1);break;
    case "weight":ctx.fillStyle=d.color;ctx.fillRect(-r,-r*.85,r*2,r*1.7);ctx.strokeRect(-r,-r*.85,r*2,r*1.7);ctx.fillStyle="#27313a";ctx.beginPath();ctx.moveTo(-r*.55,-r*.85);ctx.lineTo(0,-r*1.55);ctx.lineTo(r*.55,-r*.85);ctx.closePath();ctx.fill();break;
    case "boltflare":ctx.fillStyle="#dfff74";ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#f5ffbe";ctx.beginPath();ctx.moveTo(-r*1.5,0);ctx.lineTo(-r*.45,-r*.6);ctx.lineTo(r*.1,r*.45);ctx.lineTo(r*1.5,-r*.2);ctx.stroke();break;
    case "tadpole":ctx.fillStyle=d.color;ctx.beginPath();ctx.arc(r*.45,0,r*.72,0,Math.PI*2);ctx.fill();ctx.strokeStyle=v.accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-r*.1,0);ctx.quadraticCurveTo(-r*1.1,-r*.7,-r*1.8,0);ctx.stroke();break;
    case "rocket":ctx.fillStyle=d.color;ctx.beginPath();ctx.moveTo(r*1.6,0);ctx.lineTo(r*.45,-r*.65);ctx.lineTo(-r*1.0,-r*.5);ctx.lineTo(-r*1.0,r*.5);ctx.lineTo(r*.45,r*.65);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#ffb44b";ctx.beginPath();ctx.moveTo(-r*1.0,-r*.35);ctx.lineTo(-r*1.65,0);ctx.lineTo(-r*1.0,r*.35);ctx.fill();break;
    case "fleet":ctx.fillStyle=d.color;ctx.beginPath();ctx.moveTo(r*1.65,0);ctx.lineTo(-r*1.0,-r*.72);ctx.lineTo(-r*.55,0);ctx.lineTo(-r*1.0,r*.72);ctx.closePath();ctx.fill();ctx.stroke();break;
    case "bounder":ctx.fillStyle=d.color;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle=v.accent;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*1.55,-.8,.8);ctx.stroke();ctx.beginPath();ctx.moveTo(r*1.4,-r*.4);ctx.lineTo(r*1.75,0);ctx.lineTo(r*1.4,r*.4);ctx.stroke();break;
    case "sticky":ctx.fillStyle=d.color;ctx.beginPath();ctx.arc(0,0,r*1.05,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#3b151a";for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.arc(Math.cos(a)*r*.62,Math.sin(a)*r*.62,r*.17,0,Math.PI*2);ctx.fill();}break;
    case "spider":ctx.fillStyle="#ecf2ff";ctx.beginPath();ctx.arc(0,0,r*.75,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#ecf2ff";ctx.lineWidth=1.5;for(let i=0;i<4;i++){const sy=(i-1.5)*r*.35;ctx.beginPath();ctx.moveTo(-r*.4,sy);ctx.lineTo(-r*1.3,sy-r*.45);ctx.moveTo(r*.4,sy);ctx.lineTo(r*1.3,sy-r*.45);ctx.stroke();}break;
    case "bfg":ctx.fillStyle=d.color;ctx.shadowBlur=v.glow*2.2;ctx.beginPath();ctx.arc(0,0,r*1.35,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#e8ffd8";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*1.85,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(0,0,r*2.35,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;break;
    case "recruitflare":ctx.fillStyle=d.color;ctx.beginPath();ctx.ellipse(0,0,r*1.35,r*.78,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#d9ffe6";ctx.beginPath();ctx.moveTo(-r*.6,0);ctx.lineTo(r*.7,0);ctx.moveTo(0,-r*.6);ctx.lineTo(0,r*.6);ctx.stroke();break;
    default:ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();break;
  }
  if(v.tier===4){ctx.globalAlpha=.65;ctx.strokeStyle="#fff4b0";ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,0,r*1.85,0,Math.PI*2);ctx.stroke();for(let i=0;i<4;i++){const a=p.age*3+i*Math.PI/2;ctx.fillStyle="#fff4b0";ctx.beginPath();ctx.arc(Math.cos(a)*r*1.85,Math.sin(a)*r*1.85,1.4,0,Math.PI*2);ctx.fill();}}
  ctx.restore();
}
function drawProjectiles(ctx,s){
  for(const p of s.projectiles){
    if(!p.alive||p.age<0)continue;const d=getWeaponTierStats(p.weaponId,p.tier||1),v=weaponVisual(d,p.tier||1);
    if(p.kind==="roller"&&d.growsWithRoll)v.scale*=.75+(p.rollGrow||0)*1.05;
    drawProjectileTrail(ctx,p,d,v);drawProjectileBody(ctx,p,d,v);
  }
}

function drawFires(ctx,s){
  for(const f of s.fires){
    const alpha=clamp(f.life/2,0,.75);
    if(f.color==="acid"){
      ctx.fillStyle=`rgba(132,255,76,${alpha*.72})`;ctx.beginPath();ctx.ellipse(f.x,f.y+2,f.r||30,7,0,0,Math.PI*2);ctx.fill();
      for(let i=0;i<5;i++){ctx.fillStyle=`rgba(186,255,93,${alpha})`;ctx.beginPath();ctx.arc(f.x+(i-2)*9,f.y-5-Math.sin(f.life*4+i)*5,3+i%2,0,Math.PI*2);ctx.fill();}
    }else{
      ctx.fillStyle=`rgba(255,91,54,${alpha})`;
      for(let i=0;i<5;i++){const x=f.x+(i-2)*9;ctx.beginPath();ctx.moveTo(x,f.y+3);ctx.quadraticCurveTo(x-8,f.y-12-Math.sin(i+f.life*5)*8,x,f.y-27);ctx.quadraticCurveTo(x+8,f.y-11,x,f.y+3);ctx.fill();}
    }
  }
}
function drawFields(ctx,s){
  for(const f of s.fields){
    if(f.kind==="gravity"||f.kind==="voidwell"){
      const t=clamp(f.life/f.max,0,1),isVoid=f.kind==="voidwell",g=ctx.createRadialGradient(f.x,f.y,3,f.x,f.y,f.r);
      g.addColorStop(0,isVoid?`rgba(24,10,48,${.95*t})`:`rgba(170,117,255,${.52*t})`);g.addColorStop(.35,isVoid?`rgba(118,77,255,${.42*t})`:`rgba(133,92,240,${.28*t})`);g.addColorStop(1,"rgba(100,70,220,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=isVoid?`rgba(151,111,255,${t})`:`rgba(210,177,255,${t})`;ctx.lineWidth=isVoid?3:2;ctx.beginPath();ctx.arc(f.x,f.y,25+Math.sin(f.life*7)*8,0,Math.PI*2);ctx.stroke();
      if(isVoid){ctx.fillStyle=`rgba(2,2,8,${.9*t})`;ctx.beginPath();ctx.arc(f.x,f.y,11+Math.sin(f.life*9)*2,0,Math.PI*2);ctx.fill();}
    }
  }
}
function drawCrate(ctx,s){
  const c=s.crate;if(!c?.alive)return;ctx.save();ctx.translate(c.x,c.y);ctx.shadowColor="#ffd861";ctx.shadowBlur=18;ctx.fillStyle="#d49d42";rr(ctx,-13,-11,26,22,4);ctx.fill();ctx.strokeStyle="#fff1a8";ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle="#211b0d";ctx.font="1000 9px sans-serif";ctx.textAlign="center";ctx.fillText("DROP",0,3);ctx.restore();
}

function drawFx(ctx,s){
  for(const f of s.fx){
    const t=clamp(f.life/f.max,0,1);
    if(f.kind==="explosion"){
      ctx.save();ctx.globalAlpha=t;ctx.shadowColor=f.color||"#ff9f55";ctx.shadowBlur=18;
      const g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,f.r);g.addColorStop(0,"#fffbd7");g.addColorStop(.22,f.color||"#ffb15d");g.addColorStop(.68,"rgba(255,95,80,.44)");g.addColorStop(1,"rgba(255,70,60,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=f.color||"#ffd06c";ctx.lineWidth=2.5;ctx.globalAlpha=t*.7;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(1.1+(1-t)*.28),0,Math.PI*2);ctx.stroke();ctx.restore();
    }else if(f.kind==="weaponImpact"||f.kind==="weaponBurst"||f.kind==="muzzle"){
      const d=getWeaponTierStats(f.weaponId,f.tier||1),v=weaponVisual(d,f.tier||1);ctx.save();ctx.translate(f.x,f.y);ctx.globalAlpha=t;ctx.strokeStyle=d.color;ctx.fillStyle=d.color;ctx.shadowColor=d.color;ctx.shadowBlur=v.glow;
      if(f.kind==="muzzle"){
        ctx.rotate(-(f.angle||0));for(let i=0;i<v.particles;i++){const a=(i-v.particles/2)*.22,rr=10+(1-t)*18;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);ctx.stroke();}
      }else{
        const impact=v.impact,r=12+(1-t)*28*v.scale;
        if(["ring","echo","field","orbital"].includes(impact)){ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.55,0,Math.PI*2);ctx.stroke();}
        else if(["star","firework","radial","spark"].includes(impact)){for(let i=0;i<8+(v.tier-1)*2;i++){const a=i/(8+(v.tier-1)*2)*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.cos(a)*5,Math.sin(a)*5);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}}
        else if(["ground","terrain","dust","sprout"].includes(impact)){for(let i=0;i<7;i++){const a=Math.PI*(.10+.80*i/6);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*r, -Math.sin(a)*r*.65);ctx.stroke();}}
        else if(impact==="electric"){for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*r*.45,Math.sin(a)*r*.45);ctx.lineTo(Math.cos(a+.18)*r,Math.sin(a+.18)*r);ctx.stroke();}}
        else if(impact==="splash"){for(let i=0;i<7;i++){const a=Math.PI*(.15+.70*i/6);ctx.beginPath();ctx.arc(Math.cos(a)*r*.6,-Math.sin(a)*r*.45,2.5+v.tier*.4,0,Math.PI*2);ctx.fill();}}
        else{ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();for(let i=0;i<v.particles;i++){const a=i/v.particles*Math.PI*2;ctx.beginPath();ctx.arc(Math.cos(a)*r*.75,Math.sin(a)*r*.75,2,0,Math.PI*2);ctx.fill();}}
      }
      ctx.restore();
    }else if(f.kind==="lightningBolt"){
      ctx.save();ctx.globalAlpha=t;ctx.strokeStyle=f.color||"#e7ff82";ctx.shadowColor=f.color||"#e7ff82";ctx.shadowBlur=18;ctx.lineWidth=4;ctx.beginPath();let x=f.x,y=0;ctx.moveTo(x,y);for(let i=1;i<=9;i++){y=f.y*i/9;x=f.x+(i===9?0:Math.sin(i*12.7+f.life*40)*12);ctx.lineTo(x,y);}ctx.stroke();ctx.restore();
    }else if(f.kind==="spiderWeb"){
      ctx.save();ctx.globalAlpha=t;ctx.strokeStyle=f.color||"#eef4ff";ctx.shadowColor="#c6d8ff";ctx.shadowBlur=8;ctx.lineWidth=1.4+(f.tier||1)*.18;for(const q of f.segments){ctx.beginPath();ctx.moveTo(q.x1,q.y1);ctx.lineTo(q.x2,q.y2);ctx.stroke();}ctx.restore();
    }else if(f.kind==="fireworkBurst"){
      ctx.save();ctx.globalAlpha=t;const cols=["#ff657d","#67ddff","#ffe16d","#9d82ff","#65ef9d"];for(let i=0;i<20;i++){const a=i/20*Math.PI*2,r=(1-t)*55+8;ctx.strokeStyle=cols[i%cols.length];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(f.x+Math.cos(a)*r*.45,f.y+Math.sin(a)*r*.45);ctx.lineTo(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r);ctx.stroke();}ctx.restore();
    }else if(f.kind==="deadWeightLock"||f.kind==="bounderLock"){
      ctx.save();ctx.globalAlpha=t;ctx.strokeStyle=f.color||"#fff";ctx.setLineDash([5,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.targetX,f.targetY);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    }else if(f.kind==="stickyBurst"||f.kind==="snakeBurst"||f.kind==="frogBounce"||f.kind==="burnTick"||f.kind==="bulletHit"||f.kind==="deadWeightHit"){
      ctx.save();ctx.globalAlpha=t;ctx.strokeStyle=f.color||"#fff";ctx.fillStyle=f.color||"#fff";ctx.lineWidth=2.5;const r=8+(1-t)*22;ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.stroke();for(let i=0;i<6;i++){const a=i/6*Math.PI*2;ctx.beginPath();ctx.arc(f.x+Math.cos(a)*r*.75,f.y+Math.sin(a)*r*.75,1.8,0,Math.PI*2);ctx.fill();}ctx.restore();
    }else if(f.kind==="beam"){
      ctx.strokeStyle=f.color;ctx.globalAlpha=t;ctx.lineWidth=5;ctx.shadowColor=f.color;ctx.shadowBlur=16;ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;
    }else if(f.kind==="chain"){
      ctx.strokeStyle=f.color;ctx.lineWidth=3;ctx.globalAlpha=t;for(let i=0;i<f.points.length-1;i++){const a=f.points[i],b=f.points[i+1],mx=(a.x+b.x)/2+Math.sin(i*7+f.life*50)*10,my=(a.y+b.y)/2+Math.cos(i*6+f.life*40)*8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(mx,my);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.globalAlpha=1;
    }else if(f.kind==="marker"){
      ctx.strokeStyle=f.color;ctx.globalAlpha=t;ctx.lineWidth=3;ctx.beginPath();ctx.arc(f.x,f.y,22+(1-t)*20,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(f.x-30,f.y);ctx.lineTo(f.x+30,f.y);ctx.moveTo(f.x,f.y-30);ctx.lineTo(f.x,f.y+30);ctx.stroke();ctx.globalAlpha=1;
    }else if(f.kind==="ring"){
      ctx.strokeStyle=f.color;ctx.globalAlpha=t;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(f.x,f.y,75,24,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    }else if(f.kind==="terraform"){
      ctx.strokeStyle=f.color;ctx.globalAlpha=t;ctx.lineWidth=5;ctx.beginPath();ctx.arc(f.x,f.y,55*(1-t*.3),Math.PI,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    }else if(f.kind==="spark"){
      ctx.fillStyle=f.color;ctx.globalAlpha=t;ctx.beginPath();ctx.arc(f.x,f.y,5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    }else if(f.kind==="tankPop"||f.kind==="cratePop"||f.kind==="multiplier"){
      ctx.fillStyle=f.color;ctx.globalAlpha=t*.6;ctx.beginPath();ctx.arc(f.x,f.y,38*(1-t*.2),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    }else if(f.kind==="portalFlash"){
      ctx.strokeStyle=f.color;ctx.globalAlpha=t;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();ctx.globalAlpha=1;
    }
  }
}

function drawAim(ctx,s,W,H){
  const t=currentTank(s);if(!t?.alive||!t.isPlayer||s.phase!=="aim")return;
  const d=getWeaponTierStats(t.selected,t.selectedTier||1),speed=85+s.playerPower*3.05;
  let x=t.x+Math.cos(s.playerAngle)*18,y=t.y-8-Math.sin(s.playerAngle)*18,vx=Math.cos(s.playerAngle)*speed,vy=-Math.sin(s.playerAngle)*speed;
  const dt=.055;ctx.fillStyle="rgba(255,255,255,.55)";
  for(let i=0;i<38;i++){vx+=s.wind*dt;vy+=s.gravity*(d.gravity||1)*dt;x+=vx*dt;y+=vy*dt;if(i%2===0){ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}if(x<0||x>W||y>H||y>=terrainY(s,x))break;}
}

function drawHud(ctx,s,W,H){
  const t=currentTank(s);ctx.fillStyle="rgba(7,12,20,.84)";rr(ctx,14,14,W-28,68,12);ctx.fill();
  ctx.textAlign="left";ctx.fillStyle="#eaf5f7";ctx.font="900 16px sans-serif";ctx.fillText(`ROUND ${s.round}`,30,40);ctx.font="700 11px sans-serif";ctx.fillStyle="#8093a1";ctx.fillText(`${s.arena.name}${s.rogueRun?` · ROGUE ${s.rogueRun.stage}`:""}`,30,60);
  const wd=t?getWeaponTierStats(t.selected,t.selectedTier||1):null;
  ctx.textAlign="center";ctx.fillStyle=t?.color||"#fff";ctx.font="1000 16px sans-serif";ctx.fillText(t?`${t.name} · ${wd?.name||"—"} T${t.selectedTier||1}`:"—",W/2,37);
  ctx.fillStyle="#8799a7";ctx.font="700 11px sans-serif";const fuel=t?(t.maxFuel>9000?"∞":Math.ceil(t.fuel)):"—";ctx.fillText(`Turn ${Math.ceil(s.turnTimer)}s · Fuel ${fuel}`,W/2,59);
  ctx.textAlign="right";ctx.font="900 15px sans-serif";ctx.fillStyle=s.wind>=0?"#75dbff":"#c38dff";ctx.fillText(`${s.wind>=0?"→":"←"} WIND ${Math.abs(s.wind).toFixed(0)}`,W-30,41);ctx.fillStyle="#8799a7";ctx.font="700 11px sans-serif";ctx.fillText(`Gravity ${(s.gravity/150).toFixed(2)}× · Objects ${s.skillObjects.length}`,W-30,60);
  if(s.messageTimer>0){ctx.textAlign="center";ctx.font="1000 18px sans-serif";ctx.fillStyle="#fff";ctx.fillText(s.message,W/2,106);}
}
