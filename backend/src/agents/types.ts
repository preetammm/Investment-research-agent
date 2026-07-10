export interface SourcedFact {
  label: string;
  value: string;
  sourceUrl?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CompanyDossier {
  companyName: string;
  isPublic: boolean | 'unknown';
  summary: string;
  sector: string;
  leadership: SourcedFact[];
  financials: SourcedFact[];
  recentNews: SourcedFact[];
  competitors: string[];
  redFlags: SourcedFact[];
  dataGaps: string[];
}

export type StepId =
  | 'finding_company'
  | 'fetching_financials'
  | 'reading_news'
  | 'checking_competitors'
  | 'merging_dossier'
  | 'identifying_risks'
  | 'evaluating_health'
  | 'building_thesis'
  | 'final_recommendation';

export interface StepEvent {
  type: 'step';
  step: StepId;
  status: 'active' | 'done';
}

export interface DebatePoint {
  point: string;
  basedOn: string;
  severity: 1 | 2 | 3 | 4 | 5;
}

export interface BullBearCase {
  bullCase: DebatePoint[];
  bearCase: DebatePoint[];
}

export type RiskCategory =
  | 'Competition'
  | 'Regulation'
  | 'Debt'
  | 'Innovation'
  | 'Market Conditions';

export interface RiskItem {
  category: RiskCategory;
  severity: 'low' | 'medium' | 'high';
  detail: string;
}

export interface ScoreCard {
  marketOpportunity: number;
  financialHealth: number;
  executionTeam: number;
  competitiveMoat: number;
  riskLevel: number;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export type Recommendation = 'Invest' | 'Watch' | 'Pass';

export interface InvestmentThesis {
  recommendation: Recommendation;
  confidence: number;
  oneLineSummary: string;
  narrative: string;
  keyReasons: string[];
  majorRisks: string[];
  biggestOpportunity: string;
  biggestRisk: string;
  scores: ScoreCard;
}

export interface ResearchState {
  companyName: string;
  dossier?: CompanyDossier;
  debate?: BullBearCase;
  risks?: RiskItem[];
  swot?: SwotAnalysis;
  thesis?: InvestmentThesis;
  error?: string;
}

export interface ResultEvent {
  type: 'result';
  state: ResearchState;
}

export type ResearchEvent = StepEvent | ResultEvent;

