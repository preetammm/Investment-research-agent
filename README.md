# Investment Research Agent

An AI-powered editorial-style investment research agent that transforms a company name into a full investment thesis — complete with a radar-scored evidence dashboard, risk analysis, SWOT breakdown, and a structured bull/bear debate. Results stream in real-time via SSE as the multi-agent pipeline works through each stage.

---

## Project Structure

```
├── backend/                    # TypeScript Express server
│   ├── src/agents/
│   │   ├── companyResolverAgent.ts   # Fuzzy company-name resolution
│   │   ├── researchTools.ts          # 4 parallel Tavily research extractors
│   │   ├── bullBearAgent.ts          # Bull/Bear debate generator
│   │   ├── verdictAgent.ts           # Verdict + scoring + SWOT + risks
│   │   ├── graph.ts                  # LangGraph orchestration pipeline
│   │   └── types.ts                  # Shared TypeScript contracts
│   ├── src/lib/
│   │   ├── llm.ts                    # LLM wrapper (Gemini → Groq fallback)
│   │   └── search.ts                 # Tavily Search client
│   ├── src/routes/
│   │   └── research.ts               # SSE streaming endpoint
│   └── src/index.ts                  # Express entry point
├── frontend/                   # React + Vite UI
│   ├── src/components/
│   │   ├── CompanyInput.tsx          # Landing page company resolver input
│   │   ├── InvestigationFlow.tsx     # Real-time step progress timeline
│   │   ├── ThesisCard.tsx            # Hero verdict stamp + summary
│   │   ├── StoryReport.tsx           # Analyst narrative (editorial paragraphs)
│   │   ├── EvidenceDashboard.tsx     # Radar chart + animated progress bars
│   │   ├── RiskAnalysis.tsx          # Severity-pill risk rows
│   │   ├── SwotGrid.tsx             # 2×2 SWOT quadrant grid
│   │   └── BullBearDebate.tsx        # Two-column debate with citations
│   ├── src/hooks/
│   │   └── useResearchStream.ts      # SSE ReadableStream consumer
│   ├── src/types/
│   │   └── research.ts              # Frontend type contracts
│   └── src/App.tsx                   # Main app layout & component wiring
├── api/                        # Vercel serverless functions
├── vercel.json                 # Vercel deployment config
└── README.md
```

---

## Features & Build Timeline

### Day 1–2: Foundation
- Custom retro-editorial "case file" design system (Fraunces serif, Inter sans, IBM Plex Mono)
- Tailwind theme with `paper`, `ink`, `invest`/`watch`/`pass` color tokens
- Express backend skeleton with CORS and SSE support
- Company Resolver agent — handles typos, shorthands, and ambiguous names
- LLM fallback wrapper: primary Gemini Pro, secondary Groq (Llama 3.3 70B) with automatic failover

### Day 3: Parallel Research & Streaming
- 4 parallel Tavily-powered research extractors (Info, Financials, News, Competitors)
- Rate-limit exponential backoff retry handler (`callJSONWithRetry`)
- Real-time Server-Sent Events (SSE) streaming with 9 progress steps
- Editorial timeline investigation flow showing live step transitions

### Day 4: Decision Engine
- **Bull/Bear Agent** — generates structured debate points with severity scores and evidence citations
- **Verdict Agent** — produces investment recommendation (`Invest`/`Watch`/`Pass`), confidence score, SWOT analysis, risk assessment, 5-dimension scoring, and a full analyst narrative
- **LangGraph pipeline** — orchestrates the full flow: Resolve → Research (parallel) → Bull/Bear → Verdict
- **ThesisCard** — hero verdict stamp with animated confidence bar
- **StoryReport** — editorial narrative with staggered paragraph animations

### Day 5: Evidence Suite (Current)
- **EvidenceDashboard** — Recharts RadarChart (5 dimensions: Market Opportunity, Financial Health, Execution, Moat, Risk inverted) + animated progress bars
- **RiskAnalysis** — categorized risk rows with severity pills (low=watch/green, medium=invest/amber, high=pass/red), staggered fade-in animations
- **SwotGrid** — responsive 2×2 grid with color-coded left borders (Strengths=invest, Weaknesses=pass, Opportunities=watch, Threats=slate)
- **BullBearDebate** — two-column debate layout with "The case for" / "The case against" headers, each point citing its source via `basedOn`
- Removed temporary raw JSON dump — all data now flows through proper components
- Section dividers (1px slate-light) between each report section for a cohesive document feel

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | Express.js (TypeScript) |
| AI / LLM | Google Gemini Pro + Groq (Llama 3.3 70B) fallback |
| Web Search | Tavily Search API |
| Orchestration | LangGraph (state machine pipeline) |
| Dev Tools | Nodemon, ts-node |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19 (TypeScript) |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Charts | Recharts (RadarChart) |
| Streaming | Fetch ReadableStream API (SSE) |

---

## Getting Started

### 1. Prerequisites
- Node.js v18+
- API keys for: Gemini, Groq, and Tavily Search

### 2. Environment Setup

Create a `.env` file in the `backend/` directory:
```env
PORT=4000
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key
```

### 3. Installation & Run

**Backend:**
```bash
cd backend
npm install
npm run dev
```
Server runs at `http://localhost:4000`.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## How It Works

1. **Enter a company name** — the resolver handles typos and ambiguity
2. **Watch the investigation unfold** — 9 streaming steps animate in real-time
3. **Read the verdict** — a stamped recommendation (Invest / Watch / Pass) with confidence rating
4. **Explore the evidence** — radar chart, risk breakdown, SWOT grid, and bull/bear debate

---

## Upcoming (Day 6+)
- Explain button (drill into any score dimension)
- Executive summary export
- Follow-up conversational chat

---

## License

MIT

