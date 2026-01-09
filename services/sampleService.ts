import { strudelService } from './strudelService';
import { Sample, SampleBank, FileSystemDirectoryHandle, FileSystemHandle, FileSystemFileHandle } from '../types';
import Dexie, { Table } from 'dexie';

// --- Database Schema ---
interface SampleRecord {
  id?: number;
  name: string; // "bd/001"
  bank: string; // "bd"
  data: Blob;
}

class StrudelSamplesDB extends Dexie {
  samples!: Table<SampleRecord, number>;

  constructor() {
    super('StrudelSamplesDB');
    // Cast to any to bypass TS error regarding version method visibility
    (this as any).version(1).stores({
      samples: '++id, name, bank'
    });
  }
}

const db = new StrudelSamplesDB();

// --- Service ---
class SampleService {
  private samples: Map<string, Sample> = new Map();
  private isSupported: boolean;
  private banksCache: SampleBank[] = [];

  constructor() {
    this.isSupported = 'showDirectoryPicker' in window;
    this.initOfflineSamples();
  }

  // --- Initialization ---

  /**
   * Load all samples stored in IndexedDB and register them with Strudel
   */
  private async initOfflineSamples() {
    try {
      const records = await db.samples.toArray();
      console.log(`[SampleService] Loading ${records.length} offline samples from DB...`);
      
      for (const record of records) {
        const url = URL.createObjectURL(record.data);
        strudelService.registerSample(record.name, url);
        
        this.samples.set(record.name, {
          name: record.name,
          path: url,
          source: 'offline',
          bank: record.bank
        });
      }
    } catch (e) {
      console.error('[SampleService] Failed to load offline samples:', e);
    }
  }

  public getIsSupported() {
    return this.isSupported;
  }

  public getLoadedSamples(): Sample[] {
    return Array.from(this.samples.values());
  }

  // --- Local File System (Phase 2 Part A) ---

  public async linkLocalFolder(): Promise<number> {
    if (!this.isSupported) {
      throw new Error('File System Access API not supported in this browser.');
    }

    try {
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();
      await this.scanDirectory(dirHandle, '');
      return this.samples.size;
    } catch (err: any) {
      if (err.name === 'AbortError') return 0;
      throw err;
    }
  }

  private async scanDirectory(dirHandle: FileSystemDirectoryHandle, pathPrefix: string) {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        await this.processFile(entry as FileSystemFileHandle, pathPrefix);
      } else if (entry.kind === 'directory') {
        const newPrefix = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name;
        // @ts-ignore
        const subDir = await dirHandle.getDirectoryHandle(entry.name);
        await this.scanDirectory(subDir, newPrefix);
      }
    }
  }

  private async processFile(fileHandle: FileSystemFileHandle, pathPrefix: string) {
    const file = await fileHandle.getFile();
    const name = file.name;
    const lowerName = name.toLowerCase();

    if (lowerName.endsWith('.wav') || lowerName.endsWith('.mp3') || lowerName.endsWith('.ogg')) {
      const url = URL.createObjectURL(file);
      const baseName = name.replace(/\.[^/.]+$/, "");
      let registryName = baseName;
      if (pathPrefix) {
        registryName = `${pathPrefix}/${baseName}`;
      }

      strudelService.registerSample(registryName, url);

      this.samples.set(registryName, {
        name: registryName,
        path: url,
        source: 'local'
      });
    }
  }

  // --- GitHub / Cloud Samples (Phase 2 Part B) ---

  /**
   * Fetches list of sample banks (folders) from tidalcycles/Dirt-Samples
   */
  public async fetchGithubBanks(): Promise<SampleBank[]> {
    if (this.banksCache.length > 0) return this.banksCache;

    try {
      // Use GitHub API to list folders in the repo
      const response = await fetch('https://api.github.com/repos/tidalcycles/Dirt-Samples/contents/');
      if (!response.ok) throw new Error('GitHub API limit or network error');
      
      const items = await response.json();
      
      // Get list of banks currently in DB to mark 'isOffline'
      const offlineBanks = await this.getOfflineBanks();

      const banks: SampleBank[] = items
        .filter((item: any) => item.type === 'dir' && !item.name.startsWith('.'))
        .map((item: any) => ({
          name: item.name,
          url: item.url, // API url to get contents
          sampleCount: 0, // We don't know yet without extra reqs
          isOffline: offlineBanks.has(item.name)
        }));

      this.banksCache = banks;
      return banks;
    } catch (e) {
      console.error('[SampleService] GitHub Fetch Error:', e);
      throw e;
    }
  }

  /**
   * Download all samples in a bank and store in IndexedDB
   */
  public async downloadBank(bank: SampleBank, onProgress?: (percent: number) => void): Promise<void> {
    try {
        // 1. Get file list
        const response = await fetch(bank.url);
        const files = await response.json();
        
        const audioFiles = files.filter((f: any) => 
            f.name.endsWith('.wav') || f.name.endsWith('.mp3') || f.name.endsWith('.ogg')
        );

        if (audioFiles.length === 0) throw new Error('No audio files found in bank');

        let completed = 0;

        // 2. Process in chunks to avoid rate limiting
        const CHUNK_SIZE = 5;
        for (let i = 0; i < audioFiles.length; i += CHUNK_SIZE) {
            const chunk = audioFiles.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (file: any) => {
                // Fetch raw content
                const rawUrl = file.download_url;
                const blobResp = await fetch(rawUrl);
                const blob = await blobResp.blob();

                // Generate Strudel name (bank/filename_no_ext)
                const baseName = file.name.replace(/\.[^/.]+$/, "");
                const registryName = `${bank.name}/${baseName}`;

                // Store in DB
                await db.samples.put({
                    name: registryName,
                    bank: bank.name,
                    data: blob
                });

                // Register live
                const objUrl = URL.createObjectURL(blob);
                strudelService.registerSample(registryName, objUrl);
                
                this.samples.set(registryName, {
                    name: registryName,
                    path: objUrl,
                    source: 'offline',
                    bank: bank.name
                });
            }));
            
            completed += chunk.length;
            if (onProgress) onProgress(Math.round((completed / audioFiles.length) * 100));
        }

        // Update cache state
        const bankIndex = this.banksCache.findIndex(b => b.name === bank.name);
        if (bankIndex !== -1) this.banksCache[bankIndex].isOffline = true;

    } catch (e) {
        console.error(`[SampleService] Failed to download bank ${bank.name}:`, e);
        throw e;
    }
  }

  public async deleteBank(bankName: string) {
      await db.samples.where('bank').equals(bankName).delete();
      
      // Update local state
      // Note: We can't easily unregister from Strudel without reloading, but we can remove from our list
      // For now, we accept that 'unregister' isn't fully supported by strudel core runtime dynamically
      
      const bankIndex = this.banksCache.findIndex(b => b.name === bankName);
      if (bankIndex !== -1) this.banksCache[bankIndex].isOffline = false;
  }

  private async getOfflineBanks(): Promise<Set<string>> {
      const keys = await db.samples.orderBy('bank').uniqueKeys();
      return new Set(keys.map(k => String(k)));
  }
}

export const sampleService = new SampleService();