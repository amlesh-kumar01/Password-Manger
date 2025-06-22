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
    <div className="flex flex-col h-full">
      <div className="bg-blue-600 text-white p-4 text-center shadow-md">
        <h1 className="text-xl font-bold">Form Profiles</h1>
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
          className="flex-1 py-3 px-4 text-center cursor-pointer transition-colors border-b-2 border-blue-600 text-blue-600 font-medium"
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
            placeholder="Search form profiles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          onClick={toggleFormDataForm}
        >
          {showAddForm 
            ? (editFormId ? 'Cancel Edit' : 'Cancel') 
            : 'Add New Form Profile'
          }
        </button>
        
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{editFormId ? 'Edit Form Profile' : 'Add New Form Profile'}</h3>
            <form onSubmit={editFormId ? handleUpdateFormData : handleAddFormData} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Profile Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formInfo.name}
                  onChange={handleInfoChange}
                  placeholder="e.g. Personal Info"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">Website Name</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={formInfo.website}
                  onChange={handleInfoChange}
                  placeholder="e.g. Amazon"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">URL Pattern</label>
                <input
                  type="text"
                  id="url"
                  name="url"
                  value={formInfo.url}
                  onChange={handleInfoChange}
                  placeholder="e.g. amazon.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <h4 className="text-md font-semibold text-gray-800 mt-4 mb-2">Form Fields</h4>
              {formFields.map((field, index) => (
                <div key={index} className="border border-gray-200 p-3 rounded-md mb-3 space-y-3">
                  <div>
                    <label htmlFor={`field-name-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
                    <input
                      type="text"
                      id={`field-name-${index}`}
                      name="name"
                      value={field.name}
                      onChange={(e) => handleFieldChange(index, e)}
                      placeholder="e.g. firstName"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={`field-value-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                    <input
                      type="text"
                      id={`field-value-${index}`}
                      name="value"
                      value={field.value}
                      onChange={(e) => handleFieldChange(index, e)}
                      placeholder="e.g. John"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={`field-type-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                    <select
                      id={`field-type-${index}`}
                      name="type"
                      value={field.type}
                      onChange={(e) => handleFieldChange(index, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="tel">Phone</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="password">Password</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`field-sensitive-${index}`}
                      name="sensitive"
                      checked={field.sensitive}
                      onChange={(e) => handleFieldChange(index, e)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`field-sensitive-${index}`} className="text-sm text-gray-700">Sensitive Information</label>
                  </div>
                  {formFields.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeField(index)}
                      className="w-full bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Remove Field
                    </button>
                  )}
                </div>
              ))}
              
              <button 
                type="button" 
                onClick={addField}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors mb-4"
              >
                Add Field
              </button>
              
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {editFormId ? 'Update Form Profile' : 'Save Form Profile'}
              </button>
            </form>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-4 text-gray-600">
            <div className="animate-pulse">Loading form profiles...</div>
          </div>
        ) : filteredFormData.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Saved Form Profiles</h3>
            <div className="space-y-3">
              {filteredFormData.map((form) => (
                <div key={form._id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <div className="font-medium text-gray-800">{form.name}</div>
                    <div className="text-sm text-gray-600">{form.website}</div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditFormData(form)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-1 px-3 rounded-md text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteFormData(form._id)}
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
            <p className="text-gray-600 mb-3">No form profiles found.</p>
            {!showAddForm && (
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
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
