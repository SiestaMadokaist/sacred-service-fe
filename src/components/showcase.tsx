import { useEffect, useRef, useState } from "react";
import { Button, Toast, ToastBody, ToastHeader } from "reactstrap";
import { ShowHub } from "../api/hub";
import { SYSTEM_ENV } from "../helper/env";
import { AxiosInstance } from "axios";
import { IconCrossFilled, IconSquaresDiagonal, IconX } from "@tabler/icons-react";

export interface IUseShowcase {
  fetchInterval: number;// in ms;
  duration: number;// in ms;
  refURL: string;
}

interface IReport {
  url: string; 
  createdAt: number;
}

interface IShowcase {
  fetchInterval: number;// in ms;
  duration: number;// in ms;
  refURL: string;
  hub: ShowHub;
  collectionAPI: AxiosInstance;
}

export const Showcase = (props: IShowcase): JSX.Element => {
  const [show, setShow] = useState(false);
  const [lockedShow, setLockedShow] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [reports, setReports] = useState<IReport[]>([]);
  const [index, setIndex] = useState(0);
  const lastReport = reports[reports.length - 1] ?? {
    url: '',
    createdAt: 0,
  };

  const addReport = (report: IReport) => {
    setReports([report, ...reports]);
  }

  const fetchReport = async () => {
    if (document?.visibilityState === 'hidden') { return }
    const fetchURL = `${props.refURL}?ts=${Date.now()}`;
    const response = await fetch(fetchURL);
    if (response.ok) {
      const data: IReport = await response.json();
      const oneMinuteAgo = Date.now() - 60 * 1000;
      if (data.createdAt < oneMinuteAgo) {
        return;
      }
      if (data.createdAt > lastReport.createdAt) {
        addReport(data);
        showToast();
      }
    } else {
      console.error('Failed to fetch latest report');
    }
  }

  useEffect(() => {
    const onShow = (imgURL: string) => {
      addReport({
        url: imgURL,
        createdAt: Date.now(),
      });
      showToast();
    }
    props.hub.on('show', onShow);
    return () => {  
      props.hub.off('show', onShow);
    }
  }, [props.hub])

  const state = useRef({ expireAt: new Date(0)});

  const showToast = () => {
    setShow(true);
    state.current.expireAt = new Date(Date.now() + props.duration - 1000);
    setTimeout(() => {
      const now = new Date();
      if (now > state.current.expireAt) {
        setShow(false);
      }
    }, props.duration);
  }

  useEffect(() => {
    fetchReport();
  }, [lastUpdated]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(Date.now());
    }, props.fetchInterval);
    return () => {
      clearInterval(interval);
    }
  }, []);

  const copy = async () => {
    const imgURL = lastReport.url;
    if (imgURL === '') {
      return;
    }
    const { collectionAPI } = props;
    const path = imgURL.replace(SYSTEM_ENV.IMAGE_PREFIX + '/', '');
    const response = await collectionAPI.post(`/get-meta`, {
      path,
    });
    const { data } = response;
    const { prompts } = data;
    navigator.clipboard.writeText(prompts);
    setShow(false);
  }

  const prev = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  }

  const next = () => {
    if (index < reports.length - 1) {
      setIndex(index + 1);
    }
  }

  const toggleLock = () => {
    setLockedShow(!lockedShow);
  }

  const report = reports[index];
  console.log({ report, index, reports });

  const closeButton = () => {
    setShow(false);
    setLockedShow(false);
  }

  return (<div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 5 }}>
    <Toast isOpen={lockedShow || (show && lastReport.url.length > 0)}>
      <ToastBody className="w-100 d-flex flex-wrap justify-content-center align-items center" toggle={() => setShow(false)}>
        <Button style={{ fontSize: '0.875em' }} color="primary" className="w-25 ml-1" onClick={toggleLock}>{lockedShow ? 'UNLOCK' : 'LOCK'}</Button>
        <Button style={{ fontSize: '0.875em' }} color="primary" className="w-25 ml-1" onClick={prev}>&lt;</Button>
        <Button style={{ fontSize: '0.875em' }} color="primary" className="w-25 ml-1" onClick={next}>&gt;</Button>
        <IconX onClick={closeButton} style={{ backgroundColor: "#0a58ca", color: 'white', cursor: 'pointer', height: '2.5em', width: '2.5em' }} className="ml-1" />
      </ToastBody>
      <ToastBody className="w-100 d-flex flex-wrap justify-content-center align-items-center" onClick={copy} style={{ cursor: 'pointer' }}>
        <div>{index + 1}/{reports.length}</div>
        <img src={report?.url} alt="Latest Showcase" style={{ maxWidth: '100%', maxHeight: '100%' }} />
      </ToastBody>
    </Toast>
  </div>)
}