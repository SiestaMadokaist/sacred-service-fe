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

  const [directories, setDirectories] = useState<string[]>([]);
  const [directory, setDirectory] = useLocalStorage<string>('image.directory', '2025-04-10');

  const url = urls[offset];

  useEffect(() => {
    const action = async () => {
      const { data: tmpDirectories } = await collectionAPI.get<string[]>('/dirs');
      setDirectories(tmpDirectories.reverse());
    }
    action();
  }, []);

  return (<div className="w-100 d-flex h-100vh">
    {toastElement}
    <div className="w-70">
      <Artbox />
    </div>
    <div className="w-30">
      <ControlDirectory
        setDirectories={setDirectories}
        setDirectory={setDirectory}
        directories={directories}
        directory={directory}
      />
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
  return (<GalleryProvider imageType="gallery">
    <GalleryPage />
  </GalleryProvider>)
}