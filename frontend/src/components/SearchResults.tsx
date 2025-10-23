import React from 'react';
import { PaleoSite } from '../types';

interface SearchResultsProps {
  sites: PaleoSite[];
  onSiteSelect: (siteId: string) => void;
  loading: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  sites: _sites,
  onSiteSelect: _onSiteSelect,
  loading: _loading,
}) => {
  return (
    <div style={{ padding: '1rem' }}>
      <p>SearchResults Component - To be implemented</p>
      {/* TODO: Implement search results list with site previews */}
    </div>
  );
};