import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { apiHub } from "../../api/hub";
import useLocalStorage from "use-local-storage";
import { IToast, useToast } from "../../hooks/useToast";
import { useApi } from "../../hooks/useApi";
import { AxiosInstance } from "axios";
import { SYSTEM_ENV } from "../../helper/env";

interface IGalleryProvider {
  imageType: 'gallery' | 'search';
  children: ReactNode;
}

interface IGalleryContext {
  urls: string[];
  setUrls: (urls: string[]) => void;
  offset: number;
  setOffset: (offset: number) => void;
  showToast: (params: IToast) => void;
  collectionAPI: AxiosInstance;
  toastElement: JSX.Element;
}

export const GalleryContext = createContext<IGalleryContext | null>(null);

const { IMAGE_PREFIX } = SYSTEM_ENV;
export function GalleryProvider(props: IGalleryProvider): JSX.Element {
  const [offset, setOffset] = useLocalStorage<number>('gallery.offset', 0);
  const [urls, _setUrls] = useState<string[]>([]);
  const { toastElement, showToast } = useToast({ duration: 3000 });

  const [hub, _] = useState(apiHub());
  const collectionAPI = useApi(hub, '/collections');

  useEffect(() => {
    hub.on('api-error', (err) => {
      showToast({ show: true, title: `Error Code: ${err.statusCode}`, message: JSON.stringify(err.data) });
    })
  })

  const setUrls = (urls: string[]) => {
    const cleaned = urls.map((x) => {
      if (x.startsWith('http')) { return x; }
      else {
        return `${IMAGE_PREFIX}/${x}`;
      }
    })
    _setUrls(cleaned);
  }
  return (
    <GalleryContext.Provider value={{
      // urls: testImage,
      urls,
      setUrls,
      offset,
      setOffset,
      showToast,
      collectionAPI,
      toastElement,
    }}>
      {toastElement}
      {props.children}
    </GalleryContext.Provider>
  )
}

export function useGallery() {
  const ctx = useContext(GalleryContext);
  if (!ctx) {
    throw new Error("useGallery must be used within a GalleryProvider");
  }
  return ctx;
}