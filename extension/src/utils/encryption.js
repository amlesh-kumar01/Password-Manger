import CryptoJS from 'crypto-js';
import { ENCRYPTION_KEY } from './constants';

// Generate a random encryption key
export const generateEncryptionKey = () => {
  return CryptoJS.lib.WordArray.random(256 / 8).toString();
};

// Get or create encryption key
export const getEncryptionKey = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get([ENCRYPTION_KEY], (result) => {
      if (result[ENCRYPTION_KEY]) {
        resolve(result[ENCRYPTION_KEY]);
      } else {
        const newKey = generateEncryptionKey();
        chrome.storage.local.set({ [ENCRYPTION_KEY]: newKey }, () => {
          resolve(newKey);
        });
      }
    });
  });
};

// Encrypt data with AES
export const encryptData = (data) => {
  try {
    if (!data) return '';
    
    // Get the encryption key from storage or use demo key for testing
    let encKey;
    try {
      const storedKey = localStorage.getItem(ENCRYPTION_KEY);
      encKey = storedKey || "DEMO_KEY_FOR_ENCRYPTION_SHOULD_BE_SECURED";
      
      // If no key is stored, save the demo key temporarily
      if (!storedKey) {
        localStorage.setItem(ENCRYPTION_KEY, encKey);
      }
    } catch (error) {
      console.warn('Error accessing storage for encryption key, using fallback:', error);
      encKey = "DEMO_KEY_FOR_ENCRYPTION_SHOULD_BE_SECURED";
    }
    
    return CryptoJS.AES.encrypt(data, encKey).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    // Return original data if encryption fails, to prevent data loss
    return data;
  }
};

// Decrypt data with AES
export const decryptData = (encryptedData) => {
  try {
    if (!encryptedData) return '';
    
    // Get the encryption key from storage or use demo key for testing
    let encKey;
    try {
      const storedKey = localStorage.getItem(ENCRYPTION_KEY);
      encKey = storedKey || "DEMO_KEY_FOR_ENCRYPTION_SHOULD_BE_SECURED";
    } catch (error) {
      console.warn('Error accessing storage for decryption key, using fallback:', error);
      encKey = "DEMO_KEY_FOR_ENCRYPTION_SHOULD_BE_SECURED";
    }
    
    const bytes = CryptoJS.AES.decrypt(encryptedData, encKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    // Return the encrypted data if decryption fails
    return encryptedData;
  }
};

// Hash a password (for local verification)
export const hashPassword = (password) => {
  return CryptoJS.SHA256(password).toString();
};
