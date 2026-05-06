import { useState } from 'react';
import { postJson } from '../services/api.js';
import SectionCard from './SectionCard.jsx';
import { FaCheck, FaLightbulb } from 'react-icons/fa';

const QuerySection = ({ setAnswer, setMatches, setStatus }) => {
  const [query, setQuery] = useState('');

  const handleQuery = async (event) => {
    event.preventDefault();
    if (!query.trim()) {
      setStatus('Please type a question first.');
      return;
    }

    setStatus('Querying...');

    try {
      const result = await postJson('/api/query', { query, topK: 5 });
      setAnswer(result.answer || 'No answer available.');
      setMatches(result.matches || []);
      setStatus(result.success ? 'Query completed.' : 'Query failed.');
    } catch (error) {
      setAnswer(error.message);
      setMatches([]);
      setStatus('Query error.');
    }
  };

  return (
    <SectionCard title="4. Ask a question (Works with 1+ documents)">
      <form onSubmit={handleQuery}>
        <input
          type="text"
          placeholder="Ask something about your documents"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit">Search & Answer</button>
      </form>
      <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#1e293b', borderRadius: '4px', fontSize: '14px', color: '#94a3b8', border: '1px solid #334155' }}>
        <FaCheck style={{ color: '#10b981', marginRight: '0.5rem' }} />
        <strong>Works with single or multiple documents:</strong> Ask questions about your uploaded PDFs or documents. The system will search through all content and provide answers based on what it finds.
      </div>
      <div style={{ marginTop: '10px', fontSize: '13px', color: '#94a3b8' }}>
        <FaLightbulb style={{ color: '#f59e0b', marginRight: '0.5rem' }} />
        <strong>Examples:</strong><br/>
        • For 1 document: "Summarize the main points" or "What are the key findings?"<br/>
        • For multiple: "Which document discusses...?" or "Compare approach A vs B"
      </div>
    </SectionCard>
  );
};

export default QuerySection;
