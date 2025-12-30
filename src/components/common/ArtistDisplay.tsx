"use client";

import React from 'react';

interface Artist {
  id: number;
  name: string;
  instrument?: string | null;
}

interface ArtistDisplayProps {
  artist: Artist;
  className?: string;
}

export default function ArtistDisplay({ artist, className = '' }: ArtistDisplayProps) {
  return (
    <div className={`text-theme-sm ${className}`}>
      <span className="text-gray-900 dark:text-white">{artist.name}</span>
      {artist.instrument && (
        <span className="text-gray-500 dark:text-gray-400 text-xs"> -- {artist.instrument}</span>
      )}
    </div>
  );
}
