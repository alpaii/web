"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient, Composition, CompositionCreate, Composer } from "@/lib/api";
import { PlusIcon, PencilIcon, TrashBinIcon, CloseIcon } from "@/icons/index";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import ErrorAlert from "@/components/common/ErrorAlert";
import SearchInput from "@/components/common/SearchInput";
import ComposerSelect from "@/components/common/ComposerSelect";

const STORAGE_KEY = 'compositions_page_state';

interface PageState {
  selectedComposerId?: number;
  searchQuery: string;
  compositions: Composition[];
}

export default function CompositionsPage() {
  const router = useRouter();
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [composers, setComposers] = useState<Composer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComposition, setEditingComposition] = useState<Composition | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComposerId, setSelectedComposerId] = useState<number | undefined>(undefined);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; id: number; title: string }>({
    isOpen: false,
    id: 0,
    title: "",
  });
  const [formData, setFormData] = useState<CompositionCreate>({
    composer_id: 0,
    catalog_number: "",
    title: "",
  });

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
    loadComposers();
  }, []);

  useEffect(() => {
    // composers가 로드된 후 저장된 상태 복원
    if (composers.length === 0) return;

    const savedState = loadPageState();
    if (savedState) {
      setSelectedComposerId(savedState.selectedComposerId);
      setSearchQuery(savedState.searchQuery);
      setCompositions(savedState.compositions);
      setLoading(false);
    }
  }, [composers]);

  const loadComposers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getComposers(0, 100);
      // Sort composers alphabetically by name
      const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
      setComposers(sortedData);
    } catch (err) {
      console.error("Failed to load composers:", err);
      setError("작곡가를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  };

  const loadCompositions = async (composerId?: number, searchTerm?: string) => {
    try {
      if (!composerId) {
        setCompositions([]);
        setError(null);
        savePageState({
          selectedComposerId: undefined,
          searchQuery: searchTerm || '',
          compositions: []
        });
        return;
      }
      const data = await apiClient.getCompositions(0, 1000, composerId, searchTerm);
      setCompositions(data);
      setError(null);

      // 상태 저장
      savePageState({
        selectedComposerId: composerId,
        searchQuery: searchTerm || '',
        compositions: data
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "작곡을 불러오지 못했습니다");
    }
  };

  const handleSearch = async () => {
    const search = searchQuery.trim() || undefined;
    await loadCompositions(selectedComposerId, search);
  };

  const handleComposerFilter = async (composerId: number | undefined) => {
    setSelectedComposerId(composerId);
    const search = searchQuery.trim() || undefined;
    await loadCompositions(composerId, search);
  };

  const handleOpenModal = (composition?: Composition) => {
    if (composition) {
      setEditingComposition(composition);
      setFormData({
        composer_id: composition.composer_id,
        catalog_number: composition.catalog_number || "",
        title: composition.title,
      });
    } else {
      setEditingComposition(null);
      setFormData({
        composer_id: selectedComposerId || (composers.length > 0 ? composers[0].id : 0),
        catalog_number: "",
        title: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingComposition(null);
    setFormData({
      composer_id: 0,
      catalog_number: "",
      title: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        composer_id: formData.composer_id,
        catalog_number: formData.catalog_number?.trim() || null,
        title: formData.title.trim(),
      };

      if (editingComposition) {
        await apiClient.updateComposition(editingComposition.id, data);
      } else {
        await apiClient.createComposition(data);
      }

      await loadCompositions(selectedComposerId, searchQuery.trim() || undefined);
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "작곡을 저장하지 못했습니다");
    }
  };

  const handleDeleteClick = (id: number, title: string) => {
    setDeleteConfirmModal({ isOpen: true, id, title });
  };

  const handleDeleteConfirm = async () => {
    try {
      await apiClient.deleteComposition(deleteConfirmModal.id);
      await loadCompositions(selectedComposerId, searchQuery.trim() || undefined);
      setDeleteConfirmModal({ isOpen: false, id: 0, title: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "작곡을 삭제하지 못했습니다");
      setDeleteConfirmModal({ isOpen: false, id: 0, title: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmModal({ isOpen: false, id: 0, title: "" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="작곡" />

      {/* Error Message */}
      <ErrorAlert message={error} onClose={() => setError(null)} />

      <ComponentCard
        title=""
        headerAction={
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-4">
              <ComposerSelect
                composers={composers}
                value={selectedComposerId}
                onChange={handleComposerFilter}
              />

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
              />
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-600 whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4" />
              작곡 추가
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
                  번호
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  제목
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 w-24 text-center">
                  녹음
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 w-32 text-center">
                  작업
                </th>
              </tr>
            </thead>
            <tbody>
              {compositions.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400"
                  >
                    {!selectedComposerId
                      ? "작곡을 보려면 작곡가를 선택하세요."
                      : searchQuery
                      ? "검색 결과가 없습니다."
                      : "작곡이 없습니다. \"작곡 추가\" 버튼을 클릭하여 추가하세요."}
                  </td>
                </tr>
              ) : (
                compositions.map((composition) => (
                  <tr
                    key={composition.id}
                    className="border-b border-gray-200 dark:border-gray-800"
                  >
                    <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400" style={{ fontFamily: 'monospace' }}>
                      {composition.catalog_number || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                      {composition.title}
                    </td>
                    <td className="px-4 py-3 w-24 text-center">
                      {composition.recording_count > 0 ? (
                        <button
                          onClick={async () => {
                            try {
                              // 녹음 데이터를 미리 로드하고 녹음 페이지의 localStorage에 저장
                              const recordingsData = await apiClient.getRecordings(0, 1000, composition.id);
                              const pageState = {
                                selectedCompositionId: composition.id,
                                filterComposerId: composition.composer_id,
                                filterSelectedArtistId: undefined,
                                recordings: recordingsData
                              };
                              localStorage.setItem('recordings_page_state', JSON.stringify(pageState));

                              // 녹음 페이지로 이동
                              router.push(`/recordings`);
                            } catch (err) {
                              console.error('Failed to load recordings:', err);
                              // 에러가 발생해도 페이지는 이동
                              router.push(`/recordings`);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer transition-colors"
                          title={`View recordings of ${composition.title}`}
                          style={{ fontFamily: 'monospace' }}
                        >
                          {composition.recording_count}
                        </button>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600" style={{ fontFamily: 'monospace' }}>0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 w-32">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(composition)}
                          className="rounded p-2.5 text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="수정"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(composition.id, composition.title)}
                          className="rounded p-2.5 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="삭제"
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
                {editingComposition ? "작곡 수정" : "작곡 추가"}
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
                  작곡가 <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.composer_id}
                  onChange={(e) =>
                    setFormData({ ...formData, composer_id: parseInt(e.target.value) })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value={0} disabled>
                    작곡가 선택
                  </option>
                  {composers.map((composer) => (
                    <option key={composer.id} value={composer.id}>
                      {composer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  번호
                </label>
                <input
                  type="text"
                  value={formData.catalog_number || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, catalog_number: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

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
                />
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
                  {editingComposition ? "수정" : "추가"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                삭제 확인
              </h3>
              <button
                onClick={handleDeleteCancel}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                정말로 이 작곡을 삭제하시겠습니까?
              </p>
              <p className="mt-2 font-semibold text-gray-900 dark:text-white">
                &quot;{deleteConfirmModal.title}&quot;
              </p>
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                이 작업은 취소할 수 없습니다.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
