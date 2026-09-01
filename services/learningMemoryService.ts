import { LearnedCorrection, LineDiagnosisRequest, LineDiagnosisResponse } from '../types';

const STORAGE_KEY = 'strudelspeak_learned_corrections_v1';

// Foundational default learned corrections (seed knowledge)
const DEFAULT_CORRECTIONS: LearnedCorrection[] = [
  {
    id: 'seed-sound-names',
    timestamp: 1700000000000,
    issueDescription: 'Numeric sound names like s("808") or s("909") produce silence because Strudel expects alphabetical sample identifiers.',
    faultyCode: 's("808*4").gain(0.8)',
    fixedCode: 's("sub*4").gain(0.85)',
    tags: ['sound-name', 'drum', 'alphabetical-rule'],
    notes: 'Always use alphabetical names: "sub", "kick", "snare", "hat", "acid", "juno", "saw".'
  },
  {
    id: 'seed-jux-rev',
    timestamp: 1700000001000,
    issueDescription: 'jux(rev) requires "rev" identifier or callback without extra string quotes.',
    faultyCode: 's("acid*8").jux("rev")',
    fixedCode: 's("acid*8").jux(rev)',
    tags: ['stereo', 'jux', 'syntax'],
    notes: 'rev is passed directly as an unquoted function identifier in .jux(rev).'
  },
  {
    id: 'seed-lpf-lfo',
    timestamp: 1700000002000,
    issueDescription: 'Dynamic LPF filter sweeping requires sine.range(min, max).slow(cycles) instead of direct array strings.',
    faultyCode: 's("acid*8").lpf("<200 3000>")',
    fixedCode: 's("acid*8").lpf(sine.range(200, 3200).slow(4)).lpq(8)',
    tags: ['filter', 'dsp', 'lfo'],
    notes: 'Use continuous LFO signals for smooth resonant sweeps.'
  },
  {
    id: 'seed-bass-clip-cut',
    timestamp: 1700000004000,
    issueDescription: 'Bass notes sustaining, bleeding, and overlapping into muddy low-end rumble because sampled or synth basses lack voice choking (.cut(1)) and step duration clipping (.clip(1)).',
    faultyCode: 'n("~ 0 ~ 0 ~ 0 [~ 3] 0").scale("C2:minor").s("moog").lpf(1200).gain(0.85)',
    fixedCode: 'n("~ 0 ~ 0 ~ 0 [~ 3] 0").scale("C2:minor").s("moog").clip(1).cut(1).lpf(1200).gain(0.85)',
    tags: ['bass', 'clip', 'cut', 'monophonic', 'anti-overlap'],
    notes: 'Always chain .clip(1).cut(1) on basslines (moog, bass, sub, sawbass, acid) so each note is clipped to its step duration and previous notes are choked monophonically.'
  },
  {
    id: 'seed-fast-snare',
    timestamp: 1700000003000,
    issueDescription: 'Dynamic drum roll fill on specific cycle requires .every(4, x => x.fast(2)) callback closure.',
    faultyCode: 's("snare").every(4, "fast(2)")',
    fixedCode: 's("~ snare ~ snare").every(4, x => x.fast(2))',
    tags: ['every', 'temporal', 'fill'],
    notes: '.every() takes a cycle count and a lambda transformation x => x.fast(2).'
  }
];

class LearningMemoryService {
  private corrections: LearnedCorrection[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.corrections = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('[LearningMemoryService] Failed to parse stored memories, falling back to defaults:', e);
    }
    // Seed with defaults
    this.corrections = [...DEFAULT_CORRECTIONS];
    this.saveToStorage();
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.corrections));
    } catch (e) {
      console.error('[LearningMemoryService] Storage write failed:', e);
    }
  }

  public getAll(): LearnedCorrection[] {
    return [...this.corrections];
  }

  public getCount(): number {
    return this.corrections.length;
  }

  public getUserCount(): number {
    return this.corrections.filter(c => !c.id.startsWith('seed-')).length;
  }

  public addCorrection(data: {
    issueDescription: string;
    faultyCode: string;
    fixedCode: string;
    fullPatternContext?: string;
    lineIndex?: number;
    tags?: string[];
    notes?: string;
  }): LearnedCorrection {
    const newCorrection: LearnedCorrection = {
      id: `learned-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      issueDescription: data.issueDescription.trim(),
      faultyCode: data.faultyCode.trim(),
      fixedCode: data.fixedCode.trim(),
      fullPatternContext: data.fullPatternContext,
      lineIndex: data.lineIndex,
      tags: data.tags && data.tags.length > 0 ? data.tags : ['user-verified'],
      notes: data.notes?.trim() || `User verified on ${new Date().toLocaleDateString()}`
    };

    // Insert at front
    this.corrections.unshift(newCorrection);
    this.saveToStorage();
    return newCorrection;
  }

  public removeCorrection(id: string): boolean {
    const prevLen = this.corrections.length;
    this.corrections = this.corrections.filter(c => c.id !== id);
    if (this.corrections.length !== prevLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public resetToDefaults() {
    this.corrections = [...DEFAULT_CORRECTIONS];
    this.saveToStorage();
  }

  public clearAll() {
    this.corrections = [];
    this.saveToStorage();
  }

  public exportJson(): string {
    return JSON.stringify(this.corrections, null, 2);
  }

  public importJson(jsonString: string): { success: boolean; count: number; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data)) {
        return { success: false, count: 0, error: 'Imported file is not an array of rules' };
      }
      
      const validRules = data.filter(item => item && typeof item.faultyCode === 'string' && typeof item.fixedCode === 'string');
      if (validRules.length === 0) {
        return { success: false, count: 0, error: 'No valid correction records found in JSON' };
      }

      // Merge avoiding duplicate faulty+fixed pairs
      const existingKeys = new Set(this.corrections.map(c => `${c.faultyCode}__${c.fixedCode}`));
      let added = 0;

      for (const rule of validRules) {
        const key = `${rule.faultyCode}__${rule.fixedCode}`;
        if (!existingKeys.has(key)) {
          this.corrections.unshift({
            id: rule.id || `imported-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: rule.timestamp || Date.now(),
            issueDescription: rule.issueDescription || 'Imported learned rule',
            faultyCode: rule.faultyCode,
            fixedCode: rule.fixedCode,
            fullPatternContext: rule.fullPatternContext,
            tags: Array.isArray(rule.tags) ? rule.tags : ['imported'],
            notes: rule.notes || 'Imported rule'
          });
          existingKeys.add(key);
          added++;
        }
      }

      this.saveToStorage();
      return { success: true, count: added };
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || 'Invalid JSON format' };
    }
  }

  /**
   * Generates a condensed Few-Shot prompt block summarizing user-verified corrections
   * and learned rules to inject directly into the LLM system prompt.
   */
  public getPromptLearningContext(maxRules = 8): string {
    if (this.corrections.length === 0) return '';

    // Prioritize user-created rules first, then seed rules
    const sorted = [...this.corrections].sort((a, b) => {
      const aIsUser = !a.id.startsWith('seed-');
      const bIsUser = !b.id.startsWith('seed-');
      if (aIsUser && !bIsUser) return -1;
      if (!aIsUser && bIsUser) return 1;
      return b.timestamp - a.timestamp;
    }).slice(0, maxRules);

    const rulesStr = sorted.map((rule, idx) => {
      return `${idx + 1}. [ISSUE/DESIRED OUTCOME]: "${rule.issueDescription}"
   - AVOID / DEFECTIVE: ${rule.faultyCode}
   - CORRECT VERIFIED PATTERN: ${rule.fixedCode}
   - LESSON / RULE: ${rule.notes || rule.tags.join(', ')}`;
    }).join('\n\n');

    return `
---
LEARNED USER CORRECTIONS & VERIFIED PATTERNS DATABASE (ALWAYS FOLLOW THESE LEARNED LESSONS):
${rulesStr}
---
`;
  }
}

export const learningMemoryService = new LearningMemoryService();
