import React from 'react';
import { SearchFormState } from '../types';

interface SearchControlsProps {
  searchForm: SearchFormState;
  onSearchFormChange: (searchForm: SearchFormState) => void;
  onSearch: () => void;
  loading: boolean;
}

export const SearchControls: React.FC<SearchControlsProps> = ({
  searchForm: _searchForm,
  onSearchFormChange: _onSearchFormChange,
  onSearch: _onSearch,
  loading: _loading,
}) => {
  return (
    <div style={{ 
      position: 'absolute', 
      top: '10px', 
      left: '10px', 
      background: 'white', 
      padding: '1rem',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      zIndex: 1000
    }}>
      <p>SearchControls Component - To be implemented</p>
      {/* TODO: Implement search form with radius slider, query input, filters */}
    </div>
  );
};