import {RNG,METHODS,MOTIVES,fmtTime} from './NeonDossierData.js';
import {citizenById,getCitizenDescriptor} from './NeonDossierSim.js';
import {tileCenter} from './NeonDossierWorld.js';

function unique(arr){return [...new Set(arr)];}

export function createMurderCase(city,citizens,seed='case-1',createdAt=510,caseIndex=1){
  const rng=new RNG(seed);
  const alive=citizens.filter(c=>c.alive);
  let victim=rng.pick(alive);
  let pool=unique([...victim.friends,...victim.coworkers])
    .map(id=>citizenById(citizens,id))
    .filter(c=>c&&c.alive&&c.id!==victim.id&&!victim.household.includes(c.id));
  if(!pool.length)pool=alive.filter(c=>c.id!==victim.id&&!victim.household.includes(c.id));
  const killer=rng.pick(pool);
  const method=rng.pick(METHODS),motive=rng.pick(MOTIVES);
  const sceneBuilding=city.buildings.find(b=>b.id===victim.homeBuildingId);
  const sceneP=tileCenter(victim.homeTile.x,victim.homeTile.y);
  const timeOfDeath=createdAt-rng.int(18,42);

  victim.alive=false;victim.x=sceneP.x;victim.y=sceneP.y;

  const household=victim.household.map(id=>citizenById(citizens,id)).filter(Boolean);
  const printDecoy=household[0]||rng.pick(alive.filter(c=>c.id!==victim.id&&c.id!==killer.id));
  const contacts=unique([...victim.friends,...victim.coworkers,killer.id]).slice(0,7);
  const callDecoys=rng.shuffle(contacts.filter(id=>id!==killer.id)).slice(0,2);
  const witnessCandidates=alive.filter(c=>c.id!==killer.id&&c.id!==victim.id&&c.homeBuildingId===victim.homeBuildingId);
  const witness=witnessCandidates[0]||rng.pick(alive.filter(c=>c.id!==killer.id&&c.id!==victim.id));

  const evidence=new Map();
  const add=(id,data)=>evidence.set(id,{id,...data});

  add('body',{
    title:`Victim: ${victim.name}`,
    kind:'victim',
    desc:`${victim.name}, ${victim.age}, was killed at home. Estimated time of death: ${fmtTime(timeOfDeath)}. Cause: ${method.cause}.`,
    personIds:[victim.id],placeIds:[sceneBuilding.id],tags:['victim','crime scene','time of death',method.id]
  });
  add('wallet',{
    title:`${victim.name}'s ID`,kind:'identity',
    desc:`Home: ${victim.address}. Employer: ${victim.workplaceName}. Phone: ${victim.phone}.`,
    personIds:[victim.id],placeIds:[victim.homeBuildingId,victim.workplaceId],tags:['identity','address','employment']
  });
  add('killer-print',{
    title:`Unidentified fingerprint ${killer.fingerprint}`,kind:'fingerprint',
    desc:`A fresh fingerprint at the crime scene. The owner is not identified yet. Search employee or civic records for ${killer.fingerprint}.`,
    personIds:[],placeIds:[sceneBuilding.id],tags:['fingerprint',killer.fingerprint]
  });
  add('decoy-print',{
    title:`Household fingerprint ${printDecoy.fingerprint}`,kind:'fingerprint',
    desc:`Another fingerprint from the apartment. It may simply belong to a resident or visitor.`,
    personIds:[],placeIds:[sceneBuilding.id],tags:['fingerprint',printDecoy.fingerprint,'possible decoy']
  });
  add('shoeprint',{
    title:`Shoe print · size ${killer.shoe}`,kind:'trace',
    desc:`A shoe impression near the scene measures approximately size ${killer.shoe}.`,
    personIds:[],placeIds:[sceneBuilding.id],tags:['shoe',String(killer.shoe)]
  });
  add('addressbook',{
    title:`${victim.first}'s address book`,kind:'document',
    desc:`Contacts: ${contacts.map(id=>citizenById(citizens,id)?.name).filter(Boolean).join(', ')}.`,
    personIds:contacts,placeIds:[sceneBuilding.id],tags:['contacts','social circle']
  });
  add('phone-log',{
    title:'Recent call history',kind:'phone',
    desc:`Calls before the murder include ${[killer.id,...callDecoys].map((id,i)=>`${citizenById(citizens,id)?.phone} at ${fmtTime(timeOfDeath-22-i*31)}`).join('; ')}.`,
    personIds:[],placeIds:[sceneBuilding.id],tags:['phone',killer.phone,...callDecoys.map(id=>citizenById(citizens,id)?.phone)]
  });
  add('cctv',{
    title:'CCTV sighting near the scene',kind:'cctv',
    desc:`At ${fmtTime(timeOfDeath-6)}, a ${getCitizenDescriptor(killer)} person entered the block and left shortly after the estimated time of death.`,
    personIds:[],placeIds:[sceneBuilding.id],tags:['cctv',killer.hair,killer.build,killer.eyes]
  });
  add('witness',{
    title:`Witness: ${witness.name}`,kind:'statement',
    desc:`${witness.name} remembers a ${killer.build} person with ${killer.hair} hair near ${sceneBuilding.name} around ${fmtTime(timeOfDeath)}.`,
    personIds:[witness.id],placeIds:[sceneBuilding.id],tags:['witness',killer.hair,killer.build]
  });
  add('email',{
    title:'Hostile private message',kind:'email',
    desc:`A message thread links ${victim.name} to ${killer.name}. The exchange refers to ${motive}.`,
    personIds:[victim.id,killer.id],placeIds:[victim.workplaceId],tags:['email','motive',motive]
  });
  add('weapon-receipt',{
    title:'Suspicious purchase receipt',kind:'receipt',
    desc:`A discarded receipt in ${killer.name}'s home shows a recent purchase consistent with a ${method.label}.`,
    personIds:[killer.id],placeIds:[killer.homeBuildingId],tags:['receipt','weapon',method.id]
  });
  add('killer-profile',{
    title:`Citizen file: ${killer.name}`,kind:'profile',
    desc:`${killer.name} · ${killer.age} · ${killer.jobTitle} at ${killer.workplaceName} · ${killer.address} · phone ${killer.phone} · fingerprint ${killer.fingerprint} · shoe ${killer.shoe}.`,
    personIds:[killer.id],placeIds:[killer.homeBuildingId,killer.workplaceId],tags:['citizen file',killer.fingerprint,killer.phone]
  });

  const physical=[
    {id:'body-world',kind:'body',evidenceId:'body',x:sceneP.x,y:sceneP.y,visible:true,scene:true},
    {id:'wallet-world',kind:'wallet',evidenceId:'wallet',x:sceneP.x+18,y:sceneP.y+14,visible:true},
    {id:'print-world-1',kind:'fingerprint',evidenceId:'killer-print',x:sceneP.x-24,y:sceneP.y-12,visible:false,scanner:true},
    {id:'print-world-2',kind:'fingerprint',evidenceId:'decoy-print',x:sceneP.x+28,y:sceneP.y-18,visible:false,scanner:true},
    {id:'shoe-world',kind:'shoeprint',evidenceId:'shoeprint',x:sceneP.x-6,y:sceneP.y+35,visible:false,scanner:true}
  ];

  const caseData={
    id:`case-${caseIndex}`,
    title:`Murder of ${victim.name}`,
    index:caseIndex,
    victimId:victim.id,killerId:killer.id,method,motive,
    sceneBuildingId:sceneBuilding.id,sceneRoomId:victim.homeRoomId,
    sceneX:sceneP.x,sceneY:sceneP.y,timeOfDeath,createdAt,
    witnessId:witness.id,evidence,physical,solved:false,wrongAccusations:0,
    strikeAt:createdAt+720,repeatVictimId:null,
    payout:450+caseIndex*70
  };
  return caseData;
}

export function evidenceForObject(caseData,obj,citizens){
  const victim=citizenById(citizens,caseData.victimId),killer=citizenById(citizens,caseData.killerId);
  if(!victim||!killer)return [];
  if(obj.kind==='addressbook'&&obj.buildingId===victim.homeBuildingId&&obj.roomId===victim.homeRoomId)return ['addressbook'];
  if(obj.kind==='phone'&&obj.buildingId===victim.homeBuildingId&&obj.roomId===victim.homeRoomId)return ['phone-log'];
  if(obj.kind==='emailTerminal'&&obj.buildingId===victim.workplaceId)return ['email'];
  if(obj.kind==='trash'&&obj.buildingId===killer.homeBuildingId&&obj.roomId===killer.homeRoomId)return ['weapon-receipt'];
  return [];
}

export function employeeRecordsForBuilding(buildingId,citizens){
  return citizens.filter(c=>c.workplaceId===buildingId).map(c=>({
    personId:c.id,name:c.name,job:c.jobTitle,fingerprint:c.fingerprint,phone:c.phone,email:c.email
  }));
}

export function cctvRecords(caseData,city,citizens){
  const victim=citizenById(citizens,caseData.victimId),killer=citizenById(citizens,caseData.killerId);
  const decoys=citizens.filter(c=>c.alive&&c.id!==killer.id&&c.id!==victim.id).slice(0,3);
  const rows=[
    {time:caseData.timeOfDeath-34,text:`${getCitizenDescriptor(decoys[0]||killer)} pedestrian crossed the block.`},
    {time:caseData.timeOfDeath-6,text:`${getCitizenDescriptor(killer)} person entered the block.`,evidenceId:'cctv'},
    {time:caseData.timeOfDeath+9,text:`The same ${killer.hair}-haired person left the area.`},
    {time:caseData.timeOfDeath+22,text:`${getCitizenDescriptor(decoys[1]||killer)} pedestrian passed the camera.`}
  ];
  return rows;
}

export function directorySearch(query,citizens){
  const q=String(query||'').trim().toLowerCase();if(!q)return [];
  return citizens.filter(c=>
    c.name.toLowerCase().includes(q)||c.phone.toLowerCase()===q||c.fingerprint.toLowerCase()===q||c.email.toLowerCase().includes(q)
  ).slice(0,12).map(c=>({
    personId:c.id,name:c.name,address:c.address,workplace:c.workplaceName,phone:c.phone,fingerprint:c.fingerprint,email:c.email
  }));
}

export function createRepeatCrime(caseData,city,citizens,seed='repeat'){
  if(caseData.repeatVictimId)return null;
  const rng=new RNG(seed);
  const killer=citizenById(citizens,caseData.killerId);
  const candidates=citizens.filter(c=>c.alive&&c.id!==killer.id&&!killer.household.includes(c.id));
  if(!candidates.length)return null;
  const victim=rng.pick(candidates);victim.alive=false;
  const p=tileCenter(victim.homeTile.x,victim.homeTile.y);victim.x=p.x;victim.y=p.y;
  caseData.repeatVictimId=victim.id;
  const id='repeat-body';
  caseData.evidence.set(id,{
    id,title:`Second victim: ${victim.name}`,kind:'victim',
    desc:`A second killing occurred while the case remained open. The cause is also consistent with a ${caseData.method.label}. This strongly suggests the same offender.`,
    personIds:[victim.id],placeIds:[victim.homeBuildingId],tags:['second victim',caseData.method.id]
  });
  caseData.physical.push({id:'repeat-body-world',kind:'body',evidenceId:id,x:p.x,y:p.y,visible:true,scene:true});
  return {victim,x:p.x,y:p.y};
}

export function evaluateAccusation(caseData,suspectId){
  return suspectId===caseData.killerId;
}
