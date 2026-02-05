/**
 * Error Boundary Component
 * Catches React render errors and displays them for debugging
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '40px',
            backgroundColor: '#1a2332',
            color: '#e2e8f0',
            minHeight: '100vh',
            fontFamily: 'monospace',
          }}
        >
          <h1 style={{ color: '#fb7185', marginBottom: '20px' }}>
            Something went wrong
          </h1>
          <div
            style={{
              backgroundColor: '#2d3748',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <h2 style={{ color: '#fbbf24', marginBottom: '10px' }}>Error:</h2>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error?.toString()}
            </pre>
          </div>
          {this.state.errorInfo && (
            <div
              style={{
                backgroundColor: '#2d3748',
                padding: '20px',
                borderRadius: '8px',
              }}
            >
              <h2 style={{ color: '#fbbf24', marginBottom: '10px' }}>
                Component Stack:
              </h2>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: '12px',
                }}
              >
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: '#2dd4bf',
              border: 'none',
              borderRadius: '8px',
              color: '#1a2332',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
