"""Build the static GitHub Pages viewer; refresh only explicitly listed assets."""
from pathlib import Path
import argparse,hashlib,json,shutil

R=Path(__file__).resolve().parents[1];D=R/'docs'
p=argparse.ArgumentParser();p.add_argument('--refresh-assets',action='store_true');args=p.parse_args()
D.mkdir(exist_ok=True)
for name in ['index.html','app.js','style.css','credits.html']:
    shutil.copy2(R/'src'/name,D/name)
(D/'.nojekyll').write_text('')
for name in ['test-status.json','source-index.json','local-clips.json']:
    shutil.copy2(R/'research'/name,D/name)
if args.refresh_assets:
    K=R.parent/'Kimodo'
    files={
        K/'reference/aurel03/kit/aurel03-animation-kit/assets/robot-assembly/animation-kit/models/aurel03_frame_lod1.glb':'owned/aurel.glb',
        K/'web/vendor/three/three.module.js':'vendor/three/three.module.js',
        K/'tools/gt3/gt3.js':'gt3/gt3.js',
    }
    for name in ['robot-assembly/animation-kit/character.js','robot-assembly/runtime.js','robot-assembly/muscles/runtime.js','robot-assembly/muscles/specs.js','foot-lab/runtime.js','hand-lab/runtime.js','hand-lab/biped.js']:
        files[K/'web/vendor/aurel03/assets'/name]='owned/assets/'+name
    for name in ['loaders/GLTFLoader.js','controls/OrbitControls.js','environments/RoomEnvironment.js','utils/BufferGeometryUtils.js']:
        files[K/'web/vendor/three/addons'/name]='vendor/three/addons/'+name
    for name in ['gt3-full.glb','gt3-balanced.glb','gt3-lite.glb','manifest.json','collision.json','CREDITS.txt']:
        files[K/'web/shared/gt3'/name]='gt3/'+name
    for source,target in files.items():
        dest=D/target;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest)
    assets={str((D/target).relative_to(D)).replace('\\','/'):{'bytes':(D/target).stat().st_size,'sha256':hashlib.sha256((D/target).read_bytes()).hexdigest()} for target in files.values()}
    (R/'research/asset-hashes.json').write_text(json.dumps(assets,indent=2)+'\n')
for name in ['THREE.txt','AUREL.txt']:
    dest=D/'licenses'/name;dest.parent.mkdir(exist_ok=True);shutil.copy2(R/'LICENSES'/name,dest)
for path in D.rglob('*'):
    if path.is_file() and path.suffix.lower() in ['.html','.js','.json','.css','.txt']:
        text=path.read_text(encoding='utf-8-sig')
        assert '127.0.0.1' not in text and 'G:/Dev/' not in text and 'C:/Users/' not in text,('Local reference in public file',path)
assert (D/'owned/aurel.glb').is_file(),'Run --refresh-assets once in the original sibling workspace.'
print('Static viewer ready:',len(list(D.rglob('*'))),'entries; no private inference inputs or models copied.')
