/**
 * Embedded Sound Bank for StrudelSpeak
 * High-impact, studio-grade drum, synth, and FX sound generator & sample provider.
 * Runs 100% locally with zero external network requests or download delays.
 */

export interface EmbeddedSoundInfo {
  name: string;
  category: 'drums' | 'synths' | 'fx';
  description: string;
  aliases: string[];
  syntaxExample: string;
}

export const EMBEDDED_SOUND_CATALOG: EmbeddedSoundInfo[] = [
  // Drums
  { name: 'kick', category: 'drums', description: 'Punchy 909-style analog kick with fast transient punch', aliases: ['909', 'bd', '909bd', 'kick909'], syntaxExample: 's("kick*4")' },
  { name: 'sub', category: 'drums', description: 'Deep subby 808 kick with extended low-end decay', aliases: ['808', 'sub808', '808bd', 'subkick', 'kick808'], syntaxExample: 's("sub*2")' },
  { name: 'sub808', category: 'drums', description: 'Deep subby 808 kick with extended low-end decay', aliases: ['808', 'sub', '808bd', 'subkick', 'kick808'], syntaxExample: 's("sub808*2")' },
  { name: 'snare', category: 'drums', description: 'Crisp 909 snare drum with dual-tone body and white noise snap', aliases: ['sd', '909sd', 'snare909'], syntaxExample: 's("~ snare ~ snare")' },
  { name: 'clap', category: 'drums', description: 'Layered 808/909 stereo multi-burst handclap', aliases: ['cp', 'handclap'], syntaxExample: 's("~ clap")' },
  { name: 'hat', category: 'drums', description: 'Tight metallic closed hi-hat with high frequency sizzle', aliases: ['hh', 'closedhat'], syntaxExample: 's("hat*8")' },
  { name: 'openhat', category: 'drums', description: 'Sizzling open hi-hat on the offbeat', aliases: ['oh', 'open_hh'], syntaxExample: 's("~ openhat")' },
  { name: 'rim', category: 'drums', description: 'Sharp acoustic/electronic rimshot transient', aliases: ['rimshot'], syntaxExample: 's("rim*2")' },
  { name: 'shaker', category: 'drums', description: 'Rhythmic percussive shaker groove', aliases: ['shk'], syntaxExample: 's("shaker*16")' },
  { name: 'perc', category: 'drums', description: 'Warm resonant analog tom/percussion hit', aliases: ['tom', 'lowtom'], syntaxExample: 's("perc(3,8)")' },
  { name: 'crash', category: 'drums', description: 'Splashy metallic crash cymbal for drops and transitions', aliases: ['cymbal'], syntaxExample: 's("crash")' },

  // Synths
  { name: 'acid', category: 'synths', description: 'Resonant TB-303 analog sawtooth with biting filter envelope', aliases: ['tb303', '303', 'acidbass'], syntaxExample: 's("acid*8").n("<0 3 5 7>")' },
  { name: 'moog', category: 'synths', description: 'Fat 2-oscillator analog sub bass with slight saturation', aliases: ['bass', 'analogbass', 'subbass'], syntaxExample: 's("moog*4").n("<d1 f1 g1 bb1>")' },
  { name: 'saw', category: 'synths', description: 'Thick detuned 5-oscillator supersaw lead hit', aliases: ['supersaw', 'lead'], syntaxExample: 's("saw*4").n("<a3 c4 e4 g4>")' },
  { name: 'juno', category: 'synths', description: 'Lush vintage polyphonic minor 9th chord stab', aliases: ['chord', 'pad', 'stab'], syntaxExample: 's("juno*2")' },
  { name: 'rave', category: 'synths', description: 'Classic 90s rave hoover / pitch-bent synth stab', aliases: ['hoover', 'ravestab'], syntaxExample: 's("rave*4")' },
  { name: 'pluck', category: 'synths', description: 'Snappy electronic FM synth pluck', aliases: ['synthpluck', 'bell'], syntaxExample: 's("pluck*8").n("<0 7 12 15>")' },

  // FX
  { name: 'riser', category: 'fx', description: 'Tension-building rising noise and pitch sweep for buildups', aliases: ['sweep', 'uplifter', 'buildup'], syntaxExample: 's("riser").slow(2)' },
  { name: 'impact', category: 'fx', description: 'Massive sub drop impact for the beat drop', aliases: ['drop', 'subdrop', 'boom'], syntaxExample: 's("impact")' },
  { name: 'laser', category: 'fx', description: 'Retro electro laser zap hit', aliases: ['zap', 'fx_laser'], syntaxExample: 's("laser*4")' },
  { name: 'glitch', category: 'fx', description: 'Bitcrushed digital micro-glitch stutter', aliases: ['stutter', 'fx_glitch'], syntaxExample: 's("glitch*8")' },
  { name: 'noise', category: 'fx', description: 'Filtered textured noise burst', aliases: ['whitenoise', 'hiss'], syntaxExample: 's("noise*4")' },
];

class EmbeddedSoundBankService {
  private blobCache: Map<string, Blob> = new Map();
  private audioUrlCache: Map<string, string> = new Map();
  private isRegisteredWithStrudel = false;

  constructor() {
    // Lazy or synchronous initialization on import
  }

  /**
   * Pre-generates all embedded sounds and registers them with the Strudel engine
   */
  public async initializeAndRegister(): Promise<void> {
    if (this.isRegisteredWithStrudel) return;

    const win = typeof window !== 'undefined' ? (window as any) : null;
    if (!win) return;

    // Generate all base sounds
    for (const item of EMBEDDED_SOUND_CATALOG) {
      if (!this.blobCache.has(item.name)) {
        const blob = this.generateSoundWav(item.name);
        this.blobCache.set(item.name, blob);
        const url = URL.createObjectURL(blob);
        this.audioUrlCache.set(item.name, url);

        // Also register all aliases to the same blob/url
        for (const alias of item.aliases) {
          this.blobCache.set(alias, blob);
          this.audioUrlCache.set(alias, url);
        }
      }
    }

    // Register with Strudel window environment
    // Strudel supports pitched sample dictionaries { instrumentName: { rootNote: url } }
    // which allows note() and n() to calculate perfect semitone offsets.
    // Tuned +3 semitones (Eb root) to match exact concert pitch & scale definitions.
    const pitchedSoundRoots: Record<string, string> = {
      moog: 'eb2',
      bass: 'eb2',
      analogbass: 'eb2',
      subbass: 'eb2',
      acid: 'eb2',
      tb303: 'eb2',
      '303': 'eb2',
      acidbass: 'eb2',
      sub: 'eb2',
      sub808: 'eb2',
      '808': 'eb2',
      saw: 'eb3',
      supersaw: 'eb3',
      lead: 'eb3',
      juno: 'eb3',
      chord: 'eb3',
      pad: 'eb3',
      stab: 'eb3',
      rave: 'eb3',
      hoover: 'eb3',
      pluck: 'eb4',
      synthpluck: 'eb4',
      bell: 'eb4'
    };

    const registrationMap: Record<string, any> = {};
    this.audioUrlCache.forEach((url, name) => {
      const root = pitchedSoundRoots[name.toLowerCase()];
      if (root) {
        registrationMap[name] = { [root]: url };
      } else {
        registrationMap[name] = url;
      }
    });

    try {
      if (typeof win.samples === 'function') {
        win.samples(registrationMap);
        console.log('[EmbeddedSoundBank] Registered all demo sounds & tuned root maps via win.samples()');
      }

      if (typeof win.register === 'function') {
        this.audioUrlCache.forEach((url, name) => {
          try {
            win.register(name, url);
          } catch (e) {}
        });
      }

      this.isRegisteredWithStrudel = true;
    } catch (e) {
      console.warn('[EmbeddedSoundBank] Registration with Strudel note:', e);
    }
  }

  /**
   * Get audio blob for any embedded sound or alias
   */
  public getSoundBlob(name: string): Blob | null {
    const key = name.toLowerCase().trim();
    if (this.blobCache.has(key)) {
      return this.blobCache.get(key)!;
    }
    // Generate on the fly if not yet cached
    const blob = this.generateSoundWav(key);
    this.blobCache.set(key, blob);
    return blob;
  }

  /**
   * Get playable ObjectURL for any sound
   */
  public getSoundUrl(name: string): string {
    const key = name.toLowerCase().trim();
    if (this.audioUrlCache.has(key)) {
      return this.audioUrlCache.get(key)!;
    }
    const blob = this.getSoundBlob(key) || this.generateSoundWav(key);
    const url = URL.createObjectURL(blob);
    this.audioUrlCache.set(key, url);
    return url;
  }

  /**
   * Audition / play a sound immediately in the browser
   */
  public async playSound(name: string): Promise<void> {
    try {
      const url = this.getSoundUrl(name);
      const audio = new Audio(url);
      await audio.play();
    } catch (e) {
      console.warn('[EmbeddedSoundBank] Audition playback error:', e);
    }
  }

  /**
   * High quality client-side DSP audio generator for all embedded sounds
   */
  private generateSoundWav(soundName: string): Blob {
    const sampleRate = 44100;
    let duration = 0.4; // seconds

    // Adjust duration by sound type
    const s = soundName.toLowerCase();
    if (s.includes('808') || s.includes('sub')) duration = 0.8;
    else if (s.includes('hat') || s.includes('rim') || s.includes('hh')) duration = 0.15;
    else if (s.includes('openhat') || s.includes('oh') || s.includes('crash')) duration = 0.9;
    else if (s.includes('juno') || s.includes('chord') || s.includes('rave')) duration = 0.7;
    else if (s.includes('riser') || s.includes('sweep')) duration = 1.6;
    else if (s.includes('impact') || s.includes('drop')) duration = 1.2;
    else if (s.includes('acid') || s.includes('moog') || s.includes('saw')) duration = 0.5;

    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true); // NumChannels (1 = Mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample (16-bit)
    this.writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Synthesize audio sample data
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sampleVal = 0;

      // 1. PUNCHY 909 KICK
      if (s === 'kick' || s === '909' || s === 'bd' || s === '909bd') {
        const pitchEnv = 150 * Math.exp(-t * 38) + 48;
        const ampEnv = Math.exp(-t * 8.5);
        const click = t < 0.005 ? (Math.random() * 2 - 1) * Math.exp(-t * 600) * 0.4 : 0;
        const sine = Math.sin(2 * Math.PI * pitchEnv * t);
        sampleVal = (sine * 0.9 + click) * ampEnv;
      }
      // 2. 808 SUB BASS KICK (Tuned +3 semitones)
      else if (s === '808' || s === '808bd' || s === 'subkick' || s === 'sub') {
        const pitchEnv = 130.8 * Math.exp(-t * 22) + 47.6;
        const ampEnv = Math.exp(-t * 3.8);
        const sine = Math.sin(2 * Math.PI * pitchEnv * t);
        const subHarmonic = Math.sin(2 * Math.PI * (pitchEnv * 0.5) * t) * 0.2;
        sampleVal = (sine + subHarmonic) * ampEnv * 0.95;
      }
      // 3. 909 CRISP SNARE
      else if (s === 'snare' || s === 'sd' || s === '909sd') {
        const tone1 = Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 22);
        const tone2 = Math.sin(2 * Math.PI * 330 * t) * Math.exp(-t * 28);
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 14);
        sampleVal = (tone1 * 0.4 + tone2 * 0.3 + noise * 0.65) * Math.exp(-t * 5);
      }
      // 4. STEREO CLAP
      else if (s === 'clap' || s === 'cp' || s === 'handclap') {
        let burst = 0;
        if (t < 0.012) burst = (Math.random() * 2 - 1) * 0.7;
        else if (t < 0.024) burst = (Math.random() * 2 - 1) * 0.85;
        else if (t < 0.038) burst = (Math.random() * 2 - 1) * 1.0;
        else burst = (Math.random() * 2 - 1) * Math.exp(-(t - 0.038) * 18);
        sampleVal = burst * Math.exp(-t * 8);
      }
      // 5. CLOSED HI-HAT
      else if (s === 'hat' || s === 'hh' || s === 'closedhat') {
        const f1 = Math.sin(2 * Math.PI * 8000 * t);
        const f2 = Math.sin(2 * Math.PI * 9600 * t);
        const noise = (Math.random() * 2 - 1);
        const metallic = (f1 * 0.3 + f2 * 0.3 + noise * 0.7);
        sampleVal = metallic * Math.exp(-t * 45);
      }
      // 6. OPEN HI-HAT
      else if (s === 'openhat' || s === 'oh' || s === 'open_hh') {
        const f1 = Math.sin(2 * Math.PI * 7200 * t);
        const f2 = Math.sin(2 * Math.PI * 9400 * t);
        const noise = (Math.random() * 2 - 1);
        const metallic = (f1 * 0.25 + f2 * 0.25 + noise * 0.8);
        sampleVal = metallic * Math.exp(-t * 6.5);
      }
      // 7. RIMSHOT
      else if (s === 'rim' || s === 'rimshot') {
        const click = Math.sin(2 * Math.PI * 1650 * t) * Math.exp(-t * 65);
        const body = Math.sin(2 * Math.PI * 450 * t) * Math.exp(-t * 35);
        sampleVal = (click * 0.7 + body * 0.5) * 0.9;
      }
      // 8. SHAKER
      else if (s === 'shaker' || s === 'shk') {
        const noise = (Math.random() * 2 - 1);
        const mod = Math.sin(2 * Math.PI * 65 * t);
        sampleVal = noise * Math.abs(mod) * Math.exp(-t * 22);
      }
      // 9. PERC / TOM
      else if (s === 'perc' || s === 'tom' || s === 'lowtom') {
        const pitch = 140 * Math.exp(-t * 25) + 65;
        sampleVal = Math.sin(2 * Math.PI * pitch * t) * Math.exp(-t * 9);
      }
      // 10. CRASH CYMBAL
      else if (s === 'crash' || s === 'cymbal') {
        const noise = (Math.random() * 2 - 1);
        const ring = Math.sin(2 * Math.PI * 5200 * t) * 0.3;
        sampleVal = (noise * 0.8 + ring) * Math.exp(-t * 3.5);
      }
      // 11. TB-303 ACID SYNTH BASS (Tuned +3 semitones: Eb2 @ 77.7817 Hz)
      else if (s === 'acid' || s === 'tb303' || s === '303' || s === 'acidbass') {
        const baseFreq = 77.7817; // Eb2 (+3 semitones)
        const cutoff = 452 + 3090 * Math.exp(-t * 15);
        // Sawtooth wave approximation with 8 harmonics
        let saw = 0;
        for (let h = 1; h <= 8; h++) {
          const harmonicFreq = baseFreq * h;
          if (harmonicFreq < cutoff) {
            saw += (1 / h) * Math.sin(2 * Math.PI * harmonicFreq * t);
          }
        }
        // Resonant peak
        const resonance = Math.sin(2 * Math.PI * cutoff * t) * 0.45 * Math.exp(-t * 12);
        const env = Math.exp(-t * 7.5);
        sampleVal = (saw * 0.85 + resonance) * env;
      }
      // 12. MOOG ANALOG SUB BASS (Tuned +3 semitones: Eb2 @ 77.7817 Hz, calibrated punchy decay)
      else if (s === 'moog' || s === 'bass' || s === 'analogbass' || s === 'subbass') {
        const f0 = 77.7817; // Eb2 (+3 semitones)
        const osc1 = Math.sin(2 * Math.PI * f0 * t);
        const osc2 = (Math.sin(2 * Math.PI * (f0 * 1.002) * t) > 0 ? 0.35 : -0.35); // Slight detuned warm sub
        const punch = t < 0.008 ? Math.sin(2 * Math.PI * 214 * t) * Math.exp(-t * 200) * 0.3 : 0;
        const env = Math.exp(-t * 8.5); // Tight punchy decay prevents muddy overlap
        sampleVal = (osc1 * 0.7 + osc2 * 0.3 + punch) * env * 0.95;
      }
      // 13. SUPERSAW LEAD (Tuned +3 semitones: Eb3 @ 155.5635 Hz)
      else if (s === 'saw' || s === 'supersaw' || s === 'lead') {
        const f0 = 155.5635; // Eb3 (+3 semitones)
        const detunes = [0.988, 0.994, 1.0, 1.006, 1.012];
        let superSaw = 0;
        detunes.forEach((d) => {
          const phase = (f0 * d * t) % 1;
          superSaw += (2 * phase - 1) * 0.2;
        });
        sampleVal = superSaw * Math.exp(-t * 4.5);
      }
      // 14. JUNO MINOR 9TH CHORD STAB (Tuned +3 semitones: Ebm9 root @ 155.56 Hz)
      else if (s === 'juno' || s === 'chord' || s === 'pad' || s === 'stab') {
        // Ebm9: Eb3 (155.56), Gb3 (184.99), Bb3 (233.08), Db4 (277.18), F4 (349.23)
        const freqs = [155.56, 184.99, 233.08, 277.18, 349.23];
        let chord = 0;
        freqs.forEach((f) => {
          chord += Math.sin(2 * Math.PI * f * t) * 0.2;
        });
        sampleVal = chord * Math.exp(-t * 3.5);
      }
      // 15. RAVE HOOVER (Tuned +3 semitones: Eb3 @ 155.56 Hz)
      else if (s === 'rave' || s === 'hoover' || s === 'ravestab') {
        const pitchBend = 155.56 * (1 + 0.25 * Math.sin(2 * Math.PI * 5 * t)) * Math.exp(-t * 1.8);
        const osc1 = Math.sin(2 * Math.PI * pitchBend * t);
        const osc2 = Math.sin(2 * Math.PI * (pitchBend * 1.5) * t) * 0.4;
        sampleVal = (osc1 + osc2) * 0.7 * Math.exp(-t * 3.5);
      }
      // 16. PLUCK / BELL (Tuned +3 semitones: Eb4 @ 311.1270 Hz)
      else if (s === 'pluck' || s === 'synthpluck' || s === 'bell') {
        const f0 = 311.1270; // Eb4 (+3 semitones)
        const mod = Math.sin(2 * Math.PI * f0 * 2 * t) * Math.exp(-t * 32) * 3;
        sampleVal = Math.sin(2 * Math.PI * f0 * t + mod) * Math.exp(-t * 9.0);
      }
      // 17. RISER / SWEEP
      else if (s === 'riser' || s === 'sweep' || s === 'uplifter' || s === 'buildup') {
        const progress = t / duration;
        const riseFreq = 200 + Math.pow(progress, 2.5) * 4500;
        const noise = (Math.random() * 2 - 1) * Math.sin(2 * Math.PI * riseFreq * t);
        const sweepTone = Math.sin(2 * Math.PI * (100 + progress * 600) * t) * 0.3;
        sampleVal = (noise * 0.7 + sweepTone) * progress; // swells in volume
      }
      // 18. IMPACT / SUB DROP
      else if (s === 'impact' || s === 'drop' || s === 'subdrop' || s === 'boom') {
        const dropFreq = 180 * Math.exp(-t * 10) + 35;
        const boom = Math.sin(2 * Math.PI * dropFreq * t);
        const noiseCrack = t < 0.02 ? (Math.random() * 2 - 1) * 0.8 : 0;
        sampleVal = (boom * 0.85 + noiseCrack) * Math.exp(-t * 2.2);
      }
      // 19. LASER ZAP
      else if (s === 'laser' || s === 'zap' || s === 'fx_laser') {
        const zapFreq = 2400 * Math.exp(-t * 30) + 120;
        sampleVal = Math.sin(2 * Math.PI * zapFreq * t) * Math.exp(-t * 12);
      }
      // 20. GLITCH / STUTTER
      else if (s === 'glitch' || s === 'stutter' || s === 'fx_glitch') {
        const stutterStep = Math.floor(t * 40) % 2;
        const noise = (Math.random() * 2 - 1);
        const bitcrush = Math.floor(noise * 4) / 4;
        sampleVal = bitcrush * stutterStep * Math.exp(-t * 6);
      }
      // 21. NOISE BURST
      else if (s === 'noise' || s === 'whitenoise' || s === 'hiss') {
        const noise = (Math.random() * 2 - 1);
        sampleVal = noise * Math.exp(-t * 10);
      }
      // DEFAULT FALLBACK TONE
      else {
        const baseFreq = 220;
        sampleVal = Math.sin(2 * Math.PI * baseFreq * t) * Math.exp(-t * 10);
      }

      // Clamp and write 16-bit PCM
      const clamped = Math.max(-1, Math.min(1, sampleVal));
      view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

export const embeddedSoundBank = new EmbeddedSoundBankService();
