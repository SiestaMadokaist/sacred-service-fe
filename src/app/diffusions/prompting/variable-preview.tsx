import { Toast, ToastBody } from "reactstrap";
import { usePromptContext } from "./context";
import { useEffect, useMemo, useState } from "react";

export interface IVariablePreview {
  name: string;
  value: string;
  isShown: boolean;
  hide: () => void;
}

export const VariablePreview = (props: IVariablePreview): JSX.Element => {
  const { name, value } = props;
  const ctx = usePromptContext();
  const [imgURL, setUrl] = useState<string>('');
  const [latestSearch, setLatestSearch] = useState<string>('');
  useEffect(() => {
    const action = async () => {
      setLatestSearch(value);
      const { data: urls } = await ctx.collectionAPI.post<string[]>('/filter', {
        prompts: value,
        loras: '',
        checkpoint: '',
        limit: 1,
        order: 'desc',
      });
      if (urls.length > 0) {
        setUrl(urls[0]);
      } else {
        setUrl('');
      }
    }
    if (!props.isShown) {
      return;
    }
    if (latestSearch === value) {
      return;
    }
    action();
  }, [value, props.isShown])

  useEffect(() => {
    const timeout = setTimeout(() => {
      props.hide();
    }, 20_000);
    return () => {
      clearTimeout(timeout);
    }
  }, [props.isShown])

  if (!props.isShown) {
    return (<>{name}</>)
  }
  return (
    <div>
      {name}
      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 5 }}>
        <Toast isOpen={props.isShown} >
          <ToastBody>
            {
              imgURL === '' ? 
              <div className="text-center">No image found</div> : 
              <img style={{ maxWidth: '100%', maxHeight: '100%'}} alt="" src={imgURL} />
            }
            </ToastBody>
        </Toast>
      </div>
    </div>
  )
}