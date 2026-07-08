# Investment Research Agent

An AI-powered investment research agent consisting of a TypeScript Express backend using LangChain & LangGraph, and a React + TypeScript + Vite frontend.

## Project Structure

```
├── backend/      # TypeScript Express server (LangChain/LangGraph agent)
├── frontend/     # React + TypeScript + Vite user interface
└── README.md     # Root documentation
```

## Tech Stack

### Backend
- **Framework**: Express.js (TypeScript)
- **AI Agent**: LangChain & LangGraph
- **Validation**: Zod
- **Development Tools**: Nodemon, ts-node

### Frontend
- **Framework**: React (TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Linter**: Oxlint

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation & Run

1. **Backend**:
   ```bash
   cd backend
   npm install
   # Configure your environment variables in .env (see .env.example)
   npm run dev
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
