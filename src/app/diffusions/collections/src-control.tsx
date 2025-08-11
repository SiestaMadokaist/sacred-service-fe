import { Input, InputGroup, InputGroupText } from "reactstrap";
import { IFilter, SearchPrompt } from "../../../components/Artbox/ViewerControl.Filter";
import useLocalStorage from "use-local-storage";
import { AxiosInstance } from "axios";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

export interface ISrcControl {
  collectionAPI: AxiosInstance
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
}

export function SrcControl(props: ISrcControl): JSX.Element {
  const { collectionAPI, onUrlsChange } = props;  
  const [filter, setFilter] = useLocalStorage<IFilter>('filter-prompt', { prompts: '', loras: '', checkpoint: '' });
  const [debouncedFilter] = useDebounce(filter, 1000);
  const [offset, setOffset] = useState<number>(0);
  const onSearch = async () => {
    const resp = await collectionAPI.post('/filter', filter)
    onUrlsChange(resp.data);
  }
  useEffect(() => {
    if (debouncedFilter.prompts !== '') {
      onSearch();
    }
  }, [debouncedFilter]);
    
  
  return (<div className="d-flex flex-column w-100">
    <InputGroup>
      <InputGroupText className="w-20">Offset</InputGroupText>
      <Input type="number" value={offset} onChange={(e) => setOffset(parseInt(e.target.value))}></Input>
      <InputGroupText>of {props.urls.length}</InputGroupText>
    </InputGroup>
    <SearchPrompt filter={filter} onFilterChange={setFilter} />
  </div>)
}