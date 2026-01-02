"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AlbumForm from "@/components/albums/AlbumForm";
import { useLanguage } from "@/context/LanguageContext";

export default function NewAlbumPage() {
  const { t } = useLanguage();

  return (
    <div>
      <PageBreadcrumb
        pageTitle={t("albumAdd")}
        breadcrumbs={[
          { label: t("albums"), href: "/albums" },
          { label: t("add") }
        ]}
      />
      <AlbumForm mode="create" />
    </div>
  );
}
