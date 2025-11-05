/**
 * Session Context Manager
 * Tracks full user journey: Plan → Prototype → Edit
 */

import { getMemoryService } from './memory-service';

export interface SessionState {
  sessionId: string;
  userId: string;
  projectId?: string;
  phase: 'planning' | 'prototyping' | 'editing' | 'completed';
  startTime: number;
  lastActivity: number;
}

export class SessionContextManager {
  private memoryService = getMemoryService();
  private activeSessions = new Map<string, SessionState>();

  /**
   * Start new session
   */
  async startSession(userId: string, phase: SessionState['phase']): Promise<string> {
    const sessionId = `session_${userId}_${Date.now()}`;

    const sessionState: SessionState = {
      sessionId,
      userId,
      phase,
      startTime: Date.now(),
      lastActivity: Date.now()
    };

    this.activeSessions.set(sessionId, sessionState);

    // Store in memory
    await this.memoryService.storeProjectContext(sessionId, {
      projectId: sessionId,
      description: `User session started: ${phase}`,
      timestamp: Date.now()
    });

    console.log(`[Session] Started: ${sessionId} (${phase})`);
    return sessionId;
  }

  /**
   * Update session phase
   */
  async updatePhase(sessionId: string, phase: SessionState['phase']): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.phase = phase;
      session.lastActivity = Date.now();

      await this.memoryService.addObservation(
        sessionId,
        `phase_transition: ${phase} at ${new Date().toISOString()}`
      );

      console.log(`[Session] Updated ${sessionId} → ${phase}`);
    }
  }

  /**
   * Link project to session
   */
  async linkProject(sessionId: string, projectId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.projectId = projectId;

      await this.memoryService.linkEntities(
        sessionId,
        `project_${projectId}`,
        'created'
      );
    }
  }

  /**
   * Get full session context
   */
  async getSessionContext(sessionId: string): Promise<{
    session: SessionState | undefined;
    userPreferences: any;
    projectContext: any;
    conversationHistory: any[];
  }> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return {
        session: undefined,
        userPreferences: null,
        projectContext: null,
        conversationHistory: []
      };
    }

    const [userPreferences, projectContext, conversationHistory] = await Promise.all([
      this.memoryService.getUserPreferences(session.userId),
      session.projectId
        ? this.memoryService.getProjectContext(session.projectId)
        : null,
      this.memoryService.getConversationHistory(sessionId)
    ]);

    return {
      session,
      userPreferences,
      projectContext,
      conversationHistory
    };
  }

  /**
   * Get or create session for user
   */
  async getOrCreateSession(userId: string, projectId?: string, phase: SessionState['phase'] = 'planning'): Promise<string> {
    // Try to find existing active session for this user/project
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId && session.projectId === projectId) {
        session.lastActivity = Date.now();
        return sessionId;
      }
    }

    // Create new session
    const sessionId = await this.startSession(userId, phase);
    if (projectId) {
      await this.linkProject(sessionId, projectId);
    }
    return sessionId;
  }

  /**
   * Close session
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.phase = 'completed';
      await this.updatePhase(sessionId, 'completed');
      this.activeSessions.delete(sessionId);
      console.log(`[Session] Closed: ${sessionId}`);
    }
  }

  /**
   * Cleanup old sessions (older than 24 hours)
   */
  cleanupOldSessions(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity > maxAge) {
        this.activeSessions.delete(sessionId);
        console.log(`[Session] Cleaned up old session: ${sessionId}`);
      }
    }
  }
}

// Singleton
let sessionManagerInstance: SessionContextManager | null = null;

export function getSessionContextManager(): SessionContextManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionContextManager();

    // Run cleanup every hour
    setInterval(() => {
      sessionManagerInstance?.cleanupOldSessions();
    }, 60 * 60 * 1000);
  }
  return sessionManagerInstance;
}
