# Investment Research Agent

**🔗 Live demo:** https://investment-research-agent-dmcz.vercel.app/

An AI-powered editorial-style corporate and investment research agent that automates company analysis. Users enter any company name, watch a multi-agent pipeline stream search and synthesis steps in real-time, and get a beautiful, unified dossier covering structured scores, risk analysis, SWOT matrix, and a bull vs. bear debate.

---

## Overview

The **Investment Research Agent** is a full-stack application designed to perform deep-dive corporate research. It automates the work of an equity research analyst: gathering data from the web, resolving company details, simulating debates between bull/bear perspectives, scoring fundamentals, and writing a cohesive narrative.

It features a high-fidelity retro-editorial "case file" UI built with React, styled using custom Tailwind color tokens, and animated with Framer Motion. Data flows in real-time using Server-Sent Events (SSE) to display progress through the multi-agent pipeline.

---

## How to run it

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **Tavily Search API Key** (for web research)
- **Google Gemini API Key** (Primary LLM)
- **Groq API Key** (Fallback LLM)

### 2. Environment Setup

Create a `.env` file in the `backend/` directory:
```env
PORT=4000
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
TAVILY_API_KEY=your_tavily_key_here
```

Create a `.env` file in the `frontend/` directory (or use `.env.development`):
```env
VITE_API_URL=http://localhost:4000
```

### 3. Running Locally

#### Run the Backend Server:
```bash
cd backend
npm install
npm run dev
```
The backend server compiles TypeScript and starts on `http://localhost:4000`.

#### Run the Frontend Web App:
```bash
cd frontend
npm install
npm run dev
```
The frontend Vite server starts on `http://localhost:5173`. Open it in your browser to run the app.

---

## How it works

The application is structured into a backend API and an interactive frontend SPA.

### The Pipeline Architecture (LangGraph & Multi-Agent Node Flow)
Orchestrated in `backend/src/agents/graph.ts`, the pipeline is structured as a LangGraph state machine:

1. **Resolution Node (`companyResolverAgent.ts`)**: Cleans up the input name (e.g. "appl" -> "Apple", handles ambiguity by returning options, or flags unrecognized inputs).
2. **Research Node (`researchTools.ts`)**: Spawns 4 parallel extractors querying Tavily:
   - **Company Info Tool**: General overview, founding, leadership, and business model.
   - **Financials Tool**: Funding rounds, revenue numbers, key investors, and valuation.
   - **News Tool**: Recent controversies, news, regulatory inquiries, and layoffs.
   - **Competitors Tool**: Competitive landscape and main competitors.
   Once parallel extraction is done, the **Merge Tool** synthesizes the data into a single company dossier.
3. **Debate Node (`bullBearAgent.ts`)**: Simulates a debate, generating structured bull and bear case arguments with severity ratings and citations.
4. **Verdict Node (`verdictAgent.ts`)**: Computes scores (1-10) for 5 core dimensions, categorizes risk items, builds a SWOT matrix, drafts a 3-paragraph editorial narrative, and derives the final verdict (`Invest` / `Watch` / `Pass`) and confidence rating.

### The Result Page
Once the pipeline completes, the frontend renders a complete editorial dossier containing the following interactive features:
- **Explain This to Me**: Rewrites the exact same verdict for 4 different audiences (simple / beginner / investor / analyst) without ever changing the core recommendation or confidence—only the language complexity adapts.
- **Follow-up Chat**: Answers user questions using the existing research as grounded context. It maintains real conversational memory across a session by sending the last 6 turns with each request, allowing the stateless LLM to maintain context.
- **Executive Summary**: A 30-second recap bookend at the bottom of the report detailing the final recommendation, confidence percentage, biggest opportunity, biggest risk, and overall conclusion.

---

## Key decisions & trade-offs

- **Split Vercel / Render Deployment**: We chose to deploy the frontend on Vercel and the backend on Render. Vercel's serverless functions enforce strict request execution time limits (typically 10-60 seconds on free tiers) which do not support the persistent connection required by the Server-Sent Events (SSE) streaming. Render web services allow long-running, stateful server processes, supporting reliable stream connections.
- **Gemini-Primary with Groq-Fallback Wrapper**: Implemented in `backend/src/lib/llm.ts`, the LLM wrapper automatically fails over from Gemini (`gemini-2.0-flash`) to Groq (`llama-3.3-70b-versatile`) if rate limits or quota errors are hit. If both fail, it falls back to a smaller, faster model (`llama-3.1-8b-instant`) to preserve system uptime.
- **Company Resolver**: We built a dedicated resolver node at the start of the pipeline so a misspelled or ambiguous company name doesn't cause the whole agent pipeline to confidently research the wrong company. It auto-corrects obvious typos silently and only asks the user for confirmation when genuinely ambiguous between multiple real companies.
- **Scores-Driven Verdict**: The recommendation (Invest / Watch / Pass) and confidence percentage are calculated programmatically in typescript using a composite formula based on numerical scorecard inputs. This ensures logical alignment between scores and the final verdict stamp, rather than letting the LLM hallucinate contradictory ratings.
- **Local Multi-Turn Chat Context Window**: The Follow-Up Chat maintains conversation memory by appending the last 6 messages to each outgoing request to `/api/followup`. This maintains high conversational coherence while staying safely within LLM context tokens limit.

---

## Example runs

Below is a typical report dossier generated by the agent for **Tesla**:

- **Verdict**: `Invest` (Confidence: `72%`)
- **Key Dimension Scores**:
  - Market Opportunity: `9/10`
  - Financial Health: `6/10`
  - Execution Team: `7/10`
  - Competitive Moat: `8/10`
  - Risk Level: `6/10` (High)
- **Swot Matrix**:
  - *Strengths*: Global brand recognition, vertical integration, autopilot IP.
  - *Weaknesses*: Capital intensive manufacturing, high CEO dependency.
  - *Opportunities*: Energy storage scaling, autonomous ride-hailing networks.
  - *Threats*: Margin pressure from Chinese EV competitors, regulatory scrutiny on FSD.
- **Follow-up Chat Example**:
  - *User*: "Why is the risk level rated at 6?"
  - *Assistant*: "The risk rating is elevated due to ongoing regulatory scrutiny into full self-driving features and margin compression from lower-priced competitors."

Below is a typical report dossier generated by the agent for **Microsoft**:

- **Verdict**: `Invest` (Confidence: `80%`)
- **Key Dimension Scores**:
  - Market Opportunity: `9/10`
  - Financial Health: `8/10`
  - Execution Team: `8/10`
  - Competitive Moat: `8/10`
  - Risk Level: `5/10`
- **Swot Matrix**:
  - *Strengths*: High profit margin, Strong revenue growth.
  - *Weaknesses*: Dependence on a few large competitors, Limited information on current leadership.
  - *Opportunities*: Growing demand for cloud infrastructure and artificial intelligence, Expansion into new markets.
  - *Threats*: Increased competition from established players, Potential disruption from technological advancements.
- **Follow-up Chat Example**:
  - *User*: "What is their biggest driver of revenue growth right now?"
  - *Assistant*: "According to the research data, Microsoft's biggest driver of revenue growth is not explicitly stated. However, based on the information provided, we can make some inferences. The company's financials show a revenue growth of 16.7% and EPS growth of 23.6%. The research also highlights the company's large commercial remaining performance obligations of $625 billion, which provides a stable source of future revenue. It's likely that the company's cloud infrastructure and artificial intelligence businesses are significant contributors to its revenue growth."

Below is a typical report dossier generated by the agent for **Peloton**:

- **Verdict**: `Watch` (Confidence: `53%`)
- **Key Dimension Scores**:
  - Market Opportunity: `7/10`
  - Financial Health: `4/10`
  - Execution Team: `5/10`
  - Competitive Moat: `6/10`
  - Risk Level: `7/10` (High)
- **Swot Matrix**:
  - *Strengths*: Strong brand presence in the fitness technology market, Multi-revenue stream business model.
  - *Weaknesses*: Limited market moat to protect against competitors, High-priced fitness equipment and online classes.
  - *Opportunities*: Growing demand for home fitness and wellness solutions, Expansion into new markets and geographies.
  - *Threats*: Intensifying competition from established players and new entrants, Economic downturns or recessions impacting consumer spending.
- **Follow-up Chat Example**:
  - *User*: "Why is their financial health score low?"
  - *Assistant*: "Peloton's financial health score is 7, which is not extremely low, but it's not high either. The reasons for this score are primarily due to the following factors: 1. Declining revenue: Peloton's total revenue has dropped from $4 billion in fiscal 2021 to $2.5 billion, indicating a significant decline in sales. 2. Declining market share: The company's membership has decreased from 7 million to 5.8 million, which is a significant decline in connected fitness and app subscriptions. 3. Recent layoffs and workforce reduction: The company has undergone significant layoffs, including 11% of employees and a workforce reduction from over 8,000 to roughly 3,200, which may indicate operational challenges."

---

## What I would improve with more time

1. **Caching Layer**: Store research results in Redis. Companies like Tesla or Apple don't need a fresh multi-minute web search and LLM extraction on every search. Caching would make identical queries load instantly.
2. **Dynamic Search Queries**: Enhance the resolver to extract search queries based on the resolved industry sector, improving the relevancy of Tavily snippets.
3. **Cost and Token Optimization**: Summarize or truncate large raw search snippets before sending them to the LLM to avoid context size inflation and rate limit triggers.
4. **Export Options**: Add a PDF/Dossier generation feature to let users download the final research report.
5. **Score Consistency**: Score consistency across repeated runs — LLM outputs have inherent run-to-run variance, so the same company can occasionally land on a different side of a scoring threshold between runs. A future improvement would be averaging multiple scoring passes or adding a stability check before finalizing a verdict.
