import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { markErrorAsHandled } from '../lib/errorHandling';
import { captureException } from '../lib/sentry';
import * as Sentry from '@sentry/react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      eventId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour afficher l'UI de secours
    return { hasError: true };
  }  componentDidCatch(error, errorInfo) {
    // Ignorer les erreurs provenant d'extensions Chrome
    if (error?.stack?.includes('chrome-extension://') || 
        error?.message?.includes('chrome-extension://')) {
      console.warn('Erreur d\'extension Chrome ignorée dans ErrorBoundary:', error.message);
      return;
    }
    
    // Ignorer les erreurs de permission spécifiques
    if (error?.message?.includes('permission error')) {
      console.warn('Erreur de permission ignorée dans ErrorBoundary:', error.message);
      return;
    }
    
    // Marquer l'erreur comme gérée pour éviter la double notification
    markErrorAsHandled(error);
    
    // Mettre à jour l'état avec les détails de l'erreur
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Enregistrer l'erreur dans la console avec un contexte clair
    console.error("Erreur capturée par ErrorBoundary:", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    // Envoyer l'erreur à Sentry avec le contexte complet
    const eventId = Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        errorInfo: JSON.stringify(errorInfo)
      },
      tags: {
        errorType: 'react_error_boundary',
        componentName: this.props.componentName || 'unknown'
      }
    });
    
    // Stocker l'eventId pour pouvoir proposer à l'utilisateur de rapporter l'erreur
    this.setState({ eventId });
  }
  render() {
    if (this.state.hasError) {
      // Vous pouvez afficher n'importe quelle UI de secours
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-vs-gray-50">
          <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
            <div className="mb-6">
              <svg 
                className="w-20 h-20 mx-auto text-vs-error" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-vs-gray-800 mb-2">Quelque chose s'est mal passé</h1>
            <p className="text-vs-gray-600 mb-6">
              Nous sommes désolés, une erreur s'est produite lors du chargement de cette page.
            </p>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center px-4 py-2 border border-vs-blue-primary text-vs-blue-primary rounded-lg hover:bg-vs-blue-50 transition duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Rafraîchir la page
              </button>
              
              <Link
                to="/home"
                className="flex items-center justify-center px-4 py-2 bg-vs-blue-primary text-white rounded-lg hover:bg-vs-blue-dark transition duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-7-7v14" />
                </svg>
                Retour à l'accueil
              </Link>
              
              {this.state.eventId && (
                <button
                  onClick={() => Sentry.showReportDialog({ eventId: this.state.eventId })}
                  className="flex items-center justify-center px-4 py-2 border border-vs-gray-300 text-vs-gray-700 rounded-lg hover:bg-vs-gray-100 transition duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Signaler ce problème
                </button>
              )}
            </div>
            
            {this.props.showDetails && this.state.error && (
              <div className="mt-6 p-4 bg-vs-gray-100 rounded-lg text-left overflow-auto max-h-60">
                <p className="font-mono text-xs text-vs-gray-800">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <p className="font-mono text-xs text-vs-gray-600 mt-2">
                    {this.state.errorInfo.componentStack}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
