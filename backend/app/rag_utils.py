"""
Retrieval helper for paleolocal app.

- Connects to the Chroma persistent DB (created by ingest_seed_urls.py)
- Retrieves top-k chunks for a given place_id or free-text query
- Prepares context text for Gemini summarization
"""

import os
from typing import List, Dict
import chromadb
import numpy as np
from sentence_transformers import SentenceTransformer

# ---------------- CONFIG ----------------
REPO_ROOT = os.path.dirname(os.path.dirname(__file__))  # backend/
CHROMA_DIR = os.path.join(REPO_ROOT, "chroma_db")
COLLECTION_NAME = "paleogeology_chunks"
EMB_MODEL = "all-MiniLM-L6-v2"

# ---------------- INIT ----------------
# new Chroma client
_client = chromadb.PersistentClient(path=CHROMA_DIR)
_coll = _client.get_or_create_collection(name=COLLECTION_NAME, metadata={"source": "paleolocal"})

# local embedding model (same one used for ingestion)
_model = SentenceTransformer(EMB_MODEL)


# ---------------- HELPERS ----------------
def embed_query(query: str) -> List[float]:
    """Compute normalized embedding for a query."""
    emb = _model.encode([query], convert_to_numpy=True)[0]
    norm = np.linalg.norm(emb)
    if norm != 0:
        emb = emb / norm
    return emb.tolist()


def get_top_k_chunks(place_id: str, k: int = 5) -> List[Dict]:
    """
    Retrieve top-k relevant chunks for a given place_id.
    Falls back to semantic search if metadata filter yields nothing.
    """
    results = []
    try:
        # 1. Try metadata filter
        res = _coll.query(
            query_texts=[f"place_id:{place_id}"],
            n_results=k,
            where={"place_id": place_id}
        )
        if res and res["ids"] and len(res["ids"][0]) > 0:
            results = [
                {
                    "id": res["ids"][0][i],
                    "document": res["documents"][0][i],
                    "metadata": res["metadatas"][0][i],
                    "distance": res["distances"][0][i] if "distances" in res else None,
                }
                for i in range(len(res["ids"][0]))
            ]
    except Exception:
        pass

    # 2. If no direct match, semantic search by place_id string
    if not results:
        try:
            res = _coll.query(
                query_embeddings=[embed_query(place_id)],
                n_results=k
            )
            if res and res["ids"] and len(res["ids"][0]) > 0:
                results = [
                    {
                        "id": res["ids"][0][i],
                        "document": res["documents"][0][i],
                        "metadata": res["metadatas"][0][i],
                        "distance": res["distances"][0][i] if "distances" in res else None,
                    }
                    for i in range(len(res["ids"][0]))
                ]
        except Exception as e:
            print("⚠️ Retrieval error:", e)
            results = []

    return results


def build_retrieval_context(chunks: List[Dict]) -> str:
    """
    Build a formatted retrieval context string from top chunks.
    Includes small metadata headers per chunk.
    """
    if not chunks:
        return "No relevant data found."

    sections = []
    for c in chunks:
        meta = c.get("metadata", {})
        src = meta.get("source_url", "<unknown>")
        idx = meta.get("chunk_index", -1)
        place = meta.get("place_name", "")
        header = f"[{place} | chunk {idx} | source: {src}]\n"
        body = c.get("document", "")
        sections.append(header + body)
    return "\n\n---\n\n".join(sections)


def summarize_place_context(place_id: str, k: int = 5) -> str:
    """
    Helper for quick console testing:
    Retrieves chunks, builds context, prints snippet.
    """
    chunks = get_top_k_chunks(place_id, k=k)
    ctx = build_retrieval_context(chunks)
    return ctx


# Example CLI test
if __name__ == "__main__":
    pid = input("Enter place_id to retrieve: ").strip()
    context = summarize_place_context(pid)
    print("\n===== RETRIEVAL CONTEXT =====\n")
    print(context[:1500])
