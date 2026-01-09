import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPT, MAX_RETRIES, API_KEY_STORAGE_KEY } from '../constants';
import { strudelService } from './strudelService';
import { StrudelPattern, InteractionLog } from '../types';

// We use a getter to retrieve the key from storage or env
const getApiKey = () => {
    // In a real node env: process.env.API_KEY
    // Here we check localStorage for user convenience in a demo
    return localStorage.getItem(API_KEY_STORAGE_KEY) || process.env.API_KEY || '';
};

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private logs: InteractionLog[] = [];

  constructor() {
    const key = getApiKey();
    if (key) {
      this.ai = new GoogleGenAI({ apiKey: key });
    }
  }

  public updateKey(key: string) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  public hasKey(): boolean {
    return !!this.ai;
  }

  public getLogs(): InteractionLog[] {
    return this.logs;
  }

  private addLog(log: InteractionLog) {
    this.logs.unshift(log); // Newest first
    if (this.logs.length > 50) this.logs.pop(); // Keep last 50
  }

  /**
   * The "Self-Healing" Loop
   * 1. Generates code
   * 2. Validates locally
   * 3. If invalid, sends error back to AI for retry
   */
  public async generatePattern(
    userPrompt: string, 
    currentPattern: string, 
    chaos: number,
    retryCount = 0,
    currentLogId?: string
  ): Promise<StrudelPattern> {
    if (!this.ai) throw new Error("API Key missing");

    const logId = currentLogId || crypto.randomUUID();
    const isRetry = retryCount > 0;
    
    // Retrieve or initialize log entry
    let logEntry = this.logs.find(l => l.id === logId);
    if (!logEntry) {
        logEntry = {
            id: logId,
            timestamp: Date.now(),
            userPrompt,
            chaosLevel: chaos,
            attempts: [],
            status: 'failed' // assume failed until success
        };
        this.addLog(logEntry);
    }

    // Construct Prompt
    let fullPrompt = `
      Current Pattern: ${currentPattern}
      User Request: ${userPrompt}
      Chaos Level: ${chaos}/1.0
    `;

    if (isRetry) {
      // Get previous errors from the log
      const previousErrors = logEntry.attempts
        .map(a => `Attempt ${a.attemptNumber} Error: ${a.error}`)
        .join('\n');
        
      fullPrompt += `\n\nPREVIOUS ATTEMPT FAILED. 
      Errors: ${previousErrors}
      Please fix the syntax and return a valid JSON object.`;
    }

    console.log(`[Gemini] Generating (Attempt ${retryCount + 1})...`);

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: fullPrompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              code: { type: Type.STRING },
              visualHint: { type: Type.STRING }
            },
            required: ["explanation", "code", "visualHint"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) throw new Error("Empty response from AI");

      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error("Failed to parse JSON response");
      }

      // Step 2: Validate
      const validation = strudelService.validatePattern(result.code);

      // Log the attempt
      logEntry.attempts.push({
          attemptNumber: retryCount + 1,
          generatedCode: result.code,
          isValid: validation.isValid,
          error: validation.error?.message
      });

      if (!validation.isValid) {
        if (retryCount < MAX_RETRIES) {
          console.warn(`[Gemini] Validation failed: ${validation.error?.message}. Retrying...`);
          return this.generatePattern(
            userPrompt,
            currentPattern,
            chaos,
            retryCount + 1,
            logId
          );
        } else {
          throw new Error(`Failed to generate valid code after ${MAX_RETRIES} attempts. Last error: ${validation.error?.message}`);
        }
      }

      // Success
      logEntry.status = 'success';
      logEntry.finalCode = result.code;

      return {
        code: result.code,
        explanation: result.explanation,
        visualHint: result.visualHint,
        timestamp: Date.now()
      };

    } catch (err: any) {
      console.error("[Gemini] API Error", err);
      // Log generic error if not handled above
      if (logEntry && logEntry.attempts.length === retryCount) {
         logEntry.attempts.push({
             attemptNumber: retryCount + 1,
             generatedCode: '',
             isValid: false,
             error: err.message
         });
      }
      throw err;
    }
  }
}

export const geminiService = new GeminiService();
