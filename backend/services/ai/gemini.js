import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/environment.js';

let geminiClient = null;

export const getGeminiClient = () => {
  if (!geminiClient) {
    if (!config.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    geminiClient = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY.trim() });
  }
  return geminiClient;
};

export const embedTexts = async (texts, dimension = config.PINECONE_DIMENSION) => {
  if (!texts || !texts.length) return [];

  const ai = getGeminiClient();
  const batchSize = 50;
  const vectors = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    try {
      const response = await ai.models.embedContent({
        model: config.EMBED_MODEL,
        contents: batch,
        config: dimension ? { outputDimensionality: dimension } : undefined,
      });

      const batchEmbeddings = (response.embeddings || []).map((e) => e.values);
      if (batchEmbeddings.length !== batch.length) {
        throw new Error(
          `Embedding batch mismatch: expected ${batch.length} vectors, got ${batchEmbeddings.length}`
        );
      }
      vectors.push(...batchEmbeddings);
    } catch (error) {
      console.error('[GEMINI] Embedding error:', {
        model: config.EMBED_MODEL,
        dimension,
        batchCount: batch.length,
        message: error?.message,
        name: error?.name,
      });
      throw error;
    }
  }

  return vectors;
};

export const embedSingleText = async (text, dimension = config.PINECONE_DIMENSION) => {
  if (!text) throw new Error('Cannot embed empty text');
  const [vector] = await embedTexts([text], dimension);
  if (!vector || !vector.length) {
    throw new Error('Received empty embedding from Gemini');
  }
  return vector;
};

export const generateText = async ({ prompt, systemInstruction, temperature = 0.2 }) => {
  const ai = getGeminiClient();

  try {
    const response = await ai.models.generateContent({
      model: config.CHAT_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        temperature,
      },
    });

    return response?.text || '';
  } catch (error) {
    console.error('[GEMINI] Text generation error:', {
      model: config.CHAT_MODEL,
      message: error?.message,
      name: error?.name,
    });
    throw error;
  }
};

export const checkGemini = async () => {
  const ai = getGeminiClient();
  return await ai.models.get({ model: config.CHAT_MODEL });
};
