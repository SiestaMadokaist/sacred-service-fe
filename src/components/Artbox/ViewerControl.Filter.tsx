import { useEffect, useState } from "react";
import ReactSelect from "react-select";
import CreatableSelect from "react-select/creatable";
import { Button, Input, InputGroup, InputGroupText } from "reactstrap";
import { useGallery } from "./context";
import useLocalStorage from "use-local-storage";
import { useDebounce } from "use-debounce";

export interface IFilter {
  prompts: string;
  loras: string;
  checkpoint: string;
}

export interface ISearchPrompt {
  filter: IFilter
  onFilterChange: (filter: IFilter) => void;
}

interface ILabeled {
  label: string;
  value: string;
}
const TagInput = (props: { onChange: (prompts: ILabeled[]) => void }) => {
  const [prompts, setPrompts] = useState<ILabeled[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const handleChange = (newValue?: any) => {
    setPrompts(newValue ?? []);
  }
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!inputValue) { return; }
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const newTag = { label: inputValue, value: inputValue };
      setPrompts([...prompts, newTag]);
      setInputValue('');
    }
  }
  useEffect(() => {
    props.onChange(prompts);
  }, [prompts])
  return (
    <CreatableSelect
      className="w-80"
      isMulti
      components={{ DropdownIndicator: null }}
      inputValue={inputValue}
      onInputChange={(newValue) => setInputValue(newValue)}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      value={prompts}
    />
  )
}

export function SearchPrompt(props: ISearchPrompt): JSX.Element {
  const { filter } = props;
  const onTagChange = (newValue: ILabeled[]) => {
    const tags = newValue.map(x => x.value.trim()).filter(x => x !== '');
    props.onFilterChange({ ...filter, prompts: tags.join(',') });
  }
  return (<div>
    <InputGroup className="mt-2">
      <InputGroupText className="w-20">Prompts</InputGroupText>
      <TagInput onChange={(s) => onTagChange(s)} />
    </InputGroup>
    <InputGroup className="mt-2">
      <InputGroupText className="w-20">Loras</InputGroupText>
      <Input className="w-80" value={filter.loras} onChange={(e) => props.onFilterChange({ ...filter, loras: e.target.value })}></Input>
    </InputGroup>
    <InputGroup className="mt-2">
      <InputGroupText className="w-20">Checkpoint</InputGroupText>
      <Input className="w-80" value={filter.checkpoint} onChange={(e) => props.onFilterChange({ ...filter, checkpoint: e.target.value })}></Input>
    </InputGroup>
  </div>)
}

export function ControlSearch(): JSX.Element {
  const {
    offset,
    urls,
    setOffset,
    setUrls,
    collectionAPI
  } = useGallery();
  const size = urls.length;
  const url = urls[offset] ?? '/';
  const urlParts = url.split('/');
  const fileName = urlParts.pop();

  const [filter, setFilter] = useLocalStorage<IFilter>('gallery.filters', {
    prompts: '',
    loras: '',
    checkpoint: ''
  });
  const [debouncedFilter] = useDebounce(filter, 1000);

  useEffect(() => {
    const isEmpty = (debouncedFilter?.prompts ?? '').trim() === '';
    if (isEmpty) {
      return;
    }
    const action = async () => {
      const { data: tmpUrls } = await collectionAPI.post<string[]>('/filter', {
        prompts: debouncedFilter.prompts ?? '',
        loras: debouncedFilter.loras ?? '',
        checkpoint: debouncedFilter.checkpoint ?? '',
      });
      setUrls(tmpUrls);
    }
    action();
  }, [debouncedFilter])

  return (<div className="w-100 d-flex flex-column">
    <div className="w-98 h-100 d-flex flex-column">
      <SearchPrompt filter={filter} onFilterChange={setFilter} />
      <InputGroup className="mt-2">
        <InputGroupText className="w-20">Offset</InputGroupText>
        <Input type="number" value={offset} onChange={(e) => setOffset(parseInt(e.target.value))}></Input>
        <InputGroupText>of {size}</InputGroupText>
      </InputGroup>
      <InputGroup className="mt-2">
        <Input value={fileName} readOnly />
      </InputGroup>
    </div>
  </div>)
}

