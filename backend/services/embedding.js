import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { embedTexts, embedSingleText, generateText } from './ai/gemini.js';

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 100,
});

export const createChunks = async (text) => {
  if (!text) return [];
  const chunks = await textSplitter.splitText(text);
  return chunks.filter(Boolean);
};

export const embedChunks = async (chunks) => {
  if (!chunks || !chunks.length) return [];
  const vectors = await embedTexts(chunks);
  return chunks.map((chunk, index) => ({ chunk, vector: vectors[index] }));
};

export const embedQuery = async (query) => {
  return await embedSingleText(query);
};

const extractSourceLabel = (match) => match.metadata?.filename || match.metadata?.source || match.metadata?.documentId || 'unknown';
const extractSourceKey = (match) => match.metadata?.documentId || match.metadata?.filename || match.metadata?.source || 'unknown';

export const buildPrompt = (query, matches) => {
  const context = matches
    .map((match, index) => {
      const source = extractSourceLabel(match);
      const preview = match.metadata?.chunk || '';
      return `=== Document ${index + 1} from ${source} ===\n${preview}`;
    })
    .join('\n\n');

  const systemInstruction =
    'You are a context-aware AI knowledge assistant. Answer user questions using only the content from the provided document excerpts. If the answer is not contained in the documents, say you could not find enough information and avoid hallucinating.';

  const prompt = `Use the following extracted content to answer the question.\n\n${context}\n\nQuestion: ${query}`;

  return { systemInstruction, prompt };
};

export const generateAnswer = async (query, matches) => {
  if (!matches.length) {
    return 'I could not find relevant information in the indexed documents. Try uploading additional documents or refining your question.';
  }

  const { systemInstruction, prompt } = buildPrompt(query, matches);
  const answer = await generateText({ prompt, systemInstruction, temperature: 0.2 });
  return answer || '';
};

export const generateComparison = async (query, matches) => {
  if (!matches || !matches.length) {
    return 'I could not find relevant information in the indexed documents for comparison. Try uploading additional documents or refining your question.';
  }

  // Group matches by unique document identity
  const groupedMatches = matches.reduce((acc, match) => {
    const sourceKey = extractSourceKey(match);
    if (!acc[sourceKey]) acc[sourceKey] = [];
    acc[sourceKey].push(match);
    return acc;
  }, {});

  const sources = Object.keys(groupedMatches);
  if (sources.length < 2) {
    return `Found information from ${sources.length} document(s). Comparison requires content from at least 2 different documents. Try uploading more documents or use a different query that matches multiple documents.`;
  }

  // Build comparison context
  const comparisonContext = sources
    .map((sourceKey, index) => {
      const sourceMatches = groupedMatches[sourceKey];
      const sourceLabel = extractSourceLabel(sourceMatches[0]);
      const content = sourceMatches
        .map(match => match.metadata?.chunk)
        .filter(Boolean)
        .join(' ')
        .slice(0, 2000); // Limit content per source

      return `=== Document ${index + 1}: ${sourceLabel} ===\n${content}`;
    })
    .join('\n\n');

  const systemInstruction = `You are a document comparison assistant. Compare and contrast the content from multiple documents provided below. Focus on similarities, differences, unique insights, and relationships between the documents. Provide a balanced analysis that highlights key points from each document. You are a helpful assistant.

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
- Focus on providing a clear comparison that directly addresses the user's question.`;

  const prompt = `Compare the following documents in response to this question: "${query}"\n\n${comparisonContext}\n\nProvide a detailed comparison addressing the question, noting similarities and differences between the documents.`;

  const answer = await generateText({ prompt, systemInstruction, temperature: 0.2 });
  return answer || '';
};
