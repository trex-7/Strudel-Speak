export interface PatternEffectDemo {
  id: string;
  category: 'Stereo & Spatial' | 'Temporal & Offsets' | 'Probability & Multipliers' | 'Filter & Modulation' | 'Distortion & Lo-Fi' | 'Echo & Space';
  title: string;
  effectSyntax: string;
  englishPrompt: string;
  explanation: string;
  visualHint: string;
  code: string;
}

export const PATTERN_EFFECTS_DEMOS: PatternEffectDemo[] = [
  // --- 1. STEREO & SPATIAL (jux, pan, stereo offsets) ---
  {
    id: 'jux-rev',
    category: 'Stereo & Spatial',
    title: 'Stereo Juxtaposition (jux rev)',
    effectSyntax: '.jux(rev)',
    englishPrompt: 'Take the acid bassline and apply stereo juxtaposition (jux) with reverse so the left channel plays forward and the right channel plays in reverse',
    explanation: 'jux(rev) splits the pattern into stereo: the left channel plays normally, while the right channel receives the rev (reverse) transformation, creating a wide 3D space.',
    visualHint: '#00ffcc',
    code: `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*8").gain(0.6),
  // Left channel plays forward, Right channel plays in reverse
  n("<0 3 [5 7] [10 12]>*8").scale("C2:minor").s("sawtooth").lpf(1200).lpq(8).jux(rev).gain(0.85),
  s("~ juno ~ ~").gain(0.4)
)`
  },
  {
    id: 'jux-pitch-shift',
    category: 'Stereo & Spatial',
    title: 'Stereo Harmonic Spread (jux add 7)',
    effectSyntax: '.jux(x => x.add(7))',
    englishPrompt: 'Make the synth lead stereo by shifting the right channel up by a 5th (7 semitones) using jux',
    explanation: 'jux(x => x.add(7)) plays the root pitch in the left speaker and a perfect fifth above (+7 semitones) in the right speaker for a wide stereo harmony.',
    visualHint: '#38bdf8',
    code: `stack(
  s("kick*4"),
  s("~ [snare, clap] ~ snare"),
  s("hat*16").gain(0.55),
  // Wide 5th harmonic spread across stereo channels
  s("pluck*8").n("<0 3 5 7 10 12 7 3>").jux(x => x.add(7)).gain(0.8),
  s("sub*4").gain(0.9)
)`
  },
  {
    id: 'lfo-pan-sweep',
    category: 'Stereo & Spatial',
    title: 'Auto-Panning LFO Sweep',
    effectSyntax: '.pan(sine.range(0.1, 0.9).slow(2))',
    englishPrompt: 'Sweep the closed hi-hats smoothly from left to right using a slow sine wave LFO pan',
    explanation: 'pan(sine.range(0.1, 0.9).slow(2)) modulates the stereo position continuously between 10% left and 90% right over 2 cycles.',
    visualHint: '#818cf8',
    code: `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  // Hats oscillating from left to right smoothly
  s("hat*16").pan(sine.range(0.1, 0.9).slow(2)).gain(0.7),
  s("~ openhat ~ openhat").gain(0.75),
  s("acid*8").n("<0 3 5 7>").gain(0.85)
)`
  },

  // --- 2. TEMPORAL & OFFSETS (off, rev, every, chunk) ---
  {
    id: 'off-canon-echo',
    category: 'Temporal & Offsets',
    title: 'Canon Melodic Offset (off 1/16)',
    effectSyntax: '.off(1/16, x => x.add(4))',
    englishPrompt: 'Create a canon echo melody by offsetting a copy of the synth by 1/16th of a cycle transposed up by 4 semitones',
    explanation: 'off(1/16, x => x.add(4)) layers an identical pattern delayed by 1/16th of a cycle and shifts its pitch up 4 semitones, producing an interlocking arpeggiated canon.',
    visualHint: '#a855f7',
    code: `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*8").gain(0.6),
  // Arp canon delayed by 1/16 cycle & pitch shifted +4
  s("acid*8").n("<0 3 7 10>").off(1/16, x => x.add(4)).gain(0.85),
  s("~ juno ~ ~").gain(0.5)
)`
  },
  {
    id: 'off-stereo-slapback',
    category: 'Temporal & Offsets',
    title: 'Slapback Rhythmic Offset (off 1/8 pan)',
    effectSyntax: '.off(1/8, x => x.pan(0.85).gain(0.7))',
    englishPrompt: 'Add an 8th-note slapback shadow to the percussion panned hard right at lower volume',
    explanation: 'off(1/8, x => x.pan(0.85).gain(0.7)) creates a tight slapback rhythm offset by an 8th note placed into the right channel.',
    visualHint: '#ec4899',
    code: `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*8").gain(0.6),
  // Percussion with 1/8 offset slapback shadow on the right
  s("perc*4").n("<0 2 4 5>").off(1/8, x => x.pan(0.85).gain(0.7)).gain(0.8),
  s("sub*4").gain(0.9)
)`
  },
  {
    id: 'every-cycle-fill',
    category: 'Temporal & Offsets',
    title: 'Every 4th Cycle Fast Drum Roll',
    effectSyntax: '.every(4, x => x.fast(2))',
    englishPrompt: 'Every 4 cycles double the speed of the snare and hi-hats to make an energetic drum roll fill',
    explanation: 'every(4, x => x.fast(2)) keeps the standard groove for 3 bars and automatically accelerates the pattern to double speed on every 4th bar.',
    visualHint: '#f59e0b',
    code: `stack(
  s("kick*4"),
  // Snare doubles speed on bar 4 for a live roll fill
  s("~ snare ~ snare").every(4, x => x.fast(2)),
  // Hats double speed on bar 4
  s("hat*8").every(4, x => x.fast(2)).gain(0.7),
  s("acid*8").n("<0 3 5 7>").gain(0.85)
)`
  },
  {
    id: 'reverse-pattern',
    category: 'Temporal & Offsets',
    title: 'Pattern Time Reversal (rev)',
    effectSyntax: '.rev()',
    englishPrompt: 'Reverse the entire synth melody groove so it plays backwards with reversed phrasing',
    explanation: 'rev() reverses the time direction of events within each cycle, turning rising arpeggios into cascading falling runs.',
    visualHint: '#06b6d4',
    code: `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*8").gain(0.6),
  // Acid melody playing in reverse sequence
  s("acid*8").n("<0 2 5 7 9 12 14 16>").rev().gain(0.85),
  s("~ juno ~ ~").gain(0.5)
)`
  },

  // --- 3. PROBABILITY & MULTIPLIERS (ply, sometimes, degrade, rarely) ---
  {
    id: 'ply-ratchet',
    category: 'Probability & Multipliers',
    title: 'Trap Ratchet Stutter (ply 2 / ply 4)',
    effectSyntax: '.ply("<1 2 [2 4] 4>")',
    englishPrompt: 'Apply trap hi-hat ratchets using ply to multiply triggers by 2x and 4x across the bar',
    explanation: 'ply(n) subdivides individual triggers into multiple hits. Cycling ply("<1 2 [2 4] 4>") creates authentic rapid-fire trap rolls.',
    visualHint: '#e11d48',
    code: `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  // Hi-hats with dynamic 2x and 4x stutter ratchets
  s("hat*8").ply("<1 2 [2 4] 4>").gain(0.65),
  s("sub*4").gain(0.9),
  s("acid*4").n("<0 3 7 10>").gain(0.8)
)`
  },
  {
    id: 'sometimes-octave-flip',
    category: 'Probability & Multipliers',
    title: 'Probabilistic Octave Jump (sometimes speed 2)',
    effectSyntax: '.sometimes(x => x.speed(2))',
    englishPrompt: 'Make the acid bassline randomly jump an octave higher 50% of the time using sometimes',
    explanation: 'sometimes(fn) applies a transformation with a 50% probability per event, giving organic, non-repetitive live variety.',
    visualHint: '#10b981',
    code: `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*8").gain(0.65),
  // 50% chance each note flips an octave up (speed 2)
  s("acid*8").n("<0 3 5 7 10 12>").sometimes(x => x.speed(2)).gain(0.85)
)`
  },
  {
    id: 'degrade-glitch-drop',
    category: 'Probability & Multipliers',
    title: 'Glitchy Note Drops (degradeBy 0.35)',
    effectSyntax: '.degradeBy(0.35)',
    englishPrompt: 'Glitch out the synth pluck pattern by randomly dropping 35% of the notes using degradeBy',
    explanation: 'degradeBy(0.35) randomly eliminates 35% of notes on each pass, creating unpredictable IDM / modular-style syncopation.',
    visualHint: '#6366f1',
    code: `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*16").degradeBy(0.25).gain(0.6),
  // Glitchy modular pluck with random note dropouts
  s("pluck*16").n("<0 3 5 7 10 12 14 15>").degradeBy(0.35).gain(0.8),
  s("sub*4").gain(0.85)
)`
  },

  // --- 4. FILTER & MODULATION (lpf, lpq, vowel, hpf, sine.range) ---
  {
    id: 'lpf-resonant-sweep',
    category: 'Filter & Modulation',
    title: 'Resonant Acid Filter Sweep (lpf + sine)',
    effectSyntax: '.lpf(sine.range(200, 3200).slow(4)).lpq(8)',
    englishPrompt: 'Add a sweeping low-pass filter to the 303 acid line that opens and closes smoothly over 4 bars with high resonance (lpq 8)',
    explanation: 'lpf(...) dynamically shifts the filter cutoff frequency between 200 Hz and 3200 Hz using a sine LFO over 4 cycles, while lpq(8) creates a squelchy resonant peak.',
    visualHint: '#10b981',
    code: `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*8").gain(0.65),
  // Squelchy TB-303 sweep with resonant peak
  s("acid*16")
    .n("<0 3 5 7 10 12 10 7>")
    .lpf(sine.range(200, 3200).slow(4))
    .lpq(8)
    .gain(0.85)
)`
  },
  {
    id: 'vocal-formant-vowel',
    category: 'Filter & Modulation',
    title: 'Talking Synth Formant (vowel a e i o u)',
    effectSyntax: '.vowel("<a o e i>")',
    englishPrompt: 'Turn the synth into a talking vocoder effect using cycling vowel formants (a, o, e, i)',
    explanation: 'vowel("<a o e i>") applies resonant vocal tract formant filters to shape the harmonics of the synth into distinct talking vowel syllables.',
    visualHint: '#f43f5e',
    code: `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*8").gain(0.6),
  // Talking synth with cycling vowel formant filters
  s("saw*8").n("<0 3 7 10 12 10 7 3>").vowel("<a o e i>").gain(0.8),
  s("sub*4").gain(0.9)
)`
  },
  {
    id: 'hpf-dj-breakdown',
    category: 'Filter & Modulation',
    title: 'High-Pass Filter DJ Breakdown (hpf 1400)',
    effectSyntax: '.hpf(1400)',
    englishPrompt: 'Filter out the low frequencies on the entire drum stack with a 1400Hz high-pass filter for a club buildup breakdown',
    explanation: 'hpf(1400) cuts all frequencies below 1400 Hz, removing the heavy bass to create anticipation right before a massive drop.',
    visualHint: '#ec4899',
    code: `stack(
  // Filtered drums (no sub bass) for club breakdown
  s("kick*4").hpf(1400).gain(0.7),
  s("~ snare ~ snare").hpf(1400).gain(0.7),
  s("hat*16").gain(0.6),
  s("riser").gain(0.85),
  s("~ juno ~ ~").hpf(800).gain(0.6)
)`
  },

  // --- 5. DISTORTION & LO-FI (coarse, crush, distort, shape, squiz) ---
  {
    id: 'bitcrush-samplerate',
    category: 'Distortion & Lo-Fi',
    title: 'Vintage 8-Bit Lo-Fi Crush (crush 4 + coarse 3)',
    effectSyntax: '.crush(4).coarse(3)',
    englishPrompt: 'Bitcrush the drums into a gritty vintage 8-bit arcade sampler sound using crush and coarse sample reduction',
    explanation: 'crush(4) reduces bit depth to 4 bits for aggressive quantization distortion, while coarse(3) downsamples the audio rate for chiptune warmth.',
    visualHint: '#f59e0b',
    code: `stack(
  // Gritty 8-bit quantized drums
  s("kick*4").crush(4).coarse(3).gain(0.8),
  s("~ snare ~ snare").crush(4).coarse(3).gain(0.8),
  s("hat*8").crush(5).gain(0.55),
  s("pluck*8").n("<0 3 7 12 10 7 3 0>").gain(0.75)
)`
  },
  {
    id: 'analog-overdrive-shape',
    category: 'Distortion & Lo-Fi',
    title: 'Hard Analog Wave-Shape Overdrive (shape 0.85)',
    effectSyntax: '.shape(0.85).gain(0.7)',
    englishPrompt: 'Drive the 909 kick and sub bass into heavy industrial distortion using wave shaping',
    explanation: 'shape(0.85) applies non-linear wave-shaping transfer function to saturate and distort the bass into aggressive industrial techno punch.',
    visualHint: '#ef4444',
    code: `stack(
  // Saturated hard-clipped industrial kick
  s("kick*4").shape(0.85).gain(0.8),
  s("~ clap ~ clap").gain(0.7),
  s("hat*16").gain(0.5),
  // Distorted sub rumble
  s("sub*8").n("<0 0 3 0>").shape(0.75).gain(0.8)
)`
  },

  // --- 6. ECHO & SPACE (delay, delaytime, delayfeedback, room, chop) ---
  {
    id: 'dub-pingpong-delay',
    category: 'Echo & Space',
    title: 'Dub Techno Space Delay (delay + feedback + room)',
    effectSyntax: '.delay(0.6).delaytime(0.25).delayfeedback(0.75).room(0.7)',
    englishPrompt: 'Add a deep dub techno ping-pong echo delay with high feedback and a spacious cavernous reverb room to the chord stabs',
    explanation: 'delay(0.6).delaytime(0.25).delayfeedback(0.75) sets up dotted-eighth dub echoes with long feedback decay, immersed in a 70% reverb room.',
    visualHint: '#8b5cf6',
    code: `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*8").gain(0.6),
  // Dub chord stabs echoing infinitely into spacious reverb
  s("~ juno ~ ~")
    .delay(0.6)
    .delaytime(0.25)
    .delayfeedback(0.75)
    .room(0.7)
    .gain(0.85),
  s("sub*4").gain(0.85)
)`
  },
  {
    id: 'audio-chop-slicer',
    category: 'Echo & Space',
    title: 'Granular Beat Slicer (chop 8 / chop 16)',
    effectSyntax: '.chop(16)',
    englishPrompt: 'Chop the synth lead into 16 micro-sliced granular stutter chunks using chop',
    explanation: 'chop(16) slices each audio event into 16 equal micro-grain slices, creating rapid gated trance/stutter edits.',
    visualHint: '#06b6d4',
    code: `stack(
  s("kick*4"),
  s("~ snare ~ snare"),
  s("hat*8").gain(0.6),
  // 16-slice micro-gated rhythmic chop
  s("saw*4").n("<0 5 7 12>").chop(16).gain(0.8),
  s("acid*8").n("<0 3 5 7>").gain(0.8)
)`
  }
];

export const CATEGORIES = [
  'All',
  'Stereo & Spatial',
  'Temporal & Offsets',
  'Probability & Multipliers',
  'Filter & Modulation',
  'Distortion & Lo-Fi',
  'Echo & Space'
] as const;
