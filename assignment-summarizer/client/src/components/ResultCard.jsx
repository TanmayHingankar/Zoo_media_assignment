function ResultCard({ title, content, accent = "#2563eb" }) {
  const isList = Array.isArray(content);

  return (
    <div className="result-card" style={{ borderColor: accent }}>
      <div className="result-title" style={{ color: accent }}>{title}</div>
      {isList ? (
        <ul>
          {content.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="result-text">{content}</p>
      )}
    </div>
  );
}

export default ResultCard;
