"""Compile the checked-in SVG contours to shared triangles; no runtime tracing.
Build-only dependency: shapely >= 2.1 (GEOS constrained Delaunay).
Usage: python3 apex/tools/compile-sponsor-vectors.py
"""
import json,re,xml.etree.ElementTree as ET
from pathlib import Path
from shapely import constrained_delaunay_triangles
from shapely.geometry import Polygon
root=Path(__file__).resolve().parents[1]
out={}
for name in ('team-equipalia','sct','mdtel'):
 tree=ET.parse(root/'assets/sponsors'/f'{name}.svg').getroot()
 w,h=map(float,(tree.get('width'),tree.get('height')));groups={}
 def walk(el,tx=0,ty=0):
  m=re.search(r'translate\(([-\d.]+)[ ,]+([-\d.]+)\)',el.get('transform',''))
  if m:tx+=float(m[1]);ty+=float(m[2])
  if el.tag.endswith('path'):
   rings=[]
   for ring in el.get('d').split('Z'):
    numbers=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',ring)))
    if len(numbers)>=6:rings.append([(numbers[i]+tx,numbers[i+1]+ty) for i in range(0,len(numbers),2)])
   if rings:
    # Evenodd SVG contours include disjoint glyphs and interior counters.
    poly=Polygon()
    for ring in rings:poly=poly.symmetric_difference(Polygon(ring).buffer(0))
    if not poly.is_valid:poly=poly.buffer(0)
    key=(el.get('fill'),el.get('data-detail')=='fine');tris=groups.setdefault(key,[])
    for tri in constrained_delaunay_triangles(poly).geoms:
     for x,y in list(tri.exterior.coords)[:3]:tris.extend([round(x/w,5),round(y/h,5)])
  for child in el:walk(child,tx,ty)
 walk(tree)
 out[name]={'aspect':round(w/h,6),'layers':[{'fill':fill,'fine':fine,'triangles':tris} for (fill,fine),tris in groups.items()]}
text='/* Generated from assets/sponsors/*.svg by tools/compile-sponsor-vectors.py. */\nwindow.ApexSponsorVectorData=Object.freeze('+json.dumps(out,separators=(',',':'))+');\n'
(root/'js/track-sponsor-vectors.js').write_text(text)
print({name:sum(len(g['triangles'])//6 for g in logo['layers']) for name,logo in out.items()})
