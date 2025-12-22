"use client";

import { useState, useEffect } from "react";
import { apiClient, Composer, ComposerCreate, ComposerUpdate } from "@/lib/api";
import { PlusIcon, PencilIcon, TrashBinIcon, CloseIcon, SearchIcon } from "@/icons/index";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";

export default function ComposersPage() {
  const [composers, setComposers] = useState<Composer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComposer, setEditingComposer] = useState<Composer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<ComposerCreate>({
    name: "",
    short_name: "",
    birth_year: null,
    death_year: null,
    nationality: "",
  });

  const formatName = (name: string, shortName: string): string => {
    return `${shortName} (${name})`;
  };

  const formatLife = (birthYear: number | null, deathYear: number | null): string => {
    if (!birthYear && !deathYear) return "-";
    if (birthYear && !deathYear) return `${birthYear} - ?`;
    if (!birthYear && deathYear) return `? - ${deathYear}`;

    const age = deathYear! - birthYear!;
    return `${birthYear} - ${deathYear} (${age})`;
  };

  useEffect(() => {
    loadComposers(undefined, true);
  }, []);

  const loadComposers = async (searchTerm?: string, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const data = await apiClient.getComposers(0, 100, searchTerm);
      setComposers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load composers");
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const handleSearch = async () => {
    await loadComposers(searchQuery.trim() || undefined, false);
  };

  const handleOpenModal = (composer?: Composer) => {
    if (composer) {
      setEditingComposer(composer);
      setFormData({
        name: composer.name,
        short_name: composer.short_name,
        birth_year: composer.birth_year,
        death_year: composer.death_year,
        nationality: composer.nationality || "",
      });
    } else {
      setEditingComposer(null);
      setFormData({
        name: "",
        short_name: "",
        birth_year: null,
        death_year: null,
        nationality: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingComposer(null);
    setFormData({
      name: "",
      short_name: "",
      birth_year: null,
      death_year: null,
      nationality: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        name: formData.name.trim(),
        short_name: formData.short_name.trim(),
        nationality: formData.nationality?.trim() || null,
        birth_year: formData.birth_year,
        death_year: formData.death_year,
      };

      if (editingComposer) {
        await apiClient.updateComposer(editingComposer.id, data);
      } else {
        await apiClient.createComposer(data);
      }

      await loadComposers();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save composer");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await apiClient.deleteComposer(id);
      await loadComposers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete composer");
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
      <PageBreadcrumb pageTitle="Composers" />

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
          <div className="flex items-center justify-between w-full">
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
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-600 whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4" />
              Add Composer
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
                  Name
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  Life
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400">
                  Nationality
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {composers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400"
                  >
                    {searchQuery
                      ? "No composers found matching your search."
                      : "No composers found. Click \"Add Composer\" to create one."}
                  </td>
                </tr>
              ) : (
                composers.map((composer) => (
                  <tr
                    key={composer.id}
                    className="border-b border-gray-200 dark:border-gray-800"
                  >
                    <td className="px-4 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                      {formatName(composer.name, composer.short_name)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {formatLife(composer.birth_year, composer.death_year)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {composer.nationality || "-"}
                    </td>
                    <td className="px-4 py-3 w-32">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(composer)}
                          className="rounded p-2.5 text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(composer.id, composer.name)}
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
                {editingComposer ? "Edit Composer" : "Add Composer"}
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
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., Johann Sebastian Bach"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Short Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.short_name}
                  onChange={(e) =>
                    setFormData({ ...formData, short_name: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., J.S. Bach"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Birth Year
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
                    placeholder="1685"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Death Year
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
                    placeholder="1750"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Nationality
                </label>
                <input
                  type="text"
                  value={formData.nationality || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, nationality: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., German"
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
                  {editingComposer ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
