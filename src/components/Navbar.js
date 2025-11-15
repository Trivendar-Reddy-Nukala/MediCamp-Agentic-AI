import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="fas fa-heartbeat me-2"></i>
          Medicamp.ai
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} 
                to="/"
              >
                <i className="fas fa-home me-1"></i> Home
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/speech' ? 'active' : ''}`} 
                to="/speech"
              >
                <i className="fas fa-microphone me-1"></i> Speech Translation
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/text' ? 'active' : ''}`} 
                to="/text"
              >
                <i className="fas fa-keyboard me-1"></i> Text Translation
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`} 
                to="/history"
              >
                <i className="fas fa-history me-1"></i> History
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <style>{`
        .navbar {
          background: linear-gradient(145deg, #ffffff, #f8f9fa);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 1rem 0;
          margin-bottom: 2rem;
        }

        .navbar-brand {
          color: #3f51b5;
          font-weight: 700;
          font-size: 1.5rem;
          transition: all 0.3s ease;
        }

        .navbar-brand:hover {
          color: #5c6bc0;
          transform: translateY(-1px);
        }

        .nav-link {
          color: #2d3748;
          font-weight: 500;
          padding: 0.5rem 1rem;
          margin: 0 0.2rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .nav-link:hover {
          color: #3f51b5;
          background: rgba(63, 81, 181, 0.1);
          transform: translateY(-1px);
        }

        .nav-link.active {
          color: #3f51b5;
          background: rgba(63, 81, 181, 0.1);
          font-weight: 600;
        }

        .navbar-toggler {
          border: 2px solid #3f51b5;
          padding: 0.5rem;
        }

        .navbar-toggler:focus {
          box-shadow: 0 0 0 0.2rem rgba(63, 81, 181, 0.25);
        }

        @media (max-width: 991px) {
          .navbar-nav {
            padding: 1rem 0;
          }

          .nav-link {
            padding: 0.75rem 1rem;
            margin: 0.2rem 0;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar; 