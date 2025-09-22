'use client';

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // You could send error reports to a service here
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2 className="error-title">مشکلی پیش آمده است</h2>
            <p className="error-message">
              متأسفانه خطایی در نمایش این قسمت رخ داده است. لطفاً صفحه را رفرش کنید.
            </p>
            <div className="error-actions">
              <button 
                className="error-button primary"
                onClick={() => window.location.reload()}
              >
                رفرش صفحه
              </button>
              <button 
                className="error-button secondary"
                onClick={() => window.history.back()}
              >
                بازگشت
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>جزئیات خطا (حالت توسعه)</summary>
                <pre className="error-stack">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
          
          <style jsx>{`
            .error-boundary {
              min-height: 400px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              font-family: Vazirmatn, sans-serif;
            }
            
            .error-container {
              text-align: center;
              max-width: 500px;
              background: white;
              padding: 40px 30px;
              border-radius: 16px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.1);
              border: 1px solid #f0f0f0;
            }
            
            .error-icon {
              font-size: 3rem;
              margin-bottom: 20px;
            }
            
            .error-title {
              color: #e74c3c;
              font-size: 1.5rem;
              font-weight: bold;
              margin-bottom: 15px;
            }
            
            .error-message {
              color: #666;
              font-size: 1rem;
              line-height: 1.6;
              margin-bottom: 25px;
            }
            
            .error-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
              flex-wrap: wrap;
            }
            
            .error-button {
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-size: 1rem;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.2s ease;
              font-family: inherit;
            }
            
            .error-button.primary {
              background: linear-gradient(90deg, #663191, #F26826);
              color: white;
            }
            
            .error-button.primary:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(102, 49, 145, 0.3);
            }
            
            .error-button.secondary {
              background: #f8f9fa;
              color: #666;
              border: 1px solid #dee2e6;
            }
            
            .error-button.secondary:hover {
              background: #e9ecef;
              transform: translateY(-1px);
            }
            
            .error-details {
              margin-top: 25px;
              text-align: left;
              background: #f8f9fa;
              border-radius: 8px;
              padding: 15px;
            }
            
            .error-details summary {
              cursor: pointer;
              font-weight: bold;
              color: #666;
              margin-bottom: 10px;
            }
            
            .error-stack {
              background: #2d3748;
              color: #e2e8f0;
              padding: 15px;
              border-radius: 6px;
              overflow-x: auto;
              font-size: 0.8rem;
              line-height: 1.4;
            }
            
            @media (max-width: 600px) {
              .error-container {
                padding: 30px 20px;
                margin: 0 10px;
              }
              
              .error-actions {
                flex-direction: column;
                align-items: center;
              }
              
              .error-button {
                width: 100%;
                max-width: 200px;
              }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
