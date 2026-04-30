import { useState } from 'react';
import { postJson } from '../services/api.js';
import SectionCard from './SectionCard.jsx';

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
      const result = await postJson('/query', { query, topK: 5 });
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
    <SectionCard title="4. Ask a question">
      <form onSubmit={handleQuery}>
        <input
          type="text"
          placeholder="Ask something about your documents"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit">Search & Answer</button>
      </form>
    </SectionCard>
  );
};

export default QuerySection;
