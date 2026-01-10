import { strudelService } from './strudelService';
import { Sample, SampleBank, FileSystemDirectoryHandle, FileSystemHandle, FileSystemFileHandle, SampleAssignment } from '../types';
import Dexie, { Table } from 'dexie';

// --- Database Schema ---
interface SampleRecord {
  id?: number;
  name: string; // "bd:001"
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
  private sampleMap: Record<string, string> = {};
  private assignments: SampleAssignment[] = [];

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
      
      const banks: Record<string, string[]> = {};

      for (const record of records) {
        const url = URL.createObjectURL(record.data);
        
        if (!banks[record.bank]) banks[record.bank] = [];
        banks[record.bank].push(url);

        this.samples.set(record.name, {
          name: record.name,
          path: url,
          source: 'offline',
          bank: record.bank
        });
      }

      for (const bankName in banks) {
          console.log(`[SampleService] Registering bank: ${bankName} with ${banks[bankName].length} samples`);
          strudelService.registerBank(bankName, banks[bankName]);
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

  /**
   * Returns a string representation of available kits and banks for AI prompting
   */
  public getSampleSchema(): string {
    if (this.assignments.length > 0) {
        let schema = "SELECTED DRUM SAMPLES (Use these for beats):\n";
        this.assignments.forEach(a => {
            schema += `- Type "${a.type}": Use s("${a.sampleName}") [from kit ${a.kitName}]\n`;
        });
        return schema;
    }

    const loadedSamples = this.getLoadedSamples();
    const kits: Record<string, Set<string>> = {};
    
    loadedSamples.forEach(s => {
      if (s.name.includes(':')) {
        const parts = s.name.split(':');
        if (parts.length >= 2) {
          const kit = parts[0];
          const bank = parts.slice(1, parts.length - 1).join(':');
          if (bank) {
            if (!kits[kit]) kits[kit] = new Set();
            kits[kit].add(bank);
          }
        }
      }
    });

    if (Object.keys(kits).length === 0) return "";

    let schema = "AVAILABLE CUSTOM KITS AND BANKS:\n";
    Object.keys(kits).sort().forEach(kit => {
      schema += `- Kit "${kit}": Use s("${kit}:bankname") where bankname is one of: ${Array.from(kits[kit]).sort().join(', ')}\n`;
    });
    schema += "Example: s(\"AkaiXR10:akaixr10-bd\")\n";
    
    return schema;
  }

  public async auditionSample(sampleName: string) {
      const parts = sampleName.split(':');
      const index = parts.pop();
      const bankName = parts.join(':');

      // If not already loaded/registered, try to register the bank from sampleMap
      const isLoaded = this.samples.has(sampleName);
      if (!isLoaded) {
          const bankUrls: string[] = [];
          let i = 0;
          while (true) {
              const name = `${bankName}:${i}`;
              const url = this.sampleMap[name];
              if (url) {
                  bankUrls.push(url);
                  i++;
              } else {
                  break;
              }
          }
          if (bankUrls.length > 0) {
              console.log(`[SampleService] Registering online bank for audition: ${bankName}`);
              strudelService.registerBank(bankName, bankUrls);
          }
      }
      
      console.log(`[SampleService] Auditioning: s("${bankName}", ${index})`);
      strudelService.playOnce(`s("${bankName}", ${index})`);
  }

  public getAssignments(): SampleAssignment[] {
      return this.assignments;
  }

  public assignSample(assignment: SampleAssignment) {
      // Remove existing assignment for this type if it exists
      this.assignments = this.assignments.filter(a => a.type !== assignment.type);
      this.assignments.push(assignment);
  }

  public removeAssignment(type: string) {
      this.assignments = this.assignments.filter(a => a.type !== type);
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
        registryName = `${pathPrefix}:${baseName}`;
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
    * Fetches list of sample kits from GitHub API for geikha/tidal-drum-machines
    */
  public async fetchGithubBanks(): Promise<SampleBank[]> {
    if (this.banksCache.length > 0) return this.banksCache;

    try {
      // Fetch the tree from GitHub API
      const response = await fetch('https://api.github.com/repos/geikha/tidal-drum-machines/git/trees/main?recursive=1');
      if (!response.ok) throw new Error('Failed to fetch repository tree');

      const data = await response.json();
      const tree = data.tree;

      // Build sample map
      const newSampleMap: Record<string, string> = {};
      const kitInfo: Record<string, { count: number, banks: Set<string>, bankSamples: Record<string, string[]> }> = {};
      const bankCounts: Record<string, number> = {}; // key: "kit:bank"

      for (const item of tree) {
        if (item.type === 'blob' && item.path.startsWith('machines/') && (item.path.endsWith('.wav') || item.path.endsWith('.mp3'))) {
          const parts = item.path.split('/');
          if (parts.length >= 3) {
            const kitName = parts[1];
            // All parts between kitName and the last part (filename)
            const bankParts = parts.slice(2, parts.length - 1);
            const bankName = bankParts.length > 0 ? bankParts.join(':') : parts[parts.length - 1].replace(/\.[^/.]+$/, "");
            const fileName = parts[parts.length - 1];
            
            if (!kitInfo[kitName]) {
              kitInfo[kitName] = { count: 0, banks: new Set(), bankSamples: {} };
            }
            kitInfo[kitName].count++;
            kitInfo[kitName].banks.add(bankName);
            if (!kitInfo[kitName].bankSamples[bankName]) {
                kitInfo[kitName].bankSamples[bankName] = [];
            }
            kitInfo[kitName].bankSamples[bankName].push(fileName);

            const bankKey = `${kitName}:${bankName}`;
            const index = bankCounts[bankKey] || 0;
            const sampleName = `${kitName}:${bankName}:${index}`;
            const rawUrl = `https://raw.githubusercontent.com/geikha/tidal-drum-machines/main/${item.path}`;
            
            newSampleMap[sampleName] = rawUrl;
            bankCounts[bankKey] = index + 1;
          }
        }
      }

      this.sampleMap = newSampleMap;

      // Get list of kits currently in DB to mark 'isOffline'
      // A kit is offline if all its samples are present. 
      // For simplicity, we'll check if any sample from the kit is present.
      const offlineBanks = await this.getOfflineBanks();

      const kits: SampleBank[] = Object.keys(kitInfo)
        .map(kitName => ({
          name: kitName,
          url: '', 
          sampleCount: kitInfo[kitName].count,
          isOffline: Array.from(kitInfo[kitName].banks).some(b => offlineBanks.has(`${kitName}:${b}`)),
          isKit: true,
          banks: Array.from(kitInfo[kitName].banks),
          bankSamples: kitInfo[kitName].bankSamples
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      this.banksCache = kits;
      return kits;
    } catch (e) {
      console.error('[SampleService] Fetch Error:', e);
      throw e;
    }
  }

  /**
   * Download all samples in a kit and store in IndexedDB
   */
  public async downloadBank(bank: SampleBank, onProgress?: (percent: number) => void): Promise<void> {
    try {
        // Get samples for this kit
        const kitSamples = Object.keys(this.sampleMap).filter(name => name.startsWith(`${bank.name}:`));

        if (kitSamples.length === 0) throw new Error('No samples found in kit');

        let completed = 0;

        // 2. Process in chunks to avoid rate limiting
        const CHUNK_SIZE = 5;
        for (let i = 0; i < kitSamples.length; i += CHUNK_SIZE) {
            const chunk = kitSamples.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (sampleName: string) => {
                const url = this.sampleMap[sampleName];
                const blobResp = await fetch(url);
                const blob = await blobResp.blob();

                // sampleName is kit:bank:index
                const parts = sampleName.split(':');
                const bankField = parts.slice(0, parts.length - 1).join(':');

                // Store in DB
                await db.samples.put({
                    name: sampleName,
                    bank: bankField,
                    data: blob
                });

                // Register live
                const objUrl = URL.createObjectURL(blob);
                strudelService.registerSample(sampleName, objUrl);

                this.samples.set(sampleName, {
                    name: sampleName,
                    path: objUrl,
                    source: 'offline',
                    bank: bankField
                });
            }));

            completed += chunk.length;
            if (onProgress) onProgress(Math.round((completed / kitSamples.length) * 100));
        }

        // Register banks with Strudel
        const kitBanks: Record<string, string[]> = {};
        kitSamples.forEach(name => {
            const sample = this.samples.get(name);
            if (sample && sample.bank) {
                if (!kitBanks[sample.bank]) kitBanks[sample.bank] = [];
                kitBanks[sample.bank].push(sample.path);
            }
        });

        for (const bankName in kitBanks) {
            strudelService.registerBank(bankName, kitBanks[bankName]);
        }

        // Update cache state
        const bankIndex = this.banksCache.findIndex(b => b.name === bank.name);
        if (bankIndex !== -1) this.banksCache[bankIndex].isOffline = true;

    } catch (e) {
        console.error(`[SampleService] Failed to download kit ${bank.name}:`, e);
        throw e;
    }
  }

  public async deleteBank(bankName: string) {
      // Delete all samples belonging to this kit
      await db.samples.where('name').startsWith(`${bankName}:`).delete();
      
      const bankIndex = this.banksCache.findIndex(b => b.name === bankName);
      if (bankIndex !== -1) this.banksCache[bankIndex].isOffline = false;
  }

  private async getOfflineBanks(): Promise<Set<string>> {
      const keys = await db.samples.orderBy('bank').uniqueKeys();
      return new Set(keys.map(k => String(k)));
  }
}

export const sampleService = new SampleService();