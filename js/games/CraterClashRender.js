import {WEAPONS} from "./CraterClashData.js";
import {terrainY,terrainSlope,currentTank,clamp,launchSpeedFromPower,getAssassinTarget,getAssassinHunter} from "./CraterClashEngine.js";
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
  drawTerrainDecor(ctx,state,W,H);
  drawEdgeWalls(ctx,state,W,H);
  drawFires(ctx,state);
  drawFields(ctx,state);
  drawSkillObjects(ctx,state);
  drawCrate(ctx,state);
  drawTanks(ctx,state);
  drawModeMarkers(ctx,state);
  drawProjectiles(ctx,state);
  drawFx(ctx,state);
  drawDamageNumbers(ctx,state);
  ctx.restore();
  drawAim(ctx,state,W,H);
  drawHud(ctx,state,W,H);
  drawDamageSummary(ctx,state,W,H);
}

function drawSky(ctx,s,W,H){
  const [a,b]=s.arena.sky,g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,a);g.addColorStop(.68,b);g.addColorStop(1,"#0b1118");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

  // Soft arena-colored haze, similar to the strong colored ambience of ShellShock arenas.
  const haze=ctx.createRadialGradient(W*.58,H*.30,20,W*.58,H*.30,Math.max(W,H)*.72);
  haze.addColorStop(0,(s.arena.glow||"#74dfff")+"26");haze.addColorStop(.55,(s.arena.glow||"#74dfff")+"0d");haze.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=haze;ctx.fillRect(0,0,W,H);

  // Layered faceted mountain silhouettes.
  const layers=[
    {base:.52,amp:.17,step:W/5.2,alpha:.26},
    {base:.47,amp:.12,step:W/6.8,alpha:.18},
    {base:.42,amp:.09,step:W/8.5,alpha:.12}
  ];
  for(let li=0;li<layers.length;li++){
    const L=layers[li];ctx.fillStyle=`rgba(5,12,18,${L.alpha})`;ctx.beginPath();ctx.moveTo(0,H);
    ctx.lineTo(0,H*L.base);
    for(let i=0,x=0;x<=W+L.step;i++,x+=L.step){
      const n=Math.sin((i+1)*(1.73+s.arenaIndex*.31)+li)*.5+.5;
      const yy=H*(L.base-L.amp*(.35+n*.65));
      ctx.lineTo(x,yy);
      if(x+L.step*.52<W+L.step)ctx.lineTo(x+L.step*.52,H*(L.base-L.amp*(.08+((i+li)%3)*.12)));
    }
    ctx.lineTo(W,H);ctx.closePath();ctx.fill();
  }

  ctx.fillStyle="rgba(255,255,255,.6)";
  for(let i=0;i<68;i++){
    const x=(i*193.7+s.arenaIndex*43)%W,y=(i*71.3+s.arenaIndex*21)%Math.max(80,H*.46);
    ctx.globalAlpha=.18+.30*(.5+.5*Math.sin(s.round*.2+i*1.7));
    const z=i%11===0?2:1;ctx.fillRect(x,y,z,z);
  }
  ctx.globalAlpha=1;
}

function drawTraceSet(ctx,paths,color,width=1.5,dash=[5,7]){
  if(!paths?.length)return;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);
  for(const path of paths){if(path.length<2)continue;ctx.beginPath();ctx.moveTo(path[0].x,path[0].y);for(let i=1;i<path.length;i++)ctx.lineTo(path[i].x,path[i].y);ctx.stroke();}
}
function drawTraces(ctx,s){
  if(!s.settings?.tracer)return;
  ctx.save();ctx.lineCap="round";
  // Bot trail remains the familiar subtle tracer. Player trail deliberately persists across all
  // enemy turns and is brighter so the player can compare the next aim against the previous shot.
  drawTraceSet(ctx,s.botLastShotTraces||[],"rgba(190,229,255,.22)",1.4,[5,7]);
  drawTraceSet(ctx,s.playerPersistentTraces||[],"rgba(92,225,255,.48)",2.0,[7,6]);
  ctx.restore();
}

function drawTerrain(ctx,s,W,H){
  const pal=s.arena.terrain||["#62d980","#2f7558","#173d35"];
  const g=ctx.createLinearGradient(0,H*.42,0,H);
  g.addColorStop(0,pal[0]);g.addColorStop(.20,pal[1]);g.addColorStop(1,pal[2]);
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,H);
  for(let x=0;x<s.terrain.length;x+=2)ctx.lineTo(x,s.terrain[x]);
  ctx.lineTo(W,H);ctx.closePath();ctx.fill();

  // Bright surface rim and subtle horizontal material bands.
  ctx.save();ctx.shadowColor=s.arena.glow||pal[0];ctx.shadowBlur=7;
  ctx.strokeStyle=(s.arena.glow||pal[0])+"aa";ctx.lineWidth=2.2;ctx.beginPath();
  for(let x=0;x<s.terrain.length;x+=3){if(x===0)ctx.moveTo(x,s.terrain[x]);else ctx.lineTo(x,s.terrain[x]);}ctx.stroke();ctx.restore();

  ctx.save();ctx.globalAlpha=.07;ctx.strokeStyle="#ffffff";ctx.lineWidth=1;
  for(let y=Math.floor(H*.56/13)*13;y<H;y+=13){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  ctx.globalAlpha=.05;ctx.strokeStyle="#07131a";
  for(let x=0;x<W;x+=34){ctx.beginPath();ctx.moveTo(x,H*.54);ctx.lineTo(x+12,H);ctx.stroke();}
  ctx.restore();
}

function drawTerrainDecor(ctx,s,W,H){
  const pal=s.arena.terrain||["#62d980","#2f7558","#173d35"];
  const clusters=[
    {x:.018,n:9,spread:55},{x:.075,n:5,spread:48},{x:.91,n:6,spread:48},{x:.975,n:9,spread:55},
    {x:.34+(s.arenaIndex%3)*.07,n:3,spread:30}
  ];
  ctx.save();
  for(let c=0;c<clusters.length;c++){
    const q=clusters[c],cx=W*q.x;
    for(let i=0;i<q.n;i++){
      const seed=(i+1)*(c+3)*17.13+s.arenaIndex*9.7;
      const ox=(Math.sin(seed)*.5+.5)*q.spread-q.spread*.5;
      const x=clamp(cx+ox,5,W-5),y=terrainY(s,x)-2;
      const rw=5+((i*7+c*3)%9),rh=4+((i*5+c)%7);
      ctx.translate(x,y);ctx.rotate((Math.sin(seed*1.7))*.35);
      ctx.fillStyle=i%2?pal[1]:pal[2];ctx.strokeStyle=(s.arena.glow||pal[0])+"55";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(-rw,0);ctx.lineTo(-rw*.65,-rh*.75);ctx.lineTo(-rw*.1,-rh);ctx.lineTo(rw*.72,-rh*.55);ctx.lineTo(rw,0);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.rotate(-(Math.sin(seed*1.7))*.35);ctx.translate(-x,-y);
    }
  }
  ctx.restore();
}

function drawEdgeWalls(ctx,s,W,H){
  const wallH=s.edgeWallHeight||H*.20;
  ctx.save();ctx.lineCap="round";
  for(const side of [0,1]){
    const x=side?W-2:2,gy=terrainY(s,side?W-1:0),top=gy-wallH;
    const glow=ctx.createLinearGradient(x,top,x,gy);glow.addColorStop(0,"rgba(255,115,211,.25)");glow.addColorStop(.45,"rgba(255,115,211,.95)");glow.addColorStop(1,"rgba(255,222,246,.85)");
    ctx.strokeStyle=glow;ctx.shadowColor="#ff73d3";ctx.shadowBlur=15;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,gy);ctx.stroke();
    ctx.shadowBlur=0;ctx.strokeStyle="rgba(255,240,251,.75)";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,gy);ctx.stroke();
    ctx.fillStyle="rgba(255,147,220,.9)";ctx.beginPath();ctx.arc(x,top,5,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
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
    }else if(o.kind==="loot"){
      ctx.save();ctx.translate(o.x,o.y);ctx.rotate(Math.sin((s.round+o.id)*.7)*.10);ctx.shadowColor="#7eeeff";ctx.shadowBlur=20;
      const g=ctx.createLinearGradient(-15,-15,15,15);g.addColorStop(0,"#fff0a6");g.addColorStop(.45,"#ffc955");g.addColorStop(1,"#55dff3");ctx.fillStyle=g;rr(ctx,-14,-11,28,22,5);ctx.fill();
      ctx.strokeStyle="#eaffff";ctx.lineWidth=2;ctx.stroke();ctx.fillStyle="#102330";ctx.font="1000 11px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("LOOT",0,1);ctx.restore();
    }
  }
}

function drawTanks(ctx,s){
  const cur=currentTank(s);
  for(const t of s.tanks){
    if(!t.alive)continue;
    const slope=terrainSlope(s,t.x),jug=t.isJuggernaut,scale=jug?1.24:1;
    ctx.save();ctx.translate(t.x,t.y);ctx.rotate(slope*.72);ctx.scale(scale,scale);
    if(cur?.id===t.id||jug){ctx.shadowColor=t.color;ctx.shadowBlur=jug?24:16;}

    // Tracks
    const trackG=ctx.createLinearGradient(0,-2,0,10);trackG.addColorStop(0,"#303943");trackG.addColorStop(1,"#121820");
    ctx.fillStyle=trackG;rr(ctx,-18,-1,36,12,5);ctx.fill();
    ctx.strokeStyle=t.color;ctx.globalAlpha=.65;ctx.lineWidth=1.5;ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle="#0a1016";
    for(const wx of [-12,-4,4,12]){ctx.beginPath();ctx.arc(wx,5,3.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#64707a";ctx.lineWidth=.8;ctx.stroke();}

    // Hull + turret
    const hull=ctx.createLinearGradient(-16,-15,16,0);hull.addColorStop(0,t.color);hull.addColorStop(1,"#27424b");
    ctx.fillStyle=hull;ctx.beginPath();ctx.moveTo(-16,-4);ctx.lineTo(-12,-14);ctx.lineTo(11,-14);ctx.lineTo(17,-5);ctx.lineTo(12,0);ctx.lineTo(-13,0);ctx.closePath();ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.34)";ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle="#17232d";rr(ctx,-8,-20,16,8,4);ctx.fill();ctx.strokeStyle=t.color;ctx.stroke();
    ctx.strokeStyle=t.color;ctx.lineWidth=4;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(1,-17);ctx.lineTo(Math.cos(t.angle)*23,-17-Math.sin(t.angle)*23);ctx.stroke();
    ctx.fillStyle="#e9fbff";ctx.beginPath();ctx.arc(1,-17,2,0,Math.PI*2);ctx.fill();
    if(jug){
      ctx.strokeStyle="#ffd36c";ctx.shadowColor="#ffb84f";ctx.shadowBlur=18;ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(0,-8,25+Math.sin(s.round*.35)*2,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle="#ffd66c";ctx.font="1000 13px sans-serif";ctx.textAlign="center";ctx.fillText("♛",0,-29);
    }
    ctx.restore();

    // Name, health and armor.
    const labelY=t.y-(jug?59:48);
    ctx.textAlign="center";ctx.font=jug?"1000 10px sans-serif":"900 9px sans-serif";ctx.fillStyle=jug?"#ffe29a":"#edf4f7";ctx.fillText(t.name,t.x,labelY);
    const w=jug?78:62;ctx.fillStyle="rgba(0,0,0,.58)";ctx.fillRect(t.x-w/2,labelY+5,w,6);
    ctx.fillStyle=t.hp/t.maxHp>.45?(jug?"#ffc65f":"#65dc86"):"#ef6d75";ctx.fillRect(t.x-w/2,labelY+5,w*clamp(t.hp/t.maxHp,0,1),6);
    if(t.armor>0){ctx.fillStyle="rgba(0,0,0,.50)";ctx.fillRect(t.x-w/2,labelY+13,w,3);ctx.fillStyle="#62bdf2";ctx.fillRect(t.x-w/2,labelY+13,w*clamp(t.armor/Math.max(t.trainingArmor||35,t.armor,35),0,1),3);}
    ctx.font="800 8px sans-serif";ctx.fillStyle="#d8e4e9";ctx.fillText(`${Math.ceil(t.hp)} HP${t.armor>0?` · ${Math.ceil(t.armor)} ARM`:""}`,t.x,labelY+26);
    if(t.overchargeReady){ctx.strokeStyle="#f1d95a";ctx.lineWidth=2;ctx.beginPath();ctx.arc(t.x,t.y-4,24,0,Math.PI*2);ctx.stroke();}
    if(cur?.id===t.id&&s.phase==="aim"){
      const fuelPct=t.maxFuel>9000?1:clamp(t.fuel/t.maxFuel,0,1);
      ctx.fillStyle="rgba(3,8,13,.70)";ctx.fillRect(t.x-28,t.y+17,56,4);ctx.fillStyle="#6ce7c2";ctx.fillRect(t.x-28,t.y+17,56*fuelPct,4);
    }
  }
}

function drawModeMarkers(ctx,s){
  const player=s.tanks[0];
  if(player?.alive){
    // Blue player pointer mirrors the readable identification in the reference screenshots.
    ctx.save();ctx.translate(player.x,player.y-78-(player.isJuggernaut?12:0));ctx.shadowColor="#39a9ff";ctx.shadowBlur=16;ctx.fillStyle="#2aa7ff";
    ctx.beginPath();ctx.moveTo(-11,-7);ctx.lineTo(11,-7);ctx.lineTo(0,6);ctx.closePath();ctx.fill();ctx.restore();
  }
  if(s.mode==="assassin"&&player?.alive){
    const target=getAssassinTarget(s,player),hunter=getAssassinHunter(s,player);
    if(target){
      ctx.save();ctx.translate(target.x,target.y-81);ctx.strokeStyle="#ff5f7d";ctx.fillStyle="#ff758d";ctx.shadowColor="#ff4d73";ctx.shadowBlur=18;ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-16,0);ctx.lineTo(-7,0);ctx.moveTo(7,0);ctx.lineTo(16,0);ctx.moveTo(0,-16);ctx.lineTo(0,-7);ctx.moveTo(0,7);ctx.lineTo(0,16);ctx.stroke();
      ctx.font="1000 9px sans-serif";ctx.textAlign="center";ctx.fillText("TARGET",0,-21);ctx.restore();
    }
    if(hunter){
      ctx.save();ctx.strokeStyle="rgba(205,133,255,.8)";ctx.setLineDash([4,5]);ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(player.x,player.y-5,30,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    }
  }
}

function drawProjectileTrail(ctx,p,d,v){
  const pts=(p.trace||[]).slice(-18);if(pts.length<2)return;
  ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
  const alpha=.16+v.tier*.045;
  if(["droplets","embers","acid","spark","dust","disco","slime","rainbowSpark","redSmoke","greenSmoke","flareSmoke","electricTrail","thread","formation","orangePulse","fracture","syncgreen","wing","metal","ramStreak","rage","snow","jetSmoke","pinkFracture"].includes(v.trail)){
    const step=v.trail==="disco"?2:3;
    for(let i=0;i<pts.length;i+=step){
      const q=pts[i],fade=(i+1)/pts.length;
      ctx.globalAlpha=alpha*fade;
      ctx.fillStyle=v.trail==="acid"?"#a6ff65":v.trail==="embers"?(i%2?"#ff6a42":"#ffd06e"):v.trail==="disco"?(["#ff72cf","#72eaff","#ffe66d"][i%3]):v.trail==="rainbowSpark"?(["#ff5b75","#66dfff","#ffe46c","#9b7cff"][i%4]):v.trail==="redSmoke"?"#ff5d69":v.trail==="greenSmoke"?"#4bdb86":v.trail==="flareSmoke"?"#e7eef4":v.trail==="slime"?"#7bec62":v.trail==="electricTrail"?"#dfff72":v.trail==="thread"?"#eef3ff":v.trail==="orangePulse"?(i%2?"#ff9d3d":"#ffe18a"):v.trail==="fracture"?"#f1a6dd":v.trail==="syncgreen"?"#7dff99":v.trail==="wing"?"#f4f5ee":v.trail==="metal"?"#d8dee5":v.trail==="ramStreak"?"#b48cff":v.trail==="rage"?"#ff784c":v.trail==="snow"?"#dff8ff":v.trail==="jetSmoke"?"#c9d2d6":v.trail==="pinkFracture"?"#ff9bdc":d.color;
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
    case "diggerball":ctx.beginPath();ctx.arc(0,0,r*1.12,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle="#ffe6a0";ctx.lineWidth=1.8;for(let k=-1;k<=1;k++){ctx.beginPath();ctx.arc(-r*.2+k*r*.35,0,r*.45,-1.1,1.1);ctx.stroke();}ctx.beginPath();ctx.moveTo(r*1.25,-r*.5);ctx.lineTo(r*1.7,0);ctx.lineTo(r*1.25,r*.5);ctx.stroke();break;
    case "zipper":ctx.beginPath();ctx.roundRect(-r*1.5,-r*.5,r*3,r,r*.5);ctx.fill();ctx.stroke();ctx.strokeStyle="#fff";ctx.beginPath();ctx.moveTo(-r*.8,0);ctx.lineTo(-r*.15,-r*.55);ctx.lineTo(r*.25,r*.45);ctx.lineTo(r*.95,-r*.18);ctx.stroke();break;
    case "pinata":ctx.save();ctx.rotate(Math.PI/4);ctx.fillStyle="#ff73d2";ctx.fillRect(-r*.8,-r*.8,r*1.6,r*1.6);ctx.strokeRect(-r*.8,-r*.8,r*1.6,r*1.6);ctx.restore();ctx.fillStyle="#ffe066";ctx.beginPath();ctx.arc(-r*.7,-r*.7,r*.25,0,Math.PI*2);ctx.arc(r*.7,r*.7,r*.25,0,Math.PI*2);ctx.fill();break;
    case "vshot":ctx.fillStyle=d.color;ctx.beginPath();ctx.moveTo(-r*1.2,-r*.8);ctx.lineTo(0,r*.8);ctx.lineTo(r*1.2,-r*.8);ctx.lineTo(r*.65,-r*.8);ctx.lineTo(0,r*.18);ctx.lineTo(-r*.65,-r*.8);ctx.closePath();ctx.fill();ctx.stroke();break;
    case "sun":ctx.fillStyle="#ffd85f";ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle="#fff2a7";for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*1.25,Math.sin(a)*r*1.25);ctx.lineTo(Math.cos(a)*r*1.85,Math.sin(a)*r*1.85);ctx.stroke();}break;
    case "sync":ctx.fillStyle="#7cf393";ctx.beginPath();ctx.arc(0,0,r*.85,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(0,0,r*1.5,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;break;
    case "gull":ctx.fillStyle="#f4f5ef";ctx.beginPath();ctx.moveTo(r*1.5,0);ctx.quadraticCurveTo(r*.2,-r*.15,-r*.55,-r*.95);ctx.quadraticCurveTo(-r*.35,-r*.15,-r*1.45,0);ctx.quadraticCurveTo(-r*.35,r*.15,-r*.55,r*.95);ctx.quadraticCurveTo(r*.2,r*.15,r*1.5,0);ctx.fill();ctx.stroke();ctx.fillStyle="#f2b14c";ctx.beginPath();ctx.moveTo(r*1.45,0);ctx.lineTo(r*2.0,-r*.15);ctx.lineTo(r*2.0,r*.15);ctx.closePath();ctx.fill();break;
    case "shrapnel":ctx.fillStyle="#d8dee5";ctx.beginPath();ctx.moveTo(r*1.6,0);ctx.lineTo(-r*.2,-r*.7);ctx.lineTo(-r*1.25,-r*.2);ctx.lineTo(-r*.55,r*.75);ctx.closePath();ctx.fill();ctx.stroke();break;
    case "ram":ctx.fillStyle=d.color;ctx.beginPath();ctx.arc(-r*.25,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(r*.45,-r*.7);ctx.lineTo(r*1.85,0);ctx.lineTo(r*.45,r*.7);ctx.closePath();ctx.fill();ctx.stroke();break;
    case "ragebolt":ctx.strokeStyle=d.color;ctx.lineWidth=Math.max(3,r*.55);ctx.beginPath();ctx.moveTo(-r*1.6,0);ctx.bezierCurveTo(-r*.8,-r,r*.1,r,r*1.6,0);ctx.stroke();ctx.fillStyle="#ffd15c";ctx.beginPath();ctx.arc(r*1.55,0,r*.35,0,Math.PI*2);ctx.fill();break;
    case "snowball":ctx.fillStyle="#eefcff";ctx.beginPath();ctx.arc(0,0,r*1.08,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#9feaff";ctx.stroke();ctx.fillStyle="#bdefff";ctx.beginPath();ctx.arc(-r*.3,-r*.35,r*.22,0,Math.PI*2);ctx.fill();break;
    case "jet":ctx.fillStyle="#cbd8df";ctx.beginPath();ctx.moveTo(r*1.9,0);ctx.lineTo(r*.25,-r*.35);ctx.lineTo(-r*.5,-r*1.25);ctx.lineTo(-r*.25,-r*.3);ctx.lineTo(-r*1.55,-r*.22);ctx.lineTo(-r*1.55,r*.22);ctx.lineTo(-r*.25,r*.3);ctx.lineTo(-r*.5,r*1.25);ctx.lineTo(r*.25,r*.35);ctx.closePath();ctx.fill();ctx.stroke();break;
    case "madbreaker":ctx.fillStyle=d.color;polygon(ctx,4,r*1.25,Math.PI/4);ctx.fill();ctx.stroke();ctx.strokeStyle="#fff0fa";ctx.beginPath();ctx.moveTo(-r*.55,-r*.55);ctx.lineTo(0,0);ctx.lineTo(r*.45,-r*.15);ctx.moveTo(0,0);ctx.lineTo(-r*.2,r*.65);ctx.stroke();break;
    case "fury":ctx.fillStyle=d.color;ctx.beginPath();ctx.moveTo(r*1.3,0);ctx.quadraticCurveTo(0,-r*1.4,-r*.85,-r*.3);ctx.quadraticCurveTo(-r*1.2,0,-r*.75,r*.85);ctx.quadraticCurveTo(.1,r*.35,r*1.3,0);ctx.fill();ctx.stroke();break;

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
    if(p.weaponId==="snowball")v.scale*=1+(p.snowBounce||0)*.18;
    if(p.weaponId==="breakermadness")v.scale*=1+(p.madStage||0)*.10;

    if(p.kind==="breakerPiece"){
      const pts=(p.trace||[]).slice(-22);ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
      if(pts.length>1){ctx.strokeStyle="rgba(55,255,103,.62)";ctx.shadowColor="#39ff74";ctx.shadowBlur=10;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.stroke();ctx.strokeStyle="rgba(197,255,210,.85)";ctx.lineWidth=1.5;ctx.stroke();}
      ctx.translate(p.x,p.y);ctx.shadowColor="#4cff79";ctx.shadowBlur=18;ctx.fillStyle="#f2fff4";ctx.beginPath();ctx.arc(0,0,4.5,0,Math.PI*2);ctx.fill();ctx.fillStyle="#55f678";ctx.beginPath();ctx.arc(0,0,2.5,0,Math.PI*2);ctx.fill();ctx.restore();continue;
    }
    if(p.fleetShot){
      const pts=(p.trace||[]).slice(-15);ctx.save();ctx.lineCap="round";
      if(pts.length>1){ctx.strokeStyle="rgba(135,216,255,.23)";ctx.setLineDash([2,5]);ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.stroke();ctx.setLineDash([]);}
      const ang=Math.atan2(p.vy,p.vx);ctx.translate(p.x,p.y);ctx.rotate(ang);ctx.shadowColor="#55dfff";ctx.shadowBlur=12;ctx.fillStyle="#51d7ff";ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-5,-4);ctx.lineTo(-2,0);ctx.lineTo(-5,4);ctx.closePath();ctx.fill();ctx.restore();continue;
    }
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
    }else if(f.kind==="horizonWave"){
      const y=terrainY(s,f.x)-3,t=clamp(f.life/f.max,0,1);ctx.save();ctx.strokeStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=15;ctx.lineWidth=4;ctx.globalAlpha=.55+.35*t;ctx.beginPath();ctx.arc(f.x,y,12+Math.sin(f.life*15)*4,Math.PI,Math.PI*2);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(f.x-18,y);ctx.lineTo(f.x+18,y);ctx.stroke();ctx.restore();
    }else if(f.kind==="viperPath"){
      const t=clamp(f.life/f.max,0,1);ctx.save();ctx.strokeStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=10;ctx.lineWidth=3;ctx.globalAlpha=.7*t+.25;ctx.beginPath();for(let i=0;i<7;i++){const xx=f.x-i*9,yy=terrainY(s,clamp(xx,0,s.width-1))-4+Math.sin(i*1.5+f.life*18)*4;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();ctx.restore();
    }else if(f.kind==="gunshipRun"){
      const t=clamp(f.life/f.max,0,1);ctx.save();ctx.translate(f.x,f.y);ctx.globalAlpha=.75+.25*t;ctx.fillStyle="#b9d7e6";ctx.strokeStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=9;ctx.beginPath();ctx.moveTo(31,0);ctx.lineTo(4,-7);ctx.lineTo(-13,-18);ctx.lineTo(-7,-5);ctx.lineTo(-31,-2);ctx.lineTo(-31,4);ctx.lineTo(-7,5);ctx.lineTo(-13,18);ctx.lineTo(4,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#24313c";ctx.fillRect(-1,5,4,10);ctx.restore();
    }else if(f.kind==="hoverStrike"){
      const t=clamp(f.life/f.max,0,1);ctx.save();ctx.strokeStyle=f.color;ctx.fillStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=18;ctx.globalAlpha=.55+.4*t;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(f.x,f.y+14);ctx.lineTo(f.targetX,terrainY(s,f.targetX));ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(f.x,f.y,12+Math.sin(f.life*9)*2,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(f.x,f.y,20,6,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }else if(f.kind==="discoHang"){
      const t=clamp(f.life/f.max,0,1);ctx.save();ctx.globalAlpha=.7+.3*t;ctx.strokeStyle="#d8e4f0";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(f.x,0);ctx.lineTo(f.x,f.y-12);ctx.stroke();ctx.translate(f.x,f.y);ctx.rotate(f.life*4);const r=13;ctx.shadowColor=f.color;ctx.shadowBlur=18;ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=1;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-r,i*r*.4);ctx.lineTo(r,i*r*.4);ctx.stroke();ctx.beginPath();ctx.moveTo(i*r*.4,-r);ctx.lineTo(i*r*.4,r);ctx.stroke();}ctx.restore();
    }else if(f.kind==="palmTree"){
      const t=clamp(f.life/f.max,0,1);ctx.save();ctx.globalAlpha=.6+.35*t;ctx.strokeStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=12;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.quadraticCurveTo(f.x+10,f.y-52,f.x,f.y-96);ctx.stroke();ctx.lineWidth=3;for(let i=0;i<7;i++){const a=-Math.PI*.9+i/6*Math.PI*.8;ctx.beginPath();ctx.moveTo(f.x,f.y-96);ctx.quadraticCurveTo(f.x+Math.cos(a)*35,f.y-115+Math.sin(a)*12,f.x+Math.cos(a)*55,f.y-89+Math.sin(a)*30);ctx.stroke();}ctx.restore();
    }else if(f.kind==="zipper"){
      const t=clamp(f.life/f.max,0,1),yy=terrainY(s,f.x)-5;ctx.save();ctx.translate(f.x,yy);ctx.shadowColor=f.color;ctx.shadowBlur=18;ctx.fillStyle=f.color;ctx.strokeStyle="#f3ffff";ctx.lineWidth=1.5;ctx.globalAlpha=.72+.28*t;ctx.beginPath();ctx.ellipse(0,0,f.r*1.45,f.r*.7,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle=f.color;ctx.globalAlpha=.38;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-f.dir*26,0);ctx.lineTo(0,0);ctx.stroke();ctx.restore();
    }else if(f.kind==="spikerRun"){
      ctx.save();ctx.globalAlpha=.78;for(let i=0;i<(f.placed||[]).length;i++){const q=f.placed[i],sl=terrainSlope(s,q.x),nx=Math.sin(sl),ny=-Math.cos(sl);ctx.strokeStyle=i===(f.placed.length-1)?"#eef4f7":"#9ba6ae";ctx.shadowColor="#d9e1e6";ctx.shadowBlur=5;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.x+nx*38,q.y+ny*38);ctx.stroke();}ctx.restore();
    }else if(f.kind==="pinataWait"){
      ctx.save();ctx.translate(f.x,terrainY(s,f.x)-6);ctx.globalAlpha=.65+.25*Math.sin(f.life*9);ctx.strokeStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=15;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(18,0);ctx.moveTo(0,-18);ctx.lineTo(0,18);ctx.stroke();ctx.restore();
    }else if(f.kind==="pinataDrop"){
      ctx.save();ctx.strokeStyle="#e7edf2";ctx.globalAlpha=.9;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(f.x,0);ctx.lineTo(f.x,f.y-13);ctx.stroke();ctx.translate(f.x,f.y);ctx.rotate(Math.sin(f.life*5+f.index)*.16);const cols=["#ff69cb","#65ddff","#ffe166","#8cec6e","#af7bff"];ctx.shadowColor=cols[f.pattern%cols.length];ctx.shadowBlur=16;for(let k=0;k<5;k++){ctx.fillStyle=cols[(k+f.pattern)%cols.length];ctx.fillRect(-13+k*5,-11,5,22);}ctx.strokeStyle="#fff";ctx.strokeRect(-13,-11,25,22);ctx.fillStyle="#ffe06c";ctx.beginPath();ctx.moveTo(-13,-7);ctx.lineTo(-19,-13);ctx.lineTo(-16,-3);ctx.fill();ctx.restore();
    }else if(f.kind==="sunburstField"){
      const elapsed=f.max-f.life,dur=.70,phase=elapsed<dur?0:1,local=phase===0?clamp(elapsed/dur,0,1):clamp((elapsed-dur)/dur,0,1),rad=(phase===0?local:1-local)*(f.range||120);
      ctx.save();ctx.translate(f.x,f.y);ctx.shadowColor=f.color;ctx.shadowBlur=12;ctx.globalAlpha=.34+.46*clamp(f.life/f.max,0,1);
      for(let i=0;i<f.rays;i++){
        const a=i/f.rays*Math.PI*2;ctx.strokeStyle=i%3===0?"#fff3a0":f.color;ctx.lineWidth=i%3===0?1.8:1.15;ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(Math.cos(a)*8,Math.sin(a)*8);ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);ctx.stroke();ctx.setLineDash([]);
        const ex=Math.cos(a)*rad,ey=Math.sin(a)*rad;for(let k=0;k<3;k++){ctx.fillStyle=k===0?"#fff7b7":f.color;ctx.globalAlpha=.42+(.22*k);ctx.beginPath();ctx.arc(ex+Math.cos(a+.9+k)*k*4,ey+Math.sin(a+.7+k)*k*4,1.2+k*.45,0,Math.PI*2);ctx.fill();}
      }
      ctx.globalAlpha=.95;ctx.fillStyle="#fff1a0";ctx.beginPath();ctx.arc(0,0,7+Math.sin(f.life*12)*2,0,Math.PI*2);ctx.fill();ctx.restore();
    }else if(f.kind==="jetRocketBurst"){
      ctx.save();ctx.translate(f.x,f.y);ctx.globalAlpha=.78;ctx.fillStyle="#cbd8df";ctx.strokeStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=10;ctx.beginPath();ctx.moveTo(30,0);ctx.lineTo(5,-6);ctx.lineTo(-10,-18);ctx.lineTo(-7,-5);ctx.lineTo(-28,-2);ctx.lineTo(-28,4);ctx.lineTo(-7,5);ctx.lineTo(-10,18);ctx.lineTo(5,7);ctx.closePath();ctx.fill();ctx.stroke();for(let i=f.index||0;i<(f.count||4);i++){ctx.fillStyle="#ffcf63";ctx.beginPath();ctx.arc(-5-i*5,12,2,0,Math.PI*2);ctx.fill();}ctx.restore();
    }else if(f.kind==="furyTower"){
      const elapsed=f.max-f.life,rise=f.rise||.55,topY=f.y-Math.min(1,elapsed/rise)*(f.height||170),t=clamp(f.life/f.max,0,1);ctx.save();ctx.strokeStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=20;ctx.lineWidth=5;ctx.globalAlpha=.55+.3*t;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x,topY);ctx.stroke();ctx.fillStyle=(f.index||0)>=(f.orange||25)?"#65bfff":f.color;ctx.beginPath();ctx.arc(f.x,topY,9+Math.sin(f.life*12)*2,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#ffd7a0";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(f.x,topY,16,0,Math.PI*2);ctx.stroke();ctx.restore();
    }else if(f.kind==="twinkleDrop"||f.kind==="twinkleFinal"||f.kind==="timeEcho"||f.kind==="nukeShock"){
      const t=clamp(f.life/f.max,0,1),r=f.kind==="nukeShock"?28+(1-t)*45:f.kind==="timeEcho"?11+(1-t)*20:7+(1-t)*10;ctx.save();ctx.globalAlpha=.55+.35*t;ctx.strokeStyle=f.color||"#fff";ctx.shadowColor=f.color||"#fff";ctx.shadowBlur=12;ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.stroke();if(f.kind==="timeEcho"){ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x,f.y-r*.7);ctx.moveTo(f.x,f.y);ctx.lineTo(f.x+r*.5,f.y);ctx.stroke();}ctx.restore();
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
    }else if(f.kind==="ringerBurst"){
      ctx.save();ctx.globalAlpha=t;ctx.shadowColor=f.color;ctx.shadowBlur=16;ctx.strokeStyle=f.color;ctx.lineWidth=4;for(const q of f.rings||[]){ctx.beginPath();ctx.arc(q.x,q.y,(q.r||55)*(1+(1-t)*.07),0,Math.PI*2);ctx.stroke();ctx.strokeStyle="#fff3b4";ctx.globalAlpha=t*.35;ctx.beginPath();ctx.arc(q.x,q.y,Math.max(1,(q.r||55)-(q.thickness||10)),0,Math.PI*2);ctx.stroke();ctx.strokeStyle=f.color;ctx.globalAlpha=t;}ctx.restore();
    }else if(f.kind==="spikeLaunch"){
      ctx.save();ctx.globalAlpha=t;ctx.strokeStyle=f.color||"#dbe1e6";ctx.shadowColor=f.color||"#dbe1e6";ctx.shadowBlur=10;ctx.lineWidth=3;for(const q of f.points||[]){const sl=terrainSlope(s,q.x),nx=Math.sin(sl),ny=-Math.cos(sl);ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.x+nx*48*(1-t*.2),q.y+ny*48*(1-t*.2));ctx.stroke();}ctx.restore();
    }else if(f.kind==="pinataBurst"){
      ctx.save();ctx.globalAlpha=t;const cols=["#ff65c8","#62dfff","#ffe15d","#83ee79","#aa78ff"];for(let i=0;i<28;i++){const a=i/28*Math.PI*2+(f.pattern||0)*.25,r=10+(1-t)*56;ctx.fillStyle=cols[(i+(f.pattern||0))%cols.length];ctx.save();ctx.translate(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r*.72);ctx.rotate(a+f.life*6);ctx.fillRect(-2,-4,4,8);ctx.restore();}ctx.restore();
    }else if(f.kind==="shrapnelBurst"){
      ctx.save();ctx.globalAlpha=t;ctx.strokeStyle=f.color;ctx.shadowColor="#fff";ctx.shadowBlur=6;ctx.lineWidth=1.6;const n=Math.min(24,f.count||20),r=12+(1-t)*48;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;ctx.beginPath();ctx.moveTo(f.x+Math.cos(a)*6,f.y+Math.sin(a)*6);ctx.lineTo(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r);ctx.stroke();}ctx.restore();
    }else if(f.kind==="sunFlash"){
      ctx.save();ctx.translate(f.x,f.y);ctx.globalAlpha=t;ctx.fillStyle="#fff6b8";ctx.strokeStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=25;ctx.beginPath();ctx.arc(0,0,10+(1-t)*8,0,Math.PI*2);ctx.fill();ctx.lineWidth=3;for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=18+(1-t)*45;ctx.beginPath();ctx.moveTo(Math.cos(a)*12,Math.sin(a)*12);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}ctx.restore();
    }else if(f.kind==="snowStorm"){
      ctx.save();ctx.globalAlpha=t;ctx.strokeStyle=f.color||"#bdeeff";ctx.fillStyle="#edfaff";ctx.shadowColor="#bdeeff";ctx.shadowBlur=12;for(let i=0;i<18;i++){const x=f.x+(i-8.5)*10,y=f.y-65-(i%4)*11+(1-t)*22;ctx.beginPath();ctx.arc(x,y,2+(i%3),0,Math.PI*2);ctx.fill();}ctx.beginPath();ctx.ellipse(f.x,f.y-70,90,24,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }else if(f.kind==="furyRise"){
      ctx.save();ctx.globalAlpha=t;ctx.strokeStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=20;ctx.lineWidth=5;const h=(1-t)*110+25;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x,f.y-h);ctx.stroke();ctx.fillStyle="#ffd06d";ctx.beginPath();ctx.arc(f.x,f.y-h,7,0,Math.PI*2);ctx.fill();ctx.restore();
    }else if(["diggerHit","breakerOpen","madnessBreak","smartSnipeLock","sniperHit","sniperMiss","zipperStart","zipperTrail","zipperTurn","spikeGuide","napalmBurst","sunRayPoint","snowBurst","furyCore","jetApex","jetLaunch","jetRocketHit","syncHold","syncRelease","seagullDrop","ramDive","ramBounce","solarBounce","vLaunch","rampageHit","fireStorm","fireStormRocks"].includes(f.kind)){
      ctx.save();ctx.globalAlpha=t;ctx.strokeStyle=f.color||"#fff";ctx.fillStyle=f.color||"#fff";ctx.shadowColor=f.color||"#fff";ctx.shadowBlur=10;ctx.lineWidth=2.2;const r=5+(1-t)*(f.kind==="diggerHit"?28:f.kind==="snowBurst"?24:18);
      if(f.kind==="diggerHit"){ctx.beginPath();ctx.ellipse(f.x,f.y,r,r*.32,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(f.x,f.y-r*.2);ctx.lineTo(f.x,f.y-r*1.15);ctx.stroke();}
      else if(f.kind==="breakerOpen"||f.kind==="madnessBreak"||f.kind==="vLaunch"||f.kind==="napalmBurst"){const n=Math.min(16,f.count||8);for(let i=0;i<n;i++){const a=i/n*Math.PI*2;ctx.beginPath();ctx.moveTo(f.x+Math.cos(a)*3,f.y+Math.sin(a)*3);ctx.lineTo(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r);ctx.stroke();}}
      else if(f.kind==="smartSnipeLock"){ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(f.x-r*1.5,f.y);ctx.lineTo(f.x+r*1.5,f.y);ctx.moveTo(f.x,f.y-r*1.5);ctx.lineTo(f.x,f.y+r*1.5);ctx.stroke();}
      else if(f.kind==="ramDive"){ctx.beginPath();ctx.moveTo(f.x,f.y-r*1.5);ctx.lineTo(f.x,f.y+r*.8);ctx.stroke();ctx.beginPath();ctx.moveTo(f.x-r*.4,f.y+r*.25);ctx.lineTo(f.x,f.y+r*.8);ctx.lineTo(f.x+r*.4,f.y+r*.25);ctx.stroke();}
      else if(f.kind==="syncHold"){ctx.beginPath();ctx.arc(f.x,f.y,7,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(f.x,f.y,12,0,Math.PI*2);ctx.stroke();}
      else if(f.kind==="syncRelease"){for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r);ctx.stroke();}}
      else if(f.kind==="seagullDrop"){ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x,f.y+r);ctx.stroke();ctx.beginPath();ctx.arc(f.x,f.y+r,2.5,0,Math.PI*2);ctx.fill();}
      else if(f.kind==="snowBurst"){for(let i=0;i<8;i++){const a=i/8*Math.PI*2;ctx.beginPath();ctx.arc(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r,2,0,Math.PI*2);ctx.fill();}}
      else if(f.kind==="jetApex"||f.kind==="jetLaunch"||f.kind==="jetRocketHit"){ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(f.x-r,f.y);ctx.lineTo(f.x+r,f.y);ctx.stroke();}
      else {ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.stroke();}
      ctx.restore();
    }else if(f.kind==="moonPortal"){
      ctx.save();ctx.globalAlpha=t;ctx.translate(f.x,f.y);ctx.strokeStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=20;ctx.lineWidth=2.5+(f.tier||1)*.5;const rings=1+(f.moonFx||1);for(let i=0;i<rings;i++){ctx.beginPath();ctx.ellipse(0,0,52+i*18,14+i*5,f.life*(.6+i*.18),0,Math.PI*2);ctx.stroke();}if((f.tier||1)>=3){ctx.fillStyle="rgba(7,9,20,.75)";ctx.beginPath();ctx.arc(0,0,15+(1-t)*8,0,Math.PI*2);ctx.fill();}ctx.restore();
    }else if(f.kind==="quakeRepair"){
      ctx.save();ctx.globalAlpha=t*.75;ctx.strokeStyle=f.color||"#b0d5ff";ctx.shadowColor=f.color||"#b0d5ff";ctx.shadowBlur=14;ctx.lineWidth=3;for(let i=0;i<4;i++){const r=(1-t)*Math.max(120,s.width*.55)+i*24;ctx.beginPath();ctx.ellipse(f.x,f.y,r,r*.13,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
    }else if(f.kind==="corkscrewBurrow"||f.kind==="mirrorGate"||f.kind==="timeRift"||f.kind==="nukeRing"||f.kind==="twinkleCross"||f.kind==="discoCross"||f.kind==="viperPulse"||f.kind==="viperStrike"||f.kind==="horizonSpark"){
      ctx.save();ctx.globalAlpha=t;ctx.strokeStyle=f.color||"#fff";ctx.fillStyle=f.color||"#fff";ctx.shadowColor=f.color||"#fff";ctx.shadowBlur=12;ctx.lineWidth=2.5;const r=8+(1-t)*32;
      if(f.kind==="mirrorGate"){ctx.translate(f.x,f.y);ctx.rotate(Math.PI/4);ctx.strokeRect(-r*.55,-r*.55,r*1.1,r*1.1);ctx.rotate(-Math.PI/2);ctx.strokeRect(-r*.55,-r*.55,r*1.1,r*1.1);}
      else if(f.kind==="timeRift"){ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(f.x,f.y,r*.55,Math.PI*.35,Math.PI*1.65);ctx.stroke();}
      else if(f.kind==="twinkleCross"||f.kind==="discoCross"){ctx.beginPath();ctx.moveTo(f.x-r,f.y);ctx.lineTo(f.x+r,f.y);ctx.moveTo(f.x,f.y-r);ctx.lineTo(f.x,f.y+r);ctx.stroke();}
      else if(f.kind==="corkscrewBurrow"){ctx.beginPath();for(let i=0;i<20;i++){const q=i/19,a=q*Math.PI*4,rr=q*r,x=f.x+Math.cos(a)*rr,y=f.y+Math.sin(a)*rr*.35;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
      else{ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.stroke();}
      ctx.restore();
    }else if(f.kind==="beam"){
      ctx.strokeStyle=f.color;ctx.globalAlpha=t;ctx.lineWidth=5;ctx.shadowColor=f.color;ctx.shadowBlur=16;ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;
    }else if(f.kind==="chain"){
      ctx.strokeStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=f.web?14:7;ctx.lineWidth=f.web?4:3;ctx.globalAlpha=t;for(let i=0;i<f.points.length-1;i++){const a=f.points[i],b=f.points[i+1],mx=(a.x+b.x)/2+Math.sin(i*7+f.life*50)*10,my=(a.y+b.y)/2+Math.cos(i*6+f.life*40)*8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(mx,my);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.shadowBlur=0;ctx.globalAlpha=1;
    }else if(f.kind==="marker"){
      ctx.strokeStyle=f.color;ctx.globalAlpha=t;ctx.lineWidth=3;ctx.beginPath();ctx.arc(f.x,f.y,22+(1-t)*20,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(f.x-30,f.y);ctx.lineTo(f.x+30,f.y);ctx.moveTo(f.x,f.y-30);ctx.lineTo(f.x,f.y+30);ctx.stroke();ctx.globalAlpha=1;
    }else if(f.kind==="ring"){
      ctx.strokeStyle=f.color;ctx.globalAlpha=t;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(f.x,f.y,75,24,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    }else if(f.kind==="terraform"){
      ctx.strokeStyle=f.color;ctx.globalAlpha=t;ctx.lineWidth=5;ctx.beginPath();ctx.arc(f.x,f.y,55*(1-t*.3),Math.PI,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    }else if(f.kind==="spark"||f.kind==="edgeBounce"){
      ctx.fillStyle=f.color;ctx.globalAlpha=t;ctx.beginPath();ctx.arc(f.x,f.y,5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    }else if(f.kind==="tankPop"||f.kind==="cratePop"||f.kind==="multiplier"){
      ctx.fillStyle=f.color;ctx.globalAlpha=t*.6;ctx.beginPath();ctx.arc(f.x,f.y,38*(1-t*.2),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    }else if(f.kind==="portalFlash"){
      ctx.strokeStyle=f.color;ctx.globalAlpha=t;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();ctx.globalAlpha=1;
    }
  }
}

function drawDamageNumbers(ctx,s){
  for(const n of s.damageNumbers||[]){
    const life=clamp(n.life/n.max,0,1);
    const pop=1+Math.sin((1-life)*Math.PI)*.16;
    const value=Math.max(1,Math.round(n.value));
    let color="#f6f7fb",glow="rgba(255,255,255,.30)",label="";
    if(n.self){color="#cbbcff";glow="rgba(182,146,255,.55)";label="SELF";}
    if(n.x2){color="#ff4f62";glow="rgba(255,55,77,.95)";label="×2";}
    if(n.crit&&!n.x2){color="#72ff86";glow="rgba(72,255,111,1)";label="CRIT";}
    if(n.crit&&n.x2){color="#ff4f62";glow="rgba(77,255,115,1)";label="CRIT ×2";}
    ctx.save();ctx.translate(n.x,n.y);ctx.scale(pop,pop);ctx.globalAlpha=Math.min(1,life*1.55);
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`1000 ${n.crit||n.x2?19:16}px Inter,system-ui,sans-serif`;
    ctx.lineWidth=3;ctx.strokeStyle="rgba(4,8,13,.85)";ctx.shadowColor=glow;ctx.shadowBlur=n.crit||n.x2?15:6;
    ctx.strokeText(String(value),0,0);ctx.fillStyle=color;ctx.fillText(String(value),0,0);
    if(label){ctx.shadowBlur=n.crit?10:5;ctx.font="1000 7px Inter,system-ui,sans-serif";ctx.fillStyle=n.crit?"#8dff99":color;ctx.fillText(label,0,14);}
    ctx.restore();
  }
}

function drawDamageSummary(ctx,s,W,H){
  const q=s.damageSummary;if(!q||q.life<=0)return;
  const t=clamp(q.life/q.max,0,1),appear=clamp((q.max-q.life)/.18,0,1),fade=clamp(q.life/.42,0,1),alpha=Math.min(appear,fade);
  const d=getWeaponTierStats(q.weaponId,q.tier||1);
  const total=Math.round(q.totalDamage);
  const x=W/2,y=Math.max(118,Math.min(H*.24,170));
  const width=Math.min(390,W-30),height=58;
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale(.92+.08*appear,.92+.08*appear);
  const grad=ctx.createLinearGradient(-width/2,0,width/2,0);grad.addColorStop(0,"rgba(7,13,22,.18)");grad.addColorStop(.5,"rgba(7,13,22,.94)");grad.addColorStop(1,"rgba(7,13,22,.18)");
  ctx.fillStyle=grad;ctx.beginPath();ctx.roundRect(-width/2,-height/2,width,height,14);ctx.fill();
  ctx.strokeStyle=q.hadX2?"rgba(255,79,98,.55)":q.crit?"rgba(100,255,129,.55)":"rgba(105,224,255,.28)";ctx.lineWidth=1.5;ctx.stroke();
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="900 9px Inter,system-ui,sans-serif";ctx.fillStyle="#8ba0ae";
  const flags=[q.crit?"CRITICAL":"",q.hadX2?"×2 GATE":""].filter(Boolean).join(" · ");
  ctx.fillText(`${d.name} · T${q.tier}${flags?" · "+flags:""}`,0,-15);
  const color=q.hadX2?"#ff596b":q.crit?"#72ff86":"#f5f9fb";
  ctx.shadowColor=q.crit?"#51ff73":q.hadX2?"#ff3954":"rgba(110,226,255,.5)";ctx.shadowBlur=q.crit||q.hadX2?18:8;
  ctx.font="1000 25px Inter,system-ui,sans-serif";ctx.fillStyle=color;ctx.fillText(`${total} TOTAL DAMAGE`,0,8);
  ctx.shadowBlur=0;ctx.font="800 8px Inter,system-ui,sans-serif";ctx.fillStyle="#718694";ctx.fillText(`${q.hitCount} damage event${q.hitCount===1?"":"s"} · self damage excluded`,0,24);
  ctx.restore();
}

function drawAim(ctx,s,W,H){
  const t=currentTank(s);if(!t?.alive||!t.isPlayer||s.phase!=="aim")return;
  const d=getWeaponTierStats(t.selected,t.selectedTier||1),sx=t.x+Math.cos(s.playerAngle)*18,sy=t.y-8-Math.sin(s.playerAngle)*18;
  ctx.save();ctx.fillStyle="rgba(255,255,255,.58)";ctx.strokeStyle="rgba(200,235,255,.32)";

  // Straight weapons use a straight preview so the displayed tracer actually matches the shot.
  if(t.selected==="raillance"||t.selected==="uzi"){
    const spreads=t.selected==="uzi"?[-(d.straightSpread||.018)*(Math.max(1,d.count||1)-1)*.32,0,(d.straightSpread||.018)*(Math.max(1,d.count||1)-1)*.32]:[0];
    for(let ri=0;ri<spreads.length;ri++){
      const a=s.playerAngle+spreads[ri],alpha=ri===1||spreads.length===1?.60:.22;ctx.globalAlpha=alpha;ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(sx,sy);let ex=sx,ey=sy;
      for(let i=0;i<500;i++){ex+=Math.cos(a)*5;ey-=Math.sin(a)*5;if(ex<0||ex>W||ey<0||ey>H||ey>=terrainY(s,ex))break;}ctx.lineTo(ex,ey);ctx.stroke();ctx.setLineDash([]);
    }
    ctx.restore();return;
  }
  if(t.selected==="rampage"){
    const dir=Math.cos(s.playerAngle)>=0?1:-1,n=d.rampageCount||4,span=dir>0?W-sx:sx;ctx.setLineDash([5,6]);
    for(let k=0;k<n;k++){ctx.globalAlpha=.18+(k===0?.20:0);ctx.strokeStyle=d.color;ctx.beginPath();for(let i=0;i<=55;i++){const q=i/55,x=sx+dir*q*span,y=sy+Math.sin(q*Math.PI*2*(d.rampageWaves||2.2)+k/n*Math.PI*2)*(d.rampageAmplitude||58);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
    ctx.setLineDash([]);ctx.restore();return;
  }
  if(t.selected==="quakecharge"){
    ctx.globalAlpha=.32;ctx.strokeStyle=d.color;ctx.lineWidth=2.5;ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(22,H*.58);ctx.quadraticCurveTo(W*.5,H*.52,W-22,H*.58);ctx.stroke();ctx.setLineDash([]);ctx.restore();return;
  }

  let speed=launchSpeedFromPower(s.playerPower);if(t.selected==="bfg1000")speed*=d.speedMult||.76;
  let x=sx,y=sy,vx=Math.cos(s.playerAngle)*speed,vy=-Math.sin(s.playerAngle)*speed;const dt=.055;let edgeBounces=0;
  for(let i=0;i<54;i++){
    vx+=s.wind*(d.windFactor??1)*dt;vy+=s.gravity*(d.gravity||1)*dt;x+=vx*dt;y+=vy*dt;
    if((x<0||x>W)&&edgeBounces<2){const side=x<0?-1:1,ex=side<0?0:W-1,gy=terrainY(s,ex),top=gy-(s.edgeWallHeight||H*.20);if(y>=top&&y<=gy+10){x=side<0?4:W-4;vx=-vx*.92;edgeBounces++;}}
    if(i%2===0){ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}
    if(x<-4||x>W+4||y>H||(x>=0&&x<W&&y>=terrainY(s,x)))break;
  }
  ctx.restore();
}
function drawHud(ctx,s,W,H){
  const t=currentTank(s);ctx.fillStyle="rgba(7,12,20,.84)";rr(ctx,14,14,W-28,68,12);ctx.fill();
  ctx.textAlign="left";ctx.fillStyle="#eaf5f7";ctx.font="900 16px sans-serif";ctx.fillText(`ROUND ${s.round}`,30,40);ctx.font="700 11px sans-serif";ctx.fillStyle="#8093a1";ctx.fillText(`${s.arena.name}${s.rogueRun?` · ROGUE ${s.rogueRun.stage}`:""}${s.training?" · TRAINING":""}`,30,60);
  const wd=t?getWeaponTierStats(t.selected,t.selectedTier||1):null;
  ctx.textAlign="center";ctx.fillStyle=t?.color||"#fff";ctx.font="1000 16px sans-serif";ctx.fillText(t?`${t.name} · ${wd?.name||"—"} T${t.selectedTier||1}`:"—",W/2,37);
  ctx.fillStyle="#8799a7";ctx.font="700 11px sans-serif";const fuel=t?(t.maxFuel>9000?"∞":Math.ceil(t.fuel)):"—";ctx.fillText(`Turn ${Math.ceil(s.turnTimer)}s · Fuel ${fuel}${t?` · Grip ${Math.round((t.grip||.8)*180/Math.PI)}°`:""}`,W/2,59);
  ctx.textAlign="right";ctx.font="900 15px sans-serif";ctx.fillStyle=s.wind>=0?"#75dbff":"#c38dff";ctx.fillText(`${s.wind>=0?"→":"←"} WIND ${Math.abs(s.wind).toFixed(0)}`,W-30,41);ctx.fillStyle="#8799a7";ctx.font="700 11px sans-serif";ctx.fillText(s.training?`R RESET · ${s.tanks.length-1} DUMMIES`:`Gravity ${(s.gravity/150).toFixed(2)}× · Restock ${s.playerShotsFired%8}/8`,W-30,60);

  let modeText="",modeColor="#74e6ff";
  if(s.mode==="assassin"){
    const p=s.tanks[0],target=getAssassinTarget(s,p),hunter=getAssassinHunter(s,p);
    modeText=`⌖ ASSASSIN · TARGET ${target?.name||"—"} · HUNTER ${hunter?.name||"—"}`;modeColor="#d998ff";
  }else if(s.mode==="juggernaut"){
    const jug=s.tanks.find(q=>q.isJuggernaut),hunters=s.tanks.filter(q=>q.alive&&!q.isJuggernaut).length;
    modeText=jug?.alive?`♛ JUGGERNAUT ${Math.ceil(jug.hp)}/${jug.maxHp} HP · ${hunters} HUNTERS LEFT`:"♛ JUGGERNAUT DOWN";modeColor="#ffc45e";
  }
  if(modeText){
    ctx.textAlign="center";ctx.font="1000 10px sans-serif";const tw=ctx.measureText(modeText).width+24;
    ctx.fillStyle="rgba(6,13,22,.82)";rr(ctx,W/2-tw/2,87,tw,25,8);ctx.fill();ctx.strokeStyle=modeColor+"88";ctx.stroke();ctx.fillStyle=modeColor;ctx.fillText(modeText,W/2,104);
  }
  if(s.messageTimer>0){ctx.textAlign="center";ctx.font="1000 18px sans-serif";ctx.fillStyle="#fff";ctx.fillText(s.message,W/2,modeText?137:106);}
}
