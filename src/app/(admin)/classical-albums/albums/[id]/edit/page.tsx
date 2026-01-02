"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AlbumForm from "@/components/albums/AlbumForm";
import { useLanguage } from "@/context/LanguageContext";

export default function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { t } = useLanguage();
  const albumId = parseInt(id);

  return (
    <div>
      <PageBreadcrumb
        pageTitle={t("albumEdit")}
        breadcrumbs={[
          { label: t("albums"), href: "/albums" },
          { label: t("edit") }
        ]}
      />
      <AlbumForm mode="edit" albumId={albumId} />
    </div>
  );
}
