const Results = ({ answer, matches }) => (
  <section className="box">
    <div className="status">Status: {answer ? 'Answer ready' : 'Waiting for query...'}</div>
    <div className="result">
      <h3>Answer</h3>
      <p>{answer || 'No answer yet.'}</p>
    </div>

    {matches.length > 0 && (
      <div className="result">
        <h3>Top matches</h3>
        <ol>
          {matches.map((match) => (
            <li key={match.id}>
              <strong>{match.metadata?.source || 'Unknown source'}</strong>
              <p>{match.metadata?.chunk?.slice(0, 180)}...</p>
              <small>score: {Number(match.score).toFixed(4)}</small>
            </li>
          ))}
        </ol>
      </div>
    )}
  </section>
);

export default Results;
