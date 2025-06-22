import React from 'react';
import ReactDOM from 'react-dom/client';
import AppTest from './AppTest'; // Using test app for debugging
import App from './App';
import '../tailwind.css'; // Import Tailwind CSS

// Error boundary component for catching render errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React error:", error);
    console.error("Component stack:", errorInfo.componentStack);
    this.setState({ error, errorInfo });
  }
  render() {    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600">
          <h2 className="font-bold mb-2">Something went wrong</h2>
          <details className="whitespace-pre-wrap">
            <summary className="cursor-pointer">Error details</summary>
            <p className="mt-2">{this.state.error && this.state.error.toString()}</p>
            <p className="mt-2 text-sm font-mono">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </p>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

try {
  console.log("Starting React app initialization");
  const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App /> {/* Use <AppTest /> for debugging */}
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log("React app successfully rendered");
} catch (error) {
  console.error("Failed to initialize React app:", error);
  // Display error in the DOM if React fails to render
  document.getElementById('root').innerHTML = `
    <div class="p-5 text-red-600 font-sans">
      <h2 class="font-bold mb-2.5">React Initialization Error</h2>
      <p>${error.message}</p>
    </div>
  `;
}
