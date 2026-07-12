import { graph } from './agents/graph';
import { callChat, stripResearchStateForLLM } from './lib/llm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

async function runExample(companyName: string, question: string) {
  console.log(`\n--- RUNNING ${companyName} ---`);
  const finalState = await graph.invoke({ companyName });
  
  if (finalState.error) {
    console.error(`Error: ${finalState.error}`);
    return;
  }
  
  console.log(`Verdict: ${finalState.thesis?.recommendation} (Confidence: ${finalState.thesis?.confidence}%)`);
  console.log(`Scores:`);
  console.log(`- Market Opportunity: ${finalState.thesis?.scores.marketOpportunity}/10`);
  console.log(`- Financial Health: ${finalState.thesis?.scores.financialHealth}/10`);
  console.log(`- Execution Team: ${finalState.thesis?.scores.executionTeam}/10`);
  console.log(`- Competitive Moat: ${finalState.thesis?.scores.competitiveMoat}/10`);
  console.log(`- Risk Level: ${finalState.thesis?.scores.riskLevel}/10`);
  
  console.log(`SWOT:`);
  const top2Strengths = finalState.swot?.strengths.slice(0, 2).map((s: any) => s.point).join(', ');
  const top2Weaknesses = finalState.swot?.weaknesses.slice(0, 2).map((s: any) => s.point).join(', ');
  const top2Opps = finalState.swot?.opportunities.slice(0, 2).map((s: any) => s.point).join(', ');
  const top2Threats = finalState.swot?.threats.slice(0, 2).map((s: any) => s.point).join(', ');
  
  console.log(`- *Strengths*: ${top2Strengths}`);
  console.log(`- *Weaknesses*: ${top2Weaknesses}`);
  console.log(`- *Opportunities*: ${top2Opps}`);
  console.log(`- *Threats*: ${top2Threats}`);

  console.log(`Follow-up Chat Example:`);
  console.log(`- *User*: "${question}"`);
  
  const system = `You are a senior investment research analyst engaged in a follow-up conversation about a company that was just analyzed.\n\nRESEARCH STATE:\n${JSON.stringify(stripResearchStateForLLM(finalState), null, 2)}`;
  const answer = await callChat({ system, history: [{ role: 'user', content: question }] });
  
  console.log(`- *Assistant*: "${answer}"\n`);
}

async function main() {
  await runExample('Microsoft', 'What is their biggest driver of revenue growth right now?');
  await runExample('Peloton', 'Why is their financial health score low?');
}
main().catch(console.error);
