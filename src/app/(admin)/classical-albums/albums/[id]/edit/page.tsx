"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AlbumForm from "@/components/albums/AlbumForm";

export default function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const albumId = parseInt(id);

  return (
    <div>
      <PageBreadcrumb
        pageTitle="앨범 수정"
        breadcrumbs={[
          { label: "앨범", href: "/albums" },
          { label: "수정" }
        ]}
      />
      <AlbumForm mode="edit" albumId={albumId} />
    </div>
  );
}
