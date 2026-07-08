import { CompanyInput } from './components/CompanyInput';

function App() {
  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-invest-soft flex flex-col justify-between">
      {/* Header (Minimal, matching case file aesthetic) */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center border-b border-slate-light">
        <span className="font-mono text-xs tracking-wider text-ink font-bold">RESEARCH_AGENT_V1.0</span>
        <span className="font-mono text-xs text-ink-faint">DAY_1_SANDBOX</span>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center">
        <CompanyInput />
      </main>

      {/* Footer (Minimal editorial footer) */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center border-t border-slate-light text-ink-faint font-mono text-[10px] tracking-wide">
        <span>© 2026 ANTIGRAVITY INVESTMENTS INC.</span>
        <span>RESTRICTED ACCESS</span>
      </footer>
    </div>
  );
}

export default App;
