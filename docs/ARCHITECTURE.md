# StrudelSpeak Architecture & Technical Overview

StrudelSpeak is an AI-augmented live coding environment for the [Strudel](https://strudel.cc) music system. This document outlines the core subsystems and data flow.

---

## 1. High-Level Architecture

```
                       ┌──────────────────────────────┐
                       │        User Interface        │
                       │  (React 19 + Tailwind CSS)   │
                       └──────────────┬───────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
┌───────────────────────────┐                   ┌───────────────────────────┐
│     AI Generation &       │                   │    Strudel Audio Engine   │
│   Self-Healing Service    │                   │   (@strudel/web & core)   │
│   (services/geminiService)│                   │   (services/strudelService│
└─────────────┬─────────────┘                   └─────────────┬─────────────┘
              │                                               │
              ▼                                               ▼
┌───────────────────────────┐                   ┌───────────────────────────┐
│    Model: Gemini 3.7      │                   │      WebAudio Output      │
│ (ThinkingLevel.LOW config)│                   │    (Speakers / DAC)       │
└───────────────────────────┘                   └───────────────────────────┘
```

---

## 2. Core Subsystems

### A. Gemini Service & Low-Latency AI Pipeline (`services/geminiService.ts`)
- **Fast Reasoning Configuration**: Configured with `thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }` using the `@google/genai` SDK to deliver responsive 1–2 second responses.
- **Fail-Safe Serverless Routing**: Automatically probes `/api/*` and `/.netlify/functions/*` endpoints, gracefully falling back to client-side or offline pattern builders if backend calls encounter network disconnects.
- **Multi-Track AST & Syntax Validator**: Validates patterns against Strudel parser grammar prior to code execution, catching unclosed brackets, missing delimiters, or invalid method chains.

### B. Strudel Audio Engine (`services/strudelService.ts`)
- Powered by official `@strudel/core`, `@strudel/webaudio`, and `@strudel/transpiler`.
- Evaluates code safely inside the browser's WebAudio context with cycle-aligned quantization and smooth tempo adjustments.
- Real-time DSP chaining applies lowpass/highpass filters, delay, room reverb, distortion, and bitcrush parameters without interrupting live playback.

### C. Sample Manager & Storage (`services/sampleStorageService.ts`)
- Local audio files and sample packs are cached in the browser using Dexie (IndexedDB).
- Supports standard audio formats (`.wav`, `.mp3`, `.ogg`, `.flac`) and ZIP sample pack extraction using `jszip`.

### D. Self-Healing & Diagnostics Engine
1. **Single-Line Surgery (`diagnoseAndFixLine`)**: Pinpoints a broken track line and repairs it in isolation while preserving unaffected tracks.
2. **Multi-Track Batch Healing (`diagnoseAndFixBatchTracks`)**: Analyzes full pattern polyphony and repairs syntax and timing errors across all tracks simultaneously.
3. **Continuous Pattern Evolution (`JamBuddy`)**: Listens to cycle boundaries and uses Gemini to intelligently introduce subtle melodic or rhythmic variations.
