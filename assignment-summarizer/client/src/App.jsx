import { useMemo, useState } from "react";
import ResultCard from "./components/ResultCard.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/summarize";

function App() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ message: "", type: "" });
  const [result, setResult] = useState(null);

  const sentimentColor = useMemo(() => {
    if (!result?.sentiment) return "#999";
    if (result.sentiment === "positive") return "#15803d";
    if (result.sentiment === "negative") return "#b91c1c";
    return "#d97706";
  }, [result]);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName("");
      setFileContent("");
      return;
    }
    if (file.type !== "text/plain") {
      setError({ message: "Only .txt files are supported.", type: "validation" });
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileName(file.name);
      setFileContent(reader.result || "");
      setText(reader.result || "");
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({ message: "", type: "" });
    setResult(null);

    const payloadText = (fileContent || text).trim();
    if (!payloadText) {
      setError({ message: "Please paste text or upload a .txt file.", type: "validation" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: payloadText })
      });

      const data = await res.json();
      if (!res.ok) {
        const error = new Error(data?.error || "Request failed");
        error.type = data?.type;
        throw error;
      }
      setResult(data);
    } catch (err) {
      setError({ message: err.message || "Something went wrong", type: err.type || "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="header">
        <div>
          <p className="eyebrow">AI Developer Intern — 1hr build</p>
          <h1>Assignment Summarizer</h1>
          <p className="subhead">Paste unstructured text or upload a .txt file to get a clean structured summary.</p>
        </div>
        <div className="pill">Backend-secured LLM call</div>
      </header>

      <form className="card" onSubmit={handleSubmit}>
        <label htmlFor="text" className="label">Input Text</label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste any paragraph here..."
          rows={8}
        />
        <div className="file-row">
          <label className="file-label" htmlFor="file">Optional .txt file</label>
          <input id="file" type="file" accept=".txt" onChange={handleFile} />
          {fileName && <span className="file-name">Using: {fileName}</span>}
        </div>
        <div className="actions">
          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Summarize"}
          </button>
          <span className="hint">Backend validates, rate-limits, and protects API usage.</span>
        </div>
        {error.message && (
          <div className="error">
            {error.message}
            {error.type && <span className="error-type"> ({error.type})</span>}
          </div>
        )}
      </form>

      {result && (
        <div className="results">
          <ResultCard title="Summary" content={result.summary} />
          <ResultCard title="Key Points" content={result.keyPoints} />
          <ResultCard
            title="Sentiment"
            content={result.sentiment}
            accent={sentimentColor}
          />
          <ResultCard
            title="Meta"
            content={[
              `Provider: ${result.provider}`,
              `Model: ${result.model}`,
              `Request ID: ${result.requestId}`,
              `Time: ${new Date(result.timestamp).toLocaleString()}`
            ]}
            accent="#475569"
          />
        </div>
      )}
    </div>
  );
}

export default App;
