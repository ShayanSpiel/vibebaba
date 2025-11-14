// @ts-nocheck
// lib/langgraph/nodes/frontend/router.ts
import type { AppGenState } from '../../types';
import { frontendNode } from './index';

/**
 * Frontend Router - SIMPLIFIED
 * Always routes to unified Next.js generator
 * No more HTML vs Next.js routing - it's always Next.js
 */
export async function frontendRouter(state: AppGenState): Promise<Partial<AppGenState>> {
  console.log(`[Frontend Router] Framework: Next.js (always)`);
  console.log('[Frontend Router] → Routing to unified frontend node');

  return await frontendNode(state);
}
