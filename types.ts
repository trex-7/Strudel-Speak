
export interface StrudelPattern {
  code: string;
  explanation: string;
  visualHint?: string;
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'code' | 'error';
  metadata?: {
    code?: string;
    explanation?: string;
    retryCount?: number;
  };
}

export enum AppMode {
  SIMPLE = 'SIMPLE',
  ADVANCED = 'ADVANCED'
}

export enum JamMode {
  OFF = 0,
  BARS_8 = 8,
  BARS_16 = 16,
  BARS_32 = 32
}

export interface GenerationConfig {
  chaos: number;
  density: number;
  temperature: number;
}

export interface StrudelError {
  message: string;
  line?: number;
  column?: number;
}

export interface Sample {
  name: string;
  path: string;
  source: 'core' | 'local' | 'codeberg' | 'offline';
  bank?: string;
}

export interface SampleBank {
  name: string;
  url: string;
  sampleCount: number;
  isOffline: boolean;
  size?: string;
  isKit?: boolean;
  banks?: string[]; // List of bank names in this kit (e.g. ["bd", "sd"])
  bankSamples?: Record<string, string[]>; // Mapping of bank name to list of sample names
}

export interface SampleAssignment {
  sampleName: string; // The full name like "AkaiXR10:akaixr10-bd:0"
  type: string; // The drum type like "bd", "sd", "hh", "cp"
  kitName: string;
}

// Minimal type definitions for File System Access API
export interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  values(): AsyncIterableIterator<FileSystemHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

// Phase 3: Logging & Admin Types
export interface InteractionLog {
  id: string;
  timestamp: number;
  userPrompt: string;
  chaosLevel: number;
  model?: string;
  attempts: {
    attemptNumber: number;
    generatedCode: string;
    error?: string;
    isValid: boolean;
  }[];
  finalCode?: string;
  status: 'success' | 'failed';
}

// VS Code Webview API Type
export interface VSCodeApi {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}
