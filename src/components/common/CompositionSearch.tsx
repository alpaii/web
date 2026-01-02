"use client";

import { useState, useEffect } from "react";
import { Composition, Composer } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

interface CompositionSearchProps {
  composers: Composer[];
  compositions: Composition[];
  selectedComposerId: number;
  selectedCompositionId: number | undefined;
  onComposerChange: (composerId: number) => void;
  onCompositionSelect: (compositionId: number) => void;
  onClear?: () => void;
  placeholder?: string;
  showComposerSelect?: boolean;
  showLabels?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function CompositionSearch({
  composers,
  compositions,
  selectedComposerId,
  selectedCompositionId,
  onComposerChange,
  onCompositionSelect,
  onClear,
  placeholder,
  showComposerSelect = true,
  showLabels = true,
  disabled = false,
  className = "",
}: CompositionSearchProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCompositions, setFilteredCompositions] = useState<Composition[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const getCompositionTitle = (compositionId: number): string => {
    const composition = compositions.find(c => c.id === compositionId);
    if (!composition) return "-";
    return composition.catalog_number
      ? `${composition.catalog_number} - ${composition.title}`
      : composition.title;
  };

  const handleComposerChange = (composerId: number) => {
    setSearchQuery("");
    setFilteredCompositions([]);
    setHighlightedIndex(-1);
    onComposerChange(composerId);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setHighlightedIndex(-1);

    if (!selectedComposerId || !query.trim() || query.trim().length < 2) {
      setFilteredCompositions([]);
      return;
    }

    const composerCompositions = compositions.filter(c => c.composer_id === selectedComposerId);
    const filtered = composerCompositions.filter(c => {
      const searchText = query.toLowerCase();
      const titleMatch = c.title.toLowerCase().includes(searchText);
      const catalogMatch = c.catalog_number?.toLowerCase().includes(searchText);
      return titleMatch || catalogMatch;
    });
    setFilteredCompositions(filtered);
  };

  const handleCompositionSelect = (compositionId: number) => {
    setSearchQuery("");
    setFilteredCompositions([]);
    setHighlightedIndex(-1);
    onCompositionSelect(compositionId);
  };

  const handleClear = () => {
    setSearchQuery("");
    setFilteredCompositions([]);
    setHighlightedIndex(-1);
    if (onClear) {
      onClear();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredCompositions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredCompositions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredCompositions.length) {
          handleCompositionSelect(filteredCompositions[highlightedIndex].id);
        }
        break;
      case 'Escape':
        setFilteredCompositions([]);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className={className}>
      {showComposerSelect && (
        <div className={`${showLabels ? "mb-4" : ""} flex-1`}>
          {showLabels && (
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              {t("composer")} <span className="text-red-500">*</span>
            </label>
          )}
          <div className="relative">
            <select
              value={selectedComposerId}
              onChange={(e) => handleComposerChange(parseInt(e.target.value))}
              disabled={disabled}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value={0}>{t("selectComposer")}</option>
              {composers.map((composer) => (
                <option key={composer.id} value={composer.id}>
                  {composer.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex-1">
        {showLabels && (
          <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
            {t("composition")} <span className="text-red-500">*</span>
          </label>
        )}
        {selectedCompositionId ? (
          <div className="flex items-center gap-2 p-2.5 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
            <span className="flex-1 text-sm text-gray-900 dark:text-white">
              {getCompositionTitle(selectedCompositionId)}
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="text-red-500 hover:text-red-600 font-bold text-xl leading-none flex-shrink-0"
              title={t("clearSelection")}
            >
              ×
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!selectedComposerId || disabled}
              placeholder={selectedComposerId ? (placeholder || t("artistSearchPlaceholder")) : t("selectComposer")}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilteredCompositions([]);
                  setHighlightedIndex(-1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-xl font-bold leading-none"
                title={t("cancelSearch")}
              >
                ×
              </button>
            )}
            {filteredCompositions.length > 0 && (
              <div className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {filteredCompositions.map((composition, index) => (
                  <button
                    key={composition.id}
                    type="button"
                    onClick={() => handleCompositionSelect(composition.id)}
                    className={`w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                      index === highlightedIndex
                        ? 'bg-brand-500 text-white dark:bg-brand-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {composition.catalog_number
                      ? `${composition.catalog_number} - ${composition.title}`
                      : composition.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
