import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePasswords } from '../context/PasswordContext';

const Passwords = () => {
  const { passwords, loading, error, addPassword, updatePassword, deletePassword } = usePasswords();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editPasswordId, setEditPasswordId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    website: '',
    url: '',
    username: '',
    password: '',
    notes: ''
  });
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddPassword = async (e) => {
    e.preventDefault();
    const success = await addPassword(formData);
    if (success) {
      setFormData({
        website: '',
        url: '',
        username: '',
        password: '',
        notes: ''
      });
      setShowAddForm(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const success = await updatePassword(editPasswordId, formData);
    if (success) {
      setFormData({
        website: '',
        url: '',
        username: '',
        password: '',
        notes: ''
      });
      setEditPasswordId(null);
    }
  };

  const handleDeletePassword = async (id) => {
    if (window.confirm('Are you sure you want to delete this password?')) {
      await deletePassword(id);
    }
  };

  const handleEditPassword = (password) => {
    setFormData({
      website: password.website,
      url: password.url,
      username: password.username,
      password: password.password,
      notes: password.notes
    });
    setEditPasswordId(password._id);
    setShowAddForm(true);
  };

  const generatePassword = () => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({
      ...formData,
      password
    });
  };

  const togglePasswordForm = () => {
    if (showAddForm && editPasswordId) {
      setEditPasswordId(null);
      setFormData({
        website: '',
        url: '',
        username: '',
        password: '',
        notes: ''
      });
    }
    setShowAddForm(!showAddForm);
  };

  const filteredPasswords = passwords.filter(password => 
    password.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
    password.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    password.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      <div className="header">
        <h1>Passwords</h1>
      </div>
      
      <div className="nav-tabs">
        <div 
          className="nav-tab"
          onClick={() => navigate('/')}
        >
          Dashboard
        </div>
        <div 
          className="nav-tab active"
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
          className="nav-tab"
          onClick={() => navigate('/settings')}
        >
          Settings
        </div>
      </div>
      
      <div className="content">
        {error && (
          <div className="notification error">
            {error}
          </div>
        )}
        
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search passwords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
          className="btn-block" 
          onClick={togglePasswordForm}
        >
          {showAddForm 
            ? (editPasswordId ? 'Cancel Edit' : 'Cancel') 
            : 'Add New Password'
          }
        </button>
        
        {showAddForm && (
          <div className="card" style={{ marginTop: '15px' }}>
            <h3>{editPasswordId ? 'Edit Password' : 'Add New Password'}</h3>
            <form onSubmit={editPasswordId ? handleUpdatePassword : handleAddPassword}>
              <div className="form-group">
                <label htmlFor="website">Website Name</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="e.g. Google"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="url">URL</label>
                <input
                  type="text"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="e.g. https://www.google.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="username">Username / Email</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="e.g. john@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={generatePassword}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <input
                  type="text"
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes"
                />
              </div>
              <button type="submit" className="btn-block">
                {editPasswordId ? 'Update Password' : 'Save Password'}
              </button>
            </form>
          </div>
        )}
        
        {loading ? (
          <div className="loading">Loading passwords...</div>
        ) : filteredPasswords.length > 0 ? (
          <div className="card" style={{ marginTop: '15px' }}>
            <h3>Saved Passwords</h3>
            {filteredPasswords.map((password) => (
              <div key={password._id} className="password-item">
                <div className="password-info">
                  <div className="site-name">{password.website}</div>
                  <div className="username">{password.username}</div>
                </div>
                <div className="password-actions">
                  <button 
                    onClick={() => handleEditPassword(password)}
                    style={{ padding: '5px 10px' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeletePassword(password._id)}
                    style={{ padding: '5px 10px' }}
                    className="btn-secondary"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No passwords found.</p>
            {!showAddForm && (
              <button 
                className="btn-block" 
                onClick={() => setShowAddForm(true)}
              >
                Add New Password
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Passwords;
