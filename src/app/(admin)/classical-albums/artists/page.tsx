"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient, Artist, ArtistCreate, ArtistUpdate } from "@/lib/api";
import { PlusIcon, PencilIcon, TrashBinIcon, CloseIcon } from "@/icons/index";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import ErrorAlert from "@/components/common/ErrorAlert";
import SearchInput from "@/components/common/SearchInput";
import { useLanguage } from "@/context/LanguageContext";

export default function ArtistsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<ArtistCreate>({
    name: "",
    birth_year: null,
    death_year: null,
    nationality: "",
    instrument: "",
  });

  const formatLife = (birthYear: number | null, deathYear: number | null): string => {
    if (!birthYear && !deathYear) return "-";
    if (birthYear && !deathYear) {
      const currentYear = new Date().getFullYear();
      const currentAge = currentYear - birthYear;
      return `${birthYear} - * (${currentAge})`;
    }
    if (!birthYear && deathYear) return `* - ${deathYear}`;

    const age = deathYear! - birthYear!;
    return `${birthYear} - ${deathYear} (${age})`;
  };

  useEffect(() => {
    // localStorage에서 페이지 상태 로드
    const savedState = localStorage.getItem('artists_page_state');
    if (savedState) {
      try {
        const pageState = JSON.parse(savedState);
        const searchTerm = pageState.searchQuery || '';
        setSearchQuery(searchTerm);
        // 검색어로 실제 검색 수행
        loadArtists(searchTerm, true);
        // 상태를 사용한 후 제거
        localStorage.removeItem('artists_page_state');
      } catch (err) {
        console.error('Failed to parse artists page state:', err);
        loadArtists(undefined, true);
      }
    } else {
      loadArtists(undefined, true);
    }
  }, []);

  const loadArtists = async (searchTerm?: string, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const data = await apiClient.getArtists(0, 100, searchTerm);
      setArtists(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorLoadingArtists"));
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const handleSearch = async () => {
    await loadArtists(searchQuery.trim() || undefined, false);
  };

  const handleOpenModal = (artist?: Artist) => {
    if (artist) {
      setEditingArtist(artist);
      setFormData({
        name: artist.name,
        birth_year: artist.birth_year,
        death_year: artist.death_year,
        nationality: artist.nationality || "",
        instrument: artist.instrument || "",
      });
    } else {
      setEditingArtist(null);
      setFormData({
        name: "",
        birth_year: null,
        death_year: null,
        nationality: "",
        instrument: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingArtist(null);
    setFormData({
      name: "",
      birth_year: null,
      death_year: null,
      nationality: "",
      instrument: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        name: formData.name.trim(),
        nationality: formData.nationality?.trim() || null,
        birth_year: formData.birth_year,
        death_year: formData.death_year,
        instrument: formData.instrument?.trim() || null,
      };

      if (editingArtist) {
        await apiClient.updateArtist(editingArtist.id, data);
      } else {
        await apiClient.createArtist(data);
      }

      await loadArtists();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSavingArtist"));
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(t("deleteConfirmMessage").replace("{type}", name))) {
      return;
    }

    try {
      await apiClient.deleteArtist(id);
      await loadArtists();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorDeletingArtist"));
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
      <PageBreadcrumb pageTitle={t("artists")} />

      {/* Error Message */}
      <ErrorAlert message={error} onClose={() => setError(null)} />

      <ComponentCard
        title=""
        headerAction={
          <div className="flex items-center justify-between w-full">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder={t("search") + "..."}
            />
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-600 whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4" />
              {t("addArtist")}
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
                  {t("name")}
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  {t("life")}
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 text-center">
                  {t("nationality")}
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 text-center">
                  {t("instrument")}
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 text-center">
                  {t("recordings")}
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 w-32 text-center">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {artists.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400"
                  >
                    {searchQuery
                      ? t("noSearchResults")
                      : t("noArtistsFound")}
                  </td>
                </tr>
              ) : (
                artists.map((artist) => (
                  <tr
                    key={artist.id}
                    className="border-b border-gray-200 dark:border-gray-800"
                  >
                    <td className="px-4 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                      {artist.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400" style={{ fontFamily: 'monospace' }}>
                      {formatLife(artist.birth_year, artist.death_year)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400 text-center">
                      {artist.nationality || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400 text-center">
                      {artist.instrument || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {artist.recording_count > 0 ? (
                        <button
                          onClick={async () => {
                            try {
                              // 녹음 데이터를 미리 로드하고 녹음 페이지의 localStorage에 저장
                              const recordingsData = await apiClient.getRecordings(0, 1000, undefined, undefined, artist.id);
                              const pageState = {
                                selectedCompositionId: undefined,
                                filterComposerId: 0,
                                filterSelectedArtistId: artist.id,
                                recordings: recordingsData
                              };
                              localStorage.setItem('recordings_page_state', JSON.stringify(pageState));

                              // 녹음 페이지로 이동
                              router.push(`/classical-albums/recordings`);
                            } catch (err) {
                              console.error('Failed to load recordings:', err);
                              // 에러가 발생해도 페이지는 이동
                              router.push(`/classical-albums/recordings`);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer transition-colors"
                          title={`View recordings by ${artist.name}`}
                          style={{ fontFamily: 'monospace' }}
                        >
                          {artist.recording_count}
                        </button>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500" style={{ fontFamily: 'monospace' }}>
                          0
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 w-32 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(artist)}
                          className="rounded p-2.5 text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title={t("edit")}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(artist.id, artist.name)}
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
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingArtist ? t("editArtist") : t("addArtist")}
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
                  {t("name")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    {t("birthYear")}
                  </label>
                  <input
                    type="number"
                    value={formData.birth_year || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        birth_year: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    {t("deathYear")}
                  </label>
                  <input
                    type="number"
                    value={formData.death_year || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        death_year: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  {t("nationality")}
                </label>
                <input
                  type="text"
                  value={formData.nationality || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, nationality: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  {t("instrument")}
                </label>
                <input
                  type="text"
                  value={formData.instrument || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, instrument: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
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
                  {editingArtist ? t("edit") : t("add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
