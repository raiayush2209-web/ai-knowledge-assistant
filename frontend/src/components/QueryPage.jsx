import { useState } from 'react';
import QuerySection from './QuerySection.jsx';
import Results from './Results.jsx';

const QueryPage = () => {
  const [answer, setAnswer] = useState('');
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState('Ready');

  return (
    <div className="page-container">
      <div className="box">
        <h1 style={{ marginBottom: '1rem', color: '#f1f5f9' }}>
          Query Your Knowledge Base
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          Ask questions about your uploaded documents and indexed content
        </p>

        <QuerySection setAnswer={setAnswer} setMatches={setMatches} setStatus={setStatus} />

        <div className="status" style={{ marginTop: '2rem' }}>{status}</div>
        <Results answer={answer} matches={matches} />
      </div>
    </div>
  );
};

export default QueryPage;