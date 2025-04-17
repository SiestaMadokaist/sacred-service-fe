"use client";
import { Button, Input, InputGroup } from "reactstrap";
import { IArtbox } from "./Picture";
import { useEffect, useState } from "react";
import { apiHub } from "../../api/hub";
import { useApi } from "../../hooks/useApi";
import { AxiosInstance } from "axios";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import useLocalStorage from "use-local-storage";
export interface IMetadata {
  src: string;
  collectionAPI: AxiosInstance;
}

export function PictureMetadata(props: IMetadata): JSX.Element {
  const [meta, setMeta] = useState<{
    prompts: string;
    loras: string;
    checkpoint: string;
    show: boolean;
  }>({ prompts: '', loras: '', checkpoint: '', show: false });
  const { collectionAPI } = props;

  const loadMetadata = async () => {
    console.log({ src: props.src });
    const url = new URL(props.src);
    console.log(url);
    const pathname = url.pathname;
    const path = pathname.split('/').slice(2).join('/')
    const response = await collectionAPI.post(`/get-meta`, {
      path,
    });
    const { data } = response;
    const { prompts, loras, checkpoint } = data;
    setMeta({ prompts, loras, checkpoint, show: true });
  }

  useEffect(() => {
    if (!lock) {
      setMeta({ prompts: '', loras: '', checkpoint: '', show: false });
    } else {
      loadMetadata();
    }
  }, [props.src]);

  const [flash, setFlash] = useState(false);
  const [lock, setKeepMetadata] = useLocalStorage("gallery.metatag.lock", false);
  const bgColor = flash ? '#bbf7d0' : 'white';

  const copy = async () => {
    await navigator.clipboard.writeText(meta.prompts);
    setFlash(true);
    setTimeout(() => {
      setFlash(false);
    }, 1000);
  }

  const toggleMessage = lock ? 'Release' : 'Lock';
  return (<div className='w-100 d-flex flex-row'>
    <div className="w-98 h-100 d-flex flex-column">
      <InputGroup style={{ zIndex: 0 }}>
        <Button onClick={() => setKeepMetadata(!lock)} color={lock ? "primary" : "info"} className="w-20">{toggleMessage}</Button>
        <Button onClick={loadMetadata} className="w-80 h-15" color='success'>Load Metadata</Button>
      </InputGroup>
      <div style={{ display: meta.show ? 'block' : 'none' }}>
        <div className="d-flex justify-content-between mt-2">
          <pre className="color-white">{meta.checkpoint}</pre>
          {flash ? <IconCheck size={18} className="color-white bg-transparent" /> : <IconCopy stroke="white" className="color-white bg-transparent" onClick={copy} />}
        </div>
        <pre style={{ height: '30vh', color: bgColor }}>{meta.prompts}</pre>
      </div>
    </div>
  </div>)
}