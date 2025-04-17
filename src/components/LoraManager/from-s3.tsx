import { AxiosInstance } from "axios";
import { use, useEffect, useState } from "react";
import Select from "react-select/base";
import { Button } from "reactstrap";

export interface IFromS3 {
  computeAPI: AxiosInstance;
}

interface IDownloadS3 {
  lora: {
    bucket: string;
    key: string;
  };
  computeAPI: AxiosInstance;
}

// const loraPrefix = 's3://us-east-1.ramadoka.com/loras/';
const DownloadS3 = (props: IDownloadS3): JSX.Element => {
  const { lora, computeAPI } = props;
  const filename = lora.key.split('/').pop()?.replace('.safetensors', '');
  const action = async () => {
    const params = {
      url: `s3://${lora.bucket}/${lora.key}`,
      ts: Date.now(),
      type: "loras",
      force: false,
    }
    await computeAPI.post('/sd-models/download', params);
  }
  return (<div className="w-100 mt-2">
    <Button color="primary" onClick={action} className="w-100">{filename}</Button>
  </div>)
}

export const FromS3 = (props: IFromS3): JSX.Element => {
  const { computeAPI } = props;
  const [s3Loras, setS3Loras] = useState<IDownloadS3['lora'][]>([]);
  useEffect(() => {
    const action = async () => {
      const resp = await computeAPI.get('/sd-models/loras');
      setS3Loras([
        ...resp.data,
      ]);
    }
    action();
  }, []);
  return (<div className="w-100 h-100 overflow-auto">
    <div style={{ maxHeight: '1px' }} className="mt-2 bg-gray h-1vh" />
    {s3Loras.map((x) => <DownloadS3 computeAPI={computeAPI} lora={x} key={x.key} />)}
  </div>)
}