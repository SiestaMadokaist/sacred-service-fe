import { useEffect, useState } from "react";
import { Button, Card, CardHeader } from "reactstrap";
import { SYSTEM_ENV } from "../helper/env";
import { AxiosInstance } from "axios";
import { IconCheck, IconCircle, IconCircle0Filled, IconCircleFilled, IconLock, IconStarFilled, IconStarOff, IconX } from "@tabler/icons-react";
import { getAuth, setAuth } from "../api/api";
import { useRefState } from "../hooks/useRefState";
import { Set as ImmutableSet } from "immutable";

export interface IReport {
  createdAt: number;
  url: string; 
  
  prompts: string;
  negatives: string;
  loras: string;
  checkpoint: string;
}

interface IShowcase {
  collectionAPI: AxiosInstance;
  onReport(report: IReport): void;
  onViewChanged(report: IReport): void
}

export const Showcase = (props: IShowcase): JSX.Element => {
  const [auth, setLocalAuth] = useState(getAuth());
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
    const ws = new WebSocket(`${SYSTEM_ENV.WS_ENDPOINT}/?auth=${token}`);
    setWs(ws);
    ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'NewImage') {
        const report: IReport = data.data;
        addReport({ ...report });
        props.onReport(report);
        props.onViewChanged(report);
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
    const actualIdx = Math.max(index - 1, 0);
    setIndex(actualIdx);
    props.onViewChanged(reportsRef.current[actualIdx]);
  }

  const next = () => {
    const actualIdx = Math.min(index + 1, reports.length - 1);
    setIndex(actualIdx);
    props.onViewChanged(reportsRef.current[actualIdx]);
  }

  const toggleLock = () => {
    setLocked(!lockedRef.current);
  }
  const report = reports[index];
  const resetWS = () => {
    if (ws) {
      ws.close();
      setWs(null);
      const newAuth = getAuth();
      setLocalAuth({ ...newAuth, idx: Math.random() })
    }
  }

  const wsConnection = connected ? (
    <IconCircleFilled onClick={resetWS} style={{ color: 'green', height: '2.5em', width: '2.5em' }} />
  ) : (
    <IconCircle onClick={resetWS} style={{ color: 'red', height: '2.5em', width: '2.5em', cursor: 'pointer' }} />
  );

  const [favorites, setFavorites] = useState<ImmutableSet<string>>(ImmutableSet())
  const starred = favorites.has(report?.url ?? '')

  const toggleStar = () => {
    const url = report?.url ?? '';
    if (!url) return;

    if (favorites.has(url)) {
      setFavorites(favorites.delete(url));
    } else {
      setFavorites(favorites.add(url));
    }
  }
  const star = starred ? (
    <IconStarFilled onClick={toggleStar} style={{ color: 'yellow', height: '2.5em', width: '2.5em', stroke: 'orange', strokeWidth: 1 }}></IconStarFilled>
  ) : (
    <IconStarOff onClick={toggleStar} style={{ color: 'gray', height: '2.5em', width: '2.5em' }}></IconStarOff>
  )

  return (
    <Card className="bg-white text-black w-100 h-100" style={{ overflow: 'hidden' }}>
      <CardHeader className="w-100 d-flex flex-nowrap justify-content-center align-items-center" style={{ minHeight: '3.5em', gap: '0.5rem' }}>
        {wsConnection}
        {star}
        <Button style={{ fontSize: '0.875em', height: '2.5em' }} color="primary" className="px-3" onClick={prev}>&lt;</Button>
        <div style={{ display: reports.length > 0 ? 'block' : 'none', minWidth: '4rem', textAlign: 'center' }}>{index + 1}/{reports.length}</div>
        <Button style={{ fontSize: '0.875em', height: '2.5em' }} color="primary" className="px-3" onClick={next}>&gt;</Button>
        <IconLock onClick={toggleLock} style={{ backgroundColor: locked ? "#0a58ca" : 'white', color: locked ? 'white' : '#0a58ca', cursor: 'pointer', height: '2.5em', width: '2.5em' }} />
      </CardHeader>
      <div className="w-100 mt-2 d-flex flex-wrap justify-content-center align-items-center" onClick={copy} style={{ cursor: 'pointer', overflow: 'hidden' }}>
        <img src={report?.url} alt="Latest Showcase" style={{ display: report?.url ? '' : 'none', maxWidth: '95%', maxHeight: '95%' }} />
      </div>
    </Card>
  )
}