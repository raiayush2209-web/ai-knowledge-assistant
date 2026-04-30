import { useState } from 'react';
import { postJson } from '../services/api.js';
import SectionCard from './SectionCard.jsx';

const IngestTextSection = ({ source, setSource, setStatus }) => {
  const [text, setText] = useState('');

  const handleIngestText = async (event) => {
    event.preventDefault();
    if (!text.trim()) {
      setStatus('Please add text to index.');
      return;
    }

    setStatus('Indexing text...');

    try {
      const result = await postJson('/ingest-text', {
        text,
        source: source || 'manual-text',
      });
      setStatus(result.success ? 'Text indexed successfully.' : 'Text ingestion failed.');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <SectionCard title="3. Index raw text">
      <form onSubmit={handleIngestText}>
        <textarea
          rows="6"
          placeholder="Paste text content here"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit">Index Text</button>
      </form>
    </SectionCard>
  );
};

export default IngestTextSection;
