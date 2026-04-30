import { useState } from 'react';
import { uploadFile } from '../services/api.js';
import SectionCard from './SectionCard.jsx';

const UploadSection = ({ source, setSource, setStatus }) => {
  const [file, setFile] = useState(null);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file) {
      setStatus('Please choose a file first.');
      return;
    }

    setStatus('Uploading document...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', source || file.name);

    try {
      const result = await uploadFile('/upload', formData);
      setStatus(result.success ? 'Document indexed successfully.' : 'Upload failed.');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <SectionCard title="1. Upload document">
      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept=".pdf,.docx,.txt,.md,.html"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <input
          type="text"
          placeholder="Source name (optional)"
          value={source}
          onChange={(event) => setSource(event.target.value)}
        />
        <button type="submit">Upload & Index</button>
      </form>
    </SectionCard>
  );
};

export default UploadSection;
