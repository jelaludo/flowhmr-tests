import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export function createGT3(scene,{renderer,position=[-6,0,0],yaw=Math.PI,baseURL=new URL('./',import.meta.url),quality='balanced'}={}){
 const group=new T.Group();group.name='Ddiaz_GT3_noncommercial';group.position.fromArray(position);group.rotation.y=yaw;scene.add(group);
 let manifest,field,asset=null,mode=quality,token=0,environment=null,obstacle,debug=null;
 const loader=new GLTFLoader(),c=Math.cos(yaw),s=Math.sin(yaw);
 const local=(x,z)=>({x:c*(x-position[0])-s*(z-position[2]),z:s*(x-position[0])+c*(z-position[2])});
 function heightAt(x,z){if(!field)return null;const p=local(x,z),u=(p.x-field.min_x)/(field.max_x-field.min_x)*(field.nx-1),v=(p.z-field.min_z)/(field.max_z-field.min_z)*(field.nz-1);if(u<0||v<0||u>field.nx-1||v>field.nz-1)return null;
  const i=Math.min(field.nx-2,Math.floor(u)),j=Math.min(field.nz-2,Math.floor(v)),a=u-i,b=v-j,values=[field.heights[j][i],field.heights[j][i+1],field.heights[j+1][i],field.heights[j+1][i+1]],weights=[(1-a)*(1-b),a*(1-b),(1-a)*b,a*b];let h=0,w=0;for(let k=0;k<4;k++)if(values[k]!==null&&weights[k]>0){h+=values[k]*weights[k];w+=weights[k]}return w>1e-8?position[1]+h/w:null;
 }
 function intersectsCapsule(x,z,r,y,height){if(!field)return false;const p=local(x,z);if(p.x<field.min_x-r||p.x>field.max_x+r||p.z<field.min_z-r||p.z>field.max_z+r||y>obstacle.top+.02||y+height<position[1])return false;
  const test=(x,z,d)=>{const h=heightAt(x,z),lower=y+r-Math.sqrt(Math.max(0,r*r-d*d));return h!==null&&h>lower+.04&&y+height>position[1]+.02};
  if(test(x,z,0))return true;for(const radius of [r*.5,r])for(let i=0;i<16;i++){const a=i*Math.PI/8;if(test(x+Math.cos(a)*radius,z+Math.sin(a)*radius,radius))return true}return false;
 }
 function supportHeight(x,z,y,r=.27){
  // Match the capsule's lower hemisphere on sloping panels. Center-only
  // support lets the body sink into the uphill side and traps it on descent.
  let support=heightAt(x,z);
  for(const radius of [r*.5,r])for(let i=0;i<16;i++){const a=i*Math.PI/8,h=heightAt(x+Math.cos(a)*radius,z+Math.sin(a)*radius);if(h!==null){const candidate=h-r+Math.sqrt(Math.max(0,r*r-radius*radius));support=support===null?candidate:Math.max(support,candidate)}}
  return support!==null&&support<=y+.06?Math.max(position[1],support):null;
 }
 function dispose(root){const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(m=>{if(m.geometry)geometries.add(m.geometry);for(const mat of Array.isArray(m.material)?m.material:[m.material])if(mat){materials.add(mat);for(const[k,v]of Object.entries(mat))if(v?.isTexture&&k!=='envMap')textures.add(v)}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}
 async function setQuality(value){if(!manifest)return;const version=++token,next=['full','balanced','lite'].includes(value)?value:'balanced',entry=manifest.variants.find(v=>v.tier===next),gltf=await loader.loadAsync(new URL(entry.file,baseURL).href);if(version!==token){dispose(gltf.scene);return}
  const nextAsset=gltf.scene;let meshes=0;nextAsset.traverse(mesh=>{if(!mesh.isMesh)return;meshes++;mesh.castShadow=next!=='lite';mesh.receiveShadow=true;
   const original=mesh.material,name=original.name;
   if(name.includes('Paint_Material')){
    const params={name:'Gentian_Blue_Metallic_002B6C',color:'#002B6C',metalness:.55,roughness:.27,envMap:environment,envMapIntensity:.55};
    mesh.material=next==='lite'?new T.MeshStandardMaterial(params):new T.MeshPhysicalMaterial({...params,clearcoat:.75,clearcoatRoughness:.16,specularIntensity:.4,iridescence:.015,iridescenceIOR:1.25,iridescenceThicknessRange:[150,220]});mesh.material.userData.paint_srgb='#002B6C';
   }else if(name.includes('Window_Material')){
    mesh.material=next==='full'?new T.MeshPhysicalMaterial({name,color:'#b6c5d6',metalness:0,roughness:.08,transmission:.9,thickness:.006,ior:1.5,envMap:environment,side:T.DoubleSide}):new T.MeshStandardMaterial({name,color:'#4b5e72',metalness:.15,roughness:.16,transparent:true,opacity:.34,envMap:environment,side:T.DoubleSide,depthWrite:false});
   }else if(name==='RED_GLASS')mesh.material=new T.MeshStandardMaterial({name,color:'#9b0921',emissive:'#270007',roughness:.21,metalness:.15,envMap:environment});
   else{original.envMap=environment;original.envMapIntensity=.65}
  });
  if(asset){group.remove(asset);dispose(asset)}asset=nextAsset;group.add(asset);mode=next;api.stats={...entry,meshes,paint_srgb:'#002B6C',plate:'Ddiaz 2022',glass:next==='full'?'physical transmission':'blended tint',paint:next==='lite'?'standard metallic':'physical metallic + clearcoat'};group.updateMatrixWorld(true);api.onChange?.();
 }
 const api={group,get asset(){return asset},get manifest(){return manifest},get field(){return field},get obstacle(){return obstacle},get quality(){return mode},get debug(){return debug},stats:null,
  heightAt,intersectsCapsule,contains(x,z){return heightAt(x,z)!==null},supportHeight,setQuality,setDebug(show){if(debug)debug.visible=!!show},onChange:null};
 api.ready=(async()=>{
  [manifest,field]=await Promise.all(['manifest.json','collision.json'].map(file=>fetch(new URL(file,baseURL)).then(r=>{if(!r.ok)throw Error('GT3 asset missing: '+file);return r.json()})));
  if(renderer){const room=new RoomEnvironment(renderer),pmrem=new T.PMREMGenerator(renderer);environment=pmrem.fromScene(room,.04).texture;dispose(room);pmrem.dispose()}
  const w=manifest.dimensions_m.width,d=manifest.dimensions_m.length,h=manifest.dimensions_m.height,proxy=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshBasicMaterial({wireframe:true,color:0x65c9e0}));proxy.position.set(0,h/2,0);proxy.visible=false;group.add(proxy);
  obstacle={name:'GT3 Touring / Ddiaz',x:position[0],z:position[2],w:Math.abs(c)*w+Math.abs(s)*d,d:Math.abs(s)*w+Math.abs(c)*d,bottom:position[1],top:position[1]+h,mesh:proxy,trip:false,customCollider:true,intersectsCapsule,supportHeight:api.supportHeight};
  const vertices=[];for(let j=0;j<field.nz-1;j++)for(let i=0;i<field.nx-1;i++){const hs=[field.heights[j][i],field.heights[j][i+1],field.heights[j+1][i],field.heights[j+1][i+1]];if(hs.some(h=>h===null))continue;const x=field.min_x+i*(field.max_x-field.min_x)/(field.nx-1),z=field.min_z+j*(field.max_z-field.min_z)/(field.nz-1),dx=(field.max_x-field.min_x)/(field.nx-1),dz=(field.max_z-field.min_z)/(field.nz-1),p=[[x,hs[0]+.008,z],[x+dx,hs[1]+.008,z],[x,hs[2]+.008,z+dz],[x+dx,hs[3]+.008,z+dz]];for(const k of [0,2,1,1,2,3])vertices.push(...p[k])}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));debug=new T.Mesh(geometry,new T.MeshBasicMaterial({color:0x64e1d5,wireframe:true,transparent:true,opacity:.4,depthWrite:false}));debug.name='GT3_support_surface_debug';debug.visible=false;group.add(debug);
  await setQuality(mode);return api;
 })();return api;
}
