import {tileCenter,nearestRoadTile,lineOfSight} from './NeonDossierWorld.js';

export function updateSecurity(city,citizens,player,state,dt){
  if(!player)return;
  let nearest=null,nd=Infinity;
  for(const c of citizens){
    if(!c.alive||(c.role!=='law'&&c.role!=='security'))continue;
    const d=Math.hypot(c.x-player.x,c.y-player.y);
    if(d<nd){nd=d;nearest=c;}
    if(state.heat<28||d>340||!lineOfSight(city,c,player))continue;
    c.securityAlert=Math.max(c.securityAlert||0,4);
  }
  for(const c of citizens){
    if(!c.alive||(c.role!=='law'&&c.role!=='security'))continue;
    c.securityAlert=Math.max(0,(c.securityAlert||0)-dt);
    if(c.securityAlert<=0)continue;
    const dx=player.x-c.x,dy=player.y-c.y,d=Math.hypot(dx,dy)||1;
    c.x+=dx/d*Math.min(d,78*dt);c.y+=dy/d*Math.min(d,78*dt);c.facing=Math.atan2(dy,dx);
    if(d<34){state.securityCaught=true;return c;}
  }
  return null;
}

export function describeSecurity(c){return c?.role==='law'?'Police officer':'Security';}
