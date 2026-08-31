import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPT, MAX_RETRIES, API_KEY_STORAGE_KEY } from '../constants';
import { strudelService } from './strudelService';
import { StrudelPattern, InteractionLog } from '../types';
import { PATTERN_EFFECTS_DEMOS } from '../patternEffects';

// We use a getter to retrieve the key from storage or env
const getApiKey = () => {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || (typeof process !== 'undefined' ? process.env.API_KEY : '') || '';
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
   * Local Pattern Effects English Translator Fallback:
   * Translates plain English directives into Strudel Pattern Effects directly.
   */
  public translateLocally(userPrompt: string, currentPattern: string): StrudelPattern {
    const lower = userPrompt.toLowerCase();

    // Check if matching any workshop demo prompt closely
    const matchedDemo = PATTERN_EFFECTS_DEMOS.find(demo => 
      lower.includes(demo.id) ||
      lower.includes(demo.effectSyntax.toLowerCase()) ||
      demo.englishPrompt.toLowerCase().split(' ').filter(w => w.length > 4).every(w => lower.includes(w))
    );

    if (matchedDemo) {
      return {
        code: matchedDemo.code,
        explanation: `[Pattern Effects Engine] ${matchedDemo.explanation}`,
        visualHint: matchedDemo.visualHint,
        timestamp: Date.now()
      };
    }

    // 1. Stereo Juxtaposition: jux(rev)
    if (lower.includes('jux') || lower.includes('stereo reverse') || (lower.includes('stereo') && lower.includes('reverse'))) {
      const code = `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*8").gain(0.6),
  // Left ear plays forward, Right ear plays in reverse
  s("acid*8").n("<0 3 [5 7] [10 12]>").jux(rev).gain(0.85),
  s("~ juno ~ ~").gain(0.4)
)`;
      return {
        code,
        explanation: 'Applied stereo juxtaposition (.jux(rev)) to the acid line: left channel plays normal, right channel plays in reverse.',
        visualHint: '#00ffcc',
        timestamp: Date.now()
      };
    }

    // 2. Vowel Formant Filter: vowel("<a o e i>")
    if (lower.includes('vowel') || lower.includes('talking') || lower.includes('talkbox') || lower.includes('formant')) {
      const code = `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*8").gain(0.6),
  // Talking synth with vocal formant filter
  s("saw*8").n("<0 3 7 10 12 10 7 3>").vowel("<a o e i>").gain(0.8),
  s("sub*4").gain(0.85)
)`;
      return {
        code,
        explanation: 'Applied vocal formant filter (.vowel("<a o e i>")) to create a talking vocoder effect.',
        visualHint: '#f43f5e',
        timestamp: Date.now()
      };
    }

    // 3. Resonant Low Pass Filter Sweep: lpf(sine.range(...))
    if (lower.includes('lpf') || lower.includes('low pass') || lower.includes('filter sweep') || lower.includes('resonant sweep')) {
      const code = `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*8").gain(0.65),
  // 303 Acid line with resonant LFO low-pass filter sweep
  s("acid*16")
    .n("<0 3 5 7 10 12 10 7>")
    .lpf(sine.range(200, 3200).slow(4))
    .lpq(8)
    .gain(0.85)
)`;
      return {
        code,
        explanation: 'Applied dynamic LFO low-pass filter sweep (.lpf(sine.range(200, 3200).slow(4)).lpq(8)) with high resonance.',
        visualHint: '#10b981',
        timestamp: Date.now()
      };
    }

    // 4. Temporal Offset / Canon: off(1/16, ...)
    if (lower.includes('off') || lower.includes('canon') || lower.includes('1/16') || lower.includes('offset')) {
      const code = `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*8").gain(0.6),
  // Offset canon delayed by 1/16th cycle & transposed +4 semitones
  s("acid*8").n("<0 3 7 10>").off(1/16, x => x.add(4)).gain(0.85),
  s("~ juno ~ ~").gain(0.5)
)`;
      return {
        code,
        explanation: 'Offset the melody by 1/16th cycle (.off(1/16, x => x.add(4))) creating an interlocking melodic canon.',
        visualHint: '#a855f7',
        timestamp: Date.now()
      };
    }

    // 5. Every N Cycles: every(4, ...)
    if (lower.includes('every 4') || lower.includes('drum roll') || lower.includes('fill') || lower.includes('every(')) {
      const code = `stack(
  s("kick*4"),
  // Snare doubles speed on bar 4 for an energetic drum roll fill
  s("~ snare ~ snare").every(4, x => x.fast(2)),
  s("hat*8").every(4, x => x.fast(2)).gain(0.7),
  s("acid*8").n("<0 3 5 7>").gain(0.85)
)`;
      return {
        code,
        explanation: 'Configured drum fill (.every(4, x => x.fast(2))) to double the snare and hi-hat speed on every 4th bar.',
        visualHint: '#f59e0b',
        timestamp: Date.now()
      };
    }

    // 6. Dub Delay & Reverb Space
    if (lower.includes('delay') || lower.includes('echo') || lower.includes('reverb') || lower.includes('dub') || lower.includes('space')) {
      const code = `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*8").gain(0.6),
  // Dub chord stabs echoing into vast cavernous reverb
  s("~ juno ~ ~")
    .delay(0.6)
    .delaytime(0.25)
    .delayfeedback(0.75)
    .room(0.7)
    .gain(0.85),
  s("sub*4").gain(0.85)
)`;
      return {
        code,
        explanation: 'Added dub ping-pong delay (.delay(0.6).delaytime(0.25).delayfeedback(0.75)) and cavernous reverb (.room(0.7)).',
        visualHint: '#8b5cf6',
        timestamp: Date.now()
      };
    }

    // 7. Bitcrush & Distortion
    if (lower.includes('crush') || lower.includes('bitcrush') || lower.includes('coarse') || lower.includes('8-bit') || lower.includes('distort') || lower.includes('shape')) {
      const code = `stack(
  // Gritty 8-bit quantized drums
  s("kick*4").crush(4).coarse(3).gain(0.8),
  s("~ snare ~ snare").crush(4).coarse(3).gain(0.8),
  s("hat*8").crush(5).gain(0.55),
  s("pluck*8").n("<0 3 7 12 10 7 3 0>").gain(0.75)
)`;
      return {
        code,
        explanation: 'Bitcrushed the drums with .crush(4).coarse(3) for authentic 8-bit arcade sampler grit.',
        visualHint: '#f59e0b',
        timestamp: Date.now()
      };
    }

    // 8. Granular Chop
    if (lower.includes('chop') || lower.includes('slice') || lower.includes('stutter') || lower.includes('grain')) {
      const code = `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*8").gain(0.6),
  // 16-slice micro-gated rhythmic chop
  s("saw*4").n("<0 5 7 12>").chop(16).gain(0.8),
  s("acid*8").n("<0 3 5 7>").gain(0.8)
)`;
      return {
        code,
        explanation: 'Sliced the synth with .chop(16) into 16 micro-granular rhythmic gates.',
        visualHint: '#06b6d4',
        timestamp: Date.now()
      };
    }

    // 9. Multiplier Ratchet: ply(2)
    if (lower.includes('ply') || lower.includes('ratchet') || lower.includes('trap hat')) {
      const code = `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  // Hi-hats with dynamic 2x and 4x stutter ratchets
  s("hat*8").ply("<1 2 [2 4] 4>").gain(0.65),
  s("sub*4").gain(0.9),
  s("acid*4").n("<0 3 7 10>").gain(0.8)
)`;
      return {
        code,
        explanation: 'Subdivided hi-hat triggers with .ply("<1 2 [2 4] 4>") for dynamic trap stutter ratchets.',
        visualHint: '#e11d48',
        timestamp: Date.now()
      };
    }

    // 10. Mute Kick
    if (lower.includes('mute') && lower.includes('kick')) {
      const code = currentPattern.replace(/s\(\"kick[^\"]*\"\)[^,\n]*/g, '// [Muted Kick]');
      return {
        code: code !== currentPattern ? code : currentPattern,
        explanation: 'Muted the 909 kick drum while keeping the rest of the groove playing.',
        visualHint: '#ec4899',
        timestamp: Date.now()
      };
    }

    // 11. Unmute Kick / Drop
    if (lower.includes('unmute') || lower.includes('drop') || lower.includes('bring kick')) {
      const code = currentPattern.includes('kick') ? currentPattern : `stack(
  s("kick*4"),
  s("impact"),
  ${currentPattern.replace(/^stack\(\s*/, '')}`;
      return {
        code,
        explanation: 'Dropped the beat: unmuted the kick and triggered sub impact!',
        visualHint: '#00ffcc',
        timestamp: Date.now()
      };
    }

    // Fallback default variation
    return {
      code: currentPattern,
      explanation: `Translated English request: "${userPrompt}"`,
      visualHint: '#38bdf8',
      timestamp: Date.now()
    };
  }

  /**
   * The "Self-Healing" Loop with Local Fallback
   */
  public async generatePattern(
    userPrompt: string, 
    currentPattern: string, 
    chaos: number,
    retryCount = 0,
    currentLogId?: string
  ): Promise<StrudelPattern> {
    if (!this.ai) {
      // Use local pattern effects translator fallback when API key is not present
      console.log('[GeminiService] Using local pattern effects translator fallback');
      return this.translateLocally(userPrompt, currentPattern);
    }

    const logId = currentLogId || crypto.randomUUID();
    const isRetry = retryCount > 0;
    
    let logEntry = this.logs.find(l => l.id === logId);
    if (!logEntry) {
        logEntry = {
            id: logId,
            timestamp: Date.now(),
            userPrompt,
            chaosLevel: chaos,
            attempts: [],
            status: 'failed'
        };
        this.addLog(logEntry);
    }

    let fullPrompt = `
      Current Pattern: ${currentPattern}
      User Request: ${userPrompt}
      Chaos Level: ${chaos}/1.0
    `;

    if (isRetry) {
      const previousErrors = logEntry.attempts
        .map(a => `Attempt ${a.attemptNumber} Error: ${a.error}`)
        .join('\n');
        
      fullPrompt += `\n\nPREVIOUS ATTEMPT FAILED. 
      Errors: ${previousErrors}
      Please fix the syntax and return a valid JSON object.`;
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.7-flash',
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

      const validation = strudelService.validatePattern(result.code);

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
          // Fall back gracefully to local translator
          return this.translateLocally(userPrompt, currentPattern);
        }
      }

      logEntry.status = 'success';
      logEntry.finalCode = result.code;

      return {
        code: result.code,
        explanation: result.explanation,
        visualHint: result.visualHint,
        timestamp: Date.now()
      };

    } catch (err: any) {
      console.warn("[Gemini] API Error, using local pattern effects translator fallback:", err);
      return this.translateLocally(userPrompt, currentPattern);
    }
  }
}

export const geminiService = new GeminiService();
