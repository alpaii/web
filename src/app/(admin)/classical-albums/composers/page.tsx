"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { apiClient, Composer, ComposerCreate, ComposerUpdate } from "@/lib/api";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons/index";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import ComposerProfile from "@/components/common/ComposerProfile";
import ErrorAlert from "@/components/common/ErrorAlert";
import SearchInput from "@/components/common/SearchInput";
import FormModal from "@/components/common/FormModal";
import FormInput from "@/components/common/FormInput";
import { useLanguage } from "@/context/LanguageContext";

export default function ComposersPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [composers, setComposers] = useState<Composer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComposer, setEditingComposer] = useState<Composer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<ComposerCreate>({
    full_name: "",
    name: "",
    birth_year: null,
    death_year: null,
    nationality: "",
    image_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);


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
      setError(err instanceof Error ? err.message : t("errorLoadingComposers"));
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
        full_name: composer.full_name,
        name: composer.name,
        birth_year: composer.birth_year,
        death_year: composer.death_year,
        nationality: composer.nationality || "",
        image_url: composer.image_url || "",
      });
      setImagePreview(composer.image_url ? `http://localhost:8000${composer.image_url}` : null);
    } else {
      setEditingComposer(null);
      setFormData({
        full_name: "",
        name: "",
        birth_year: null,
        death_year: null,
        nationality: "",
        image_url: "",
      });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingComposer(null);
    setFormData({
      full_name: "",
      name: "",
      birth_year: null,
      death_year: null,
      nationality: "",
      image_url: "",
    });
    setImagePreview(null);
    setUploading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t("errorImageTooLarge"));
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError(t("errorInvalidImageType"));
      return;
    }

    setUploading(true);
    try {
      const result = await apiClient.uploadImage(file);
      setFormData({ ...formData, image_url: result.image_url });
      setImagePreview(`http://localhost:8000${result.image_url}`);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorUploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        full_name: formData.full_name.trim(),
        name: formData.name.trim(),
        nationality: formData.nationality?.trim() || null,
        birth_year: formData.birth_year,
        death_year: formData.death_year,
        image_url: formData.image_url?.trim() || null,
      };

      if (editingComposer) {
        await apiClient.updateComposer(editingComposer.id, data);
      } else {
        await apiClient.createComposer(data);
      }

      await loadComposers();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSavingComposer"));
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(t("deleteConfirmMessage").replace("{type}", name))) {
      return;
    }

    try {
      await apiClient.deleteComposer(id);
      await loadComposers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorDeletingComposer"));
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
      <PageBreadcrumb pageTitle={t("composers")} />

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
              {t("addComposer")}
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
                  {t("compositions")}
                </th>
                <th className="px-4 py-3 font-bold text-gray-500 text-theme-xs dark:text-gray-400 w-32 text-center">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {composers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500 text-theme-sm dark:text-gray-400"
                  >
                    {searchQuery
                      ? t("noSearchResults")
                      : t("noComposersFound")}
                  </td>
                </tr>
              ) : (
                composers.map((composer) => (
                  <tr
                    key={composer.id}
                    className="border-b border-gray-200 dark:border-gray-800"
                  >
                    <td className="px-4 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                      <ComposerProfile
                        name={composer.name}
                        profileImage={composer.image_url ? `http://localhost:8000${composer.image_url}` : null}
                        size="md"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400" style={{ fontFamily: 'monospace' }}>
                      {formatLife(composer.birth_year, composer.death_year)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400 text-center">
                      {composer.nationality || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={async () => {
                          try {
                            // 작곡 데이터를 미리 로드하고 작곡 페이지의 localStorage에 저장
                            const compositionsData = await apiClient.getCompositions(0, 1000, composer.id);
                            const pageState = {
                              selectedComposerId: composer.id,
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
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer transition-colors"
                        title={t("viewCompositionsBy").replace("{name}", composer.name)}
                        style={{ fontFamily: 'monospace' }}
                      >
                        {composer.composition_count}
                      </button>
                    </td>
                    <td className="px-4 py-3 w-32">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(composer)}
                          className="rounded p-2.5 text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          title={t("edit")}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(composer.id, composer.name)}
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
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingComposer ? t("editComposer") : t("addComposer")}
        onSubmit={handleSubmit}
        submitLabel={editingComposer ? t("edit") : t("add")}
        maxWidth="md"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
            {t("profileImage")}
          </label>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-2xl font-semibold">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label
                htmlFor="composer-image-upload"
                className={`inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? t("uploading") : t("uploadImage")}
              </label>
              <input
                id="composer-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {t("imageRequirements")}
              </p>
            </div>
          </div>
        </div>

        <FormInput
          label={t("fullName")}
          type="text"
          required
          value={formData.full_name}
          onChange={(value) => setFormData({ ...formData, full_name: value as string })}
        />

        <FormInput
          label={t("name")}
          type="text"
          required
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value as string })}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label={t("birthYear")}
            type="number"
            value={formData.birth_year || ""}
            onChange={(value) => setFormData({ ...formData, birth_year: value ? Number(value) : null })}
          />

          <FormInput
            label={t("deathYear")}
            type="number"
            value={formData.death_year || ""}
            onChange={(value) => setFormData({ ...formData, death_year: value ? Number(value) : null })}
          />
        </div>

        <FormInput
          label={t("nationality")}
          type="text"
          value={formData.nationality || ""}
          onChange={(value) => setFormData({ ...formData, nationality: value as string })}
        />
      </FormModal>
    </div>
  );
}
