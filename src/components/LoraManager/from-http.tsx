import { AxiosInstance } from "axios"
import { useState } from "react";
import { Button, Input, InputGroup, InputGroupText } from "reactstrap";

export interface IFetchHTTP {
  computeAPI: AxiosInstance;
}
export const FromHTTP = (props: IFetchHTTP): JSX.Element => {
  const { computeAPI } = props;
  const [url, setURL] = useState<string>("");
  const [force, setForce] = useState<boolean>(false);
  const action = async () => {
    await computeAPI.post('/sd-models/download', {
      url,
      ts: Date.now(),
      type: "loras",
      force,
    })
  }
  return (<div className="w-100 d-flex flex-wrap">
    <InputGroup>
      <InputGroupText>URL</InputGroupText>
      <Input placeholder="https://civitai-delivery-worker-prod.5ac063..." value={url} onChange={(e) => setURL(e.target.value)}></Input>
    </InputGroup>
    <Button color="success" onClick={action} className="w-100 mt-2">Download</Button>
  </div>);
}