

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import { applyInitialTheme } from './utils';
import { store } from './state/store';
import './styles.css';
import { addToast } from './state/uiSlice';
import { OnboardingProvider } from './contexts/OnboardingContext';

const initializeApp = () => {
    // Immediately set theme from localStorage to prevent flash
    applyInitialTheme();

    // Register the service worker for offline functionality
    // Only register in production to avoid development server issues.
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/service-worker.js')
                .then((registration) => {
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    store.dispatch(
                                        addToast({
                                            message: 'A new version is available. Refresh the page to update.',
                                            type: 'info',
                                            duration: 10000,
                                        })
                                    );
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    store.dispatch(addToast({
                        message: `Service Worker registration failed: ${error.message}`,
                        type: 'error'
                    }));
                });
        });
    }

    // Render the React application
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        throw new Error('Could not find root element to mount to');
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <ErrorBoundary>
                <Provider store={store}>
                    <OnboardingProvider>
                        <App />
                    </OnboardingProvider>
                </Provider>
            </ErrorBoundary>
        </React.StrictMode>
    );
};

// Initialize the application directly.
// The script is loaded as a module, which ensures the DOM is ready.
initializeApp();