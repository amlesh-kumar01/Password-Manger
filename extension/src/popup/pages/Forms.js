import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormData } from '../context/FormDataContext';

const Forms = () => {
  const { formData, loading, error, addFormData, updateFormData, deleteFormData } = useFormData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editFormId, setEditFormId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formFields, setFormFields] = useState([{ name: '', value: '', type: 'text', sensitive: false }]);
  const [formInfo, setFormInfo] = useState({
    name: '',
    website: '',
    url: ''
  });
  const navigate = useNavigate();

  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setFormInfo({
      ...formInfo,
      [name]: value
    });
  };

  const handleFieldChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    const updatedFields = [...formFields];
    updatedFields[index] = {
      ...updatedFields[index],
      [name]: newValue
    };
    
    setFormFields(updatedFields);
  };

  const addField = () => {
    setFormFields([...formFields, { name: '', value: '', type: 'text', sensitive: false }]);
  };

  const removeField = (index) => {
    const updatedFields = [...formFields];
    updatedFields.splice(index, 1);
    setFormFields(updatedFields);
  };

  const handleAddFormData = async (e) => {
    e.preventDefault();
    
    // Validate form fields
    if (formFields.some(field => !field.name || !field.value)) {
      alert('Please fill in all field names and values');
      return;
    }
    
    const newFormData = {
      ...formInfo,
      fields: formFields
    };
    
    const success = await addFormData(newFormData);
    if (success) {
      setFormInfo({
        name: '',
        website: '',
        url: ''
      });
      setFormFields([{ name: '', value: '', type: 'text', sensitive: false }]);
      setShowAddForm(false);
    }
  };

  const handleUpdateFormData = async (e) => {
    e.preventDefault();
    
    // Validate form fields
    if (formFields.some(field => !field.name || !field.value)) {
      alert('Please fill in all field names and values');
      return;
    }
    
    const updatedFormData = {
      ...formInfo,
      fields: formFields
    };
    
    const success = await updateFormData(editFormId, updatedFormData);
    if (success) {
      setFormInfo({
        name: '',
        website: '',
        url: ''
      });
      setFormFields([{ name: '', value: '', type: 'text', sensitive: false }]);
      setEditFormId(null);
      setShowAddForm(false);
    }
  };

  const handleDeleteFormData = async (id) => {
    if (window.confirm('Are you sure you want to delete this form profile?')) {
      await deleteFormData(id);
    }
  };

  const handleEditFormData = (form) => {
    setFormInfo({
      name: form.name,
      website: form.website,
      url: form.url
    });
    setFormFields(form.fields);
    setEditFormId(form._id);
    setShowAddForm(true);
  };

  const toggleFormDataForm = () => {
    if (showAddForm && editFormId) {
      setEditFormId(null);
      setFormInfo({
        name: '',
        website: '',
        url: ''
      });
      setFormFields([{ name: '', value: '', type: 'text', sensitive: false }]);
    }
    setShowAddForm(!showAddForm);
  };

  const filteredFormData = formData.filter(form => 
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.website.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      <div className="header">
        <h1>Form Profiles</h1>
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
          className="nav-tab active"
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
            placeholder="Search form profiles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
          className="btn-block" 
          onClick={toggleFormDataForm}
        >
          {showAddForm 
            ? (editFormId ? 'Cancel Edit' : 'Cancel') 
            : 'Add New Form Profile'
          }
        </button>
        
        {showAddForm && (
          <div className="card" style={{ marginTop: '15px' }}>
            <h3>{editFormId ? 'Edit Form Profile' : 'Add New Form Profile'}</h3>
            <form onSubmit={editFormId ? handleUpdateFormData : handleAddFormData}>
              <div className="form-group">
                <label htmlFor="name">Profile Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formInfo.name}
                  onChange={handleInfoChange}
                  placeholder="e.g. Personal Info"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="website">Website Name</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={formInfo.website}
                  onChange={handleInfoChange}
                  placeholder="e.g. Amazon"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="url">URL Pattern</label>
                <input
                  type="text"
                  id="url"
                  name="url"
                  value={formInfo.url}
                  onChange={handleInfoChange}
                  placeholder="e.g. amazon.com"
                />
              </div>
              
              <h4>Form Fields</h4>
              {formFields.map((field, index) => (
                <div key={index} style={{ 
                  border: '1px solid #eee', 
                  padding: '10px', 
                  borderRadius: '4px',
                  marginBottom: '10px'
                }}>
                  <div className="form-group">
                    <label htmlFor={`field-name-${index}`}>Field Name</label>
                    <input
                      type="text"
                      id={`field-name-${index}`}
                      name="name"
                      value={field.name}
                      onChange={(e) => handleFieldChange(index, e)}
                      placeholder="e.g. firstName"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`field-value-${index}`}>Value</label>
                    <input
                      type="text"
                      id={`field-value-${index}`}
                      name="value"
                      value={field.value}
                      onChange={(e) => handleFieldChange(index, e)}
                      placeholder="e.g. John"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`field-type-${index}`}>Field Type</label>
                    <select
                      id={`field-type-${index}`}
                      name="type"
                      value={field.type}
                      onChange={(e) => handleFieldChange(index, e)}
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="tel">Phone</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="password">Password</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      id={`field-sensitive-${index}`}
                      name="sensitive"
                      checked={field.sensitive}
                      onChange={(e) => handleFieldChange(index, e)}
                      style={{ width: 'auto' }}
                    />
                    <label htmlFor={`field-sensitive-${index}`}>Sensitive Information</label>
                  </div>
                  {formFields.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeField(index)}
                      className="btn-secondary"
                      style={{ width: '100%' }}
                    >
                      Remove Field
                    </button>
                  )}
                </div>
              ))}
              
              <button 
                type="button" 
                onClick={addField}
                className="btn-secondary"
                style={{ width: '100%', marginBottom: '15px' }}
              >
                Add Field
              </button>
              
              <button type="submit" className="btn-block">
                {editFormId ? 'Update Form Profile' : 'Save Form Profile'}
              </button>
            </form>
          </div>
        )}
        
        {loading ? (
          <div className="loading">Loading form profiles...</div>
        ) : filteredFormData.length > 0 ? (
          <div className="card" style={{ marginTop: '15px' }}>
            <h3>Saved Form Profiles</h3>
            {filteredFormData.map((form) => (
              <div key={form._id} className="password-item">
                <div className="password-info">
                  <div className="site-name">{form.name}</div>
                  <div className="username">{form.website}</div>
                </div>
                <div className="password-actions">
                  <button 
                    onClick={() => handleEditFormData(form)}
                    style={{ padding: '5px 10px' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteFormData(form._id)}
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
            <p>No form profiles found.</p>
            {!showAddForm && (
              <button 
                className="btn-block" 
                onClick={() => setShowAddForm(true)}
              >
                Add New Form Profile
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Forms;
