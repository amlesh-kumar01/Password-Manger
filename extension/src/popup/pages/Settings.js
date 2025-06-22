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
    <div className="flex flex-col h-full">
      <div className="bg-blue-600 text-white p-4 text-center shadow-md">
        <h1 className="text-xl font-bold">Settings</h1>
      </div>
      
      <div className="flex bg-white border-b">
        <div 
          className="flex-1 py-3 px-4 text-center cursor-pointer transition-colors text-gray-600 hover:bg-gray-50"
          onClick={() => navigate('/')}
        >
          Dashboard
        </div>
        <div 
          className="flex-1 py-3 px-4 text-center cursor-pointer transition-colors text-gray-600 hover:bg-gray-50"
          onClick={() => navigate('/passwords')}
        >
          Passwords
        </div>
        <div 
          className="flex-1 py-3 px-4 text-center cursor-pointer transition-colors text-gray-600 hover:bg-gray-50"
          onClick={() => navigate('/forms')}
        >
          Forms
        </div>
        <div 
          className="flex-1 py-3 px-4 text-center cursor-pointer transition-colors border-b-2 border-blue-600 text-blue-600 font-medium"
          onClick={() => navigate('/settings')}
        >
          Settings
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Account</h3>
          <div className="mb-4">
            <div className="mb-1"><span className="font-medium">Name:</span> {currentUser?.name}</div>
            <div><span className="font-medium">Email:</span> {currentUser?.email}</div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">General Settings</h3>
          
          <div className="flex justify-between items-center mb-3">
            <label htmlFor="sync" className="text-sm text-gray-700">Enable Sync</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sync"
                checked={syncEnabled}
                onChange={() => setSyncEnabled(!syncEnabled)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <label htmlFor="autofill" className="text-sm text-gray-700">Enable Auto-Fill</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autofill"
                checked={autoFillEnabled}
                onChange={() => setAutoFillEnabled(!autoFillEnabled)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <label htmlFor="darkmode" className="text-sm text-gray-700">Dark Mode</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="darkmode"
                checked={darkModeEnabled}
                onChange={() => setDarkModeEnabled(!darkModeEnabled)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label htmlFor="timeout" className="block text-sm font-medium text-gray-700 mb-1">Auto-Logout Timeout (minutes)</label>
            <select
              id="timeout"
              value={securityTimeout}
              onChange={(e) => setSecurityTimeout(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Data Management</h3>
          <div className="flex gap-3">
            <button 
              onClick={handleExportData} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Export Data
            </button>
            <button 
              onClick={handleImportData} 
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Import Data
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">About</h3>
          <div className="text-gray-600 text-sm">
            <p className="mb-1">Password & Form Manager v1.0.0</p>
            <p>A secure Chrome extension for managing passwords and form data.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
