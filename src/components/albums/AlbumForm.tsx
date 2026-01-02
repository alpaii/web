"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { apiClient, AlbumCreate, AlbumUpdate, Recording, Composer, Composition, Artist, Album, AlbumCustomUrlCreate } from "@/lib/api";
import ComponentCard from "@/components/common/ComponentCard";
import CompositionDisplay from "@/components/common/CompositionDisplay";
import ArtistDisplay from "@/components/common/ArtistDisplay";
import RecordingSearch from "@/components/common/RecordingSearch";
import { useLanguage } from "@/context/LanguageContext";

interface AlbumFormProps {
  mode: 'create' | 'edit';
  albumId?: number;
}

export default function AlbumForm({ mode, albumId }: AlbumFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Data
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [composers, setComposers] = useState<Composer[]>([]);
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  // Form data
  const [formData, setFormData] = useState<AlbumCreate | AlbumUpdate>({
    album_type: "",
    discogs_url: null,
    goclassic_url: null,
    memo: null,
    recording_ids: [],
    image_urls: [],
    primary_image_index: null,
    custom_urls: [],
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showCustomUrlForm, setShowCustomUrlForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      if (mode === 'edit' && albumId) {
        // Edit mode: load album data
        const [recordingsData, composersData, compositionsData, artistsData, albumData] = await Promise.all([
          apiClient.getRecordings(0, 1000),
          apiClient.getComposers(0, 1000),
          apiClient.getCompositions(0, 1000),
          apiClient.getArtists(0, 1000),
          apiClient.getAlbum(albumId),
        ]);

        const sortedComposers = composersData.sort((a, b) => a.name.localeCompare(b.name));
        setRecordings(recordingsData);
        setComposers(sortedComposers);
        setCompositions(compositionsData);
        setArtists(artistsData);

        // Pre-populate form with existing album data
        const types = albumData.album_type.split(',').map(t => t.trim()).filter(Boolean);
        setSelectedTypes(types);

        const imageUrls = albumData.images.map(img => img.image_url);
        const primaryIndex = albumData.images.findIndex(img => img.is_primary === 1);

        setFormData({
          album_type: albumData.album_type,
          discogs_url: albumData.discogs_url,
          goclassic_url: albumData.goclassic_url,
          memo: albumData.memo,
          recording_ids: albumData.recordings.map(r => r.id),
          image_urls: imageUrls,
          primary_image_index: primaryIndex >= 0 ? primaryIndex : null,
          custom_urls: albumData.custom_urls.map(cu => ({
            url_name: cu.url_name,
            url: cu.url,
            url_order: cu.url_order
          })),
        });
      } else {
        // Create mode: just load reference data
        const [recordingsData, composersData, compositionsData, artistsData] = await Promise.all([
          apiClient.getRecordings(0, 1000),
          apiClient.getComposers(0, 1000),
          apiClient.getCompositions(0, 1000),
          apiClient.getArtists(0, 1000),
        ]);

        const sortedComposers = composersData.sort((a, b) => a.name.localeCompare(b.name));
        setRecordings(recordingsData);
        setComposers(sortedComposers);
        setCompositions(compositionsData);
        setArtists(artistsData);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorLoadingData"));
    } finally {
      setLoading(false);
    }
  };

  const getRecordingDisplay = (recordingId: number): string => {
    const recording = recordings.find(r => r.id === recordingId);
    if (!recording) return "-";

    const composition = compositions.find(c => c.id === recording.composition_id);
    if (!composition) return "-";

    const composer = composers.find(c => c.id === composition.composer_id);
    const composerName = composer?.name || "-";
    const catalogNumber = composition.catalog_number || "";
    const title = composition.title;

    return `${composerName} - ${catalogNumber ? catalogNumber + " - " : ""}${title}`;
  };

  const handleTypeChange = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(newTypes);
    setFormData(prev => ({
      ...prev,
      album_type: newTypes.join(',')
    }));
  };

  const handleRecordingAdd = (recordingId: number) => {
    setFormData(prev => ({
      ...prev,
      recording_ids: (prev.recording_ids || []).includes(recordingId)
        ? prev.recording_ids
        : [...(prev.recording_ids || []), recordingId]
    }));
  };

  const handleRecordingRemove = (recordingId: number) => {
    setFormData(prev => ({
      ...prev,
      recording_ids: (prev.recording_ids || []).filter(id => id !== recordingId)
    }));
  };

  const handleRecordingDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleRecordingDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleRecordingDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));

    if (dragIndex === dropIndex) return;

    const newRecordingIds = [...(formData.recording_ids || [])];
    const [draggedId] = newRecordingIds.splice(dragIndex, 1);
    newRecordingIds.splice(dropIndex, 0, draggedId);

    setFormData(prev => ({
      ...prev,
      recording_ids: newRecordingIds
    }));
  };


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => {
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
      setError(err instanceof Error ? err.message : t("errorUploadFailed"));
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

  const handleAddCustomUrl = () => {
    setFormData(prev => ({
      ...prev,
      custom_urls: [
        ...(prev.custom_urls || []),
        { url_name: "", url: "", url_order: (prev.custom_urls || []).length }
      ]
    }));
    setShowCustomUrlForm(true);
  };

  const handleRemoveCustomUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      custom_urls: (prev.custom_urls || []).filter((_, i) => i !== index).map((cu, i) => ({
        ...cu,
        url_order: i
      }))
    }));
  };

  const handleCustomUrlChange = (index: number, field: 'url_name' | 'url', value: string) => {
    setFormData(prev => ({
      ...prev,
      custom_urls: (prev.custom_urls || []).map((cu, i) =>
        i === index ? { ...cu, [field]: value } : cu
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.album_type) {
      setError(t("errorSelectAlbumType"));
      return;
    }

    if (!formData.recording_ids || formData.recording_ids.length === 0) {
      setError(t("errorSelectAtLeastOneRecording"));
      return;
    }

    try {
      if (mode === 'edit' && albumId) {
        await apiClient.updateAlbum(albumId, formData);
      } else {
        await apiClient.createAlbum(formData as AlbumCreate);
      }
      router.push('/classical-albums/albums');
    } catch (err) {
      setError(err instanceof Error ? err.message : mode === 'edit' ? t("errorSavingAlbumEdit") : t("errorSavingAlbumCreate"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm underline hover:no-underline"
          >
            {t("close")}
          </button>
        </div>
      )}

      <ComponentCard title="">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 앨범 유형 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              {t("type")} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes('LP')}
                  onChange={() => handleTypeChange('LP')}
                  className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                />
                <span className="text-sm text-gray-900 dark:text-white">LP</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes('CD')}
                  onChange={() => handleTypeChange('CD')}
                  className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                />
                <span className="text-sm text-gray-900 dark:text-white">CD</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes('Roon')}
                  onChange={() => handleTypeChange('Roon')}
                  className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                />
                <span className="text-sm text-gray-900 dark:text-white">Roon</span>
              </label>
            </div>
          </div>

          {/* Discogs URL */}
          <div>
            <label htmlFor="discogs_url" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              Discogs URL
            </label>
            <input
              type="url"
              id="discogs_url"
              value={formData.discogs_url || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, discogs_url: e.target.value || null }))}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="https://www.discogs.com/..."
            />
          </div>

          {/* GoClassic URL */}
          <div>
            <label htmlFor="goclassic_url" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              GoClassic URL
            </label>
            <input
              type="url"
              id="goclassic_url"
              value={formData.goclassic_url || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, goclassic_url: e.target.value || null }))}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="https://www.goclassic.co.kr/..."
            />
          </div>

          {/* 사용자 URL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                {t("customUrls")}
              </label>
              <button
                type="button"
                onClick={handleAddCustomUrl}
                className="px-3 py-1 text-sm bg-brand-500 text-white rounded hover:bg-brand-600"
              >
                {t("addUrl")}
              </button>
            </div>

            <div className="p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 space-y-3">
              {formData.custom_urls && formData.custom_urls.length > 0 ? (
                formData.custom_urls.map((customUrl, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={customUrl.url_name}
                      onChange={(e) => handleCustomUrlChange(index, 'url_name', e.target.value)}
                      placeholder={t("urlNamePlaceholder")}
                      className="w-1/6 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none"
                    />
                    <input
                      type="url"
                      value={customUrl.url}
                      onChange={(e) => handleCustomUrlChange(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="flex-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomUrl(index)}
                      className="w-6 h-6 flex items-center justify-center border border-red-500 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-lg font-bold leading-none flex-shrink-0"
                      title={t("remove")}
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  {t("addUrlInstruction")}
                </div>
              )}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label htmlFor="memo" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              {t("memo")}
            </label>
            <textarea
              id="memo"
              value={formData.memo || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value || null }))}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder={t("memoPlaceholder")}
              rows={6}
            />
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              {t("coverImage")}
            </label>
            <div className="mb-3">
              <label
                htmlFor="album-image-upload"
                className={`inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? t("uploading") : t("uploadImage")}
              </label>
              <input
                id="album-image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {t("selectOneOrMoreImages")}
              </p>
            </div>

            {formData.image_urls && formData.image_urls.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.image_urls.map((url, index) => (
                  <div key={index} className="flex flex-col gap-1 items-center">
                    <div className={`relative w-16 h-16 rounded ${
                      formData.primary_image_index === index
                        ? 'ring-2 ring-brand-500'
                        : ''
                    }`}>
                      <Image
                        src={url}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover rounded"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(index)}
                        className={`w-5 h-5 p-0.5 rounded text-xs leading-none flex items-center justify-center ${
                          formData.primary_image_index === index
                            ? 'bg-brand-500 text-white'
                            : 'bg-white/80 text-gray-700 hover:bg-white border border-gray-300'
                        }`}
                        title={t("setPrimaryImage")}
                      >
                        ★
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="w-5 h-5 p-0.5 border border-red-500 text-red-500 rounded text-xs leading-none hover:bg-red-50 flex items-center justify-center"
                        title={t("remove")}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 녹음 선택 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              {t("selectRecordings")} <span className="text-red-500">*</span>
            </label>

            <RecordingSearch
              recordings={recordings}
              composers={composers}
              compositions={compositions}
              artists={artists}
              onRecordingAdd={handleRecordingAdd}
              excludeRecordingIds={formData.recording_ids || []}
            />

            {/* 선택된 녹음 목록 */}
            {formData.recording_ids && formData.recording_ids.length > 0 && (
              <div className="mt-4 p-4 border border-gray-300 dark:border-gray-700 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  {t("selectedRecordingsCount").replace("{count}", String(formData.recording_ids.length))}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{t("order")}</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{t("composer")}</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{t("composition")}</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{t("year")}</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{t("artists")}</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">{t("actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {formData.recording_ids.map((recordingId, index) => {
                        const recording = recordings.find(r => r.id === recordingId);
                        if (!recording) return null;

                        const composition = compositions.find(c => c.id === recording.composition_id);
                        if (!composition) return null;

                        const composer = composers.find(c => c.id === composition.composer_id);

                        return (
                          <tr
                            key={recordingId}
                            draggable
                            onDragStart={(e) => handleRecordingDragStart(e, index)}
                            onDragOver={handleRecordingDragOver}
                            onDrop={(e) => handleRecordingDrop(e, index)}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-move"
                          >
                            <td className="px-3 py-2 text-gray-400 dark:text-gray-500">
                              {index + 1}
                            </td>
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
                                onClick={() => handleRecordingRemove(recordingId)}
                                className="px-2 py-1 border border-red-500 text-red-500 rounded hover:bg-red-50 text-xs"
                              >
                                {t("remove")}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => router.push('/classical-albums/albums')}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="rounded-md bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
            >
              {mode === 'edit' ? t("edit") : t("add")}
            </button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
