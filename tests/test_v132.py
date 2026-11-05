"""v132 (datos inventados): nombre en vez de (compartida) si gastó una sola persona; «Para:» en ítems de envíos."""
import os,copy,json
from harness import app,FIX
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots')
S=copy.deepcopy(FIX);S['cur']='2026-11';S['recipients']=['Mamá','Abuela']
S['months']['2026-11']={'income':[{'id':'i1','name':'Débito','amount':900,'role':'debit'}],'cards':copy.deepcopy(S['months']['2026-10'].get('cards') or []),'bills':[],'personal':[],
 'purchases':[
  {'id':'p1','store':'Publix','date':'2026-11-04','total':3.99,'mode':'manual','shares':{'Tony':3.99,'Carlos':0,'Yo':0},'method':'deb'},
  {'id':'p2','store':'Aldi','date':'2026-11-04','total':78.93,'mode':'fam','shares':{'Tony':39.47,'Carlos':19.73,'Yo':19.73},'method':'deb'},
  {'id':'p3','store':'Walmart','date':'2026-11-04','total':60,'mode':'fam','shares':{'Tony':15,'Carlos':7.5,'Yo':37.5},'method':'deb',
   'list':[{'a':30,'n':'Recarga','c':'💸 Envíos a familia','own':['Yo']}]}]}
with app(ROOT,now='2026-11-05T10:00:00',state=S,new_look=True) as pg:
    E=pg.evaluate;pg.wait_for_timeout(600);assert E('CODE_V')=='v132'
    d={x['id']:x['desc'] for x in E("moves(S.months['2026-11'])") if x.get('kind')=='compra'};print(d)
    assert d['p1']=='Publix (Tony)' and 'compartida' in d['p2'],d
    E("()=>{tab='mov';render()}");pg.wait_for_timeout(300)
    loc=pg.get_by_text('Publix (Tony)').first
    print('found',pg.get_by_text('Publix (Tony)').count())
    if pg.get_by_text('Publix (Tony)').count():loc.scroll_into_view_if_needed();E("scrollBy(0,120)")
    pg.screenshot(path=os.path.join(SH,'v132-movimientos.png'))
    E("editP('p3')");pg.wait_for_timeout(300)
    assert pg.locator('#dlg select[data-para]').count()==1
    pg.locator('#dlg select[data-para]').select_option('Mamá');pg.wait_for_timeout(100)
    E("document.querySelector('#dlg .itpara').scrollIntoView({block:'center'})");pg.wait_for_timeout(150)
    pg.screenshot(path=os.path.join(SH,'v132-envio-para.png'))
    E("saveP()");pg.wait_for_timeout(300)
    p=E("S.months['2026-11'].purchases.find(x=>x.id==='p3')");assert p['list'][0]['para']=='Mamá',p
    rows=E("xTable('2026-11').rows.map(r=>[r.n,r.m])");print(rows);assert ['Mamá',30] in rows,rows
    E("()=>{tab='rep';render()}");pg.wait_for_timeout(300)
    c=pg.locator('#xpcard')
    if not c.locator('.xpr').first.is_visible():c.locator('h2').click();pg.wait_for_timeout(200)
    pg.locator('#xpr-0 summary').click();pg.wait_for_timeout(150)
    E("document.getElementById('xpcard').scrollIntoView({block:'start'});scrollBy(0,-70)");pg.wait_for_timeout(200)
    pg.screenshot(path=os.path.join(SH,'v132-envios-reporte.png'))
print('OK')
