"use client";

import React, { useState, useEffect } from "react";
import { Recording, Composer, Composition, Artist } from "@/lib/api";
import CompositionSearch from "@/components/common/CompositionSearch";
import CompositionDisplay from "@/components/common/CompositionDisplay";
import ArtistDisplay from "@/components/common/ArtistDisplay";
import { useLanguage } from "@/context/LanguageContext";

interface RecordingSearchProps {
  recordings: Recording[];
  composers: Composer[];
  compositions: Composition[];
  artists: Artist[];
  onRecordingAdd: (recordingId: number) => void;
  excludeRecordingIds?: number[];
}

export default function RecordingSearch({
  recordings,
  composers,
  compositions,
  artists,
  onRecordingAdd,
  excludeRecordingIds = [],
}: RecordingSearchProps) {
  const { t } = useLanguage();
  // 작곡 검색
  const [searchComposerId, setSearchComposerId] = useState<number>(0);
  const [searchCompositionId, setSearchCompositionId] = useState<number | undefined>(undefined);

  // 아티스트 검색
  const [searchArtistQuery, setSearchArtistQuery] = useState("");
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<number | undefined>(undefined);
  const [highlightedArtistIndex, setHighlightedArtistIndex] = useState<number>(-1);

  // 검색 결과
  const [availableRecordings, setAvailableRecordings] = useState<Recording[]>([]);

  // 아티스트 검색 필터링
  useEffect(() => {
    if (searchArtistQuery.trim()) {
      const filtered = artists.filter(artist =>
        artist.name.toLowerCase().includes(searchArtistQuery.toLowerCase())
      );
      setFilteredArtists(filtered);
      setHighlightedArtistIndex(-1);
    } else {
      setFilteredArtists([]);
      setHighlightedArtistIndex(-1);
    }
  }, [searchArtistQuery, artists]);

  // 녹음 검색 (작곡 AND 아티스트)
  useEffect(() => {
    let filtered = recordings.filter(r => !excludeRecordingIds.includes(r.id));

    // 작곡으로 필터링
    if (searchCompositionId) {
      filtered = filtered.filter(r => r.composition_id === searchCompositionId);
    }

    // 아티스트로 필터링
    if (selectedArtistId) {
      filtered = filtered.filter(r =>
        r.artists.some(a => a.id === selectedArtistId)
      );
    }

    setAvailableRecordings(filtered);
  }, [searchCompositionId, selectedArtistId, recordings, excludeRecordingIds]);

  const handleSearchCompositionSelect = (compositionId: number) => {
    setSearchCompositionId(compositionId);
  };

  const handleSearchComposerChange = (composerId: number) => {
    setSearchComposerId(composerId);
    setSearchCompositionId(undefined);
  };

  const handleSearchCompositionClear = () => {
    setSearchComposerId(0);
    setSearchCompositionId(undefined);
  };

  const handleArtistSelect = (artistId: number) => {
    setSelectedArtistId(artistId);
    const artist = artists.find(a => a.id === artistId);
    if (artist) {
      setSearchArtistQuery(artist.name);
    }
    setFilteredArtists([]);
  };

  const handleArtistClear = () => {
    setSelectedArtistId(undefined);
    setSearchArtistQuery("");
    setFilteredArtists([]);
  };

  const handleArtistKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredArtists.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedArtistIndex(prev =>
        prev < filteredArtists.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedArtistIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedArtistIndex >= 0 && highlightedArtistIndex < filteredArtists.length) {
        handleArtistSelect(filteredArtists[highlightedArtistIndex].id);
      }
    }
  };

  const showResults = searchCompositionId || selectedArtistId;

  return (
    <div className="mb-4 p-4 border border-gray-300 dark:border-gray-700 rounded-md">
      <div className="space-y-3">
        {/* 작곡 검색 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("composition")}
          </label>
          <CompositionSearch
            composers={composers}
            compositions={compositions}
            selectedComposerId={searchComposerId}
            selectedCompositionId={searchCompositionId}
            onComposerChange={handleSearchComposerChange}
            onCompositionSelect={handleSearchCompositionSelect}
            onClear={handleSearchCompositionClear}
            showLabels={false}
            className="flex items-center gap-4"
          />
        </div>

        {/* 아티스트 검색 */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("artists")}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchArtistQuery}
              onChange={(e) => setSearchArtistQuery(e.target.value)}
              onKeyDown={handleArtistKeyDown}
              placeholder={t("searchArtist")}
              className="flex-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
            {selectedArtistId && (
              <button
                type="button"
                onClick={handleArtistClear}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {t("clearSelection")}
              </button>
            )}
          </div>

          {filteredArtists.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredArtists.map((artist, index) => (
                <button
                  key={artist.id}
                  type="button"
                  onClick={() => handleArtistSelect(artist.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    index === highlightedArtistIndex
                      ? "bg-gray-100 dark:bg-gray-700"
                      : ""
                  }`}
                >
                  {artist.instrument ? `${artist.name} - ${artist.instrument}` : artist.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 검색 결과 */}
      {showResults && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {t("recordingsFound").replace("{count}", String(availableRecordings.length))}
          </p>
          {availableRecordings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{t("composer")}</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{t("composition")}</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{t("year")}</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{t("artists")}</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {availableRecordings.map(recording => {
                    const composition = compositions.find(c => c.id === recording.composition_id);
                    if (!composition) return null;

                    const composer = composers.find(c => c.id === composition.composer_id);

                    return (
                      <tr key={recording.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-3 py-2 text-gray-900 dark:text-white">
                          {composer?.name || '-'}
                        </td>
                        <td className="px-3 py-2">
                          <CompositionDisplay composition={composition} />
                        </td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">
                          {recording.year || '-'}
                        </td>
                        <td className="px-3 py-2">
                          {recording.artists.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {recording.artists.map((artist) => (
                                <ArtistDisplay key={artist.id} artist={artist} />
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-900 dark:text-white">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => onRecordingAdd(recording.id)}
                            className="px-2 py-1 bg-brand-500 text-white rounded hover:bg-brand-600 text-xs"
                          >
                            {t("add")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
