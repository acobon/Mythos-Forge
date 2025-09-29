






import React, { Component, ErrorInfo, ReactNode } from 'react';
import { translations } from '../../data/translations';
import { LOCAL_STORAGE_LOCALE_KEY } from '../../constants';
import { TranslationKey } from '../../types/index';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// A minimal, context-free translation function for the error boundary.
// It reads the locale directly from localStorage to avoid context dependencies.
const simpleT = (key: TranslationKey | string): string => {
    try {
        const locale = (localStorage.getItem(LOCAL_STORAGE_LOCALE_KEY) || 'en') as 'en' | 'es';
        const typedKey = key as TranslationKey;
        return translations[locale]?.[typedKey] || translations['en']?.[typedKey] || String(key);
    } catch {
        return translations['en']?.[key as TranslationKey] || String(key);
    }
}

// The error display component, now context-free.
const ErrorDisplay: React.FC<{ error: Error | null; errorInfo: ErrorInfo | null; onDismiss: () => void; }> = ({ error, errorInfo, onDismiss }) => {
    const t = simpleT;

    const handleCopyError = () => {
        if (!error) return;
        const errorDetails = `
Error: ${error.toString()}
Stack: ${error.stack}
Component Stack: ${errorInfo?.componentStack || 'Not available'}
        `;
        navigator.clipboard.writeText(errorDetails.trim());
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-primary text-text-main p-8 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">{t('errorBoundary.title')}</h1>
            <p className="text-text-secondary mb-6 max-w-md">{t('errorBoundary.message')}</p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 text-sm font-semibold text-white bg-accent hover:bg-highlight rounded-md transition-colors"
                >
                    {t('errorBoundary.reload')}
                </button>
                 <button
                    onClick={onDismiss}
                    className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-main"
                >
                    {t('errorBoundary.recover')}
                </button>
            </div>

            {error && (
                <details className="mt-6 text-left max-w-xl w-full bg-secondary p-3 rounded-md border border-border-color">
                    <summary className="cursor-pointer font-semibold text-sm">{t('errorBoundary.details')}</summary>
                    <div className="mt-2 text-xs text-text-secondary bg-primary p-2 rounded overflow-auto max-h-48">
                        <pre className="whitespace-pre-wrap">
                            <p><strong>Error:</strong> {error.toString()}</p>
                            <p className="mt-2"><strong>Stack:</strong> {error.stack}</p>
                            {errorInfo && <p className="mt-2"><strong>Component Stack:</strong> {errorInfo.componentStack}</p>}
                        </pre>
                    </div>
                    <button onClick={handleCopyError} className="mt-2 px-3 py-1 text-xs font-semibold rounded-md bg-border-color hover:bg-primary">
                        {t('errorBoundary.copy')}
                    </button>
                </details>
            )}
        </div>
    );
};


class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error: error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleDismiss = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay 
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onDismiss={this.handleDismiss}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
