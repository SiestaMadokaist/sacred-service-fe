import { useState } from "react";
import { Toast, ToastBody, ToastHeader } from "reactstrap";
export interface IUseToast {
  duration: number;
}
export interface IToast {
  level?: 'info' | 'warning' | 'danger' | 'success';
  show: boolean;
  message: string;
  title: string;
}

const divDisplay = (condition: boolean, show: string, hide: string) => ({ display: condition ? show : hide });

export const useToast = (props: IUseToast) => {
  const noToast: IToast = { show: false, message: '', title: '', level: 'info' };
  const [toastMessage, setToastMessage] = useState<IToast>(noToast);
  const { duration } = props;
  const showToast = (params: IToast) => {
    setToastMessage({ ...params, show: true });
    setTimeout(() => setToastMessage(noToast), duration);
  }
  const toastElement = (<div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 5, ...divDisplay(toastMessage.show, "block", "none") }}>
    <Toast isOpen={toastMessage.show}>
      <ToastHeader icon={toastMessage.level ?? 'danger'} toggle={() => setToastMessage(noToast)}>
        {toastMessage.title}
      </ToastHeader>
      <ToastBody>
        {toastMessage.message ?? "Unknown Error"}
      </ToastBody>
    </Toast>
  </div>)
  return { showToast, toastElement };
}