'use client';
import React, { useEffect, useState } from "react";
import { GalleryProvider, useGallery } from "../../../components/Artbox/context";
import useLocalStorage from "use-local-storage";
import { Artbox } from "../../../components/Artbox";
import { ControlDirectory } from "../../../components/Artbox/ViewerControl.Directory";
import { PictureMetadata } from "../../../components/Artbox/Metadata";
import { Thumbs } from "../../../components/Artbox/Thumbs";

function GalleryPage(): JSX.Element {
  const ctx = useGallery();
  const {
    urls,
    offset,
    toastElement,
    collectionAPI,
  } = ctx;

  const url = urls[offset];

  return (<div className="w-100 d-flex h-100vh">
    {toastElement}
    <div className="w-70">
      <Artbox />
    </div>
    <div className="w-30">
      <ControlDirectory />
      <div className="mt-2"></div>
      <div className="h-20">
        <Thumbs size={4} />
      </div>
      <div className="mt-2"></div>
      <PictureMetadata collectionAPI={collectionAPI} src={url} />
    </div>
  </div>);
}

export default function Page(): JSX.Element {
  return (<GalleryProvider>
    <GalleryPage />
  </GalleryProvider>)
}