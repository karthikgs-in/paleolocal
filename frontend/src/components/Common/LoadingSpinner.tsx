import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Loading...',
}) => {
  const sizeMap = {
    small: '20px',
    medium: '40px', 
    large: '60px'
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div 
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      {message && <p style={{ marginTop: '1rem', color: '#666' }}>{message}</p>}
    </div>
  );
};