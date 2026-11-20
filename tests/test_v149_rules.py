"""v149: Firestore rules allow a full Tony sheet (10–20 rows) without hitting the 1000-expression cap."""
import os,subprocess,time,sys,socket,json
from pathlib import Path
HERE=Path(__file__).resolve().parent
ROOT=HERE.parent
JAR=Path(os.path.expanduser('~/.cache/firebase/emulators/cloud-firestore-emulator-v1.22.0.jar'))
NODEDIR=Path('/tmp/rules-test')

def have_java():
    return subprocess.call(['bash','-lc','command -v java >/dev/null'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)==0

def port_open(p):
    s=socket.socket();s.settimeout(0.4)
    try:
        s.connect(('127.0.0.1',p));s.close();return True
    except Exception:
        return False

def main():
    if not have_java() or not JAR.exists():
        print('SKIP test_v149_rules (need Java + firestore emulator jar)')
        return
    started=False
    if not port_open(8080):
        log=open('/tmp/emu-v149.log','w')
        proc=subprocess.Popen(['java','-jar',str(JAR),'--host=127.0.0.1','--port=8080'],stdout=log,stderr=subprocess.STDOUT)
        started=True
        for _ in range(30):
            if port_open(8080):break
            time.sleep(0.5)
        else:
            proc.kill();raise SystemExit('emulator did not start')
    else:
        proc=None
    try:
        env=os.environ.copy()
        # ESM resolves packages from the script's directory, not cwd. Run a copy inside NODEDIR.
        cwd=NODEDIR if (NODEDIR/'node_modules').exists() else HERE
        script=HERE/'rules_v149.mjs'
        if cwd!=HERE:
            import shutil
            dest=NODEDIR/'rules_v149.mjs'
            shutil.copy(script,dest)
            script=dest
        r=subprocess.run(['node',str(script)],cwd=str(cwd),env=env,capture_output=True,text=True,timeout=90)
        sys.stdout.write(r.stdout)
        sys.stderr.write(r.stderr)
        if r.returncode!=0: raise SystemExit('rules_v149.mjs failed')
        if 'RESULT pass' not in r.stdout: raise SystemExit('no result line')
        print('test_v149_rules OK')
    finally:
        if started and proc and proc.poll() is None:
            proc.terminate()

if __name__=='__main__':
    main()
