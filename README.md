# StrudelSpeak v1.0.0

AI-augmented live coding environment for Strudel music patterns.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up API key:**
   - Copy `.env.local.example` to `.env.local`
   - Add your OpenRouter API key: `OPENROUTER_API_KEY=your_key_here`
   - Or get a key from: https://openrouter.ai/keys

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Navigate to `http://localhost:3000`
   - Add your OpenRouter API key if prompted
   - Start generating AI music patterns!

## 🎵 Features

- **AI Pattern Generation** - Claude-4.5-sonnet powered music composition
- **Live Audio Engine** - Real-time Strudel pattern playback
- **Code Editor** - Monaco editor with syntax highlighting
- **Sample Management** - Local/cloud sample loading with caching
- **Jam Buddy** - Automatic pattern evolution
- **Admin Console** - Debug logs and error tracking

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **State:** Zustand
- **Audio:** @strudel/core, @strudel/webaudio, @strudel/transpiler
- **AI:** OpenRouter SDK (Claude-4.5-sonnet)
- **Storage:** IndexedDB (Dexie), Web File System API

## 📁 Project Structure

```
├── app/                 # Next.js app directory
├── components/          # React components
├── services/           # Business logic services
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
└── .env.local          # Environment variables
```

## 🎼 Usage

1. **Generate Patterns:** Type natural language prompts like "Create a funky bassline"
2. **Play Music:** Click the play button to hear your compositions
3. **Edit Code:** Modify patterns in the code editor
4. **Load Samples:** Use the Samples tab to load drum kits and sounds
5. **Jam Mode:** Enable auto-evolution for continuous music generation

## 🔧 Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## 📄 License

This project implements the StrudelSpeak specification for AI-augmented live coding.
