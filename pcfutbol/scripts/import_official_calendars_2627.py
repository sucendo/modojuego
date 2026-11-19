#!/usr/bin/env python3
"""Rebuild the 2026/27 league fixtures from published schedules.

Requires curl, pdftotext, pdfplumber and Node.js. Results/scores are never imported.
Run from any directory: python pcfutbol/scripts/import_official_calendars_2627.py
Only validated, complete double round-robins can be exported.
"""

import collections
import datetime as dt
import difflib
import json
import os
import re
import subprocess
import tempfile
import unicodedata
from pathlib import Path
from zoneinfo import ZoneInfo

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'js/game/officialFixtures2026.js'

SOURCES = {
    'league_de_bundesliga': ('openfootball', 'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/de.1.json', 'Europe/Berlin'),
    'league_en_premier': ('openfootball', 'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/en.1.json', 'Europe/London'),
    'league_en_championship': ('openfootball', 'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/en.2.json', 'Europe/London'),
    'league_es_primera': ('openfootball', 'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/es.1.json', 'Europe/Madrid'),
    'league_fr_ligue1': ('openfootball', 'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/fr.1.json', 'Europe/Paris'),
    'league_it_seriea': ('openfootball', 'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/it.1.json', 'Europe/Rome'),
    'league_nl_eredivisie': ('openfootball', 'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/nl.1.json', 'Europe/Amsterdam'),
    'league_pt_primeira': ('openfootball', 'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/pt.1.json', 'Europe/Lisbon'),
    'league_de_zweite': ('openligadb', 'https://api.openligadb.de/getmatchdata/bl2/2026', 'UTC'),
    'league_fr_ligue2': ('fixturedownload', 'https://fixturedownload.com/feed/json/ligue-2-2026', 'UTC'),
    'league_es_segunda': ('rfef', 'https://rfef.es/sites/default/files/2026-06/Campeonato_de_Segunda_Division.pdf', 'Europe/Madrid'),
    'league_it_serieb': ('legab', 'https://uscremonese.it/wp-content/uploads/2026/07/Calendari-1.pdf', 'Europe/Rome'),
    'league_pt_segunda': ('ligaportugal', 'https://www.ligaportugal.pt/backoffice/assets/LP_Meu_Super2026_27_6dcb8a64f7.pdf', 'Europe/Lisbon'),
    'league_nl_eerste': ('knvb', 'https://www.knvb.nl/downloads/bestand/30063/definitiefcompetitieprogrammakeukenkampioendivisie', 'Europe/Amsterdam'),
}

# Naming variants in published calendars, keyed by league and source team name.
# Only explicitly reviewed aliases are used: no fuzzy assignments of football clubs.
ALIASES = {
    'league_nl_eerste': {'Roda JC': 'roda'},
    'league_pt_segunda': {'A. Académica': 'academica', 'Amarante F. C.': 'amarante',
        'L. Lourosa FC': 'lourosa', 'U. Leiria': 'uniao_leiria'},
    'league_es_segunda': {'RC Celta Fortuna': 'celta_fortuna',
        'Real Sociedad de Fútbol "B"': 'realsociedad_b'},
    'league_fr_ligue2': {'Clermont Foot 63': 'clermont', 'EN Avant Guingamp': 'guingamp',
        'FC Sochaux-Montbéliard': 'sochaux', 'Montpellier Hérault SC': 'montpellier',
        'Rodez Aveyron Football': 'rodez', 'Stade Lavallois MFC': 'laval',
        'US Boulogne CO': 'boulogne'},
    'league_de_zweite': {'1. FC Heidenheim 1846': 'heidenheim',
        'DSC Arminia Bielefeld': 'bielefeld', 'SpVgg Greuther Fürth': 'greutherfurth'},
    'league_pt_primeira': {'CD Santa Clara': 'santaclara', 'CF Estrela da Amadora': 'estrela',
        'Sport Lisboa e Benfica': 'benfica', 'Sporting Clube de Braga': 'braga',
        'Sporting Clube de Portugal': 'sportingcp', 'Vitória Guimarães': 'guimaraes'},
    'league_nl_eredivisie': {"FC Twente '65": 'twente', 'Feyenoord Rotterdam': 'feyenoord',
        'SBV Excelsior': 'excelsior', 'SC Cambuur-Leeuwarden': 'cambuur',
        'Telstar 1963': 'telstar', 'Willem II Tilburg': 'willemii'},
    'league_it_seriea': {'AC Monza': 'monza', 'ACF Fiorentina': 'fiorentina',
        'Atalanta BC': 'atalanta', 'Bologna FC 1909': 'bologna',
        'Cagliari Calcio': 'cagliari', 'FC Internazionale Milano': 'inter',
        'Frosinone Calcio': 'frosinone', 'Genoa CFC': 'genoa',
        'Parma Calcio 1913': 'parma', 'SS Lazio': 'lazio',
        'SSC Napoli': 'napoli', 'US Lecce': 'lecce',
        'US Sassuolo Calcio': 'sassuolo', 'Udinese Calcio': 'udinese'},
    'league_fr_ligue1': {'ES Troyes AC': 'troyes', 'RC Strasbourg Alsace': 'strasbourg',
        'Racing Club de Lens': 'lens', 'Stade Brestois 29': 'brest',
        'Stade Rennais FC 1901': 'rennes'},
    'league_es_primera': {'Club Atlético de Madrid': 'atletico', 'RC Celta de Vigo': 'celta',
        'RC Deportivo La Coruña': 'deportivo', 'RCD Espanyol de Barcelona': 'espanyol',
        'Rayo Vallecano de Madrid': 'rayo', 'Real Betis Balompié': 'betis',
        'Real Racing Club de Santander': 'racing_santander', 'Real Sociedad de Fútbol': 'realsociedad'},
    'league_de_bundesliga': {'1. FC Union Berlin': 'unionberlin', '1. FSV Mainz 05': 'mainz',
        'Bayer 04 Leverkusen': 'leverkusen', 'FC Bayern München': 'bayern',
        'FC Schalke 04': 'schalke', 'SV 07 Elversberg': 'elversberg',
        'SV Werder Bremen': 'werder', 'TSG 1899 Hoffenheim': 'hoffenheim'},
}

ROUND_DATE_LEAGUES = {'league_es_segunda', 'league_it_serieb', 'league_pt_segunda'}


def fetch(url, dest):
    subprocess.run(['curl', '-fLsS', '--retry', '2', '--max-time', '45', url, '-o', str(dest)], check=True)


def fixture(round_no, home, away, date, time=None):
    return (int(round_no), str(home).strip(), str(away).strip(), str(date).strip(), time)


def from_openfootball(path):
    data = json.loads(path.read_text())
    return [fixture(re.search(r'(\d+)$', m['round']).group(1), m['team1'], m['team2'], m['date'], m.get('time'))
            for m in data['matches']]


def from_openligadb(path):
    data = json.loads(path.read_text())
    return [fixture(m['group']['groupOrderID'], m['team1']['teamName'], m['team2']['teamName'],
                    m['matchDateTimeUTC'][:10], m['matchDateTimeUTC'][11:16])
            for m in data]


def from_fixturedownload(path):
    data = json.loads(path.read_text())
    return [fixture(m['RoundNumber'], m['HomeTeam'], m['AwayTeam'], m['DateUtc'][:10], m['DateUtc'][11:16])
            for m in data]


def from_rfef(path):
    text = subprocess.check_output(['pdftotext', '-layout', str(path), '-'], text=True)
    matches = []
    round_no, date = None, None
    for line in text.splitlines():
        heading = re.search(r'Jornada\s+(\d+)\s+\((\d{2})/(\d{2})/(\d{4})\)', line)
        if heading:
            round_no = int(heading[1])
            date = f'{heading[4]}-{heading[3]}-{heading[2]}'
            continue
        if round_no and re.match(r'^\s{2,}\S', line):
            names = re.split(r'\s{3,}', line.strip())
            if len(names) == 2 and not names[0].startswith('Real Federación'):
                matches.append(fixture(round_no, *names, date))
    return matches


def from_legab(path):
    # Official PDF prints 4 or 5 matchday columns per horizontal strip.
    # Read PDF word coordinates so long club names never cross columns.
    months = {'GEN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAG': 5, 'GIU': 6,
              'LUG': 7, 'AGO': 8, 'SET': 9, 'OTT': 10, 'NOV': 11, 'DIC': 12}
    matches = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            words = page.extract_words()
            headings = sorted((w for w in words if re.fullmatch(r'\d+ª', w['text'])), key=lambda w: w['top'])
            strip_tops = sorted({round(w['top']) for w in headings})
            for strip_idx, y in enumerate(strip_tops):
                y_end = strip_tops[strip_idx + 1] if strip_idx + 1 < len(strip_tops) else page.height
                strip_headings = sorted((w for w in headings if abs(w['top'] - y) < 2), key=lambda w: w['x0'])
                for heading in strip_headings:
                    md = int(heading['text'][:-1])
                    head_right = [w for w in words if abs(w['top'] - heading['top']) < 2 and
                                  heading['x0'] < w['x0'] < heading['x0'] + 110]
                    date_words = [w['text'] for w in sorted(head_right, key=lambda w: w['x0'])]
                    date_text = ' '.join(date_words)
                    date_match = re.search(r'(\d{1,2})\s+([A-Z]{3})\s+(202[67])', date_text)
                    if not date_match:
                        raise ValueError(f'Serie B round {md}: missing date: {date_text}')
                    date = f'{date_match[3]}-{months[date_match[2]]:02d}-{int(date_match[1]):02d}'
                    sep_x = heading['x0'] + (54 if len(strip_headings) == 5 else 54)
                    # Fixed columns have widths ~161pt; hyphens align at one x coordinate.
                    hyphens = [w for w in words if w['text'] == '-' and y + 10 < w['top'] < y_end - 2
                               and abs(w['x0'] - sep_x) < 22]
                    for sep in hyphens:
                        line = [w for w in words if abs(w['top'] - sep['top']) < 2]
                        left = ' '.join(w['text'] for w in sorted(line, key=lambda w: w['x0'])
                                        if sep['x0'] - 85 < w['x0'] < sep['x0'] - 1)
                        right = ' '.join(w['text'] for w in sorted(line, key=lambda w: w['x0'])
                                         if sep['x0'] + 3 < w['x0'] < sep['x0'] + 78)
                        matches.append(fixture(md, left, right, date))
    return matches


def from_ligaportugal(path):
    matches = []
    dates = {}
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            headers = sorted({round(w['top']) for w in page.extract_words() if w['text'] == 'Jornada'})
            # Every column shows one first-leg matchday and the corresponding return date.
            for i, y in enumerate(headers):
                if i % 2:
                    continue
                y_end = headers[i + 2] - 1 if i + 2 < len(headers) else page.height
                for col in range(5):
                    cropped = page.crop((160 * col + (15 if col else 0), y - 3,
                                         min(160 * (col + 1) + 15, page.width), y_end))
                    lines = [line.strip() for line in cropped.extract_text().splitlines()]
                    if len(lines) < 3:
                        continue
                    first = re.fullmatch(r'Jornada\s+(\d+):\s+(\d{2})/(\d{2})/(\d{4})', lines[0])
                    second = re.fullmatch(r'Jornada\s+(\d+):\s+(\d{2})/(\d{2})/(\d{4})', lines[1])
                    if not first or not second:
                        raise ValueError(f'Portugal header malformed: {lines[:2]}')
                    ida, vuelta = int(first[1]), int(second[1])
                    dates[ida] = f'{first[4]}-{first[3]}-{first[2]}'
                    dates[vuelta] = f'{second[4]}-{second[3]}-{second[2]}'
                    for line in lines[2:]:
                        pair = re.fullmatch(r'(.+?)\s+-\s+(.+)', line)
                        if pair:
                            matches.append(fixture(ida, pair[1], pair[2], dates[ida]))
                            matches.append(fixture(vuelta, pair[2], pair[1], dates[vuelta]))
    return matches


NL_MONTHS = dict(zip('januari februari maart april mei juni juli augustus september oktober november december'.split(), range(1, 13)))


def from_knvb(path):
    text = subprocess.check_output(['pdftotext', '-layout', str(path), '-'], text=True)
    matches = []
    pattern = re.compile(r'^\s*(\d+)\s+(?:maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\s+'
                         r'(\d{1,2})\s+([a-z]+)\s+(202[67])\s{2,}(.+?)\s{2,}(.+?)\s{2,}(\d{2}:\d{2})\s*\**\s*$')
    for line in text.splitlines():
        m = pattern.match(line)
        if m:
            date = f'{m[4]}-{NL_MONTHS[m[3]]:02d}-{int(m[2]):02d}'
            matches.append(fixture(m[1], m[5], m[6], date, m[7]))
    return matches


PARSERS = {'openfootball': from_openfootball, 'openligadb': from_openligadb,
           'fixturedownload': from_fixturedownload, 'rfef': from_rfef,
           'legab': from_legab, 'ligaportugal': from_ligaportugal, 'knvb': from_knvb}


def normal(name):
    text = unicodedata.normalize('NFKD', name.lower())
    text = ''.join(c for c in text if not unicodedata.combining(c))
    value = re.sub(r'[^a-z0-9]+', ' ', text).strip()
    return re.sub(r' (?:fc|afc)$', '', value)


def load_clubs():
    cmd = ['node', '--input-type=module', '-e',
           "import {allLeagues} from './js/data.js'; console.log(JSON.stringify(allLeagues.map(l=>({id:l.id, clubs:l.clubs.map(c=>({id:c.id,name:c.name}))}))))"]
    return {l['id']: l['clubs'] for l in json.loads(subprocess.check_output(cmd, cwd=ROOT, text=True))}


def kickoff(date, time, tz):
    t = time if time and re.fullmatch(r'\d\d:\d\d', str(time)) else None
    d = dt.datetime.fromisoformat(f'{date}T{t or "12:00"}:00').replace(tzinfo=ZoneInfo(tz))
    return d.astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), t


def main():
    clubs = load_clubs()
    league_output = {}
    cache = os.getenv('PCF_OFFICIAL_CACHE_DIR')
    with tempfile.TemporaryDirectory(prefix='pcf-official-2627-') as folder:
        for league_id, (parser, url, timezone) in SOURCES.items():
            ext = 'pdf' if parser in ('rfef', 'legab', 'ligaportugal', 'knvb') else 'json'
            path = Path(cache) / f'{league_id}.{ext}' if cache else Path(folder) / f'source.{ext}'
            if not cache:
                fetch(url, path)
            raw = PARSERS[parser](path)
            club_list = clubs[league_id]
            club_index = {normal(c['name']): c['id'] for c in club_list}
            club_index.update({normal(c['id']): c['id'] for c in club_list})
            club_index.update({normal(a): club_id for a, club_id in ALIASES.get(league_id, {}).items()})
            unmatched = sorted({name for md, home, away, date, time in raw for name in (home, away)
                                if normal(name) not in club_index})
            if unmatched:
                suggestions = {name: difflib.get_close_matches(normal(name), list(club_index), n=2, cutoff=.38)
                               for name in unmatched}
                raise ValueError(f'{league_id} missing aliases ({len(raw)} matches): {suggestions}')
            rows = []
            for md, home, away, date, time in raw:
                instant, hhmm = kickoff(date, time, timezone)
                rows.append([md, club_index[normal(home)], club_index[normal(away)], instant, hhmm])
            validate(league_id, rows, club_list)
            rows.sort(key=lambda row: (row[0], row[3], row[1]))
            league_output[league_id] = rows
            print(f'{league_id}: {len(rows)} matches / {max(x[0] for x in rows)} rounds')

    comment = ('// Official 2026/27 HOME/AWAY pairings, imported and validated against published fixture lists.\n'
               '// Regenerate with: python pcfutbol/scripts/import_official_calendars_2627.py\n'
               '// Data is a snapshot: actual kickoff times can be rescheduled by each league.\n')
    content = comment + 'export const OFFICIAL_FIXTURES_2026 = ' + json.dumps(league_output, ensure_ascii=False, separators=(',', ':')) + ';\n'
    content += 'export const OFFICIAL_SOURCES_2026 = ' + json.dumps({k: v[1] for k, v in SOURCES.items()}, ensure_ascii=False, separators=(',', ':')) + ';\n'
    content += 'export const OFFICIAL_ROUND_ONLY_2026 = ' + json.dumps(sorted(ROUND_DATE_LEAGUES)) + ';\n'
    OUTPUT.write_text(content, encoding='utf-8')
    print('Wrote', OUTPUT, '(', len(content), 'characters)')


def validate(league, fixtures, clubs):
    ids = {c['id'] for c in clubs}
    n = len(ids)
    expected = n * (n - 1)
    if len(fixtures) != expected:
        raise ValueError(f'{league}: expected {expected} matches, got {len(fixtures)}')
    if max(row[0] for row in fixtures) != 2 * (n - 1):
        raise ValueError(f'{league}: wrong final matchday')
    rounds = collections.Counter(row[0] for row in fixtures)
    if set(rounds.values()) != {n // 2} or len(rounds) != 2 * (n - 1):
        raise ValueError(f'{league}: incomplete matchdays: {rounds}')
    pairs = collections.Counter((home, away) for md, home, away, date, time in fixtures)
    if set(pairs) != {(a, b) for a in ids for b in ids if a != b} or set(pairs.values()) != {1}:
        raise ValueError(f'{league}: duplicate, missing or unknown home-away pairings')
    for md in rounds:
        present = [club for r, home, away, date, time in fixtures if r == md for club in (home, away)]
        if set(present) != ids or len(present) != n:
            raise ValueError(f'{league}: a team appears twice or is missing in round {md}')


if __name__ == '__main__':
    main()
