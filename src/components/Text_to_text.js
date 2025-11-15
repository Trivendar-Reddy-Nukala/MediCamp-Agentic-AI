import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useAuth } from './Auth';

const TextToText = () => {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("hi");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [diseaseData, setDiseaseData] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    window.speechSynthesis.onvoiceschanged = () => {};
  }, []);

  const extractDiseases = async (text) => {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "Extract diseases and their durations from this text in JSON format with keys 'disease' and 'duration'." },
            { role: "user", content: text }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from API');
      }

      let extractedData;
      try {
        extractedData = JSON.parse(data.choices[0].message.content);
        if (!Array.isArray(extractedData)) {
          extractedData = [{ disease: "Unknown", duration: "Not specified" }];
        }
      } catch (parseError) {
        extractedData = [{ disease: "Unknown", duration: data.choices[0].message.content }];
      }

      setDiseaseData(extractedData);
    } catch (error) {
      console.error("AI extraction error:", error);
      setDiseaseData([{ disease: "Error", duration: "Could not extract" }]);
    }
  };

  const translateText = async () => {
    if (!sourceText.trim()) {
      alert("Please enter some text to translate");
      return;
    }
    setLoading(true);
    try {
      const text = encodeURIComponent(sourceText);
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${text}`
      );
      const data = await response.json();
      const translated = data[0][0][0] || "Translation error. Try again.";
      setTranslatedText(translated);
      await extractDiseases(translated);
    } catch (error) {
      console.error("Translation error:", error);
      setTranslatedText("Translation error. Try again.");
    }
    setLoading(false);
  };

  const speakText = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    if (!translatedText) return;

    const synthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(translatedText);
    const voices = synthesis.getVoices();
    utterance.voice = voices.find((v) => v.lang.includes(targetLanguage)) || voices[0];
    utterance.lang = targetLanguage;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = () => setSpeaking(false);

    setSpeaking(true);
    synthesis.speak(utterance);
  };

  return (
    <div className="container mt-4 text-container">
      <h2 className="mb-4 text-center main-title">Medical Text Translation</h2>
      
      <div className="language-controls p-4 mb-4">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Source Language</label>
            <select className="form-select custom-select" value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)}>
              <option value="te">Telugu</option>
              <option value="hi">Hindi</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Target Language</label>
            <select className="form-select custom-select" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="te">Telugu</option>
            </select>
          </div>
        </div>
      </div>

      <div className="input-section mb-4">
        <h5 className="section-title">Input Text</h5>
        <textarea
          className="form-control custom-textarea"
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Enter text to translate..."
          rows="4"
        />
        <button className="translate-button mt-3" onClick={translateText} disabled={loading}>
          <i className="fas fa-language me-2"></i>
          {loading ? "Translating..." : "Translate"}
        </button>
      </div>

      <div className="output-section mb-4">
        <h5 className="section-title">Translated Text</h5>
        <div className="translation-result">{translatedText}</div>
        {translatedText && (
          <button className="btn btn-success mt-2" onClick={speakText}>
            {speaking ? "🔊 Stop" : "🔊 Speak"}
          </button>
        )}
      </div>

      <style>{`
        .text-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
          background: linear-gradient(145deg, #f3f4f6, #ffffff);
          border-radius: 15px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .main-title {
          color: #2d3748;
          font-weight: 700;
          margin-bottom: 2rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .language-controls {
          background: linear-gradient(145deg, #e8eaf6, #c5cae9);
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .form-label {
          color: #2d3748;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .custom-select {
          border: 2px solid #b2b7ff;
          border-radius: 8px;
          transition: all 0.3s ease;
          background-color: rgba(255, 255, 255, 0.9);
        }

        .custom-select:focus {
          border-color: #3f51b5;
          box-shadow: 0 0 0 0.2rem rgba(63, 81, 181, 0.25);
        }

        .section-title {
          color: #2d3748;
          font-weight: 600;
          margin-bottom: 1rem;
          padding-left: 0.5rem;
          border-left: 4px solid #3f51b5;
        }

        .custom-textarea {
          border: 2px solid #b2b7ff;
          border-radius: 12px;
          padding: 1rem;
          background-color: rgba(255, 255, 255, 0.9);
          transition: all 0.3s ease;
          resize: vertical;
        }

        .custom-textarea:focus {
          border-color: #3f51b5;
          box-shadow: 0 0 0 0.2rem rgba(63, 81, 181, 0.25);
        }

        .translate-button {
          background: linear-gradient(145deg, #3f51b5, #5c6bc0);
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 25px;
          font-weight: 500;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
        }

        .translate-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(63, 81, 181, 0.4);
        }

        .translation-result {
          min-height: 100px;
          padding: 1rem;
          background: linear-gradient(145deg, #e8eaf6, #ffffff);
          border-radius: 12px;
          border: 2px solid #b2b7ff;
          margin-top: 0.5rem;
        }

        .custom-table {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .custom-table thead {
          background: linear-gradient(145deg, #3f51b5, #5c6bc0);
          color: white;
        }

        .custom-table th {
          padding: 1rem;
          font-weight: 500;
          border: none;
        }

        .custom-table td {
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
          background-color: rgba(255, 255, 255, 0.9);
        }

        .custom-table tr:last-child td {
          border-bottom: none;
        }

        .custom-table tr:hover td {
          background-color: #e8eaf6;
        }

        .input-section, .output-section, .disease-container {
          background: linear-gradient(145deg, #ffffff, #f3f4f6);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          margin-bottom: 2rem;
        }

        .patient-info {
          background: linear-gradient(145deg, #ffffff, #f8f9fa);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .save-button {
          background: linear-gradient(145deg, #28a745, #218838);
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 25px;
          font-weight: 500;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
        }

        .save-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(40, 167, 69, 0.4);
        }

        .save-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: none;
        }

        .form-label {
          font-weight: 500;
          color: #2d3748;
        }

        textarea.form-control {
          resize: vertical;
        }

        @media (max-width: 768px) {
          .text-container {
            padding: 1rem;
          }
          
          .language-controls {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TextToText;
