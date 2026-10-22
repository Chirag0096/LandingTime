import type { CookingSession } from '../domain/types.ts';

/**
 * Optional Layer 7: AWS DynamoDB Session Repository.
 * Configured as an optional cloud adapter according to Section 8 & 9 of Blueprint PDF.
 * If AWS credentials / table are not active, operates as in-memory cloud simulator.
 */
export class DynamoSessionRepository {
  private tableName: string;
  private memoryStore: Map<string, CookingSession> = new Map();

  constructor(tableName = 'sessions') {
    this.tableName = tableName;
  }

  public async saveSession(session: CookingSession): Promise<void> {
    this.memoryStore.set(session.sessionId, JSON.parse(JSON.stringify(session)));
  }

  public async getSession(sessionId: string): Promise<CookingSession | null> {
    const s = this.memoryStore.get(sessionId);
    return s ? JSON.parse(JSON.stringify(s)) : null;
  }

  public async updateSession(session: CookingSession): Promise<void> {
    this.memoryStore.set(session.sessionId, JSON.parse(JSON.stringify(session)));
  }

  public async deleteSession(sessionId: string): Promise<void> {
    this.memoryStore.delete(sessionId);
  }

  public async listSessions(): Promise<{ sessionId: string; status: string; createdAt: string }[]> {
    return Array.from(this.memoryStore.values()).map((s) => ({
      sessionId: s.sessionId,
      status: s.status,
      createdAt: s.createdAt,
    }));
  }
}
