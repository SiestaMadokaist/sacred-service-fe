import { createContext, useContext, useEffect, useState } from "react";
import { Toast, ToastBody, ToastHeader } from "reactstrap";
import { SYSTEM_ENV } from "../helper/env";

export interface IUseShowcase {
  fetchInterval: number;// in ms;
  duration: number;// in ms;
  refURL: string;
}

interface IReport {
  url: string; 
  createdAt: number;
}
interface IShowcaseContext {
  showImage: (url: string) => void;
}

const ShowcaseContext = createContext<IShowcaseContext | undefined>(undefined);

interface IShowcaseProvider {
  children: React.ReactNode;
  fetchInterval: number;// in ms;
  duration: number;// in ms;
  refURL: string;
}

export const ShowcaseProvider = (props: IShowcaseProvider) => {
  const [report, setReport] = useState<IReport>({
    url: '',
    createdAt: 0,
  });
  const [show, setShow] = useState(false);
  const fetchReport = async () => {
    if (document?.visibilityState === 'hidden') { return }
    const fetchURL = `${props.refURL}?ts=${Date.now()}`;
    const response = await fetch(fetchURL);
    if (response.ok) {
      const oneMinuteAgo = Date.now() - 60 * 1000;
      const data: IReport = await response.json();
      if (data.createdAt > oneMinuteAgo) {
        setReport(data);
      }
    } else {
      console.error('Failed to fetch latest report');
    }
  }

  useEffect(() => {
    const interval = setInterval(fetchReport, props.fetchInterval)
    fetchReport();
    return () => clearInterval(interval);
  }, [])

  const showImage = (url: string) => {
    const newReport: IReport = {
      url,
      createdAt: Date.now(),
    }
    setReport(newReport);
    showToast();
  }

  const showToast = () => {
    setShow(true);
    setTimeout(() => setShow(false), props.duration);
  }

  return (
    <ShowcaseContext.Provider value={{ showImage }}>
      {props.children}
      (<div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 5 }}>
        <Toast isOpen={show}>
          <ToastBody>
            <img src={report.url} alt="Latest Showcase" style={{ maxWidth: '100%', maxHeight: '100%' }} />
          </ToastBody>
        </Toast>
      </div>);
    </ShowcaseContext.Provider>
  );
}

export const useShowcaseContext = (): IShowcaseContext => {
  const context = useContext(ShowcaseContext);
  if (!context) throw new Error('useShowcaseContext must be used inside ShowcaseProvider');
  return context;
};
