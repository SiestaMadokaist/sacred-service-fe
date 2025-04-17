import { AxiosInstance } from "axios";
import { ICheckpoint } from "./interface";
import { Button, Card, CardBody, CardText, CardTitle, Input, InputGroup, InputGroupText } from "reactstrap";
import { useState } from "react";
import Select from "react-select/base";
import CreatableSelect from "react-select/creatable";

export interface IFetcher {
  checkpoints: ICheckpoint[];
  api: AxiosInstance;
}

interface ICheckpointPicker {
  isOn: boolean;
  checkpoint: ICheckpoint;
  onClick: (checkpoint: ICheckpoint) => void;
}
function CheckpointPicker(props: ICheckpointPicker): JSX.Element {
  const { checkpoint, onClick } = props;
  const bgColor = props.isOn ? '#bbf7d0 ' : 'white';
  return (<Card style={{ backgroundColor: bgColor, cursor: 'pointer', width: '32%', marginLeft: '1%', marginBottom: '1%' }} onClick={() => onClick(checkpoint)}>
    <CardTitle>{checkpoint.key}</CardTitle>
  </Card>)
}

export function CheckpointUpdater(props: IFetcher): JSX.Element {
  const { checkpoints, api } = props;
  const [selected, setSelected] = useState<ICheckpoint | null>(null);
  const onClick = async (checkpoint: ICheckpoint) => {
    await api.put('/sd-models', { checkpoint });
    setSelected(checkpoint);
  };
  return (<div className="d-flex flex-wrap w-100">
    <div className="d-flex flex-wrap w-100" >
      {checkpoints.map((checkpoint) => CheckpointPicker({ isOn: checkpoint.key === selected?.key, checkpoint, onClick }))}
    </div>
  </div>);
}

export interface ICheckpointDownloader {
  api: AxiosInstance;
}
export function CheckpointDownloader(props: ICheckpointDownloader): JSX.Element {
  const { api } = props;
  const [downloadURL, setDownloadURL] = useState('');
  const onClick = async () => {
    await api.post('/sd-models/download', { 
      url: downloadURL, 
      ts: Date.now(), 
      type: 'checkpooints',
    });
  }
  return (<div className="d-flex flex-wrap w-100 mb-3">
    <InputGroup>
      <InputGroupText>URL</InputGroupText>
      <Input placeholder="https://civitai-delivery-worker-prod..." value={downloadURL} onChange={(e) => setDownloadURL(e.target.value)}></Input>
    </InputGroup>
    <Button className="w-100 mt-2" color="success" onClick={onClick}>Download</Button>
  </div>)
}