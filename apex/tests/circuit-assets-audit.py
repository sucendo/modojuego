#!/usr/bin/env python3
"""Offline source-data audit of all 23 embedded SVG/JSON pairs + Madrid override.
Checks assets, not DOM loading, physics, WebGL errors or rendered pixels.
Run: python apex/tests/circuit-assets-audit.py [--json]
"""
import base64, collections, json, math, pathlib, re, subprocess, sys, xml.etree.ElementTree as ET
ROOT = pathlib.Path(__file__).resolve().parents[2]
SOURCE = ''.join(p.read_text() for p in sorted((ROOT / 'apex/parts').glob('part-*.txt')))
def declaration(name, source=SOURCE):
    match = re.search(r'\b' + re.escape(name) + r'\s*=\s*', source)
    if not match:
        raise ValueError('Missing ' + name)
    return json.JSONDecoder().raw_decode(source[match.end():])[0]
SVGS = declaration('APEX_BASE_EMBEDDED_SVG_B64')
CONFIGS = declaration('APEX_BASE_CIRCUIT_JSON_BY_ID')
NUM = r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
def finite_tree(value):
    if isinstance(value, (float, int)) and not isinstance(value, bool):
        return math.isfinite(value)
    if isinstance(value, dict):
        return all(finite_tree(v) for v in value.values())
    if isinstance(value, list):
        return all(finite_tree(v) for v in value)
    return True

def audit(circuit_id, svg, config, kind):
    checks, warnings, details = [], [], {}
    def check(label, condition):
        checks.append({'check': label, 'ok': bool(condition)})
    check('JSON numbers finite', finite_tree(config))
    root = ET.fromstring(svg)
    check('XML SVG root', root.tag.split('}')[-1] == 'svg')
    active = []
    def walk(el, library=False):
        library = library or el.get('data-apex-library-zone') == '1' or el.get('id') == 'APEX_ELEMENT_LIBRARY_ZONE' or el.get('id') == 'APEX_ELEMENT_LIBRARY'
        if not library and el.tag.split('}')[-1] not in ('defs', 'style'):
            active.append(el)
        for child in el:
            walk(child, library)
    walk(root)
    roles = collections.Counter(el.get('data-apex-role') for el in active if el.get('data-apex-role'))
    center = next((el for el in active if el.get('data-apex-role') == 'track-centerline'), None)
    check('Authoritative centerline', center is not None)
    if center is not None:
        d = center.get('d', '')
        commands = re.findall('[a-df-zA-DF-Z]', d)
        # These 23 bases use exact M/L paths; do not approximate unsupported curves.
        linear = all(command in 'MmLlZz' for command in commands)
        check('Supported exact source polyline', linear)
        coordinates = [float(n) for n in re.findall(NUM, d or center.get('points', ''))]
        check('Finite centerline vertices', len(coordinates) >= 40 and len(coordinates) % 2 == 0 and all(math.isfinite(n) for n in coordinates))
        pts = list(zip(coordinates[::2], coordinates[1::2]))
        spans = [math.dist(a, b) for a, b in zip(pts, pts[1:])]
        check('Nondegenerate source track', sum(spans) > 1)
        check('Closed lap continuity', math.dist(pts[0], pts[-1]) <= max(spans) * 3 + .02)
        details['sourceVertices'] = len(pts)
    length = config.get('track', {}).get('lengthMeters', 0)
    check('Positive track length', length > 100)
    vertical = config.get('verticalProfile', {}).get('samples', [])
    check('Elevation samples finite and ordered', len(vertical) >= 2 and all(len(p) >= 2 and math.isfinite(p[1]) for p in vertical) and all(a[0] <= b[0] for a, b in zip(vertical, vertical[1:])))
    step = max((b[0] - a[0] for a, b in zip(vertical, vertical[1:])), default=0)
    check('Elevation covers periodic lap', bool(vertical) and abs(vertical[0][0]) < .001 and 0 <= 1 - vertical[-1][0] <= max(.001, step * 1.1))
    banking = config.get('banking', {}).get('corners', [])
    bank_config = config.get('banking', {})
    check('Banking data finite', (bool(banking) or bank_config.get('mode') == 'MODEL_CAP' and math.isfinite(bank_config.get('maxBankDeg', float('nan')))) and all(math.isfinite(c.get('bankDeg', 0)) and abs(c.get('bankDeg', 0)) < 60 for c in banking))
    timing = config.get('timing', {})
    check('Start/finish within lap', all(isinstance(timing.get(k), (int, float)) and 0 <= timing[k] <= length for k in ['startS', 'finishS']))
    check('SVG start/finish', roles['start-line'] and roles['finish-line'])
    sectors = timing.get('sectors', [])
    check('Three JSON sectors', len(sectors) == 3)
    check('Continuous sector intervals', len(sectors) == 3 and abs(sectors[0]['from']) < 1e-6 and abs(sectors[-1]['to'] - 1) < 1e-6 and all(abs(a['to'] - b['from']) < 1e-6 for a, b in zip(sectors, sectors[1:])))
    check('Authored kerbs', roles['curb-left'] + roles['curb-right'] > 0)
    if not sum(n for role, n in roles.items() if role.startswith('runoff-')):
        warnings.append('No explicit runoff: procedural/runtime geometry requires browser validation.')
    check('Authored pit lane', roles['pitlane-centerline'] > 0)
    if not roles['wall-left'] + roles['wall-right']:
        warnings.append('No explicit walls: procedural/runtime geometry requires browser validation.')
    details.update({'elevationSamples': len(vertical), 'bankingCorners': len(banking), 'kerbRuns': roles['curb-left'] + roles['curb-right'],
                    'runoffObjects': sum(n for role, n in roles.items() if role.startswith('runoff-')), 'pitObjects': roles['pit-building'],
                    'tunnels': roles['tunnel'], 'bridges': roles['bridge'], 'activeSvgObjects': len(active)})
    if not roles['pit-building']:
        warnings.append('No explicit pit building: procedural/runtime representation requires browser validation.')
    return {'id': circuit_id, 'kind': kind, 'ok': all(c['ok'] for c in checks), 'checks': checks, 'warnings': warnings, 'details': details}

BASE_REF = 'ef8ce60249ccfef28d97d16650bf6e94eaa62b01'
baseline = ''.join(subprocess.check_output(['git', 'show', f'{BASE_REF}:apex/parts/part-{i:03}.txt'], cwd=ROOT).decode('utf-8') for i in range(28))
assert SVGS == declaration('APEX_BASE_EMBEDDED_SVG_B64', baseline), 'Base SVG changed'
assert CONFIGS == declaration('APEX_BASE_CIRCUIT_JSON_BY_ID', baseline), 'Base JSON changed'
assert (ROOT / 'apex/circuits/svg/apex26_14-madrid-spain.svg').read_bytes() == subprocess.check_output(['git', 'show', f'{BASE_REF}:apex/circuits/svg/apex26_14-madrid-spain.svg'], cwd=ROOT), 'Madrid override changed'

rows = []
assert len(SVGS) == len(CONFIGS) == 23
for key, encoded in SVGS.items():
    rows.append(audit(key, base64.b64decode(encoded).decode('utf-8'), CONFIGS[key], 'embedded-base'))
rows.append(audit('14-spain', (ROOT / 'apex/circuits/svg/apex26_14-madrid-spain.svg').read_text(), CONFIGS['14-spain'], 'repository-override'))
result = {'scope': 'OFFLINE_SVG_JSON_ASSETS_ONLY', 'baseCircuits': 23, 'assetsUnchangedSince': BASE_REF, 'assets': len(rows), 'ok': all(r['ok'] for r in rows),
          'notTested': ['DOM/runtime loading', 'rendered geometry/pixels', 'WebGL errors', 'grid placement', 'physics/timing execution', 'save/restore', 'Android'], 'rows': rows}
if '--json' in sys.argv:
    print(json.dumps(result, ensure_ascii=False, indent=2))
else:
    for row in rows:
        failed = [c['check'] for c in row['checks'] if not c['ok']]
        print(('PASS' if row['ok'] else 'FAIL'), row['id'], row['kind'], json.dumps(row['details'], ensure_ascii=False), '; '.join(failed))
    print('Offline asset audit:', 'PASS' if result['ok'] else 'FAIL', '— runtime/visual/driver checks remain separate.')
sys.exit(0 if result['ok'] else 1)
