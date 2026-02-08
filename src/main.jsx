import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Global Error Boundary
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: '#ff003c', padding: '2rem', background: '#050508', height: '100vh', fontFamily: 'monospace' }}>
          <h1>SYSTEM FAILURE</h1>
          <p>{this.state.error && this.state.error.toString()}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px', marginTop: '20px' }}>REBOOT SYSTEM</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('CRITICAL: Root element not found');
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
}
