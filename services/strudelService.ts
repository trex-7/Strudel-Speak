import * as StrudelCore from '@strudel/core';
import { StrudelError } from '../types';
import { embeddedSoundBank } from './embeddedSoundBank';

// Expose core Strudel pattern combinators to global scope immediately
if (typeof window !== 'undefined') {
  const coreObj = (StrudelCore as any).default || StrudelCore;
  Object.assign(window, coreObj);
  if (!(window as any).rev) {
    (window as any).rev = (p: any) => (p && typeof p.rev === 'function' ? p.rev() : p);
  }
}

export interface CycleInfo {
  cycle: number;
  phase: number; // 0.0 to 1.0 within current cycle
  beat: number; // 1, 2, 3, or 4
  step16: number; // 0 to 15
  step8: number; // 0 to 7
  cps: number;
  bpm: number;
  isPlaying: boolean;
}

type CycleCallback = (info: CycleInfo) => void;

class StrudelService {
  private isPlaying: boolean = false;
  private currentCode: string = '';
  private cycleCallbacks: Set<CycleCallback> = new Set();
  private pollInterval: number | null = null;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private cps: number = 0.5; // standard 120 bpm (0.5 cycles per second = 2 sec per cycle)
  private playStartTime: number = 0;
  private activePlayer: any = null;

  constructor() {
    this.init();
  }

  /**
   * Initializes the Strudel Web environment
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const win = typeof window !== 'undefined' ? (window as any) : null;
        if (!win) return;

        if (typeof win.initStrudel !== 'function') {
          // Wait briefly for the script tag from index.html to load or dynamically inject
          await new Promise<void>((resolve) => {
            if (win.initStrudel) return resolve();
            
            const existingScript = document.querySelector('script[src*="@strudel/web"]');
            if (existingScript) {
              existingScript.addEventListener('load', () => resolve());
              existingScript.addEventListener('error', () => resolve());
              setTimeout(resolve, 1500);
            } else {
              const script = document.createElement('script');
              script.src = 'https://cdn.jsdelivr.net/npm/@strudel/web@1.2.5/dist/index.js';
              script.onload = () => resolve();
              script.onerror = () => resolve();
              document.head.appendChild(script);
              setTimeout(resolve, 2000);
            }
          });
        }

        if (typeof win.initStrudel === 'function') {
          try {
            const initRes = await win.initStrudel({
              prebake: () => {
                if (typeof win.samples === 'function') {
                  try {
                    win.samples('github:tidalcycles/Dirt-Samples');
                  } catch (e) {
                    console.warn('[Strudel] Default samples prebake note:', e);
                  }
                }
              }
            });
            if (initRes) {
              if (typeof initRes.evaluate === 'function') win.evaluate = initRes.evaluate;
              if (typeof initRes.hush === 'function') win.hush = initRes.hush;
              if (typeof initRes.samples === 'function') win.samples = initRes.samples;
            }
            console.log('[Strudel] initStrudel completed successfully');
          } catch (initErr) {
            console.warn('[Strudel] initStrudel call warning:', initErr);
          }
        }

        // Initialize and register embedded studio sound bank (zero network dependency)
        try {
          await embeddedSoundBank.initializeAndRegister();
        } catch (embErr) {
          console.warn('[Strudel] Embedded sound bank init note:', embErr);
        }

        // Fallback or ensure default sample registration
        if (typeof win.samples === 'function') {
          try {
            win.samples('github:tidalcycles/Dirt-Samples');
          } catch (e) {
            // ignore
          }
        }

        // Patch getSound if available to intercept numeric arguments like 808 without warning
        try {
          if (win.getSound && typeof win.getSound === 'function') {
            const originalGetSound = win.getSound;
            win.getSound = function(soundName: any, ...args: any[]) {
              if (typeof soundName === 'number') {
                if (soundName === 808) soundName = 'sub808';
                else if (soundName === 909) soundName = 'kick';
                else if (soundName === 303) soundName = 'acid';
                else soundName = String(soundName);
              }
              return originalGetSound.call(this, soundName, ...args);
            };
          }
        } catch (e) {}

        this.isInitialized = true;
      } catch (err) {
        console.warn('[Strudel] Initialization fallback note:', err);
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  private async resumeAudioContext() {
    try {
      const win = typeof window !== 'undefined' ? (window as any) : null;
      if (!win) return;

      const contexts = [
        win.getAudioContext?.(),
        win.audioContext,
        win.SuperDoughAudioContext,
        win.strudelContext,
        (StrudelCore as any)?.getAudioContext?.()
      ];

      for (const ctx of contexts) {
        if (ctx && typeof ctx.resume === 'function' && ctx.state === 'suspended') {
          await ctx.resume();
          console.log('[Strudel] Audio Context resumed:', ctx);
        }
      }
    } catch (e) {
      console.warn('[Strudel] AudioContext resume note:', e);
    }
  }

  /**
   * Registers a sample with the Strudel engine
   */
  public registerSample(name: string, url: string) {
    const win = typeof window !== 'undefined' ? (window as any) : null;
    if (!win) return;

    try {
      if (typeof win.register === 'function') {
        win.register(name, url);
        console.log(`[Strudel] Registered sample via register(): ${name}`);
      } else if (typeof win.samples === 'function') {
        win.samples({ [name]: url });
        console.log(`[Strudel] Registered sample via samples(): ${name}`);
      }
    } catch (e) {
      console.warn(`[Strudel] Failed to register sample ${name}:`, e);
    }
  }

  /**
   * Sanitizes Strudel mini-notation to ensure sound names are string identifiers
   */
  public sanitizeCode(code: string): string {
    if (!code) return code;
    return code.replace(/(s(?:ound)?\s*\(\s*["'])([^"']+)(["']\s*\))/g, (match, prefix, content, suffix) => {
      const sanitizedContent = content
        .replace(/\b808\b/g, 'sub808')
        .replace(/\b909\b/g, 'kick')
        .replace(/\b303\b/g, 'acid');
      return `${prefix}${sanitizedContent}${suffix}`;
    });
  }

  /**
   * Validates pattern by attempting to parse/evaluate
   */
  public validatePattern(rawCode: string): { isValid: boolean; error?: StrudelError } {
    if (!rawCode || !rawCode.trim()) {
      return { isValid: false, error: { message: 'Pattern code cannot be empty', line: 1 } };
    }

    const code = this.sanitizeCode(rawCode);

    try {
      const win = typeof window !== 'undefined' ? (window as any) : null;
      if (!win) return { isValid: true };

      // Test evaluation without playing
      if (typeof win.evaluate === 'function') {
        const res = win.eval(code);
        if (!res && res !== 0) {
          // Check if eval worked
        }
      } else {
        const res = win.eval(code);
        if (!res && res !== 0) {
          throw new Error('Pattern returned undefined');
        }
      }

      return { isValid: true };
    } catch (e: any) {
      return {
        isValid: false,
        error: {
          message: e.message || 'Syntax Error in pattern code',
          line: 1
        }
      };
    }
  }

  public async play() {
    await this.init();
    await this.resumeAudioContext();

    this.isPlaying = true;
    this.playStartTime = performance.now();

    if (this.currentCode) {
      this.executePattern(this.currentCode);
    }

    this.startCyclePolling();
    console.log('[Strudel] Playing pattern');
  }

  public stop() {
    this.isPlaying = false;
    this.stopCyclePolling();

    const win = typeof window !== 'undefined' ? (window as any) : null;
    if (win) {
      // 1. Strudel hush()
      if (typeof win.hush === 'function') {
        try {
          win.hush();
        } catch (e) {
          console.warn('[Strudel] hush error:', e);
        }
      }

      // 2. Strudel evaluate('silence')
      if (typeof win.evaluate === 'function') {
        try {
          win.evaluate('silence');
        } catch (e) {}
      }

      // 3. Strudel core hush
      if (typeof (StrudelCore as any).hush === 'function') {
        try {
          (StrudelCore as any).hush();
        } catch (e) {}
      }

      // 4. Direct pattern player instance stop
      if (this.activePlayer) {
        try {
          if (typeof this.activePlayer.stop === 'function') this.activePlayer.stop();
          if (typeof this.activePlayer.hush === 'function') this.activePlayer.hush();
        } catch (e) {}
        this.activePlayer = null;
      }

      // 5. Explicitly clear audioContext active sound nodes if suspended/muted
      try {
        const audioCtx = win.getAudioContext?.() || win.audioContext;
        if (audioCtx && typeof audioCtx.suspend === 'function') {
          audioCtx.suspend().then(() => {
            if (this.isPlaying) {
              audioCtx.resume();
            }
          }).catch(() => {});
        }
      } catch (e) {}
    }

    console.log('[Strudel] Stopped playback');
  }

  public setPattern(code: string) {
    this.currentCode = code;

    if (this.isPlaying) {
      this.executePattern(code);
    }
  }

  private executePattern(rawCode: string) {
    if (!rawCode || !rawCode.trim() || !this.isPlaying) return;

    const code = this.sanitizeCode(rawCode);

    try {
      const win = typeof window !== 'undefined' ? (window as any) : null;
      if (!win) return;

      let evaluatedResult: any = null;
      let usedEvaluateFn = false;

      // Method 1: Use Strudel Web's evaluate(code) for seamless live hot-swapping
      if (typeof win.evaluate === 'function') {
        try {
          evaluatedResult = win.evaluate(code);
          usedEvaluateFn = true;
          console.log('[Strudel] Pattern evaluated into engine via evaluate()');
        } catch (evalFnErr) {
          console.warn('[Strudel] evaluate() warning, falling back to eval():', evalFnErr);
        }
      }

      // Method 2: If evaluate didn't return or failed, eval directly
      if (!evaluatedResult) {
        try {
          evaluatedResult = win.eval(code);
        } catch (e) {
          console.warn('[Strudel] win.eval error (keeping current pattern):', e);
          return;
        }
      }

      // Stop previous direct standalone player if one was manually started
      if (!usedEvaluateFn && this.activePlayer) {
        try {
          if (typeof this.activePlayer.stop === 'function') this.activePlayer.stop();
          if (typeof this.activePlayer.hush === 'function') this.activePlayer.hush();
        } catch (e) {}
        this.activePlayer = null;
      }

      // If standalone eval produced a Pattern without global evaluate(), start .play()
      if (!usedEvaluateFn && evaluatedResult && typeof evaluatedResult.play === 'function') {
        this.activePlayer = evaluatedResult.play();
        console.log('[Strudel] Pattern .play() started standalone');
      } else if (evaluatedResult && typeof evaluatedResult.stop === 'function') {
        this.activePlayer = evaluatedResult;
      }
    } catch (e) {
      console.error('[Strudel] Pattern execution error:', e);
    }
  }

  public getCurrentPattern(): string {
    return this.currentCode;
  }

  public setCPS(cps: number) {
    this.cps = cps;
    const win = typeof window !== 'undefined' ? (window as any) : null;
    if (!win) return;

    try {
      if (typeof win.setCps === 'function') {
        win.setCps(cps);
      } else if (typeof win.setcpm === 'function') {
        win.setcpm(cps * 60);
      }
    } catch (e) {
      console.warn('[Strudel] setCPS error:', e);
    }
  }

  public getCPS(): number {
    return this.cps;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // --- REAL-TIME CYCLE & PLAYHEAD POLLING ---

  public onCycle(callback: CycleCallback) {
    this.cycleCallbacks.add(callback);
    return () => this.cycleCallbacks.delete(callback);
  }

  private startCyclePolling() {
    if (this.pollInterval) return;

    const loop = () => {
      if (!this.isPlaying) return;

      try {
        const win = typeof window !== 'undefined' ? (window as any) : null;
        let cycle = 0;

        if (win && typeof win.getCycle === 'function') {
          cycle = win.getCycle();
        } else {
          // Fallback cycle calculation: elapsed time * cps
          const elapsedSec = (performance.now() - this.playStartTime) / 1000;
          cycle = elapsedSec * this.cps;
        }

        if (typeof cycle === 'number' && !isNaN(cycle)) {
          const phase = ((cycle % 1) + 1) % 1; // 0.000 to 0.999
          const beat = Math.floor(phase * 4) + 1; // 1, 2, 3, 4
          const step16 = Math.floor(phase * 16); // 0 to 15
          const step8 = Math.floor(phase * 8); // 0 to 7
          const bpm = Math.round(this.cps * 60 * 4); // or cps * 120

          const info: CycleInfo = {
            cycle: Number(cycle.toFixed(2)),
            phase,
            beat,
            step16,
            step8,
            cps: this.cps,
            bpm: Math.round(this.cps * 240), // 0.5 cps = 120 bpm
            isPlaying: this.isPlaying
          };

          this.notifyCycle(info);
        }
      } catch (e) {
        // suppress polling errors
      }

      this.pollInterval = requestAnimationFrame(loop);
    };

    this.pollInterval = requestAnimationFrame(loop);
  }

  private stopCyclePolling() {
    if (this.pollInterval) {
      cancelAnimationFrame(this.pollInterval);
      this.pollInterval = null;
    }

    const idleInfo: CycleInfo = {
      cycle: 0,
      phase: 0,
      beat: 1,
      step16: 0,
      step8: 0,
      cps: this.cps,
      bpm: Math.round(this.cps * 240),
      isPlaying: false
    };
    this.notifyCycle(idleInfo);
  }

  private notifyCycle(info: CycleInfo) {
    this.cycleCallbacks.forEach((cb) => {
      try {
        cb(info);
      } catch (err) {
        console.error('[Strudel] Cycle callback error:', err);
      }
    });
  }
}

export const strudelService = new StrudelService();
