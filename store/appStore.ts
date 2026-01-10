import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage, AppMode, JamMode } from '../types';
import { DEFAULT_MODEL } from '../constants';

interface AppState {
  // UI State
  mode: AppMode;
  sidebarTab: 'chat' | 'samples';
  isPlaying: boolean;
  code: string;
  messages: ChatMessage[];
  input: string;
  isGenerating: boolean;
  visualHint: string;
  chaos: number;
  density: number;
  apiKey: string;
  selectedModel: string;
  showKeyModal: boolean;
  showAdmin: boolean;
  isVSCode: boolean;

  // Jam Buddy State
  jamMode: JamMode;
  isJamming: boolean;

  // Actions
  setMode: (mode: AppMode) => void;
  setSidebarTab: (tab: 'chat' | 'samples') => void;
  setIsPlaying: (playing: boolean) => void;
  setCode: (code: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setInput: (input: string) => void;
  setIsGenerating: (generating: boolean) => void;
  setVisualHint: (hint: string) => void;
  setChaos: (chaos: number) => void;
  setDensity: (density: number) => void;
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  setShowKeyModal: (show: boolean) => void;
  setShowAdmin: (show: boolean) => void;
  setIsVSCode: (vscode: boolean) => void;
  setJamMode: (mode: JamMode) => void;
  setIsJamming: (jamming: boolean) => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  // Initial state
  mode: AppMode.ADVANCED,
  sidebarTab: 'chat',
  isPlaying: false,
  code: `s("bd cp sd sn oh cr hh rim")`,
  messages: [
    { role: 'system', content: 'StrudelSpeak initialized. Ready for prompt.' }
  ],
  input: '',
  isGenerating: false,
  visualHint: '#4ade80',
  chaos: 0,
  density: 0.5,
  apiKey: '',
  selectedModel: DEFAULT_MODEL,
  showKeyModal: false,
  showAdmin: false,
  isVSCode: false,
  jamMode: JamMode.OFF,
  isJamming: false,

  // Actions
  setMode: (mode) => set({ mode }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCode: (code) => set({ code }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  setInput: (input) => set({ input }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setVisualHint: (hint) => set({ visualHint: hint }),
  setChaos: (chaos) => set({ chaos }),
  setDensity: (density) => set({ density }),
  setApiKey: (key) => set({ apiKey: key }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setShowKeyModal: (show) => set({ showKeyModal: show }),
  setShowAdmin: (show) => set({ showAdmin: show }),
  setIsVSCode: (vscode) => set({ isVSCode: vscode }),
  setJamMode: (mode) => set({ jamMode: mode }),
  setIsJamming: (jamming) => set({ isJamming: jamming }),
}));
