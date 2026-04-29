import SectionCard from './SectionCard.jsx';

const SourceSection = ({ source, setSource }) => (
  <SectionCard title="Source metadata">
    <p className="note">Optional source name used for uploaded documents, URLs, and text ingestion.</p>
    <input
      type="text"
      placeholder="Source name (optional)"
      value={source}
      onChange={(event) => setSource(event.target.value)}
    />
  </SectionCard>
);

export default SourceSection;
