"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiClient, Album, Recording, Composer, Composition } from "@/lib/api";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons/index";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import ArtistDisplay from "@/components/common/ArtistDisplay";
import CompositionDisplay from "@/components/common/CompositionDisplay";
import { useLanguage } from "@/context/LanguageContext";

const STORAGE_KEY = 'albums_page_state';

interface PageState {
  selectedRecordingId?: number;
  albums: Album[];
}

export default function AlbumsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [composers, setComposers] = useState<Composer[]>([]);
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);


  // Filter state
  const [selectedRecordingId, setSelectedRecordingId] = useState<number | undefined>(undefined);
  
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

  const loadData = async () => {
    try {
      setLoading(true);

      // localStorage에서 저장된 상태 확인
      const savedState = loadPageState();

      // 단일 API 호출로 모든 데이터 가져오기 (4개 요청 → 1개 요청)
      const pageData = await apiClient.getAlbumsPageData(0, 1000);

      const sortedComposers = pageData.composers.sort((a, b) => a.name.localeCompare(b.name));
      setRecordings(pageData.recordings);
      setComposers(sortedComposers);
      setCompositions(pageData.compositions);
      setAlbums(pageData.albums);

      // 저장된 selectedRecordingId가 있으면 복원
      if (savedState?.selectedRecordingId) {
        setSelectedRecordingId(savedState.selectedRecordingId);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorLoadingAlbums"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAlbumsByRecording = async (recordingId: number) => {
    try {
      const albumsData = await apiClient.getAlbums(0, 1000);
      setAlbums(albumsData);
      setError(null);

      // 상태 저장
      savePageState({
        selectedRecordingId: recordingId,
        albums: albumsData
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorLoadingAlbums"));
    }
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

  const getCompositionDisplay = (compositionId: number): { title: string; catalogNumber: string | null } => {
    const composition = compositions.find(c => c.id === compositionId);
    if (!composition) return { title: "-", catalogNumber: null };
    return {
      title: composition.title,
      catalogNumber: composition.catalog_number || null
    };
  };

  const getPrimaryImage = (album: Album): string | null => {
    const primaryImg = album.images.find(img => img.is_primary === 1);
    return primaryImg ? primaryImg.image_url : (album.images[0]?.image_url || null);
  };
  

  const handleComposerClick = async (compositionId: number) => {
    const composition = compositions.find(c => c.id === compositionId);
    if (!composition) return;

    const composerId = composition.composer_id;

    try {
      // 작곡 데이터를 미리 로드하고 작곡 페이지의 localStorage에 저장
      const compositionsData = await apiClient.getCompositions(0, 1000, composerId);
      const pageState = {
        selectedComposerId: composerId,
        searchQuery: '',
        compositions: compositionsData
      };
      localStorage.setItem('compositions_page_state', JSON.stringify(pageState));

      // 작곡 페이지로 이동
      router.push(`/classical-albums/compositions`);
    } catch (err) {
      console.error('Failed to load compositions:', err);
      // 에러가 발생해도 페이지는 이동
      router.push(`/classical-albums/compositions`);
    }
  };

  const handleArtistClick = async (artistId: number) => {
    try {
      // 클릭한 아티스트 정보 찾기
      const artist = recordings
        .flatMap(r => r.artists)
        .find(a => a.id === artistId);

      if (artist) {
        const pageState = {
          searchQuery: artist.name
        };
        localStorage.setItem('artists_page_state', JSON.stringify(pageState));
      }

      // 아티스트 페이지로 이동
      router.push(`/classical-albums/artists`);
    } catch (err) {
      console.error('Failed to navigate to artists page:', err);
      // 에러가 발생해도 페이지는 이동
      router.push(`/classical-albums/artists`);
    }
  };

  const handleDelete = async (id: number, albumType: string) => {
    if (!confirm(t("deleteConfirmMessage").replace("{type}", `${albumType} ${t("albums")} (ID: ${id})`))) {
      return;
    }

    try {
      await apiClient.deleteAlbum(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorDeletingAlbum"));
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
      <PageBreadcrumb pageTitle={t("albums")} />

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
          <div className="flex items-start justify-between gap-3">
            <p className="flex-1">
              <span className="font-semibold">{t("error")}:</span> {error}
            </p>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 rounded-md px-2 py-1 bg-red-200 text-red-700 hover:bg-red-300 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700 transition-colors font-bold text-lg leading-none"
              title={t("close")}
              aria-label={t("closeErrorMessage")}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <ComponentCard
        title=""
        headerAction={
          <div className="flex justify-end w-full">
            <Link
              href="/classical-albums/albums/new"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-600 whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4" />
              {t("addAlbum")}
            </Link>
          </div>
        }
      >
        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left dark:border-gray-800 dark:bg-gray-800">
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 text-center">
                  {t("albums")}
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 text-center">
                  {t("links")}
                </th>
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
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 w-32 text-center">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let filteredAlbums = albums;

                // Filter by recording
                if (selectedRecordingId) {
                  filteredAlbums = filteredAlbums.filter(album =>
                    album.recordings.some(rec => rec.id === selectedRecordingId)
                  );
                }

                return filteredAlbums.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400"
                    >
                      {selectedRecordingId
                        ? t("noAlbumsWithRecording")
                        : t("clickRecordingCountToViewAlbums")}
                    </td>
                  </tr>
                ) : (
                  filteredAlbums.map((album) => (
                    <Fragment key={album.id}>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <td className="px-4 py-3" rowSpan={Math.max(1, album.recordings.length) + (album.memo ? 1 : 0)}>
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex flex-col gap-1">
                            {(() => {
                              const types = album.album_type.split(',').map(t => t.trim().toLowerCase());
                              const sortOrder = ['lp', 'cd', 'roon'];
                              const sortedTypes = sortOrder.filter(type => types.includes(type));

                              return sortedTypes.map((type, idx) => (
                                <span key={idx} className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  type === 'lp'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                    : type === 'cd'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : type === 'roon'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}>
                                  {type === 'roon' ? 'roon' : type.toUpperCase()}
                                </span>
                              ));
                            })()}
                          </div>
                          <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                            {getPrimaryImage(album) ? (
                              <Image
                                src={getPrimaryImage(album)!}
                                alt={t("albumCover").replace("{type}", album.album_type)}
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
                        </div>
                      </td>
                      <>
                          <td className="px-4 py-3 text-center" rowSpan={Math.max(1, album.recordings.length) + (album.memo ? 1 : 0)}>
                            <div className="flex flex-col items-center gap-1">
                              {album.discogs_url ? (
                                <a
                                  href={album.discogs_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
                                  style={{ fontFamily: 'monospace' }}
                                >
                                  Discogs
                                </a>
                              ) : (
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500" style={{ fontFamily: 'monospace' }}>
                                  Discogs
                                </span>
                              )}
                              {album.goclassic_url ? (
                                <a
                                  href={album.goclassic_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                                  style={{ fontFamily: 'monospace' }}
                                >
                                  GoClassic
                                </a>
                              ) : (
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500" style={{ fontFamily: 'monospace' }}>
                                  GoClassic
                                </span>
                              )}
                              {album.custom_urls && album.custom_urls.length > 0 && (
                                <>
                                  <div className="h-2" />
                                  {album.custom_urls.map((customUrl) => (
                                    <a
                                      key={customUrl.id}
                                      href={customUrl.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                                      style={{ fontFamily: 'monospace' }}
                                    >
                                      {customUrl.url_name}
                                    </a>
                                  ))}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleComposerClick(album.recordings[0].composition_id)}
                              className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 cursor-pointer transition-colors text-left font-semibold text-theme-sm"
                              style={{ fontFamily: '"Noto Sans Mono", monospace' }}
                              title={t("viewCompositionsBy").replace("{name}", getComposerName(album.recordings[0].composition_id))}
                            >
                              {getComposerName(album.recordings[0].composition_id)}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <CompositionDisplay composition={getCompositionDisplay(album.recordings[0].composition_id)} />
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-theme-sm dark:text-gray-400 text-center">
                            {album.recordings[0].year || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {album.recordings[0].artists.map(artist => (
                                <ArtistDisplay key={artist.id} artist={artist} onClick={handleArtistClick} />
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 w-32" rowSpan={Math.max(1, album.recordings.length) + (album.memo ? 1 : 0)}>
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                href={`/classical-albums/albums/${album.id}/edit`}
                                className="rounded p-2.5 text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                title={t("edit")}
                              >
                                <PencilIcon className="w-5 h-5" />
                              </Link>
                              <button
                                onClick={() => handleDelete(album.id, album.album_type)}
                                className="rounded p-2.5 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                title={t("delete")}
                              >
                                <TrashBinIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </>
                    </tr>
                    {album.recordings.slice(1).map((recording) => (
                      <tr key={recording.id} className="border-b border-gray-200 dark:border-gray-800">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleComposerClick(recording.composition_id)}
                            className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 cursor-pointer transition-colors text-left font-semibold text-theme-sm"
                            style={{ fontFamily: '"Noto Sans Mono", monospace' }}
                            title={t("viewCompositionsBy").replace("{name}", getComposerName(recording.composition_id))}
                          >
                            {getComposerName(recording.composition_id)}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <CompositionDisplay composition={getCompositionDisplay(recording.composition_id)} />
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-theme-sm dark:text-gray-400 text-center">
                          {recording.year || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {recording.artists.map(artist => (
                              <ArtistDisplay key={artist.id} artist={artist} onClick={handleArtistClick} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {album.memo && (
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <td colSpan={4} className="px-4 py-3">
                          <div className="border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {album.memo}
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  ))
                );
              })()}
            </tbody>
          </table>
        </div>
      </ComponentCard>
      
    </div>
  );
}

