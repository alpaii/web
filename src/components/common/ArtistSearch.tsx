"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Artist } from '@/lib/api';

interface ArtistSearchProps {
  artists: Artist[];
  selectedArtistId?: number;
  onSelect: (artistId: number) => void;
  onClear: () => void;
  label?: string;
  showLabel?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  width?: string;
}

export default function ArtistSearch({
  artists,
  selectedArtistId,
  onSelect,
  onClear,
  label = '아티스트',
  showLabel = false,
  placeholder = '아티스트 검색 (2자 이상)',
  disabled = false,
  className = '',
  width = 'w-[280px]',
}: ArtistSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedArtist = artists.find(a => a.id === selectedArtistId);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setFilteredArtists([]);
      return;
    }

    const searchText = searchQuery.toLowerCase();
    const filtered = artists.filter(
      artist =>
        artist.name.toLowerCase().includes(searchText) ||
        artist.instrument?.toLowerCase().includes(searchText)
    );
    setFilteredArtists(filtered);
  }, [searchQuery, artists]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setHighlightedIndex(-1);
  };

  const handleSelect = (artist: Artist) => {
    onSelect(artist.id);
    setSearchQuery('');
    setFilteredArtists([]);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onClear();
    setSearchQuery('');
    setFilteredArtists([]);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredArtists.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredArtists.length) {
          handleSelect(filteredArtists[highlightedIndex]);
        }
        break;
      case 'Escape':
        setFilteredArtists([]);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className={className}>
      {showLabel && (
        <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
      )}

      <div className={`relative ${width} flex-shrink-0`}>
        {/* Selected Artist Display or Search Input */}
        {selectedArtist ? (
          <div className="flex items-center justify-between rounded-md border border-brand-500 bg-brand-50 px-3 py-2 dark:border-brand-400 dark:bg-brand-900/20">
            <span className="text-sm text-gray-900 dark:text-white truncate">
              {selectedArtist.name}
              {selectedArtist.instrument && ` (${selectedArtist.instrument})`}
            </span>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              title="Clear"
            >
              ×
            </button>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:disabled:bg-gray-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilteredArtists([]);
                  setHighlightedIndex(-1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Clear search"
              >
                ×
              </button>
            )}
          </>
        )}

        {/* Dropdown List */}
        {filteredArtists.length > 0 && !selectedArtist && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {filteredArtists.map((artist, index) => (
              <button
                type="button"
                key={artist.id}
                onClick={() => handleSelect(artist)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  index === highlightedIndex
                    ? 'bg-brand-50 dark:bg-brand-900/20'
                    : ''
                }`}
              >
                <div className="text-gray-900 dark:text-white">{artist.name}</div>
                {artist.instrument && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {artist.instrument}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
