"use client";

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface Artist {
  id: number;
  name: string;
  instrument?: string | null;
}

interface ArtistDisplayProps {
  artist: Artist;
  className?: string;
  onClick?: (artistId: number) => void;
}

export default function ArtistDisplay({ artist, className = '', onClick }: ArtistDisplayProps) {
  const { t } = useLanguage();

  if (onClick) {
    return (
      <div className={`text-theme-sm ${className}`}>
        <button
          onClick={() => onClick(artist.id)}
          className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 cursor-pointer transition-colors text-left"
          title={t("viewArtistDetails").replace("{name}", artist.name)}
        >
          {artist.name}
        </button>
        {artist.instrument && (
          <span className="text-gray-500 dark:text-gray-400 text-xs"> -- {artist.instrument}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`text-theme-sm ${className}`}>
      <span className="text-gray-900 dark:text-white">{artist.name}</span>
      {artist.instrument && (
        <span className="text-gray-500 dark:text-gray-400 text-xs"> -- {artist.instrument}</span>
      )}
    </div>
  );
}
