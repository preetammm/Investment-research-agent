# Investment Research Agent

An AI-powered editorial-style corporate and investment research agent. This application allows users to input any company name, resolve it, and watch a multi-step research pipeline stream findings in real-time before generating a unified merged dossier.

## Project Structure

```
├── backend/          # TypeScript Express server (Research & Merging agent)
│   ├── src/agents/   # Company Resolver, Research Tools orchestrator, and types
│   ├── src/lib/      # LLM wrapper (Gemini/Groq Llama 3.3) & Tavily Search client
│   └── src/routes/   # SSE endpoint and Resolution API routes
├── frontend/         # React + TypeScript + Vite user interface
│   ├── src/components/ # Company Input, Investigation Flow steps UI
│   ├── src/hooks/    # SSE ReadableStream consumer React hook
│   └── src/types/    # Shared TypeScript contracts
└── README.md         # Root documentation
```

---

## Features & Implementation Status

- **Day 1: Landing Page & Skeleton**: Custom retro-editorial theme, case file layout, Express backend setup.
- **Day 2: Company Resolver & LLM Fallback**:
  - Resolves typos, shorthands, and ambiguous company names (e.g. "appl" -> "Apple", "Titan" -> ambiguous alternative select options, or gibberish -> unrecognized).
  - Primary Gemini, secondary Groq (Llama 3.3 70B) provider with automatic failover wrapper.
- **Day 3: Parallel Research Tools & SSE Streaming (Current Status)**:
  - 4 parallel extraction agents querying Tavily: Info, Financials, News, and Competitors.
  - Rate-limit exponential backoff retry handler (`callJSONWithRetry`).
  - Real-time Server-Sent Events (SSE) streaming progress and status transitions.
  - Editorial timeline investigation flow showing step status updates live.

---

## Tech Stack

### Backend
- **Framework**: Express.js (TypeScript)
- **AI Integration**: Gemini Pro & Groq (Llama 3.3 70B)
- **Web Search**: Tavily Search API
- **Development Tools**: Nodemon, ts-node

### Frontend
- **Framework**: React (TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & Framer Motion
- **Stream Consumption**: Fetch ReadableStream API

---

## Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- Tavily Search API Key
- Gemini or Groq API Key

### 2. Environment Setup

Create a `.env` file in the `backend/` directory:
```env
PORT=4000
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key
```

### 3. Installation & Run

#### Run the Backend Server:
```bash
cd backend
npm install
npm run dev
```
The server will run at `http://localhost:4000`.

#### Run the Frontend Web App:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
