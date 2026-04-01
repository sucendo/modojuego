#!/usr/bin/env python3
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "chatmubot" / "chatbotrespuestas.original.json"
DST = ROOT / "data" / "chatmubot" / "chatbotrespuestas.json"

def merge_values(old, new):
    if isinstance(old, list) and isinstance(new, list):
        merged, seen = [], set()
        for item in old + new:
            key = json.dumps(item, ensure_ascii=False, sort_keys=True)
            if key not in seen:
                merged.append(item)
                seen.add(key)
        return merged
    if isinstance(old, dict) and isinstance(new, dict):
        out = dict(old)
        for k, v in new.items():
            out[k] = merge_values(out[k], v) if k in out else v
        return out
    return new

def merge_object_pairs(pairs):
    out = {}
    for k, v in pairs:
        out[k] = merge_values(out[k], v) if k in out else v
    return out

stop = {"el","la","los","las","un","una","unos","unas","de","del","al","y","o","a","que","como","con","por","para","tu","tú","mi","me","te","se","ya","mas","más","aun","aún","eso","este","esta","ese","esa","seria","sería"}
def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[\W_]+", " ", str(s).lower())).strip()

def extract_keywords(resp):
    tokens = [t for t in norm(resp).split() if len(t) > 3 and t not in stop]
    seen = []
    for tok in tokens:
        if tok not in seen:
            seen.append(tok)
    return seen[:2] or tokens[:1]

raw = SRC.read_text(encoding="utf-8")
data = json.loads(raw, object_pairs_hook=merge_object_pairs)

if isinstance(data.get("duelo"), list):
    for item in data["duelo"]:
        if isinstance(item, dict) and item.get("respuesta") and "palabrasClave" not in item:
            item["palabrasClave"] = extract_keywords(item["respuesta"])

data["_meta"] = {
    "project": "ChatmuBot",
    "version": "3.0.0",
    "source": "chatbotrespuestas.original.json",
    "notes": [
        "Runtime dataset normalizado a partir del archivo original.",
        "Las claves duplicadas del JSON original se fusionan cuando es posible.",
        "Las entradas del duelo se enriquecen con palabrasClave para validar mejor las réplicas."
    ]
}

DST.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Generado: {DST}")
