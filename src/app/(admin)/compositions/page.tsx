"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient, Composition, CompositionCreate, Composer } from "@/lib/api";
import { PlusIcon, PencilIcon, TrashBinIcon, CloseIcon, SearchIcon } from "@/icons/index";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";

export default function CompositionsPage() {
  const searchParams = useSearchParams();
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [composers, setComposers] = useState<Composer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComposition, setEditingComposition] = useState<Composition | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComposerId, setSelectedComposerId] = useState<number | undefined>(undefined);
  const [formData, setFormData] = useState<CompositionCreate>({
    composer_id: 0,
    catalog_number: "",
    title: "",
  });

  useEffect(() => {
    loadComposers();
  }, []);

  useEffect(() => {
    const composerParam = searchParams.get('composer');
    if (composerParam) {
      const composerId = parseInt(composerParam);
      if (!isNaN(composerId)) {
        setSelectedComposerId(composerId);
        loadCompositions(composerId);
      }
    }
  }, [searchParams]);

  const loadComposers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getComposers(0, 100);
      // Sort composers alphabetically by name
      const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
      setComposers(sortedData);
    } catch (err) {
      console.error("Failed to load composers:", err);
      setError("Failed to load composers");
    } finally {
      setLoading(false);
    }
  };

  const loadCompositions = async (composerId?: number, searchTerm?: string) => {
    try {
      if (!composerId) {
        setCompositions([]);
        setError(null);
        return;
      }
      const data = await apiClient.getCompositions(0, 1000, composerId, searchTerm);
      setCompositions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load compositions");
    }
  };

  const handleSearch = async () => {
    await loadCompositions(selectedComposerId, searchQuery.trim() || undefined);
  };

  const handleComposerFilter = async (composerId: number | undefined) => {
    setSelectedComposerId(composerId);
    await loadCompositions(composerId, searchQuery.trim() || undefined);
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
      setError(err instanceof Error ? err.message : "Failed to save composition");
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await apiClient.deleteComposition(id);
      await loadCompositions(selectedComposerId, searchQuery.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete composition");
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
      <PageBreadcrumb pageTitle="Compositions" />

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
                  value={selectedComposerId || ""}
                  onChange={(e) => handleComposerFilter(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="min-w-[200px] rounded-md border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none cursor-pointer"
                >
                  <option value="">Select composer</option>
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
                  placeholder="Search by title or catalog number..."
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
              Add Composition
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
                  Catalog No.
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  Title
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {compositions.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400"
                  >
                    {!selectedComposerId
                      ? "Please select a composer to view compositions."
                      : searchQuery
                      ? "No compositions found matching your search."
                      : "No compositions found. Click \"Add Composition\" to create one."}
                  </td>
                </tr>
              ) : (
                compositions.map((composition) => (
                  <tr
                    key={composition.id}
                    className="border-b border-gray-200 dark:border-gray-800"
                  >
                    <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {composition.catalog_number || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                      {composition.title}
                    </td>
                    <td className="px-4 py-3 w-32">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(composition)}
                          className="rounded p-2.5 text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(composition.id, composition.title)}
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
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingComposition ? "Edit Composition" : "Add Composition"}
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
                  Composer <span className="text-red-500">*</span>
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
                    Select a composer
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
                  Catalog Number
                </label>
                <input
                  type="text"
                  value={formData.catalog_number || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, catalog_number: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., BWV 1060, K. 525"
                />
              </div>

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
                  placeholder="e.g., Violin Concerto in D minor"
                />
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
                  {editingComposition ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
