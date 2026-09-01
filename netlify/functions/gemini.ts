import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
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

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // GET: Health / Status Check
  if (event.httpMethod === 'GET') {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'ok', configured: hasKey, engine: 'gemini-3.7-flash' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { prompt, userPrompt, currentPattern, chaos, customKey, learnedRules, previousErrors, action } = body;
    const ai = getGeminiClient(customKey);

    if (!ai) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'GEMINI_API_KEY not configured in Netlify environment variables.',
        }),
      };
    }

    // Direct single prompt mode
    if (prompt && !userPrompt && !currentPattern) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ text: response.text }),
      };
    }

    // Strudel pattern generation mode
    const effectiveUserPrompt = userPrompt || prompt || 'Generate live coding groove';
    let fullPrompt = `
${learnedRules || ''}

Current Pattern:
${currentPattern || ''}

User Request: ${effectiveUserPrompt}
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
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
    console.error('[Netlify Function /gemini Error]', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal error during Gemini execution' }),
    };
  }
};
