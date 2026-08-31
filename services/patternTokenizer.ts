/**
 * Strudel Pattern Mini-Notation Tokenizer & Real-Time Cursor Calculator
 * Parses Strudel code into syntax tokens and calculates active step cursors
 * for live visual synchronization with the audio engine.
 */

export interface MiniStepToken {
  text: string;
  startChar: number;
  endChar: number;
  stepRange: [number, number]; // [startPhase, endPhase] within cycle (0..1)
  isRest: boolean;
  cycleStepIndex?: number;
}

export interface SyntaxToken {
  text: string;
  type: 'function' | 'string' | 'number' | 'comment' | 'keyword' | 'operator' | 'punctuation' | 'minitoken' | 'effect' | 'plain';
  color?: string;
  isMiniString?: boolean;
  activeTokenIndex?: number;
  miniSteps?: MiniStepToken[];
  activeStep?: {
    currentStep: number;
    totalSteps: number;
    activeText: string;
    isRest: boolean;
    startChar: number;
    endChar: number;
  };
}

export interface ParsedLine {
  lineNumber: number;
  rawText: string;
  tokens: SyntaxToken[];
  soundType: 'kick' | 'snare' | 'hat' | 'acid' | 'chord' | 'perc' | 'fx' | 'synth' | null;
  soundColor: string;
  totalSubdivisions: number;
  activeStepIndex: number;
  isTriggering: boolean;
  activeTokenText: string | null;
  hasPattern: boolean;
}

// Sound color palette matching electronic live-coding aesthetics
export const SOUND_COLORS: Record<string, string> = {
  kick: '#f59e0b', // Amber / 909 gold
  snare: '#ec4899', // Pink / Clap neon
  hat: '#06b6d4', // Cyan / Metallic
  acid: '#10b981', // Emerald / 303 Lime
  chord: '#a855f7', // Purple / Juno poly
  perc: '#3b82f6', // Blue / FM Pluck
  fx: '#f43f5e', // Rose / Riser sweep
  synth: '#8b5cf6', // Violet
  default: '#38bdf8' // Sky
};

/**
 * Parses mini-notation string content (e.g. "~ snare ~ snare", "kick*4", "<0 3 [5 7] 10>")
 * into sequential or slow-cycling step tokens with character offsets and phase ranges.
 */
export function parseMiniNotation(content: string): { steps: MiniStepToken[]; isSlowCycle: boolean; totalSteps: number } {
  const trimmed = content.trim();
  if (!trimmed) return { steps: [], isSlowCycle: false, totalSteps: 0 };

  const isAngleBracket = trimmed.startsWith('<') && trimmed.endsWith('>');
  const innerContent = isAngleBracket ? trimmed.slice(1, -1).trim() : trimmed;
  const offsetAdjustment = isAngleBracket ? trimmed.indexOf(innerContent) : 0;

  // Split tokens while preserving character indices and respecting nested brackets
  const rawTokens: { text: string; start: number; end: number }[] = [];
  let current = '';
  let tokenStart = -1;
  let bracketDepth = 0;

  for (let i = 0; i < innerContent.length; i++) {
    const char = innerContent[i];
    if (char === '[' || char === '(') {
      if (tokenStart === -1) tokenStart = i;
      bracketDepth++;
      current += char;
    } else if (char === ']' || char === ')') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      current += char;
      if (bracketDepth === 0 && current.trim()) {
        rawTokens.push({ text: current.trim(), start: tokenStart, end: i + 1 });
        current = '';
        tokenStart = -1;
      }
    } else if (char === ' ' || char === ',') {
      if (bracketDepth > 0) {
        current += char;
      } else if (current.trim()) {
        rawTokens.push({ text: current.trim(), start: tokenStart, end: i });
        current = '';
        tokenStart = -1;
      }
    } else {
      if (tokenStart === -1) tokenStart = i;
      current += char;
    }
  }
  if (current.trim()) {
    rawTokens.push({ text: current.trim(), start: tokenStart, end: innerContent.length });
  }

  if (rawTokens.length === 0) {
    return { steps: [], isSlowCycle: false, totalSteps: 0 };
  }

  // Handle single token with multiplier: e.g. "kick*4" or "hat*8"
  if (rawTokens.length === 1 && rawTokens[0].text.includes('*')) {
    const fullText = rawTokens[0].text;
    const parts = fullText.split('*');
    const baseSound = parts[0];
    const mult = parseInt(parts[1], 10) || 1;
    const steps: MiniStepToken[] = [];
    const stepDuration = 1 / mult;

    for (let s = 0; s < mult; s++) {
      steps.push({
        text: baseSound,
        startChar: offsetAdjustment + rawTokens[0].start,
        endChar: offsetAdjustment + rawTokens[0].end,
        stepRange: [s * stepDuration, (s + 1) * stepDuration],
        isRest: baseSound === '~',
        cycleStepIndex: s
      });
    }
    return { steps, isSlowCycle: false, totalSteps: mult };
  }

  // Multi-token sequence
  const totalTokens = rawTokens.length;
  const stepDuration = 1 / totalTokens;
  const steps: MiniStepToken[] = [];

  for (let i = 0; i < totalTokens; i++) {
    const tok = rawTokens[i];
    const isRest = tok.text === '~';

    steps.push({
      text: tok.text,
      startChar: offsetAdjustment + tok.start,
      endChar: offsetAdjustment + tok.end,
      stepRange: [i * stepDuration, (i + 1) * stepDuration],
      isRest,
      cycleStepIndex: i
    });
  }

  return { steps, isSlowCycle: isAngleBracket, totalSteps: totalTokens };
}

/**
 * Analyzes a single line of Strudel code, tokenizes syntax, and computes active step cursors
 */
export function analyzePatternLine(
  lineText: string,
  lineNumber: number,
  cycle: number,
  phase: number,
  isPlaying: boolean
): ParsedLine {
  const lower = lineText.toLowerCase();

  // Detect sound category
  let soundType: ParsedLine['soundType'] = null;
  let soundColor = SOUND_COLORS.default;

  if (lower.includes('kick') || lower.includes('bd') || lower.includes('sub')) {
    soundType = 'kick';
    soundColor = SOUND_COLORS.kick;
  } else if (lower.includes('snare') || lower.includes('clap') || lower.includes('sd') || lower.includes('cp')) {
    soundType = 'snare';
    soundColor = SOUND_COLORS.snare;
  } else if (lower.includes('hat') || lower.includes('openhat') || lower.includes('hh') || lower.includes('oh')) {
    soundType = 'hat';
    soundColor = SOUND_COLORS.hat;
  } else if (lower.includes('acid') || lower.includes('303') || lower.includes('moog') || lower.includes('bass')) {
    soundType = 'acid';
    soundColor = SOUND_COLORS.acid;
  } else if (lower.includes('juno') || lower.includes('saw') || lower.includes('chord') || lower.includes('pad')) {
    soundType = 'chord';
    soundColor = SOUND_COLORS.chord;
  } else if (lower.includes('pluck') || lower.includes('perc') || lower.includes('rim') || lower.includes('shaker') || lower.includes('rave')) {
    soundType = 'perc';
    soundColor = SOUND_COLORS.perc;
  } else if (lower.includes('riser') || lower.includes('impact') || lower.includes('laser') || lower.includes('glitch') || lower.includes('fx')) {
    soundType = 'fx';
    soundColor = SOUND_COLORS.fx;
  } else if (lower.includes('note(') || lower.includes('sound(') || lower.includes('n(') || lower.includes('s(')) {
    soundType = 'synth';
    soundColor = SOUND_COLORS.synth;
  }

  // Tokenize the line
  const tokens: SyntaxToken[] = [];
  const regex = /(\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:stack|seq|cat|arrange|s|sound|n|note|gain|jux|rev|off|every|ply|lpf|lpq|hpf|bpf|pan|delay|delaytime|delayfeedback|room|crush|coarse|shape|distort|vowel|chop|speed|fast|slow|sometimes|rarely|often|degradeBy|sine|range|add|mul)\b)|(\b\d+(?:\.\d+)?\b)|([(),.=>*\/+\-\[\]{}<>])/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  let lineTotalSubdivisions = 4;
  let lineActiveStepIndex = 0;
  let lineIsTriggering = false;
  let lineActiveTokenText: string | null = null;
  let lineHasPattern = false;

  while ((match = regex.exec(lineText)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        text: lineText.slice(lastIndex, match.index),
        type: 'plain'
      });
    }

    const [_, comment, stringLit, keyword, numberLit, punctuation] = match;

    if (comment) {
      tokens.push({ text: comment, type: 'comment', color: '#64748b' });
    } else if (stringLit) {
      lineHasPattern = true;
      const strContent = stringLit.slice(1, -1);
      const parsedMini = parseMiniNotation(strContent);

      let activeStepInfo: SyntaxToken['activeStep'] = undefined;

      if (parsedMini.steps.length > 0 && isPlaying) {
        lineTotalSubdivisions = Math.max(lineTotalSubdivisions, parsedMini.totalSteps);

        if (parsedMini.isSlowCycle) {
          // 1 item per cycle for <a b c>
          const cycleInt = Math.floor(cycle);
          const activeIndex = ((cycleInt % parsedMini.totalSteps) + parsedMini.totalSteps) % parsedMini.totalSteps;
          const activeStep = parsedMini.steps[activeIndex];

          if (activeStep) {
            lineActiveStepIndex = activeIndex;
            lineActiveTokenText = activeStep.text;
            lineIsTriggering = !activeStep.isRest;

            activeStepInfo = {
              currentStep: activeIndex,
              totalSteps: parsedMini.totalSteps,
              activeText: activeStep.text,
              isRest: activeStep.isRest,
              startChar: activeStep.startChar,
              endChar: activeStep.endChar
            };
          }
        } else {
          // Subdivisions per cycle based on normalized phase
          const activeStep = parsedMini.steps.find(
            (s) => phase >= s.stepRange[0] && phase < s.stepRange[1]
          ) || parsedMini.steps[parsedMini.steps.length - 1];

          if (activeStep) {
            const stepIdx = activeStep.cycleStepIndex ?? Math.floor(phase * parsedMini.totalSteps);
            lineActiveStepIndex = stepIdx;
            lineActiveTokenText = activeStep.text;
            lineIsTriggering = !activeStep.isRest;

            activeStepInfo = {
              currentStep: stepIdx,
              totalSteps: parsedMini.totalSteps,
              activeText: activeStep.text,
              isRest: activeStep.isRest,
              startChar: activeStep.startChar,
              endChar: activeStep.endChar
            };
          }
        }
      }

      tokens.push({
        text: stringLit,
        type: 'string',
        color: soundColor,
        isMiniString: true,
        miniSteps: parsedMini.steps,
        activeStep: activeStepInfo
      });
    } else if (keyword) {
      const isMethod = ['jux', 'rev', 'off', 'every', 'ply', 'lpf', 'lpq', 'hpf', 'pan', 'delay', 'room', 'crush', 'coarse', 'shape', 'vowel', 'chop'].includes(keyword);
      tokens.push({
        text: keyword,
        type: isMethod ? 'effect' : 'function',
        color: isMethod ? '#c084fc' : '#38bdf8'
      });
    } else if (numberLit) {
      tokens.push({ text: numberLit, type: 'number', color: '#fbbf24' });
    } else if (punctuation) {
      tokens.push({ text: punctuation, type: 'punctuation', color: '#94a3b8' });
    }

    lastIndex = regex.lastIndex;
  }

  // Trailing text
  if (lastIndex < lineText.length) {
    tokens.push({
      text: lineText.slice(lastIndex),
      type: 'plain'
    });
  }

  return {
    lineNumber,
    rawText: lineText,
    tokens,
    soundType,
    soundColor,
    totalSubdivisions: lineTotalSubdivisions,
    activeStepIndex: lineActiveStepIndex,
    isTriggering: isPlaying && lineIsTriggering,
    activeTokenText: lineActiveTokenText,
    hasPattern: lineHasPattern
  };
}
