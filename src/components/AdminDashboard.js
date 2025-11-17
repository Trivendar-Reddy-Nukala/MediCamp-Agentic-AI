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

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>

      <div className="forms-container">
        <div className="add-doctor-form">
          <h2>Add New Doctor</h2>
          {doctorError && <div className="alert alert-danger">{doctorError}</div>}
          {doctorSuccess && <div className="alert alert-success">{doctorSuccess}</div>}

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

        <div className="add-admin-form">
          <h2>Add New Admin</h2>
          {adminError && <div className="alert alert-danger">{adminError}</div>}
          {adminSuccess && <div className="alert alert-success">{adminSuccess}</div>}

          <form onSubmit={handleAddAdmin}>
            <div className="form-group">
              <label>Admin's Email</label>
              <input
                type="email"
                className="form-control"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Admin's Password</label>
              <input
                type="password"
                className="form-control"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="add-admin-button">
              <i className="fas fa-user-shield"></i> Add Admin
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .admin-dashboard {
          padding: 2rem;
          max-width: 1200px;
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
          transition: background 0.3s;
        }

        .logout-button:hover {
          background: #c82333;
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
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .add-doctor-form h2,
        .add-admin-form h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: #333;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #555;
        }

        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          box-sizing: border-box;
        }

        .form-control:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
        }

        .add-doctor-button,
        .add-admin-button {
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          transition: background 0.3s;
          margin-top: 1rem;
        }

        .add-doctor-button {
          background: #28a745;
        }

        .add-doctor-button:hover {
          background: #218838;
        }

        .add-admin-button {
          background: #007bff;
        }

        .add-admin-button:hover {
          background: #0056b3;
        }

        .alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .alert-danger {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        @media (max-width: 768px) {
          .forms-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;