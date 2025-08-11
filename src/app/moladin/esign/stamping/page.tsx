"use client";

import { useEffect, useState } from "react";
import { ICanvas, ICoordinate, IStamp, PDFPage } from "./pdf-page";
import useLocalStorage from "use-local-storage";
import axios, { AxiosError } from "axios";
import { Button, Card, CardBody, Input, InputGroup, InputGroupText, Toast } from "reactstrap";
import { SYSTEM_ENV } from "../../../../helper/env";

const defaultImages: string[] = [];

type STAMP_TYPE = 'VIDA' | 'IMAGE' | 'TEXT';

export default function StampingPage(): JSX.Element {
  const [fileBase64, setFileBase64] = useState<string>('')
  const [signSrc, setSignSrc] = useLocalStorage<string>('signSrc', 'https://example.com/signature.png');
  const [images, setImages] = useState<string[]>(defaultImages);
  const [stamps, setStamps] = useState<IStamp[]>([]);
  const [page, setPage] = useState<number>(0);
  const [devToken, setDevToken] = useLocalStorage<string>('devToken', '');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [stampType, setStampType] = useState<STAMP_TYPE>('VIDA');

  const showToast = (message: string, duration: number = 3_000) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, duration);
  }

  const devRequest = axios.create({ baseURL: SYSTEM_ENV.ESIGN_API_DEV });
  devRequest.interceptors.request.use((config: any) => {
    return {
      ...config,
      headers: { 'x-api-token': devToken }
    }
  })
  const extract = async () => {
    const path = '/v1/debug/extract-pdf';
    showToast("Extracting...", 60_000);
    const response = await devRequest.post(path, { buffer: fileBase64 }, { headers: { "Content-Type": "multipart/form-data" } }).catch((error: AxiosError) => error)
    if (response instanceof Error) {
      showToast("Extract Failed")
    } else {
      showToast("Extract Success")
      setImages(response.data.data.images);
    }
  }
  const prev = () => {
    if (page <= 0) {
      setPage(0);
    }
    setPage(page - 1);
  }
  const next = () => {
    if (page >= images.length - 1) {
      setPage(images.length - 1);
    }
    setPage(page + 1);
  }
  const image = images[page];
  const addStamp = (coordinate: ICoordinate, canvas: ICanvas) => {
    if (stampType === 'VIDA') {
      const stamp: IStamp = {
        stampType,
        canvas,
        coordinate,
        name: `VIDA-${coordinate.page}-${coordinate.x}-${coordinate.y}`,
        trigger: 'AUTO',
        codeDocument: 'VD001',
        style: {
          size: 10,
        }
      }
      setStamps([...stamps, stamp]);
    } else if (stampType === 'IMAGE') {
      const stamp: IStamp = {
        stampType,
        canvas,
        coordinate,
        name: `IMAGE-${coordinate.page}-${coordinate.x}-${coordinate.y}`,
        trigger: 'AUTO',
        source: signSrc,
        style: {
          size: 10,
        }
      }
      setStamps([...stamps, stamp]);
    } else if (stampType === 'TEXT') {
      const stamp: IStamp = {
        stampType,
        canvas,
        coordinate,
        name: `TEXT-${coordinate.page}-${coordinate.x}-${coordinate.y}`,
        trigger: 'AUTO',
        codeDocument: 'VD003',
        source: "",
        style: {
          size: 10,
        }
      }
      setStamps([...stamps, stamp]);
    }
  }
  const removeStamp = (name: string) => {
    setStamps(stamps.filter(stamp => stamp.name !== name));
  }

  const sortedStamps = [...stamps].sort((a, b) => {
    if (a.stampType === 'VIDA') return -1
    if (b.stampType === 'VIDA') return 1
    return 0
  }).map((x) => {
    if (x.stampType !== 'IMAGE') { return x; }
    return { ...x, source: signSrc }
  })

  const vidaStamps = sortedStamps.filter(x => x.stampType === 'VIDA').map((x, i) => ({ ...x, name: `vidastamp${i + 1}` }));
  const imageStamps = sortedStamps.filter(x => x.stampType === 'IMAGE').map((x, i) => ({ ...x, name: `imagestamp${i + 1}` }));
  const textStamps = sortedStamps.filter(x => x.stampType === 'TEXT').map((x, i) => ({ ...x, name: `textstamp${i + 1}` }));

  const textAreaBody = [...vidaStamps, ...imageStamps, ...textStamps];

  const onFileChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ?? [];
    const file = files[0];
    if (!file) {
      return;
    }
    if (file.type !== 'application/pdf') {
      showToast('File must be a PDF');
    }
    const reader = new FileReader();
    const blob = new Blob([file], { type: 'application/pdf' });
    reader.readAsDataURL(blob);
    reader.onload = () => {
      const { result } = reader;
      if (typeof result !== 'string') {
        return;
      }
      const base64 = result.toString().split(',')[1];
      setFileBase64(base64);
    }
  }

  useEffect(() => {
    if (fileBase64.length > 0) {
      extract();
    }
  }, [fileBase64])

  const primaryIf = (type: STAMP_TYPE) => {
    return stampType === type ? 'primary' : 'secondary';
  }

  return (<div className="d-flex">
    <Toast
      style={{ backgroundColor: 'darkgreen', color: 'white', border: '2px #77B48C solid', position: 'absolute', zIndex: 5, bottom: '100px', left: '35%', width: '30%' }}
      isOpen={toastMessage !== ''}>
      {toastMessage}
    </Toast>
    <div className="d-flex-column" style={{ width: '48%', margin: '1%' }}>
      <Card>
        <InputGroup>
          <Input onChange={onFileChanged} type="file"></Input>
        </InputGroup>
        <div className="d-flex" style={{ marginTop: '1%' }}>
          <Button onClick={prev} color="primary" style={{ width: '48%', margin: '1%' }}>&lt;</Button>
          <Button onClick={next} color="primary" style={{ width: '48%', margin: '1%' }}>&gt;</Button>
        </div>
        <CardBody style={{ backgroundColor: '#333' }}>
          <div style={{ color: 'wheat', margin: '1%' }}>Page: {page} / {images.length}</div>
          <PDFPage page={page} src={image} stamps={stamps} addStamp={addStamp} removeStamp={removeStamp}></PDFPage>
        </CardBody>
      </Card>
    </div>
    <div className="d-flex-column" style={{ width: '48%', margin: '1%' }}>
      <InputGroup style={{ margin: '1%' }}>
        <InputGroupText>Dev Token: </InputGroupText>
        <Input defaultValue={devToken} onChange={(e) => setDevToken(e.target.value)}></Input>
      </InputGroup>
      <InputGroup style={{ margin: '1%' }}>
        <InputGroupText>Sign SRC: </InputGroupText>
        <Input defaultValue={signSrc} onChange={(e) => setSignSrc(e.target.value)}></Input>
      </InputGroup>
      <div className="d-flex">
        <Button onClick={() => setStampType("VIDA")} style={{ width: '31%', margin: '1%' }} color={primaryIf("VIDA")}>VIDA</Button>
        <Button onClick={() => setStampType("IMAGE")} style={{ width: '31%', margin: '1%' }} color={primaryIf("IMAGE")}>IMAGE</Button>
        <Button onClick={() => setStampType("TEXT")} style={{ width: '31%', margin: '1%' }} color={primaryIf("TEXT")}>TEXT</Button>
      </div>
      <textarea readOnly style={{ fontSize: '0.8em', width: '98%', margin: '1%' }} cols={60} rows={20} value={JSON.stringify(textAreaBody, null, 2)}></textarea>
    </div>
  </div>)
}