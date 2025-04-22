import { useEffect, useRef, useState } from "react";
import { Toast, ToastBody, ToastHeader } from "reactstrap";
import { ShowHub } from "../api/hub";
import { SYSTEM_ENV } from "../helper/env";
import { AxiosInstance } from "axios";

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
  const [lastUpdated, setLastUpdated] = useState(0);
  const [report, setReport] = useState<IReport>({
    url: '',
    createdAt: Date.now(),
  });

  const fetchReport = async () => {
    if (document?.visibilityState === 'hidden') { return }
    const fetchURL = `${props.refURL}?ts=${Date.now()}`;
    const response = await fetch(fetchURL);
    if (response.ok) {
      const data: IReport = await response.json();
      if (data.createdAt > report.createdAt) {
        setReport(data);
        showToast();
      }
    } else {
      console.error('Failed to fetch latest report');
    }
  }

  useEffect(() => {
    const onShow = (imgURL: string) => {
      setReport({
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
    const imgURL = report.url;
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

  return (<div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 5 }}>
    <Toast isOpen={show && report.url.length > 0}>
      <ToastHeader toggle={() => setShow(false)} />
      <ToastBody onClick={copy} style={{ cursor: 'pointer' }}>
        <img src={report.url} alt="Latest Showcase" style={{ maxWidth: '100%', maxHeight: '100%' }} />
      </ToastBody>
    </Toast>
  </div>)
}