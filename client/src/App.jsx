import { useState } from 'react';
import UploadSection from './components/UploadSection.jsx';
import IndexUrlSection from './components/IndexUrlSection.jsx';
import IngestTextSection from './components/IngestTextSection.jsx';
import QuerySection from './components/QuerySection.jsx';
import SourceSection from './components/SourceSection.jsx';
import Results from './components/Results.jsx';

function App() {
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('Ready');
  const [answer, setAnswer] = useState('');
  const [matches, setMatches] = useState([]);

  return (
    <div className="app-shell">
      <header>
        <h1>AI Knowledge Assistant</h1>
        <p>Upload documents, index websites, and ask questions against your custom content.</p>
      </header>

      <SourceSection source={source} setSource={setSource} />
      <UploadSection source={source} setSource={setSource} setStatus={setStatus} />
      <IndexUrlSection source={source} setSource={setSource} setStatus={setStatus} />
      <IngestTextSection source={source} setSource={setSource} setStatus={setStatus} />
      <QuerySection setAnswer={setAnswer} setMatches={setMatches} setStatus={setStatus} />

      <div className="status">{status}</div>
      <Results answer={answer} matches={matches} />
    </div>
  );
}

export default App;
