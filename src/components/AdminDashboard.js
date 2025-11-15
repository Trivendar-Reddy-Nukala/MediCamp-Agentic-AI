import React, { useState } from 'react';
import { useAuth } from './Auth';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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

      setSuccess('Doctor added successfully');
      setDoctorEmail('');
      setDoctorPassword('');
    } catch (err) {
      setError('Failed to add doctor');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>

      <div className="add-doctor-form">
        <h2>Add New Doctor</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleAddDoctor}>
          <div className="form-group">
            <label>Doctor's Email</label>
            <input
              type="email"
              className="form-control"
              value={doctorEmail}
              onChange={(e) => setDoctorEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Doctor's Password</label>
            <input
              type="password"
              className="form-control"
              value={doctorPassword}
              onChange={(e) => setDoctorPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="add-doctor-button">
            <i className="fas fa-user-md"></i> Add Doctor
          </button>
        </form>
      </div>

      <style>{`
        .admin-dashboard {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .logout-button {
          padding: 0.5rem 1rem;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .add-doctor-form {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .add-doctor-button {
          background: #28a745;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard; 