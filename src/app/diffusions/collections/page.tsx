"use client";
import { useEffect, useState } from "react";
import useLocalStorage from "use-local-storage";
import { SrcPreview } from "./src-preview";
import { DstPreview } from "./dst-preview";
import { apiHub } from "../../../api/hub";
import { useApi } from "../../../hooks/useApi";
import { SrcControl } from "./src-control";
import { DstControl } from "./dst-control";
import { useToast } from "../../../hooks/useToast";

export default function CollectionManager() {
  const [urls, setUrls] = useLocalStorage<string[]>('filter-urls', []);
  const [collectionUrls, setCollectionUrls] = useState<string[]>([]);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [collectionId, setCollectionId] = useLocalStorage<string>('collectionid', 'test');
  const [hub] = useState(apiHub());
  const collectionAPI = useApi(hub, '/collections');
  const { toastElement, showToast } = useToast({ duration: 3000 });
  useEffect(() => {
    hub.on('api-error', (err) => {
      showToast({ show: true, title: `Error Code: ${err.statusCode}`, message: JSON.stringify(err.data) });
    })
  }, []);

  useEffect(() => {
    const action = async () => {
      const { data } = await collectionAPI.get('/list');
      setCollectionIds(data);
    }
    action();
  }, [])

  useEffect(() => {
    const action = async () => {
      if (collectionId) {
        const { data } = await collectionAPI
          .get(`/list/${collectionId}`)
          .catch((err) => ({ data: { items: [] } }))
        setCollectionUrls(data.items ?? []);
      }
    }
    action();
  }, [collectionId])

  const onSourceClicked = (url: string) => {
    setCollectionUrls([...collectionUrls, url]);
  }

  const onDstRemove = (url: string) => {
    setCollectionUrls(collectionUrls.filter((x) => x !== url));
  }

  const onDstReorder = (urls: string[]) => {
    if (urls.length === 0) { return; }
    setCollectionUrls(urls);
  }

  const sources = new Set<string>(urls.slice(0, 20));
  const destinations = new Set<string>(collectionUrls);

  const onSave = async () => {
    const params = {
      id: collectionId,
      items: collectionUrls,
      ts: Date.now(),
    }
    await collectionAPI.post('/renew', params);
  }

  return (<div className="d-flex flex-wrap w-100 h-100vh">
    {toastElement}
    <div className="d-flex flex-wrap w-70 h-100">
      <div className="h-1 w-100"></div>
      <div className="w-98 h-49" style={{ margin: 'auto' }}>
        <SrcPreview
          sources={sources}
          destinations={destinations}
          onImageClicked={onSourceClicked}
          row={1.5}
          column={5}
        />
      </div>
      <div className="h-1 w-100"></div>
      <div className="d-flex w-98 h-49" style={{ margin: 'auto' }}>
        <DstPreview
          destinations={collectionUrls}
          onReorder={onDstReorder}
          onRemove={onDstRemove}
        />
      </div>
    </div>
    <div className="d-flex flex-wrap w-30 h-100">
      <div className="d-flex w-98 h-49" style={{ margin: 'auto' }}>
        <SrcControl urls={urls} collectionAPI={collectionAPI} onUrlsChange={setUrls} />
      </div>
      <div className="d-flex w-98 h-49" style={{ margin: 'auto' }}>
        <DstControl
          id={collectionId}
          ids={collectionIds}
          collectionAPI={collectionAPI}
          onIdChange={setCollectionId}
          onSave={onSave}
        />
      </div>
    </div>
  </div >)
}
