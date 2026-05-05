const Results = ({ answer, matches }) => (
  <section className="box">
    <div className="status">Status: {answer ? 'Results ready' : 'Waiting for query...'}</div>
    <div className="result">
      <h3>Analysis</h3>
      <p>{answer || 'No results yet.'}</p>
    </div>

    {matches.length > 0 && (
      <div className="result">
        <h3>Supporting Content ({matches.length} matches)</h3>
        <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
          📚 Content sources used in this analysis:
        </div>
        <ol>
          {matches.map((match) => (
            <li key={match.id} style={{
              marginBottom: '15px',
              padding: '10px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#2c5aa0', fontSize: '16px' }}>
                  📄 {match.metadata?.filename || match.metadata?.source || 'Unknown source'}
                </strong>
                <span style={{
                  marginLeft: '10px',
                  fontSize: '12px',
                  color: '#666',
                  backgroundColor: '#e8f4fd',
                  padding: '2px 6px',
                  borderRadius: '3px'
                }}>
                  score: {Number(match.score).toFixed(4)}
                </span>
              </div>
              <div style={{ color: '#555', lineHeight: '1.4' }}>
                {match.metadata?.chunk?.slice(0, 200)}...
              </div>
            </li>
          ))}
        </ol>
      </div>
    )}
  </section>
);

export default Results;
