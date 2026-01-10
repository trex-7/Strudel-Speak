// Import Strudel packages
import * as StrudelCore from '@strudel/core';
import * as StrudelWebAudio from '@strudel/webaudio';
import { transpiler } from '@strudel/transpiler';
import { StrudelError } from '../types';

// Combine core and webaudio
const Strudel = { ...StrudelCore, ...StrudelWebAudio };

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
  
  // Explicitly expose key functions to window for eval()
  keysToExpose.forEach(key => {
    // @ts-ignore
    if (Strudel[key]) {
      // @ts-ignore
      window[key] = Strudel[key];
    }
  });

  // Ensure 'm' and 's' are defined as they are critical for auditioning
  // @ts-ignore
  window.m = window.m || Strudel.m || Strudel.mini || StrudelCore.mini || StrudelCore.m;
  // @ts-ignore
  window.s = window.s || Strudel.s || StrudelCore.s;
  
  console.log("Strudel Global Injection Complete. Available keys:", Object.keys(Strudel).length);
  // @ts-ignore
  console.log("m defined:", typeof window.m);
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

    // Initialize audio context
    if (typeof Strudel.initAudio === 'function') {
      Strudel.initAudio();
      console.log('Audio context initialized');
    }

    // Initialize WebAudio and get scheduler
    try {
      if (Strudel.webaudioRepl) {
          this.scheduler = Strudel.webaudioRepl();
          console.log('Using Strudel webaudioRepl as scheduler');
      } else if (Strudel.superdough) {
          this.scheduler = Strudel.superdough();
          console.log('Using Strudel superdough as scheduler');
      } else {
          console.error('CRITICAL: Could not find Strudel scheduler (webaudioRepl or superdough).');
          console.log('Available Strudel exports keys:', Object.keys(Strudel));
      }
    } catch (e) {
      console.error('Failed to initialize Strudel scheduler:', e);
    }

    // Initialize default samples path if function exists - moved to initAudio
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

      // Initialize default samples path if function exists
      if (typeof Strudel.samples === 'function') {
         try {
           await Strudel.samples('https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/strudel.json');
           console.log('Default samples loaded');
         } catch (e) {
           console.warn('Failed to load default samples:', e);
         }
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
   * Registers a bank of samples
   */
  public registerBank(name: string, urls: string[]) {
    if (typeof Strudel.samples === 'function') {
      try {
        Strudel.samples({ [name]: urls });
        console.log(`Registered bank: ${name} with ${urls.length} samples`);
      } catch (e) {
        console.error(`Failed to register bank ${name}:`, e);
      }
    }
  }

  /**
   * Validates pattern using Strudel transpiler
   */
  public validatePattern(code: string): { isValid: boolean; error?: StrudelError } {
    try {
      // Use transpiler for proper Strudel syntax validation
      const transpiledResult = transpiler(code);
      const transpiledCode = transpiledResult.output;

      // Remove the 'return ' prefix if present
      let evalCode = transpiledCode;
      if (evalCode.startsWith('return ')) {
        evalCode = evalCode.substring(7);
      }

      // Evaluate the transpiled code in a function context
      // @ts-ignore
      const result = window.eval(`(function() { return ${evalCode} })()`);
      if (!result) throw new Error("No pattern returned");

      return { isValid: true };
    } catch (e: any) {
      return {
        isValid: false,
        error: {
          message: e.message || 'Syntax Error',
          line: e.line || 1,
          column: e.column
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
    console.log(`Strudel: Setting pattern: ${code}`);

    try {
        const evalFunc = Strudel.evaluate;

        // Transpile the code first
        console.log('Transpiling code...');
        const transpiledResult = transpiler(code);
        let transpiledCode = transpiledResult.output;
        console.log('Transpiled code:', transpiledCode);

        // Remove the 'return ' prefix and trailing ';' if present
        if (transpiledCode.startsWith('return ')) {
          transpiledCode = transpiledCode.substring(7);
        }
        if (transpiledCode.endsWith(';')) {
          transpiledCode = transpiledCode.slice(0, -1);
        }

        // Evaluate the transpiled code
        console.log('Evaluating transpiled code...');
        // @ts-ignore
        const pattern = window.eval(`(function() { return ${transpiledCode} })()`);
        console.log('Pattern evaluated:', pattern);
        if (this.scheduler && pattern) {
          console.log('Setting pattern on scheduler...');
          this.scheduler.setPattern(pattern);
          console.log('Pattern set successfully');
        } else {
          console.error('Scheduler or pattern missing:', { scheduler: !!this.scheduler, pattern: !!pattern });
        }
    } catch (e) {
        console.error("Failed to set pattern:", e);
        console.error("Error details:", { message: e.message, stack: e.stack });
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

  /**
   * Plays a pattern once (audition)
   */
  public async playOnce(code: string) {
    if (!this.scheduler) return;
    
    try {
        // Ensure audio context is resumed
        const ctx = this.scheduler.audioContext || this.scheduler.context;
        if (ctx && ctx.state === 'suspended') {
            await ctx.resume();
        }

        const transpiledResult = transpiler(code);
        let transpiledCode = transpiledResult.output;
        if (transpiledCode.startsWith('return ')) {
          transpiledCode = transpiledCode.substring(7);
        }
        // @ts-ignore
        const pattern = window.eval(`(function() { return ${transpiledCode} })()`);
        
        if (!pattern) return;

        console.log(`Auditioning: ${code}`);

        // Use the scheduler to play the pattern once
        const originalPattern = this.scheduler.pattern;
        
        // We use a short duration pattern
        this.scheduler.setPattern(pattern.take(1));
        
        if (!this.isPlaying) {
            this.scheduler.start();
            setTimeout(() => {
                if (!this.isPlaying) {
                    this.scheduler.stop();
                } else {
                    this.scheduler.setPattern(originalPattern);
                }
            }, 2000);
        } else {
            // If already playing, we temporarily swap the pattern
            setTimeout(() => {
                this.scheduler.setPattern(originalPattern);
            }, 2000);
        }
    } catch (e) {
        console.error("Audition failed:", e);
    }
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
