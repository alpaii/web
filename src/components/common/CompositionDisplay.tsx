"use client";

import React from 'react';

interface Composition {
  id: number;
  title: string;
  catalog_number?: string | null;
}

interface CompositionDisplayProps {
  composition: Composition | { title: string; catalogNumber: string | null };
  className?: string;
}

export default function CompositionDisplay({ composition, className = '' }: CompositionDisplayProps) {
  // Support both Composition type and the custom object type
  const title = 'title' in composition ? composition.title : '-';
  const catalogNumber = 'catalog_number' in composition
    ? composition.catalog_number
    : 'catalogNumber' in composition
      ? composition.catalogNumber
      : null;

  return (
    <div className={`text-theme-sm ${className}`}>
      <span className="text-gray-800 dark:text-white/90">{title}</span>
      {catalogNumber && (
        <span className="text-gray-500 dark:text-gray-400 text-xs"> ({catalogNumber})</span>
      )}
    </div>
  );
}
