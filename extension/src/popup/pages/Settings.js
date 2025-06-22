import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { currentUser, logout } = useAuth();
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [autoFillEnabled, setAutoFillEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [securityTimeout, setSecurityTimeout] = useState('5');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleExportData = () => {
    // In a real implementation, we'd fetch all data and create a downloadable file
    alert('Data export functionality would be implemented here.');
  };

  const handleImportData = () => {
    // In a real implementation, we'd handle file upload and import
    alert('Data import functionality would be implemented here.');
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Settings</h1>
      </div>
      
      <div className="nav-tabs">
        <div 
          className="nav-tab"
          onClick={() => navigate('/')}
        >
          Dashboard
        </div>
        <div 
          className="nav-tab"
          onClick={() => navigate('/passwords')}
        >
          Passwords
        </div>
        <div 
          className="nav-tab"
          onClick={() => navigate('/forms')}
        >
          Forms
        </div>
        <div 
          className="nav-tab active"
          onClick={() => navigate('/settings')}
        >
          Settings
        </div>
      </div>
      
      <div className="content">
        <div className="card">
          <h3>Account</h3>
          <div style={{ marginBottom: '15px' }}>
            <div><strong>Name:</strong> {currentUser?.name}</div>
            <div><strong>Email:</strong> {currentUser?.email}</div>
          </div>
          <button onClick={handleLogout} className="btn-block btn-secondary">
            Logout
          </button>
        </div>
        
        <div className="card">
          <h3>General Settings</h3>
          
          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="sync">Enable Sync</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="sync"
                checked={syncEnabled}
                onChange={() => setSyncEnabled(!syncEnabled)}
                style={{ width: 'auto', marginRight: '5px' }}
              />
            </div>
          </div>
          
          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="autofill">Enable Auto-Fill</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="autofill"
                checked={autoFillEnabled}
                onChange={() => setAutoFillEnabled(!autoFillEnabled)}
                style={{ width: 'auto', marginRight: '5px' }}
              />
            </div>
          </div>
          
          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="darkmode">Dark Mode</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="darkmode"
                checked={darkModeEnabled}
                onChange={() => setDarkModeEnabled(!darkModeEnabled)}
                style={{ width: 'auto', marginRight: '5px' }}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="timeout">Auto-Logout Timeout (minutes)</label>
            <select
              id="timeout"
              value={securityTimeout}
              onChange={(e) => setSecurityTimeout(e.target.value)}
            >
              <option value="1">1</option>
              <option value="5">5</option>
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="60">60</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
        
        <div className="card">
          <h3>Data Management</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExportData} className="btn-block">
              Export Data
            </button>
            <button onClick={handleImportData} className="btn-block btn-secondary">
              Import Data
            </button>
          </div>
        </div>
        
        <div className="card">
          <h3>About</h3>
          <div>
            <p>Password & Form Manager v1.0.0</p>
            <p>A secure Chrome extension for managing passwords and form data.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
