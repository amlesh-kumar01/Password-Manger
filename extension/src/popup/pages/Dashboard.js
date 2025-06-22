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
    <div className="flex flex-col h-full">
      <div className="bg-blue-600 text-white p-4 text-center shadow-md">
        <h1 className="text-xl font-bold">Dashboard</h1>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-800">Welcome, {currentUser?.name || 'User'}!</h2>
          <p className="text-gray-600 mt-1">Manage your passwords and form data securely.</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-md font-semibold text-gray-800 mb-2">Quick Stats</h3>
          <div className="flex justify-around text-center mt-3">
            <div>
              <div className="text-2xl font-bold text-blue-600">{passwords.length}</div>
              <div className="text-gray-600 text-sm">Passwords</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{formData.length}</div>
              <div className="text-gray-600 text-sm">Form Profiles</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-md font-semibold text-gray-800 mb-3">Recent Passwords</h3>
          {passwords.length > 0 ? (
            <div className="space-y-3">
              {passwords.slice(0, 3).map((password) => (
                <div key={password._id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <div className="font-medium text-gray-800">{password.website}</div>
                    <div className="text-sm text-gray-600">{password.username}</div>
                  </div>
                </div>
              ))}
              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors mt-3"
                onClick={() => navigate('/passwords')}
              >
                View All Passwords
              </button>
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-gray-600 mb-3">No passwords saved yet.</p>
              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                onClick={() => navigate('/passwords')}
              >
                Add New Password
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-md font-semibold text-gray-800 mb-3">Recent Form Profiles</h3>
          {formData.length > 0 ? (
            <div className="space-y-3">
              {formData.slice(0, 3).map((form) => (
                <div key={form._id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <div className="font-medium text-gray-800">{form.website}</div>
                    <div className="text-sm text-gray-600">{form.name}</div>
                  </div>
                </div>
              ))}
              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors mt-3"
                onClick={() => navigate('/forms')}
              >
                View All Form Profiles
              </button>
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-gray-600 mb-3">No form profiles saved yet.</p>
              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                onClick={() => navigate('/forms')}
              >
                Add New Form Profile
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2">
          <button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-md transition-colors text-sm"
            onClick={() => navigate('/passwords')}
          >
            Passwords
          </button>
          <button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-md transition-colors text-sm"
            onClick={() => navigate('/forms')}
          >
            Forms
          </button>
          <button 
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-3 rounded-md transition-colors text-sm"
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
