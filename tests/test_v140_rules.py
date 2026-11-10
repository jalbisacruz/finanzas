"""v140 (local only): the bills inbox rule stays scoped to Tony's share, create-only, no owner data writes."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
rules=(ROOT/'firestore.rules').read_text()
# isolate the v140 bills block (from our comment to the settle comment)
start=rules.index('// v140')
end=rules.index('// v73')
block=rules[start:end]
users=rules[rules.index('match /users/'):rules.index('match /shares/')]
assert 'allow create:' in block and 'allow update' not in block and 'allow delete' not in block
assert "data.who == 'Tony'" in block
assert "kind == 'bills'" in block
assert "by == 'Tony'" in block
assert "hasOnly(['kind','by','month','rev','rows','at'])" in block  # doc-level
assert "hasAll(['kind','by','month','rev','rows','at'])" in block
assert 'request.time' in block
assert 'rows.size() <= 20' in block
assert 'rev <= 10000' in block
assert 'total <= 100000' in block
assert "key.matches('^(renta|ventanas|agua|luz|gas|telefono|internet|purificador|seguro|letra)$')" in block
assert 'comida' not in block.lower().split('key.matches')[1].split(')')[0]
assert "hasAll(['key','total','alloc'])" in block and "hasOnly(['key','total','alloc','fixed'])" in block
assert "(!('fixed' in r) || r.fixed is bool)" in block
assert "r.fixed is bool\n" not in block.replace("(!('fixed' in r) || r.fixed is bool)",'')
assert 'match /users/' not in block and 'allow write' not in block and 'allow update' not in block
assert 'allow read, write: if request.auth != null && request.auth.uid == uid' in users
assert 'allow list: if false' in rules
# still only inbox create; cannot update the share doc or owner state from this rule
assert 'allow update' not in block
print('test_v140_rules OK')
