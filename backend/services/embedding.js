import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { MistralAIEmbeddings, ChatMistralAI } from '@langchain/mistralai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config } from '../config/environment.js';

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 100,
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
      const source = match.metadata?.filename || match.metadata?.source || 'unknown';
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

export const generateComparison = async (query, matches) => {
  if (!matches.length) {
    return 'I could not find relevant information in the indexed documents for comparison. Try uploading additional documents or refining your question.';
  }

  // Group matches by filename/source
  const groupedMatches = matches.reduce((acc, match) => {
    const source = match.metadata?.filename || match.metadata?.source || 'unknown';
    if (!acc[source]) acc[source] = [];
    acc[source].push(match);
    return acc;
  }, {});

  const sources = Object.keys(groupedMatches);
  if (sources.length < 2) {
    return 'Comparison requires content from at least 2 different documents. Please upload multiple documents and try again.';
  }

  // Build comparison context
  const comparisonContext = sources
    .map((source, index) => {
      const sourceMatches = groupedMatches[source];
      const content = sourceMatches
        .map(match => match.metadata?.chunk)
        .filter(Boolean)
        .join(' ')
        .slice(0, 2000); // Limit content per source

      return `=== Document ${index + 1}: ${source} ===\n${content}`;
    })
    .join('\n\n');

  const comparisonPrompt = [
    new SystemMessage(
      `You are a document comparison assistant. Compare and contrast the content from multiple documents provided below. Focus on similarities, differences, unique insights, and relationships between the documents. Provide a balanced analysis that highlights key points from each document. You are a helpful assistant.

Rules:
- Answer ONLY from the provided context
- Keep answer SHORT and DIRECT
- Do NOT add headings or formatting like ### or tables
- If answer is not found, say "Not found in documents"
- Avoid repetition.

- If the answer is not in the context, say: "I couldn't find this in the uploaded documents."
- If documents are very similar, note that in the answer.
- If documents are very different, note that in the answer.
- If documents have unique insights, highlight those in the answer.
- If documents have relationships (e.g. one builds on another), explain that in the answer.
- Do NOT hallucinate or add information not in the documents.
- Focus on providing a clear comparison that directly addresses the user's question.
`
    ),
    new HumanMessage(
      `Compare the following documents in response to this question: "${query}"\n\n${comparisonContext}\n\nProvide a detailed comparison addressing the question, noting similarities and differences between the documents.`
    ),
  ];

  const response = await chatModel.invoke(comparisonPrompt);
  return response?.text || response?.content || '';
};