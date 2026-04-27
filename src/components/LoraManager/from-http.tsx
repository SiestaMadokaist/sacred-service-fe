import { AxiosInstance } from "axios"
import { useState } from "react";
import { Button, Input, InputGroup, InputGroupText } from "reactstrap";

export interface IFetchHTTP {
  computeAPI: AxiosInstance;
}
export const FromHTTP = (props: IFetchHTTP): JSX.Element => {
  const { computeAPI } = props;
  const [modelId, setURL] = useState<string>("");
  const [force, setForce] = useState<boolean>(false);
  const action = async () => {
    await computeAPI.post('/sd-models/download', {
      modelId,
      ts: Date.now(),
      type: "loras",
      force,
    })
  }
  return (<div className="w-100 d-flex flex-wrap">
    <InputGroup>
      <InputGroupText>ModelID:</InputGroupText>
      <Input placeholder="" value={modelId} onChange={(e) => setURL(e.target.value)}></Input>
    </InputGroup>
    <Button color="success" onClick={action} className="w-100 mt-2">Download Lora</Button>
  </div>);
}