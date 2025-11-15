import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './Auth';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:4000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      login({ ...data, isAdmin: true });
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <i className="fas fa-user-shield"></i>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login for Medicamp.ai
          </h2>
          <p>Admin Login</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <i className="fas fa-envelope"></i> Email
            </label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-lock"></i> Password
            </label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-button">
            <i className="fas fa-sign-in-alt"></i> Login
          </button>

          {/* <div className="mt-4 text-center">
            <Link to="/admin/signup" className="signup-link">
              Create Admin Account
            </Link>
          </div> */}
        </form>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 20px;
        }

        .login-box {
          background: white;
          padding: 2rem;
          border-radius: 15px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 400px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-header i {
          font-size: 3rem;
          color: #3f51b5;
          margin-bottom: 1rem;
        }

        .login-header h2 {
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .login-header p {
          color: #718096;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #4a5568;
          font-weight: 500;
        }

        .form-group label i {
          margin-right: 0.5rem;
          color: #3f51b5;
        }

        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .form-control:focus {
          border-color: #3f51b5;
          box-shadow: 0 0 0 3px rgba(63,81,181,0.2);
        }

        .login-button {
          width: 100%;
          padding: 0.75rem;
          background: #3f51b5;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .login-button:hover {
          background: #303f9f;
          transform: translateY(-1px);
        }

        .signup-link {
          color: #3f51b5;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .signup-link:hover {
          color: #303f9f;
          text-decoration: underline;
        }

        .alert {
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .alert-danger {
          background: #fff5f5;
          color: #c53030;
          border: 1px solid #feb2b2;
        }
      `}</style>
    </div>
  );
};

export default AdminLogin; 