import { useState, useRef, useEffect } from "react";
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

interface IToastWithId extends IToast {
  id: number;
}

export const useToast = (props: IUseToast) => {
  const [toasts, setToasts] = useState<IToastWithId[]>([]);
  const { duration } = props;
  const timersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const showToast = (params: IToast) => {
    const id = Date.now();
    const newToast: IToastWithId = { ...params, show: true, id };

    setToasts(prev => [...prev, newToast]);

    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
      timersRef.current.delete(id);
    }, duration);

    timersRef.current.set(id, timer);
  }

  const removeToast = (id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }

  const toastElement = (
    <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 5 }}>
      {toasts.map((toast, index) => (
        <Toast key={toast.id} isOpen={toast.show} className="mb-2">
          <ToastHeader icon={toast.level ?? 'danger'} toggle={() => removeToast(toast.id)}>
            {toast.title}
          </ToastHeader>
          <ToastBody>
            {toast.message ?? "Unknown Error"}
          </ToastBody>
        </Toast>
      ))}
    </div>
  );

  return { showToast, toastElement };
}