"use client";

import { useState, useEffect } from "react";
import { apiClient, Recording, RecordingCreate, Composition, Artist, Composer } from "@/lib/api";
import { PlusIcon, PencilIcon, TrashBinIcon, CloseIcon, SearchIcon } from "@/icons/index";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [composers, setComposers] = useState<Composer[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecording, setEditingRecording] = useState<Recording | null>(null);
  const [selectedCompositionId, setSelectedCompositionId] = useState<number | undefined>(undefined);
  const [formData, setFormData] = useState<RecordingCreate>({
    composition_id: 0,
    year: null,
    artist_ids: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [composersData, artistsData, recordingsData] = await Promise.all([
        apiClient.getComposers(0, 100),
        apiClient.getArtists(0, 100),
        apiClient.getRecordings(0, 1000),
      ]);

      const sortedComposers = composersData.sort((a, b) => a.name.localeCompare(b.name));
      setComposers(sortedComposers);
      setArtists(artistsData);
      setRecordings(recordingsData);

      // Load all compositions
      const compositionsData = await apiClient.getCompositions(0, 1000);
      setCompositions(compositionsData);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadRecordings = async (compositionId?: number) => {
    try {
      const data = await apiClient.getRecordings(0, 1000, compositionId);
      setRecordings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recordings");
    }
  };

  const handleCompositionFilter = async (compositionId: number | undefined) => {
    setSelectedCompositionId(compositionId);
    await loadRecordings(compositionId);
  };

  const getComposerName = (compositionId: number): string => {
    const composition = compositions.find(c => c.id === compositionId);
    if (!composition) return "Unknown";
    const composer = composers.find(c => c.id === composition.composer_id);
    return composer?.name || "Unknown";
  };

  const getCompositionTitle = (compositionId: number): string => {
    const composition = compositions.find(c => c.id === compositionId);
    if (!composition) return "Unknown";
    return composition.catalog_number
      ? `${composition.catalog_number} - ${composition.title}`
      : composition.title;
  };

  const handleOpenModal = (recording?: Recording) => {
    if (recording) {
      setEditingRecording(recording);
      setFormData({
        composition_id: recording.composition_id,
        year: recording.year,
        artist_ids: recording.artists.map(a => a.id),
      });
    } else {
      setEditingRecording(null);
      setFormData({
        composition_id: selectedCompositionId || 0,
        year: null,
        artist_ids: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecording(null);
    setFormData({
      composition_id: 0,
      year: null,
      artist_ids: [],
    });
  };

  const handleArtistToggle = (artistId: number) => {
    setFormData(prev => ({
      ...prev,
      artist_ids: prev.artist_ids.includes(artistId)
        ? prev.artist_ids.filter(id => id !== artistId)
        : [...prev.artist_ids, artistId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.artist_ids.length === 0) {
      setError("Please select at least one artist");
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

      await loadRecordings(selectedCompositionId);
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recording");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this recording?")) {
      return;
    }

    try {
      await apiClient.deleteRecording(id);
      await loadRecordings(selectedCompositionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete recording");
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
      <PageBreadcrumb pageTitle="Recordings" />

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
          <div className="flex items-start justify-between gap-3">
            <p className="flex-1">
              <span className="font-semibold">Error:</span> {error}
            </p>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 rounded-md px-2 py-1 bg-red-200 text-red-700 hover:bg-red-300 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700 transition-colors font-bold text-lg leading-none"
              title="Close"
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <ComponentCard
        title=""
        headerAction={
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={selectedCompositionId || ""}
                  onChange={(e) => handleCompositionFilter(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="min-w-[300px] rounded-md border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none cursor-pointer"
                >
                  <option value="">All compositions</option>
                  {composers.map((composer) => {
                    const composerCompositions = compositions.filter(c => c.composer_id === composer.id);
                    if (composerCompositions.length === 0) return null;
                    return (
                      <optgroup key={composer.id} label={composer.name}>
                        {composerCompositions.map((composition) => (
                          <option key={composition.id} value={composition.id}>
                            {composition.catalog_number
                              ? `${composition.catalog_number} - ${composition.title}`
                              : composition.title}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-600 whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4" />
              Add Recording
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
                  Composer
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  Composition
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  Artists
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  Year
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {recordings.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400"
                  >
                    No recordings found. Click "Add Recording" to create one.
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
                    <td className="px-4 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                      {getCompositionTitle(recording.composition_id)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {recording.artists.map(a => a.name).join(", ") || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {recording.year || "-"}
                    </td>
                    <td className="px-4 py-3 w-32">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(recording)}
                          className="rounded p-2.5 text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(recording.id)}
                          className="rounded p-2.5 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Delete"
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
                {editingRecording ? "Edit Recording" : "Add Recording"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Composition <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.composition_id}
                  onChange={(e) =>
                    setFormData({ ...formData, composition_id: parseInt(e.target.value) })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value={0}>Select a composition</option>
                  {composers.map((composer) => {
                    const composerCompositions = compositions.filter(c => c.composer_id === composer.id);
                    if (composerCompositions.length === 0) return null;
                    return (
                      <optgroup key={composer.id} label={composer.name}>
                        {composerCompositions.map((composition) => (
                          <option key={composition.id} value={composition.id}>
                            {composition.catalog_number
                              ? `${composition.catalog_number} - ${composition.title}`
                              : composition.title}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Recording Year
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
                  placeholder="e.g., 1998"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Artists <span className="text-red-500">*</span>
                </label>
                <div className="max-h-60 overflow-y-auto rounded-md border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                  {artists.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No artists available</p>
                  ) : (
                    <div className="space-y-2">
                      {artists.map((artist) => (
                        <label
                          key={artist.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.artist_ids.includes(artist.id)}
                            onChange={() => handleArtistToggle(artist.id)}
                            className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {artist.name}
                            {artist.instrument && (
                              <span className="text-gray-500 dark:text-gray-400"> ({artist.instrument})</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.artist_ids.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formData.artist_ids.length} artist{formData.artist_ids.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
                >
                  {editingRecording ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
