import {TILE,COLORS,CIRCLE,clamp} from './NeonDossierData.js';
import {tileAt,worldToTile,doorAt,lineOfSight} from './NeonDossierWorld.js';

function sx(x,cam){return (x-cam.x)*cam.zoom+cam.w/2;}
function sy(y,cam){return (y-cam.y)*cam.zoom+cam.h/2;}
function inView(x,y,cam,pad=80){const X=sx(x,cam),Y=sy(y,cam);return X>-pad&&Y>-pad&&X<cam.w+pad&&Y<cam.h+pad;}

export function drawGame(ctx,city,citizens,caseData,player,cam,state){
  ctx.clearRect(0,0,cam.w,cam.h);
  ctx.fillStyle='#18221f';ctx.fillRect(0,0,cam.w,cam.h);
  const pt=worldToTile(player.x,player.y),playerBuilding=tileAt(city,pt.x,pt.y)?.buildingId||null;
  drawTiles(ctx,city,cam);
  drawRoadDetails(ctx,city,cam);
  drawObjects(ctx,city,cam,playerBuilding,state);
  drawEvidence(ctx,caseData,cam,state,playerBuilding,city);
  drawCitizens(ctx,city,citizens,cam,playerBuilding,state);
  drawPlayer(ctx,player,cam,state);
  drawDoors(ctx,city,cam,playerBuilding);
  drawRoofs(ctx,city,cam,playerBuilding,state);
  drawRain(ctx,cam,state);
  drawScannerPulse(ctx,player,cam,state);
  drawObjectiveArrow(ctx,player,caseData,cam,state);
}

function drawTiles(ctx,city,cam){
  const minX=clamp(Math.floor((cam.x-cam.w/(2*cam.zoom))/TILE)-1,0,city.width-1);
  const maxX=clamp(Math.ceil((cam.x+cam.w/(2*cam.zoom))/TILE)+1,0,city.width-1);
  const minY=clamp(Math.floor((cam.y-cam.h/(2*cam.zoom))/TILE)-1,0,city.height-1);
  const maxY=clamp(Math.ceil((cam.y+cam.h/(2*cam.zoom))/TILE)+1,0,city.height-1);
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    const t=city.grid[y][x];let c=COLORS.grass;
    if(t.type==='road')c=COLORS.road;
    else if(t.type==='sidewalk')c=COLORS.sidewalk;
    else if(t.type==='floor')c=t.zone==='private'?COLORS.floorPrivate:COLORS.floorPublic;
    else if(t.type==='wall')c=COLORS.wall;
    ctx.fillStyle=c;
    const X=sx(x*TILE,cam),Y=sy(y*TILE,cam),S=TILE*cam.zoom+1;
    ctx.fillRect(X,Y,S,S);
    if(t.type==='wall'){
      ctx.strokeStyle=COLORS.wallEdge;ctx.lineWidth=Math.max(1,2*cam.zoom);ctx.strokeRect(X,Y,S,S);
    }
    if(t.type==='grass'&&((x*13+y*7)%9===0)){
      ctx.fillStyle='#3b574a';ctx.fillRect(X+S*.2,Y+S*.3,2*cam.zoom,6*cam.zoom);
    }
  }
}

function drawRoadDetails(ctx,city,cam){
  ctx.save();ctx.strokeStyle=COLORS.roadLine;ctx.lineWidth=Math.max(1,1.2*cam.zoom);ctx.setLineDash([10*cam.zoom,13*cam.zoom]);
  for(const s of city.streets){
    if(s.axis==='v'){
      const X=sx((s.tile+.5)*TILE,cam);ctx.beginPath();ctx.moveTo(X,sy(0,cam));ctx.lineTo(X,sy(city.worldH,cam));ctx.stroke();
    }else{
      const Y=sy((s.tile+.5)*TILE,cam);ctx.beginPath();ctx.moveTo(sx(0,cam),Y);ctx.lineTo(sx(city.worldW,cam),Y);ctx.stroke();
    }
  }
  ctx.restore();
}

function drawObjects(ctx,city,cam,playerBuilding,state){
  for(const o of city.objects){
    const t=worldToTile(o.x,o.y),bid=tileAt(city,t.x,t.y)?.buildingId||o.buildingId;
    if(bid&&bid!==playerBuilding)continue;
    if(!inView(o.x,o.y,cam))continue;
    const X=sx(o.x,cam),Y=sy(o.y,cam),z=cam.zoom;
    ctx.save();ctx.translate(X,Y);
    if(o.kind==='bed'){ctx.fillStyle='#806e68';ctx.fillRect(-14*z,-9*z,28*z,18*z);ctx.fillStyle='#b7aaa2';ctx.fillRect(-11*z,-7*z,9*z,14*z);}
    else if(o.kind==='desk'||o.kind==='table'){ctx.fillStyle='#786047';ctx.fillRect(-12*z,-8*z,24*z,16*z);ctx.strokeStyle='#2c241d';ctx.strokeRect(-12*z,-8*z,24*z,16*z);}
    else if(o.kind.includes('Terminal')){ctx.fillStyle='#233b43';ctx.fillRect(-10*z,-9*z,20*z,18*z);ctx.fillStyle='#62d8d1';ctx.fillRect(-7*z,-6*z,14*z,8*z);}
    else if(o.kind==='phone'){ctx.fillStyle='#35393b';ctx.fillRect(-8*z,-8*z,16*z,16*z);ctx.fillStyle='#d6b657';ctx.fillRect(-5*z,-5*z,10*z,3*z);}
    else if(o.kind==='addressbook'){ctx.fillStyle='#d0b77b';ctx.fillRect(-8*z,-10*z,16*z,20*z);ctx.strokeStyle='#684f36';ctx.strokeRect(-8*z,-10*z,16*z,20*z);}
    else if(o.kind==='trash'){ctx.fillStyle='#31383a';ctx.beginPath();ctx.arc(0,0,8*z,0,CIRCLE);ctx.fill();ctx.strokeStyle='#657075';ctx.stroke();}
    else if(o.kind==='register'||o.kind==='shopCounter'){ctx.fillStyle='#53646a';ctx.fillRect(-13*z,-9*z,26*z,18*z);ctx.fillStyle='#9ce2bf';ctx.fillRect(-5*z,-6*z,10*z,5*z);}
    else if(o.kind==='noticeboard'){ctx.fillStyle='#8b6b43';ctx.fillRect(-11*z,-9*z,22*z,18*z);ctx.fillStyle='#e8dbb1';ctx.fillRect(-7*z,-6*z,6*z,7*z);ctx.fillRect(2*z,-5*z,6*z,9*z);}
    else if(o.kind==='mailboxes'){ctx.fillStyle='#66747a';ctx.fillRect(-14*z,-7*z,28*z,14*z);for(let i=-8;i<=8;i+=8){ctx.strokeStyle='#303a3d';ctx.strokeRect(i*z-3*z,-4*z,6*z,8*z);}}
    else if(o.kind==='camera'){ctx.rotate(.35);ctx.fillStyle='#6d7c83';ctx.fillRect(-8*z,-5*z,16*z,10*z);ctx.fillStyle='#d44f54';ctx.beginPath();ctx.arc(5*z,0,2*z,0,CIRCLE);ctx.fill();}
    else if(o.kind==='lamp'){ctx.fillStyle='#1a1f22';ctx.fillRect(-2*z,-12*z,4*z,24*z);ctx.fillStyle='#f0d68d';ctx.beginPath();ctx.arc(0,-12*z,5*z,0,CIRCLE);ctx.fill();}
    ctx.restore();
  }
}

function drawEvidence(ctx,caseData,cam,state,playerBuilding,city){
  if(!caseData)return;
  for(const e of caseData.physical){
    if(state.collected.has(e.evidenceId))continue;
    const t=worldToTile(e.x,e.y),bid=tileAt(city,t.x,t.y)?.buildingId||null;
    if(bid&&bid!==playerBuilding)continue;
    if(bid&&state.player&&!lineOfSight(city,state.player,e))continue;
    const visible=e.visible||state.scanner;
    if(!visible||!inView(e.x,e.y,cam))continue;
    const X=sx(e.x,cam),Y=sy(e.y,cam),z=cam.zoom;
    ctx.save();ctx.translate(X,Y);
    if(e.kind==='body'){
      ctx.strokeStyle='#d9d9cf';ctx.lineWidth=2.5*z;ctx.beginPath();ctx.arc(0,-6*z,7*z,0,CIRCLE);ctx.moveTo(0,1*z);ctx.lineTo(0,20*z);ctx.moveTo(0,8*z);ctx.lineTo(-12*z,15*z);ctx.moveTo(0,8*z);ctx.lineTo(12*z,15*z);ctx.moveTo(0,20*z);ctx.lineTo(-10*z,31*z);ctx.moveTo(0,20*z);ctx.lineTo(10*z,31*z);ctx.stroke();
    }else if(e.kind==='wallet'){
      ctx.fillStyle='#785448';ctx.fillRect(-9*z,-6*z,18*z,12*z);ctx.strokeStyle='#d6b684';ctx.strokeRect(-9*z,-6*z,18*z,12*z);
    }else{
      ctx.globalAlpha=e.visible?1:.78;ctx.strokeStyle=COLORS.scanner;ctx.lineWidth=2*z;ctx.shadowBlur=12*z;ctx.shadowColor=COLORS.scanner;
      if(e.kind==='fingerprint'){
        for(let r=4;r<=12;r+=4){ctx.beginPath();ctx.arc(0,0,r*z,.4,Math.PI*1.6);ctx.stroke();}
      }else{ctx.beginPath();ctx.ellipse(0,0,8*z,14*z,.2,0,CIRCLE);ctx.stroke();}
    }
    ctx.restore();
  }
}

function drawCitizens(ctx,city,citizens,cam,playerBuilding,state){
  for(const c of citizens){
    if(!c.alive)continue;
    const t=worldToTile(c.x,c.y),bid=tileAt(city,t.x,t.y)?.buildingId||null;
    if(bid&&bid!==playerBuilding)continue;
    if(bid&&state.player&&!lineOfSight(city,state.player,c))continue;
    if(!inView(c.x,c.y,cam))continue;
    const X=sx(c.x,cam),Y=sy(c.y,cam),z=cam.zoom;
    ctx.save();ctx.translate(X,Y);ctx.rotate(c.facing);
    ctx.fillStyle='#182027';ctx.beginPath();ctx.arc(0,0,11*z,0,CIRCLE);ctx.fill();
    ctx.fillStyle=c.color;ctx.beginPath();ctx.arc(0,0,8*z,0,CIRCLE);ctx.fill();
    ctx.fillStyle='#e8c9a5';ctx.beginPath();ctx.arc(7*z,0,4*z,0,CIRCLE);ctx.fill();
    ctx.restore();
    if(state.knownPeople.has(c.id)||Math.hypot(c.x-state.player.x,c.y-state.player.y)<80){
      ctx.fillStyle='#e6edf0';ctx.font=`${Math.max(9,10*z)}px Arial`;ctx.textAlign='center';ctx.fillText(state.knownPeople.has(c.id)?c.name:'Citizen',X,Y-16*z);
    }
  }
}

function drawPlayer(ctx,player,cam,state){
  const X=sx(player.x,cam),Y=sy(player.y,cam),z=cam.zoom;
  ctx.save();ctx.translate(X,Y);ctx.rotate(player.angle||0);
  ctx.fillStyle='#121719';ctx.beginPath();ctx.arc(0,0,13*z,0,CIRCLE);ctx.fill();
  ctx.fillStyle=COLORS.player;ctx.beginPath();ctx.arc(0,0,9*z,0,CIRCLE);ctx.fill();
  ctx.fillStyle='#3b5360';ctx.beginPath();ctx.moveTo(-8*z,-5*z);ctx.lineTo(-15*z,0);ctx.lineTo(-8*z,5*z);ctx.closePath();ctx.fill();
  ctx.restore();
}

function drawDoors(ctx,city,cam,playerBuilding){
  for(const d of city.doors){
    if(d.buildingId!==playerBuilding&&d.id.includes('outer')===false)continue;
    const p={x:(d.x+.5)*TILE,y:(d.y+.5)*TILE};if(!inView(p.x,p.y,cam))continue;
    const X=sx(p.x,cam),Y=sy(p.y,cam),z=cam.zoom;
    ctx.fillStyle=d.locked?COLORS.locked:COLORS.door;ctx.fillRect(X-11*z,Y-4*z,22*z,8*z);
    if(d.locked){ctx.fillStyle='#f2cf5f';ctx.beginPath();ctx.arc(X,Y,2.5*z,0,CIRCLE);ctx.fill();}
  }
}

function drawRoofs(ctx,city,cam,playerBuilding,state){
  for(const b of city.buildings){
    if(b.id===playerBuilding)continue;
    const x=b.x*TILE,y=b.y*TILE,w=b.w*TILE,h=b.h*TILE;
    if(!inView(x+w/2,y+h/2,cam,Math.max(w,h)))continue;
    const X=sx(x,cam),Y=sy(y,cam),W=w*cam.zoom,H=h*cam.zoom;
    ctx.fillStyle=b.type==='apartments'?'#34404a':b.type==='bar'?'#422f3d':'#3b4447';ctx.fillRect(X,Y,W,H);
    ctx.strokeStyle='#11171a';ctx.lineWidth=3*cam.zoom;ctx.strokeRect(X,Y,W,H);
    ctx.fillStyle='#dce6e8';ctx.textAlign='center';ctx.font=`bold ${Math.max(9,11*cam.zoom)}px Arial`;ctx.fillText(b.name,X+W/2,Y+H/2);
    ctx.fillStyle='#8fa0a7';ctx.font=`${Math.max(7,8*cam.zoom)}px Arial`;ctx.fillText(b.type.toUpperCase(),X+W/2,Y+H/2+14*cam.zoom);
  }
}

function drawRain(ctx,cam,state){
  ctx.save();ctx.globalAlpha=.22;ctx.strokeStyle='#9cc8d7';ctx.lineWidth=1;
  const t=state.timeReal*160;
  for(let i=0;i<70;i++){
    const x=(i*97+t*.18)%cam.w,y=(i*53+t)%cam.h;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-7,y+15);ctx.stroke();
  }
  ctx.restore();
  // Day/night tint.
  const hour=(state.gameMinutes/60)%24;
  let a=0;if(hour<6)a=.30;else if(hour<8)a=(8-hour)*.12;else if(hour>19)a=Math.min(.34,(hour-19)*.07);
  if(a>0){ctx.fillStyle=`rgba(8,15,24,${a})`;ctx.fillRect(0,0,cam.w,cam.h);}
}

function drawScannerPulse(ctx,player,cam,state){
  if(!state.scanner)return;
  const X=sx(player.x,cam),Y=sy(player.y,cam),z=cam.zoom,r=(54+Math.sin(state.timeReal*4)*5)*z;
  ctx.save();ctx.strokeStyle='rgba(93,231,255,.45)';ctx.lineWidth=2;ctx.setLineDash([5,6]);ctx.beginPath();ctx.arc(X,Y,r,0,CIRCLE);ctx.stroke();ctx.restore();
}

function drawObjectiveArrow(ctx,player,caseData,cam,state){
  if(!caseData||caseData.solved||state.collected.has('body'))return;
  const dx=caseData.sceneX-player.x,dy=caseData.sceneY-player.y,d=Math.hypot(dx,dy);if(d<180)return;
  const a=Math.atan2(dy,dx),cx=cam.w/2+Math.cos(a)*Math.min(cam.w,cam.h)*.34,cy=cam.h/2+Math.sin(a)*Math.min(cam.w,cam.h)*.34;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(a);ctx.fillStyle=COLORS.evidence;ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-9,-8);ctx.lineTo(-9,8);ctx.closePath();ctx.fill();ctx.restore();
}

export function drawMinimap(ctx,city,citizens,player,caseData,state,w,h){
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#182128';ctx.fillRect(0,0,w,h);
  const sxm=w/city.worldW,sym=h/city.worldH;
  for(let y=0;y<city.height;y++)for(let x=0;x<city.width;x++){
    const t=city.grid[y][x];if(t.type==='road')ctx.fillStyle='#39444a';else if(t.type==='wall'||t.type==='floor')ctx.fillStyle='#596064';else continue;
    ctx.fillRect(x*TILE*sxm,y*TILE*sym,TILE*sxm+1,TILE*sym+1);
  }
  if(caseData&&!state.collected.has('body')){ctx.fillStyle=COLORS.evidence;ctx.beginPath();ctx.arc(caseData.sceneX*sxm,caseData.sceneY*sym,4,0,CIRCLE);ctx.fill();}
  ctx.fillStyle=COLORS.player;ctx.beginPath();ctx.arc(player.x*sxm,player.y*sym,4,0,CIRCLE);ctx.fill();
}
