#!/usr/bin/env python3
"""Clip public-domain orientation outlines; never infer ancient political borders."""
import json,math
from pathlib import Path
import argparse
parser=argparse.ArgumentParser(description='Prepare the local Natural Earth outlines used by the geography explorer.')
parser.add_argument('--source-dir',type=Path,required=True,help='Directory containing the three original Natural Earth GeoJSON datasets listed in research/geography-explorer-findings.json')
src=parser.parse_args().source_dir
root=Path(__file__).resolve().parents[1]
def clip(ring,axis,value,greater):
 out=[]
 if not ring:return out
 prev=ring[-1];pin=prev[axis]>=value if greater else prev[axis]<=value
 for cur in ring:
  inside=cur[axis]>=value if greater else cur[axis]<=value
  if inside!=pin:
   t=(value-prev[axis])/(cur[axis]-prev[axis]);out.append([prev[0]+t*(cur[0]-prev[0]),prev[1]+t*(cur[1]-prev[1])])
  if inside:out.append(cur)
  prev,pin=cur,inside
 return out

def rings(g):
 ps=[g['coordinates']] if g['type']=='Polygon' else g['coordinates']
 return [p[0] for p in ps] # Exterior outlines only; no lakes in this orientation layer.
def simplify(points,tolerance):
 if len(points)<3:return points
 a,b=points[0],points[-1];dx=b[0]-a[0];dy=b[1]-a[1];length=dx*dx+dy*dy
 def distance(p):
  t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)) if length else 0
  return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
 distances=[distance(p) for p in points[1:-1]];maximum=max(distances,default=0)
 if maximum<=tolerance:return [a,b]
 index=distances.index(maximum)+1
 return simplify(points[:index+1],tolerance)[:-1]+simplify(points[index:],tolerance)

def clean(rs,tolerance=.025):
 result=[]
 for r in rs:
  for a,v,c in [(0,5,True),(0,80,False),(1,8,True),(1,49,False)]:r=clip(r,a,v,c)
  if len(r)<4:continue
  r=simplify(r,tolerance)
  r=[[round(x,4),round(y,4)] for x,y in r]
  if r[0]!=r[-1]:r.append(r[0])
  if abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(r,r[1:])))>0.00001:result.append(r)
 return result
countries={}
for f in json.loads((src/'ne_50m_admin_0_countries.geojson').read_text())['features']:
 r=clean(rings(f['geometry']))
 if r:countries[f['properties']['ADM0_A3']]={'name':f['properties']['ADMIN'],'rings':r}
regions={}
for f in [f for f in json.loads((src/'ne_10m_admin_1_states_provinces.geojson').read_text())['features'] if f['properties'].get('admin')=='Greece']:
 regions[f['properties']['name']]={'name':f['properties'].get('name_en') or f['properties']['name'],'rings':clean(rings(f['geometry']),.001)}
it=countries['ITA']['rings'];tr=countries['TUR']['rings']
shapes={
 'attica':regions['Attiki']['rings'],
 'sicily':[r for r in it if min(x for x,y in r)>12 and max(x for x,y in r)<16 and min(y for x,y in r)>36 and max(y for x,y in r)<38.5],
 'anatolia':[max(tr,key=len)],
 'egypt':countries['EGY']['rings'],
 'levant':sum([countries[k]['rings'] for k in ['SYR','LBN','ISR','PSX','JOR']],[]),
 'babylonia':[r for ring in countries['IRQ']['rings'] if len(r:=clip(ring,1,33.5,False))>3],
 'east':countries['IRN']['rings']+countries['AFG']['rings'],
 'arabia':sum([countries[k]['rings'] for k in ['SAU','YEM','OMN','ARE','QAT','KWT','BHR']],[])
}
riverlines=[]
for f in json.loads((src/'ne_50m_rivers_lake_centerlines.geojson').read_text())['features']:
 if f['properties'].get('name') in ['Nile','Damietta Branch','Rosetta Branch','Tigris','Euphrates']:
  g=f['geometry'];ls=[g['coordinates']] if g['type']=='LineString' else g['coordinates']
  riverlines.append({'name':f['properties']['name'],'lines':[[[round(x,4),round(y,4)] for x,y in simplify(line,.012)] for line in ls]})
obj={'rivers':riverlines,'provider':'Natural Earth','license':'Public domain','licenseUrl':'https://www.naturalearthdata.com/about/terms-of-use/','countries':countries,'greekRegions':regions,'shapes':shapes}
(root/'src/geography.json').write_text(json.dumps(obj,separators=(',',':'),ensure_ascii=False)+'\n')
print('Prepared geographic outlines:',len(countries),'countries,',len(regions),'Greek regions;',(root/'src/geography.json').stat().st_size,'bytes')
