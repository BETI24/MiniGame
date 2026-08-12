const TEMPLATE_W = 360;
const TEMPLATE_H = 280;

const BASE_WALLS = [
  // Exterior shell. The south wall has one obvious 86 px entrance.
  {x:0,y:0,w:TEMPLATE_W,h:14},
  {x:0,y:0,w:14,h:TEMPLATE_H},
  {x:TEMPLATE_W-14,y:0,w:14,h:TEMPLATE_H},
  {x:0,y:TEMPLATE_H-14,w:137,h:14},
  {x:223,y:TEMPLATE_H-14,w:TEMPLATE_W-223,h:14},

  // Carefully authored interior: three readable rooms with real door gaps.
  {x:228,y:14,w:10,h:126},
  {x:228,y:192,w:10,h:TEMPLATE_H-14-192},

  {x:14,y:142,w:82,h:10},
  {x:146,y:142,w:82,h:10}
];

const BASE_FURNITURE = [
  {type:'bed',x:32,y:34,w:72,h:42},
  {type:'cabinet',x:154,y:30,w:42,h:30},
  {type:'rug',x:45,y:178,w:92,h:54},
  {type:'table',x:151,y:190,w:48,h:38},
  {type:'shelf',x:263,y:40,w:62,h:18},
  {type:'table',x:270,y:120,w:48,h:38},
  {type:'cabinet',x:282,y:214,w:38,h:30}
];

const BASE_LOOT_SPOTS = [
  [62,101],[170,92],[73,210],[180,224],
  [281,82],[300,166],[267,232],[336,116]
];

const BASE_CRATE_SPOTS = [
  [118,103],[307,83],[287,223]
];

const ROOF_STYLES = [
  {roofColor:'#6d3029',roofAccent:'#a5513a',floor:'#9c5633'},
  {roofColor:'#375565',roofAccent:'#5f7f91',floor:'#8f5a3a'},
  {roofColor:'#5b4931',roofAccent:'#8b7049',floor:'#995735'},
  {roofColor:'#4b5d3a',roofAccent:'#71845a',floor:'#935636'}
];

function rotateRect(rect,rotation){
  const r=((rotation%4)+4)%4;
  const {x,y,w,h}=rect;

  if(r===0)return{x,y,w,h};
  if(r===1)return{x:TEMPLATE_H-(y+h),y:x,w:h,h:w};
  if(r===2)return{x:TEMPLATE_W-(x+w),y:TEMPLATE_H-(y+h),w,h};
  return{x:y,y:TEMPLATE_W-(x+w),w:h,h:w};
}

function rotatePoint(x,y,rotation){
  const r=((rotation%4)+4)%4;

  if(r===0)return{x,y};
  if(r===1)return{x:TEMPLATE_H-y,y:x};
  if(r===2)return{x:TEMPLATE_W-x,y:TEMPLATE_H-y};
  return{x:y,y:TEMPLATE_W-x};
}

export function createHouseInstance({id,x,y,rotation=0,style=0}){
  const r=((rotation%4)+4)%4;
  const width=r%2===0?TEMPLATE_W:TEMPLATE_H;
  const height=r%2===0?TEMPLATE_H:TEMPLATE_W;
  const colors=ROOF_STYLES[style%ROOF_STYLES.length];

  const walls=BASE_WALLS.map(base=>{
    const q=rotateRect(base,r);
    return{x:x+q.x,y:y+q.y,w:q.w,h:q.h};
  });

  const furniture=BASE_FURNITURE.map(base=>{
    const q=rotateRect(base,r);
    return{
      type:base.type,
      x:x+q.x,
      y:y+q.y,
      w:q.w,
      h:q.h,
      rot:0
    };
  });

  const lootSpots=BASE_LOOT_SPOTS.map(([px,py])=>{
    const q=rotatePoint(px,py,r);
    return{x:x+q.x,y:y+q.y};
  });

  const crateSpots=BASE_CRATE_SPOTS.map(([px,py])=>{
    const q=rotatePoint(px,py,r);
    return{x:x+q.x,y:y+q.y};
  });

  // Base entrance is south. Rotating clockwise maps S -> W -> N -> E.
  const doorSide=(2+r)%4;

  return{
    id,
    x,y,w:width,h:height,
    walls,
    innerWalls:[],
    furniture,
    warehouse:false,
    roofColor:colors.roofColor,
    roofAccent:colors.roofAccent,
    floorColor:colors.floor,
    doorSide,
    rotation:r,
    lootSpots,
    crateSpots
  };
}

export function houseWalls(h){
  return h?.walls??[];
}

export function houseContains(entity,h,padding=0){
  if(!entity||!h)return false;

  return(
    entity.x>h.x+padding&&
    entity.x<h.x+h.w-padding&&
    entity.y>h.y+padding&&
    entity.y<h.y+h.h-padding
  );
}

export function houseEntrance(h){
  const depth=38;
  const half=47;

  if(h.doorSide===0){
    return{
      x:h.x+h.w*.5,
      y:h.y,
      insideX:h.x+h.w*.5,
      insideY:h.y+25,
      outsideX:h.x+h.w*.5,
      outsideY:h.y-depth*.55,
      pad:{x:h.x+h.w*.5-half,y:h.y-depth,w:half*2,h:depth}
    };
  }

  if(h.doorSide===2){
    return{
      x:h.x+h.w*.5,
      y:h.y+h.h,
      insideX:h.x+h.w*.5,
      insideY:h.y+h.h-25,
      outsideX:h.x+h.w*.5,
      outsideY:h.y+h.h+depth*.55,
      pad:{x:h.x+h.w*.5-half,y:h.y+h.h,w:half*2,h:depth}
    };
  }

  if(h.doorSide===1){
    return{
      x:h.x+h.w,
      y:h.y+h.h*.5,
      insideX:h.x+h.w-25,
      insideY:h.y+h.h*.5,
      outsideX:h.x+h.w+depth*.55,
      outsideY:h.y+h.h*.5,
      pad:{x:h.x+h.w,y:h.y+h.h*.5-half,w:depth,h:half*2}
    };
  }

  return{
    x:h.x,
    y:h.y+h.h*.5,
    insideX:h.x+25,
    insideY:h.y+h.h*.5,
    outsideX:h.x-depth*.55,
    outsideY:h.y+h.h*.5,
    pad:{x:h.x-depth,y:h.y+h.h*.5-half,w:depth,h:half*2}
  };
}

export const HOUSE_TEMPLATE_SIZE={w:TEMPLATE_W,h:TEMPLATE_H};
