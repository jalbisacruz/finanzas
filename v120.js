// v120: los PDF de Tony y Carlos terminan con «Detalle de compras compartidas»: cada compra compartida en la que participa
// (fecha · tienda, quién pagó, artículos con la parte de cada uno, impuesto, total), igual que el detalle que ve Joe.
// Solo compras con 2+ personas donde está esa persona (R.det ya viene filtrado por r3Vis); nada personal de Joe.
pdfTony=k=>{const R=r3Data(k,'Tony');return rep3PDF(R,o=>r3DetInto(o,R))};
pdfCarlos=k=>{const R=r3Data(k,'Carlos');return rep3PDF(R,o=>r3DetInto(o,R))};
