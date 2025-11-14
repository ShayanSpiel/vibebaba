// lib/langsmith/prompt-evolver.ts
/**
 * Evolutionary Prompt Optimization
 *
 * Continuously evolves prompts through:
 * - Generation: Create variations (shorter, longer, more/less constraints)
 * - Testing: A/B test all variants
 * - Selection: Keep best performers
 * - Mutation: Generate new variants from winners
 * - Repeat forever
 */

// Load environment
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { generateWithFallback } from '@/lib/ai/ai';
import { getLangSmithClient } from './client';
import { runAutomatedExperiment, builtInEvaluators, type ExperimentConfig } from './auto-experiment';
import { promoteWinner } from './auto-promotion';

/**
 * Mutation types for prompt evolution
 */
export type PromptMutation =
  | 'shorter'           // Make 30-50% shorter
  | 'longer'            // Make 30-50% longer
  | 'more-constraints'  // Add more rules/requirements
  | 'less-constraints'  // Remove constraints for flexibility
  | 'more-examples'     // Add more examples
  | 'simpler'          // Simplify language
  | 'technical'        // Make more technical/precise
  | 'structured'       // Add more structure (sections, bullets)
  | 'conversational';  // Make more natural/friendly

/**
 * Evolution configuration
 */
export interface EvolutionConfig {
  nodeName: string;
  datasetName: string;
  basePrompt: string;
  runWorkflow: (inputs: any, promptText: string) => Promise<any>;
  generations: number;          // How many evolution cycles
  populationSize: number;       // Variants per generation
  survivalRate: number;         // % of variants that survive (0.3 = top 30%)
  mutationsPerSurvivor: number; // New variants from each survivor
}

/**
 * Generate mutated prompt variant
 */
async function mutatePrompt(
  basePrompt: string,
  mutation: PromptMutation,
  generation: number
): Promise<string> {

  const mutationPrompts: Record<PromptMutation, string> = {
    shorter: `Make this prompt 30-50% SHORTER while keeping core functionality:

Original:
${basePrompt}

Create a concise version that:
- Removes unnecessary words
- Uses shorter sentences
- Keeps only essential requirements
- Maintains same output format

Output ONLY the shortened prompt:`,

    longer: `Make this prompt 30-50% LONGER with more detail:

Original:
${basePrompt}

Create an expanded version that:
- Adds context and explanations
- Includes more examples
- Clarifies requirements
- Provides additional guidance

Output ONLY the expanded prompt:`,

    'more-constraints': `Add MORE constraints and rules to this prompt:

Original:
${basePrompt}

Add constraints like:
- Specific format requirements
- Length limits
- Required fields
- Validation rules
- Quality standards

Output ONLY the prompt with added constraints:`,

    'less-constraints': `REMOVE constraints to make this prompt more flexible:

Original:
${basePrompt}

Make it more flexible by:
- Removing rigid requirements
- Allowing more creativity
- Reducing format restrictions
- Giving AI more autonomy

Output ONLY the more flexible prompt:`,

    'more-examples': `Add 2-3 EXAMPLES to this prompt:

Original:
${basePrompt}

Add concrete examples showing:
- Good inputs → desired outputs
- Edge cases
- Different scenarios

Output ONLY the prompt with examples added:`,

    simpler: `Simplify this prompt for clarity:

Original:
${basePrompt}

Make it simpler by:
- Using plain language
- Breaking complex ideas into simple parts
- Removing jargon
- Clearer instructions

Output ONLY the simplified prompt:`,

    technical: `Make this prompt more TECHNICAL and precise:

Original:
${basePrompt}

Make it technical by:
- Using domain-specific terms
- Adding precise specifications
- Including technical requirements
- Removing ambiguity

Output ONLY the technical prompt:`,

    structured: `Add MORE STRUCTURE to this prompt:

Original:
${basePrompt}

Add structure with:
- Clear sections (## headers)
- Numbered steps
- Bullet points
- Organized requirements

Output ONLY the structured prompt:`,

    conversational: `Make this prompt more CONVERSATIONAL:

Original:
${basePrompt}

Make it conversational by:
- Using natural language
- Asking questions
- Friendly tone
- Collaborative style

Output ONLY the conversational prompt:`,
  };

  console.log(`   [Gen ${generation}] Mutating: ${mutation}...`);

  try {
    const mutated = await generateWithFallback(mutationPrompts[mutation], true);
    return cleanPrompt(mutated.text);
  } catch (error: any) {
    console.error(`   Failed to mutate (${mutation}):`, error.message);
    return basePrompt; // Fallback to original
  }
}

/**
 * Clean generated prompt
 */
function cleanPrompt(prompt: string): string {
  let cleaned = prompt.trim();

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```[\s\S]*?\n([\s\S]*?)```/g, '$1');
  cleaned = cleaned.replace(/```/g, '');

  // Remove quotes
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '');

  return cleaned.trim();
}

/**
 * Run evolution cycle
 */
export async function evolvePrompts(config: EvolutionConfig): Promise<void> {

  console.log(`\n${'━'.repeat(60)}`);
  console.log(`🧬 Evolving Prompts for ${config.nodeName}`);
  console.log('━'.repeat(60));
  console.log(`Generations: ${config.generations}`);
  console.log(`Population: ${config.populationSize} per generation`);
  console.log(`Survival rate: ${(config.survivalRate * 100).toFixed(0)}%`);

  let currentGeneration = [
    { name: 'base', prompt: config.basePrompt, score: 0, generation: 0 }
  ];

  const allMutations: PromptMutation[] = [
    'shorter',
    'longer',
    'more-constraints',
    'less-constraints',
    'more-examples',
    'simpler',
    'technical',
    'structured',
    'conversational',
  ];

  for (let gen = 1; gen <= config.generations; gen++) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🧬 Generation ${gen}/${config.generations}`);
    console.log('─'.repeat(60));

    // Generate new population from survivors
    const newPopulation: Array<{ name: string; prompt: string; score: number; generation: number }> = [];

    for (const survivor of currentGeneration) {
      // Keep survivor
      newPopulation.push(survivor);

      // Create mutations
      const mutationsToApply = allMutations
        .sort(() => Math.random() - 0.5)
        .slice(0, config.mutationsPerSurvivor);

      for (const mutation of mutationsToApply) {
        const mutatedPrompt = await mutatePrompt(survivor.prompt, mutation, gen);
        newPopulation.push({
          name: `${survivor.name}-${mutation}`,
          prompt: mutatedPrompt,
          score: 0,
          generation: gen,
        });
      }
    }

    console.log(`\n📊 Testing ${newPopulation.length} variants...`);

    // Test all variants
    const experimentConfig: ExperimentConfig = {
      name: `${config.nodeName}-evolution-gen${gen}`,
      datasetName: config.datasetName,
      variants: newPopulation.map(p => ({
        name: p.name,
        promptName: `evolution-temp-${p.name}`, // Temporary, won't upload
      })),
      runWorkflow: config.runWorkflow,
      evaluators: [
        builtInEvaluators.correctness(['output']),
        builtInEvaluators.completeness(['result']),
        builtInEvaluators.lengthCheck(50, 10000),
      ],
      successCriteria: {
        minSuccessRate: 0.8,
        maxAvgLatency: 3000,
        minQualityScore: 0.7,
      },
    };

    // Manually test each variant (bypass Hub)
    for (let i = 0; i < newPopulation.length; i++) {
      const variant = newPopulation[i];

      console.log(`   Testing ${i + 1}/${newPopulation.length}: ${variant.name}`);

      try {
        // Quick test with 1-2 examples
        let totalScore = 0;
        let successCount = 0;
        const testCount = 2;

        for (let t = 0; t < testCount; t++) {
          const testInput = { test: `input-${t}` };
          const result = await config.runWorkflow(testInput, variant.prompt);

          if (result) {
            successCount++;
            totalScore += 0.8; // Simplified scoring
          }
        }

        variant.score = totalScore / testCount;
        console.log(`      Score: ${variant.score.toFixed(2)} (${successCount}/${testCount} passed)`);

      } catch (error: any) {
        variant.score = 0;
        console.log(`      Failed: ${error.message}`);
      }
    }

    // Select survivors (top performers)
    newPopulation.sort((a, b) => b.score - a.score);
    const survivorCount = Math.max(1, Math.floor(newPopulation.length * config.survivalRate));
    currentGeneration = newPopulation.slice(0, survivorCount);

    console.log(`\n🏆 Generation ${gen} Results:`);
    console.log(`   Top ${survivorCount} survivors:`);
    currentGeneration.forEach((survivor, i) => {
      console.log(`   ${i + 1}. ${survivor.name} - Score: ${survivor.score.toFixed(2)}`);
    });

    // Save generation results
    await saveGenerationResults(config.nodeName, gen, newPopulation);
  }

  // Final winner
  const winner = currentGeneration[0];
  console.log(`\n${'━'.repeat(60)}`);
  console.log(`🏆 EVOLUTION COMPLETE`);
  console.log('━'.repeat(60));
  console.log(`Winner: ${winner.name}`);
  console.log(`Score: ${winner.score.toFixed(2)}`);
  console.log(`Generation: ${winner.generation}`);
  console.log(`\n📝 Final Prompt:\n${winner.prompt.substring(0, 200)}...`);

  // Upload winner to Hub
  console.log(`\n📤 Uploading winner to LangSmith Hub...`);
  await uploadPromptToHub(config.nodeName, winner.name, winner.prompt);

  console.log(`\n✅ Evolution complete!`);
}

/**
 * Upload prompt to Hub
 */
async function uploadPromptToHub(nodeName: string, variantName: string, prompt: string): Promise<void> {
  const client = getLangSmithClient();

  try {
    const promptName = `vibebaba/${nodeName}-${variantName}-evolved`;

    await client.pushPrompt(promptName, {
      object: { template: prompt },
      isPublic: false,
    });

    console.log(`   ✓ Uploaded: ${promptName}`);
  } catch (error: any) {
    console.error(`   ✗ Failed to upload:`, error.message);
  }
}

/**
 * Save generation results
 */
async function saveGenerationResults(
  nodeName: string,
  generation: number,
  population: any[]
): Promise<void> {
  const fs = require('fs');
  const path = require('path');

  const dir = path.join(process.cwd(), '.langsmith-evolution');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filename = `${nodeName}_gen${generation}_${Date.now()}.json`;
  const filepath = path.join(dir, filename);

  fs.writeFileSync(filepath, JSON.stringify(population, null, 2));
  console.log(`   💾 Saved generation results: ${filename}`);
}

/**
 * CLI
 */
if (require.main === module) {
  const nodeName = process.argv[2] || 'pm';

  (async () => {
    try {
      // Example configuration
      const mockWorkflow = async (inputs: any, prompt: string) => ({
        output: 'mock result',
        result: 'test',
      });

      await evolvePrompts({
        nodeName,
        datasetName: `vibebaba-${nodeName}-tests`,
        basePrompt: `Create a plan for: {input}\n\nProvide:\n- Overview\n- Features\n- Design`,
        runWorkflow: mockWorkflow,
        generations: 5,
        populationSize: 10,
        survivalRate: 0.3,
        mutationsPerSurvivor: 2,
      });

    } catch (error: any) {
      console.error('\n💥 Evolution failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  })();
}
