// lib/langsmith/client.ts
import { Client } from 'langsmith';

/**
 * Singleton LangSmith client for accessing datasets, prompts, and experiments
 */
let langsmithClient: Client | null = null;

/**
 * Get or create LangSmith client
 */
export function getLangSmithClient(): Client {
  if (!langsmithClient) {
    const apiKey = process.env.LANGCHAIN_API_KEY;

    if (!apiKey) {
      throw new Error(
        'LANGCHAIN_API_KEY not found in environment variables. ' +
        'Please set it in .env.local to use LangSmith features.'
      );
    }

    langsmithClient = new Client({
      apiKey,
    });
  }

  return langsmithClient;
}

/**
 * Create a dataset for testing
 */
export async function createDataset(name: string, description?: string) {
  const client = getLangSmithClient();

  try {
    return await client.createDataset(name, { description });
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log(`[LangSmith] Dataset "${name}" already exists`);
      return await client.readDataset({ datasetName: name });
    }
    throw error;
  }
}

/**
 * Add example to dataset
 */
export async function addDatasetExample(
  datasetId: string,
  inputs: Record<string, any>,
  outputs?: Record<string, any>,
  metadata?: Record<string, any>
) {
  const client = getLangSmithClient();

  return await client.createExample(inputs, outputs || {}, {
    datasetId,
    metadata,
  });
}

/**
 * List all datasets
 */
export async function listDatasets() {
  const client = getLangSmithClient();
  const datasets = [];

  for await (const dataset of client.listDatasets()) {
    datasets.push(dataset);
  }

  return datasets;
}

/**
 * Get dataset by name
 */
export async function getDataset(name: string) {
  const client = getLangSmithClient();
  return await client.readDataset({ datasetName: name });
}

/**
 * List examples from a dataset
 */
export async function listDatasetExamples(datasetId: string) {
  const client = getLangSmithClient();
  const examples = [];

  for await (const example of client.listExamples({ datasetId })) {
    examples.push(example);
  }

  return examples;
}

/**
 * Delete a dataset
 */
export async function deleteDataset(datasetId: string) {
  const client = getLangSmithClient();
  return await client.deleteDataset({ datasetId });
}

/**
 * Get current user's organization/username from LangSmith
 * Note: This is no longer required for prompt uploads as the LangSmith client
 * automatically handles tenant/user association via the API key
 *
 * This function is kept for backward compatibility but now just returns
 * a placeholder value
 */
let cachedUsername: string | null = null;

export async function getLangSmithUsername(): Promise<string> {
  if (cachedUsername) {
    return cachedUsername;
  }

  // No longer required - LangSmith client handles this automatically
  cachedUsername = 'auto-detected';
  return cachedUsername;
}
