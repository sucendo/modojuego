#!/usr/bin/env python3
"""Authored pit data coverage; not a clearance/driveability certification."""
import base64,json,math,pathlib,re,xml.etree.ElementTree as ET
root=pathlib.Path(__file__).resolve().parents[2]
s=''.join((root/f'apex/parts/part-{i:03}.txt').read_text() for i in range(28))
def declaration(name):
 m=re.search(r'\b'+name+r'\s*=\s*',s)
 return json.JSONDecoder().raw_decode(s[m.end():])[0]
configs=declaration('APEX_BASE_CIRCUIT_JSON_BY_ID');svgs=declaration('APEX_BASE_EMBEDDED_SVG_B64');rows=[]
for key,cfg in configs.items():
 p=cfg.get('pitLane',{});length=p.get('totalLengthM',0);slots=p.get('boxSlots',[]);connection=p.get('trackConnection',{});svg=ET.fromstring(base64.b64decode(svgs[key]))
 lanes=[n for n in svg.iter() if n.attrib.get('data-apex-role')=='pitlane-centerline']
 checks={'SVG_lane':bool(lanes),'profile':p.get('schema')=='APEX_PIT_LANE_V1','finite_length':isinstance(length,(int,float)) and math.isfinite(length) and length>25,'eleven_slots':len(slots)==11,
 'slots_inside_lane':all(isinstance(x.get('pitS'),(float,int)) and math.isfinite(x['pitS']) and 8<x['pitS']<length-8 for x in slots),
 'speed_limit':30<=p.get('speedLimit',{}).get('kph',0)<=120,'connection':all(isinstance(connection.get(x),(int,float)) and math.isfinite(connection[x]) for x in ['entryTrackS','exitTrackS','entryPitS','exitPitS'])}
 rows.append({'id':key,'ok':all(checks.values()),'checks':checks,'laneLengthM':length,'slots':len(slots),'geometryQuality':p.get('source',{}).get('geometryQuality','UNSPECIFIED'),'boxQuality':slots[0].get('status') if slots else 'MISSING'})
result={'ok':len(rows)==23 and all(x['ok'] for x in rows),'rows':rows,'limits':['Coordinates and box slots are inherited authored/model data, not surveyed measurements','No new geometry created','Runtime wall/building/drivable-area clearance and complete trajectories require browser tests']}
print(json.dumps(result,ensure_ascii=False,indent=2));assert result['ok']
