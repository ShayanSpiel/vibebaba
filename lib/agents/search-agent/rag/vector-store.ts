/**
 * SEARCH AGENT - VECTOR STORE
 *
 * Semantic search for code using embeddings
 */

// FIXME: MemoryVectorStore export location changed in LangChain v1.0+
// Need to update to new import path or use alternative vector store
// import { MemoryVectorStore } from "@langchain/core/vectorstores";
import { OpenAIEmbeddings } from '@langchain/openai';
import type { CodeChunk, ExtractedCode, SemanticSearchResult } from '../types';

/**
 * Code vector store for semantic search
 */
export class CodeVectorStore {
  private store: any | null = null; // FIXME: Update type when vector store import is fixed
  private embeddings: OpenAIEmbeddings | null = null;
  private initialized = false;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.embeddings = new OpenAIEmbeddings({
        modelName: 'text-embedding-3-small',
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Initialize vector store
   */
  private async ensureInitialized(): Promise<boolean> {
    if (this.initialized) return true;

    if (!this.embeddings) {
      console.warn('[VectorStore] OpenAI API key not set - semantic search disabled');
      return false;
    }

    try {
      // FIXME: Temporarily disabled until MemoryVectorStore import is fixed
      // this.store = new MemoryVectorStore(this.embeddings);
      // this.initialized = true;
      console.log(
        '[VectorStore] ⚠️ Initialization temporarily disabled - awaiting LangChain update'
      );
      return false; // Return false to indicate vector store is not available
    } catch (error) {
      console.error('[VectorStore] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Index code for semantic search
   */
  async indexCode(code: ExtractedCode[]): Promise<void> {
    const initialized = await this.ensureInitialized();
    if (!initialized || !this.store) {
      console.warn('[VectorStore] Skipping indexing - not initialized');
      return;
    }

    try {
      const documents = code.map((c) => ({
        pageContent: `${c.path}\n\n${c.content}`,
        metadata: {
          repo: c.repo,
          path: c.path,
          language: c.language,
          size: c.size,
        },
      }));

      await this.store.addDocuments(documents);
      console.log(`[VectorStore] Indexed ${code.length} code files`);
    } catch (error) {
      console.error('[VectorStore] Failed to index code:', error);
    }
  }

  /**
   * Semantic search for code
   */
  async semanticSearch(query: string, k: number = 5): Promise<SemanticSearchResult[]> {
    const initialized = await this.ensureInitialized();
    if (!initialized || !this.store) {
      console.warn('[VectorStore] Semantic search not available');
      return [];
    }

    try {
      const results = await this.store.similaritySearchWithScore(query, k);

      return results.map(([doc, score], index) => ({
        chunk: {
          id: `${doc.metadata.repo}:${doc.metadata.path}`,
          repo: doc.metadata.repo,
          path: doc.metadata.path,
          content: doc.pageContent,
          language: doc.metadata.language,
          startLine: 0,
          endLine: 0,
          metadata: doc.metadata,
        },
        score,
        rank: index + 1,
      }));
    } catch (error) {
      console.error('[VectorStore] Semantic search failed:', error);
      return [];
    }
  }

  /**
   * Clear vector store
   */
  async clear(): Promise<void> {
    this.store = null;
    this.initialized = false;
    console.log('[VectorStore] Cleared');
  }
}

// Singleton instance
let vectorStoreInstance: CodeVectorStore | null = null;

export function getCodeVectorStore(): CodeVectorStore {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new CodeVectorStore();
  }
  return vectorStoreInstance;
}
