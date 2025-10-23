import React from 'react';
import { ApiError } from '../../types';
import { getErrorMessage, getErrorSeverity } from '../../utils/errorHandling';

interface ErrorMessageProps {
  error: ApiError | string;
  onDismiss?: () => void;
  className?: string;
  showDetails?: boolean;
  canDismiss?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onDismiss,
  className = '',
  showDetails = false,
  canDismiss = true,
}) => {
  const errorObj = typeof error === 'string' 
    ? { message: error, code: 'UNKNOWN' } as ApiError 
    : error;

  const message = getErrorMessage(errorObj);
  const severity = getErrorSeverity(errorObj);

  const getSeverityClass = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'error-critical';
      case 'high':
        return 'error-high';
      case 'medium':
        return 'error-medium';
      case 'low':
        return 'error-low';
      default:
        return 'error-medium';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚠️';
      case 'low':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  return (
    <div className={`error-message ${getSeverityClass(severity)} ${className}`}>
      <div className="error-content">
        <div className="error-header">
          <span className="error-icon" role="img" aria-label={`${severity} severity error`}>
            {getSeverityIcon(severity)}
          </span>
          <span className="error-text">{message}</span>
        </div>
        
        {showDetails && errorObj.details && (
          <div className="error-details">
            <details>
              <summary>Error Details</summary>
              <pre className="error-stack">{errorObj.details}</pre>
            </details>
          </div>
        )}

        {errorObj.code && showDetails && (
          <div className="error-code">
            <small>Error Code: {errorObj.code}</small>
          </div>
        )}
      </div>

      {canDismiss && onDismiss && (
        <button
          className="error-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
};

// CSS styles (would typically be in a separate .css file)
const styles = `
.error-message {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-radius: 6px;
  margin: 8px 0;
  border-left: 4px solid;
  font-size: 14px;
  line-height: 1.4;
}

.error-critical {
  background-color: #fef2f2;
  border-left-color: #dc2626;
  color: #991b1b;
}

.error-high {
  background-color: #fef3c7;
  border-left-color: #d97706;
  color: #92400e;
}

.error-medium {
  background-color: #fef3c7;
  border-left-color: #f59e0b;
  color: #78350f;
}

.error-low {
  background-color: #dbeafe;
  border-left-color: #3b82f6;
  color: #1e40af;
}

.error-content {
  flex: 1;
  min-width: 0;
}

.error-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.error-icon {
  flex-shrink: 0;
  font-size: 16px;
}

.error-text {
  font-weight: 500;
}

.error-details {
  margin-top: 8px;
}

.error-details summary {
  cursor: pointer;
  font-size: 12px;
  color: #6b7280;
  user-select: none;
}

.error-details summary:hover {
  color: #374151;
}

.error-stack {
  margin: 8px 0 0 0;
  padding: 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  font-size: 11px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-code {
  margin-top: 4px;
}

.error-code small {
  color: #6b7280;
  font-size: 11px;
}

.error-dismiss {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  padding: 0 4px;
  margin-left: 12px;
  opacity: 0.7;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.error-dismiss:hover {
  opacity: 1;
}

.error-dismiss:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
  border-radius: 2px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .error-critical {
    background-color: #1f1415;
    color: #fca5a5;
  }
  
  .error-high {
    background-color: #1c1917;
    color: #fbbf24;
  }
  
  .error-medium {
    background-color: #1c1917;
    color: #fcd34d;
  }
  
  .error-low {
    background-color: #1e1b26;
    color: #93c5fd;
  }
  
  .error-stack {
    background-color: #1f2937;
    color: #d1d5db;
  }
}
`;

// Inject styles if they don't exist
if (typeof document !== 'undefined' && !document.getElementById('error-message-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'error-message-styles';
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}