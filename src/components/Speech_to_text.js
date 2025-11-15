import React, { useState, useEffect } from "react";
import "./Speech_to_text.css";

const SpeechToText = () => {
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [conversationStarted, setConversationStarted] = useState(false);
  
  const [doctorText, setDoctorText] = useState("");
  const [patientText, setPatientText] = useState("");
  const [doctorTranslatedText, setDoctorTranslatedText] = useState("");
  const [patientTranslatedText, setPatientTranslatedText] = useState("");
  const [isDoctorSpeaking, setIsDoctorSpeaking] = useState(false);
  const [isPatientSpeaking, setIsPatientSpeaking] = useState(false);
  const [doctorRecognition, setDoctorRecognition] = useState(null);
  const [patientRecognition, setPatientRecognition] = useState(null);
  const [doctorLang, setDoctorLang] = useState("en-US");
  const [patientLang, setPatientLang] = useState("hi-IN");
  const [isSpeakingTranslation, setIsSpeakingTranslation] = useState(false);
  const [isAutoFlow, setIsAutoFlow] = useState(true);
  const [silenceTimer, setSilenceTimer] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showScript, setShowScript] = useState(false);
  const [conversationActive, setConversationActive] = useState(false);
  const [medicalAnalysis, setMedicalAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [prescribedMedicines, setPrescribedMedicines] = useState([]);
  const [currentMedicine, setCurrentMedicine] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const SILENCE_TIMEOUT = 5000;
  const MIN_SPEECH_LENGTH = 2;

  const languages = [
    { code: "en-US", name: "English" },
    { code: "hi-IN", name: "Hindi" },
    { code: "te-IN", name: "Telugu" },
    { code: "ta-IN", name: "Tamil" },
    { code: "kn-IN", name: "Kannada" },
    { code: "ml-IN", name: "Malayalam" }
  ];

  const handleStartConversation = () => {
    if (!patientName.trim() || !patientAge.trim()) {
      alert("Please enter patient name and age");
      return;
    }

    if (isNaN(patientAge) || patientAge < 1 || patientAge > 150) {
      alert("Please enter a valid age");
      return;
    }

    setConversationStarted(true);
    setConversationActive(true);
  };

  const translateText = async (text, fromLang, toLang) => {
    try {
      const sourceLang = fromLang.split('-')[0];
      const targetLang = toLang.split('-')[0];
      
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      
      const data = await response.json();
      return data[0][0][0];
    } catch (error) {
      console.error('Translation error:', error);
      return 'Translation failed';
    }
  };

  const analyzeMedicalConversation = async (conversation) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('http://localhost:5001/api/analyze-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation })
      });

      const data = await response.json();
      setMedicalAnalysis(data);
      
      console.log("📋 MEDICAL ANALYSIS RESULTS:");
      console.log(JSON.stringify(data, null, 2));
      
      return data;
    } catch (error) {
      console.error('Medical analysis error:', error);
      alert('Failed to analyze conversation. Ensure medical API is running on port 5001');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const verifyPrescription = async () => {
    if (prescribedMedicines.length === 0) {
      alert("Please add at least one medicine");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch('http://localhost:5001/api/verify-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescribed_medicines: prescribedMedicines,
          patient_name: patientName,
          patient_age: parseInt(patientAge),
          symptoms: medicalAnalysis?.symptoms || [],
          conditions: medicalAnalysis?.diseases || [],
          medical_history: medicalAnalysis?.medical_history || [],
          allergies: medicalAnalysis?.allergies || []
        })
      });

      const data = await response.json();
      setVerificationResult(data);
      
      console.log("🏥 VERIFICATION RESULTS:");
      console.log(JSON.stringify(data, null, 2));
      
    } catch (error) {
      console.error('Verification error:', error);
      alert('Failed to verify prescription. Ensure medical API is running');
    } finally {
      setIsVerifying(false);
    }
  };

  const addMedicine = () => {
    if (currentMedicine.trim()) {
      setPrescribedMedicines([...prescribedMedicines, currentMedicine.trim()]);
      setCurrentMedicine("");
    }
  };

  const removeMedicine = (index) => {
    setPrescribedMedicines(prescribedMedicines.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!conversationActive) return;

    const initializeRecognition = (lang, isDoctor) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return null;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        if (isDoctor) setIsDoctorSpeaking(true);
        else setIsPatientSpeaking(true);
      };

      recognition.onend = () => {
        if (isDoctor) setIsDoctorSpeaking(false);
        else setIsPatientSpeaking(false);
      };

      recognition.onresult = async (event) => {
        if (silenceTimer) clearTimeout(silenceTimer);

        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        if (isDoctor) {
          setDoctorText(transcript);
          const translated = await translateText(transcript, doctorLang, patientLang);
          setDoctorTranslatedText(translated);
        } else {
          setPatientText(transcript);
          const translated = await translateText(transcript, patientLang, doctorLang);
          setPatientTranslatedText(translated);
        }

        const timer = setTimeout(() => {
          handleAutoFlow(isDoctor);
        }, SILENCE_TIMEOUT);

        setSilenceTimer(timer);
      };

      recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
      };

      return recognition;
    };

    const doctorRec = initializeRecognition(doctorLang, true);
    const patientRec = initializeRecognition(patientLang, false);

    setDoctorRecognition(doctorRec);
    setPatientRecognition(patientRec);

    return () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      if (doctorRec) doctorRec.stop();
      if (patientRec) patientRec.stop();
    };
  }, [doctorLang, patientLang, conversationActive]);

  useEffect(() => {
    return () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      window.speechSynthesis?.cancel();
    };
  }, [silenceTimer]);

  const addToHistory = (speaker, originalText, translatedText, originalLang, translatedLang) => {
    if (originalText && originalText.trim().length > 0) {
      setConversationHistory(prev => [...prev, {
        speaker,
        originalText,
        translatedText,
        originalLang: languages.find(l => l.code === originalLang)?.name || originalLang,
        translatedLang: languages.find(l => l.code === translatedLang)?.name || translatedLang,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const startDoctorRecording = () => {
    if (!conversationActive || !doctorRecognition || isDoctorSpeaking) return;
    if (isPatientSpeaking) patientRecognition.stop();
    doctorRecognition.start();
  };

  const stopDoctorRecording = () => {
    if (doctorRecognition && isDoctorSpeaking) {
      doctorRecognition.stop();
      addToHistory('Doctor', doctorText, doctorTranslatedText, doctorLang, patientLang);
      if (isAutoFlow) handleAutoFlow(true);
    }
  };

  const startPatientRecording = () => {
    if (!conversationActive || !patientRecognition || isPatientSpeaking) return;
    if (isDoctorSpeaking) doctorRecognition.stop();
    patientRecognition.start();
  };

  const stopPatientRecording = () => {
    if (patientRecognition && isPatientSpeaking) {
      patientRecognition.stop();
      addToHistory('Patient', patientText, patientTranslatedText, patientLang, doctorLang);
      if (isAutoFlow) handleAutoFlow(false);
    }
  };

  const speakText = (text, lang) => {
    if (!text) return;

    if (isSpeakingTranslation) {
      window.speechSynthesis.cancel();
      setIsSpeakingTranslation(false);
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang.split('-')[0];
      
      utterance.onend = () => setIsSpeakingTranslation(false);
      utterance.onerror = () => {
        console.error('Speech synthesis error');
        setIsSpeakingTranslation(false);
      };

      setIsSpeakingTranslation(true);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setIsSpeakingTranslation(false);
    }
  };

  const handleAutoFlow = async (isDoctor) => {
    if (isDoctor) {
      if (doctorRecognition && isDoctorSpeaking) {
        doctorRecognition.stop();
      }
      await new Promise(resolve => setTimeout(resolve, 300));

      if (doctorTranslatedText) {
        speakText(doctorTranslatedText, patientLang);
        setTimeout(() => startPatientRecording(), 500);
      }
    } else {
      if (patientRecognition && isPatientSpeaking) {
        patientRecognition.stop();
      }
      await new Promise(resolve => setTimeout(resolve, 300));

      if (patientTranslatedText) {
        speakText(patientTranslatedText, doctorLang);
        setTimeout(() => startDoctorRecording(), 500);
      }
    }
  };

  const handleDoctorLangChange = (e) => {
    if (!isDoctorSpeaking) {
      setDoctorLang(e.target.value);
      setDoctorText("");
      setDoctorTranslatedText("");
    }
  };

  const handlePatientLangChange = (e) => {
    if (!isPatientSpeaking) {
      setPatientLang(e.target.value);
      setPatientText("");
      setPatientTranslatedText("");
    }
  };

  const endConversation = async () => {
    if (doctorRecognition && isDoctorSpeaking) {
      doctorRecognition.stop();
    }
    if (patientRecognition && isPatientSpeaking) {
      patientRecognition.stop();
    }
    
    if (doctorText && doctorText.trim().length > 0) {
      addToHistory('Doctor', doctorText, doctorTranslatedText, doctorLang, patientLang);
    }
    if (patientText && patientText.trim().length > 0) {
      addToHistory('Patient', patientText, patientTranslatedText, patientLang, doctorLang);
    }

    window.speechSynthesis?.cancel();
    setIsSpeakingTranslation(false);
    setConversationActive(false);
    setShowScript(true);

    const conversationText = conversationHistory.map(
      entry => `${entry.speaker}: ${entry.originalText}`
    ).join('\n');
    
    if (conversationText.trim()) {
      await analyzeMedicalConversation(conversationText);
    }
  };

  const startNewConversation = () => {
    setPatientName("");
    setPatientAge("");
    setConversationStarted(false);
    setConversationHistory([]);
    setDoctorText("");
    setPatientText("");
    setDoctorTranslatedText("");
    setPatientTranslatedText("");
    setShowScript(false);
    setMedicalAnalysis(null);
    setConversationActive(false);
    setPrescribedMedicines([]);
    setCurrentMedicine("");
    setVerificationResult(null);
    setShowPrescriptionForm(false);
  };

  if (!conversationStarted) {
    return (
      <div className="container mt-5">
        <div className="patient-info-card">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">👨‍⚕️ Patient Information</h2>
              
              <div className="form-group mb-4">
                <label className="form-label">Patient Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Enter patient's full name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleStartConversation()}
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Patient Age <span className="text-danger">*</span></label>
                <input
                  type="number"
                  className="form-control form-control-lg"
                  placeholder="Enter patient's age"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleStartConversation()}
                  min="1"
                  max="150"
                />
              </div>

              <button
                className="btn btn-primary btn-lg w-100"
                onClick={handleStartConversation}
              >
                🚀 Start Consultation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showScript) {
    return (
      <div className="container mt-4">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <h4>📝 Consultation & Medical Analysis</h4>
              <small className="text-muted">Patient: {patientName}, Age: {patientAge}</small>
            </div>
            {!verificationResult && (
              <button 
                className="btn btn-primary"
                onClick={startNewConversation}
              >
                🔄 Start New Consultation
              </button>
            )}
          </div>
          <div className="card-body">
            {conversationHistory.length === 0 ? (
              <div className="text-center text-muted py-5">
                <h5>No conversation recorded</h5>
                <p>Start a new conversation to see the script here.</p>
              </div>
            ) : (
              <div>
                <div className="conversation-script">
                  <div className="mb-3 patient-info-banner">
                    <strong>📋 Consultation Details:</strong>
                    <ul className="mb-0">
                      <li>👤 Patient: {patientName}, Age: {patientAge} years</li>
                      <li>👨‍⚕️ Doctor Language: {languages.find(l => l.code === doctorLang)?.name}</li>
                      <li>🗣️ Patient Language: {languages.find(l => l.code === patientLang)?.name}</li>
                    </ul>
                  </div>
                  <hr />
                  {conversationHistory.map((entry, index) => (
                    <div key={index} className={`script-entry ${entry.speaker.toLowerCase()}-entry`}>
                      <div className="script-header">
                        <strong>{entry.speaker === 'Doctor' ? '👨‍⚕️' : '👤'} {entry.speaker.toUpperCase()}</strong>
                        <span className="text-muted ms-2 small">[{entry.timestamp}]</span>
                      </div>
                      <div className="script-content">
                        <div className="original-speech">
                          <span className="badge bg-primary mb-1">{entry.originalLang}</span>
                          <p className="mb-2">{entry.originalText}</p>
                        </div>
                        <div className="translated-speech">
                          <span className="badge bg-success mb-1">{entry.translatedLang} Translation</span>
                          <p className="mb-2 text-muted fst-italic">{entry.translatedText}</p>
                        </div>
                      </div>
                      {index < conversationHistory.length - 1 && <hr className="my-3" />}
                    </div>
                  ))}
                </div>

                <hr className="my-4" />

                <div className="medical-analysis">
                  <h5>🏥 Medical Analysis</h5>
                  {isAnalyzing ? (
                    <div className="text-center py-4">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Analyzing...</span>
                      </div>
                      <p className="mt-2">Analyzing conversation...</p>
                    </div>
                  ) : medicalAnalysis && !medicalAnalysis.error ? (
                    <div className="analysis-results">
                      {medicalAnalysis.diseases && medicalAnalysis.diseases.length > 0 && (
                        <div className="analysis-section">
                          <h6>🦠 Diseases Identified:</h6>
                          <ul>
                            {medicalAnalysis.diseases.map((disease, idx) => (
                              <li key={idx}>{disease}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {medicalAnalysis.symptoms && medicalAnalysis.symptoms.length > 0 && (
                        <div className="analysis-section">
                          <h6>🤒 Symptoms:</h6>
                          <ul>
                            {medicalAnalysis.symptoms.map((symptom, idx) => (
                              <li key={idx}>{symptom}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {medicalAnalysis.key_treatment_points && medicalAnalysis.key_treatment_points.length > 0 && (
                        <div className="analysis-section">
                          <h6>💊 Key Treatment Points:</h6>
                          <ul>
                            {medicalAnalysis.key_treatment_points.map((point, idx) => (
                              <li key={idx}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {medicalAnalysis.red_flags && medicalAnalysis.red_flags.length > 0 && (
                        <div className="analysis-section warning">
                          <h6>⚠️ Red Flags / Warning Signs:</h6>
                          <ul>
                            {medicalAnalysis.red_flags.map((flag, idx) => (
                              <li key={idx}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {medicalAnalysis.summary && (
                        <div className="analysis-section">
                          <h6>📋 Summary:</h6>
                          <p>{medicalAnalysis.summary}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      Medical analysis not available.
                    </div>
                  )}
                </div>

                {!verificationResult && (
                  <>
                    <hr className="my-4" />
                    <div className="prescription-section">
                      <h5>💊 Prescription Verification</h5>
                      
                      {!showPrescriptionForm ? (
                        <button
                          className="btn btn-success btn-lg"
                          onClick={() => setShowPrescriptionForm(true)}
                        >
                          ➕ Add Prescribed Medicines
                        </button>
                      ) : (
                        <div className="prescription-form card">
                          <div className="card-body">
                            <h6 className="card-title mb-3">Enter Prescribed Medicines</h6>
                            
                            <div className="input-group mb-3">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Medicine Name - Dosage - Frequency (e.g., Paracetamol - 500mg - 3 times daily)"
                                value={currentMedicine}
                                onChange={(e) => setCurrentMedicine(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addMedicine()}
                              />
                              <button
                                className="btn btn-outline-primary"
                                onClick={addMedicine}
                              >
                                Add
                              </button>
                            </div>

                            {prescribedMedicines.length > 0 && (
                              <div className="medicine-list mb-3">
                                <h6>Added Medicines:</h6>
                                {prescribedMedicines.map((medicine, idx) => (
                                  <div key={idx} className="medicine-item d-flex justify-content-between align-items-center">
                                    <span>💉 {medicine}</span>
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() => removeMedicine(idx)}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-primary"
                                onClick={verifyPrescription}
                                disabled={prescribedMedicines.length === 0 || isVerifying}
                              >
                                {isVerifying ? '⏳ Verifying...' : '✅ Verify Prescription'}
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => setShowPrescriptionForm(false)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {verificationResult && (
                  <>
                    <hr className="my-4" />
                    <div className="verification-result card">
                      <div className="card-header">
                        <h5>🏥 Senior Doctor Verification Results</h5>
                      </div>
                      <div className="card-body">
                        <div className={`alert ${verificationResult.can_prescribe ? 'alert-success' : 'alert-warning'}`}>
                          <h6>
                            {verificationResult.can_prescribe ? '✅ APPROVED' : '⚠️ REQUIRES CAUTION'}
                          </h6>
                          <p className="mb-0">
                            <strong>Safety Level:</strong> {verificationResult.overall_safety?.toUpperCase()}
                          </p>
                        </div>

                        <div className="mb-3">
                          <h6>📋 Verification Summary:</h6>
                          <p>{verificationResult.verification_summary}</p>
                        </div>

                        {verificationResult.medicine_reviews && verificationResult.medicine_reviews.length > 0 && (
                          <div className="mb-3">
                            <h6>💊 Medicine Reviews:</h6>
                            {verificationResult.medicine_reviews.map((med, idx) => (
                              <div key={idx} className="medicine-review card mb-2">
                                <div className="card-body">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <h6 className="mb-2">{med.medicine_name}</h6>
                                      <p className="mb-1">
                                        <strong>Status:</strong> 
                                        <span className={`badge ms-2 ${med.status === 'approved' ? 'bg-success' : med.status === 'caution' ? 'bg-warning' : 'bg-danger'}`}>
                                          {med.status?.toUpperCase()}
                                        </span>
                                      </p>
                                      <p className="mb-1">
                                        <strong>Age Appropriate:</strong> {med.age_appropriate ? '✅ Yes' : '❌ No'}
                                      </p>
                                      <p className="mb-0">
                                        <strong>Reason:</strong> {med.reason}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {med.contraindications && med.contraindications.length > 0 && (
                                    <div className="mt-2">
                                      <small><strong>Contraindications:</strong> {med.contraindications.join(', ')}</small>
                                    </div>
                                  )}
                                  
                                  {med.alternatives_if_rejected && med.alternatives_if_rejected.length > 0 && (
                                    <div className="mt-2">
                                      <small><strong>Alternatives:</strong> {med.alternatives_if_rejected.join(', ')}</small>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {verificationResult.drug_interactions && verificationResult.drug_interactions.length > 0 && (
                          <div className="mb-3 alert alert-warning">
                            <h6>⚠️ Drug Interactions:</h6>
                            {verificationResult.drug_interactions.map((interaction, idx) => (
                              <div key={idx} className="mb-2">
                                <strong>{interaction.medicines?.join(' + ')}</strong>
                                <p className="mb-1 small">{interaction.description}</p>
                                <p className="mb-0 small">💡 {interaction.recommendation}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {verificationResult.red_flags && verificationResult.red_flags.length > 0 && (
                          <div className="mb-3 alert alert-danger">
                            <h6>🚨 Red Flags:</h6>
                            <ul className="mb-0">
                              {verificationResult.red_flags.map((flag, idx) => (
                                <li key={idx}>{flag}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {verificationResult.senior_doctor_notes && (
                          <div className="alert alert-info">
                            <h6>👨‍⚕️ Senior Doctor's Notes:</h6>
                            <p className="mb-0">{verificationResult.senior_doctor_notes}</p>
                          </div>
                        )}

                        <button
                          className="btn btn-primary mt-3"
                          onClick={startNewConversation}
                        >
                          🔄 Start New Consultation
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3>Translation Console</h3>
          <small className="text-muted">Patient: {patientName}, Age: {patientAge}</small>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="autoFlowSwitch"
              checked={isAutoFlow}
              onChange={(e) => setIsAutoFlow(e.target.checked)}
              disabled={!conversationActive}
            />
            <label className="form-check-label" htmlFor="autoFlowSwitch">
              Auto-flow Mode
            </label>
          </div>
          <button
            className="btn btn-danger"
            onClick={endConversation}
            disabled={!conversationActive}
          >
            🛑 End Consultation
          </button>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">👨‍⚕️ Doctor's Speech</h5>
                <select 
                  className="form-select form-select-sm w-auto"
                  value={doctorLang}
                  onChange={handleDoctorLangChange}
                  disabled={isDoctorSpeaking || !conversationActive}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <label className="form-label">Original Speech:</label>
              <textarea
                className="form-control mb-3"
                value={doctorText}
                rows="3"
                placeholder="Doctor's speech will appear here..."
                readOnly
              />
              
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label mb-0">Translated for Patient:</label>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => speakText(doctorTranslatedText, patientLang)}
                  disabled={!doctorTranslatedText || isSpeakingTranslation || !conversationActive}
                >
                  🔊 {isSpeakingTranslation ? 'Speaking...' : 'Speak'}
                </button>
              </div>
              <textarea
                className="form-control translated-text mb-3"
                value={doctorTranslatedText}
                rows="3"
                placeholder="Translation will appear here..."
                readOnly
              />
              
              <div className="d-flex gap-2 align-items-center">
                <button
                  className={`btn ${isDoctorSpeaking ? 'btn-danger' : 'btn-primary'}`}
                  onClick={isDoctorSpeaking ? stopDoctorRecording : startDoctorRecording}
                  disabled={!conversationActive}
                >
                  🎤 {isDoctorSpeaking ? 'Stop Recording' : 'Start Recording'}
                </button>
                {isDoctorSpeaking && (
                  <div className="recording-indicator">
                    <span className="pulse-dot"></span>
                    Recording...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">👤 Patient's Speech</h5>
                <select 
                  className="form-select form-select-sm w-auto"
                  value={patientLang}
                  onChange={handlePatientLangChange}
                  disabled={isPatientSpeaking || !conversationActive}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <label className="form-label">Original Speech:</label>
              <textarea
                className="form-control mb-3"
                value={patientText}
                rows="3"
                placeholder="Patient's speech will appear here..."
                readOnly
              />
              
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label mb-0">Translated for Doctor:</label>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => speakText(patientTranslatedText, doctorLang)}
                  disabled={!patientTranslatedText || isSpeakingTranslation || !conversationActive}
                >
                  🔊 Speak
                </button>
              </div>
              <textarea
                className="form-control translated-text mb-3"
                value={patientTranslatedText}
                rows="3"
                placeholder="Translation will appear here..."
                readOnly
              />
              
              <div className="d-flex gap-2">
                <button
                  className={`btn ${isPatientSpeaking ? 'btn-danger' : 'btn-primary'}`}
                  onClick={isPatientSpeaking ? stopPatientRecording : startPatientRecording}
                  disabled={!conversationActive}
                >
                  🎤 {isPatientSpeaking ? 'Stop Recording' : 'Start Recording'}
                </button>
                {isPatientSpeaking && (
                  <div className="recording-indicator">
                    <span className="pulse-dot"></span>
                    Recording...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechToText;