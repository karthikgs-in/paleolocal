import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './Common/LoadingSpinner';

// Minimal test component to debug geolocation
export const LocationTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to test geolocation');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>({});

  // Run diagnostics on mount
  useEffect(() => {
    const diag = {
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      hasGeolocation: 'geolocation' in navigator,
      userAgent: navigator.userAgent,
      permissions: 'permissions' in navigator,
    };
    setDiagnostics(diag);
    console.log('Browser diagnostics:', diag);
  }, []);

  const requestLocation = () => {
    setIsRequesting(true);
    setStatus('Checking geolocation support...');
    setError(null);
    
    if (!('geolocation' in navigator)) {
      setStatus('Geolocation not supported');
      setError('Geolocation is not supported by this browser');
      setIsRequesting(false);
      return;
    }

    setStatus('Requesting location permission...');
    
    const options = {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus('Location obtained successfully!');
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setError(null);
        setIsRequesting(false);
      },
      (error) => {
        setStatus('Location request failed');
        setIsRequesting(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('User denied the request for geolocation');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable');
            break;
          case error.TIMEOUT:
            setError('The request to get user location timed out');
            break;
          default:
            setError('An unknown error occurred');
            break;
        }
      },
      options
    );
  };

  // Auto-request on mount - DISABLED for manual testing
  // useEffect(() => {
  //   requestLocation();
  // }, []);

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '500px', 
      margin: '0 auto',
      fontFamily: 'system-ui',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1>Location Debug Test</h1>
      
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Browser Diagnostics:</h3>
        <ul style={{ fontSize: '12px', color: '#666' }}>
          <li>Secure Context (HTTPS): {diagnostics.isSecureContext ? '✅' : '❌'}</li>
          <li>Protocol: {diagnostics.protocol}</li>
          <li>Geolocation API: {diagnostics.hasGeolocation ? '✅' : '❌'}</li>
          <li>Permissions API: {diagnostics.permissions ? '✅' : '❌'}</li>
        </ul>
      </div>
      
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Status:</h3>
        <p style={{ color: location ? 'green' : error ? 'red' : 'orange' }}>
          {status}
        </p>
        
        {!location && !error && isRequesting && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <LoadingSpinner size="small" />
            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Please allow location access when prompted by your browser
            </p>
          </div>
        )}
        
        {location && (
          <div>
            <h3>Location:</h3>
            <p>Latitude: {location.lat}</p>
            <p>Longitude: {location.lng}</p>
          </div>
        )}
        
        {error && (
          <div>
            <h3>Error:</h3>
            <p style={{ color: 'red' }}>{error}</p>
            <button 
              onClick={requestLocation}
              style={{
                background: '#3498db',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Try Again
            </button>
          </div>
        )}
        
        {!isRequesting && !location && !error && (
          <button 
            onClick={requestLocation}
            style={{
              background: '#27ae60',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Test Location Permission
          </button>
        )}
      </div>
      
      <div style={{ fontSize: '12px', color: '#666' }}>
        <p>This is a simplified test to debug geolocation issues.</p>
        <p>If this works, the problem is in the main component logic.</p>
        <p>If this doesn't work, it's a browser/permission issue.</p>
      </div>
    </div>
  );
};