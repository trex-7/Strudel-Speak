import { OpenRouter } from "@openrouter/sdk";
import { SYSTEM_PROMPT, MAX_RETRIES, API_KEY_STORAGE_KEY } from '../constants';
import { strudelService } from './strudelService';
import { sampleService } from './sampleService';
import { StrudelPattern, InteractionLog } from '../types';

// We use a getter to retrieve the key from env, then storage
const getApiKey = () => {
    // First check environment variables (server-side safe)
    const envKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (envKey) return envKey;

    // Then check localStorage for user convenience (client-side only)
    if (typeof window !== 'undefined') {
        return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
    }

    return '';
};

export class OpenRouterService {
  private ai: OpenRouter | null = null;
  private logs: InteractionLog[] = [];

  constructor() {
    const key = getApiKey();
    if (key) {
      this.ai = new OpenRouter({ apiKey: key });
    }
  }

  public updateKey(key: string) {
    // Only store in localStorage if no environment variable is set
    const hasEnvKey = !!(process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY);
    if (!hasEnvKey && typeof window !== 'undefined') {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
    }
    this.ai = new OpenRouter({ apiKey: key });
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
    model: string = "anthropic/claude-3.5-sonnet",
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
            model,
            attempts: [],
            status: 'failed' // assume failed until success
        };
        this.addLog(logEntry);
    }

    // Construct Prompt
    const sampleSchema = sampleService.getSampleSchema();
    let fullPrompt = `
      ${sampleSchema}
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

    console.log(`[OpenRouter] Generating with ${model} (Attempt ${retryCount + 1})...`);
    console.log(`[OpenRouter] Request params:`, {
      model: model,
      prompt: `${SYSTEM_PROMPT}\n\n${fullPrompt}`.substring(0, 200) + '...'
    });

    try {
      // Try using direct HTTP request to bypass SDK issues
      console.log(`[OpenRouter] Using direct HTTP request...`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getApiKey()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'StrudelSpeak'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT
            },
            {
              role: "user",
              content: fullPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const completion = await response.json();
      console.log(`[OpenRouter] Raw completion response:`, completion);
      const responseText = completion.choices?.[0]?.message?.content;

      if (!responseText) throw new Error("Empty response from AI");

      let result: any;
      try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : responseText;
        result = JSON.parse(jsonText);
      } catch (e) {
        throw new Error(`Failed to parse JSON response: ${responseText}`);
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
          console.warn(`[OpenRouter] Validation failed: ${validation.error?.message}. Retrying...`);
          return this.generatePattern(
            userPrompt,
            currentPattern,
            chaos,
            model,
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
      console.error("[OpenRouter] API Error", err);
      console.error("[OpenRouter] Error details:", {
        message: err.message,
        stack: err.stack,
        cause: err.cause,
        response: err.response?.data,
        status: err.response?.status
      });
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

export const openRouterService = new OpenRouterService();