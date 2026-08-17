export const TILE = 40;
export const CIRCLE = Math.PI * 2;

export const COLORS = {
  grass: '#273a34',
  grass2: '#30473f',
  road: '#182128',
  roadLine: '#53606a',
  sidewalk: '#4c5558',
  floor: '#6c655b',
  floorPublic: '#716d61',
  floorPrivate: '#615b55',
  wall: '#242729',
  wallEdge: '#0f1214',
  door: '#8c704b',
  locked: '#9a4e43',
  player: '#e8c57f',
  npc: '#9cb8c7',
  evidence: '#f4d35e',
  scanner: '#5de7ff',
  danger: '#ef6d73',
  good: '#66d596',
  ui: '#11181e',
  ui2: '#1d2830',
  text: '#edf3f5',
  muted: '#8fa0aa'
};

export const FIRST_NAMES = [
  'Avery','Mara','Jonas','Nadia','Elias','Iris','Theo','Mina','Roman','June','Felix','Ada',
  'Silas','Leah','Victor','Nora','Caleb','Tess','Miles','Rhea','Oscar','Lena','Damon','Vera',
  'Milo','Sofia','Ezra','Cora','Julian','Mae','Anton','Lila','Noah','Eden','Ronan','Faye',
  'Hugo','Maya','Soren','Clara','Finn','Yara','Leo','Nina','Cass','Arlo','Mira','Drew'
];

export const LAST_NAMES = [
  'Vale','Mercer','Rowe','Hale','Kerr','Morrow','Voss','Keene','Ortega','Nash','Lowe','Bishop',
  'Quinn','Frost','Marsh','Pike','Reed','Sato','Klein','Ward','Cross','Stone','Gray','Rivers',
  'Hart','Dunn','Flynn','Blake','Meyer','Knox','Shaw','Bell','Price','Cole','Dale','Fox'
];

export const STREET_NAMES = [
  'Mercury Ave','Gannet Street','Coldwater Road','Vesper Lane','Foundry Way','Orchid Street',
  'Morrow Blvd','Kestrel Road','Halcyon Avenue','Brass Lane','Rainier Street','Atlas Way'
];

export const BUILDING_NAMES = {
  apartments: ['Mercer Heights','Greyline Apartments','Cobalt Court','Rookery House','Vesper Towers','Juniper Block'],
  office: ['Axiom Data','Northstar Accounting','Kite Logistics','Orchid Systems'],
  diner: ['Night Owl Diner','Blue Plate','Static Grill'],
  bar: ['The Red Relay','Low Voltage','Afterglow Club'],
  pharmacy: ['VitaCare Pharmacy','Helix Drugs','Northline Chemist'],
  records: ['Civic Records Annex','Municipal Registry','Citizen Services'],
  electronics: ['Byte & Key','Circuit Exchange','Neon Hardware'],
  warehouse: ['Blackline Storage','Atlas Depot','Morrow Freight'],
  police: ['Central Precinct','Vesper Police Annex','Metro Watch Station']
};

export const JOB_TITLES = {
  office: ['Analyst','Accountant','Clerk','Supervisor','Programmer','Auditor'],
  diner: ['Cook','Server','Dishwasher','Manager'],
  bar: ['Bartender','Server','Bouncer','Manager'],
  pharmacy: ['Pharmacist','Cashier','Stock Clerk','Manager'],
  records: ['Records Clerk','Archivist','Administrator','Receptionist'],
  electronics: ['Technician','Sales Clerk','Repair Specialist','Manager'],
  warehouse: ['Loader','Dispatcher','Inventory Clerk','Foreman'],
  police: ['Patrol Officer','Detective','Desk Sergeant','Security Officer']
};

export const HAIR = ['black','brown','blonde','red','silver'];
export const BUILDS = ['slim','average','broad'];
export const EYE = ['brown','blue','green','grey','hazel'];

export const METHODS = [
  { id:'pistol', label:'compact pistol', cause:'gunshot wound', icon:'●', loud:false },
  { id:'knife', label:'kitchen knife', cause:'stab wound', icon:'▲', loud:false },
  { id:'wrench', label:'heavy wrench', cause:'blunt-force trauma', icon:'■', loud:true }
];

export const MOTIVES = [
  'a workplace grudge','money owed between acquaintances','jealousy over a relationship',
  'fear that the victim would reveal a secret','a dispute over stolen property','a long-running personal feud'
];

export function hashSeed(str='seed'){
  let h=2166136261>>>0;
  for(let i=0;i<str.length;i++){
    h^=str.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}

export class RNG{
  constructor(seed='neon-dossier'){
    this.state=hashSeed(String(seed))||0x12345678;
  }
  next(){
    let t=this.state+=0x6D2B79F5;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  }
  float(a=0,b=1){return a+(b-a)*this.next();}
  int(a,b){return Math.floor(this.float(a,b+1));}
  pick(arr){return arr[Math.floor(this.next()*arr.length)];}
  chance(p){return this.next()<p;}
  shuffle(arr){
    const out=[...arr];
    for(let i=out.length-1;i>0;i--){
      const j=this.int(0,i);[out[i],out[j]]=[out[j],out[i]];
    }
    return out;
  }
}

export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const lerp=(a,b,t)=>a+(b-a)*t;
export const tileKey=(x,y)=>`${x},${y}`;
export const fmtTime=(minutes)=>{
  minutes=((minutes%1440)+1440)%1440;
  const h=Math.floor(minutes/60),m=Math.floor(minutes%60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
};
export const titleCase=s=>String(s).replace(/\b\w/g,m=>m.toUpperCase());
