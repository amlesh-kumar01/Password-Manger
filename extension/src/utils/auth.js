// Function to handle user login
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${process.env.API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }
    
    const data = await response.json();
    
    // Store token in local storage
    chrome.storage.local.set({ 
      token: data.token,
      user: data.user,
      lastLogin: new Date().toISOString()
    });
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

// Function to check if user is authenticated
export const checkAuth = async () => {
  try {
    // Get token from storage
    const { token } = await new Promise((resolve) => {
      chrome.storage.local.get(['token'], (result) => {
        resolve(result || {});
      });
    });
    
    if (!token) {
      return { authenticated: false };
    }
    
    // Validate token with server
    const response = await fetch(`${process.env.API_URL}/api/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // Token is invalid, clear it
      chrome.storage.local.remove(['token', 'user']);
      return { authenticated: false };
    }
    
    const data = await response.json();
    return { authenticated: true, user: data.user };
  } catch (error) {
    console.error('Auth check error:', error);
    return { authenticated: false, error: error.message };
  }
};

// Function to logout user
export const logoutUser = async () => {
  try {
    // Clear storage
    await new Promise((resolve) => {
      chrome.storage.local.remove(['token', 'user'], resolve);
    });
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};
