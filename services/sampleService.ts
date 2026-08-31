import { strudelService } from './strudelService';
import { Sample, SampleBank, FileSystemDirectoryHandle, FileSystemHandle, FileSystemFileHandle } from '../types';
import Dexie, { Table } from 'dexie';

// --- Database Schema ---
interface SampleRecord {
  id?: number;
  name: string; // "bd/001" or "my_sample"
  bank: string; // "bd" or "local"
  data: Blob;
}

class StrudelSamplesDB extends Dexie {
  samples!: Table<SampleRecord, number>;

  constructor() {
    super('StrudelSamplesDB');
    (this as any).version(1).stores({
      samples: '++id, name, bank'
    });
  }
}

const db = new StrudelSamplesDB();

/**
 * Retrieve stored blob for a sample name or bank from IndexedDB
 */
export async function getStoredSampleBlob(nameOrBank: string): Promise<Blob | null> {
  try {
    const direct = await db.samples.where('name').equals(nameOrBank).first();
    if (direct?.data) return direct.data;

    const bankMatch = await db.samples.where('bank').equals(nameOrBank).first();
    if (bankMatch?.data) return bankMatch.data;
  } catch (e) {
    console.warn('[sampleService] getStoredSampleBlob error:', e);
  }
  return null;
}

// Fallback list of standard Dirt-Samples banks from TidalCycles
const DEFAULT_DIRT_BANKS: string[] = [
  '808', '808bd', '808cy', '808hc', '808ht', '808lc', '808lt', '808mc', '808mt', '808oh', '808sd',
  '909', 'ab', 'ade', 'alex', 'alphabet', 'amencparam', 'armora', 'arp', 'arpy', 'auto',
  'bass', 'bass0', 'bass1', 'bass2', 'bass3', 'bassdm', 'bassfoo', 'battles', 'bd', 'bend',
  'bev', 'bin', 'birds', 'birds3', 'bleep', 'blip', 'blue', 'bottle', 'breaks125', 'breaks152',
  'breaks157', 'breaks165', 'can', 'casio', 'cb', 'cc', 'chin', 'clak', 'click', 'clubkick',
  'co', 'control', 'cosmicg', 'cp', 'cr', 'crow', 'd', 'db', 'diphone', 'diphone2',
  'dist', 'dork2', 'dorkbot', 'dr', 'dr2', 'dr55', 'dr_step', 'dras', 'drum', 'east',
  'electro1', 'f', 'feel', 'feelfx', 'fest', 'fire', 'flbass', 'fm', 'foo', 'future',
  'gab', 'gabba', 'gabbalouder', 'gabbaloud', 'glitch', 'glitch2', 'gretsch', 'h', 'hand', 'hardcore',
  'hardkick', 'haw', 'hc', 'heavy', 'hh', 'hh27', 'hit', 'hmm', 'ho', 'hoover',
  'house', 'ht', 'ice', 'incoming', 'industrial', 'insect', 'invaders', 'jazz', 'jungbass', 'jungle',
  'juno', 'jvbass', 'kicklinn', 'koy', 'kurt', 'latibro', 'led', 'less', 'lighter', 'linn',
  'linnhats', 'lt', 'made', 'mash', 'mash2', 'metal', 'miniplot', 'moog', 'mouth', 'mp3',
  'msg', 'mt', 'mute', 'newnotes', 'noise', 'noise2', 'notes', 'numbers', 'oc', 'odx',
  'off', 'outdoor', 'pad', 'padlong', 'pebbles', 'perc', 'peri', 'pluck', 'print', 'proc',
  'psr', 'rave', 'rave2', 'ravemono', 'rm', 'sax', 'scifi', 'sd', 'sequential', 'sf',
  'sheffield', 'short', 'sid', 'sine', 'sitar', 'sn', 'space', 'speakspell', 'speech', 'speechless',
  'speedgate', 'stomp', 'subroc3d', 'sugar', 'sundance', 'tabla', 'tabla2', 'tablex', 'tacscan', 'tech',
  'techno', 'tink', 'tok', 'toys', 'trump', 'ul', 'ulgab', 'umbrella', 'v', 'voodoo',
  'wind', 'wobble', 'world', 'wort', 'xmas', 'yeah'
];

// --- Service ---
class SampleService {
  private samples: Map<string, Sample> = new Map();
  private isSupported: boolean = true;
  private banksCache: SampleBank[] = [];

  constructor() {
    this.initOfflineSamples();
  }

  /**
   * Load all samples stored in IndexedDB and register them with Strudel
   */
  private async initOfflineSamples() {
    try {
      const records = await db.samples.toArray();
      console.log(`[SampleService] Loading ${records.length} stored samples from IndexedDB...`);
      
      for (const record of records) {
        const url = URL.createObjectURL(record.data);
        strudelService.registerSample(record.name, url);
        
        this.samples.set(record.name, {
          name: record.name,
          path: url,
          source: record.bank === 'local' ? 'local' : 'offline',
          bank: record.bank
        });
      }
    } catch (e) {
      console.error('[SampleService] Failed to load offline samples:', e);
    }
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  public getLoadedSamples(): Sample[] {
    return Array.from(this.samples.values());
  }

  public getSampleSchema(): string {
    const loaded = Array.from(this.samples.keys());
    return `Available loaded samples: ${loaded.join(', ') || 'default bank'}`;
  }

  /**
   * Process and register audio files (from input, drag/drop, or directory scans)
   */
  public async loadFiles(files: File[] | FileList): Promise<number> {
    const fileList = Array.from(files);
    const audioFiles = fileList.filter(file => {
      const lower = file.name.toLowerCase();
      return (
        lower.endsWith('.wav') ||
        lower.endsWith('.mp3') ||
        lower.endsWith('.ogg') ||
        lower.endsWith('.flac') ||
        lower.endsWith('.aif') ||
        lower.endsWith('.aiff') ||
        lower.endsWith('.m4a') ||
        lower.endsWith('.webm')
      );
    });

    if (audioFiles.length === 0) {
      throw new Error('No audio files (.wav, .mp3, .ogg, .flac) found in selection.');
    }

    let loadedCount = 0;

    for (const file of audioFiles) {
      // Determine sample name
      const relativePath = (file as any).webkitRelativePath || '';
      let registryName = '';

      if (relativePath) {
        // Strip leading folder if any, or normalize path without extension
        const parts = relativePath.split('/');
        // e.g. "mykit/drums/snare.wav" -> "drums/snare" or "mykit/drums/snare"
        const cleanName = relativePath.replace(/\.[^/.]+$/, '');
        registryName = cleanName.replace(/^[./]+/, '');
      } else {
        registryName = file.name.replace(/\.[^/.]+$/, '');
      }

      // Clean registry name for Strudel compatibility (lowercase, alpha-numeric, slashes, underscores)
      registryName = registryName.trim().replace(/\s+/g, '_');

      const url = URL.createObjectURL(file);

      // Store in IndexedDB for persistence
      try {
        await db.samples.put({
          name: registryName,
          bank: 'local',
          data: file
        });
      } catch (dbErr) {
        console.warn(`[SampleService] DB put warning for ${registryName}:`, dbErr);
      }

      // Register live in Strudel audio engine
      strudelService.registerSample(registryName, url);

      this.samples.set(registryName, {
        name: registryName,
        path: url,
        source: 'local',
        bank: 'local'
      });

      loadedCount++;
    }

    return loadedCount;
  }

  /**
   * Recursively extract Files from DataTransferItemList (drag-and-drop folder support)
   */
  public async loadFromDataTransfer(items: DataTransferItemList | DataTransfer): Promise<number> {
    const files: File[] = [];

    // Helper to read FileSystemEntry recursively
    const traverseEntry = async (entry: any, path = ''): Promise<void> => {
      if (!entry) return;
      if (entry.isFile) {
        return new Promise<void>((resolve) => {
          entry.file((file: File) => {
            // Set custom property for relative path
            Object.defineProperty(file, 'webkitRelativePath', {
              value: path ? `${path}/${file.name}` : file.name,
              writable: false
            });
            files.push(file);
            resolve();
          }, () => resolve());
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const readEntries = async (): Promise<any[]> => {
          return new Promise((resolve) => {
            dirReader.readEntries((entries: any[]) => resolve(entries), () => resolve([]));
          });
        };

        let entries: any[] = await readEntries();
        while (entries.length > 0) {
          for (const child of entries) {
            await traverseEntry(child, path ? `${path}/${entry.name}` : entry.name);
          }
          entries = await readEntries();
        }
      }
    };

    if ('items' in items && items.items) {
      const itemList = Array.from(items.items);
      for (const item of itemList) {
        if (typeof item.webkitGetAsEntry === 'function') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            await traverseEntry(entry);
            continue;
          }
        }
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    } else if ('files' in items && items.files) {
      files.push(...Array.from(items.files));
    }

    return this.loadFiles(files);
  }

  /**
   * Load audio files from a DirectoryHandle (File System Access API)
   */
  public async loadFromDirectoryHandle(dirHandle: FileSystemDirectoryHandle): Promise<number> {
    const beforeCount = this.samples.size;
    await this.scanDirectory(dirHandle, '');
    return this.samples.size - beforeCount;
  }

  /**
   * Graceful Link Local Folder (handles showDirectoryPicker and fallbacks)
   */
  public async linkLocalFolder(): Promise<number> {
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();
        return await this.loadFromDirectoryHandle(dirHandle);
      } catch (err: any) {
        if (err.name === 'AbortError') return 0;
        // If security error in iframe, rethrow so UI can trigger fallback input seamlessly
        throw err;
      }
    } else {
      throw new Error('showDirectoryPicker_unsupported');
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

    if (
      lowerName.endsWith('.wav') ||
      lowerName.endsWith('.mp3') ||
      lowerName.endsWith('.ogg') ||
      lowerName.endsWith('.flac')
    ) {
      const url = URL.createObjectURL(file);
      const baseName = name.replace(/\.[^/.]+$/, '');
      const registryName = pathPrefix ? `${pathPrefix}/${baseName}` : baseName;

      try {
        await db.samples.put({
          name: registryName,
          bank: 'local',
          data: file
        });
      } catch (e) {
        // ignore
      }

      strudelService.registerSample(registryName, url);

      this.samples.set(registryName, {
        name: registryName,
        path: url,
        source: 'local',
        bank: 'local'
      });
    }
  }

  /**
   * Deletes a local custom sample
   */
  public async deleteLocalSample(name: string): Promise<void> {
    try {
      await db.samples.where('name').equals(name).delete();
      this.samples.delete(name);
    } catch (e) {
      console.error('[SampleService] Error deleting sample:', e);
    }
  }

  /**
   * Clear all user-uploaded local samples
   */
  public async clearAllLocalSamples(): Promise<void> {
    try {
      await db.samples.where('bank').equals('local').delete();
      for (const [key, sample] of this.samples.entries()) {
        if (sample.source === 'local') {
          this.samples.delete(key);
        }
      }
    } catch (e) {
      console.error('[SampleService] Error clearing local samples:', e);
    }
  }

  public async clearAllCustomSamples(): Promise<void> {
    return this.clearAllLocalSamples();
  }

  // --- GitHub / Cloud Samples ---

  /**
   * Fetches list of sample banks from tidalcycles/Dirt-Samples or fallback catalogue
   */
  public async fetchGithubBanks(): Promise<SampleBank[]> {
    if (this.banksCache.length > 0) return this.banksCache;

    const offlineBanks = await this.getOfflineBanks();

    try {
      const response = await fetch('https://api.github.com/repos/tidalcycles/Dirt-Samples/contents/');
      if (response.ok) {
        const items = await response.json();
        const banks: SampleBank[] = items
          .filter((item: any) => item.type === 'dir' && !item.name.startsWith('.'))
          .map((item: any) => ({
            name: item.name,
            url: item.url,
            sampleCount: 0,
            isOffline: offlineBanks.has(item.name)
          }));

        if (banks.length > 0) {
          this.banksCache = banks;
          return banks;
        }
      }
    } catch (e) {
      console.warn('[SampleService] GitHub API unavailable/rate-limited. Using curated bank catalogue.');
    }

    // Fallback to built-in Dirt-Samples bank catalogue
    const fallbackBanks: SampleBank[] = DEFAULT_DIRT_BANKS.map((bankName) => ({
      name: bankName,
      url: `https://api.github.com/repos/tidalcycles/Dirt-Samples/contents/${bankName}`,
      sampleCount: 0,
      isOffline: offlineBanks.has(bankName)
    }));

    this.banksCache = fallbackBanks;
    return fallbackBanks;
  }

  /**
   * Download all samples in a bank and store in IndexedDB
   */
  public async downloadBank(bankOrName: SampleBank | string, onProgress?: (percent: number) => void): Promise<void> {
    const bankName = typeof bankOrName === 'string' ? bankOrName : bankOrName.name;
    const bankUrl = typeof bankOrName === 'string'
      ? `https://api.github.com/repos/tidalcycles/Dirt-Samples/contents/${bankOrName}`
      : bankOrName.url;

    try {
      let audioFiles: { name: string; download_url: string }[] = [];

      try {
        const response = await fetch(bankUrl);
        if (response.ok) {
          const files = await response.json();
          audioFiles = files.filter((f: any) =>
            f.name.endsWith('.wav') || f.name.endsWith('.mp3') || f.name.endsWith('.ogg')
          );
        }
      } catch (err) {
        // Fallback: try raw repository file numbering 000.wav - 010.wav
      }

      // If GitHub contents API failed (e.g. rate limit), attempt raw GitHub URLs
      if (audioFiles.length === 0) {
        const sampleNumbers = ['000', '001', '002', '003', '004', '005', '006', '007', '008', '009', '010'];
        for (const num of sampleNumbers) {
          const rawUrl = `https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/${bankName}/${num}.wav`;
          audioFiles.push({ name: `${num}.wav`, download_url: rawUrl });
        }
      }

      let completed = 0;
      let successfullySaved = 0;

      const CHUNK_SIZE = 4;
      for (let i = 0; i < audioFiles.length; i += CHUNK_SIZE) {
        const chunk = audioFiles.slice(i, i + CHUNK_SIZE);
        await Promise.all(
          chunk.map(async (file: any) => {
            try {
              const rawUrl = file.download_url;
              const blobResp = await fetch(rawUrl);
              if (!blobResp.ok) return;

              const blob = await blobResp.blob();
              if (blob.size < 100) return; // Not a valid audio file

              const baseName = file.name.replace(/\.[^/.]+$/, '');
              const registryName = `${bankName}/${baseName}`;

              await db.samples.put({
                name: registryName,
                bank: bankName,
                data: blob
              });

              const objUrl = URL.createObjectURL(blob);
              strudelService.registerSample(registryName, objUrl);

              this.samples.set(registryName, {
                name: registryName,
                path: objUrl,
                source: 'offline',
                bank: bankName
              });

              successfullySaved++;
            } catch (err) {
              // Ignore individual sample fetch fail
            }
          })
        );

        completed += chunk.length;
        if (onProgress) onProgress(Math.round((completed / audioFiles.length) * 100));
      }

      if (successfullySaved === 0) {
        throw new Error(`Could not fetch audio files for bank ${bankName}`);
      }

      const bankIndex = this.banksCache.findIndex(b => b.name === bankName);
      if (bankIndex !== -1) this.banksCache[bankIndex].isOffline = true;
    } catch (e) {
      console.error(`[SampleService] Failed to download bank ${bankName}:`, e);
      throw e;
    }
  }

  public async deleteBank(bankName: string) {
    await db.samples.where('bank').equals(bankName).delete();

    for (const [key, sample] of this.samples.entries()) {
      if (sample.bank === bankName) {
        this.samples.delete(key);
      }
    }

    const bankIndex = this.banksCache.findIndex(b => b.name === bankName);
    if (bankIndex !== -1) this.banksCache[bankIndex].isOffline = false;
  }

  private async getOfflineBanks(): Promise<Set<string>> {
    const keys = await db.samples.orderBy('bank').uniqueKeys();
    return new Set(keys.map(k => String(k)));
  }
}

export const sampleService = new SampleService();