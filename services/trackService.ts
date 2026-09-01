import { TrackItem } from '../types';
import { SOUND_COLORS } from './patternTokenizer';

/**
 * Extracts and manages individual track layers from Strudel pattern code.
 */
export class TrackService {
  /**
   * Parses active Strudel code and extracts structured track layers
   */
  public extractTracks(code: string): TrackItem[] {
    const lines = code.split('\n');
    const tracks: TrackItem[] = [];

    // Check if code has a stack(...) call
    const hasStack = /stack\s*\(/.test(code);

    if (hasStack) {
      // Find stack boundaries
      let insideStack = false;
      let depth = 0;
      let currentTrackLines: { line: string; lineIndex: number }[] = [];
      let trackIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Check entry into stack
        if (!insideStack && /stack\s*\(/.test(line)) {
          insideStack = true;
          depth = 1;
          continue;
        }

        if (insideStack) {
          // Count opening and closing parentheses
          for (let c = 0; c < line.length; c++) {
            const char = line[c];
            if (char === '(' || char === '[' || char === '{') depth++;
            else if (char === ')' || char === ']' || char === '}') depth--;
          }

          // Check if this line is the end of stack
          if (depth <= 0) {
            if (currentTrackLines.length > 0) {
              const track = this.buildTrackItem(currentTrackLines, trackIndex++);
              if (track) tracks.push(track);
              currentTrackLines = [];
            }
            insideStack = false;
            continue;
          }

          // Ignore pure comments or empty lines if not in track
          if (!trimmed && currentTrackLines.length === 0) continue;

          currentTrackLines.push({ line, lineIndex: i });

          // Track boundary check: comma at end of line at depth 1 (or standalone track line)
          const endsWithComma = trimmed.endsWith(',');
          const isStackItemBoundary = (depth === 1 && endsWithComma) || (depth === 1 && (trimmed.startsWith('s(') || trimmed.startsWith('sound(') || trimmed.startsWith('note(') || trimmed.startsWith('n(') || trimmed.startsWith('//')));

          if (endsWithComma && depth === 1) {
            const track = this.buildTrackItem(currentTrackLines, trackIndex++);
            if (track) tracks.push(track);
            currentTrackLines = [];
          }
        }
      }

      // Handle any trailing track before stack end
      if (currentTrackLines.length > 0) {
        const track = this.buildTrackItem(currentTrackLines, trackIndex++);
        if (track) tracks.push(track);
      }
    } else {
      // Non-stack code: parse lines that produce sound
      let trackIdx = 0;
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('//') && (trimmed.includes('s(') || trimmed.includes('sound(') || trimmed.includes('note(') || trimmed.includes('n(') || trimmed.includes('fast(') || trimmed.includes('slow('))) {
          const track = this.buildTrackItem([{ line, lineIndex: idx }], trackIdx++);
          if (track) tracks.push(track);
        }
      });

      // If still empty but code exists
      if (tracks.length === 0 && code.trim()) {
        const track = this.buildTrackItem([{ line: code.trim(), lineIndex: 0 }], 0);
        if (track) tracks.push(track);
      }
    }

    return tracks;
  }

  private buildTrackItem(lineEntries: { line: string; lineIndex: number }[], trackIndex: number): TrackItem | null {
    if (lineEntries.length === 0) return null;

    const rawCode = lineEntries.map(e => e.line).join('\n').trim().replace(/,$/, '');
    const firstLineIndex = lineEntries[0].lineIndex;
    const isMuted = rawCode.startsWith('//') || /\.gain\(\s*0(?:\.0+)?\s*\)/.test(rawCode);

    // Extract sound name & type
    const soundMatch = rawCode.match(/(?:s|sound)\s*\(\s*["']([^"']+)["']\s*\)/) ||
                       rawCode.match(/(?:note|n)\s*\(\s*["']([^"']+)["']\s*\)/);
    
    let soundName = 'synth';
    let soundType: TrackItem['soundType'] = 'synth';

    if (soundMatch && soundMatch[1]) {
      const inner = soundMatch[1].trim();
      const firstToken = inner.split(/[\s*~<([,]+/)[0] || inner;
      soundName = firstToken.replace(/[^a-zA-Z0-9_-]/g, '') || 'track';

      const lower = soundName.toLowerCase();
      if (lower.includes('kick') || lower.includes('bd') || lower === '909' || lower === '808_bd') {
        soundType = 'kick';
      } else if (lower.includes('snare') || lower.includes('sd') || lower.includes('clap')) {
        soundType = 'snare';
      } else if (lower.includes('hat') || lower.includes('hh') || lower.includes('oh') || lower.includes('ch')) {
        soundType = 'hat';
      } else if (lower.includes('acid') || lower.includes('303') || lower.includes('tb303')) {
        soundType = 'acid';
      } else if (lower.includes('sub') || lower.includes('bass') || lower === '808') {
        soundType = 'sub';
      } else if (lower.includes('chord') || lower.includes('pad') || lower.includes('juno')) {
        soundType = 'chord';
      } else if (lower.includes('perc') || lower.includes('rim') || lower.includes('tom') || lower.includes('cowbell')) {
        soundType = 'perc';
      } else if (lower.includes('lead') || lower.includes('saw') || lower.includes('square')) {
        soundType = 'lead';
      } else if (lower.includes('fx') || lower.includes('sweep') || lower.includes('noise')) {
        soundType = 'fx';
      }
    }

    const soundColor = SOUND_COLORS[soundType] || SOUND_COLORS[soundName] || SOUND_COLORS.default || '#00ffcc';

    return {
      id: `track-${trackIndex}-${firstLineIndex}`,
      trackIndex,
      lineIndex: firstLineIndex,
      rawCode,
      soundName,
      soundType,
      soundColor,
      isMuted,
      isSolo: false,
      isFlagged: false,
    };
  }

  /**
   * Toggles mute state of a track in code
   */
  public toggleMute(code: string, track: TrackItem): string {
    const lines = code.split('\n');
    const targetLine = lines[track.lineIndex];
    if (targetLine === undefined) return code;

    if (track.isMuted) {
      // Unmute: remove // comment or remove .gain(0)
      if (targetLine.trim().startsWith('//')) {
        lines[track.lineIndex] = targetLine.replace(/^\s*\/\/\s*/, '');
      } else if (targetLine.includes('.gain(0)')) {
        lines[track.lineIndex] = targetLine.replace(/\.gain\(0(?:\.0+)?\)/, '.gain(0.85)');
      }
    } else {
      // Mute: add .gain(0) or comment
      if (targetLine.includes('.gain(')) {
        lines[track.lineIndex] = targetLine.replace(/\.gain\([0-9.]+\)/, '.gain(0)');
      } else {
        const endsWithComma = targetLine.trim().endsWith(',');
        const contentWithoutComma = endsWithComma ? targetLine.slice(0, targetLine.lastIndexOf(',')) : targetLine;
        lines[track.lineIndex] = `${contentWithoutComma}.gain(0)${endsWithComma ? ',' : ''}`;
      }
    }

    return lines.join('\n');
  }

  /**
   * Replaces a track in full pattern
   */
  public replaceTrack(fullPattern: string, lineIndex: number, newTrackCode: string): string {
    const lines = fullPattern.split('\n');
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const original = lines[lineIndex];
      const indent = original.match(/^\s*/)?.[0] || '  ';
      const endsWithComma = original.trim().endsWith(',');
      const formatted = `${indent}${newTrackCode.trim()}${endsWithComma && !newTrackCode.trim().endsWith(',') ? ',' : ''}`;
      lines[lineIndex] = formatted;
      return lines.join('\n');
    }
    return fullPattern;
  }
}

export const trackService = new TrackService();
