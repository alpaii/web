"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient, Recording, RecordingCreate, Composition, Artist, Composer, Album } from "@/lib/api";
import { PlusIcon, PencilIcon, TrashBinIcon, CloseIcon } from "@/icons/index";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import CompositionSearch from "@/components/common/CompositionSearch";
import ErrorAlert from "@/components/common/ErrorAlert";
import ArtistDisplay from "@/components/common/ArtistDisplay";
import CompositionDisplay from "@/components/common/CompositionDisplay";
import { useLanguage } from "@/context/LanguageContext";

const STORAGE_KEY = 'recordings_page_state';

interface PageState {
  selectedCompositionId?: number;
  filterComposerId: number;
  filterSelectedArtistId?: number;
  recordings: Recording[];
}

export default function RecordingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [composers, setComposers] = useState<Composer[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecording, setEditingRecording] = useState<Recording | null>(null);

  // Filter state
  const [selectedCompositionId, setSelectedCompositionId] = useState<number | undefined>(undefined);
  const [filterComposerId, setFilterComposerId] = useState<number>(0);
  const [filterArtistSearchQuery, setFilterArtistSearchQuery] = useState("");
  const [filterFilteredArtists, setFilterFilteredArtists] = useState<Artist[]>([]);
  const [filterSelectedArtistId, setFilterSelectedArtistId] = useState<number | undefined>(undefined);
  const [filterHighlightedArtistIndex, setFilterHighlightedArtistIndex] = useState<number>(-1);

  // Modal state
  const [modalComposerId, setModalComposerId] = useState<number>(0);
  const [formData, setFormData] = useState<RecordingCreate>({
    composition_id: 0,
    year: null,
    artist_ids: [],
  });

  // Artist search state
  const [artistSearchQuery, setArtistSearchQuery] = useState("");
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [highlightedArtistIndex, setHighlightedArtistIndex] = useState<number>(-1);

  // 페이지 상태를 localStorage에 저장
  const savePageState = (state: PageState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save page state:', err);
    }
  };

  // localStorage에서 페이지 상태 복원
  const loadPageState = (): PageState | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.error('Failed to load page state:', err);
      return null;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // compositions와 artists가 로드된 후 저장된 상태 복원
    if (compositions.length === 0 || artists.length === 0) return;

    const savedState = loadPageState();
    if (savedState) {
      setSelectedCompositionId(savedState.selectedCompositionId);
      setFilterComposerId(savedState.filterComposerId);
      setFilterSelectedArtistId(savedState.filterSelectedArtistId);
      setRecordings(savedState.recordings);
      setLoading(false);
    }
  }, [compositions, artists]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [composersData, artistsData, albumsData] = await Promise.all([
        apiClient.getComposers(0, 100),
        apiClient.getArtists(0, 100),
        apiClient.getAlbums(0, 1000),
      ]);

      const sortedComposers = composersData.sort((a, b) => a.name.localeCompare(b.name));
      setComposers(sortedComposers);
      setArtists(artistsData);
      setAlbums(albumsData);
      setRecordings([]);

      // Load all compositions
      const compositionsData = await apiClient.getCompositions(0, 1000);
      setCompositions(compositionsData);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorLoadingRecordings"));
    } finally {
      setLoading(false);
    }
  };

  const loadRecordings = async (compositionId?: number, composerId?: number, artistId?: number) => {
    // Only load if composition, composer, or artist is selected
    if (!compositionId && !composerId && !artistId) {
      setRecordings([]);
      savePageState({
        selectedCompositionId: undefined,
        filterComposerId: composerId || 0,
        filterSelectedArtistId: undefined,
        recordings: []
      });
      return;
    }

    try {
      const data = await apiClient.getRecordings(0, 1000, compositionId, composerId, artistId);
      setRecordings(data);
      setError(null);

      // 상태 저장
      savePageState({
        selectedCompositionId: compositionId,
        filterComposerId: composerId || filterComposerId,
        filterSelectedArtistId: artistId,
        recordings: data
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorLoadingRecordings"));
    }
  };

  const handleFilterComposerChange = (composerId: number) => {
    setFilterComposerId(composerId);
    setSelectedCompositionId(undefined);

    // Reload with composer and artist filter if artist is selected
    if (composerId && filterSelectedArtistId) {
      loadRecordings(undefined, composerId, filterSelectedArtistId);
    } else if (filterSelectedArtistId) {
      loadRecordings(undefined, undefined, filterSelectedArtistId);
    } else {
      setRecordings([]);
      savePageState({
        selectedCompositionId: undefined,
        filterComposerId: composerId,
        filterSelectedArtistId: undefined,
        recordings: []
      });
    }
  };

  const handleFilterCompositionSelect = (compositionId: number) => {
    setSelectedCompositionId(compositionId);
    // When composition is selected, don't use composer filter (composition is more specific)
    loadRecordings(compositionId, undefined, filterSelectedArtistId);
  };

  const handleFilterClear = () => {
    setSelectedCompositionId(undefined);

    // Reload with composer and artist filter if available
    if (filterComposerId && filterSelectedArtistId) {
      loadRecordings(undefined, filterComposerId, filterSelectedArtistId);
    } else if (filterSelectedArtistId) {
      loadRecordings(undefined, undefined, filterSelectedArtistId);
    } else {
      setRecordings([]);
      savePageState({
        selectedCompositionId: undefined,
        filterComposerId: filterComposerId,
        filterSelectedArtistId: undefined,
        recordings: []
      });
    }
  };

  const handleFilterArtistSearchChange = (query: string) => {
    setFilterArtistSearchQuery(query);
    setFilterHighlightedArtistIndex(-1);

    if (!query.trim() || query.trim().length < 2) {
      setFilterFilteredArtists([]);
      return;
    }

    const searchText = query.toLowerCase();
    const filtered = artists.filter(artist => {
      const nameMatch = artist.name.toLowerCase().includes(searchText);
      const instrumentMatch = artist.instrument?.toLowerCase().includes(searchText);
      return nameMatch || instrumentMatch;
    });
    setFilterFilteredArtists(filtered);
  };

  const handleFilterArtistSelect = (artistId: number) => {
    setFilterSelectedArtistId(artistId);
    setFilterArtistSearchQuery("");
    setFilterFilteredArtists([]);
    setFilterHighlightedArtistIndex(-1);

    // Load recordings with composition/composer and artist filters
    if (selectedCompositionId) {
      loadRecordings(selectedCompositionId, undefined, artistId);
    } else if (filterComposerId) {
      loadRecordings(undefined, filterComposerId, artistId);
    } else {
      loadRecordings(undefined, undefined, artistId);
    }
  };

  const handleFilterArtistClear = () => {
    setFilterSelectedArtistId(undefined);
    setFilterArtistSearchQuery("");
    setFilterFilteredArtists([]);
    setFilterHighlightedArtistIndex(-1);

    // Reload with only composition or composer filter if exists, otherwise clear
    if (selectedCompositionId) {
      loadRecordings(selectedCompositionId, undefined, undefined);
    } else {
      setRecordings([]);
      savePageState({
        selectedCompositionId: undefined,
        filterComposerId: filterComposerId,
        filterSelectedArtistId: undefined,
        recordings: []
      });
    }
  };

  const handleFilterArtistKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filterFilteredArtists.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFilterHighlightedArtistIndex(prev =>
          prev < filterFilteredArtists.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFilterHighlightedArtistIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (filterHighlightedArtistIndex >= 0 && filterHighlightedArtistIndex < filterFilteredArtists.length) {
          handleFilterArtistSelect(filterFilteredArtists[filterHighlightedArtistIndex].id);
        }
        break;
      case 'Escape':
        setFilterFilteredArtists([]);
        setFilterHighlightedArtistIndex(-1);
        break;
    }
  };

  const getArtistName = (artistId: number): string => {
    const artist = artists.find(a => a.id === artistId);
    if (!artist) return "-";
    return artist.instrument ? `${artist.name} - ${artist.instrument}` : artist.name;
  };

  const getAlbumCount = (recordingId: number): number => {
    return albums.filter(album =>
      album.recordings.some(rec => rec.id === recordingId)
    ).length;
  };

  const handleAlbumClick = async (recordingId: number) => {
    try {
      // 앨범 데이터를 미리 로드하고 앨범 페이지의 localStorage에 저장
      const albumsData = await apiClient.getAlbums(0, 1000);
      const pageState = {
        selectedRecordingId: recordingId,
        albums: albumsData
      };
      localStorage.setItem('albums_page_state', JSON.stringify(pageState));

      // 앨범 페이지로 이동
      router.push(`/classical-albums/albums`);
    } catch (err) {
      console.error('Failed to load albums:', err);
      // 에러가 발생해도 페이지는 이동
      router.push(`/classical-albums/albums`);
    }
  };

  const getComposerName = (compositionId: number): string => {
    const composition = compositions.find(c => c.id === compositionId);
    if (!composition) return "-";
    const composer = composers.find(c => c.id === composition.composer_id);
    return composer?.name || "-";
  };

  const getCompositionDisplay = (compositionId: number): { title: string; catalogNumber: string | null } => {
    const composition = compositions.find(c => c.id === compositionId);
    if (!composition) return { title: "-", catalogNumber: null };
    return {
      title: composition.title,
      catalogNumber: composition.catalog_number || null
    };
  };

  const handleOpenModal = (recording?: Recording) => {
    if (recording) {
      setEditingRecording(recording);
      const composition = compositions.find(c => c.id === recording.composition_id);
      if (composition) {
        setModalComposerId(composition.composer_id);
      }
      setFormData({
        composition_id: recording.composition_id,
        year: recording.year,
        artist_ids: recording.artists.map(a => a.id),
      });
      setSelectedArtists(recording.artists);
    } else {
      setEditingRecording(null);
      setModalComposerId(0);
      setFormData({
        composition_id: 0,
        year: null,
        artist_ids: [],
      });
      setSelectedArtists([]);
    }
    setArtistSearchQuery("");
    setFilteredArtists([]);
    setHighlightedArtistIndex(-1);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecording(null);
    setModalComposerId(0);
    setFormData({
      composition_id: 0,
      year: null,
      artist_ids: [],
    });
    setSelectedArtists([]);
    setArtistSearchQuery("");
    setFilteredArtists([]);
    setHighlightedArtistIndex(-1);
  };

  const handleModalComposerChange = (composerId: number) => {
    setModalComposerId(composerId);
    setFormData(prev => ({ ...prev, composition_id: 0 }));
  };

  const handleModalCompositionSelect = (compositionId: number) => {
    setFormData(prev => ({ ...prev, composition_id: compositionId }));
  };

  const handleModalCompositionClear = () => {
    setFormData(prev => ({ ...prev, composition_id: 0 }));
  };

  const handleArtistSearchChange = (query: string) => {
    setArtistSearchQuery(query);
    setHighlightedArtistIndex(-1);

    if (!query.trim() || query.trim().length < 2) {
      setFilteredArtists([]);
      return;
    }

    const searchText = query.toLowerCase();
    const filtered = artists.filter(artist => {
      const nameMatch = artist.name.toLowerCase().includes(searchText);
      const instrumentMatch = artist.instrument?.toLowerCase().includes(searchText);
      const isNotSelected = !selectedArtists.some(a => a.id === artist.id);
      return (nameMatch || instrumentMatch) && isNotSelected;
    });
    setFilteredArtists(filtered);
  };

  const handleArtistSelect = (artist: Artist) => {
    const newSelectedArtists = [...selectedArtists, artist];
    setSelectedArtists(newSelectedArtists);
    setFormData(prev => ({
      ...prev,
      artist_ids: newSelectedArtists.map(a => a.id)
    }));
    setArtistSearchQuery("");
    setFilteredArtists([]);
    setHighlightedArtistIndex(-1);
  };

  const handleArtistKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredArtists.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedArtistIndex(prev =>
          prev < filteredArtists.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedArtistIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedArtistIndex >= 0 && highlightedArtistIndex < filteredArtists.length) {
          handleArtistSelect(filteredArtists[highlightedArtistIndex]);
        }
        break;
      case 'Escape':
        setFilteredArtists([]);
        setHighlightedArtistIndex(-1);
        break;
    }
  };

  const handleArtistRemove = (artistId: number) => {
    const newSelectedArtists = selectedArtists.filter(a => a.id !== artistId);
    setSelectedArtists(newSelectedArtists);
    setFormData(prev => ({
      ...prev,
      artist_ids: newSelectedArtists.map(a => a.id)
    }));
  };

  const handleArtistReorder = (fromIndex: number, toIndex: number) => {
    const newSelectedArtists = [...selectedArtists];
    const [movedArtist] = newSelectedArtists.splice(fromIndex, 1);
    newSelectedArtists.splice(toIndex, 0, movedArtist);
    setSelectedArtists(newSelectedArtists);
    setFormData(prev => ({
      ...prev,
      artist_ids: newSelectedArtists.map(a => a.id)
    }));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== toIndex) {
      handleArtistReorder(fromIndex, toIndex);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.artist_ids.length === 0) {
      setError(t("errorSelectAtLeastOneArtist"));
      return;
    }

    try {
      const data = {
        composition_id: formData.composition_id,
        year: formData.year,
        artist_ids: formData.artist_ids,
      };

      if (editingRecording) {
        await apiClient.updateRecording(editingRecording.id, data);
      } else {
        await apiClient.createRecording(data);
      }

      await loadRecordings(selectedCompositionId, selectedCompositionId ? undefined : filterComposerId, filterSelectedArtistId);
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSavingRecording"));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("deleteRecordingConfirm"))) {
      return;
    }

    try {
      await apiClient.deleteRecording(id);
      await loadRecordings(selectedCompositionId, selectedCompositionId ? undefined : filterComposerId, filterSelectedArtistId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorDeletingRecording"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={t("recordings")} />

      {/* Error Message */}
      <ErrorAlert message={error} onClose={() => setError(null)} />

      <ComponentCard
        title=""
        headerAction={
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-4 flex-[2]">
              <CompositionSearch
                composers={composers}
                compositions={compositions}
                selectedComposerId={filterComposerId}
                selectedCompositionId={selectedCompositionId}
                onComposerChange={handleFilterComposerChange}
                onCompositionSelect={handleFilterCompositionSelect}
                onClear={handleFilterClear}
                showComposerSelect={true}
                showLabels={false}
                className="flex items-center gap-4 flex-1"
              />

              {/* Artist Search */}
              <div className="relative w-[280px]">
                {filterSelectedArtistId ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                    <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">
                      {getArtistName(filterSelectedArtistId)}
                    </span>
                    <button
                      type="button"
                      onClick={handleFilterArtistClear}
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
                      value={filterArtistSearchQuery}
                      onChange={(e) => handleFilterArtistSearchChange(e.target.value)}
                      onKeyDown={handleFilterArtistKeyDown}
                      placeholder={t("searchArtist")}
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    {filterArtistSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterArtistSearchQuery("");
                          setFilterFilteredArtists([]);
                          setFilterHighlightedArtistIndex(-1);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-xl font-bold leading-none"
                        title={t("cancelSearch")}
                      >
                        ×
                      </button>
                    )}
                    {filterFilteredArtists.length > 0 && (
                      <div className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                        {filterFilteredArtists.map((artist, index) => (
                          <button
                            key={artist.id}
                            type="button"
                            onClick={() => handleFilterArtistSelect(artist.id)}
                            className={`w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                              index === filterHighlightedArtistIndex
                                ? 'bg-brand-500 text-white dark:bg-brand-600'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {artist.name}
                            {artist.instrument && (
                              <span className={index === filterHighlightedArtistIndex ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}> - {artist.instrument}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-600 whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4" />
              {t("addRecording")}
            </button>
          </div>
        }
      >
        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left dark:border-gray-800 dark:bg-gray-800">
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  {t("composer")}
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  {t("composition")}
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 text-center">
                  {t("year")}
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  {t("artists")}
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 text-center">
                  {t("albums")}
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 w-32 text-center">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {recordings.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400"
                  >
                    {selectedCompositionId || filterSelectedArtistId
                      ? t("noRecordingsWithFilter")
                      : t("selectCompositionOrArtistToViewRecordings")}
                  </td>
                </tr>
              ) : (
                recordings.map((recording) => (
                  <tr
                    key={recording.id}
                    className="border-b border-gray-200 dark:border-gray-800"
                  >
                    <td className="px-4 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                      {getComposerName(recording.composition_id)}
                    </td>
                    <td className="px-4 py-3">
                      <CompositionDisplay composition={getCompositionDisplay(recording.composition_id)} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400 text-center">
                      {recording.year || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {recording.artists.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {recording.artists.map((artist) => (
                            <ArtistDisplay key={artist.id} artist={artist} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-theme-sm dark:text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleAlbumClick(recording.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer transition-colors"
                        title={`View albums with this recording`}
                        style={{ fontFamily: 'monospace' }}
                      >
                        {getAlbumCount(recording.id)}
                      </button>
                    </td>
                    <td className="px-4 py-3 w-32">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(recording)}
                          className="rounded p-2.5 text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title={t("edit")}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(recording.id)}
                          className="rounded p-2.5 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title={t("delete")}
                        >
                          <TrashBinIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ComponentCard>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingRecording ? t("editRecording") : t("addRecording")}
              </h3>
              <button
                onClick={handleCloseModal}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <CompositionSearch
                composers={composers}
                compositions={compositions}
                selectedComposerId={modalComposerId}
                selectedCompositionId={formData.composition_id > 0 ? formData.composition_id : undefined}
                onComposerChange={handleModalComposerChange}
                onCompositionSelect={handleModalCompositionSelect}
                onClear={handleModalCompositionClear}
                showComposerSelect={true}
                placeholder={t("artistSearchPlaceholder")}
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  {t("year")}
                </label>
                <input
                  type="number"
                  value={formData.year || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      year: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  {t("artists")} <span className="text-red-500">*</span>
                </label>

                {/* Artist Search Input */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={artistSearchQuery}
                    onChange={(e) => handleArtistSearchChange(e.target.value)}
                    onKeyDown={handleArtistKeyDown}
                    placeholder={t("artistSearchPlaceholder")}
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  {artistSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setArtistSearchQuery("");
                        setFilteredArtists([]);
                        setHighlightedArtistIndex(-1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-xl font-bold leading-none"
                      title={t("cancelSearch")}
                    >
                      ×
                    </button>
                  )}
                  {filteredArtists.length > 0 && (
                    <div className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      {filteredArtists.map((artist, index) => (
                        <button
                          key={artist.id}
                          type="button"
                          onClick={() => handleArtistSelect(artist)}
                          className={`w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                            index === highlightedArtistIndex
                              ? 'bg-brand-500 text-white dark:bg-brand-600'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {artist.name}
                          {artist.instrument && (
                            <span className={index === highlightedArtistIndex ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}> - {artist.instrument}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected count message */}
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("artistsSelected").replace("{count}", String(selectedArtists.length))}
                </p>

                {/* Selected Artists List */}
                {selectedArtists.length > 0 && (
                  <div className="space-y-2">
                    {selectedArtists.map((artist, index) => (
                      <div
                        key={artist.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 cursor-move hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-gray-400 dark:text-gray-500 text-xs font-mono">
                            {index + 1}.
                          </span>
                          <div className="flex-1">
                            <ArtistDisplay artist={artist} />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleArtistRemove(artist.id)}
                          className="text-red-500 hover:text-red-600 font-bold text-xl leading-none"
                          title={t("clearSelection")}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
                >
                  {editingRecording ? t("edit") : t("add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
