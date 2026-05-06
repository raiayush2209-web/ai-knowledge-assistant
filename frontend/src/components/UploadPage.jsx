import { useState } from 'react';
import UploadSection from './UploadSection.jsx';
import IndexUrlSection from './IndexUrlSection.jsx';
import IngestTextSection from './IngestTextSection.jsx';
import SourceSection from './SourceSection.jsx';
import DocumentGuidance from './DocumentGuidance.jsx';

const UploadPage = () => {
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('Ready');

  return (
    <div className="page-container">
      <div className="box">
        <h1 style={{ marginBottom: '1rem', color: '#f1f5f9' }}>
          Upload & Index Content
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          Add documents, websites, or text content to your knowledge base
        </p>

        <DocumentGuidance />
        <SourceSection source={source} setSource={setSource} />
        <UploadSection source={source} setSource={setSource} setStatus={setStatus} />
        <IndexUrlSection source={source} setSource={setSource} setStatus={setStatus} />
        <IngestTextSection source={source} setSource={setSource} setStatus={setStatus} />

        <div className="status" style={{ marginTop: '2rem' }}>{status}</div>
      </div>
    </div>
  );
};

export default UploadPage;