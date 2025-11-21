# 🏺 PaleoLocal — Paleogeology Explorer

**PaleoLocal** is a full-stack application for discovering and exploring paleogeologic sites with an intelligent AI-powered chat interface.  
It combines an interactive React frontend with a powerful backend API using **FastAPI**, **Chroma**, **SentenceTransformers**, and **Gemini** to provide contextual geological insights.

## 🖼️ Application Preview

![PaleoLocal Interactive Map](paleo_local.png)

*The interactive map interface showing paleontological site details with an integrated side panel for site information, coordinates, and exploration tools.*

---

## ⚙️ Features

### 🖥️ Frontend (React + TypeScript)
- 🗺️ **Interactive Leaflet Map** with paleontological site markers
- 💬 **Smart Chat Interface** with dual-mode functionality:
  - **Floating Mode**: Movable and resizable chat window for flexible exploration
  - **Docked Mode**: Seamlessly integrates into the site panel for focused research
  - **Site-Specific Context**: Automatically adapts to selected geological sites
  - **AI-Powered Responses**: Get detailed geological insights powered by Gemini LLM
- 📋 **Dynamic Side Panel** showing detailed site information and coordinates  
- 🔍 **Tabbed Interface** for site details and search results
- 📍 **Click-to-Explore** marker interactions with smooth animations and smart map centering
- 📱 **Responsive Design** optimized for desktop and mobile exploration

### 🔧 Backend API (FastAPI + AI)
- 🌍 Search nearby paleogeologic or geoanthropological sites by latitude, longitude, and radius.  
- 💬 **Interactive Chat API** for real-time geological consultations and site-specific Q&A
- 🧠 Retrieve semantically relevant text chunks from local sources using **ChromaDB**.  
- 🔎 Embed site content locally via **SentenceTransformers**.  
- 💬 Generate contextual summaries and chat responses with **Gemini 2.0 Flash**.  
- ⚡ FastAPI endpoints for integration with any frontend or research pipeline.  

---

## 📂 Project Structure

```
paleolocal/
├── start-frontend.sh        # 🚀 Frontend startup script (recommended)
├── paleolocal-dev           # 🎯 Quick launcher (can run from anywhere)
├── frontend/                # React + TypeScript Interactive Frontend
│   ├── src/
│   │   ├── components/      # React components (Map, SidePanel, etc.)
│   │   ├── hooks/           # Custom React hooks (useMapState, useSiteData)
│   │   ├── services/        # API services and mock data
│   │   ├── types/           # TypeScript type definitions
│   │   └── config/          # Development and debug configuration
│   ├── package.json         # Frontend dependencies and scripts
│   └── vite.config.ts       # Vite build configuration
├── backend/                 # FastAPI + AI Backend
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── rag_utils.py     # Retrieval & embedding helpers
│   │   ├── prompts.py       # Prompt templates for Gemini
│   ├── scripts/
│   │   └── ingest_seed_urls.py  # Crawl + embed + store data
│   ├── chroma_db/           # Persistent Chroma vector store
├── data/
│   ├── seed_places.csv      # Seed list of sites
│   └── chunks.jsonl         # Auto-generated text chunks
├── .env                     # Gemini API key (not committed)
├── requirements.txt
└── README.md
```

---

## 🚀 Quick Start (Recommended)

### Frontend Development Server
Use the dedicated startup script to avoid directory confusion:

```bash
# From project root (recommended method)
./start-frontend.sh

# Or from anywhere in your system
./paleolocal-dev
```

**Benefits:**
- ✅ Automatically navigates to correct directory
- ✅ Handles port conflicts (kills existing processes on 3002)
- ✅ Installs dependencies if needed
- ✅ Starts with optimized HMR configuration
- ✅ Clear status messages and error handling

---

## 🧰 Manual Setup

### 1️⃣ Create environment
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2️⃣ Add environment variables
At project **root**, create a `.env` file:
```ini
GOOGLE_API_KEY=your_gemini_api_key_here
```

Optionally verify:
```bash
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('GOOGLE_API_KEY'))"
```

---

## 🧩 Data Ingestion

```bash
python backend/scripts/ingest_seed_urls.py
```

This script reads `data/seed_places.csv`, fetches web text, chunks it,
creates local embeddings via `SentenceTransformers`, and stores them in Chroma.

---

## �️ Run Frontend (Interactive Map)

```bash
cd frontend
npm install
npm run dev
```

Visit:
- http://localhost:3000 → Interactive map interface
- Click markers to explore paleontological sites
- Use side panel for detailed site information

---

## �🚀 Run API Server

```bash
uvicorn backend.app.main:app --reload
```

Visit:
- http://127.0.0.1:8000 → health check  
- http://127.0.0.1:8000/docs → interactive API docs

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|-----------|--------|--------------|
| `/` | GET | Health check |
| `/api/search?lat={lat}&lon={lon}&radius_km={r}` | GET | Nearby site search |
| `/api/place/{id}` | GET | Site metadata + cached summary |
| `/api/place/{id}/generate` | POST | Generate summary with RAG + Gemini |
| `/api/place/{id}/generate?force=true` | POST | Force new generation |
| `/api/chat` | POST | Interactive chat with geological context |
| `/api/chat/site/{id}` | POST | Site-specific chat consultation |

---

## 💬 Chat Interface Guide

### **Getting Started with the Chat**
1. **Initial State**: Chat appears as a floating window when the map loads with the top site highlighted
2. **Site Selection**: Click any site marker to center the map and open the detailed side panel
3. **Auto-Docking**: Chat automatically docks into the bottom of the side panel for focused exploration
4. **Context Switching**: Chat conversation adapts to the selected site's geological context

### **Chat Modes**
- **🎈 Floating Mode**: 
  - Freely movable by dragging the header
  - Resizable by dragging the bottom-right corner
  - Perfect for general geological questions
- **🔗 Docked Mode**:
  - Integrated into the site panel
  - Optimized for site-specific research
  - Maintains conversation context

### **Interaction Tips**
- Ask specific questions about geological formations, fossil types, or site characteristics
- Request comparisons between different paleontological periods
- Get contextual information about the currently selected site
- Use the chat for educational insights about paleontology and geology

**📖 For detailed usage instructions, see [Chat Interface Guide](docs/CHAT_INTERFACE_GUIDE.md)**

---

## ⚡ RAG Flow

1. **`ingest_seed_urls.py`** → builds vector store with local embeddings  
2. **`rag_utils.py`** → retrieves relevant context from Chroma  
3. **`prompts.py`** → formats context into a Gemini prompt  
4. **Gemini 1.5 Flash** → produces concise, evidence-based summaries  
5. **`main.py`** → serves results via FastAPI endpoints  

---

## 🧪 Quick Test

```bash
# Search for nearby sites
curl "http://127.0.0.1:8003/api/search?lat=12.97&lon=77.59&radius_km=100"

# Generate site summary
curl -X POST "http://127.0.0.1:8003/api/place/1/generate?force=true"

# Test chat interface
curl -X POST "http://127.0.0.1:8003/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What can you tell me about paleontology?"}'

# Site-specific chat
curl -X POST "http://127.0.0.1:8003/api/chat/site/1" \
  -H "Content-Type: application/json" \
  -d '{"message": "What geological features make this site interesting?"}'
```

---

## 🧾 Requirements (core)

```text
fastapi
uvicorn
chromadb>=0.5.0
sentence-transformers
beautifulsoup4
requests
tqdm
numpy
python-dotenv
google-generativeai
```

---

## 🧑‍💻 Authors

**Manickavasagam Sundaram**  
Software Engineer | Architect
[GitHub](https://github.com/manick02) • [LinkedIn](https://www.linkedin.com/in/manickavasagams/)

**Karthik G. Shanmugasundaram**  
AI architect | M.Tech (AI & DS) 2025, SRM Institute of Science and Technology  
[GitHub](https://github.com/karthikgs-in) • [LinkedIn](https://linkedin.com/in/karthikgs-in)

---

## 📜 License
MIT License © 2025 PaleoLocal Project
