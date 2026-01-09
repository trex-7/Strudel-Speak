import * as StrudelLib from '@strudel/core';
import { StrudelError } from '../types';

// Robust export unwrapping
let Strudel: any = StrudelLib;

// Unwrap default if it exists (ESM/CJS interop)
if (Strudel.default) {
    Strudel = { ...Strudel, ...Strudel.default };
}
// Double unwrap in case of nested default (bundler artifacts)
if (Strudel.default && Strudel.default.default) {
    Strudel = { ...Strudel, ...Strudel.default.default };
}

// Expose Strudel functions to global scope so eval() works with generated code
if (typeof window !== 'undefined') {
  // We assign properties individually to avoid overwriting existing window properties dangerously
  // but we need key Strudel functions available globally for the pattern eval
  const keysToExpose = [
    's', 'stack', 'slow', 'fast', 'note', 'n', 'sound', 'cat', 'choose', 'rand', 'saw', 'sine', 'tri', 'sq', 
    'shape', 'gain', 'room', 'size', 'delay', 'orbit', 'vowel', 'speed', 'pan', 'jux', 'rank', 'silence',
    'min', 'max', 'add', 'sub', 'mul', 'div', 'scale', 'm', 'f', 'cycle', 'getCycle', 'samples', 'register',
    'every', 'chunk', 'palindrome', 'iter', 'early', 'late', 'loopAt', 'slice', 'splice', 'legato'
  ];
  
  // Also expose everything else just in case
  Object.assign(window, Strudel);
  
  console.log("Strudel Global Injection Complete. Available keys:", Object.keys(Strudel).length);
}

type CycleCallback = (cycle: number) => void;

class StrudelService {
  private scheduler: any = null;
  private isPlaying: boolean = false;
  private currentCode: string = '';
  private cycleCallbacks: Set<CycleCallback> = new Set();
  private pollInterval: number | null = null;

  constructor() {
    console.log('Strudel Engine Initializing...');
    
    // LOCATE SCHEDULER
    if (Strudel.scheduler) {
        this.scheduler = Strudel.scheduler;
        console.log('Using exported Strudel.scheduler');
    } 
    else if (Strudel.Scheduler) {
        try {
            console.log('Instantiating new Strudel.Scheduler()');
            // Try to instantiate with default audio context logic if possible
            // Most Strudel schedulers create their own context if none provided
            this.scheduler = new Strudel.Scheduler();
            
            // If the scheduler needs manual start/audio context init, we'll handle in play()
            
            // Polyfill the global scheduler if missing, as some eval code might rely on it implicitly
            // @ts-ignore
            if (typeof window !== 'undefined' && !window.scheduler) {
                // @ts-ignore
                window.scheduler = this.scheduler;
            }
            
        } catch (e) {
            console.error('Failed to instantiate Strudel Scheduler:', e);
        }
    } else {
        console.error('CRITICAL: Could not find Strudel.scheduler or Strudel.Scheduler class.');
        console.log('Available Strudel exports keys:', Object.keys(Strudel));
        // Last ditch effort: maybe Strudel itself IS the scheduler interface in some weird bundle?
        if (typeof Strudel.start === 'function' && typeof Strudel.setPattern === 'function') {
             console.log('Strudel object itself looks like a scheduler.');
             this.scheduler = Strudel;
        }
    }

    // Initialize default samples path if function exists
    if (typeof Strudel.samples === 'function') {
       try {
         Strudel.samples('github:tidalcycles/Dirt-Samples');
       } catch (e) {
         console.warn('Failed to load default samples:', e);
       }
    }
  }

  private async initAudio() {
    if (!this.scheduler) return;

    try {
      // Access audioContext from scheduler
      // Note: Implementation details of AudioContext access vary by version
      const ctx = this.scheduler.audioContext || this.scheduler.context;

      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
        console.log('Audio Context Resumed');
      } else if (!ctx) {
         // If scheduler doesn't have context exposed, it might be internal.
         // We trust .start() to handle it.
        console.log('Audio Context not directly accessible, relying on scheduler.start()');
      }
    } catch (e) {
      console.error('Failed to initialize audio context:', e);
    }
  }

  /**
   * Registers a local sample with the Strudel engine
   */
  public registerSample(name: string, url: string) {
    const registerFunc = Strudel.register;
    if (typeof registerFunc === 'function') {
      try {
        registerFunc(name, url);
        console.log(`Registered local sample: ${name}`);
      } catch (e) {
        console.error(`Failed to register sample ${name}:`, e);
      }
    } else {
        console.warn('Strudel.register is not available');
    }
  }

  /**
   * Validates pattern by attempting to eval it
   */
  public validatePattern(code: string): { isValid: boolean; error?: StrudelError } {
    try {
      // Use evaluate if available as it handles Strudel-specific syntax better
      const evalFunc = Strudel.evaluate;
      
      if (typeof evalFunc === 'function') {
        evalFunc(code);
      } else {
        // Fallback to basic eval in global scope (where we injected Strudel)
        // @ts-ignore
        const result = window.eval(code);
        if (!result) throw new Error("No pattern returned");
      }

      return { isValid: true };
    } catch (e: any) {
      return {
        isValid: false,
        error: {
          message: e.message || 'Syntax Error',
          line: 1
        }
      };
    }
  }

  public async play() {
    await this.initAudio();
    
    if (this.scheduler) {
        this.scheduler.start();
        this.isPlaying = true;
        this.startCyclePolling();
        console.log('Strudel: Play');
    } else {
        console.error('Strudel Scheduler not found. Engine might not be loaded.');
    }
  }

  public stop() {
    if (this.scheduler) {
        this.scheduler.stop();
        this.isPlaying = false;
        this.stopCyclePolling();
        console.log('Strudel: Stop');
    }
  }

  public setPattern(code: string) {
    this.currentCode = code;
    // console.log(`Strudel: Pattern Updated`);

    try {
        let pattern;
        const evalFunc = Strudel.evaluate;

        if (typeof evalFunc === 'function') {
            pattern = evalFunc(code);
        } else {
            // @ts-ignore
            pattern = window.eval(code);
        }
        
        if (this.scheduler) {
            this.scheduler.setPattern(pattern);
        }
    } catch (e) {
        console.error("Failed to set pattern:", e);
    }
  }

  public getCurrentPattern(): string {
    return this.currentCode;
  }

  public setCPS(cps: number) {
    if (Strudel.controls && typeof Strudel.controls.setCps === 'function') {
        Strudel.controls.setCps(cps);
    } else if (this.scheduler && typeof this.scheduler.setCps === 'function') {
        this.scheduler.setCps(cps);
    }
  }

  public getIsPlaying() {
    return this.isPlaying;
  }

  // --- CYCLE POLLING FOR JAM BUDDY ---

  public onCycle(callback: CycleCallback) {
    this.cycleCallbacks.add(callback);
    return () => this.cycleCallbacks.delete(callback);
  }

  private startCyclePolling() {
    if (this.pollInterval) return;
    
    // We poll rapidly to catch cycle changes roughly on time
    // using requestAnimationFrame would be ideal for UI syncing
    const loop = () => {
        if (!this.isPlaying) return;
        
        try {
            // Attempt to get cycle from window or scheduler
            // @ts-ignore
            if (typeof window.getCycle === 'function') {
                 // @ts-ignore
                 const c = window.getCycle();
                 this.notifyCycle(c);
            }
        } catch (e) {
            // suppress errors during polling
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
  }

  private notifyCycle(cycle: number) {
    this.cycleCallbacks.forEach(cb => cb(cycle));
  }
}

export const strudelService = new StrudelService();
