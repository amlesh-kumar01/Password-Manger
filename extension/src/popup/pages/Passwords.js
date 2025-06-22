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
    <div className="flex flex-col h-full">
      <div className="bg-blue-600 text-white p-4 text-center shadow-md">
        <h1 className="text-xl font-bold">Passwords</h1>
      </div>
      
      <div className="flex bg-white border-b">
        <div 
          className="flex-1 py-3 px-4 text-center cursor-pointer transition-colors text-gray-600 hover:bg-gray-50"
          onClick={() => navigate('/')}
        >
          Dashboard
        </div>
        <div 
          className="flex-1 py-3 px-4 text-center cursor-pointer transition-colors border-b-2 border-blue-600 text-blue-600 font-medium"
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
          className="flex-1 py-3 px-4 text-center cursor-pointer transition-colors text-gray-600 hover:bg-gray-50"
          onClick={() => navigate('/settings')}
        >
          Settings
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4 text-center text-sm">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search passwords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          onClick={togglePasswordForm}
        >
          {showAddForm 
            ? (editPasswordId ? 'Cancel Edit' : 'Cancel') 
            : 'Add New Password'
          }
        </button>
        
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{editPasswordId ? 'Edit Password' : 'Add New Password'}</h3>
            <form onSubmit={editPasswordId ? handleUpdatePassword : handleAddPassword} className="space-y-4">
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">Website Name</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="e.g. Google"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="text"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="e.g. https://www.google.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username / Email</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="e.g. john@example.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button 
                    type="button" 
                    onClick={generatePassword}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {editPasswordId ? 'Update Password' : 'Save Password'}
              </button>
            </form>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-4 text-gray-600">
            <div className="animate-pulse">Loading passwords...</div>
          </div>
        ) : filteredPasswords.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Saved Passwords</h3>
            <div className="space-y-3">
              {filteredPasswords.map((password) => (
                <div key={password._id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <div className="font-medium text-gray-800">{password.website}</div>
                    <div className="text-sm text-gray-600">{password.username}</div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditPassword(password)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-1 px-3 rounded-md text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeletePassword(password._id)}
                      className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-1 px-3 rounded-md text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-gray-600 mb-3">No passwords found.</p>
            {!showAddForm && (
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
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
