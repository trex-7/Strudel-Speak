# StrudelSpeak 🎵⚡

> **AI-Augmented Live Coding Environment for Strudel Algorithmic Music**

StrudelSpeak bridges natural language intent and the powerful [Strudel](https://strudel.cc) algorithmic music live-coding engine. Powered by Google Gemini 3.7 Flash, StrudelSpeak transforms natural language prompts into polyrhythmic patterns, automates audio effects, validates syntax in real time, and auto-heals code on the fly.

![StrudelSpeak Preview](screenshots/screenshot_hero.png)

---

## ✨ Features

- 🎹 **Natural Language to Strudel Live Coding**: Generate complex patterns, Euclidean rhythms, chord progressions, acid basslines, and generative ambient loops instantly.
- ⚡ **Sub-2s Low-Latency Generation**: Leverages `gemini-3.7-flash` with optimized low reasoning latency (`ThinkingLevel.LOW`) to prevent gateway timeouts.
- 🩺 **Self-Healing Code Engine**: Multi-tier syntax validator and diagnostic engine with single-line surgery and multi-track batch healing.
- 🎛️ **DSP & Pattern Effects Rack**: Real-time filter controls (`lpf`, `hpf`), spatial reverb (`room`), tape delay (`delay`), overdrive distortion (`shape`), and bitcrushing (`crush`).
- 🤖 **Jam Buddy Auto-Evolution**: Automatic evolving mode that riffs on your current live pattern at customizable cycle intervals.
- 🗄️ **Multi-Source Sample Manager**: Load local audio files, soundfont banks, sample packs (ZIP import), or cloud audio with IndexedDB/Dexie caching.
- 🔒 **Secure Dual Architecture**: Zero browser API key leaks. Supports both full-stack Express (`Render`/Docker) and serverless functions (`Netlify`).
- 💾 **Neon PostgreSQL & Local Persistence**: Store jams, learned rules, presets, and audio samples across sessions.

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/strudelspeak.git
cd strudelspeak
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
# Gemini API Key (Required for AI generation)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Neon PostgreSQL connection string (for cloud persistence)
DATABASE_URL=postgresql://user:password@ep-sample.neon.tech/strudelspeak?sslmode=require
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Architecture & Deployment

StrudelSpeak is designed with a universal deployment model supporting **Netlify**, **Render**, and local containerized environments.

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Frontend                        │
│             (React 19 + Vite + Tailwind CSS)                │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │  Netlify Serverless  │        │   Express Backend    │
    │ (netlify/functions/) │        │     (server.ts)      │
    └──────────┬───────────┘        └──────────┬───────────┘
               │                               │
               └───────────────┬───────────────┘
                               ▼
                ┌──────────────────────────────┐
                │     Google Gemini AI SDK     │
                │     (@google/genai 1.35)     │
                │     (gemini-3.7-flash)       │
                └──────────────────────────────┘
```

### 🌐 Deploying to Netlify (Recommended)

1. Connect your repository to **[Netlify](https://app.netlify.com)**.
2. In your site dashboard, go to **Site configuration** > **Environment variables**.
3. Add `GEMINI_API_KEY` with your API key from Google AI Studio.
4. Set build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions` (configured automatically via `netlify.toml`)
5. Click **Deploy Site**.

### 🚀 Deploying to Render / Custom Server

1. Create a new **Web Service** on [Render](https://render.com).
2. Set runtime to **Node**.
3. Configure build & start commands:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run start`
4. Add `GEMINI_API_KEY` under the **Environment** tab.

---

## 📁 Repository Structure

```
├── App.tsx                    # Main UI component & state wiring
├── components/                # Modular UI components
│   ├── CodeEditor.tsx         # Strudel live code editor
│   ├── Controls.tsx           # Playback, tempo, and pattern transport
│   ├── ErrorConsole.tsx       # Live diagnostic logs & self-repair actions
│   ├── Header.tsx             # Navigation & status bar
│   ├── JamBuddy.tsx           # Automatic pattern evolution engine
│   ├── PatternEffectsRack.tsx # Real-time DSP audio effects
│   ├── SampleManager.tsx      # Audio sample & ZIP pack manager
│   └── SettingsModal.tsx      # Configuration & key management
├── docs/                      # Technical documentation library
│   ├── strudel/               # Comprehensive scraped Strudel reference
│   ├── DEPLOYMENT.md          # Step-by-step Netlify & Render deployment
│   └── ARCHITECTURE.md        # Deep dive into AI streaming & audio pipeline
├── netlify/                   # Netlify Serverless Functions
│   └── functions/
│       ├── api.ts             # REST proxy for Netlify serverless execution
│       └── gemini.ts          # Dedicated Gemini invocation endpoint
├── server.ts                  # Express full-stack server & Vite middleware
├── services/
│   ├── geminiService.ts       # Gemini API client, low-latency reasoning & healing
│   ├── strudelService.ts      # WebAudio engine, transpiler & pattern parser
│   └── sampleStorageService.ts# IndexedDB sample persistence
├── store/                     # Zustand state management stores
├── constants.ts               # System prompts, few-shot examples & rules
├── netlify.toml               # Netlify routing and function build configuration
└── package.json               # Dependencies and build scripts
```

---

## 🎹 Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl` / `Cmd` + `Enter` | Evaluate & Play current pattern |
| `Ctrl` / `Cmd` + `.` | Stop playback |
| `Ctrl` / `Cmd` + `S` | Save current pattern preset |
| `Ctrl` / `Cmd` + `K` | Open AI prompt bar |

---

## 📚 Documentation

Detailed guides and references:

- **[Strudel Complete Reference Library](docs/strudel/README.md)** — In-depth guide to Strudel mini-notation, pattern functions, synthesis, and audio effects.
- **[Deployment Guide](docs/DEPLOYMENT.md)** — Production deployment checklists for Netlify, Render, and Neon PostgreSQL.
- **[Architecture Deep-Dive](docs/ARCHITECTURE.md)** — Explanation of the AST transpilation, self-healing pipeline, and WebAudio synchronization.

---

## 📄 License

MIT License. Designed for live coders, algorithmic music producers, and AI audio experimenters.
