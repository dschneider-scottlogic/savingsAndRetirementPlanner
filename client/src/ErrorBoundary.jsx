import { Component } from 'react';
import { isDemoMode } from './persistence/index.js';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-600 mb-4">{this.state.error.message}</p>
        {isDemoMode && (
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="text-sm text-indigo-600 hover:underline"
          >
            Reset demo data and reload
          </button>
        )}
      </div>
    );
  }
}
