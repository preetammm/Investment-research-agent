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
  | 'merging_dossier';

export interface StepEvent {
  type: 'step';
  step: StepId;
  status: 'active' | 'done';
}

export interface ResultEvent {
  type: 'result';
  dossier: CompanyDossier;
}

export type ResearchEvent = StepEvent | ResultEvent;
