import React from 'react';
import { ApiError } from '../types';

interface ErrorDisplayProps {
  error: ApiError;
  onDismiss: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error: _error,
  onDismiss: _onDismiss,
}) => {
  return (
    <div style={{ 
      background: '#e74c3c', 
      color: 'white', 
      padding: '1rem',
      borderRadius: '4px',
      margin: '0.5rem 0'
    }}>
      <p>ErrorDisplay Component - To be implemented</p>
      {/* TODO: Implement user-friendly error display */}
    </div>
  );
};