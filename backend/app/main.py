import os
import csv
import math
import time
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()

# # ---------- Optional Gemini SDK ----------
try:
    import google.generativeai as genai
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
except Exception as e:
    genai = None
    print("⚠️ Gemini SDK not available:", e)

# ---------- Local Imports ----------
from .rag_utils import get_top_k_chunks, build_retrieval_context
from .prompts import PLACE_SUMMARY_PROMPT  # your external prompt file

# ---------- Constants ----------
DATA_CSV = os.path.join(os.path.dirname(__file__), "..", "..", "data", "seed_places.csv")

app = FastAPI(title="PaleoGeology API")

# In-memory summary cache
_summary_cache: Dict[str, Dict[str, Any]] = {}


# ---------- Data Loading ----------
def load_places() -> List[Dict[str, Any]]:
    places = []
    with open(DATA_CSV, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            try:
                r['lat'] = float(r['lat'])
                r['lon'] = float(r['lon'])
            except Exception:
                r['lat'] = 0.0
                r['lon'] = 0.0
            places.append(r)
    return places

PLACES = load_places()


# ---------- Helpers ----------
def haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c


# ---------- Schemas ----------
class SearchResult(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    known_type: str
    short_summary: str = None


# ---------- Routes ----------
@app.get("/api/search", response_model=List[SearchResult])
def search(lat: float, lon: float, radius_km: float = 50.0):
    """Return nearby sites within a radius."""
    results = []
    for p in PLACES:
        d = haversine_km(lat, lon, p['lat'], p['lon'])
        if d <= radius_km:
            summary = _summary_cache.get(p['id'], {}).get('summary')
            results.append({
                "id": p['id'],
                "name": p['name'],
                "lat": p['lat'],
                "lon": p['lon'],
                "known_type": p.get('known_type', ''),
                "short_summary": summary,
            })
    return results


@app.get("/api/place/{place_id}")
def get_place(place_id: str):
    """Return site metadata + cached summary."""
    place = next((p for p in PLACES if p['id'] == place_id), None)
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    cached = _summary_cache.get(place_id)
    return {"place": place, "generated": cached or {}}


@app.post("/api/place/{place_id}/generate")
def generate_place_summary(place_id: str, force: bool = False):
    """Generate (or re-generate) a summary using Chroma + Gemini."""
    place = next((p for p in PLACES if p['id'] == place_id), None)
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    if not force and place_id in _summary_cache:
        return {"status": "cached", "cached_at": _summary_cache[place_id]['ts']}

    # --- Retrieve context from Chroma ---
    top_chunks = get_top_k_chunks(place_id, k=5)
    if not top_chunks:
        raise HTTPException(status_code=404, detail="No indexed data found for this place")

    retrieval_context = build_retrieval_context(top_chunks)

    # --- Build prompt using your external template ---
    prompt = PLACE_SUMMARY_PROMPT.format(
        place_name=place.get("name", ""),
        retrieved_texts=retrieval_context
    )

    summary_text, sources = generate_summary_with_gemini(place, prompt)

    _summary_cache[place_id] = {
        "summary": summary_text,
        "sources": sources,
        "ts": time.time(),
    }
    return {"status": "generated", "summary": summary_text, "sources": sources}


# ---------- Gemini Summarizer ----------
def generate_summary_with_gemini(place: dict, prompt: str):
    """Run Gemini to produce the final summary text."""
    seed_url = place.get("seed_url")
    if genai is not None:
        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            resp = model.generate_content(prompt)
            text = resp.text.strip()
            # Extract up to 3 URLs mentioned in the context
            sources = []
            for line in prompt.splitlines():
                if "http" in line:
                    url = line.strip().split(" ")[-1]
                    if url not in sources:
                        sources.append(url)
            return text, sources[:3]
        except Exception as e:
            print("⚠️ Gemini call failed:", e)

    # fallback placeholder
    placeholder = f"{place.get('name')}: placeholder summary (Gemini unavailable). See {seed_url}"
    return placeholder, [seed_url] if seed_url else []


# ---------- Root ----------
@app.get("/")
def root():
    return {"status": "ok", "message": "PaleoGeoAnthropology API running"}
