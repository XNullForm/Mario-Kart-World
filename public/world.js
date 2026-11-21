import * as THREE from 'three';

export const ROAD_WIDTH=22;
const random=(()=>{let s=831947;return ()=>((s=(s*1664525+1013904223)>>>0)/4294967296);})();
const mat=(color,roughness=.74,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const glow=(color,intensity=1)=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,metalness:.15,roughness:.4});
function mesh(geo,material,x=0,y=0,z=0,shadow=true){
  const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;return m;
}
function ribbon(curve,width,y,material,offset=0){
  const vertices=[],uvs=[],indices=[],count=900;
  for(let i=0;i<=count;i++){
    const t=i/count,p=curve.getPointAt(t),d=curve.getTangentAt(t),nx=d.z,nz=-d.x;
    for(const side of [-1,1]){
      const off=offset+side*width*.5;
      vertices.push(p.x+nx*off,y,p.z+nz*off);uvs.push(i/7,(side+1)*.5);
    }
    if(i<count){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
  const m=mesh(geo,material,0,0,0,false);m.material.side=THREE.DoubleSide;return m;
}
function asphaltTexture(){
  const c=document.createElement('canvas');c.width=256;c.height=256;
  const g=c.getContext('2d');g.fillStyle='#59606c';g.fillRect(0,0,256,256);
  for(let i=0;i<10000;i++){
    g.fillStyle=random()>.52?'rgba(224,232,235,.10)':'rgba(0,0,0,.12)';
    g.fillRect(random()*256,random()*256,.6+random()*2,.6+random()*2);
  }
  const tx=new THREE.CanvasTexture(c);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=8;return tx;
}
function sky(){
  return new THREE.Mesh(new THREE.SphereGeometry(1800,40,24),new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,uniforms:{uTime:{value:0}},
    vertexShader:'varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec3 vPos;uniform float uTime;void main(){vec3 d=normalize(vPos);float h=smoothstep(-.23,.62,d.y);vec3 c=mix(vec3(.97,.79,.56),vec3(.23,.60,.88),h);c=mix(c,vec3(.12,.4,.72),smoothstep(.5,.95,d.y)*.22);vec3 sun=normalize(vec3(-.55,.46,-.45));float halo=pow(max(dot(d,sun),0.),18.);float disc=pow(max(dot(d,sun),0.),800.);c+=vec3(1.,.67,.32)*halo*.4+vec3(1.,.85,.6)*disc*.9;gl_FragColor=vec4(c,1.);}'
  }));
}
function ocean(){
  const m=mesh(new THREE.PlaneGeometry(4000,4000,90,90),new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0}},side:THREE.DoubleSide,
    vertexShader:'uniform float uTime;varying vec3 vP;varying float vW;void main(){vec3 p=position;float w=sin(p.x*.045+uTime*.6)*.22+sin(p.y*.075-uTime*.9)*.17+sin((p.x+p.y)*.02+uTime*.5)*.22;p.z+=w;vW=w;vP=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
    fragmentShader:'varying vec3 vP;varying float vW;uniform float uTime;void main(){float r=sin(vP.x*.18+uTime)+cos(vP.y*.15-uTime*.7);float foam=smoothstep(.6,1.8,r)*.1;vec3 c=mix(vec3(.028,.23,.31),vec3(.05,.56,.61),clamp(.43+vW*.6+r*.12,0.,1.));c+=vec3(.23,.65,.60)*foam;gl_FragColor=vec4(c,1.);}'
  }),0,-2.7,0,false);
  m.rotation.x=-Math.PI/2;m.receiveShadow=false;return m;
}
function cloud(scene,x,y,z,scale){
  const g=new THREE.Group(),m=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:.87,depthWrite:false});
  for(let i=0;i<5;i++){
    const part=mesh(new THREE.SphereGeometry(1,10,7),m,(i-2)*7*scale,random()*2.4*scale,random()*6*scale,false);
    const r=(6+random()*8)*scale;part.scale.set(r,r*.45,r*.8);part.receiveShadow=false;g.add(part);
  }
  g.position.set(x,y,z);scene.add(g);return g;
}
const trunkMat=mat(0x946849),leafMat=mat(0x298c69),pineMat=mat(0x458c73),rockMat=mat(0x7e9e9b);
function palm(scene,x,z,scale=1){
  const g=new THREE.Group();g.position.set(x,-.25,z);g.scale.setScalar(scale);
  const trunk=mesh(new THREE.CylinderGeometry(.34,.49,11,7),trunkMat,.3,5.5,0);trunk.rotation.z=-.09;g.add(trunk);
  for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7,l=mesh(new THREE.ConeGeometry(1.3,8.2,5),leafMat,Math.sin(a)*3.4+1.0,11.0,Math.cos(a)*3.4);
    l.rotation.x=Math.cos(a)*.9;l.rotation.z=-Math.sin(a)*.9;g.add(l);
  }
  scene.add(g);
}
function pine(scene,x,z,scale=1){
  const g=new THREE.Group();g.position.set(x,-.35,z);g.scale.setScalar(scale);
  g.add(mesh(new THREE.CylinderGeometry(.5,.8,5,6),trunkMat,0,2,0));
  g.add(mesh(new THREE.ConeGeometry(4.6,11,7),pineMat,0,9,0));
  g.add(mesh(new THREE.ConeGeometry(3.7,8,7),pineMat,0,14,0));scene.add(g);
}
function mountain(scene,x,z,r,h,color){
  const g=new THREE.Group();g.position.set(x,-1.5,z);
  g.add(mesh(new THREE.ConeGeometry(r,h,7),mat(color,.96),0,h/2-1,0));
  g.add(mesh(new THREE.ConeGeometry(r*.24,h*.26,7),mat(0xf4f9fa),0,h*.85,0));scene.add(g);
}
function building(scene,x,z,w,h,d,col){
  const g=new THREE.Group();g.position.set(x,-.3,z);
  g.add(mesh(new THREE.BoxGeometry(w,h,d),mat(col,.58,.12),0,h/2,0));
  g.add(mesh(new THREE.BoxGeometry(w+1,.45,d+1),mat(0xe6f4ec,.36,.12),0,h,0));
  const wins=glow(0x89dedf,.35),geo=new THREE.PlaneGeometry(1.7,2.7);
  for(let row=0;row<Math.floor((h-4)/5);row++)for(let c=0;c<Math.floor((w-3)/4);c++){
    if(random()<.2)continue;
    g.add(mesh(geo,wins,-w/2+2.8+c*4,3.6+row*5,d/2+.04,false));
  }
  scene.add(g);
}
function flagTexture(word,dark=false){
  const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');
  g.fillStyle=dark?'#0b3241':'#bdffec';g.fillRect(0,0,512,128);
  g.fillStyle=dark?'#a6fff4':'#083f49';g.textAlign='center';g.textBaseline='middle';g.font='900 64px Arial';g.fillText(word,256,68,495);
  const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;return tx;
}
function gate(scene,curve,t,word){
  const p=curve.getPointAt(t),d=curve.getTangentAt(t),g=new THREE.Group();
  g.position.copy(p);g.rotation.y=Math.atan2(d.x,d.z);
  const white=mat(0xeef8f0,.36,.2);
  for(const side of [-1,1])g.add(mesh(new THREE.BoxGeometry(.9,10,.9),white,side*13,5,0));
  g.add(mesh(new THREE.BoxGeometry(27,2.2,1.2),white,0,10,0));
  g.add(mesh(new THREE.PlaneGeometry(24,1.8),new THREE.MeshBasicMaterial({map:flagTexture(word),side:THREE.DoubleSide}),0,10,.64,false));
  scene.add(g);
}
export function createWorld(scene){
  const points=[[-45,218],[30,230],[108,195],[160,141],[238,122],[255,46],[227,-28],[258,-107],[198,-177],[111,-223],[18,-200],[-77,-227],[-168,-194],[-234,-126],[-215,-32],[-261,53],[-190,132],[-133,198]].map(v=>new THREE.Vector3(v[0],0,v[1]));
  const curve=new THREE.CatmullRomCurve3(points,true,'catmullrom',.42);
  const trackLength=curve.getLength();
  const samples=Array.from({length:840},(_,i)=>{const t=i/840,p=curve.getPointAt(t),dir=curve.getTangentAt(t);return {t,p,dir,n:new THREE.Vector3(dir.z,0,-dir.x)};});
  const skyMesh=sky(),water=ocean();scene.add(skyMesh,water);
  scene.add(mesh(new THREE.CylinderGeometry(359,388,9,72),mat(0xe3cb97),0,-6.4,0,false));
  scene.add(mesh(new THREE.CylinderGeometry(344,348,3,72),mat(0x7ac992),0,-2.1,0,false));
  scene.add(mesh(new THREE.CylinderGeometry(307,330,1.3,72),mat(0x6bb882),0,-.75,0,false));
  for(const [x,z,r,color] of [[254,78,107,0xe5c58b],[23,72,97,0x71b3a5],[-125,-66,105,0x548f6a]]){
    const m=mesh(new THREE.CircleGeometry(r,60),mat(color),x,-.04,z,false);m.rotation.x=-Math.PI/2;scene.add(m);
  }
  const asphalt=mat(0x48535d,.94);asphalt.map=asphaltTexture();
  scene.add(ribbon(curve,30,.24,mat(0xecd9ad,.96)));
  scene.add(ribbon(curve,ROAD_WIDTH,.31,asphalt));
  scene.add(ribbon(curve,.30,.345,mat(0xe8f4e4),ROAD_WIDTH*.5-1));
  scene.add(ribbon(curve,.30,.345,mat(0xe8f4e4),-ROAD_WIDTH*.5+1));
  const dashMat=mat(0xcce3d7),curbs=[mat(0xf8fcf0),mat(0xef635f)];
  const dashGeo=new THREE.BoxGeometry(.25,.04,3.1),curbGeo=new THREE.BoxGeometry(1.8,.25,2.3);
  for(let i=0;i<380;i++){
    const t=i/380,p=curve.getPointAt(t),d=curve.getTangentAt(t),yaw=Math.atan2(d.x,d.z);
    if(i%2===0){const m=mesh(dashGeo,dashMat,p.x,.38,p.z,false);m.rotation.y=yaw;scene.add(m);}
    for(const s of [-1,1]){
      const m=mesh(curbGeo,curbs[Math.floor(i/6)%2],p.x+d.z*s*11.5,.45,p.z-d.x*s*11.5,false);m.rotation.y=yaw;scene.add(m);
    }
  }
  const p0=curve.getPointAt(0),d0=curve.getTangentAt(0);
  for(let x=0;x<12;x++)for(let z=0;z<2;z++){
    const p=p0.clone().addScaledVector(new THREE.Vector3(d0.z,0,-d0.x),(x-5.5)*1.75).addScaledVector(d0,(z-1)*1.8);
    const m=mesh(new THREE.BoxGeometry(1.78,.055,1.88),mat((x+z)%2?0x223945:0xf4f7f0),p.x,.382,p.z,false);m.rotation.y=Math.atan2(d0.x,d0.z);scene.add(m);
  }
  gate(scene,curve,0,'HORIZON KARTS');gate(scene,curve,.5,'HALFWAY HOME');
  for(let i=0;i<150;i++){
    const a=random()*Math.PI*2,r=40+Math.sqrt(random())*280,x=Math.cos(a)*r,z=Math.sin(a)*r;
    let near=1e9;for(let j=0;j<840;j+=10){const p=samples[j].p;near=Math.min(near,(p.x-x)**2+(p.z-z)**2);}
    if(near<33*33)continue;
    if(x>170&&z>-25&&z<175)palm(scene,x,z,.5+random()*.7);
    else if(x<-30&&z<70&&z>-200)pine(scene,x,z,.4+random()*.7);
    else if(random()>.6)palm(scene,x,z,.45+random()*.6);
    else pine(scene,x,z,.35+random()*.6);
  }
  for(let i=0;i<13;i++){const a=i*Math.PI*2/13,r=515+random()*145;mountain(scene,Math.cos(a)*r,Math.sin(a)*r,48+random()*75,90+random()*140,[0x75a6ae,0x6495a2,0x7aa3a4][i%3]);}
  for(let i=0;i<6;i++)mountain(scene,-125+random()*170,-95+random()*150,22+random()*26,30+random()*45,0x699d86);
  for(let i=0;i<30;i++){
    const x=26+(random()-.5)*145,z=56+(random()-.5)*140;
    let near=1e9;for(let j=0;j<840;j+=10)near=Math.min(near,samples[j].p.distanceTo(new THREE.Vector3(x,0,z)));
    if(near>34)building(scene,x,z,8+random()*12,19+random()*61,8+random()*12,[0x7297aa,0x90aeb2,0x4a7e91,0xd5bbb1][i%4]);
  }
  // Festival wheel with colorful cabins.
  const festival=new THREE.Group();festival.position.set(118,-.1,39);
  const wheelMat=mat(0xe3f1e8,.4,.25),wheel=new THREE.Group();wheel.position.y=37;
  for(const s of [-1,1]){
    const strut=mesh(new THREE.CylinderGeometry(.6,.8,40,9),wheelMat,s*7,18,0);strut.rotation.z=s*.3;festival.add(strut);
  }
  wheel.add(mesh(new THREE.TorusGeometry(24,.55,8,64),glow(0x84f9e2,.75)));
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5,bar=mesh(new THREE.CylinderGeometry(.25,.25,48,6),wheelMat);
    bar.rotation.z=a;wheel.add(bar);
    wheel.add(mesh(new THREE.BoxGeometry(4,4,4),mat([0xef6d72,0xffdf73,0x68cbe5][i%3]),Math.sin(a)*24,Math.cos(a)*24,1));
  }
  festival.add(wheel);scene.add(festival);
  const lighthouse=new THREE.Group();lighthouse.position.set(290,-.2,190);
  lighthouse.add(mesh(new THREE.CylinderGeometry(3.5,6.3,35,12),mat(0xf2f3e9),0,17.5,0));
  lighthouse.add(mesh(new THREE.CylinderGeometry(5.8,5.8,2,12),mat(0xd96055),0,33,0));
  lighthouse.add(mesh(new THREE.ConeGeometry(6.3,5,12),mat(0xd96055),0,39,0));
  lighthouse.add(mesh(new THREE.CylinderGeometry(3.6,3.6,5,12),glow(0xffe9a5,.65),0,36,0));
  scene.add(lighthouse);
  const clouds=[];
  for(let i=0;i<25;i++){const a=random()*Math.PI*2,r=260+random()*650;clouds.push(cloud(scene,Math.cos(a)*r,95+random()*95,Math.sin(a)*r,.75+random()*1.5));}
  const boosts=[];
  for(const t of [.105,.27,.43,.63,.83,.94]){
    const p=curve.getPointAt(t),dir=curve.getTangentAt(t),g=new THREE.Group();
    g.position.copy(p);g.rotation.y=Math.atan2(dir.x,dir.z);
    const b=mesh(new THREE.BoxGeometry(16,.09,5.5),glow(0x28dcdc,1.4),0,.4,0,false);g.add(b);
    for(let i=-3;i<=3;i++){const stripe=mesh(new THREE.BoxGeometry(1.1,.1,3.4),glow(0xbbfff6,1),i*2.1,.49,0,false);stripe.rotation.y=-.37;g.add(stripe);}
    scene.add(g);boosts.push({t,p,group:g,lastTrigger:-100});
  }
  const pickups=[];
  for(let i=0;i<23;i++){
    const t=(i+.5)/23,p=curve.getPointAt(t),d=curve.getTangentAt(t),off=((i%3)-1)*5;
    const x=p.x+d.z*off,z=p.z-d.x*off,g=new THREE.Group();g.position.set(x,3.6,z);
    const crystal=mesh(new THREE.OctahedronGeometry(1.65),glow(0xffd86d,1.2));
    const ring=mesh(new THREE.TorusGeometry(2.25,.13,6,22),glow(0xe9fff1,.6),0,0,0,false);
    ring.rotation.y=.55;g.add(crystal,ring);scene.add(g);
    pickups.push({position:new THREE.Vector3(x,3.6,z),group:g,crystal,ring,available:true,respawn:0,baseY:3.6});
  }
  for(let i=0;i<46;i++){
    const a=i*Math.PI*2/46,r=337,m=mesh(new THREE.DodecahedronGeometry(2.5+random()*3),rockMat,Math.cos(a)*r,-.1,Math.sin(a)*r);
    m.rotation.set(random(),random(),random());scene.add(m);
  }
  return {curve,trackLength,samples,pickups,boosts,sky:skyMesh,water,clouds,animatedWheel:wheel};
}
export function nearestRoad(world,pos){
  const ss=world.samples;let best=0,dist=Infinity;
  for(let i=0;i<ss.length;i+=4){
    const p=ss[i].p,dx=pos.x-p.x,dz=pos.z-p.z,d=dx*dx+dz*dz;
    if(d<dist){dist=d;best=i;}
  }
  let nearest=best;
  for(let j=-7;j<=7;j++){
    const ix=(best+j+ss.length)%ss.length,p=ss[ix].p,dx=pos.x-p.x,dz=pos.z-p.z,d=dx*dx+dz*dz;
    if(d<dist){dist=d;nearest=ix;}
  }
  return {t:ss[nearest].t,dist:Math.sqrt(dist),point:ss[nearest].p,tangent:ss[nearest].dir,normal:ss[nearest].n};
}
export function animateWorld(world,time,dt){
  world.water.material.uniforms.uTime.value=time;
  world.sky.material.uniforms.uTime.value=time;
  world.animatedWheel.rotation.z+=dt*.13;
  for(let i=0;i<world.clouds.length;i++){
    const c=world.clouds[i];c.position.x+=dt*(.5+i%4*.15);if(c.position.x>1000)c.position.x=-1000;
  }
  for(const p of world.pickups){
    if(!p.available){if(time>p.respawn){p.available=true;p.group.visible=true;}continue;}
    p.group.position.y=p.baseY+Math.sin(time*3+p.position.x)*.45;
    p.crystal.rotation.y+=dt*2.1;p.ring.rotation.z+=dt*.9;
  }
  for(let i=0;i<world.boosts.length;i++)world.boosts[i].group.children[0].material.emissiveIntensity=1.4+Math.sin(time*4+i)*.45;
}
