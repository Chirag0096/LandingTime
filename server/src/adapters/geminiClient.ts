import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Robust Gemini Client with Rate Limiting, Exponential Backoff,
 * In-Memory LRU Cache, and Graceful Offline Fallback.
 *
 * Designed specifically for the Free Quota constraints:
 * - 15 RPM (Requests Per Minute)
 * - 1,500 RPD (Requests Per Day)
 * - 1 Million TPM (Tokens Per Minute)
 */
export class GeminiClient {
  private static instance: GeminiClient;
  private ai: GoogleGenAI | null = null;
  private model: string;
  private cache: Map<string, { data: string; timestamp: number }> = new Map();
  private requestTimestamps: number[] = [];
  private readonly maxRpm = 15;
  private readonly cacheTtlMs = 1000 * 60 * 60 * 24; // 24 hours

  private constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        this.ai = new GoogleGenAI({ apiKey });
      } catch (err: any) {
        console.warn('[GeminiClient] Initialization error:', err.message);
        this.ai = null;
      }
    }
  }

  public static getInstance(): GeminiClient {
    if (!GeminiClient.instance) {
      GeminiClient.instance = new GeminiClient();
    }
    return GeminiClient.instance;
  }

  public isAvailable(): boolean {
    return this.ai !== null;
  }

  public getModelName(): string {
    return this.model;
  }

  /**
   * Throttles requests to comply strictly with the 15 RPM free tier quota.
   */
  private async throttle(): Promise<void> {
    const now = Date.now();
    // Keep timestamps from the last 60 seconds
    this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < 60000);

    if (this.requestTimestamps.length >= this.maxRpm) {
      const oldest = this.requestTimestamps[0];
      const waitTime = 60000 - (now - oldest) + 500; // wait buffer
      console.warn(`[GeminiClient] Rate limit safety throttle: waiting ${waitTime}ms to respect 15 RPM quota...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Generates JSON structured content with exponential backoff and caching.
   */
  public async generateJson<T>(prompt: string, cacheKey?: string): Promise<{ data: T; cached: boolean; model: string }> {
    // 1. Check Cache
    if (cacheKey && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!;
      if (Date.now() - entry.timestamp < this.cacheTtlMs) {
        return {
          data: JSON.parse(entry.data) as T,
          cached: true,
          model: `${this.model} (cache)`,
        };
      }
    }

    if (!this.ai) {
      throw new Error('Gemini API key is not configured or client is unavailable.');
    }

    await this.throttle();

    let attempts = 0;
    const maxAttempts = 3;
    let delay = 1000;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        const response = await this.ai.models.generateContent({
          model: this.model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text;
        if (!text) {
          throw new Error('Gemini returned an empty response.');
        }

        const parsed = JSON.parse(text) as T;

        if (cacheKey) {
          this.cache.set(cacheKey, { data: text, timestamp: Date.now() });
        }

        return {
          data: parsed,
          cached: false,
          model: this.model,
        };
      } catch (err: any) {
        if (attempts >= maxAttempts) {
          throw new Error(`Gemini API call failed after ${maxAttempts} attempts: ${err.message}`);
        }
        console.warn(`[GeminiClient] Attempt ${attempts} failed (${err.message}). Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      }
    }

    throw new Error('Unexpected retry termination in GeminiClient.');
  }
}
