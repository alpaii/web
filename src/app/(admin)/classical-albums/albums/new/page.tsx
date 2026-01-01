"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AlbumForm from "@/components/albums/AlbumForm";

export default function NewAlbumPage() {
  return (
    <div>
      <PageBreadcrumb
        pageTitle="앨범 추가"
        breadcrumbs={[
          { label: "앨범", href: "/albums" },
          { label: "추가" }
        ]}
      />
      <AlbumForm mode="create" />
    </div>
  );
}
