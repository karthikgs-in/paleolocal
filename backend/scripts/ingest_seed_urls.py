"""
Ingest paleogeology seed URLs:
- Fetch & clean text from each seed_url in data/seed_places.csv
- Chunk the text
- Generate embeddings using SentenceTransformers (local)
- Store chunks in data/chunks.jsonl
- Upsert embeddings + text into Chroma (backend/chroma_db)
"""

import os
import csv
import json
import time
from pathlib import Path
from typing import List
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm
import numpy as np

import chromadb
from sentence_transformers import SentenceTransformer

# ---------------- CONFIG ----------------
REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_CSV = REPO_ROOT / "data" / "seed_places.csv"
CHUNKS_JSONL = REPO_ROOT / "data" / "chunks.jsonl"
CHROMA_DIR = REPO_ROOT / "backend" / "chroma_db"
CHROMA_DIR.mkdir(parents=True, exist_ok=True)

COLLECTION_NAME = "paleogeology_chunks"
EMB_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 1200
OVERLAP = 200
BATCH_SIZE = 32
USER_AGENT = "paleolocal-ingest/1.0"

# ---------------- HELPERS ----------------
def fetch_url_text(url: str, max_chars: int = 20000) -> str:
    """Fetch plain text from webpage."""
    try:
        headers = {"User-Agent": USER_AGENT}
        r = requests.get(url, timeout=15, headers=headers)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        for s in soup(["script", "style", "noscript"]):
            s.extract()
        text = " ".join(soup.stripped_strings)
        return text[:max_chars]
    except Exception as e:
        print(f"⚠️ Failed to fetch {url}: {e}")
        return ""

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = OVERLAP) -> List[str]:
    """Split long text into overlapping chunks."""
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end].strip())
        start = end - overlap if end - overlap > start else end
    return chunks

# ---------------- EMBEDDINGS ----------------
print(f"🔹 Loading embedding model: {EMB_MODEL}")
model = SentenceTransformer(EMB_MODEL)

def embed_texts(texts: List[str]) -> List[List[float]]:
    """Compute normalized embeddings."""
    embs = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    norms = np.linalg.norm(embs, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    embs = embs / norms
    return [e.tolist() for e in embs]

# ---------------- NEW CHROMA INIT ----------------
def init_chroma_collection():
    """
    New persistent Chroma client (no deprecated Settings).
    Compatible with Chroma >=0.5.
    """
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    try:
        coll = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"source": "paleolocal"}
        )
    except Exception as e:
        print("⚠️ Error creating/getting collection:", e)
        raise
    return client, coll

# ---------------- MAIN PIPELINE ----------------
def main():
    if not DATA_CSV.exists():
        raise FileNotFoundError(f"Seed CSV not found at {DATA_CSV}")

    client, coll = init_chroma_collection()
    CHUNKS_JSONL.parent.mkdir(parents=True, exist_ok=True)

    total_chunks = 0
    all_doc_ids, all_docs, all_metadatas = [], [], []

    with open(DATA_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    for r in tqdm(rows, desc="Processing seed URLs"):
        place_id = r.get("id")
        name = r.get("name")
        url = r.get("seed_url")
        if not url:
            continue

        text = fetch_url_text(url)
        if not text:
            continue

        chunks = chunk_text(text)
        if not chunks:
            continue

        for idx, chunk in enumerate(chunks):
            doc_id = f"{place_id}__{idx}"
            meta = {
                "place_id": place_id,
                "place_name": name,
                "source_url": url,
                "chunk_index": idx,
                "ts": int(time.time()),
            }
            all_doc_ids.append(doc_id)
            all_docs.append(chunk)
            all_metadatas.append(meta)
            total_chunks += 1

            # Write JSONL incrementally
            with open(CHUNKS_JSONL, "a", encoding="utf-8") as out:
                out.write(json.dumps({"id": doc_id, "text": chunk, "meta": meta}, ensure_ascii=False) + "\n")

            # Batch upsert
            if len(all_docs) >= BATCH_SIZE:
                upsert_batch(coll, all_doc_ids, all_docs, all_metadatas)
                all_doc_ids, all_docs, all_metadatas = [], [], []

    # Final batch
    if all_docs:
        upsert_batch(coll, all_doc_ids, all_docs, all_metadatas)

    print(f"✅ Ingestion complete: {total_chunks} chunks indexed.")
    print(f"Chroma persisted at: {CHROMA_DIR}")

def upsert_batch(coll, ids, docs, metas):
    """Embed + upsert a batch into Chroma."""
    try:
        embeddings = embed_texts(docs)
        coll.upsert(ids=ids, documents=docs, metadatas=metas, embeddings=embeddings)
    except Exception as e:
        print(f"⚠️ Upsert failed for batch of {len(docs)} docs: {e}")
        raise

# ---------------- RUN ----------------
if __name__ == "__main__":
    main()
