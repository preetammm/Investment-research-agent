import { graph } from './agents/graph';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

async function verifyCompany(companyName: string) {
  console.log(`\n========================================`);
  console.log(`STARTING DECISION VERIFICATION FOR: ${companyName}`);
  console.log(`========================================`);

  try {
    const finalState = await graph.invoke(
      { companyName },
      {
        configurable: {
          onStep: (event: any) => {
            if (event.type === 'step') {
              console.log(`  [Step Event]: ${event.step} -> ${event.status}`);
            }
          },
        },
      }
    );

    if (finalState.error) {
      console.error(`  [Execution Error]: ${finalState.error}`);
      return;
    }

    console.log(`\n--- VERDICT DECISION METRICS ---`);
    console.log(`Company: ${finalState.companyName}`);
    console.log(`Sector: ${finalState.dossier?.sector}`);
    console.log(`Is Public: ${finalState.dossier?.isPublic}`);
    
    if (finalState.thesis) {
      console.log(`Recommendation: ${finalState.thesis.recommendation}`);
      console.log(`Confidence: ${finalState.thesis.confidence}%`);
      console.log(`One-Line Summary: "${finalState.thesis.oneLineSummary}"`);
      console.log(`Biggest Opportunity: "${finalState.thesis.biggestOpportunity}"`);
      console.log(`Biggest Risk: "${finalState.thesis.biggestRisk}"`);
      console.log(`Scores:`, finalState.thesis.scores);
      console.log(`\nNarrative Writing Check:`);
      console.log(finalState.thesis.narrative);
    } else {
      console.error(`Thesis is missing from the state!`);
    }

    if (finalState.debate) {
      console.log(`\nDebate Point Count:`);
      console.log(`Bull Case Points: ${finalState.debate.bullCase?.length || 0}`);
      console.log(`Bear Case Points: ${finalState.debate.bearCase?.length || 0}`);
    }

    if (finalState.risks) {
      console.log(`\nIdentified Risks Count: ${finalState.risks.length}`);
      finalState.risks.forEach((r: any) => {
        console.log(`  - [${r.category}] (${r.severity}): ${r.detail}`);
      });
    }

  } catch (error) {
    console.error(`Error running verify for ${companyName}:`, error);
  }
}

async function main() {
  await verifyCompany('Tesla');
  await verifyCompany('Microsoft');
}

main().catch(console.error);
