import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { MistralAIEmbeddings, ChatMistralAI } from '@langchain/mistralai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config } from '../config/environment.js';

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 150,
});

const embeddings = new MistralAIEmbeddings({
  apiKey: config.MISTRAL_API_KEY,
  model: config.EMBED_MODEL,
});

const chatModel = new ChatMistralAI({
  apiKey: config.MISTRAL_API_KEY,
  modelName: config.CHAT_MODEL,
  temperature: 0.2,
  maxTokens: 1024,
});

export const createChunks = async (text) => {
  if (!text) return [];
  const chunks = await textSplitter.splitText(text);
  return chunks.filter(Boolean);
};

export const embedChunks = async (chunks) => {
  const vectors = await embeddings.embedDocuments(chunks);
  return chunks.map((chunk, index) => ({ chunk, vector: vectors[index] }));
};

export const embedQuery = async (query) => {
  return await embeddings.embedQuery(query);
};

export const buildPrompt = (query, matches) => {
  const context = matches
    .map((match, index) => {
      const source = match.metadata?.source || 'unknown';
      const preview = match.metadata?.chunk || '';
      return `=== Document ${index + 1} from ${source} ===\n${preview}`;
    })
    .join('\n\n');

  return [
    new SystemMessage(
      `You are a context-aware AI knowledge assistant. Answer user questions using only the content from the provided document excerpts. If the answer is not contained in the documents, say you could not find enough information and avoid hallucinating.`
    ),
    new HumanMessage(
      `Use the following extracted content to answer the question.\n\n${context}\n\nQuestion: ${query}`
    ),
  ];
};

export const generateAnswer = async (query, matches) => {
  if (!matches.length) {
    return 'I could not find relevant information in the indexed documents. Try uploading additional documents or refining your question.';
  }

  const messages = buildPrompt(query, matches);
  const response = await chatModel.invoke(messages);
  return response?.text || response?.content || '';
};