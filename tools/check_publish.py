"""Audit the exact staged public tree, without logging potential secret values."""
from pathlib import Path
import hashlib,json,math,re,struct,subprocess
R=Path(__file__).resolve().parents[1]
names=subprocess.check_output(['git','ls-files','-z'],cwd=R).decode().split('\0')
patterns=[rb'hf_[A-Za-z0-9]{20,}',rb'gh[pousr]_[A-Za-z0-9]{20,}',rb'-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----',rb'[CG]:[/\\]Users[/\\][A-Za-z0-9_-]{2,}']
for name in filter(None,names):
    assert not any(part in name.split('/') for part in ['.venv','node_modules','.cache','ckpts','checkpoints','output','qa']),('Private/generated directory staged',name)
    assert Path(name).suffix.lower() not in ['.ckpt','.pt','.pth','.npz','.pkl','.mp4','.zip'],('Unapproved file type staged',name)
    data=subprocess.check_output(['git','show',':'+name],cwd=R)
    assert not any(re.search(p,data) for p in patterns),('Potential credential or personal path; inspect locally',name)
hashes=json.loads((R/'research/asset-hashes.json').read_text())
for name,entry in hashes.items():
    data=subprocess.check_output(['git','show',':docs/'+name],cwd=R)
    assert len(data)==entry['bytes'] and hashlib.sha256(data).hexdigest()==entry['sha256'],('Public asset hash changed',name)
assert {name for name in names if name.endswith('.glb')}=={'docs/owned/aurel.glb','docs/gt3/gt3-full.glb','docs/gt3/gt3-balanced.glb','docs/gt3/gt3-lite.glb'}
clips=json.loads((R/'research/local-clips.json').read_text())['clips'];assert len(clips)==18
result_files=set()
for clip in clips:
    assert clip['format']=='aurel-native-body-quaternions/1' and len(clip['drivers'])==16 and clip['stride']==67
    assert not any(key in clip for key in ['betas','poses','rest','parents','vertices','shapedirs','weights'])
    name='docs/'+clip['sourceURL'].removeprefix('./');result_files.add(name)
    data=subprocess.check_output(['git','show',':'+name],cwd=R)
    assert len(data)==clip['frames']*67*4 and hashlib.sha256(data).hexdigest()==clip['sha256']
    values=struct.unpack('<'+str(len(data)//4)+'f',data);assert all(math.isfinite(v) for v in values)
    for f in range(clip['frames']):
        for j in range(16):
            start=f*67+3+j*4;assert abs(sum(v*v for v in values[start:start+4])-1)<1e-5
assert {name for name in names if name.endswith('.bin')}==result_files
print('PASS staged public tree, credential patterns, authorized GLB allowlist and asset hashes:',len(list(filter(None,names))),'files.')
