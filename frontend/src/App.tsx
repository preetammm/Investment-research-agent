import { useState } from 'react';
import { CompanyInput } from './components/CompanyInput';
import { InvestigationFlow } from './components/InvestigationFlow';
import { useResearchStream } from './hooks/useResearchStream';
import { ThesisCard } from './components/ThesisCard';
import { StoryReport } from './components/StoryReport';
import { EvidenceDashboard } from './components/EvidenceDashboard';
import { RiskAnalysis } from './components/RiskAnalysis';
import { SwotGrid } from './components/SwotGrid';
import { BullBearDebate } from './components/BullBearDebate';
import { ExplainButton } from './components/ExplainButton';
import { FollowUpChat } from './components/FollowUpChat';
import { ExecutiveSummary } from './components/ExecutiveSummary';

function App() {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const { steps, researchState, isStreaming, error, startResearch } = useResearchStream();

  const handleCompanyConfirmed = (companyName: string) => {
    setSelectedCompany(companyName);
    startResearch(companyName);
  };

  const handleReset = () => {
    setSelectedCompany(null);
  };

  /* Thin horizontal rule used between report sections */
  const SectionDivider = () => (
    <hr className="w-full border-0 border-t border-slate-light my-0" />
  );

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-invest-soft flex flex-col justify-between">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center border-b border-slate-light">
        <span className="font-mono text-xs tracking-wider text-ink font-bold">RESEARCH_AGENT_V1.0</span>
        <span className="font-mono text-xs text-ink-faint">DAY_6_EXPLAIN_&_CHAT</span>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12 px-6">
        {!selectedCompany ? (
          <CompanyInput onCompanyConfirmed={handleCompanyConfirmed} />
        ) : (
          <div className="w-full max-w-3xl flex flex-col items-center space-y-8">
            {/* Investigation progress */}
            {(isStreaming || !researchState) && (
              <div className="w-full">
                <InvestigationFlow steps={steps} companyName={selectedCompany} />
                {error && (
                  <div className="mt-4 p-4 border border-pass bg-pass-soft text-pass font-mono text-xs rounded-sm text-center">
                    ERROR: {error}
                  </div>
                )}
              </div>
            )}

            {/* Full report — rendered as flowing sections of one document */}
            {researchState && (
              <div className="w-full flex flex-col items-center space-y-8 animate-fadeIn">
                {/* ── ThesisCard ── */}
                {researchState.thesis && (
                  <ThesisCard
                    companyName={researchState.companyName}
                    recommendation={researchState.thesis.recommendation}
                    confidence={researchState.thesis.confidence}
                    oneLineSummary={researchState.thesis.oneLineSummary}
                  />
                )}

                <SectionDivider />

                {/* ── Analyst Narrative ── */}
                {researchState.thesis && (
                  <StoryReport narrative={researchState.thesis.narrative} />
                )}

                <SectionDivider />

                {/* ── Evidence Dashboard (scores radar + bars) ── */}
                {researchState.thesis?.scores && (
                  <EvidenceDashboard scores={researchState.thesis.scores} />
                )}

                <SectionDivider />

                {/* ── Risk Analysis ── */}
                {researchState.risks && researchState.risks.length > 0 && (
                  <RiskAnalysis risks={researchState.risks} />
                )}

                {researchState.risks && researchState.risks.length > 0 && <SectionDivider />}

                {/* ── SWOT Grid ── */}
                {researchState.swot && (
                  <SwotGrid swot={researchState.swot} />
                )}

                <SectionDivider />

                {/* ── Bull vs Bear Debate ── */}
                {researchState.debate && (
                  <BullBearDebate debate={researchState.debate} />
                )}

                <SectionDivider />

                {/* ── Explain This To Me ── */}
                {researchState.thesis && researchState.dossier && (
                  <ExplainButton
                    companyName={researchState.companyName}
                    thesis={researchState.thesis}
                    dossier={researchState.dossier}
                  />
                )}

                <SectionDivider />

                {/* ── Follow-up Chat ── */}
                <FollowUpChat researchState={researchState} />

                <SectionDivider />

                {/* ── Executive Summary ── */}
                {researchState.thesis && (
                  <ExecutiveSummary
                    companyName={researchState.companyName}
                    thesis={researchState.thesis}
                  />
                )}

                {/* New Investigation button */}
                <div className="w-full border-t border-slate-light pt-6 flex justify-center">
                  <button
                    onClick={handleReset}
                    className="font-mono text-[10px] tracking-widest text-ink-faint hover:text-ink hover:underline cursor-pointer font-bold transition-colors uppercase"
                  >
                    [ NEW_INVESTIGATION ]
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center border-t border-slate-light text-ink-faint font-mono text-[10px] tracking-wide">
        <span>© 2026 ANTIGRAVITY INVESTMENTS INC.</span>
        <span>RESTRICTED ACCESS</span>
      </footer>
    </div>
  );
}

export default App;

