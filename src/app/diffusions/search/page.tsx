'use client';
import React, { useEffect, useState } from "react";
import { GalleryProvider, useGallery } from "../../../components/Artbox/context";
import useLocalStorage from "use-local-storage";
import { Artbox } from "../../../components/Artbox";
import { ControlDirectory } from "../../../components/Artbox/ViewerControl.Directory";
import { PictureMetadata } from "../../../components/Artbox/Metadata";
import { Thumbs } from "../../../components/Artbox/Thumbs";
import { useDebounce } from "use-debounce";
import { ControlSearch, IFilter, SearchPrompt } from "../../../components/Artbox/ViewerControl.Filter";

function SearchPage(): JSX.Element {
  const ctx = useGallery();
  const {
    urls,
    offset,
    toastElement,
    collectionAPI,
  } = ctx;

  const url = urls[offset];
  const [filter, setFilter] = useLocalStorage<IFilter>('gallery.filters', {
    prompts: '',
    loras: '',
    checkpoint: ''
  });
  const [debouncedFilter] = useDebounce(filter, 1000);

  useEffect(() => {
    const isEmpty = (debouncedFilter?.prompts ?? '').trim() === '';
    if (isEmpty) {
      return;
    }
    const action = async () => {
      const { data: tmpUrls } = await collectionAPI.post<string[]>('/filter', {
        prompts: debouncedFilter.prompts ?? '',
        loras: debouncedFilter.loras ?? '',
        checkpoint: debouncedFilter.checkpoint ?? '',
      });
      ctx.setUrls(tmpUrls);
    }
    action();
  }, [debouncedFilter])

  return (<div className="w-100 d-flex h-100vh">
    {toastElement}
    <div className="w-70">
      <Artbox />
    </div>
    <div className="w-30">
      <div className="mt-2" />
      <ControlSearch filter={filter} onFilterChange={setFilter} />
      <div className="h-20 mt-2">
        <Thumbs size={4} />
      </div>
      <div className="mt-2"></div>
      <PictureMetadata collectionAPI={collectionAPI} src={url} />
    </div>
  </div>);
}

export default function Page(): JSX.Element {
  return (<GalleryProvider imageType="search">
    <SearchPage />
  </GalleryProvider>)
}