"""Builds fixture_real.json: MADE-UP data shaped like a real year of use (deterministic)."""
import json,random
random.seed(7)
cats=["🛒 Comida/Supermercado","🍽️ Restaurantes","⛽ Gasolina","🚗 Transporte","⚖️ Casa","📡 Comunicaciones","🏥 Médico","👕 Ropa","🎬 Entretenimiento","📺 Suscripciones","💸 Envíos a familia","🐶 Mascotas","📈 Kalshi","🤝 Tony","📦 Otros"]
inc=["💼 Cheque","💵 Propinas","💳 Reembolso en efectivo","🎁 Regalo","↩️ Reembolso","🧾 Venta","📈 Kalshi","📦 Otros"]
cards=["BOA 1","BOA 2","Chase","Amazon","Capital One","Affirm"]
stores=["Walmart","Publix","Aldi","Sam's Club","Costco"]
bills=[("Rent House",900,True),("Car Insurance",120,True),("Car Letter",310,True),("Phone",80,True),("Internet",60,True),("Gas",0,False),("Water",0,False),("Electricity",0,False)]
st={"people":["Yo","Tony","Carlos"],"stores":stores,"recipients":["Mamá","Tía Rosa"],"cats":cats,"incCats":inc,"catsV2":1,"budgets":{"⛽ Gasolina":160,"⚖️ Casa":950,"🍽️ Restaurantes":120,"🐶 Mascotas":40},
 "cardDue":{"BOA 1":12,"Chase":20},"goals":[{"id":"g1","name":"Viaje","target":1500,"bal":200}],"checks":[],"months":{},"updatedAt":1,"storeMem":{"walmart":{"name":"Walmart","method":"card:Chase"}}}
ms=[f"2026-{m:02d}" for m in range(1,11)]
uid=0
def U():
    global uid;uid+=1;return f"x{uid}"
for mi,k in enumerate(ms):
    last=k==ms[-1]
    m={"income":[{"id":"d","name":"Débito","amount":round(random.uniform(200,2500),2),"role":"debit"},{"id":"ef","name":"Efectivo","amount":round(random.uniform(0,150),2)}],
       "cards":[{"id":"c"+str(i),"name":c,"amount":round(random.uniform(0,600),2) if random.random()>.3 else 0} for i,c in enumerate(cards)],
       "bills":[{"id":"b"+str(i),"name":n,"amount":(a or round(random.uniform(30,140),2)),"fixed":f,**({"cat":"⚖️ Casa"} if n=="Water" else {}),**({"paid":round(a*0.5,2)} if (not last and n=="Rent House" and mi%3==0) else {})} for i,(n,a,f) in enumerate(bills)],
       "purchases":[],"personal":[],"events":[]}
    if mi<3: m["tonyBase"]=100;m["carlosBase"]=10
    for j in range(random.randint(3,7)):
        t=round(random.uniform(40,260),2);tn=round(t*.5,2);cr=round(t*.25,2)
        m["purchases"].append({"id":U(),"store":random.choice(stores),"date":f"{k}-{random.randint(1,28):02d}","total":t,"mode":"fam","shares":{"Tony":tn,"Carlos":cr,"Yo":round(t-tn-cr,2)},"method":random.choice(["deb","card:Chase","card:BOA 1",""])})
    for j in range(random.randint(6,14)):
        c=random.choice([x for x in cats if x!="🤝 Tony"]);e={"id":U(),"date":f"{k}-{random.randint(1,28):02d}","amount":round(random.uniform(3,120),2),"cat":c,"desc":random.choice(["","Shell","Uber","Taco place","Netflix"]),"method":random.choice(["deb","money:Efectivo","card:Amazon","card:Chase"])}
        if c=="💸 Envíos a familia": e["recipient"]=random.choice(["Mamá","Tía Rosa"])
        if random.random()<.1: del e["cat"]
        m["personal"].append(e)
    for wk in range(4):
        d=f"{k}-{1+wk*7:02d}";a=round(random.uniform(650,780),2);cid=U()
        st["checks"].append({"id":cid,"amount":a,"date":d,"status":"deposited","depositedOn":d,**({"auto":True} if wk%2 else {})})
        m["events"].append({"id":U(),"type":"check","date":d,"amount":a,"checkId":cid})
    m["events"]+= [{"id":U(),"type":"income","date":f"{k}-05","amount":round(random.uniform(10,60),2),"concept":"💵 Propinas","desc":"Propinas","method":"deb"},
      {"id":U(),"type":"income","date":f"{k}-06","amount":round(random.uniform(0.5,9),2),"concept":"💳 Reembolso en efectivo","desc":"Reembolso en efectivo","method":"deb","card":random.choice(cards)},
      {"id":U(),"type":"income","date":f"{k}-07","amount":25,"concept":"🧾 Venta","desc":"Venta","method":"money:Efectivo"},
      {"id":U(),"type":"cardpay","date":f"{k}-10","amount":100,"desc":"Pago Chase","cardId":"c2","cardMonth":k},
      {"id":U(),"type":"todebit","date":f"{k}-11","amount":20,"desc":"Transferencia a débito (Efectivo)","lineId":"ef","lineMonth":k},
      {"id":U(),"type":"adjust","date":f"{k}-12","lineKind":"income","lineId":"d","lineName":"Débito","month":k,"from":0,"to":5,"diff":5,"note":""}]
    if not last and mi!=4: m["events"].append({"id":U(),"type":"tony","date":f"{k}-25","amount":round(random.uniform(500,1200),2)})
    if not last and mi%2==0: m["events"].append({"id":U(),"type":"carlos","date":f"{k}-26","amount":round(random.uniform(20,80),2)})
    if mi==2: m["events"].append({"id":U(),"type":"income","date":f"{k}-09","amount":12.5,"concept":"📈 Kalshi","desc":"Kalshi","method":"deb"})
    st["months"][k]=m
st["cur"]=ms[-1]
st["checks"].append({"id":"pend1","amount":735,"date":"2026-10-15","status":"pending"})
json.dump(st,open("fixture_real.json","w"),ensure_ascii=False)
print(len(ms),"months",sum(len(m["personal"])+len(m["purchases"])+len(m["events"]) for m in st["months"].values()),"records")
