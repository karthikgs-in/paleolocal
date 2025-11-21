import os
import csv
import math
import time
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from backend/.env
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

# # ---------- Optional Gemini SDK ----------
try:
    import google.generativeai as genai
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
except Exception as e:
    genai = None
    print("⚠️ Gemini SDK not available:", e)

# ---------- Local Imports ----------
# Temporarily disable RAG imports for testing
# from .rag_utils import get_top_k_chunks, build_retrieval_context
try:
    from .prompts import PLACE_SUMMARY_PROMPT, FOLLOWUP_Q_PROMPT  # your external prompt file
except ImportError:
    from prompts import PLACE_SUMMARY_PROMPT, FOLLOWUP_Q_PROMPT  # your external prompt file

# Mock RAG functions for testing
def get_top_k_chunks(place_id: str, k: int = 5):
    """Mock function for RAG retrieval."""
    return []

def build_retrieval_context(chunks):
    """Mock function for building retrieval context."""
    return "No RAG context available (ChromaDB disabled for testing)."

# ---------- Constants ----------
DATA_CSV = os.path.join(os.path.dirname(__file__), "..", "..", "data", "seed_places.csv")

app = FastAPI(title="PaleoGeology API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002", "http://localhost:3000", "http://localhost:3004"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory summary cache
_summary_cache: Dict[str, Dict[str, Any]] = {}

# In-memory chat state
_chat_sessions: Dict[str, Dict[str, Any]] = {}  # sessionId -> session data
_user_sessions: Dict[str, List[str]] = {}  # userId -> list of sessionIds
_site_sessions: Dict[str, List[str]] = {}  # siteId -> list of sessionIds

# Chat cleanup configuration
MAX_MESSAGES_PER_SESSION = 10  # After this, summarize and keep only summary + recent messages
SUMMARY_KEEP_RECENT = 3  # Keep this many recent messages after summarization
SESSION_TIMEOUT_HOURS = 24  # Auto-cleanup sessions after this time


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
            # Convert empty strings to None for cleaner handling
            for key, value in r.items():
                if value == '':
                    r[key] = None
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
    short_summary: str = ""  # Default to empty string instead of None

# Chat models
class ChatMessage(BaseModel):
    id: str
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime
    siteId: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    userId: str
    siteId: Optional[str] = None
    sessionId: Optional[str] = None

class ChatResponse(BaseModel):
    message: str
    sessionId: str
    messageId: str
    sources: Optional[List[str]] = None

class ChatHistoryRequest(BaseModel):
    userId: str
    siteId: str


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
                "short_summary": summary or "",  # Ensure empty string if None
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


# ---------- Chat Helper Functions ----------
def create_chat_session(user_id: str, site_id: Optional[str] = None) -> str:
    """Create a new chat session."""
    session_id = str(uuid.uuid4())
    
    session = {
        "id": session_id,
        "userId": user_id,
        "siteId": site_id,
        "messages": [],
        "lastActivity": datetime.now(),
        "created": datetime.now()
    }
    
    _chat_sessions[session_id] = session
    
    # Track user sessions
    if user_id not in _user_sessions:
        _user_sessions[user_id] = []
    _user_sessions[user_id].append(session_id)
    
    # Track site sessions
    if site_id:
        if site_id not in _site_sessions:
            _site_sessions[site_id] = []
        _site_sessions[site_id].append(session_id)
    
    return session_id


def find_session(user_id: str, site_id: str) -> Optional[str]:
    """Find existing session for user and site."""
    user_session_ids = _user_sessions.get(user_id, [])
    
    for session_id in user_session_ids:
        session = _chat_sessions.get(session_id)
        if session and session.get("siteId") == site_id:
            return session_id
    
    return None


def delete_session(session_id: str):
    """Delete a chat session and clean up references."""
    session = _chat_sessions.get(session_id)
    if not session:
        return
    
    user_id = session.get("userId")
    site_id = session.get("siteId")
    
    # Remove from main sessions
    del _chat_sessions[session_id]
    
    # Remove from user sessions
    if user_id and user_id in _user_sessions:
        _user_sessions[user_id] = [sid for sid in _user_sessions[user_id] if sid != session_id]
        if not _user_sessions[user_id]:
            del _user_sessions[user_id]
    
    # Remove from site sessions
    if site_id and site_id in _site_sessions:
        _site_sessions[site_id] = [sid for sid in _site_sessions[site_id] if sid != session_id]
        if not _site_sessions[site_id]:
            del _site_sessions[site_id]


def cleanup_old_sessions():
    """Remove sessions older than SESSION_TIMEOUT_HOURS."""
    cutoff_time = datetime.now() - timedelta(hours=SESSION_TIMEOUT_HOURS)
    sessions_to_delete = []
    
    for session_id, session in _chat_sessions.items():
        if session.get("lastActivity", datetime.now()) < cutoff_time:
            sessions_to_delete.append(session_id)
    
    for session_id in sessions_to_delete:
        delete_session(session_id)


def summarize_session(session_id: str):
    """Summarize conversation when it gets too long."""
    session = _chat_sessions.get(session_id)
    if not session:
        return
    
    messages = session["messages"]
    if len(messages) <= MAX_MESSAGES_PER_SESSION:
        return
    
    # Keep recent messages
    recent_messages = messages[-SUMMARY_KEEP_RECENT:]
    
    # Create summary of older messages
    older_messages = messages[:-SUMMARY_KEEP_RECENT]
    conversation_text = "\n".join([
        f"{msg['role']}: {msg['content']}" for msg in older_messages
    ])
    
    try:
        if genai is not None:
            model = genai.GenerativeModel("gemini-2.0-flash")
            summary_prompt = f"""Summarize this conversation about a paleontological site in 2-3 sentences. 
            Focus on key topics discussed and main questions/answers:
            
            {conversation_text}"""
            
            resp = model.generate_content(summary_prompt)
            summary = resp.text.strip()
            
            # Replace old messages with summary
            summary_message = {
                "id": str(uuid.uuid4()),
                "role": "system",
                "content": f"[Previous conversation summary: {summary}]",
                "timestamp": datetime.now(),
                "siteId": session.get("siteId")
            }
            
            session["messages"] = [summary_message] + recent_messages
            
    except Exception as e:
        print(f"⚠️ Summarization failed: {e}")
        # Fallback: just keep recent messages without summary
        session["messages"] = recent_messages


def generate_chat_response(user_message: str, site_id: Optional[str], chat_history: List[Dict]) -> tuple[str, List[str]]:
    """Generate LLM response using RAG and chat history."""
    sources = []
    
    # Get site information from our data
    site_info = ""
    site_name = "this paleontological site"
    
    if site_id:
        place = next((p for p in PLACES if p['id'] == site_id), None)
        if place:
            site_name = place.get('name', 'this site')
            known_type = place.get('known_type')
            access_notes = place.get('access_notes')
            notes = place.get('notes')
            seed_url = place.get('seed_url')
            
            site_info = f"Site: {site_name}\\n"
            if known_type:
                site_info += f"Type: {known_type}\\n"
            if access_notes:
                site_info += f"Access: {access_notes}\\n"
            if notes:
                site_info += f"Geological Notes: {notes}\\n"
            
            # Add seed URL if available
            if seed_url:
                sources.append(seed_url)
    
    # Try to get RAG context
    retrieval_context = ""
    try:
        if site_id:
            top_chunks = get_top_k_chunks(site_id, k=5)
            if top_chunks:
                retrieval_context = build_retrieval_context(top_chunks)
                # Extract sources from chunks
                for chunk in top_chunks:
                    meta = chunk.get("metadata", {})
                    src = meta.get("source_url")
                    if src and src not in sources:
                        sources.append(src)
    except Exception as e:
        print(f"⚠️ RAG retrieval failed: {e}")
    
    # Combine available context
    context = ""
    if site_info:
        context += f"Site Information:\n{site_info}\n"
    if retrieval_context:
        context += f"Additional Context:\n{retrieval_context}\n"
    
    if not context:
        context = "No specific site information available in our database."
    
    # Build conversation context
    recent_context = "\n".join([
        f"{msg['role']}: {msg['content']}" 
        for msg in chat_history[-5:]  # Last 5 messages for context
    ])
    
    # Generate response using Gemini
    if genai is not None:
        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            
            prompt = f"""You are a knowledgeable paleontology and geology assistant. Answer the user's question about {site_name} using the provided context. Be helpful and informative, but if specific information is not available, suggest where they might find more detailed information (geological surveys, museums, academic papers).

Context about the site:
{context}

User question: {user_message}

Provide a helpful, informative response in 2-4 sentences."""
            
            if recent_context:
                prompt += f"\n\nRecent conversation context:\n{recent_context}"
            
            resp = model.generate_content(prompt)
            response_text = resp.text.strip()
            
            return response_text, sources[:3]  # Limit to 3 sources
            
        except Exception as e:
            print(f"⚠️ Gemini chat response failed: {e}")
    
    # Enhanced fallback response with site context
    if site_info:
        fallback_response = f"I have basic information about {site_name}. {site_info.replace(chr(10), ' ')} For more detailed geological information, I'd recommend checking with the local geological survey or visiting a nearby natural history museum."
    else:
        fallback_response = "I'm sorry, I don't have enough information about this site to provide a helpful answer. I would recommend checking the local geological survey or museum for more information."
    
    return fallback_response, sources
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


@app.get("/api/ping")
def ping():
    return {"status": "ok", "message": "API is working", "gemini_available": genai is not None}


# ---------- Chat Endpoints ----------
@app.post("/api/chat", response_model=ChatResponse)
def chat_message(request: ChatRequest):
    """Handle chat messages with LLM and RAG integration."""
    try:
        # Clean up old sessions periodically
        cleanup_old_sessions()
        
        # Get or create session
        session_id = request.sessionId or create_chat_session(request.userId, request.siteId)
        session = _chat_sessions.get(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        # Add user message to session
        user_message_id = str(uuid.uuid4())
        user_message = {
            "id": user_message_id,
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now(),
            "siteId": request.siteId
        }
        session["messages"].append(user_message)
        session["lastActivity"] = datetime.now()
        
        # Generate response using LLM and RAG
        assistant_response, sources = generate_chat_response(
            request.message, 
            request.siteId, 
            session["messages"]
        )
        
        # Add assistant message to session
        assistant_message_id = str(uuid.uuid4())
        assistant_message = {
            "id": assistant_message_id,
            "role": "assistant",
            "content": assistant_response,
            "timestamp": datetime.now(),
            "siteId": request.siteId
        }
        session["messages"].append(assistant_message)
        
        # Check if we need to summarize the conversation
        if len(session["messages"]) > MAX_MESSAGES_PER_SESSION:
            summarize_session(session_id)
        
        return ChatResponse(
            message=assistant_response,
            sessionId=session_id,
            messageId=assistant_message_id,
            sources=sources
        )
        
    except Exception as e:
        print(f"⚠️ Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


@app.get("/api/chat/history")
def get_chat_history(userId: str, siteId: str):
    """Get chat history for a user and site."""
    try:
        # Find existing session
        session_id = find_session(userId, siteId)
        if not session_id:
            return {"messages": [], "sessionId": None}
        
        session = _chat_sessions.get(session_id)
        if not session:
            return {"messages": [], "sessionId": None}
        
        return {
            "messages": session["messages"],
            "sessionId": session_id
        }
        
    except Exception as e:
        print(f"⚠️ Chat history error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get chat history: {str(e)}")


@app.delete("/api/chat/history")
def clear_chat_history(request: ChatHistoryRequest):
    """Clear chat history for a user and site."""
    try:
        session_id = find_session(request.userId, request.siteId)
        if session_id:
            delete_session(session_id)
        return {"status": "cleared"}
        
    except Exception as e:
        print(f"⚠️ Chat clear error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear chat history: {str(e)}")
