import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class TelemetryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Telemetry Stream Exception:", error, errorInfo);
  }

  public render() {
    const { hasError } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      return fallback || (
        <div className="flex flex-col items-center justify-center h-screen bg-void text-text-primary p-6 text-center">
          <div className="w-16 h-16 bg-state-danger/10 border border-state-danger/30 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-state-danger" />
          </div>
          <h2 className="text-xl font-heading font-black uppercase tracking-widest mb-2">Telemetry_Circuit_Breaker_Tripped</h2>
          <p className="text-text-secondary text-sm max-w-md mb-8 uppercase opacity-60">
            A critical failure occurred in the telemetry processing pipeline. Memory corrupted or stream desynchronized.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan uppercase font-heading tracking-widest hover:bg-accent-cyan/20 transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            Reinitialize_Systems
          </button>
        </div>
      );
    }

    return children;
  }
}
