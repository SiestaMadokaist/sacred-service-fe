import { Input, InputGroup, InputGroupText } from "reactstrap";
import { PictureMetadata } from "./Metadata";
import { AxiosInstance } from "axios";
import { useGallery } from "./context";
import ReactSelect from "react-select";
import { useEffect, useState } from "react";
import useLocalStorage from "use-local-storage";

export interface ISelectDirectory {
  directory: string;
  onDirectorySelected: (p: string) => void;
  directories: string[];
}

export function SelectDirectory(props: ISelectDirectory): JSX.Element {
  const labelingFn = (x: string) => ({ value: x, label: x });
  return (<InputGroup>
      <InputGroupText className="w-20">Gallery</InputGroupText>
      <ReactSelect 
        className="w-80" 
        value={{ value: props.directory, label: props.directory }} 
        onChange={(e) => props.onDirectorySelected(e?.value as string)} 
        options={props.directories.map(labelingFn)}>
      </ReactSelect>
    </InputGroup>
  )
}

export function ControlDirectory(): JSX.Element {
  const { 
    offset,
    urls,
    setOffset,
    collectionAPI,
    setUrls,
  } = useGallery();
  const size = urls.length;
  const url = urls[offset] ?? '/';
  const urlParts = url.split('/');
  const fileName = urlParts.pop();

  const [directories, setDirectories] = useState<string[]>([]);
  const [directory, setDirectory] = useLocalStorage<string>('image.directory', '2025-04-10');

  const props = { directories, setDirectories, directory, setDirectory };

  useEffect(() => {
    const action = async () => {
      const { data: tmpDirectories } = await collectionAPI.get<string[]>('/dirs');
      setDirectories(tmpDirectories.reverse());
    }
    action();
  }, []);

  const onDirectorySelected = async (dirname: string) => {
    const response = await collectionAPI.get(`/dirs/${dirname}/list`, {});
    // props.setDirectories(response.data);
    props.setDirectory(dirname);
    setUrls(response.data);
  }

  return (<div className="w-100 d-flex flex-column">
    <div className="w-98 mt-2 h-100 d-flex flex-column">
      <SelectDirectory
        directory={props.directory}
        directories={props.directories}
        onDirectorySelected={onDirectorySelected}
      ></SelectDirectory>   
    </div>
    <div className="w-98 h-100 d-flex flex-column">
      <InputGroup className="mt-2">
        <InputGroupText className="w-20">Offset</InputGroupText>
        <Input type="number" value={offset} onChange={(e) => setOffset(parseInt(e.target.value))}></Input>
        <InputGroupText>of {size}</InputGroupText>
      </InputGroup>
      <InputGroup className="mt-2">
        <Input value={props.directory} readOnly />
        <Input value={fileName} readOnly />
      </InputGroup>
    </div>
  </div>)
}

