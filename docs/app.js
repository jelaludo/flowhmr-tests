import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createCharacter} from './owned/assets/robot-assembly/animation-kit/character.js';
import {createGT3} from './gt3/gt3.js?v=2';
const $=id=>document.getElementById(id),stage=$('stage'),scene=new T.Scene();scene.background=new T.Color('#263f46');
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=T.ACESFilmicToneMapping;stage.append(renderer.domElement);
const camera=new T.PerspectiveCamera(45,1,.02,150),orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=false;
scene.add(new T.HemisphereLight(0xe2f6ff,0x4b6261,2.6));const sun=new T.DirectionalLight(0xfff0dc,3);sun.position.set(4,7,5);scene.add(sun);scene.add(new T.GridHelper(24,48,0x64878c,0x39585f));
const ground=new T.Mesh(new T.PlaneGeometry(160,160),new T.MeshStandardMaterial({color:0x20363c,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.012;scene.add(ground);
let gt3=null;
const REPO='https://github.com/jelaludo/flowhmr-tests',ORIGINAL='https://flowhmr.github.io/assets/viewer/';
async function json(path){const r=await fetch(new URL(path,import.meta.url));if(!r.ok)throw Error('Could not load '+path);return r.json()}
async function showCar(){try{if(!gt3){gt3=createGT3(scene,{renderer,position:[2.8,0,-.6],yaw:-Math.PI*.22,baseURL:new URL('./gt3/',import.meta.url),quality:$('gt3-quality').value});gt3.onChange=()=>{if(gt3.stats)$('gt3-size').textContent=(gt3.stats.bytes/1e6).toFixed(2)+' MB / '+gt3.stats.triangles.toLocaleString()+' triangles';render()}}await gt3.ready;gt3.group.visible=$('gt3-show').checked;resetView()}catch(error){$('gt3-show').checked=false;$('gt3-size').textContent='Car unavailable: '+error.message}updateFeedback()}
let asset,character,manifest,item,data,bind,nodes,corrections,sourceScale=1,time=0,playing=false,raf=null,last=0,ready=false,request=0;
const native={PELVIS_FRAME:0,RIBCAGE_SPINE:9,HEAD_YAW:12,HEAD_PITCH:15,LEG_L_HIP:1,LEG_L_KNEE:4,LEG_L_ANKLE:7,LEG_R_HIP:2,LEG_R_KNEE:5,LEG_R_ANKLE:8,ARM_L_SHOULDER:16,ARM_L_ELBOW:18,ARM_L_WRIST:20,ARM_R_SHOULDER:17,ARM_R_ELBOW:19,ARM_R_WRIST:21};
const child={LEG_L_HIP:'LEG_L_KNEE',LEG_L_KNEE:'LEG_L_ANKLE',LEG_R_HIP:'LEG_R_KNEE',LEG_R_KNEE:'LEG_R_ANKLE',ARM_L_SHOULDER:'ARM_L_ELBOW',ARM_L_ELBOW:'ARM_L_WRIST',ARM_R_SHOULDER:'ARM_R_ELBOW',ARM_R_ELBOW:'ARM_R_WRIST',ARM_L_WRIST:'HAND_L_MIDDLE_MCP_FLEX',ARM_R_WRIST:'HAND_R_MIDDLE_MCP_FLEX'};
const sourceChild={1:4,4:7,2:5,5:8,16:18,18:20,17:19,19:21,20:22,21:37};
const simParents=[-1,0,1,2,3,0,5,6,7,0,9,10,11,12,11,14,15,16,17,11,19,20,21,22],segments=simParents.flatMap((p,j)=>p>=0?[p,j]:[]),simGeometry=new T.BufferGeometry();simGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(segments.length*3),3));const sim=new T.LineSegments(simGeometry,new T.LineBasicMaterial({color:0xf2b96c,depthTest:false}));sim.visible=false;scene.add(sim);
function render(){renderer.render(scene,camera)}orbit.addEventListener('change',render);
new ResizeObserver(()=>{const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();render()}).observe(stage);
function resetView(){if(gt3?.group.visible){camera.position.set(6,3.5,7);orbit.target.set(1.4,.8,-.2)}else{camera.position.set(2.5,1.7,3.8);orbit.target.set(0,.85,0)}orbit.update();render()}
function stop(){playing=false;$('play').textContent='Play';if(raf!==null)cancelAnimationFrame(raf);raf=null}
function tick(now){if(!playing)return;const dt=Math.min(.08,(now-last)/1000);last=now;time=(time+dt*Number($('speed').value))%((item.frames-1)/30);pose(time);render();raf=requestAnimationFrame(tick)}
$('play').onclick=()=>{if(!ready)return;if(playing)stop();else{playing=true;$('play').textContent='Pause';last=performance.now();raf=requestAnimationFrame(tick)}};
$('reset').onclick=resetView;$('time').oninput=()=>{stop();time=Number($('time').value);pose(time);render()};
$('gt3-show').onchange=showCar;
$('gt3-quality').onchange=async()=>{if(!gt3)return;try{await gt3.setQuality($('gt3-quality').value);render();updateFeedback()}catch(error){$('gt3-size').textContent=error.message}};
$('travel').onchange=$('physics').onchange=()=>{pose(time);render();updateFeedback()};document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
function restore(){for(const n of bind){n.b.position.copy(n.p);n.b.quaternion.copy(n.q);n.b.scale.copy(n.s)}asset.updateMatrixWorld(true)}
function pose(seconds){if(!data)return;restore();const frame=Math.min(item.frames-1,Math.max(0,seconds*30)),a=Math.floor(frame),b=Math.min(a+1,item.frames-1),u=frame-a;
 if(item.kind==='local'){
  const stride=item.stride,root=new T.Vector3().fromArray(data.owned,a*stride).lerp(new T.Vector3().fromArray(data.owned,b*stride),u);root.x=$('travel').checked?root.x-data.owned[0]:0;root.z=$('travel').checked?root.z-data.owned[2]:0;nodes.PELVIS_FRAME.position.copy(nodes.PELVIS_FRAME.parent.worldToLocal(root));
  for(let i=0;i<item.drivers.length;i++)nodes[item.drivers[i]].quaternion.fromArray(data.owned,a*stride+3+i*4).slerp(new T.Quaternion().fromArray(data.owned,b*stride+3+i*4),u).normalize();
  character.updateAfterAnimation();sim.visible=false;
 }else{const J=manifest.model.joints,global=[];
 for(let j=0;j<J;j++){const q=new T.Quaternion().fromArray(data.pose,(a*J+j)*4).slerp(new T.Quaternion().fromArray(data.pose,(b*J+j)*4),u);global[j]=manifest.model.parents[j]<0?q:global[manifest.model.parents[j]].clone().multiply(q)}
 const root=new T.Vector3().fromArray(data.root,a*3).lerp(new T.Vector3().fromArray(data.root,b*3),u);root.x=($('travel').checked?root.x-data.root[0]:0)*sourceScale;root.z=($('travel').checked?root.z-data.root[2]:0)*sourceScale;root.y*=sourceScale;
 nodes.PELVIS_FRAME.position.copy(nodes.PELVIS_FRAME.parent.worldToLocal(root));
 for(const[name,index]of Object.entries(native)){const bone=nodes[name],q=global[index].clone().multiply(corrections[name]);bone.quaternion.copy(bone.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q)).normalize();bone.updateWorldMatrix(false,false)}
 character.updateAfterAnimation();
 sim.visible=$('physics').checked;
 if(sim.visible){const pos=simGeometry.attributes.position;for(let n=0;n<segments.length;n++){const j=segments[n],a0=(a*24+j)*3,b0=(b*24+j)*3,x=T.MathUtils.lerp(data.robot[a0],data.robot[b0],u)-item.offset[0]-data.root[0],y=T.MathUtils.lerp(data.robot[a0+2],data.robot[b0+2],u),z=-T.MathUtils.lerp(data.robot[a0+1],data.robot[b0+1],u)+item.offset[1]-data.root[2];const dx=$('travel').checked?0:root.x/sourceScale-(T.MathUtils.lerp(data.root[a*3],data.root[b*3],u)-data.root[0]),dz=$('travel').checked?0:-(T.MathUtils.lerp(data.root[a*3+2],data.root[b*3+2],u)-data.root[2]);pos.setXYZ(n,(x+dx)*sourceScale+1.7,y*sourceScale,(z+dz)*sourceScale)}pos.needsUpdate=true;simGeometry.computeBoundingSphere()}

 }
 $('time').value=String(seconds);$('clock').textContent=seconds.toFixed(2)+' / '+((item.frames-1)/30).toFixed(2)+' s';window.FlowReview.currentFrame=frame;updateFeedback();
}
async function select(id){stop();ready=false;window.FlowReview.ready=false;const token=++request,selected=manifest.clips.find(c=>c.id===id);if(!selected)throw Error('Unknown clip');const comparisonTime=item?.kind==='local'&&selected.kind==='local'&&item.case===selected.case?time:0;item=selected;$('message').textContent='Loading '+selected.title+'...';
 const response=await fetch(new URL(selected.sourceURL,import.meta.url));if(token!==request)return;if(!response.ok)throw Error('Motion data unavailable. Reload or choose another clip.');const buffer=await response.arrayBuffer();if(token!==request)return;
 if(crypto.subtle){const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),b=>b.toString(16).padStart(2,'0')).join('');if(token!==request)return;if(digest!==selected.sha256)throw Error('Motion data does not match its recorded hash.');}
 const R=selected.frames;
 if(selected.kind==='local'){
  if(!selected.drivers.every(n=>Object.hasOwn(native,n))||buffer.byteLength!==R*selected.stride*4)throw Error('Invalid AUREL driver clip');data={owned:new Float32Array(buffer)};
 }else{
  const J=manifest.model.joints,B=manifest.bodies.length;let offset=0;const take=(Type,n)=>{const a=new Type(buffer,offset,n);offset+=Type.BYTES_PER_ELEMENT*n;return a};data={root:take(Float32Array,R*3),robot:take(Float32Array,R*B*3)};const quantized=take(Int16Array,R*J*4);data.pose=new Float32Array(quantized.length);for(let i=0;i<quantized.length;i+=4){const norm=Math.hypot(...quantized.subarray(i,i+4))||1;for(let j=0;j<4;j++)data.pose[i+j]=quantized[i+j]/norm}offset+=R*B*4*2;if(offset!==buffer.byteLength)throw Error('Invalid published clip size');
  restore();const rest=manifest.model.rest,source=[];for(let j=0;j<J;j++){const p=manifest.model.parents[j];source[j]=p<0?new T.Vector3():item.jointOffsets?source[p].clone().add(new T.Vector3().fromArray(item.jointOffsets,j*3)):new T.Vector3(rest[j*3]-rest[0],rest[j*3+1]-rest[1],rest[j*3+2]-rest[2])}
  const sourceHipHeight=-Math.min(source[10].y,source[11].y)*item.scale,targetHip=nodes.PELVIS_FRAME.getWorldPosition(new T.Vector3()).y;sourceScale=targetHip/sourceHipHeight;corrections={};
  for(const[name,index]of Object.entries(native)){const bone=nodes[name],worldQ=bone.getWorldQuaternion(new T.Quaternion());let alignment=new T.Quaternion();if(child[name])alignment.setFromUnitVectors(nodes[child[name]].getWorldPosition(new T.Vector3()).sub(bone.getWorldPosition(new T.Vector3())).normalize(),source[sourceChild[index]].clone().sub(source[index]).normalize());corrections[name]=alignment.multiply(worldQ)}
 }
 $('physics').disabled=selected.kind==='local';if(selected.kind==='local')$('physics').checked=false;
 document.querySelector('.tag').textContent=selected.kind==='local'?'Our FlowHMR inference / '+selected.model.replace('flowhmr_','')+' / seed '+selected.seed+' / AUREL-03\nRaw motion retarget / no robot physics':'Author-published FlowHMR motion / AUREL-03\nPublished PHC human reference optional';
 time=Math.min(comparisonTime,(R-1)/30);$('time').max=String((R-1)/30);ready=true;pose(time);resetView();$('message').textContent=selected.title+' / '+R+' frames / original 30 Hz timing';$('sample').textContent=selected.kind==='local'?'Our local inference: '+selected.id+'. Native body/wrist retarget; authored finger pose; muscle following; no contact correction.':'Author-published sample '+selected.id+'; separate from our 18 local inference runs.';window.FlowReview.ready=true;window.FlowReview.clip=id;
}
async function status(){const r=await json('./test-status.json');$('ready').textContent=r.completed===18?'Local batch completed':'Local setup in progress';$('done').textContent=String(r.completed);$('blocked').textContent=String(r.pending??r.blocked);$('reason').textContent=r.reason;$('missing').replaceChildren(...r.missing.map(f=>{const li=document.createElement('li');li.textContent=f;return li}));$('runs').replaceChildren(...r.runs.map(row=>{const li=document.createElement('li');li.textContent=row.case+' / '+row.model.replace('flowhmr_','')+' / seed '+row.seed+' / '+row.status;return li}))}
window.FlowReview={ready:false,currentFrame:0,get gt3(){return gt3},get playing(){return playing},get currentTime(){return time},get asset(){return asset},get item(){return item},get nodes(){return nodes},select,pose,render,stop};
function viewURL(){const u=new URL(location.href);u.search='';u.searchParams.set('clip',item?.id||'c003');u.searchParams.set('t',time.toFixed(2));if($('travel').checked)u.searchParams.set('travel','1');if($('physics').checked)u.searchParams.set('phc','1');if($('gt3-show').checked)u.searchParams.set('car','1');u.searchParams.set('quality',$('gt3-quality').value);u.searchParams.set('speed',$('speed').value);return u.href}
function feedbackText(){return 'Motion: '+(item?.title||'Loading')+' ('+(item?.id||'')+')\nTime: '+time.toFixed(2)+' s\nView: '+viewURL()+'\n\nFeedback:\n'+$('feedback').value.trim()}
function updateFeedback(){if(!$('feedback-link'))return;$('feedback-link').href=REPO+'/issues/new?title='+encodeURIComponent('Feedback: '+(item?.title||'viewer')+' at '+time.toFixed(2)+'s')+'&body='+encodeURIComponent(feedbackText())}
async function copy(text){try{await navigator.clipboard.writeText(text);$('feedback-status').textContent='Copied. Send it to us with your feedback.'}catch{$('feedback-status').textContent='Copy this text: '+text}}
$('copy-view').onclick=()=>copy(viewURL());$('copy-feedback').onclick=()=>copy(feedbackText());$('feedback').oninput=updateFeedback;$('speed').onchange=updateFeedback;
try{
 await status();const own=await json('./local-clips.json');manifest={clips:own.clips};
 try{const pinned=await json('./source-index.json'),published=await json(ORIGINAL+'manifest.json');if(published.model.joints!==52||published.bodies.length!==24)throw Error('Upstream skeleton layout changed');manifest.model=published.model;manifest.bodies=published.bodies;manifest.clips.push(...pinned.clips.map(ref=>{const clip=published.clips.find(c=>c.id===ref.id&&c.v===ref.version);if(!clip)throw Error('Upstream catalogue changed');return {...clip,kind:'published',sourceURL:ref.url,sha256:ref.sha256}}))}catch(error){console.warn('Published reference catalogue unavailable; local results remain available.')}
 asset=(await new GLTFLoader().loadAsync(new URL('./owned/aurel.glb',import.meta.url).href)).scene;scene.add(asset);nodes={};bind=[];asset.traverse(b=>{if(b.name)nodes[b.name]=b;bind.push({b,p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone()});if(b.isSkinnedMesh)b.frustumCulled=false});asset.updateMatrixWorld(true);character=createCharacter(asset);
 $('clip').replaceChildren(...['local','published'].map(kind=>{const group=document.createElement('optgroup');group.label=kind==='local'?'Our 18 matched-video comparisons':'17 author-published examples';group.append(...manifest.clips.filter(c=>c.kind===kind).map(c=>new Option(c.title,c.id)));return group}));$('clip').disabled=false;$('play').disabled=false;$('time').disabled=false;
 const query=new URLSearchParams(location.search),id=manifest.clips.some(c=>c.id===query.get('clip'))?query.get('clip'):'ukemi-latest-s0';$('clip').value=id;
 $('clip').onchange=()=>select($('clip').value).catch(error=>{$('message').textContent=error.message});
 $('travel').checked=query.get('travel')==='1';$('physics').checked=query.get('phc')==='1';if(['.5','1','2'].includes(query.get('speed')))$('speed').value=query.get('speed');
 if(['full','balanced','lite'].includes(query.get('quality')))$('gt3-quality').value=query.get('quality');
 await select(id);time=Math.max(0,Math.min((item.frames-1)/30,Number(query.get('t'))||0));pose(time);render();
 if(query.get('car')==='1'){$('gt3-show').checked=true;await showCar()}
}catch(error){$('message').textContent=error.message+' Reload to retry, or use the Original FlowHMR link.';console.error(error)}
