# Password Manager & Form Manager Chrome Extension

A secure Chrome extension for managing passwords and form data with a Node.js backend.

## Features

- **Password Management**: Securely store and manage passwords
- **Form Data Management**: Save and auto-fill form data based on websites
- **Google Sign-in Integration**: Easy authentication with Google
- **Modern UI**: Clean and intuitive user interface
- **Secure Storage**: Encrypted data storage in MongoDB
- **Cross-device Sync**: Access your data across multiple devices

## Project Structure

- `/extension`: Chrome extension source code
- `/backend`: Node.js, Express, and MongoDB backend server

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/password_manager
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. Start the server:
   ```
   npm start
   ```

### Chrome Extension Setup

1. Navigate to the extension directory:
   ```
   cd extension
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the extension:
   ```
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension/dist` directory

## Development

### Backend Development
```
cd backend
npm run dev
```

### Extension Development
```
cd extension
npm run dev
```

## Security

This extension implements industry-standard security practices:
- All passwords are encrypted before storage
- HTTPS for all communications
- JWT for secure authentication
- No sensitive data is stored in local storage unencrypted

## License

MIT
