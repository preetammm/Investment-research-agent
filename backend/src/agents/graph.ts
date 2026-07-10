import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { runResearchTools } from './researchTools';
import { runBullBearAgent } from './bullBearAgent';
import { runVerdictAgent, deriveRecommendation } from './verdictAgent';
import { StepEvent } from './types';

// Define the annotation state shape matching ResearchState
export const ResearchStateAnnotation = Annotation.Root({
  companyName: Annotation<string>(),
  dossier: Annotation<any>(),
  debate: Annotation<any>(),
  risks: Annotation<any>(),
  swot: Annotation<any>(),
  thesis: Annotation<any>(),
  error: Annotation<string>(),
});

/**
 * Node 1: Research Node
 * Runs the Day 3 parallel search tools and merges dossier.
 */
async function researchNode(state: typeof ResearchStateAnnotation.State, config?: any) {
  const onStep = config?.configurable?.onStep || (() => {});
  try {
    const dossier = await runResearchTools(state.companyName, onStep);
    return { dossier };
  } catch (err: any) {
    console.error('[graph-research]: Research node execution failed:', err);
    return { error: err.message || String(err) };
  }
}

/**
 * Node 2: Debate Node
 * Runs the Bull/Bear analyst debate simulation.
 */
async function debateNode(state: typeof ResearchStateAnnotation.State, config?: any) {
  if (state.error) return {};
  try {
    if (!state.dossier) {
      throw new Error('Dossier is missing for debate stage');
    }
    const debate = await runBullBearAgent(state.dossier);
    return { debate };
  } catch (err: any) {
    console.error('[graph-debate]: Debate node execution failed:', err);
    return { error: err.message || String(err) };
  }
}

/**
 * Node 3: Verdict Node
 * Formulates the scorecard, risks, SWOT, and final investment recommendation.
 */
async function verdictNode(state: typeof ResearchStateAnnotation.State, config?: any) {
  if (state.error) return {};
  const onStep = config?.configurable?.onStep || (() => {});

  try {
    if (!state.dossier || !state.debate) {
      throw new Error('Required dossier or debate state missing for verdict stage');
    }

    // Step 1: Identifying risks
    onStep({ type: 'step', step: 'identifying_risks', status: 'active' });
    const rawVerdict = await runVerdictAgent(state.dossier, state.debate);
    onStep({ type: 'step', step: 'identifying_risks', status: 'done' });

    // Step 2: Evaluating health
    onStep({ type: 'step', step: 'evaluating_health', status: 'active' });
    onStep({ type: 'step', step: 'evaluating_health', status: 'done' });

    // Step 3: Building thesis
    onStep({ type: 'step', step: 'building_thesis', status: 'active' });
    onStep({ type: 'step', step: 'building_thesis', status: 'done' });

    // Step 4: Final recommendation
    onStep({ type: 'step', step: 'final_recommendation', status: 'active' });
    const { rec, confidence } = deriveRecommendation(rawVerdict.scores);
    onStep({ type: 'step', step: 'final_recommendation', status: 'done' });

    const thesis = {
      recommendation: rec,
      confidence,
      oneLineSummary: rawVerdict.oneLineSummary,
      narrative: rawVerdict.narrative,
      keyReasons: rawVerdict.keyReasons,
      majorRisks: rawVerdict.majorRisks,
      biggestOpportunity: rawVerdict.biggestOpportunity,
      biggestRisk: rawVerdict.biggestRisk,
      scores: rawVerdict.scores,
    };

    return {
      risks: rawVerdict.risks,
      swot: rawVerdict.swot,
      thesis,
    };
  } catch (err: any) {
    console.error('[graph-verdict]: Verdict node execution failed:', err);
    return { error: err.message || String(err) };
  }
}

// Build StateGraph workflow
const workflow = new StateGraph(ResearchStateAnnotation)
  .addNode('research', researchNode)
  .addNode('debate_simulation', debateNode)
  .addNode('verdict', verdictNode)
  .addEdge(START, 'research')
  .addEdge('research', 'debate_simulation')
  .addEdge('debate_simulation', 'verdict')
  .addEdge('verdict', END);

// Compile the graph
export const graph = workflow.compile();
