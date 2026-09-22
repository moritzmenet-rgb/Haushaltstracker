import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
            <h1 className="text-2xl font-black text-slate-900 mb-4">Hoppla! Etwas ist schiefgelaufen.</h1>
            <p className="text-slate-600 mb-6">
              Die Anwendung ist abgestürzt. Das kann an einer fehlenden Internetverbindung oder einem Konfigurationsfehler liegen.
            </p>
            <div className="bg-red-50 p-4 rounded-2xl mb-6 overflow-auto max-h-40">
              <code className="text-xs text-red-700">{this.state.error?.toString()}</code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
            >
              Neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
