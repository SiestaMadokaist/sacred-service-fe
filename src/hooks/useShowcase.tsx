import { useEffect, useState } from "react";
import { Toast, ToastBody, ToastHeader } from "reactstrap";

export interface IUseShowcase {
  fetchInterval: number;// in ms;
  duration: number;// in ms;
  refURL: string;
}

interface IReport {
  url: string; 
  createdAt: number;
}
export const useShowcase = (props: IUseShowcase) => {
  const [report, setReport] = useState<IReport>({
    url: '',
    createdAt: 0,
  });

  const fetchReport = async () => {
    if (document?.visibilityState === 'hidden') { return }
    const fetchURL = `${props.refURL}?ts=${Date.now()}`;
    const response = await fetch(fetchURL);
    if (response.ok) {
      const data = await response.json();
      setReport(data);
    } else {
      console.error('Failed to fetch latest report');
    }
  }
  useEffect(() => {
    const interval = setInterval(fetchReport, props.fetchInterval)
    fetchReport();
    return () => clearInterval(interval);
  }, [])

  useEffect(() => {
    if (report.createdAt > Date.now() - 60 * 1000) {
      showToast();
    }
  }, [report.createdAt])

  const [show, setShow] = useState(false);
  const showcaseElement = (<div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 5 }}>
    <Toast isOpen={show}>
      <ToastBody>
        <img src={report.url} alt="Latest Showcase" style={{ maxWidth: '100%', maxHeight: '100%' }} />
      </ToastBody>
    </Toast>
  </div>);

  const showToast = () => {
    setShow(true);
    setTimeout(() => setShow(false), props.duration);
  }

  return { showcaseElement };
}