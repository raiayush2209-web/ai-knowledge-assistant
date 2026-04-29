const SectionCard = ({ title, children }) => (
  <section className="box">
    <h2>{title}</h2>
    {children}
  </section>
);

export default SectionCard;
