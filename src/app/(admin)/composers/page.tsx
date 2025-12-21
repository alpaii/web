"use client";

import { useState, useEffect } from "react";
import { apiClient, Composer, ComposerCreate, ComposerUpdate } from "@/lib/api";
import { PlusIcon, PencilIcon, TrashBinIcon, CloseIcon } from "@/icons/index";

export default function ComposersPage() {
  const [composers, setComposers] = useState<Composer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComposer, setEditingComposer] = useState<Composer | null>(null);
  const [formData, setFormData] = useState<ComposerCreate>({
    name: "",
    short_name: "",
    birth_year: null,
    death_year: null,
    nationality: "",
  });

  useEffect(() => {
    loadComposers();
  }, []);

  const loadComposers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getComposers();
      setComposers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load composers");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (composer?: Composer) => {
    if (composer) {
      setEditingComposer(composer);
      setFormData({
        name: composer.name,
        short_name: composer.short_name || "",
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
        ...formData,
        short_name: formData.short_name || null,
        nationality: formData.nationality || null,
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
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Composers
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-brand-600 lg:px-6"
        >
          <PlusIcon className="w-5 h-5" />
          Add Composer
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left dark:border-gray-800 dark:bg-gray-800">
                <th className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                  Name
                </th>
                <th className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                  Short Name
                </th>
                <th className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                  Birth Year
                </th>
                <th className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                  Death Year
                </th>
                <th className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                  Nationality
                </th>
                <th className="px-4 py-4 font-medium text-gray-900 dark:text-white w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {composers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No composers found. Click "Add Composer" to create one.
                  </td>
                </tr>
              ) : (
                composers.map((composer) => (
                  <tr
                    key={composer.id}
                    className="border-b border-gray-200 dark:border-gray-800"
                  >
                    <td className="px-4 py-4 text-gray-900 dark:text-white">
                      {composer.name}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                      {composer.short_name || "-"}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                      {composer.birth_year || "-"}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                      {composer.death_year || "-"}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                      {composer.nationality || "-"}
                    </td>
                    <td className="px-4 py-4 w-32">
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
      </div>

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
                  Short Name
                </label>
                <input
                  type="text"
                  value={formData.short_name || ""}
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
