"use client";

import { useState, useEffect } from "react";
import { apiClient, Album, AlbumCreate, Recording } from "@/lib/api";
import { PlusIcon, PencilIcon, TrashBinIcon, CloseIcon, SearchIcon } from "@/icons/index";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlbumType, setSelectedAlbumType] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState<AlbumCreate>({
    title: "",
    album_type: "LP",
    recording_ids: [],
    image_urls: [],
    primary_image_index: null,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [albumsData, recordingsData] = await Promise.all([
        apiClient.getAlbums(0, 1000),
        apiClient.getRecordings(0, 1000),
      ]);

      setAlbums(albumsData);
      setRecordings(recordingsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadAlbums = async (albumType?: string, searchTerm?: string) => {
    try {
      const data = await apiClient.getAlbums(0, 1000, albumType, searchTerm);
      setAlbums(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load albums");
    }
  };

  const handleSearch = async () => {
    await loadAlbums(selectedAlbumType, searchQuery.trim() || undefined);
  };

  const handleAlbumTypeFilter = async (albumType: string | undefined) => {
    setSelectedAlbumType(albumType);
    await loadAlbums(albumType, searchQuery.trim() || undefined);
  };

  const getRecordingDisplay = (recordingId: number): string => {
    const recording = recordings.find(r => r.id === recordingId);
    if (!recording) return "Unknown";

    const composition = recording.composition_id;
    const artists = recording.artists.map(a => a.name).join(", ");
    return `${artists || "Unknown Artist"}`;
  };

  const getPrimaryImage = (album: Album): string | null => {
    const primaryImg = album.images.find(img => img.is_primary === 1);
    return primaryImg ? primaryImg.image_url : (album.images[0]?.image_url || null);
  };

  const handleOpenModal = (album?: Album) => {
    if (album) {
      setEditingAlbum(album);
      setFormData({
        title: album.title,
        album_type: album.album_type,
        recording_ids: album.recordings.map(r => r.id),
        image_urls: album.images.map(img => img.image_url),
        primary_image_index: album.images.findIndex(img => img.is_primary === 1),
      });
    } else {
      setEditingAlbum(null);
      setFormData({
        title: "",
        album_type: "LP",
        recording_ids: [],
        image_urls: [],
        primary_image_index: null,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAlbum(null);
    setFormData({
      title: "",
      album_type: "LP",
      recording_ids: [],
      image_urls: [],
      primary_image_index: null,
    });
    setUploading(false);
  };

  const handleRecordingToggle = (recordingId: number) => {
    setFormData(prev => ({
      ...prev,
      recording_ids: prev.recording_ids.includes(recordingId)
        ? prev.recording_ids.filter(id => id !== recordingId)
        : [...prev.recording_ids, recordingId]
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => {
        // For now, we'll just use local file URLs
        // In production, you'd upload to your server
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });

      const imageUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, ...imageUrls]
      }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index),
      primary_image_index: prev.primary_image_index === index
        ? null
        : (prev.primary_image_index !== null && prev.primary_image_index > index
          ? prev.primary_image_index - 1
          : prev.primary_image_index)
    }));
  };

  const handleSetPrimaryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      primary_image_index: index
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.recording_ids.length === 0) {
      setError("Please select at least one recording");
      return;
    }

    try {
      const data = {
        title: formData.title,
        album_type: formData.album_type,
        recording_ids: formData.recording_ids,
        image_urls: formData.image_urls,
        primary_image_index: formData.primary_image_index,
      };

      if (editingAlbum) {
        await apiClient.updateAlbum(editingAlbum.id, data);
      } else {
        await apiClient.createAlbum(data);
      }

      await loadAlbums(selectedAlbumType);
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save album");
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await apiClient.deleteAlbum(id);
      await loadAlbums(selectedAlbumType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete album");
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
      <PageBreadcrumb pageTitle="Albums" />

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
                  value={selectedAlbumType || ""}
                  onChange={(e) => handleAlbumTypeFilter(e.target.value || undefined)}
                  className="min-w-[150px] rounded-md border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none cursor-pointer"
                >
                  <option value="">All types</option>
                  <option value="LP">LP</option>
                  <option value="CD">CD</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <div className="relative w-80">
                <button
                  onClick={handleSearch}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-500 transition-colors"
                  title="Search"
                >
                  <SearchIcon className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="w-full rounded-full border border-gray-300 bg-white pl-12 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-600 whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4" />
              Add Album
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
                  Cover
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  Title
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  Type
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  Recordings
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {albums.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400"
                  >
                    {searchQuery || selectedAlbumType
                      ? "No albums found matching your criteria."
                      : "No albums found. Click \"Add Album\" to create one."}
                  </td>
                </tr>
              ) : (
                albums.map((album) => (
                  <tr
                    key={album.id}
                    className="border-b border-gray-200 dark:border-gray-800"
                  >
                    <td className="px-4 py-3">
                      <div className="w-16 h-16 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                        {getPrimaryImage(album) ? (
                          <img
                            src={getPrimaryImage(album)!}
                            alt={album.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                      {album.title}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        album.album_type === 'LP'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {album.album_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {album.recordings.length} recording{album.recordings.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 w-32">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(album)}
                          className="rounded p-2.5 text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(album.id, album.title)}
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900 my-8 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 pb-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingAlbum ? "Edit Album" : "Add Album"}
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
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., Beethoven: Complete Piano Sonatas"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.album_type}
                  onChange={(e) =>
                    setFormData({ ...formData, album_type: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="LP">LP</option>
                  <option value="CD">CD</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Cover Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="w-full text-sm text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-500 file:text-white hover:file:bg-brand-600 file:cursor-pointer disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {uploading ? "Uploading..." : "Select one or more images"}
                </p>

                {formData.image_urls.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-3">
                    {formData.image_urls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className={`w-full h-24 object-cover rounded ${
                            formData.primary_image_index === index
                              ? 'ring-2 ring-brand-500'
                              : ''
                          }`}
                        />
                        <div className="absolute top-1 right-1 flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(index)}
                            className={`p-1 rounded text-xs ${
                              formData.primary_image_index === index
                                ? 'bg-brand-500 text-white'
                                : 'bg-white/80 text-gray-700 hover:bg-white'
                            }`}
                            title="Set as primary"
                          >
                            ★
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Recordings <span className="text-red-500">*</span>
                </label>
                <div className="max-h-60 overflow-y-auto rounded-md border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                  {recordings.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No recordings available</p>
                  ) : (
                    <div className="space-y-2">
                      {recordings.map((recording) => (
                        <label
                          key={recording.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.recording_ids.includes(recording.id)}
                            onChange={() => handleRecordingToggle(recording.id)}
                            className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {getRecordingDisplay(recording.id)}
                            {recording.year && (
                              <span className="text-gray-500 dark:text-gray-400"> ({recording.year})</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.recording_ids.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formData.recording_ids.length} recording{formData.recording_ids.length !== 1 ? 's' : ''} selected
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
                  {editingAlbum ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
