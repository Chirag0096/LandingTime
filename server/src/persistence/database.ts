import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { CookingSession, Recipe, SubstitutionRecord } from '../domain/types.ts';

/**
 * SQLite persistence manager for Landing Time kitchen orchestration.
 * Handles sessions, recipe catalog storage, and pantry substitution records.
 */
export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
  }

  /**
   * Initializes all required database tables if they do not already exist.
   */
  public initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        version INTEGER NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS substitutions (
        id TEXT PRIMARY KEY,
        missing_ingredient TEXT NOT NULL,
        data TEXT NOT NULL
      );
    `);
  }

  /**
   * Saves or overwrites a cooking session.
   */
  public saveSession(session: CookingSession): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sessions (session_id, status, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    stmt.run(
      session.sessionId,
      session.status,
      JSON.stringify(session),
      session.createdAt || now,
      session.updatedAt || now
    );
  }

  /**
   * Retrieves a cooking session by ID, or null if not found.
   */
  public getSession(sessionId: string): CookingSession | null {
    const stmt = this.db.prepare(`
      SELECT data FROM sessions WHERE session_id = ?
    `);
    const row = stmt.get(sessionId) as { data: string } | undefined;
    if (!row) {
      return null;
    }
    return JSON.parse(row.data) as CookingSession;
  }

  /**
   * Updates an existing session, or inserts if not yet present.
   */
  public updateSession(session: CookingSession): void {
    const stmt = this.db.prepare(`
      UPDATE sessions
      SET status = ?, data = ?, updated_at = ?
      WHERE session_id = ?
    `);

    const now = new Date().toISOString();
    const updatedSession = { ...session, updatedAt: now };
    const result = stmt.run(
      updatedSession.status,
      JSON.stringify(updatedSession),
      now,
      updatedSession.sessionId
    );

    if (result.changes === 0) {
      this.saveSession(updatedSession);
    }
  }

  /**
   * Deletes a session by session ID.
   */
  public deleteSession(sessionId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM sessions WHERE session_id = ?
    `);
    stmt.run(sessionId);
  }

  /**
   * Lists lightweight metadata for all sessions.
   */
  public listSessions(): { sessionId: string; status: string; createdAt: string }[] {
    const stmt = this.db.prepare(`
      SELECT session_id as sessionId, status, created_at as createdAt
      FROM sessions
      ORDER BY created_at DESC
    `);
    return stmt.all() as { sessionId: string; status: string; createdAt: string }[];
  }

  /**
   * Seeds recipe catalog records into the recipes table if not already present.
   */
  public seedRecipes(recipes: Recipe[]): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO recipes (id, version, data, created_at)
      VALUES (?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((items: Recipe[]) => {
      const now = new Date().toISOString();
      for (const recipe of items) {
        stmt.run(recipe.id, recipe.version, JSON.stringify(recipe), now);
      }
    });

    transaction(recipes);
  }

  /**
   * Seeds substitution records into the substitutions table.
   */
  public seedSubstitutions(subs: SubstitutionRecord[]): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO substitutions (id, missing_ingredient, data)
      VALUES (?, ?, ?)
    `);

    const transaction = this.db.transaction((items: SubstitutionRecord[]) => {
      for (const sub of items) {
        stmt.run(sub.id, sub.missingIngredient, JSON.stringify(sub));
      }
    });

    transaction(subs);
  }

  /**
   * Retrieves all recipes stored in the database.
   */
  public getRecipes(): Recipe[] {
    const stmt = this.db.prepare(`
      SELECT data FROM recipes
    `);
    const rows = stmt.all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data) as Recipe);
  }

  /**
   * Retrieves all substitution records stored in the database.
   */
  public getSubstitutions(): SubstitutionRecord[] {
    const stmt = this.db.prepare(`
      SELECT data FROM substitutions
    `);
    const rows = stmt.all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data) as SubstitutionRecord);
  }

  /**
   * Closes the database connection cleanly.
   */
  public close(): void {
    this.db.close();
  }
}
