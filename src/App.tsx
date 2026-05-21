import { useState, useRef, useCallback } from "react";

export default function LabLens() {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef();
  const step = result ? 3 : image ? 2 : 1;

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setImageBase64(e.target.result.split(",")[1]);
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are LabLens, an AI that helps patients understand their medical lab results in plain simple language. Read the lab result image carefully. Identify key tests and values. Explain what each result means in simple everyday language. Indicate if values are normal, slightly off, or concerning. Tell the patient whether they should see a doctor. Format your response like this:
**Summary:** [2-3 sentence plain English overview]
**Key Findings:**
- [Test name]: [Value] — [Plain language meaning] — [Normal/Slightly elevated/Low/Concerning]
**Should you see a doctor?** [Yes/No and why]
**Important note:** LabLens is an educational tool only. Always confirm important health decisions with a licensed healthcare professional.`,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
              { type: "text", text: "Please analyze this lab result and explain what it means in plain simple language." }
            ]
          }]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.[0]?.text || "";
      const lower = text.toLowerCase();
      const seeDoctor = lower.includes("see a doctor") || lower.includes("consult") || lower.includes("urgent");
      let status = "normal";
      if (lower.includes("urgent") || lower.includes("see a doctor")) status = "urgent";
      else if (lower.includes("slightly") || lower.includes("monitor")) status = "attention";
      setResult({ text, status, seeDoctor });
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setImage(null); setImageBase64(null); setResult(null); setError(null); };

  return (
    <div style={{ minHeight: "100vh", background: "#0A1628", color: "#fff", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>🔬</span>
        <span style={{ fontSize: 22, fontWeight: 800 }}>Lab<span style={{ color: "#F59E0B" }}>Lens</span></span>
        <span style={{ marginLeft: "auto", fontSize: 11, background: "rgba(27,79,216,0.2)", border: "1px solid rgba(27,79,216,0.4)", padding: "4px 12px", borderRadius: 99, color: "#DBEAFE" }}>Know What Your Results Mean</span>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 10 }}>Your Lab Results,<br /><span style={{ color: "#F59E0B" }}>Explained Simply.</span></h1>
          <p style={{ color: "rgba(219,234,254,0.7)", fontSize: 15 }}>Snap a photo of your lab result. Our AI reads it and tells you exactly what it means — in plain English.</p>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 32 }}>
          {["Upload", "Analyze", "Understand"].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: step > i + 1 ? "#10B981" : step === i + 1 ? "#1B4FD8" : "rgba(255,255,255,0.1)", color: "#fff" }}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 10, color: "#64748B" }}>{s}</span>
              </div>
              {i < 2 && <div style={{ width: 60, height: 1, background: step > i + 1 ? "#10B981" : "rgba(255,255,255,0.1)", marginBottom: 18 }} />}
            </div>
          ))}
        </div>

        {/* Upload zone */}
        {!image && !loading && !result && (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
            style={{ border: `2px dashed ${drag ? "#1B4FD8" : "rgba(27,79,216,0.4)"}`, borderRadius: 20, padding: "48px 24px", textAlign: "center", cursor: "pointer", background: drag ? "rgba(27,79,216,0.1)" : "rgba(13,31,60,0.6)" }}
          >
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <h3 style={{ marginBottom: 6 }}>Drop your lab result here</h3>
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 20 }}>Supports JPG, PNG — any photo from your phone</p>
            <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} style={{ background: "#1B4FD8", color: "#fff", border: "none", padding: "11px 24px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>📸 Choose Photo</button>
          </div>
        )}

        {/* Preview */}
        {image && !loading && !result && (
          <div style={{ borderRadius: 20, overflow: "hidden", background: "#0D1F3C", border: "1px solid rgba(255,255,255,0.08)" }}>
            <img src={image} alt="Lab result" style={{ width: "100%", maxHeight: 320, objectFit: "contain", display: "block", padding: 16 }} />
            <div style={{ display: "flex", gap: 10, padding: "14px 16px", background: "rgba(0,0,0,0.25)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={handleAnalyze} style={{ flex: 1, background: "linear-gradient(135deg,#1B4FD8,#2563EB)", color: "#fff", border: "none", padding: "13px 24px", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 700 }}>🔬 Analyze My Results</button>
              <button onClick={reset} style={{ background: "rgba(255,255,255,0.06)", color: "#64748B", border: "1px solid rgba(255,255,255,0.1)", padding: "13px 18px", borderRadius: 12, cursor: "pointer" }}>Clear</button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 48, background: "#0D1F3C", borderRadius: 20, border: "1px solid rgba(27,79,216,0.3)" }}>
            <div style={{ width: 48, height: 48, border: "3px solid rgba(27,79,216,0.2)", borderTopColor: "#1B4FD8", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h3 style={{ marginBottom: 6 }}>Reading your lab result...</h3>
            <p style={{ color: "#64748B", fontSize: 13 }}>Our AI is analyzing each value and preparing your explanation.</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 14, padding: "20px 24px", textAlign: "center", marginBottom: 16 }}>
            <p style={{ color: "#EF4444" }}>⚠️ {error}</p>
            <button onClick={reset} style={{ marginTop: 12, background: "transparent", color: "#64748B", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 20px", borderRadius: 8, cursor: "pointer" }}>Try Again</button>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div style={{ background: "#0D1F3C", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ padding: "18px 24px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <span style={{ fontSize: 28 }}>{result.status === "normal" ? "✅" : result.status === "attention" ? "⚠️" : "🚨"}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: result.status === "normal" ? "#10B981" : result.status === "attention" ? "#F59E0B" : "#EF4444" }}>
                  {result.status === "normal" ? "Results Look Normal" : result.status === "attention" ? "Some Values Need Attention" : "Please See a Doctor"}
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>AI-generated interpretation — not a medical diagnosis</div>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(219,234,254,0.85)", whiteSpace: "pre-wrap" }}>{result.text}</p>
              <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: result.seeDoctor ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.08)", border: `1px solid ${result.seeDoctor ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.2)"}`, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22 }}>{result.seeDoctor ? "🏥" : "👍"}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: result.seeDoctor ? "#EF4444" : "#10B981", marginBottom: 4 }}>{result.seeDoctor ? "Please see a doctor" : "No immediate doctor visit needed"}</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>LabLens is an educational tool only. Always confirm with a licensed healthcare professional.</div>
                </div>
              </div>
              <button onClick={reset} style={{ marginTop: 16, width: "100%", background: "transparent", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)", padding: 12, borderRadius: 10, cursor: "pointer", fontSize: 13 }}>🔄 Analyze Another Result</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}