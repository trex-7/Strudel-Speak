import { MAX_RETRIES, API_KEY_STORAGE_KEY } from '../constants';
import { strudelService } from './strudelService';
import { StrudelPattern, InteractionLog, LineDiagnosisRequest, LineDiagnosisResponse, BatchTrackFixRequest, BatchTrackFixResponse } from '../types';
import { PATTERN_EFFECTS_DEMOS } from '../patternEffects';
import { learningMemoryService } from './learningMemoryService';

const getCustomKey = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
};

export class GeminiService {
  private serverHasKey: boolean = false;
  private logs: InteractionLog[] = [];

  constructor() {
    this.checkServerStatus();
  }

  public async checkServerStatus(): Promise<boolean> {
    try {
      const res = await fetch('/api/gemini/status');
      if (res.ok) {
        const data = await res.json();
        this.serverHasKey = Boolean(data.configured);
        return this.serverHasKey;
      }
    } catch {
      // Server not reachable or in static mode
      this.serverHasKey = false;
    }
    return false;
  }

  public updateKey(key: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
    }
  }

  public hasKey(): boolean {
    return this.serverHasKey || Boolean(getCustomKey());
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
  s("acid*8").n("<0 3 [5 7] [10 12]>").clip(1).cut(1).jux(rev).gain(0.85),
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
  s("sub*4").clip(1).cut(1).gain(0.85)
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
    .clip(1).cut(1)
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
  s("acid*8").n("<0 3 7 10>").clip(1).cut(1).off(1/16, x => x.add(4)).gain(0.85),
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
  s("acid*8").n("<0 3 5 7>").clip(1).cut(1).gain(0.85)
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
  s("sub*4").clip(1).cut(1).gain(0.85)
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
  s("acid*8").n("<0 3 5 7>").clip(1).cut(1).gain(0.8)
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
  s("sub*4").clip(1).cut(1).gain(0.9),
  s("acid*4").n("<0 3 7 10>").clip(1).cut(1).gain(0.8)
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
   * The "Self-Healing" Loop with Server-Side Gemini API & Local Fallback
   */
  public async generatePattern(
    userPrompt: string, 
    currentPattern: string, 
    chaos: number,
    retryCount = 0,
    currentLogId?: string
  ): Promise<StrudelPattern> {
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

    const learnedRules = learningMemoryService.getPromptLearningContext();
    const customKey = getCustomKey();

    let previousErrors = '';
    if (isRetry) {
      previousErrors = logEntry.attempts
        .map(a => `Attempt ${a.attemptNumber} Error: ${a.error}`)
        .join('\n');
    }

    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt,
          currentPattern,
          chaos,
          customKey: customKey || undefined,
          learnedRules,
          previousErrors: previousErrors || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate pattern`);
      }

      const result = await response.json();
      if (!result || typeof result.code !== 'string') {
        throw new Error('Invalid response structure from AI backend');
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
          console.warn(`[Gemini] Validation failed: ${validation.error?.message}. Retrying self-healing...`);
          return this.generatePattern(
            userPrompt,
            currentPattern,
            chaos,
            retryCount + 1,
            logId
          );
        } else {
          return this.translateLocally(userPrompt, currentPattern);
        }
      }

      logEntry.status = 'success';
      logEntry.finalCode = result.code;

      return {
        code: result.code,
        explanation: result.explanation || `Generated groove with ${userPrompt}`,
        visualHint: result.visualHint || '#00ffcc',
        timestamp: Date.now()
      };

    } catch (err: any) {
      console.warn('[GeminiService] Server API error, using local pattern effects translator fallback:', err);
      return this.translateLocally(userPrompt, currentPattern);
    }
  }

  /**
   * Local surgical line fixer fallback when offline or API key is absent
   */
  public diagnoseAndFixLineLocally(request: LineDiagnosisRequest): LineDiagnosisResponse {
    const { lineContent, fullPattern, issueReason, desiredOutcome } = request;
    const combinedReason = `${issueReason} ${desiredOutcome || ''}`.toLowerCase();
    const originalLineTrimmed = lineContent.trim();
    let fixedLine = lineContent;
    let diagnosis = 'Analyzed line syntax and pattern semantics.';
    let explanation = 'Applied surgical pattern correction.';
    let suggestedTag = 'line-fix';

    // 1. Silent / numeric sample names (e.g. 808, 909, 303)
    if (/s\(\s*["'][0-9]+[^"']*["']\s*\)/.test(lineContent) || combinedReason.includes('sound') || combinedReason.includes('silent') || combinedReason.includes('808') || combinedReason.includes('909')) {
      if (lineContent.includes('808') || combinedReason.includes('sub') || combinedReason.includes('bass')) {
        fixedLine = lineContent.replace(/["']808([^"']*)["']/, '"sub$1"');
        diagnosis = 'Numeric sample name "808" caused silence; replaced with valid Strudel instrument "sub".';
        explanation = 'Switched to valid 808-style "sub" sample with calibrated resonance.';
        suggestedTag = 'sound-name';
      } else if (lineContent.includes('909') || combinedReason.includes('kick')) {
        fixedLine = lineContent.replace(/["']909([^"']*)["']/, '"kick$1"');
        diagnosis = 'Numeric sample name "909" replaced with alphabetical "kick".';
        explanation = 'Changed sample to valid 909 "kick".';
        suggestedTag = 'sound-name';
      } else if (lineContent.includes('303') || combinedReason.includes('acid')) {
        fixedLine = lineContent.replace(/["']303([^"']*)["']/, '"acid$1"');
        diagnosis = 'Numeric sample name "303" replaced with "acid".';
        explanation = 'Changed sample to TB-303 "acid" synth.';
        suggestedTag = 'sound-name';
      }
    }

    // 2. Bass Overlap / Sustain / Choke / Muddy issues
    if (
      combinedReason.includes('bass') || 
      combinedReason.includes('sustain') || 
      combinedReason.includes('overlap') || 
      combinedReason.includes('muddy') || 
      combinedReason.includes('choke') || 
      combinedReason.includes('bleed') ||
      /s\(\s*["'](?:moog|bass|analogbass|subbass|sawbass|acid|sub|sawtooth|gm_synth_bass_1)["']\s*\)/.test(lineContent)
    ) {
      if (!lineContent.includes('.clip(') && !lineContent.includes('.cut(')) {
        if (/\.s\([^)]+\)/.test(lineContent)) {
          fixedLine = lineContent.replace(/(\.s\([^)]+\))/, '$1.clip(1).cut(1)');
        } else if (/\.scale\([^)]+\)/.test(lineContent)) {
          fixedLine = lineContent.replace(/(\.scale\([^)]+\))/, '$1.clip(1).cut(1)');
        } else if (lineContent.includes('.gain(')) {
          fixedLine = lineContent.replace(/(\.gain\([^)]+\))/, '.clip(1).cut(1)$1');
        } else {
          fixedLine = `${lineContent.trimEnd()}.clip(1).cut(1)`;
        }
        diagnosis = 'Bass notes were sustaining and overlapping across steps without voice choking (.cut(1)) or step duration clipping (.clip(1)).';
        explanation = 'Enforced monophonic choking (.cut(1)) and step clipping (.clip(1)) on the bassline to eliminate muddy overlapping low-end rumble.';
        suggestedTag = 'bass-anti-overlap';
      }
    }

    // 3. jux(rev) quotes or missing rev
    if (combinedReason.includes('jux') || lineContent.includes('jux(')) {
      fixedLine = lineContent.replace(/jux\(["']?rev["']?\)/g, 'jux(rev)');
      diagnosis = 'Ensured .jux(rev) uses the unquoted function identifier for stereo inversion.';
      explanation = 'Corrected stereo juxtaposition (.jux(rev)) to properly flip channels.';
      suggestedTag = 'stereo';
    }

    // 4. Filter issues (lpf string or missing LFO)
    if (combinedReason.includes('filter') || combinedReason.includes('lpf') || combinedReason.includes('sweep')) {
      if (/lpf\(["'][^"']+["']\)/.test(lineContent) || combinedReason.includes('sweep') || combinedReason.includes('open')) {
        fixedLine = lineContent.replace(/\.lpf\([^)]+\)/, '.lpf(sine.range(200, 3200).slow(4)).lpq(8)');
        if (!fixedLine.includes('.lpf')) {
          fixedLine = `${fixedLine.trimEnd()}.lpf(sine.range(200, 3200).slow(4)).lpq(8)`;
        }
        diagnosis = 'Updated static/broken filter with smooth continuous LFO resonant sweep.';
        explanation = 'Applied dynamic low-pass sweep (.lpf(sine.range(200, 3200).slow(4)).lpq(8)).';
        suggestedTag = 'dsp-filter';
      }
    }

    // 5. Volume / Harshness
    if (combinedReason.includes('loud') || combinedReason.includes('harsh') || combinedReason.includes('quiet') || combinedReason.includes('gain')) {
      if (lineContent.includes('.gain(')) {
        fixedLine = lineContent.replace(/\.gain\([0-9.]+\)/, combinedReason.includes('quiet') ? '.gain(0.95)' : '.gain(0.65)');
      } else {
        fixedLine = `${lineContent.trimEnd()}.gain(0.7)`;
      }
      diagnosis = 'Recalibrated signal gain level for balanced mix headroom.';
      explanation = 'Adjusted track gain to prevent clipping.';
      suggestedTag = 'gain';
    }

    // 6. Rhythm / Speed / Ratchet
    if (combinedReason.includes('fast') || combinedReason.includes('slow') || combinedReason.includes('speed') || combinedReason.includes('rhythm')) {
      if (combinedReason.includes('fast') || combinedReason.includes('double')) {
        if (lineContent.includes('*')) {
          fixedLine = lineContent.replace(/\*(\d+)/, (_, n) => `*${parseInt(n, 10) * 2}`);
        } else {
          fixedLine = `${lineContent.trimEnd()}.fast(2)`;
        }
        diagnosis = 'Accelerated pattern subdivisions.';
        explanation = 'Doubled rhythm trigger frequency.';
        suggestedTag = 'rhythm';
      } else if (combinedReason.includes('slow') || combinedReason.includes('half')) {
        fixedLine = `${lineContent.trimEnd()}.slow(2)`;
        diagnosis = 'Decelerated pattern cycle rate.';
        explanation = 'Halved pattern speed with .slow(2).';
        suggestedTag = 'rhythm';
      }
    }

    // 7. Generic syntax cleanup
    if (fixedLine === lineContent && (combinedReason.includes('syntax') || combinedReason.includes('error') || combinedReason.includes('broken'))) {
      fixedLine = lineContent.replace(/,\s*,/g, ',').replace(/\(\s*\)/g, '()');
      diagnosis = 'Repaired syntax delimiters and closures.';
      explanation = 'Fixed punctuation and method chaining.';
      suggestedTag = 'syntax';
    }

    // Replace line in full pattern
    const lines = fullPattern.split('\n');
    if (request.lineIndex >= 0 && request.lineIndex < lines.length) {
      lines[request.lineIndex] = fixedLine;
    } else {
      const idx = lines.findIndex(l => l.includes(originalLineTrimmed));
      if (idx !== -1) lines[idx] = fixedLine;
    }

    const updatedFullPattern = lines.join('\n');

    return {
      originalLine: lineContent,
      fixedLine,
      updatedFullPattern,
      diagnosis,
      explanation,
      suggestedTag,
      visualHint: '#00ffcc'
    };
  }

  /**
   * Diagnoses a specific reported line and returns the surgical fix
   */
  public async diagnoseAndFixLine(request: LineDiagnosisRequest): Promise<LineDiagnosisResponse> {
    const customKey = getCustomKey();
    const learnedRules = learningMemoryService.getPromptLearningContext();

    try {
      const response = await fetch('/api/gemini/diagnose-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          customKey: customKey || undefined,
          learnedRules
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      result.originalLine = request.lineContent;

      const validation = strudelService.validatePattern(result.updatedFullPattern);
      if (!validation.isValid) {
        console.warn('[Gemini Diagnosis] Pattern failed validation, using local diagnostics fallback');
        return this.diagnoseAndFixLineLocally(request);
      }

      return result;
    } catch (err) {
      console.warn('[Gemini Diagnosis] API error, using local diagnostics fallback:', err);
      return this.diagnoseAndFixLineLocally(request);
    }
  }

  /**
   * Local fallback for fixing multiple flagged tracks simultaneously
   */
  public diagnoseAndFixBatchLocally(request: BatchTrackFixRequest): BatchTrackFixResponse {
    let currentPattern = request.fullPattern;
    const fixedTracks: BatchTrackFixResponse['fixedTracks'] = [];

    for (const track of request.flaggedTracks) {
      const lineDiag = this.diagnoseAndFixLineLocally({
        lineIndex: track.lineIndex,
        lineContent: track.code,
        fullPattern: currentPattern,
        issueReason: track.issueReason || `Fix ${track.soundName} track sound and rhythm`,
        desiredOutcome: track.desiredOutcome
      });

      currentPattern = lineDiag.updatedFullPattern;
      fixedTracks.push({
        trackIndex: track.trackIndex,
        lineIndex: track.lineIndex,
        originalCode: track.code,
        fixedCode: lineDiag.fixedLine,
        diagnosis: lineDiag.diagnosis,
        explanation: lineDiag.explanation,
        suggestedTag: lineDiag.suggestedTag
      });
    }

    return {
      updatedFullPattern: currentPattern,
      fixedTracks,
      overallExplanation: `Surgically repaired ${fixedTracks.length} flagged track(s).`
    };
  }

  /**
   * AI batch diagnosis and surgical multi-track healing
   */
  public async diagnoseAndFixBatchTracks(request: BatchTrackFixRequest): Promise<BatchTrackFixResponse> {
    if (request.flaggedTracks.length === 0) {
      return this.diagnoseAndFixBatchLocally(request);
    }

    const customKey = getCustomKey();
    const learnedRules = learningMemoryService.getPromptLearningContext();

    try {
      const response = await fetch('/api/gemini/diagnose-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          customKey: customKey || undefined,
          learnedRules
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json() as BatchTrackFixResponse;

      const validation = strudelService.validatePattern(result.updatedFullPattern);
      if (!validation.isValid) {
        console.warn('[Gemini Batch Diagnosis] Validation failed, falling back to local surgical fixer');
        return this.diagnoseAndFixBatchLocally(request);
      }

      return result;
    } catch (err) {
      console.warn('[Gemini Batch Diagnosis] Error, falling back to local fixer:', err);
      return this.diagnoseAndFixBatchLocally(request);
    }
  }
}

export const geminiService = new GeminiService();
