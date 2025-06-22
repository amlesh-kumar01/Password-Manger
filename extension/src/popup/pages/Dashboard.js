import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePasswords } from '../context/PasswordContext';
import { useFormData } from '../context/FormDataContext';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { passwords } = usePasswords();
  const { formData } = useFormData();
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <div className="header">
        <h1>Dashboard</h1>
      </div>
      
      <div className="content">
        <div className="card">
          <h2>Welcome, {currentUser?.name || 'User'}!</h2>
          <p>Manage your passwords and form data securely.</p>
        </div>
        
        <div className="card">
          <h3>Quick Stats</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginTop: '15px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4285F4' }}>{passwords.length}</div>
              <div>Passwords</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4285F4' }}>{formData.length}</div>
              <div>Form Profiles</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3>Recent Passwords</h3>
          {passwords.length > 0 ? (
            <div>
              {passwords.slice(0, 3).map((password) => (
                <div key={password._id} className="password-item">
                  <div className="password-info">
                    <div className="site-name">{password.website}</div>
                    <div className="username">{password.username}</div>
                  </div>
                </div>
              ))}
              <button 
                className="btn-block" 
                style={{ marginTop: '10px' }}
                onClick={() => navigate('/passwords')}
              >
                View All Passwords
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <p>No passwords saved yet.</p>
              <button 
                className="btn-block" 
                style={{ marginTop: '10px' }}
                onClick={() => navigate('/passwords')}
              >
                Add New Password
              </button>
            </div>
          )}
        </div>
        
        <div className="card">
          <h3>Recent Form Profiles</h3>
          {formData.length > 0 ? (
            <div>
              {formData.slice(0, 3).map((form) => (
                <div key={form._id} className="password-item">
                  <div className="password-info">
                    <div className="site-name">{form.website}</div>
                    <div className="username">{form.name}</div>
                  </div>
                </div>
              ))}
              <button 
                className="btn-block" 
                style={{ marginTop: '10px' }}
                onClick={() => navigate('/forms')}
              >
                View All Form Profiles
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <p>No form profiles saved yet.</p>
              <button 
                className="btn-block" 
                style={{ marginTop: '10px' }}
                onClick={() => navigate('/forms')}
              >
                Add New Form Profile
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ padding: '15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-block" 
            onClick={() => navigate('/passwords')}
          >
            Passwords
          </button>
          <button 
            className="btn-block" 
            onClick={() => navigate('/forms')}
          >
            Forms
          </button>
          <button 
            className="btn-block btn-secondary" 
            onClick={() => navigate('/settings')}
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
