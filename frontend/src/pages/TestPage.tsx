import React from 'react';
import { MarkerTest } from '../components/Map/MarkerTest';

export const TestPage: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>PaleoLocal Marker Debug Page</h1>
      <MarkerTest />
    </div>
  );
};