import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Toast, ToastBody, ToastHeader } from "reactstrap";
import { SYSTEM_ENV } from "../helper/env";
import { ApiHub, ShowHub } from "../api/hub";
import { on } from "events";

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
}

export const Showcase = (props: IShowcase): JSX.Element => {
  const [show, setShow] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(0);

  const fetchReport = async () => {
    if (document?.visibilityState === 'hidden') { return }
    const fetchURL = `${props.refURL}?ts=${Date.now()}`;
    const response = await fetch(fetchURL);
    if (response.ok) {
      const data: IReport = await response.json();
      if (data.createdAt > report.createdAt) {
        setReport(data);
      }
    } else {
      console.error('Failed to fetch latest report');
    }
  }

  const [report, setReport] = useState<IReport>({
    url: '',
    createdAt: 0,
  });

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
    console.log('Expire at:', state.current.expireAt);
    setTimeout(() => {
      const now = new Date();
      console.log({ now, state: state.current });
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

  return (<div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 5 }}>
    <Toast isOpen={show}>
      <ToastBody>
        <img src={report.url} alt="Latest Showcase" style={{ maxWidth: '100%', maxHeight: '100%' }} />
      </ToastBody>
    </Toast>
  </div>)
}