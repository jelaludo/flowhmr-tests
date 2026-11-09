"""Audit the exact staged public tree, without logging potential secret values."""
from pathlib import Path
import hashlib,json,re,subprocess
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
print('PASS staged public tree, credential patterns, authorized GLB allowlist and asset hashes:',len(list(filter(None,names))),'files.')
