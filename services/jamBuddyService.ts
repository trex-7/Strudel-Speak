import { strudelService } from './strudelService';
import { geminiService } from './geminiService';
import { JamMode, StrudelPattern } from '../types';

type EvolutionCallback = (result: StrudelPattern) => void;

class JamBuddyService {
  private mode: JamMode = JamMode.OFF;
  private lastTriggeredCycle: number = -1;
  private onEvolve: EvolutionCallback | null = null;
  private isThinking: boolean = false;

  constructor() {
    // Subscribe to Strudel cycle updates
    strudelService.onCycle(this.handleCycle.bind(this));
  }

  public setMode(mode: JamMode) {
    this.mode = mode;
    console.log(`Jam Buddy Mode: ${JamMode[mode]}`);
  }

  public setCallback(cb: EvolutionCallback) {
    this.onEvolve = cb;
  }

  /**
   * Manually trigger a "Surprise" evolution
   */
  public async triggerSurprise(chaos: number) {
    if (this.isThinking) return;
    await this.evolve(chaos, "Surprise me! Make a distinct variation of the current pattern but keep the tempo.");
  }

  private handleCycle(cycle: number) {
    if (this.mode === JamMode.OFF || this.isThinking) return;

    const floored = Math.floor(cycle);
    
    // Check if we hit the bar interval (8, 16, 32)
    // We add a small offset check to ensure we don't trigger multiple times for the same integer cycle
    // or miss it if the frame rate skips slightly. 
    // Simplified: Just check if integer matches and we haven't triggered for this integer yet.
    
    if (floored > 0 && floored % this.mode === 0 && floored !== this.lastTriggeredCycle) {
      this.lastTriggeredCycle = floored;
      console.log(`Jam Buddy Triggered at Cycle ${floored}`);
      
      // Auto-evolution uses a moderate chaos level usually, or we could pass it in.
      // We'll hardcode a "Jam" context chaos of 0.2 for auto-evolution to keep it stable-ish.
      this.evolve(0.3, "Evolve this pattern. Keep the groove but add a variation or fill.");
    }
  }

  private async evolve(chaos: number, prompt: string) {
    this.isThinking = true;
    const currentCode = strudelService.getCurrentPattern();

    try {
      const result = await geminiService.generatePattern(
        prompt,
        currentCode,
        chaos,
        0 // retries handled inside geminiService
      );

      // Apply immediately
      strudelService.setPattern(result.code);
      
      // Notify UI
      if (this.onEvolve) {
        this.onEvolve(result);
      }

    } catch (e) {
      console.error("Jam Buddy Failed:", e);
    } finally {
      this.isThinking = false;
    }
  }
}

export const jamBuddyService = new JamBuddyService();
