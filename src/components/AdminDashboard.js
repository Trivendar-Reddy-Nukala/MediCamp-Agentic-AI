import React, { useState } from 'react';
import { useAuth } from './Auth';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [doctorError, setDoctorError] = useState('');
  const [doctorSuccess, setDoctorSuccess] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setDoctorError('');
    setDoctorSuccess('');

    try {
      const response = await fetch('http://localhost:4000/api/admin/add-doctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ email: doctorEmail, password: doctorPassword }),
      });

      if (!response.ok) {
        throw new Error('Failed to add doctor');
      }

      setDoctorSuccess('Doctor added successfully');
      setDoctorEmail('');
      setDoctorPassword('');
    } catch (err) {
      setDoctorError('Failed to add doctor');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    try {
      const response = await fetch('http://localhost:4000/api/admin/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add admin');
      }

      setAdminSuccess('Admin added successfully');
      setAdminEmail('');
      setAdminPassword('');
    } catch (err) {
      setAdminError(err.message || 'Failed to add admin');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navigateToAnalytics = () => {
    navigate('/admin/analytics');
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-tachometer-alt"></i> Admin Dashboard
          </h1>
          <p>Manage doctors, admins, and view analytics</p>
        </div>
        <div className="header-buttons">
          <button 
            onClick={navigateToAnalytics} 
            className="analytics-button"
          >
            <i className="fas fa-chart-line"></i> View Analytics
          </button>
          <button onClick={handleLogout} className="logout-button">
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      <div className="forms-container">
        <div className="add-doctor-form">
          <div className="form-header">
            <i className="fas fa-user-md"></i>
            <h2>Add New Doctor</h2>
          </div>
          {doctorError && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-circle"></i> {doctorError}
            </div>
          )}
          {doctorSuccess && (
            <div className="alert alert-success">
              <i className="fas fa-check-circle"></i> {doctorSuccess}
            </div>
          )}

          <form onSubmit={handleAddDoctor}>
            <div className="form-group">
              <label htmlFor="doctorEmail">
                <i className="fas fa-envelope"></i> Doctor's Email
              </label>
              <input
                id="doctorEmail"
                type="email"
                className="form-control"
                value={doctorEmail}
                onChange={(e) => setDoctorEmail(e.target.value)}
                placeholder="doctor@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="doctorPassword">
                <i className="fas fa-lock"></i> Doctor's Password
              </label>
              <input
                id="doctorPassword"
                type="password"
                className="form-control"
                value={doctorPassword}
                onChange={(e) => setDoctorPassword(e.target.value)}
                placeholder="Enter a secure password"
                required
              />
            </div>

            <button type="submit" className="add-doctor-button">
              <i className="fas fa-plus"></i> Add Doctor
            </button>
          </form>
        </div>

        <div className="add-admin-form">
          <div className="form-header">
            <i className="fas fa-user-shield"></i>
            <h2>Add New Admin</h2>
          </div>
          {adminError && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-circle"></i> {adminError}
            </div>
          )}
          {adminSuccess && (
            <div className="alert alert-success">
              <i className="fas fa-check-circle"></i> {adminSuccess}
            </div>
          )}

          <form onSubmit={handleAddAdmin}>
            <div className="form-group">
              <label htmlFor="adminEmail">
                <i className="fas fa-envelope"></i> Admin's Email
              </label>
              <input
                id="adminEmail"
                type="email"
                className="form-control"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="adminPassword">
                <i className="fas fa-lock"></i> Admin's Password
              </label>
              <input
                id="adminPassword"
                type="password"
                className="form-control"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter a secure password"
                required
              />
            </div>

            <button type="submit" className="add-admin-button">
              <i className="fas fa-plus"></i> Add Admin
            </button>
          </form>
        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .admin-dashboard {
          padding: 2rem 1rem;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .header-content h1 {
          font-size: 2rem;
          margin: 0 0 0.5rem 0;
          color: #2d3748;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-content h1 i {
          color: #667eea;
          font-size: 2.2rem;
        }

        .header-content p {
          margin: 0;
          color: #718096;
          font-size: 0.95rem;
        }

        .header-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .analytics-button {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .analytics-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .analytics-button:active {
          transform: scale(0.98);
        }

        .logout-button {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        }

        .logout-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
        }

        .logout-button:active {
          transform: scale(0.98);
        }

        .forms-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .add-doctor-form,
        .add-admin-form {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .add-doctor-form:hover,
        .add-admin-form:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .form-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .form-header i {
          font-size: 1.5rem;
          color: #667eea;
        }

        .form-header h2 {
          margin: 0;
          color: #2d3748;
          font-size: 1.2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2d3748;
          font-size: 0.95rem;
        }

        .form-group label i {
          color: #667eea;
          font-size: 0.85rem;
        }

        .form-control {
          width: 100%;
          padding: 0.875rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          font-family: inherit;
          transition: all 0.3s ease;
        }

        .form-control:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }

        .form-control::placeholder {
          color: #cbd5e0;
        }

        .add-doctor-button,
        .add-admin-button {
          width: 100%;
          color: white;
          border: none;
          padding: 0.875rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
        }

        .add-doctor-button {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          box-shadow: 0 4px 15px rgba(67, 233, 123, 0.3);
        }

        .add-doctor-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(67, 233, 123, 0.4);
        }

        .add-doctor-button:active {
          transform: scale(0.98);
        }

        .add-admin-button {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
        }

        .add-admin-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
        }

        .add-admin-button:active {
          transform: scale(0.98);
        }

        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
        }

        .alert i {
          font-size: 1.1rem;
        }

        .alert-success {
          background: #d4edda;
          color: #155724;
          border: 2px solid #c3e6cb;
        }

        .alert-danger {
          background: #f8d7da;
          color: #721c24;
          border: 2px solid #f5c6cb;
        }

        @media (max-width: 1024px) {
          .forms-container {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .admin-dashboard {
            padding: 1rem;
          }

          .dashboard-header {
            flex-direction: column;
            text-align: center;
          }

          .header-content h1 {
            font-size: 1.5rem;
            justify-content: center;
          }

          .header-buttons {
            width: 100%;
            flex-direction: column;
          }

          .analytics-button,
          .logout-button {
            width: 100%;
            justify-content: center;
          }

          .forms-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;