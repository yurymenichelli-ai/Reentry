import * as THREE from './vendor/three.module.js';

// Photographic set with a perspective camera. Deliberately guided, not free-roam geometry.
export async function createScene(host, onProject) {
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 host.append(renderer.domElement);
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,100);
 const loader=new THREE.TextureLoader();
 const texture=await loader.loadAsync(new URL('./assets/threshold.jpg',import.meta.url).href);
 texture.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshBasicMaterial({map:texture});
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(20,40/3),material);scene.add(plane);
 let studioTexture,room=false,reduced=false,hidden=false,move=null,raf=0,last=0;
 let pointer={x:0,y:0},position={x:0,y:0,z:1},frame=0,drag=null;
 const baseDistance=()=>Math.min((40/3)/(2*Math.tan(THREE.MathUtils.degToRad(21))),20/(2*Math.tan(THREE.MathUtils.degToRad(21))*camera.aspect));
 position.z=baseDistance();
 const dustGeometry=new THREE.BufferGeometry();const particles=new Float32Array(54*3);
 for(let i=0;i<54;i++){particles[i*3]=(Math.random()-.5)*18;particles[i*3+1]=(Math.random()-.5)*12;particles[i*3+2]=.1+Math.random()*.9;}
 dustGeometry.setAttribute('position',new THREE.BufferAttribute(particles,3));
 const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0xffe9b6,size:.012,transparent:true,opacity:.19,depthWrite:false}));dust.visible=false;scene.add(dust);
 const vector=new THREE.Vector3();
 function render(now){
  if(hidden){raf=0;return;}
  raf=requestAnimationFrame(render);if(now-last<32)return;last=now;
  if(move){const t=Math.min(1,(now-move.start)/move.duration),e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;for(const k of ['x','y','z'])position[k]=move.from[k]+(move.to[k]-move.from[k])*e;if(t===1){const done=move.done;move=null;done?.();}}
  camera.position.set(position.x+(reduced?0:pointer.x*.07),position.y+(reduced?0:pointer.y*.04),position.z);
  camera.lookAt(camera.position.x,camera.position.y,0);
  if(room&&!reduced){dust.position.y=Math.sin(now*.00007)*.12;dust.position.x=Math.sin(now*.00009)*.08;}
  renderer.render(scene,camera);
  if(room&&frame++%2===0)onProject((x,y)=>{vector.set((x-.5)*20,(.5-y)*(40/3),.02).project(camera);return {x:(vector.x+1)/2*innerWidth,y:(1-vector.y)/2*innerHeight,visible:Math.abs(vector.x)<.96&&Math.abs(vector.y)<.84};});
 }
 function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(!move){position.z=baseDistance();position.x=0;position.y=0;}start();}
 function start(){if(!raf&&!hidden)raf=requestAnimationFrame(render);}
 function aim(x=.5,y=.5,zoom=1,duration=900){
  move?.done?.();const z=baseDistance()/zoom,halfH=z*Math.tan(THREE.MathUtils.degToRad(21)),halfW=halfH*camera.aspect;
  const to={x:THREE.MathUtils.clamp((x-.5)*20,-Math.max(0,10-halfW),Math.max(0,10-halfW)),y:THREE.MathUtils.clamp((.5-y)*40/3,-Math.max(0,20/3-halfH),Math.max(0,20/3-halfH)),z};
  return new Promise(done=>{if(reduced||duration===0){position=to;done();return;}move={from:{...position},to,start:performance.now(),duration,done};start();});
 }
 function mouse(e){
  pointer.x=e.clientX/innerWidth-.5;pointer.y=.5-e.clientY/innerHeight;
  if(drag&&room){const halfW=position.z*Math.tan(THREE.MathUtils.degToRad(21))*camera.aspect;position.x=THREE.MathUtils.clamp(drag.x-(e.clientX-drag.pointer)/innerWidth*halfW*2,-Math.max(0,10-halfW),Math.max(0,10-halfW));}
 }
 function down(e){if(room&&!move&&!e.target.closest('button,a,input,dialog'))drag={x:position.x,pointer:e.clientX};}
 function up(){drag=null;}
 function visibility(){hidden=document.hidden;if(hidden){cancelAnimationFrame(raf);raf=0;}else start();}
 addEventListener('resize',resize);addEventListener('pointermove',mouse,{passive:true});addEventListener('pointerdown',down);addEventListener('pointerup',up);addEventListener('pointercancel',up);document.addEventListener('visibilitychange',visibility);
 resize();
 return {
  aim,
  async enter(){if(!studioTexture){studioTexture=await loader.loadAsync(new URL('./assets/studio.jpg',import.meta.url).href);studioTexture.colorSpace=THREE.SRGBColorSpace;}material.map=studioTexture;material.needsUpdate=true;room=true;dust.visible=!reduced;position={x:0,y:0,z:baseDistance()/1.13};return aim(.5,.5,1,1100);},
  threshold(){room=false;dust.visible=false;material.map=texture;material.needsUpdate=true;position={x:0,y:0,z:baseDistance()};},
  reduced(value){reduced=value;dust.visible=room&&!value;if(value&&move){position=move.to;const done=move.done;move=null;done();}},
  dispose(){cancelAnimationFrame(raf);move?.done?.();removeEventListener('resize',resize);removeEventListener('pointermove',mouse);removeEventListener('pointerdown',down);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);document.removeEventListener('visibilitychange',visibility);plane.geometry.dispose();material.dispose();texture.dispose();studioTexture?.dispose();dustGeometry.dispose();dust.material.dispose();renderer.dispose();renderer.domElement.remove();}
 };
}
