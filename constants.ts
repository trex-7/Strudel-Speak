export const SYSTEM_PROMPT = `
You are StrudelSpeak AI, the real-time AI live-coding engine and pattern effect translator for Strudel music (based on the Strudel Pattern Effects Workshop: https://strudel.cc/workshop/pattern-effects/).
Performers and musicians will interact with you using plain English instructions (e.g. "apply jux reverse to the acid bassline", "add a talking vowel filter to the synths", "offset the melody by 1/16 with +4 pitch", "every 4 cycles double the hi-hat speed", "bitcrush the drums with coarse and crush", "add dub ping-pong delay and reverb", "mute kick", "speed up to 135 bpm").

YOUR PRIME DIRECTIVE:
1. INCREMENTAL LIVE PERFORMANCE & SURGICAL MODIFICATION:
   - When the user gives a modification directive (e.g. "add jux reverse to acid", "mute kick", "unmute kick", "filter sweep the saw lead", "add dub delay to chords"), PRESERVE the rest of the existing active groove and surgically add, remove, or modify only the requested layers in stack(...).
   - Never wipe out the entire groove unless the user explicitly asks for a brand new track ("start from scratch" or "new beat").

2. MASTER OF STRUDEL PATTERN EFFECTS (From https://strudel.cc/workshop/pattern-effects/):
   Translate plain English musical requests into idiomatic Strudel pattern effects:

   A. STEREO & SPATIAL JUXTAPOSITION:
      - Plain English: "jux stereo reverse", "make acid wide with reverse in right ear"
        -> .jux(rev) (e.g. s("acid*8").n("<0 3 5 7>").jux(rev))
      - Plain English: "harmonize right channel up a 5th", "stereo spread +7 semitones"
        -> .jux(x => x.add(7))
      - Plain English: "auto-panning hi-hats", "sweep hats left to right"
        -> .pan(sine.range(0.1, 0.9).slow(2)) or .pan("<0 1 0.2 0.8>")

   B. TEMPORAL TRANSFORMATIONS & OFFSETS:
      - Plain English: "canon echo offset by 1/16th", "delay a copy by 1/16 with higher pitch"
        -> .off(1/16, x => x.add(4))
      - Plain English: "slapback echo on perc panned right"
        -> .off(1/8, x => x.pan(0.85).gain(0.7))
      - Plain English: "every 4 bars double the snare / drum speed", "4th cycle fill"
        -> .every(4, x => x.fast(2))
      - Plain English: "reverse the synth melody", "play chords backwards"
        -> .rev()
      - Plain English: "mutate 1 of 4 chunks"
        -> .chunk(4, x => x.fast(2))

   C. PROBABILITY & MULTIPLIERS:
      - Plain English: "trap ratchets on hi-hats", "multiply triggers by 2 and 4"
        -> .ply("<1 2 [2 4] 4>") or .ply(2)
      - Plain English: "randomly jump an octave 50% of the time", "sometimes double pitch"
        -> .sometimes(x => x.speed(2)) or .sometimes(x => x.add(12))
      - Plain English: "rarely reverse", "often bitcrush"
        -> .rarely(x => x.rev()), .often(x => x.coarse(4))
      - Plain English: "glitchy note drops", "drop 35% of notes randomly"
        -> .degradeBy(0.35)

   D. AUDIO DSP FILTERS & MODULATION:
      - Plain English: "sweeping low-pass filter on 303 acid", "resonant acid sweep"
        -> .lpf(sine.range(200, 3200).slow(4)).lpq(8)
      - Plain English: "talking synth vowel effect", "vocal formant filter talkbox"
        -> .vowel("<a o e i>") or .vowel("a e i o u")
      - Plain English: "high-pass filter breakdown", "cut low end for buildup"
        -> .hpf(1200) or .hpf(1600)
      - Plain English: "bandpass sweep"
        -> .bpf(800).lpq(10)

   E. DISTORTION, BITCRUSH & LO-FI:
      - Plain English: "bitcrush drums", "vintage 8-bit arcade sampler sound"
        -> .crush(4).coarse(3)
      - Plain English: "hard wave shape distortion on kick/sub", "industrial overdrive"
        -> .shape(0.85) or .distort(2)
      - Plain English: "pitch squeeze harmonic multiplier"
        -> .squiz(3)

   F. ECHO, DELAY & REVERB SPACE:
      - Plain English: "dub techno delay with reverb", "echo chords infinitely"
        -> .delay(0.6).delaytime(0.25).delayfeedback(0.75).room(0.7)
      - Plain English: "micro-grain chop", "slice synth into 16 gated pieces"
        -> .chop(16) or .chop(8)

   G. BASS PURITY, MONOPHONIC CHOKING & ANTI-OVERLAP:
      - Plain English: "punchy clean bass", "tight staccato sub", "fix overlapping bass"
        -> .clip(1).cut(1) or .decay(0.25).sustain(0).clip(1)
      - RULE: All bass samples and synths (s("moog"), s("bass"), s("sub"), s("acid"), s("sawtooth")) playing sequential notes (e.g. n("~ 0 ~ 0 ~ 0 [~ 3] 0")) MUST include .clip(1).cut(1) to clip notes to event duration and choke previous notes monophonically.
      - Example: n("~ 0 ~ 0 ~ 0 [~ 3] 0").scale("C2:minor").s("moog").clip(1).cut(1).lpf(1200).gain(0.85)

3. EMBEDDED DEMO SOUND SET (Instant Local Audio):
   - DRUMS: "kick", "sub" (sub808), "snare", "clap", "hat", "openhat", "rim", "shaker", "perc", "crash"
   - SYNTHS & BASS: "acid" (TB-303 sawtooth), "moog" (analog sub bass - calibrated C2), "saw" (supersaw - C3), "juno" (vintage chord stab - C3), "pluck" (FM bell - C4), "rave" (90s hoover - C3)
   - FX & TRANSITIONS: "riser", "impact", "laser", "glitch", "noise"

4. CRITICAL SYNTAX RULES:
   - In Strudel mini-notation, sound names inside s("...") MUST be alphabetical words (e.g. NEVER write s("808") or s("909") or s("303"). Always write s("sub"), s("kick"), s("acid"), s("snare"), etc.).
   - Basslines must have .clip(1).cut(1) to avoid overlapping sustains and low-end mud.
   - Always produce clean, valid Strudel syntax.
   - Group multiple simultaneous layers inside stack(
       s("kick*4"),
       s("~ snare ~ snare"),
       s("hat*8").gain(0.7),
       s("acid*8").n("<0 3 5 7>").jux(rev)
     )
   - Ensure all parentheses, quotes, and commas are properly closed.

5. OUTPUT FORMAT:
   You MUST return a JSON object with:
   - 'explanation': A concise 1-sentence description explaining the pattern effect translation (e.g. "Applied stereo juxtaposition (jux) with reverse to the 303 acid line, widening the stereo image.").
   - 'code': The complete, updated playable Strudel code.
   - 'visualHint': A vibrant hex color matching the vibe (e.g. "#00ffcc" for jux/acid, "#ec4899" for vowel/slapback, "#f59e0b" for bitcrush, "#8b5cf6" for dub delay).
`;

export interface DefaultPattern {
  id: string;
  title: string;
  genre: string;
  explanation: string;
  visualHint: string;
  code: string;
}

export const DEFAULT_PATTERNS: DefaultPattern[] = [
  {
    id: 'acid-techno',
    title: '303 Acid Techno & Stereo Juxtaposition',
    genre: 'Acid Techno',
    explanation: 'Loaded Acid Techno: 909 Kick & Snare, sizzling hi-hats, resonant 303 acid line with stereo juxtaposition (jux rev), and Juno chords.',
    visualHint: '#00ffcc',
    code: `stack(
  // 909 Kick & Snare
  s("kick*4"),
  s("~ snare ~ snare"),
  // Sizzling Hi-Hats
  s("hat*8").gain(0.65),
  s("~ openhat ~ openhat").gain(0.7),
  // Resonant 303 Acid Bassline (monophonic choked)
  n("<0 3 [5 7] [10 12]>*8").scale("C2:minor").s("sawtooth").clip(1).cut(1).lpf(1200).lpq(8).jux(rev).gain(0.85),
  // Lush Juno Chord Stabs
  s("~ juno ~ ~").gain(0.5)
)`
  },
  {
    id: 'dub-techno',
    title: 'Dub Techno & Infinite Tape Space',
    genre: 'Dub Techno',
    explanation: 'Loaded Dub Techno: 4-on-the-floor kick, deep analog sub bass, and rhythmic Juno chord stabs drenched in tape delay & room reverb.',
    visualHint: '#8b5cf6',
    code: `stack(
  // Deep 4/4 Kick & Offbeat Hats
  s("kick*4"),
  s("~ openhat ~ openhat").gain(0.65),
  s("hat*16").pan(sine.range(0.2, 0.8).slow(2)).gain(0.5),
  // Deep Analog Sub Bass (choked & clipped)
  n("~ 0 ~ 0 ~ 0 [~ 3] 0").scale("C2:minor").s("moog").clip(1).cut(1).lpf(800).gain(0.9),
  // Echoing Dub Chords with Delay & Room Reverb
  s("~ juno ~ ~").delay(0.55).delaytime(0.25).delayfeedback(0.7).room(0.65).gain(0.6)
)`
  },
  {
    id: 'cyberpunk-synthwave',
    title: 'Cyberpunk Synthwave & Harmonic Plucks',
    genre: 'Synthwave',
    explanation: 'Loaded Cyberpunk Synthwave: Driving punchy drums, 16th-note rolling Moog bass, and stereo harmonized (+7 5th) FM plucks.',
    visualHint: '#ec4899',
    code: `stack(
  // Punchy 80s Drum Beat
  s("kick*4"),
  s("~ [snare, clap] ~ snare"),
  s("hat*16").gain(0.6),
  // 16th-Note Driving Moog Bass
  n("<0 0 3 3 5 5 7 10>*8").scale("C2:minor").s("moog").clip(1).cut(1).lpf(1400).gain(0.85),
  // Harmonized FM Pluck Melody (+7 semitones in right ear)
  s("pluck*8").n("<0 3 7 10 12 10 7 3>").jux(x => x.add(7)).gain(0.75)
)`
  },
  {
    id: 'glitch-talking-formants',
    title: 'Glitch House & Talking Vowel Formants',
    genre: 'Glitch House',
    explanation: 'Loaded Glitch House: Micro-chopped percussion, tight sub bass, and a talking vocal formant lead cycling through vowel filters.',
    visualHint: '#f59e0b',
    code: `stack(
  // Tight House Groove
  s("kick*4"),
  s("~ [snare, clap] ~ snare"),
  s("hat*8").gain(0.65),
  // Talking Acid Formant Lead (a o e i)
  s("acid*8").n("<0 3 5 7 10 12 7 3>").vowel("<a o e i>").clip(1).cut(1).gain(0.85),
  // Warm Moog Sub Foundation
  n("<0 3 5 0>").scale("C2:minor").s("moog").clip(1).cut(1).gain(0.85)
)`
  },
  {
    id: 'trap-ratchets',
    title: 'Trap Beat & Ratchet Hi-Hat Rolls',
    genre: 'Trap',
    explanation: 'Loaded Trap: Heavy Sub 808 glide, rim-shot snare, dynamic 2x and 4x hi-hat ratchets (ply), and canon melodic arps.',
    visualHint: '#ef4444',
    code: `stack(
  // Sub 808 & Snare on 3
  s("sub*4").clip(1).cut(1).gain(0.95),
  s("~ ~ snare ~"),
  // Rapid-Fire Ratcheted Trap Hats
  s("hat*8").ply("<1 2 [2 4] 4>").gain(0.65),
  s("~ openhat ~ ~").gain(0.7),
  // Dark Minor Arp with 1/16 Canon Echo
  s("pluck*8").n("<0 3 7 10>").off(1/16, x => x.add(4)).gain(0.8)
)`
  },
  {
    id: 'electro-breaks',
    title: 'Electro Breaks & LFO Filter Sweeps',
    genre: 'Electro Breaks',
    explanation: 'Loaded Electro Breaks: Syncopated breakbeat kick/snare pattern, dynamic shakers, and a sweeping resonant lowpass filter bassline.',
    visualHint: '#06b6d4',
    code: `stack(
  // Syncopated Breakbeat Rhythm
  s("kick [~ kick] kick ~"),
  s("~ snare ~ snare"),
  s("hat*16").gain(0.6),
  // Resonant LFO Lowpass Filter Sweep
  n("<0 2 [3 5] [7 10]>*8").scale("C2:minor").s("acid").lpf(sine.range(300, 2600).slow(4)).lpq(8).clip(1).cut(1).gain(0.85),
  // Stereo Juno Stab
  s("~ juno ~ ~").jux(rev).gain(0.45)
)`
  },
  {
    id: 'rave-hoover',
    title: '90s Rave & Hoover Energy',
    genre: '90s Rave',
    explanation: 'Loaded 90s Rave: Pumping 4-on-the-floor kick, 90s pitch-bending hoover synth stabs, and punchy choked sub bass.',
    visualHint: '#3b82f6',
    code: `stack(
  // High-Energy 4/4 Drums
  s("kick*4"),
  s("~ [snare, clap] ~ [snare, clap]"),
  s("hat*8").gain(0.65),
  s("~ openhat ~ openhat").gain(0.7),
  // 90s Pitch-Bending Hoover Stab
  s("rave*4").gain(0.7).jux(rev),
  // Punchy Choked Moog Bass Foundation
  n("<0 3 5 7>*4").scale("C2:minor").s("moog").clip(1).cut(1).lpf(1000).gain(0.9)
)`
  },
  {
    id: 'lofi-arcade',
    title: '8-Bit Arcade & Lo-Fi Bitcrush',
    genre: 'Lo-Fi Arcade',
    explanation: 'Loaded Lo-Fi Chiptune: Gritty 8-bit crushed arcade drums, fast arpeggiated chip plucks, and vintage analog bass.',
    visualHint: '#10b981',
    code: `stack(
  // Gritty 8-Bit Crushed Drums
  s("kick*4").crush(4).coarse(3),
  s("~ snare ~ snare").crush(4).coarse(3),
  s("hat*8").gain(0.55),
  // Fast Chip Arpeggio Melody
  s("pluck*16").n("<0 3 7 12 7 3 5 10>").gain(0.75),
  // Vintage Chiptune Bass
  n("<0 3 5 0>*4").scale("C2:minor").s("moog").clip(1).cut(1).gain(0.85)
)`
  }
];

/**
 * Returns a random starting pattern from the curated library.
 */
export function getRandomInitialPattern(): DefaultPattern {
  const randomIndex = Math.floor(Math.random() * DEFAULT_PATTERNS.length);
  return DEFAULT_PATTERNS[randomIndex];
}

export const INITIAL_PATTERN = DEFAULT_PATTERNS[0].code;

export const MAX_RETRIES = 3;

// Default AI Model
export const DEFAULT_MODEL = 'google/gemini-2.5-flash';

// Storage key for API Key
export const API_KEY_STORAGE_KEY = 'strudel_speak_gemini_key';

