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
    // In a real implementation, we'd get the encryption key from storage
    // For simplicity in this example, we're using a fixed key
    const encKey = "DEMO_KEY_FOR_ENCRYPTION_SHOULD_BE_SECURED";
    return CryptoJS.AES.encrypt(data, encKey).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
};

// Decrypt data with AES
export const decryptData = (encryptedData) => {
  try {
    // In a real implementation, we'd get the encryption key from storage
    // For simplicity in this example, we're using a fixed key
    const encKey = "DEMO_KEY_FOR_ENCRYPTION_SHOULD_BE_SECURED";
    const bytes = CryptoJS.AES.decrypt(encryptedData, encKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};

// Hash a password (for local verification)
export const hashPassword = (password) => {
  return CryptoJS.SHA256(password).toString();
};
