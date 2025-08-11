import { Button, InputGroup, InputGroupText } from "reactstrap";
import { AxiosInstance } from "axios";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import CreatableSelect from "react-select/creatable";
import { label } from "../../../helper/labelize";

export interface IDstControl {
  collectionAPI: AxiosInstance
  onIdChange: (id: string) => void;
  ids: string[];
  id: string;
  onSave: () => Promise<void>;
}

export function DstControl(props: IDstControl): JSX.Element {
  const { ids } = props;
  const [collectionId, setCollectionId] = useState<string>(props.id);
  const [debouncedId] = useDebounce(collectionId, 1000);
  useEffect(() => {
    if (debouncedId !== '') {
      props.onIdChange(debouncedId);
    }
  }, [debouncedId]);
  const identity = (x: string) => x;
  const labeling = label({ label: identity, value: identity });
  return (<div className="d-flex flex-column w-100">
    <InputGroup>
      <InputGroupText className="w-20">ID</InputGroupText>
      <CreatableSelect
        className="w-80"
        isMulti={false}
        options={ids.map(labeling)}
        onChange={(e) => {
          setCollectionId(e?.value as string);
          props.onIdChange(e?.value as string);
        }}
        components={{ DropdownIndicator: null }}
        value={labeling(collectionId)}
      ></CreatableSelect>
    </InputGroup>
    <Button color="primary" className="w-100" onClick={() => props.onSave()} >Save</Button>
  </div>)
}