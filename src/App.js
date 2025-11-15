import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import SpeechToText from './components/Speech_to_text';
import TextToText from './components/Text_to_text';
import History from './components/History';
import Login from './components/Login';
import { AuthProvider, useAuth } from './components/Auth';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import AdminLogin from './components/AdminLogin';
import AdminSignup from './components/AdminSignup';
import AdminDashboard from './components/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/login" />;
  }

  return children;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h1>Something went wrong.</h1>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/signup" element={<AdminSignup />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <div>
                      <Navbar />
                      <Routes>
                        <Route path="/" element={<Navigate to="/speech" />} />
                        <Route path="/speech" element={<SpeechToText />} />
                        <Route path="/text" element={<TextToText />} />
                        <Route path="/history" element={<History />} />
                      </Routes>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>

            <style>{`
              .app-container {
                min-height: 100vh;
                background: linear-gradient(145deg, #f3f4f6, #ffffff);
              }

              body {
                font-family: 'Inter', sans-serif;
                color: #2d3748;
              }

              html {
                scroll-behavior: smooth;
              }

              :focus {
                outline: none;
                box-shadow: 0 0 0 3px rgba(63, 81, 181, 0.3);
              }

              ::-webkit-scrollbar {
                width: 8px;
              }

              ::-webkit-scrollbar-track {
                background: #f1f1f1;
              }

              ::-webkit-scrollbar-thumb {
                background: #3f51b5;
                border-radius: 4px;
              }

              ::-webkit-scrollbar-thumb:hover {
                background: #5c6bc0;
              }
            `}</style>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
