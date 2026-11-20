"""v140/v149: the bills inbox rule stays scoped to Tony's share, create-only, no owner data writes."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
rules=(ROOT/'firestore.rules').read_text()
start=rules.index('match /inbox/{id}')
end=rules.index('allow read, delete:', start)
block=rules[start:end]
users=rules[rules.index('match /users/'):rules.index('match /shares/')]
assert 'allow create:' in block and 'allow update' not in block and 'allow delete' not in block
assert "who == 'Tony'" in block
assert "kind == 'bills'" in block
assert "by == 'Tony'" in block
assert "hasOnly(['kind','by','month','rev','rows','at'])" in block
assert "hasAll(['kind','by','month','rev','rows','at'])" in block
assert 'request.time' in block
assert 'rows.size() <= 20' in block
assert 'rev <= 10000' in block
# v149: per-row checks are lighter (1000-expression budget) but still cap shape
assert "hasOnly(['key','total','alloc','fixed','name','group'])" in block
assert 'r.total is number' in block and 'r.alloc is map' in block
assert 'match /users/' not in block and 'allow write' not in block
assert 'allow read, write: if request.auth != null && request.auth.uid == uid' in users
assert 'allow list: if false' in rules
assert 'allow update' not in block
assert 'billsCreateOk' in block and 'settleCreateOk' in block and 'purchaseCreateOk' in block
assert 'shareExists' in block
print('test_v140_rules OK')
