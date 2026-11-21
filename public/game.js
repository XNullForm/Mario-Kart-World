import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createWorld,nearestRoad,animateWorld,ROAD_WIDTH} from './world.js';

const $=id=>document.getElementById(id);
const show=id=>$(id).classList.remove('hidden');
const hide=id=>$(id).classList.add('hidden');
const clamp=THREE.MathUtils.clamp;
const lerp=THREE.MathUtils.lerp;
const karts=[
  {name:'COMET GT',color:0xff5e5b,top:65,accel:39,steer:1.75,drift:1},
  {name:'WAVE RIDER',color:0x53cbf5,top:72,accel:33,steer:1.53,drift:.85},
  {name:'SOLAR FLARE',color:0xefd15b,top:61,accel:36,steer:1.85,drift:1.3}
];
const botColors=[0x8b83fe,0x58dc9c,0xf8a75e,0xf387c7,0x66bff0];
const botNames=['NOVA','ACE','PIXEL','DASH','SKY'];
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x79b9d3);
scene.fog=new THREE.FogExp2(0x8dcbca,.00135);
const camera=new THREE.PerspectiveCamera(69,innerWidth/innerHeight,.1,2600);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<800?1.45:1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.17;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('viewport').appendChild(renderer.domElement);
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
const hemi=new THREE.HemisphereLight(0xe6f8ff,0x78916c,2.0);scene.add(hemi);
const sunlight=new THREE.DirectionalLight(0xffe8c2,3.5);sunlight.position.set(-235,390,-240);
sunlight.castShadow=true;
sunlight.shadow.mapSize.set(innerWidth<700?1024:2048,innerWidth<700?1024:2048);
sunlight.shadow.camera.left=-350;sunlight.shadow.camera.right=350;
sunlight.shadow.camera.top=350;sunlight.shadow.camera.bottom=-350;
sunlight.shadow.camera.near=5;sunlight.shadow.camera.far=1100;
sunlight.shadow.bias=-.00015;sunlight.shadow.normalBias=.04;
scene.add(sunlight);
const world=createWorld(scene);
let composer=null;
try{
  const memory=navigator.deviceMemory||8;
  if(memory>=4 && innerWidth>750){
    composer=new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene,camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.3,.46,.85));
    composer.addPass(new OutputPass());
  }
}catch(err){console.warn('Postprocessing disabled:',err);composer=null;}
const root=new THREE.Group();scene.add(root);
const bodyMaterial=(color)=>new THREE.MeshPhysicalMaterial({color,metalness:.32,roughness:.25,clearcoat:1,clearcoatRoughness:.1});
const material=(color,rough=.58,metal=.1)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
function part(g,geo,mat,x=0,y=0,z=0,shadow=true){
  const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;g.add(m);return m;
}
function buildKart(color,i=0){
  const g=new THREE.Group(),suspension=new THREE.Group();g.add(suspension);
  const paint=bodyMaterial(color),dark=material(0x162b3a,.45,.2),black=material(0x131e27,.9),alloy=material(0xe9ffff,.22,.78),glass=bodyMaterial(0x7fe6f4);
  part(suspension,new THREE.BoxGeometry(2.4,.54,3.95),dark,0,.7,0);
  part(suspension,new THREE.BoxGeometry(2.55,.55,3.3),paint,0,.95,.12);
  part(suspension,new THREE.BoxGeometry(2.25,.3,1.1),paint,0,.84,1.6);
  part(suspension,new THREE.BoxGeometry(2.28,.33,1.13),dark,0,.92,-1.5);
  part(suspension,new THREE.BoxGeometry(2.65,.13,.65),paint,0,1.64,-1.88);
  for(const side of [-1,1]){
    part(suspension,new THREE.BoxGeometry(.14,.68,.25),dark,side*1.13,1.33,-1.78);
    part(suspension,new THREE.BoxGeometry(.21,.15,.5),alloy,side*.82,1.12,1.99);
    part(suspension,new THREE.BoxGeometry(.42,.14,.12),new THREE.MeshBasicMaterial({color:0xff5145}),side*.83,.95,-2.01,false);
  }
  // Curved canopy, rear exhaust, soft neon underglow and original driver.
  const windshield=part(suspension,new THREE.SphereGeometry(1,16,12),glass,0,1.46,-.23);
  windshield.scale.set(1.0,.51,1.04);
  const seat=part(suspension,new THREE.BoxGeometry(1.3,.65,1.15),dark,0,1.30,-.81);
  seat.rotation.x=.09;
  const helmet=part(suspension,new THREE.SphereGeometry(.58,18,13),material(i%2?0xffffff:0xfbe8c4,.35),0,2.02,-.61);
  const visor=part(suspension,new THREE.SphereGeometry(.49,16,12),material(0x172f43,.12,.6),0,2.01,-.21);
  visor.scale.set(1,.5,.33);
  const wheels=[];
  const tireGeo=new THREE.CylinderGeometry(.63,.63,.48,16),rimGeo=new THREE.CylinderGeometry(.33,.33,.51,16);
  for(const x of [-1.28,1.28])for(const z of [-1.35,1.28]){
    const wg=new THREE.Group();wg.position.set(x,.63,z);suspension.add(wg);
    const tire=part(wg,tireGeo,black);tire.rotation.z=Math.PI/2;
    const rim=part(wg,rimGeo,alloy,x>0?.03:-.03,0,0);rim.rotation.z=Math.PI/2;
    wheels.push(wg);
  }
  const exhaust=part(suspension,new THREE.CylinderGeometry(.21,.32,.75,10),alloy,0,.76,-2.05);
  exhaust.rotation.x=Math.PI/2;
  const glowMat=new THREE.MeshBasicMaterial({color:color,transparent:true,opacity:.27,depthWrite:false});
  const under=part(g,new THREE.CircleGeometry(2.8,24),glowMat,0,.14,0,false);
  under.rotation.x=-Math.PI/2;under.scale.set(1,1.2,1);
  return {root:g,suspension,wheels,paint,under};
}
const playerKart=buildKart(karts[0].color);root.add(playerKart.root);
const bots=[];
for(let i=0;i<5;i++){
  const kart=buildKart(botColors[i],i+1);root.add(kart.root);
  bots.push({kart,name:botNames[i],color:botColors[i],progress:0,speed:0,offset:(i%2===0?-1:1)*(3.0+Math.floor(i/2)*.7),bob:i*1.3});
}
const state={
  phase:'menu',mode:'race',kart:0,selectedMode:'race',
  time:0,worldTime:0,lap:1,lastLapStart:0,bestLap:Infinity,
  priorT:0,progressT:0,position:1,
  speed:0,yaw:0,boost:12,padBoost:0,drifting:false,driftCharge:0,
  countdown:3.8,cameraMode:0,offRoad:false,finishTime:0,menuAngle:0,
  toastTimer:0,shake:0
};
const keys={},touch={left:false,right:false,accel:false,brake:false,drift:false};
const keyAction={KeyW:'accel',ArrowUp:'accel',KeyS:'brake',ArrowDown:'brake',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'drift',ShiftLeft:'boost',ShiftRight:'boost'};
function keyDown(e){
  if(e.code in keyAction){e.preventDefault();keys[keyAction[e.code]]=true;}
  if(e.repeat)return;
  if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();togglePause();}
  if(e.code==='KeyC'&&state.phase==='race'){state.cameraMode=(state.cameraMode+1)%3;toast(['CHASE CAMERA','CINEMATIC CAMERA','LOW CAMERA'][state.cameraMode]);}
  if(e.code==='KeyM'){toggleSound();}
  if(e.code==='KeyR'&&state.phase==='race')resetToRoad();
}
window.addEventListener('keydown',keyDown);
window.addEventListener('keyup',e=>{if(e.code in keyAction){e.preventDefault();keys[keyAction[e.code]]=false;}});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;if(state.phase==='race')togglePause(true);});
function input(k){return Boolean(keys[k]||touch[k]);}
for(const key of ['left','right','accel','brake','drift']){
  const btn=$('touch-'+key);
  if(!btn)continue;
  const on=e=>{e.preventDefault();touch[key]=true;btn.classList.add('pressed');try{btn.setPointerCapture(e.pointerId);}catch(_){}};
  const off=e=>{e.preventDefault();touch[key]=false;btn.classList.remove('pressed');};
  btn.addEventListener('pointerdown',on);btn.addEventListener('pointerup',off);btn.addEventListener('pointercancel',off);btn.addEventListener('lostpointercapture',off);
}
let audio=null,muted=false;
function initializeAudio(){
  if(audio){audio.ctx.resume();return;}
  try{
    const ctx=new (window.AudioContext||window.webkitAudioContext)(),osc=ctx.createOscillator(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    osc.type='sawtooth';filter.type='lowpass';filter.frequency.value=240;gain.gain.value=.004;
    osc.connect(filter);filter.connect(gain);gain.connect(ctx.destination);osc.start();
    audio={ctx,osc,filter,gain};
  }catch(e){console.info('Audio unavailable',e);}
}
function sound(type){
  if(!audio||muted)return;
  const now=audio.ctx.currentTime,osc=audio.ctx.createOscillator(),g=audio.ctx.createGain();
  osc.type=type==='pickup'?'sine':'triangle';
  const f=type==='pickup'?740:type==='boost'?240:type==='finish'?420:220;
  osc.frequency.setValueAtTime(f,now);osc.frequency.exponentialRampToValueAtTime(type==='pickup'?1300:type==='finish'?940:560,now+.23);
  g.gain.setValueAtTime(.001,now);g.gain.exponentialRampToValueAtTime(.1,now+.025);g.gain.exponentialRampToValueAtTime(.001,now+.33);
  osc.connect(g);g.connect(audio.ctx.destination);osc.start(now);osc.stop(now+.36);
}
function toggleSound(){
  muted=!muted;$('menu-audio').textContent=muted?'♪̸':'♫';
  if(audio)audio.gain.gain.setTargetAtTime(muted?0:.004,audio.ctx.currentTime,.08);
}
$('menu-audio').addEventListener('click',()=>{initializeAudio();toggleSound();});
for(const b of document.querySelectorAll('.mode-pill'))b.addEventListener('click',()=>{
  document.querySelectorAll('.mode-pill').forEach(x=>x.classList.remove('selected'));
  b.classList.add('selected');state.selectedMode=b.dataset.mode;
});
function chooseKart(i){
  state.kart=i;for(const b of document.querySelectorAll('.kart-choice'))b.classList.toggle('selected',Number(b.dataset.kart)===i);
  playerKart.paint.color.setHex(karts[i].color);
  playerKart.under.material.color.setHex(karts[i].color);
}
for(const b of document.querySelectorAll('.kart-choice'))b.addEventListener('click',()=>chooseKart(Number(b.dataset.kart)));
$('how').onclick=()=>show('instructions');
$('how-close').onclick=()=>hide('instructions');
$('play').onclick=()=>startRace();
$('pause-button').onclick=()=>togglePause();
$('resume').onclick=()=>togglePause();
$('restart').onclick=()=>startRace();
$('again').onclick=()=>startRace();
$('home').onclick=()=>returnMenu();
$('exit').onclick=()=>returnMenu();
function timeText(s){
  if(!isFinite(s))return '--:--.--';
  const m=Math.floor(s/60),sec=Math.floor(s%60),cs=Math.floor((s%1)*100);
  return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0')+'.'+String(cs).padStart(2,'0');
}
function ordinal(n){return n===1?'ST':n===2?'ND':n===3?'RD':'TH';}
function toast(message){
  const t=$('toast');t.textContent=message;show('toast');state.toastTimer=1.7;
}
const forward=new THREE.Vector3();
function locate(t,offset=0){
  const p=world.curve.getPointAt((t%1+1)%1),d=world.curve.getTangentAt((t%1+1)%1);
  p.x+=d.z*offset;p.z-=d.x*offset;p.y=.31;
  return {p,d,yaw:Math.atan2(d.x,d.z)};
}
function resetToRoad(){
  const t=nearestRoad(world,playerKart.root.position).t;
  const l=locate(t);
  playerKart.root.position.copy(l.p);state.yaw=l.yaw;state.speed=0;state.padBoost=0;
  toast('BACK ON TRACK');
}
function spawn(){
  const l=locate(.002);
  playerKart.root.position.copy(l.p);state.yaw=l.yaw;
  bots.forEach((bot,i)=>{
    bot.progress=-(i+1)*.0046;bot.speed=0;
    const x=locate(bot.progress,bot.offset);
    bot.kart.root.position.copy(x.p);bot.kart.root.rotation.y=x.yaw;
    bot.kart.root.visible=state.mode==='race';
  });
  state.time=0;state.lap=1;state.lastLapStart=0;state.bestLap=Infinity;
  state.speed=0;state.boost=12;state.padBoost=0;state.priorT=.002;state.progressT=.002;
  state.drifting=false;state.driftCharge=0;state.position=1;state.offRoad=false;
  state.cameraMode=0;state.shake=0;state.toastTimer=0;
  for(const b of world.boosts)b.lastTrigger=-100;
  for(const p of world.pickups){p.available=true;p.group.visible=true;}
  hide('toast');hide('finish');hide('pause');
}
function startRace(){
  initializeAudio();state.mode=state.selectedMode;spawn();
  state.phase='countdown';state.countdown=3.75;
  hide('menu');hide('instructions');show('hud');show('countdown');
  $('mode-name').textContent=state.mode==='race'?'GRAND PRIX':state.mode==='time'?'TIME TRIAL':'FREE DRIVE';
  $('rivals').style.display=state.mode==='race'?'flex':'none';
  $('position').parentElement.style.display=state.mode==='race'?'':'none';
  $('lap').parentElement.style.display=state.mode==='free'?'none':'';
  if(state.mode==='free'){state.countdown=1.1;}
  updateHud();
}
function returnMenu(){
  state.phase='menu';hide('hud');hide('finish');hide('pause');hide('instructions');hide('countdown');show('menu');
  bots.forEach(b=>b.kart.root.visible=true);
  state.speed=0;state.padBoost=0;state.menuAngle=0;
  const l=locate(.025);playerKart.root.position.copy(l.p);state.yaw=l.yaw;
}
function togglePause(force=false){
  if(state.phase==='race'||state.phase==='countdown'){state.previousPhase=state.phase;state.phase='paused';show('pause');hide('countdown');if(audio)audio.gain.gain.setTargetAtTime(0,audio.ctx.currentTime,.1);}
  else if(state.phase==='paused'&&!force){state.phase=state.previousPhase||'race';hide('pause');if(state.phase==='countdown')show('countdown');if(audio&&!muted)audio.gain.gain.setTargetAtTime(.004,audio.ctx.currentTime,.1);}
}
function finishRace(){
  state.phase='finished';hide('countdown');hide('toast');show('finish');
  $('result-eyebrow').textContent=state.mode==='time'?'TIME TRIAL COMPLETE':'GRAND PRIX COMPLETE';
  $('result-title').innerHTML=state.position===1?'CHAMPION<span>!</span>':'NICE DRIVE<span>!</span>';
  $('result-position').innerHTML=state.mode==='time'?'FINISH':state.position+'<sup>'+ordinal(state.position)+'</sup>';
  if(state.mode==='time')$('result-position').style.fontSize='68px';else $('result-position').style.fontSize='';
  $('result-time').textContent=timeText(state.time);
  $('result-best').textContent=timeText(state.bestLap);
  sound('finish');
  try{
    const prev=Number(localStorage.getItem('horizon-karts-best-'+state.mode))||Infinity;
    if(state.time<prev)localStorage.setItem('horizon-karts-best-'+state.mode,String(state.time));
  }catch(_){}
}
function updateAI(dt){
  for(let i=0;i<bots.length;i++){
    const bot=bots[i];
    if(state.mode!=='race')continue;
    const curveBoost=1+Math.sin(bot.progress*22+i)*.05;
    const target=(41+i*2.4+Math.sin(state.time*.24+i*3)*3)*curveBoost;
    bot.speed=lerp(bot.speed,target,1-Math.exp(-dt*1.65));
    bot.progress+=bot.speed*dt/world.trackLength;
    const l=locate(bot.progress,bot.offset+Math.sin(bot.progress*19+i)*.35);
    bot.kart.root.position.lerp(l.p,1-Math.exp(-dt*9));
    const current=bot.kart.root.rotation.y;
    let delta=l.yaw-current;delta=Math.atan2(Math.sin(delta),Math.cos(delta));
    bot.kart.root.rotation.y=current+delta*Math.min(1,dt*7);
    bot.kart.suspension.rotation.z=Math.sin(state.time*8+i)*.025;
    for(const w of bot.kart.wheels)w.rotation.x+=dt*bot.speed*.6;
  }
}
function updatePlayer(dt){
  const spec=karts[state.kart];
  const throttle=input('accel')?1:0,brake=input('brake')?1:0;
  const steer=(input('right')?1:0)-(input('left')?1:0);
  const drift=input('drift')&&Math.abs(steer)>.1&&state.speed>15;
  const push=input('boost')&&state.boost>1.5;
  if(drift){
    state.drifting=true;state.driftCharge=clamp(state.driftCharge+dt*.22*spec.drift,0,1);
  }else if(state.drifting){
    if(state.driftCharge>.14){
      state.boost=clamp(state.boost+state.driftCharge*50,0,100);
      toast(state.driftCharge>.58?'ULTRA DRIFT! + BOOST':'DRIFT BOOST CHARGED');
      sound('boost');
    }
    state.driftCharge=0;state.drifting=false;
  }
  const road=nearestRoad(world,playerKart.root.position);
  state.offRoad=road.dist>ROAD_WIDTH*.53;
  const roadMultiplier=state.offRoad ? .62 : 1;
  const extra=(state.padBoost>0?32:0)+(push?22:0);
  let top=spec.top*roadMultiplier+extra;
  if(throttle)state.speed+=spec.accel*dt*(state.speed<top ? .95 : .4);
  else state.speed-=22*dt;
  if(brake)state.speed-=66*dt;
  if(push){state.boost=Math.max(0,state.boost-36*dt);state.shake=Math.min(.3,state.shake+dt*.4);}
  if(state.padBoost>0)state.padBoost=Math.max(0,state.padBoost-dt);
  if(state.offRoad&&state.speed>top)state.speed-=40*dt;
  state.speed=clamp(state.speed,-10,top+6);
  if(Math.abs(state.speed)<.2)state.speed=0;
  const steerSpeed=Math.min(1,Math.abs(state.speed)/22);
  const driftFactor=drift?1.28:1;
  state.yaw+=steer*spec.steer*driftFactor*steerSpeed*dt*(state.speed>=0?1:-1);
  forward.set(Math.sin(state.yaw),0,Math.cos(state.y));
  playerKart.root.position.addScaledVector(forward,state.speed*dt);
  playerKart.root.position.y=.31;
  playerKart.root.rotation.y=state.yaw;
  playerKart.suspension.rotation.z=lerp(playerKart.suspension.rotation.z,-steer*(drift?.19:.09),Math.min(1,dt*8));
  playerKart.suspension.rotation.x=lerp(playerKart.suspension.rotation.x,throttle?-.025:brake?.08:0,Math.min(1,dt*6));
  for(const w of playerKart.wheels)w.rotation.x+=state.speed*dt*.65;
  if(playerKart.root.position.length()>760)resetToRoad();
  const nearest=nearestRoad(world,playerKart.root.position);
  state.progressT=nearest.t;
  // A lap only counts when moving forward through the finish line.
  const headingDot=forward.dot(nearest.tangent);
  if(state.mode!=='free'&&nearest.dist<15&&headingDot>.25&&state.priorT>.82&&nearest.t<.16){
    state.lap++;
    const lapTime=state.time-state.lastLapStart;
    state.bestLap=Math.min(state.bestLap,lapTime);
    state.lastLapStart=state.time;
    if(state.lap>3){state.lap=3;updateRacePosition();finishRace();return;}
    toast('LAP '+state.lap+' / 3 — KEEP PUSHING!');
    sound('pickup');
  }
  state.priorT=nearest.t;
  for(const boost of world.boosts){
    const dx=boost.p.x-playerKart.root.position.x,dz=boost.p.z-playerKart.root.position.z;
    if(dx*dx+dz*dz<9*9&&state.time-boost.lastTrigger>3){
      state.padBoost=2;boost.lastTrigger=state.time;state.boost=clamp(state.boost+8,0,100);
      toast('TURBO PAD!');sound('boost');state.shake=.3;
    }
  }
  for(const pickup of world.pickups){
    if(!pickup.available)continue;
    const dx=pickup.position.x-playerKart.root.position.x,dz=pickup.position.z-playerKart.root.position.z;
    if(dx*dx+dz*dz<4.6*4.6){
      pickup.available=false;pickup.group.visible=false;pickup.respawn=state.worldTime+10;
      state.boost=clamp(state.boost+24,0,100);toast('+24 BOOST ENERGY');sound('pickup');
    }
  }
  if(state.mode==='race'){
    for(const bot of bots){
      if(playerKart.root.position.distanceToSquared(bot.kart.root.position)<13){
        state.speed*=.82;state.shake=.26;
        const away=playerKart.root.position.clone().sub(bot.kart.root.position).normalize();
        playerKart.root.position.addScaledVector(away,dt*8);
      }
    }
  }
}
function updateRacePosition(){
  if(state.mode!=='race'){state.position=1;return;}
  const progress=state.lap-1+state.progressT;
  state.position=1+bots.filter(b=>b.progress>progress).length;
}
function updateHud(){
  $('timer').textContent=timeText(state.time);
  $('speed').textContent=Math.round(Math.abs(state.speed)*3.6);
  $('gear').textContent=state.speed<0?'R':state.speed<1?'N':state.speed<18?'1':state.speed<35?'2':state.speed<52?'3':'4';
  $('position').innerHTML=state.position+'<sup>'+ordinal(state.position)+'</sup><small>/ 6</small>';
  $('lap').innerHTML=state.lap+' <small>/ 3</small>';
  $('boost-fill').style.width=state.boost+'%';
  $('boost-percent').textContent=Math.floor(state.boost)+'%';
  $('drift-text').textContent=state.offRoad?'⚠ OFF ROAD — RETURN TO TRACK':state.drifting?'DRIFT CHARGE '+Math.floor(state.driftCharge*100)+'%':state.padBoost>0?'⚡ TURBO ACTIVE':state.boost>10?'HOLD SHIFT TO BOOST':'HOLD SPACE + TURN TO DRIFT';
  const leaderboard=[{name:'YOU',c:karts[state.kart].color,progress:state.lap-1+state.progressT},...bots.map(b=>({name:b.name,c:b.color,progress:b.progress}))].sort((a,b)=>b.progress-a.progress).slice(0,5);
  $('rivals').innerHTML=leaderboard.map((b,i)=>'<div><i style="background:#'+b.c.toString(16).padStart(6,'0')+'"></i>'+(i+1)+'. '+b.name+'</div>').join('');
}
const mini=$('minimap'),ctx=mini.getContext('2d');
function minimap(){
  const w=240,h=240,scale=.33;
  ctx.clearRect(0,0,w,h);
  ctx.save();ctx.translate(w/2,h/2);
  ctx.beginPath();
  for(let i=0;i<=world.samples.length;i+=3){
    const p=world.samples[i%world.samples.length].p;
    if(i===0)ctx.moveTo(p.x*scale,p.z*scale);
    else ctx.lineTo(p.x*scale,p.z*scale);
  }
  ctx.closePath();ctx.lineWidth=10;ctx.strokeStyle='rgba(0,0,0,.34)';ctx.stroke();
  ctx.lineWidth=5;ctx.strokeStyle='#d1eae6';ctx.stroke();
  ctx.lineWidth=1;ctx.strokeStyle='#64ead6';ctx.stroke();
  ctx.beginPath();const f=world.curve.getPointAt(0);ctx.arc(f.x*scale,f.z*scale,4,0,Math.PI*2);ctx.fillStyle='#f7feee';ctx.fill();
  if(state.mode==='race')for(const bot of bots){
    const p=bot.kart.root.position;ctx.beginPath();ctx.arc(p.x*scale,p.z*scale,4,0,Math.PI*2);
    ctx.fillStyle='#'+bot.color.toString(16).padStart(6,'0');ctx.fill();
  }
  const p=playerKart.root.position;
  ctx.translate(p.x*scale,p.z*scale);ctx.rotate(-state.yaw);
  ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(-6,7);ctx.lineTo(6,7);ctx.closePath();
  ctx.fillStyle='#fffff4';ctx.shadowColor='#48ffdb';ctx.shadowBlur=12;ctx.fill();
  ctx.restore();
}
const camTarget=new THREE.Vector3(),camLook=new THREE.Vector3(),target=new THREE.Vector3(),look=new THREE.Vector3();
function updateCamera(dt){
  if(state.phase==='menu'){
    state.menuAngle+=dt*.17;
    const p=playerKart.root.position;
    target.set(p.x+Math.cos(state.menuAngle)*19,p.y+9+Math.sin(state.menuAngle*.7)*2,p.z+Math.sin(state.menuAngle)*23);
    look.set(p.x,p.y+2,p.z);
    camera.position.lerp(target,Math.min(1,dt*2));
    camLook.lerp(look,Math.min(1,dt*2));camera.lookAt(camLook);return;
  }
  const head=new THREE.Vector3(Math.sin(state.yaw),0,Math.cos(state.yaw));
  const p=playerKart.root.position;
  const dist=state.cameraMode===1?19:state.cameraMode===2?8:14;
  const height=state.cameraMode===1?15:state.cameraMode===2?3.8:8.4;
  target.copy(p).addScaledVector(head,-dist);target.y+=height;
  look.copy(p).addScaledVector(head,12);look.y+=state.cameraMode===2?2.5:3.7;
  const f=1-Math.exp(-dt*(state.cameraMode===2?10:5));
  camera.position.lerp(target,f);
  camLook.lerp(look,1-Math.exp(-dt*7));
  if(state.shake>0){
    camera.position.x+=(Math.random()-.5)*state.shake*.45;
    camera.position.y+=(Math.random()-.5)*state.shake*.25;
    state.shake=Math.max(0,state.shake-dt*1.3);
  }
  camera.lookAt(camLook);
  camera.fov=lerp(camera.fov,69+Math.min(Math.abs(state.speed),75)*.20,Math.min(1,dt*2.5));
  camera.updateProjectionMatrix();
}
function resize(){
  const w=innerWidth,h=innerHeight;
  camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,w<800?1.45:1.7));
  if(composer)composer.setSize(w,h);
}
window.addEventListener('resize',resize);
const dustCount=95,dustPos=new Float32Array(dustCount*3),dustLife=new Float32Array(dustCount);
for(let i=0;i<dustCount;i++)dustPos[i*3+1]=-9999;
const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xd9fff0,size:1.9,transparent:true,opacity:.48,depthWrite:false}));
dust.frustumCulled=false;scene.add(dust);
let dustIndex=0,dustTimer=0;
function updateDust(dt){
  for(let i=0;i<dustCount;i++)if(dustLife[i]>0){
    dustLife[i]-=dt;
    dustPos[i*3+1]+=dt*2.7;
    dustPos[i*3]+=dt*Math.sin(i*2)*1.1;
    if(dustLife[i]<=0)dustPos[i*3+1]=-9999;
  }
  if(state.phase==='race'&&(state.drifting||state.padBoost>0||input('boost'))&&state.speed>8){
    dustTimer+=dt;
    if(dustTimer>.035){
      dustTimer=0;
      for(const side of [-1,1]){
        const i=dustIndex++%dustCount,heading=new THREE.Vector3(Math.sin(state.yaw),0,Math.cos(state.yaw));
        const lateral=new THREE.Vector3(heading.z,0,-heading.x);
        const p=playerKart.root.position.clone().addScaledVector(heading,-2.2).addScaledVector(lateral,side*1.2);
        dustPos[i*3]=p.x;dustPos[i*3+1]=p.y+.4;dustPos[i*3+2]=p.z;dustLife[i]=.4+Math.random()*.55;
      }
    }
  }
  dustGeo.attributes.position.needsUpdate=true;
}
let last=performance.now(),hudAccumulator=0,elapsed=0;
function loop(now){
  const dt=Math.min((now-last)/1000,.045);last=now;elapsed+=dt;state.worldTime+=dt;
  animateWorld(world,state.worldTime,dt);
  if(state.phase==='countdown'){
    state.countdown-=dt;
    const n=state.countdown>3?'3':state.countdown>2?'2':state.countdown>1?'1':'GO!';
    $('countdown').firstElementChild.textContent=n;
    if(state.countdown<=0){state.phase='race';hide('countdown');toast('FULL SPEED AHEAD!');sound('boost');}
  }else if(state.phase==='race'){
    state.time+=dt;updatePlayer(dt);
    if(state.phase==='race'){updateAI(dt);updateRacePosition();}
  }else if(state.phase==='menu'){
    const t=(state.worldTime*.028+.015)%1,l=locate(t);
    playerKart.root.position.lerp(l.p,Math.min(1,dt*2));
    state.yaw=l.yaw;playerKart.root.rotation.y=l.yaw;
    bots.forEach((b,i)=>{
      const r=locate((t-.008*(i+1)+1)%1,b.offset);
      b.kart.root.position.copy(r.p);b.kart.root.rotation.y=r.yaw;
    });
  }
  if(state.phase==='race'||state.phase==='countdown')updateDust(dt);
  if(state.toastTimer>0){state.toastTimer-=dt;if(state.toastTimer<=0)hide('toast');}
  if(audio){
    audio.osc.frequency.setTargetAtTime(60+Math.abs(state.speed)*5.4,audio.ctx.currentTime,.09);
    audio.filter.frequency.setTargetAtTime(200+Math.abs(state.speed)*23,audio.ctx.currentTime,.09);
    audio.gain.gain.setTargetAtTime(muted||state.phase==='paused'||state.phase==='menu'?0:.003+Math.abs(state.speed)*.00007,audio.ctx.currentTime,.15);
  }
  hudAccumulator+=dt;
  if(hudAccumulator>.075){hudAccumulator=0;if(state.phase==='race'||state.phase==='countdown'){updateHud();minimap();}}
  updateCamera(dt);
  if(composer)composer.render();else renderer.render(scene,camera);
  requestAnimationFrame(loop);
}
// First-load game should remain usable if font or audio CDN assets are blocked.
$('loading-bar').style.width='100%';
$('loading-label').textContent='READY TO RACE';
const start=locate(.015);playerKart.root.position.copy(start.p);state.yaw=start.yaw;playerKart.root.rotation.y=state.yaw;
camera.position.set(start.p.x+22,13,start.p.z+27);camLook.copy(start.p);camLook.y+=2;
requestAnimationFrame(loop);
setTimeout(()=>{
  hide('loading');show('menu');
},650);
