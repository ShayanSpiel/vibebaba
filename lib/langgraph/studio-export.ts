// lib/langgraph/studio-export.ts
/**
 * Export for LangGraph Studio
 * This file exports the compiled graphs in a format that LangGraph Studio can consume
 */

import { createAppGenWorkflow } from './workflow';

// Export the main app generation workflow
export const appGeneratorGraph = createAppGenWorkflow();

// Default export for LangGraph Studio
export default appGeneratorGraph;