import { useEffect, useState } from "react";
import { Button, Card, CardHeader } from "reactstrap";
import { SYSTEM_ENV } from "../helper/env";
import { AxiosInstance } from "axios";
import { IconCheck, IconLock, IconX } from "@tabler/icons-react";
import { getAuth, setAuth } from "../api/api";
import { useRefState } from "../hooks/useRefState";

interface IReport {
  url: string; 
  createdAt: number;
}

interface IShowcase {
  collectionAPI: AxiosInstance;
}

export const Showcase = (props: IShowcase): JSX.Element => {
  const [auth] = useState(getAuth());
  const [reports, setReports, reportsRef] = useRefState<IReport[]>([]);
  const [index, setIndex, indexRef] = useRefState(0);
  const [locked, setLocked, lockedRef] = useRefState(false);
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  const addReport = (report: IReport) => {
    setReports([report, ...reportsRef.current]);
    if (!lockedRef.current) {
      setIndex(0);
    } else {
      setIndex(indexRef.current + 1);
    }
  }

  useEffect(() => {
    console.log({ ws, ready: ws?.readyState, lastUpdate });
    if (ws === null) { return; }
    if (ws.readyState === WebSocket.OPEN) {
      setConnected(true);
    } else {
      setConnected(false);
    }
  }, [lastUpdate])

  useEffect(() => {
    const interval = setInterval(() => { setLastUpdate(Date.now()) }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = auth?.token ?? '';
    if (!token) { return; }
    if (token === '') { return; }
    console.log("WebSocket connecting...");
    const ws = new WebSocket(`${SYSTEM_ENV.WS_ENDPOINT}/?auth=${token}`);
    setWs(ws);
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
      setConnected(true);
    }
    ws.onerror = (event: Event) => {
      setConnected(false);
      console.error("WebSocket error", event);
    }
    ws.onclose = (event: CloseEvent) => {
      setConnected(false);
      console.log("WebSocket closed", event);
    }
    return () => {
      ws.close();
      setConnected(false);
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
  const resetWS = () => {
    if (ws) {
      ws.close();
      setWs(null);
      setAuth(getAuth())
    }
  }

  const elem = connected ? (
    <IconCheck onClick={resetWS} style={{ color: 'green', height: '2.5em', width: '2.5em' }} />
  ) : (
    <IconX onClick={resetWS} style={{ color: 'red', height: '2.5em', width: '2.5em', cursor: 'pointer' }} />
  );


  return (
    <Card className="bg-white text-black w-100 h-100" style={{ overflow: 'hidden' }}>
      <CardHeader className="w-100 d-flex flex-wrap justify-content-center align-items center">
        {elem}
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