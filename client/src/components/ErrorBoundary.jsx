/* eslint-disable react-refresh/only-export-components */
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(_error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', _error, errorInfo);
    this.setState({ error: _error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4" role="alert">
          <div className="max-w-md w-full card p-8 text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-[var(--error)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Oops! Something went wrong
            </h1>

            <p className="text-[var(--text-secondary)] mb-6">
              We encountered an unexpected error. Don&apos;t worry, your data is safe.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left bg-[var(--bg-tertiary)] p-4 border border-[var(--border-light)]">
                <summary className="cursor-pointer font-medium text-[var(--text-secondary)] mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-[var(--error)] overflow-auto max-h-48">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="btn btn-primary"
              >
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className="btn btn-secondary"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary(_WrappedComponent) {
  return function WithErrorBoundary(props) {
    return (
      <ErrorBoundary>
        <_WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export function useErrorHandler() {
  const [error, setError] = React.useState(null);

  const handleError = React.useCallback((err) => {
    console.error('[useErrorHandler] Error caught:', err);
    setError(err);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, resetError };
}

export default ErrorBoundary;
