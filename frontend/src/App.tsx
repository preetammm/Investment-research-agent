import { useState } from 'react';
import { CompanyInput } from './components/CompanyInput';
import { InvestigationFlow } from './components/InvestigationFlow';
import { useResearchStream } from './hooks/useResearchStream';

function App() {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const { steps, dossier, isStreaming, error, startResearch } = useResearchStream();

  const handleCompanyConfirmed = (companyName: string) => {
    setSelectedCompany(companyName);
    startResearch(companyName);
  };

  const handleReset = () => {
    setSelectedCompany(null);
  };

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-invest-soft flex flex-col justify-between">
      {/* Header (Minimal, matching case file aesthetic) */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center border-b border-slate-light">
        <span className="font-mono text-xs tracking-wider text-ink font-bold">RESEARCH_AGENT_V1.0</span>
        <span className="font-mono text-xs text-ink-faint">DAY_3_PIPELINE</span>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12 px-6">
        {!selectedCompany ? (
          <CompanyInput onCompanyConfirmed={handleCompanyConfirmed} />
        ) : (
          <div className="w-full max-w-3xl flex flex-col items-center space-y-6">
            {/* Investigation progress */}
            {(isStreaming || !dossier) && (
              <div className="w-full">
                <InvestigationFlow steps={steps} companyName={selectedCompany} />
                {error && (
                  <div className="mt-4 p-4 border border-pass bg-pass-soft text-pass font-mono text-xs rounded-sm text-center">
                    ERROR: {error}
                  </div>
                )}
              </div>
            )}

            {/* Verification Result View (Merged Dossier) */}
            {dossier && (
              <div className="w-full bg-paper border border-slate-light p-8 rounded-sm shadow-sm text-left">
                <div className="flex justify-between items-center border-b border-slate-light pb-4 mb-6 font-mono text-[10px] tracking-widest text-ink-faint">
                  <span>DOSSIER VERIFICATION VIEW</span>
                  <button
                    onClick={handleReset}
                    className="hover:text-ink hover:underline cursor-pointer font-bold transition-colors"
                  >
                    [ NEW_INVESTIGATION ]
                  </button>
                </div>

                <h2 className="font-serif italic text-2xl text-ink mb-2">
                  Dossier: <span className="font-sans font-bold not-italic">{dossier.companyName}</span>
                </h2>
                <div className="font-mono text-xs text-ink-faint mb-6">
                  SECTOR: {dossier.sector.toUpperCase()} | STATUS: {dossier.isPublic ? 'PUBLIC' : 'PRIVATE/UNKNOWN'}
                </div>

                <pre className="w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs p-6 rounded-sm overflow-x-auto max-h-[500px]">
                  {JSON.stringify(dossier, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
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
