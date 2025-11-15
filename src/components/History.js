import React, { useState, useCallback } from 'react';
import { useAuth } from './Auth';

const History = () => {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [prescription, setPrescription] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchAadhaar, setSearchAadhaar] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showConversation, setShowConversation] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('hi');
  const { user } = useAuth();

  const fetchHistory = useCallback(async () => {
    if (!user?.token) {
      setError('Please login to view history');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:4000/api/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('History fetch error:', err);
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.token) {
      setError('Please login to save history');
      return;
    }

    if (!aadhaarNumber || !symptoms || !prescription) {
      setError('Please fill all required fields');
      return;
    }

    if (!aadhaarNumber.match(/^\d{12}$/)) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:4000/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          aadhaarNumber,
          symptoms,
          prescription,
          sourceText: '',
          translatedText: '',
          sourceLang: '',
          targetLang: '',
          diseases: []
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save history');
      }

      // Clear form and refresh history
      setAadhaarNumber('');
      setSymptoms('');
      setPrescription('');
      setShowForm(false);
      await fetchHistory();
    } catch (error) {
      console.error('Failed to save history:', error);
      setError(error.message || 'Failed to save history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchByAadhaar = async () => {
    if (!searchAadhaar.match(/^\d{12}$/)) {
      setError('Please enter a valid 12-digit Aadhaar number to search');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:4000/api/history/search/${searchAadhaar}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('No records found for this Aadhaar number');
      }

      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Function to translate and save conversation
  const handleConversationSubmit = async (speaker) => {
    if (!currentMessage.trim()) return;

    try {
      const text = encodeURIComponent(currentMessage);
      const sourceLang = speaker === 'doctor' ? selectedLanguage : targetLanguage;
      const targetLang = speaker === 'doctor' ? targetLanguage : selectedLanguage;
      
      const translateResponse = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${text}`
      );
      
      const translateData = await translateResponse.json();
      const translatedText = translateData[0][0][0];

      const response = await fetch(`http://localhost:4000/api/history/${searchAadhaar}/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          speaker,
          originalText: currentMessage,
          translatedText,
          sourceLang,
          targetLang
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save conversation');
      }

      setConversation([
        ...conversation,
        {
          speaker,
          originalText: currentMessage,
          translatedText,
          sourceLang,
          targetLang,
          timestamp: new Date()
        }
      ]);

      setCurrentMessage('');
    } catch (error) {
      console.error('Conversation error:', error);
      setError('Failed to save conversation');
    }
  };

  // Update the conversationSection with separate language dropdowns
  const conversationSection = (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title mb-3">Patient Conversation</h5>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <label className="me-2">Doctor's Language:</label>
            <select 
              className="form-select form-select-sm d-inline-block w-auto"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="te">Telugu</option>
            </select>
          </div>
          <div>
            <label className="me-2">Patient's Language:</label>
            <select 
              className="form-select form-select-sm d-inline-block w-auto"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="te">Telugu</option>
            </select>
          </div>
        </div>

        <div className="conversation-container border rounded p-3 mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {conversation.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.speaker === 'doctor' ? 'doctor' : 'patient'} mb-2`}
            >
              <div className="message-content">
                <small className="text-muted">{msg.speaker}</small>
                <p className="original mb-1">{msg.originalText}</p>
                <p className="translated text-muted mb-0">{msg.translatedText}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="input-group">
          <input
            type="text"
            className="form-control"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button 
            className="btn btn-outline-primary"
            onClick={() => handleConversationSubmit('doctor')}
          >
            Send as Doctor
          </button>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => handleConversationSubmit('patient')}
          >
            Send as Patient
          </button>
        </div>
      </div>

      <style>{`
        .message {
          padding: 0.5rem;
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }

        .message.doctor {
          background-color: #e3f2fd;
          margin-left: 20%;
        }

        .message.patient {
          background-color: #f5f5f5;
          margin-right: 20%;
        }

        .message-content {
          padding: 0.5rem;
        }

        .form-select {
          min-width: 120px;
        }
      `}</style>
    </div>
  );

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Patient History</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          <i className={`fas fa-${showForm ? 'minus' : 'plus'} me-2`}></i>
          {showForm ? 'Hide Form' : 'Add New Record'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">New Patient Record</h5>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Aadhaar Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="Enter 12-digit Aadhaar number"
                    maxLength="12"
                    pattern="\d{12}"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Symptoms</label>
                  <textarea
                    className="form-control"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Enter patient symptoms"
                    rows="2"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Prescription</label>
                  <textarea
                    className="form-control"
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    placeholder="Enter prescription"
                    rows="2"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="text-end">
                <button 
                  type="submit" 
                  className="btn btn-success"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-2"></i>
                      Save Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {loading && !showForm && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-8">
              <label className="form-label">Search by Aadhaar Number</label>
              <input
                type="text"
                className="form-control"
                value={searchAadhaar}
                onChange={(e) => setSearchAadhaar(e.target.value)}
                placeholder="Enter 12-digit Aadhaar number to search"
                maxLength="12"
                pattern="\d{12}"
              />
            </div>
            <div className="col-md-4">
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-primary flex-grow-1"
                  onClick={searchByAadhaar}
                  disabled={isSearching || !searchAadhaar}
                >
                  {isSearching ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Searching...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-search me-2"></i>
                      Search
                    </>
                  )}
                </button>
                {history.length > 0 && (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setSearchAadhaar('');
                      setHistory([]);
                    }}
                    disabled={isSearching}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="history-list">
        {!loading && history.length === 0 ? (
          <div className="alert alert-info">
            Enter an Aadhaar number to search for patient records.
          </div>
        ) : (
          history.map((item, index) => (
            <div key={index} className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0">
                    Patient Record - {new Date(item.timestamp).toLocaleString()}
                  </h5>
                  <span className="badge bg-primary">
                    Aadhaar: {item.aadhaarNumber}
                  </span>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <h6>Symptoms</h6>
                    <p className="border rounded p-2 bg-light">{item.symptoms}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <h6>Prescription</h6>
                    <p className="border rounded p-2 bg-light">{item.prescription}</p>
                  </div>
                </div>
                <div className="d-flex justify-content-end">
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setShowConversation(!showConversation)}
                  >
                    <i className="fas fa-comments me-1"></i>
                    {showConversation ? 'Hide Conversation' : 'Show Conversation'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showConversation && conversationSection}
    </div>
  );
};

export default History;
