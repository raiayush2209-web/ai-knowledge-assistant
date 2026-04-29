import { useState } from 'react';
import { postJson } from '../services/api.js';
import SectionCard from './SectionCard.jsx';

const IndexUrlSection = ({ source, setSource, setStatus }) => {
  const [url, setUrl] = useState('');

  const handleIndexUrl = async (event) => {
    event.preventDefault();
    if (!url) {
      setStatus('Please enter a valid URL.');
      return;
    }

    setStatus('Indexing website...');

    try {
      const result = await postJson('/index-url', {
        url,
        source: source || url,
      });
      setStatus(result.success ? 'Website indexed successfully.' : 'Indexing failed.');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <SectionCard title="2. Index website">
      <form onSubmit={handleIndexUrl}>
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        <button type="submit">Index URL</button>
      </form>
    </SectionCard>
  );
};

export default IndexUrlSection;
