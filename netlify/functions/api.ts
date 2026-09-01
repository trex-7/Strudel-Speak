import { GoogleGenAI, Type } from '@google/genai';
import { SYSTEM_PROMPT } from '../../constants';

function getGeminiClient(customKey?: string): GoogleGenAI | null {
  let key = customKey || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  if (typeof key === 'string') {
    key = key.trim().replace(/^["']|["']$/g, '');
  }
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Normalize path
  let path = event.path || '';
  path = path.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api/, '');
  if (!path.startsWith('/')) path = '/' + path;

  // Health
  if (path === '/health' && event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'ok', timestamp: Date.now() }),
    };
  }

  // Gemini Status
  if (path === '/gemini/status' && event.httpMethod === 'GET') {
    const hasServerKey = Boolean(process.env.GEMINI_API_KEY);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ configured: hasServerKey }),
    };
  }

  // Generate Pattern
  if (path === '/gemini/generate' && event.httpMethod === 'POST') {
    try {
      const body = event.body ? JSON.parse(event.body) : {};
      const { userPrompt, currentPattern, chaos, customKey, learnedRules, previousErrors } = body;
      const ai = getGeminiClient(customKey);

      if (!ai) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'GEMINI_API_KEY not configured on server or in client settings.' }),
        };
      }

      let fullPrompt = `
${learnedRules || ''}

Current Pattern:
${currentPattern || ''}

User Request: ${userPrompt}
Chaos Level: ${chaos ?? 0.5}/1.0
`;

      if (previousErrors) {
        fullPrompt += `\n\nPREVIOUS ATTEMPT FAILED.
Errors: ${previousErrors}
Please fix the syntax and return a valid JSON object.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: SYSTEM_PROMPT + '\n\n' + (learnedRules || ''),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              code: { type: Type.STRING },
              visualHint: { type: Type.STRING },
            },
            required: ['explanation', 'code', 'visualHint'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({ error: 'Empty response received from Gemini.' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: responseText,
      };
    } catch (err: any) {
      console.error('[Netlify Function /gemini/generate Error]', err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: err.message || 'Internal error during Gemini generation' }),
      };
    }
  }

  // Line Diagnosis
  if (path === '/gemini/diagnose-line' && event.httpMethod === 'POST') {
    try {
      const body = event.body ? JSON.parse(event.body) : {};
      const { lineIndex, lineContent, fullPattern, issueReason, desiredOutcome, customKey, learnedRules } = body;
      const ai = getGeminiClient(customKey);

      if (!ai) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'GEMINI_API_KEY not configured.' }),
        };
      }

      const prompt = `
You are the Strudel Music Live-Coding Doctor & Self-Healing Pattern Optimizer.
A user reported that Line ${(lineIndex ?? 0) + 1} in their Strudel live code is NOT working or not achieving their desired outcome.

${learnedRules || ''}

FULL ACTIVE PATTERN:
\`\`\`javascript
${fullPattern}
\`\`\`

REPORTED DEFECTIVE LINE (Line ${(lineIndex ?? 0) + 1}):
\`\`\`javascript
${lineContent}
\`\`\`

USER'S REPORTED ISSUE:
"${issueReason || 'Defective sound, rhythm or syntax'}"

DESIRED OUTCOME:
"${desiredOutcome || 'Fix the line so it plays properly and sounds musically coherent.'}"

CRITICAL REQUIREMENTS:
1. Diagnose the exact cause of failure (e.g. invalid numeric sample identifier, broken parenthesis, missing LFO, wrong parameter range, out-of-sync rhythm).
2. Generate the exact replacement line ('fixedLine') preserving correct indentation, trailing commas if inside stack(), and valid Strudel method chaining.
3. Generate the updated full pattern ('updatedFullPattern') with this line surgically replaced.
4. Ensure all sound names are alphabetical (e.g. s("sub"), s("kick"), s("acid"), s("hat"), s("snare")).
5. Ensure the result passes Strudel evaluation with no syntax or runtime errors.

Return a JSON object with:
- "diagnosis": A concise 1-sentence explanation of what was wrong with the line.
- "fixedLine": The exact replacement single line of code.
- "updatedFullPattern": The complete updated playable Strudel code.
- "explanation": Musical explanation of how the fix achieves the desired outcome.
- "suggestedTag": A single category tag (e.g. "sound-name", "filter", "rhythm", "stereo", "syntax", "gain", "dsp").
- "visualHint": Vibrant hex color (e.g. "#00ffcc", "#ec4899", "#f59e0b").
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT + '\n\n' + (learnedRules || ''),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diagnosis: { type: Type.STRING },
              fixedLine: { type: Type.STRING },
              updatedFullPattern: { type: Type.STRING },
              explanation: { type: Type.STRING },
              suggestedTag: { type: Type.STRING },
              visualHint: { type: Type.STRING },
            },
            required: ['diagnosis', 'fixedLine', 'updatedFullPattern', 'explanation', 'suggestedTag', 'visualHint'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({ error: 'Empty response received from Gemini line diagnosis.' }),
        };
      }

      const parsed = JSON.parse(responseText);
      parsed.originalLine = lineContent;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(parsed),
      };
    } catch (err: any) {
      console.error('[Netlify Function /gemini/diagnose-line Error]', err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: err.message || 'Internal error during Gemini line diagnosis' }),
      };
    }
  }

  // Batch Diagnosis
  if (path === '/gemini/diagnose-batch' && event.httpMethod === 'POST') {
    try {
      const body = event.body ? JSON.parse(event.body) : {};
      const { fullPattern, flaggedTracks, customKey, learnedRules } = body;
      const ai = getGeminiClient(customKey);

      if (!ai) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'GEMINI_API_KEY not configured.' }),
        };
      }

      const prompt = `
You are the Strudel Music Live-Coding Doctor & Multi-Track Audio Healer.
The user flagged ${(flaggedTracks || []).length} track(s) in their live performance as BAD / DEFECTIVE / NEEDING FIX.

${learnedRules || ''}

FULL ACTIVE PATTERN:
\`\`\`javascript
${fullPattern}
\`\`\`

FLAGGED TRACKS TO FIX:
${(flaggedTracks || []).map((t: any) => `
Track #${(t.trackIndex ?? 0) + 1} (Line ${(t.lineIndex ?? 0) + 1}, Instrument: "${t.soundName}"):
Code: \`${t.code}\`
Reported Issue: "${t.issueReason || 'Bad sound, rhythm or syntax'}"
Desired Outcome: "${t.desiredOutcome || 'Make it sound cohesive, in-key, and grooving'}"
`).join('\n')}

CRITICAL INSTRUCTIONS:
1. Fix each flagged track individually while ensuring all tracks groove harmoniously together.
2. Ensure all sound names are valid alphabetical Strudel samples (e.g. s("sub"), s("kick"), s("acid"), s("hat"), s("snare"), s("chord")).
3. Generate the updated full pattern with these tracks replaced.
4. For each fixed track, provide a concise 1-sentence diagnosis and musical explanation.

Return a JSON object with:
- "updatedFullPattern": The full playable Strudel pattern code.
- "overallExplanation": A brief summary of what was fixed across the mix.
- "fixedTracks": Array of objects matching the flagged tracks with "trackIndex", "lineIndex", "originalCode", "fixedCode", "diagnosis", "explanation", "suggestedTag".
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT + '\n\n' + (learnedRules || ''),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              updatedFullPattern: { type: Type.STRING },
              overallExplanation: { type: Type.STRING },
              fixedTracks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    trackIndex: { type: Type.INTEGER },
                    lineIndex: { type: Type.INTEGER },
                    originalCode: { type: Type.STRING },
                    fixedCode: { type: Type.STRING },
                    diagnosis: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    suggestedTag: { type: Type.STRING },
                  },
                  required: ['trackIndex', 'lineIndex', 'originalCode', 'fixedCode', 'diagnosis', 'explanation'],
                },
              },
            },
            required: ['updatedFullPattern', 'overallExplanation', 'fixedTracks'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({ error: 'Empty response received from Gemini batch diagnosis.' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: responseText,
      };
    } catch (err: any) {
      console.error('[Netlify Function /gemini/diagnose-batch Error]', err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: err.message || 'Internal error during Gemini batch diagnosis' }),
      };
    }
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Not found' }),
  };
};
