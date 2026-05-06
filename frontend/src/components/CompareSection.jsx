import { useState } from 'react';
import { postJson } from '../services/api.js';
import SectionCard from './SectionCard.jsx';

const CompareSection = ({ setAnswer, setMatches, setStatus }) => {
  const [query, setQuery] = useState('');

  const handleCompare = async (event) => {
    event.preventDefault();
    if (!query.trim()) {
      setStatus('Please type a comparison question first.');
      return;
    }

    setStatus('Comparing documents...');

    try {
      const result = await postJson('/api/compare', { query, topK: 50 });
      setAnswer(result.comparison || 'No comparison available.');
      setMatches(result.matches || []);
      setStatus(result.success ? 'Comparison completed.' : 'Comparison failed.');
    } catch (error) {
      setAnswer(error.message);
      setMatches([]);
      setStatus('Comparison error.');
    }
  };

  return (
    <SectionCard title="5. Compare documents (Requires 2+ documents)">
      <form onSubmit={handleCompare}>
        <input
          type="text"
          placeholder="Ask to compare content between your PDFs (e.g., 'Compare the main arguments in these documents')"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit">Compare Documents</button>
      </form>
      <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff3e0', borderRadius: '4px', fontSize: '14px', color: '#e65100' }}>
        ⚠️ <strong>Requires at least 2 documents:</strong> This feature analyzes and compares content across multiple documents. Upload 2 or more PDFs to use this feature.
      </div>
      <div style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
        💡 <strong>Examples:</strong><br/>
        • "Compare the ethical considerations in these documents"<br/>
        • "What are the main differences between these approaches?"<br/>
        • "How do these documents address similar challenges differently?"
      </div>
    </SectionCard>
  );
};

export default CompareSection;