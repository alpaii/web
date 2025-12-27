"use client";

import { useState, useEffect, Fragment } from "react";
import Image from "next/image";
import { apiClient, Album, AlbumCreate, Recording, Composer, Composition } from "@/lib/api";
import { PlusIcon, PencilIcon, TrashBinIcon, CloseIcon, SearchIcon } from "@/icons/index";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import CompositionSearch from "@/components/common/CompositionSearch";

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [composers, setComposers] = useState<Composer[]>([]);
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  // Filter state
  const [selectedCompositionId, setSelectedCompositionId] = useState<number | undefined>(undefined);
  const [filterComposerId, setFilterComposerId] = useState<number>(0);
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
      const [recordingsData, composersData, compositionsData] = await Promise.all([
        apiClient.getRecordings(0, 1000),
        apiClient.getComposers(0, 1000),
        apiClient.getCompositions(0, 1000),
      ]);

      const sortedComposers = composersData.sort((a, b) => a.name.localeCompare(b.name));
      setAlbums([]);
      setRecordings(recordingsData);
      setComposers(sortedComposers);
      setCompositions(compositionsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterComposerChange = (composerId: number) => {
    setFilterComposerId(composerId);
    setSelectedCompositionId(undefined);
  };

  const handleFilterCompositionSelect = async (compositionId: number) => {
    setSelectedCompositionId(compositionId);

    try {
      const albumsData = await apiClient.getAlbums(0, 1000);
      setAlbums(albumsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "앨범 목록을 불러오는데 실패했습니다");
    }
  };

  const handleFilterClear = () => {
    setFilterComposerId(0);
    setSelectedCompositionId(undefined);
    setAlbums([]);
  };

  const getRecordingDisplay = (recordingId: number): string => {
    const recording = recordings.find(r => r.id === recordingId);
    if (!recording) return "-";

    const composition = recording.composition_id;
    const artists = recording.artists.map(a => a.name).join(", ");
    return `${artists || "-"}`;
  };

  const getComposerName = (compositionId: number): string => {
    const composition = compositions.find(c => c.id === compositionId);
    if (!composition) return "-";
    const composer = composers.find(c => c.id === composition.composer_id);
    return composer?.name || "-";
  };

  const getCompositionTitle = (compositionId: number): string => {
    const composition = compositions.find(c => c.id === compositionId);
    if (!composition) return "-";
    return composition.catalog_number
      ? `${composition.catalog_number} - ${composition.title}`
      : composition.title;
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
        image_urls: [...(prev.image_urls || []), ...imageUrls]
      }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      image_urls: (prev.image_urls || []).filter((_, i) => i !== index),
      primary_image_index: prev.primary_image_index === index
        ? null
        : (prev.primary_image_index !== null && prev.primary_image_index !== undefined && prev.primary_image_index > index
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
      setError("최소 한 개의 녹음을 선택해주세요");
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

      if (selectedCompositionId) {
        const albumsData = await apiClient.getAlbums(0, 1000);
        setAlbums(albumsData);
      }
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "앨범 저장에 실패했습니다");
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`"${title}"을(를) 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await apiClient.deleteAlbum(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "앨범 삭제에 실패했습니다");
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
      <PageBreadcrumb pageTitle="앨범" />

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
          <div className="flex items-start justify-between gap-3">
            <p className="flex-1">
              <span className="font-semibold">오류:</span> {error}
            </p>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 rounded-md px-2 py-1 bg-red-200 text-red-700 hover:bg-red-300 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700 transition-colors font-bold text-lg leading-none"
              title="닫기"
              aria-label="오류 메시지 닫기"
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
              className="flex items-center gap-4"
            />
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-600 whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4" />
              앨범 추가
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
                  앨범
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  작곡가
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  작곡
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  녹음년도
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  아티스트
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 w-32">
                  작업
                </th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredAlbums = selectedCompositionId
                  ? albums.filter(album =>
                      album.recordings.some(rec => rec.composition_id === selectedCompositionId)
                    )
                  : albums;

                return filteredAlbums.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400"
                    >
                      {selectedCompositionId
                        ? "선택한 작곡이 포함된 앨범이 없습니다."
                        : "작곡가와 작곡을 선택하면 앨범을 볼 수 있습니다."}
                    </td>
                  </tr>
                ) : (
                  filteredAlbums.map((album) => (
                    <Fragment key={album.id}>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <td className="px-4 py-3" rowSpan={Math.max(1, album.recordings.length)}>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            album.album_type === 'LP'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {album.album_type}
                          </span>
                          <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                            {getPrimaryImage(album) ? (
                              <Image
                                src={getPrimaryImage(album)!}
                                alt={album.title}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <span className="text-gray-800 text-theme-sm dark:text-white/90">
                            {album.title}
                          </span>
                        </div>
                      </td>
                      {album.recordings.length === 0 ? (
                        <>
                          <td className="px-4 py-3 text-gray-400 dark:text-gray-500 italic text-theme-sm" colSpan={4}>
                            녹음 없음
                          </td>
                          <td className="px-4 py-3 w-32" rowSpan={Math.max(1, album.recordings.length)}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenModal(album)}
                                className="rounded p-2.5 text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="수정"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(album.id, album.title)}
                                className="rounded p-2.5 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="삭제"
                              >
                                <TrashBinIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-gray-600 text-theme-sm dark:text-gray-400">
                            {getComposerName(album.recordings[0].composition_id)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-theme-sm dark:text-gray-400">
                            {getCompositionTitle(album.recordings[0].composition_id)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-theme-sm dark:text-gray-400">
                            {album.recordings[0].year || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-theme-sm dark:text-gray-400">
                            <div className="space-y-1">
                              {album.recordings[0].artists.map(artist => (
                                <div key={artist.id}>
                                  {artist.name}
                                  {artist.instrument && (
                                    <span className="text-gray-500 dark:text-gray-500"> - {artist.instrument}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 w-32" rowSpan={Math.max(1, album.recordings.length)}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenModal(album)}
                                className="rounded p-2.5 text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="수정"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(album.id, album.title)}
                                className="rounded p-2.5 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="삭제"
                              >
                                <TrashBinIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                    {album.recordings.slice(1).map((recording) => (
                      <tr key={recording.id} className="border-b border-gray-200 dark:border-gray-800">
                        <td className="px-4 py-3 text-gray-600 text-theme-sm dark:text-gray-400">
                          {getComposerName(recording.composition_id)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-theme-sm dark:text-gray-400">
                          {getCompositionTitle(recording.composition_id)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-theme-sm dark:text-gray-400">
                          {recording.year || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-theme-sm dark:text-gray-400">
                          <div className="space-y-1">
                            {recording.artists.map(artist => (
                              <div key={artist.id}>
                                {artist.name}
                                {artist.instrument && (
                                  <span className="text-gray-500 dark:text-gray-500"> - {artist.instrument}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                    </Fragment>
                  ))
                );
              })()}
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
                {editingAlbum ? "앨범 수정" : "앨범 추가"}
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
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="예: 베토벤: 피아노 소나타 전곡"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  유형 <span className="text-red-500">*</span>
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
                  커버 이미지
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
                  {uploading ? "업로드 중..." : "하나 이상의 이미지를 선택하세요"}
                </p>

                {formData.image_urls && formData.image_urls.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-3">
                    {formData.image_urls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className={`relative w-full h-24 rounded ${
                          formData.primary_image_index === index
                            ? 'ring-2 ring-brand-500'
                            : ''
                        }`}>
                          <Image
                            src={url}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover rounded"
                            sizes="(max-width: 768px) 25vw, 20vw"
                          />
                        </div>
                        <div className="absolute top-1 right-1 flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(index)}
                            className={`p-1 rounded text-xs ${
                              formData.primary_image_index === index
                                ? 'bg-brand-500 text-white'
                                : 'bg-white/80 text-gray-700 hover:bg-white'
                            }`}
                            title="대표 이미지로 설정"
                          >
                            ★
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            title="제거"
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
                  녹음 <span className="text-red-500">*</span>
                </label>
                <div className="max-h-60 overflow-y-auto rounded-md border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                  {recordings.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">녹음이 없습니다</p>
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
                    {formData.recording_ids.length}개 녹음 선택됨
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
                >
                  {editingAlbum ? "수정" : "추가"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
