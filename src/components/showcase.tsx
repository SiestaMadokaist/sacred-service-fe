import { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Toast, ToastBody } from "reactstrap";
import { SYSTEM_ENV } from "../helper/env";
import { AxiosInstance } from "axios";
import { IconCrossFilled, IconLock, IconSquaresDiagonal, IconX } from "@tabler/icons-react";
import { getAuth } from "../api/api";
import { useRefState } from "../hooks/useRefState";

interface IReport {
  url: string; 
  createdAt: number;
}

interface IShowcase {
  // fetchInterval: number;// in ms;
  // duration: number;// in ms;
  // refURL: string;
  // hub: ShowHub;
  collectionAPI: AxiosInstance;
}

export const Showcase = (props: IShowcase): JSX.Element => {
  const [auth] = useState(getAuth());
  const [reports, setReports, reportsRef] = useRefState<IReport[]>([]);
  const [index, setIndex, indexRef] = useRefState(0);
  const [locked, setLocked, lockedRef] = useRefState(false);
  const addReport = (report: IReport) => {
    setReports([report, ...reportsRef.current]);
    if (!lockedRef.current) {
      setIndex(0);
    } else {
      setIndex(indexRef.current + 1);
    }
  }

  useEffect(() => {
    const token = auth?.token ?? '';
    if (!token) { return; }
    if (token === '') { return; }
    console.log("WebSocket connecting...");
    const ws = new WebSocket(`${SYSTEM_ENV.WS_ENDPOINT}/?auth=${token}`);
    ws.onmessage = (event: MessageEvent) => {
      console.log(event.data);
      const data = JSON.parse(event.data);
      if (data.type === 'NewImage') {
        console.log(data)
        const { url, createdAt } = data.data;
        addReport({ url, createdAt });
      }
    }
    ws.onopen = () => {
      console.log("WebSocket connected");
    }
    ws.onerror = (event: Event) => {
      console.error("WebSocket error", event);
    }
    return () => {
      ws.close();
    }

  }, [auth])

  const copy = async () => {
    const imgURL = report?.url ?? '';
    if (imgURL === '') {
      return;
    }
    const { collectionAPI } = props;
    const path = imgURL.split("/").slice(4).join("/");
    const response = await collectionAPI.post(`/get-meta`, {
      path,
    });
    const { data } = response;
    const { prompts } = data;
    navigator.clipboard.writeText(prompts);
  }

  const prev = () => {
    setIndex(Math.max(index - 1, 0))
  }

  const next = () => {
    setIndex(Math.min(index + 1, reports.length - 1))
  }
  const toggleLock = () => {
    setLocked(!lockedRef.current);
  }
  const report = reports[index];


  return (
    <Card className="bg-white text-black w-100 h-100" style={{ overflow: 'hidden' }}>
      <CardHeader className="w-100 d-flex flex-wrap justify-content-center align-items center">
        {/* <Button style={{ fontSize: '0.875em' }} color="primary" className="w-25 ml-1" onClick={toggleLock}>{lockedShow ? 'UNLOCK' : 'LOCK'}</Button> */}
        <Button style={{ fontSize: '0.875em' }} color="primary" className="w-25 ml-1" onClick={prev}>&lt;</Button>
        <div style={{ display: reports.length > 0 ? 'block' : 'none' }} className="ml-2 w-20 justify-content-center align-items-center d-flex flex-wrap">{index + 1}/{reports.length}</div>
        <Button style={{ fontSize: '0.875em' }} color="primary" className="w-25 ml-2" onClick={next}>&gt;</Button>
        <IconLock onClick={toggleLock} style={{ backgroundColor: locked ? "#0a58ca" : 'white', color: locked ? 'white' : '#0a58ca', cursor: 'pointer', height: '2.5em', width: '2.5em' }} className="ml-2" />
      </CardHeader>
      <div className="w-100 mt-2 d-flex flex-wrap justify-content-center align-items-center" onClick={copy} style={{ cursor: 'pointer', overflow: 'hidden' }}>
        <img src={report?.url} alt="Latest Showcase" style={{ display: report?.url ? '' : 'none', maxWidth: '95%', maxHeight: '95%' }} />
      </div>
    </Card>
  )
}

export const ShowcaseToast = (props: IShowcase): JSX.Element => {
  const [show, setShow] = useState(false);
  const [lockedShow, setLockedShow] = useState(false);
  const toggleLock = () => {
    setLockedShow(!lockedShow);
  }

  const closeButton = () => {
    setShow(false);
    setLockedShow(false);
  }

  return (<div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 5 }}>
    <Toast isOpen={show} className="bg-dark text-white" style={{ maxWidth: '400px' }} >
      <Showcase {...props} />
    </Toast>
  </div>)
}