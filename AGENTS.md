# Strudelspeak & Strudel Development Guidelines

Whenever working on **Strudelspeak** or any Strudel music live-coding task:

1. **Reference Local Documentation Library**:
   - Always consult the complete scraped documentation files in `docs/strudel/` (indexed in `docs/strudel/README.md`).
   - Use precise Strudel syntax, pattern functions, mini-notation, synthesis, sample packs, and DSP controls as documented in:
     - `docs/strudel/workshop/` — Getting started, sound creation, notes, and effects.
     - `docs/strudel/making-sound/` — Samples, synths (`sawtooth`, `sine`, `triangle`, `square`, FM), audio-effects (`.lpf()`, `.delay()`, `.room()`, `.shape()`, `.crush()`), and MIDI/OSC.
     - `docs/strudel/pattern-functions/` — Pattern modifiers (`.fast()`, `.slow()`, `.jux()`, `.every()`, `.sometimes()`, `.ply()`, `.cat()`, `.stack()`, `.struct()`, etc.), LFO signals (`sine`, `saw`, `perlin`), and tonal/scale helpers.
     - `docs/strudel/guides/` — Mini-notation grammar (`[a b]`, `<a b>`, `a*4`, `a/2`, `a?`, `a@3`, Euclidean `a(3,8)`), recipes, and visual feedbacks.
     - `docs/strudel/understand/` — Pitch notation, cycles, voicings, xenharmonics, and temporal alignment.

2. **Core Strudelspeak Principles**:
   - Write idiomatic Strudel code conforming to official syntax and method chaining.
   - Maintain musical coherence (meter, cycle alignments, polyrhythms, and harmonic structures).
   - Leverage live-coding interactivity and mini-notation efficiency.
