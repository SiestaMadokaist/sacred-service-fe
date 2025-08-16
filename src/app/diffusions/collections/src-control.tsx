import { Button } from "reactstrap";
import { ControlSearch } from "../../../components/Artbox/ViewerControl.Filter";
import useLocalStorage from "use-local-storage";
import { AxiosInstance } from "axios";
// import { useDebounce } from "use-debounce";
import { ControlDirectory } from "@/components/Artbox/ViewerControl.Directory";

export interface ISrcControl {
  collectionAPI: AxiosInstance
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
}

type Mode = "search" | "gallery";

export function SrcControl(props: ISrcControl): JSX.Element {
  const [mode, setMode] = useLocalStorage<Mode>("collection-mode", "gallery");
  const inner = mode === "search" ? (<ControlSearch />) : (<ControlDirectory />)
  // const inner = mode === "search" ? (<SrcControlSearch {...props} />) : <SrcControlDir {...props} />
  const buttonColor = (buttonFor: Mode) => {
    if (buttonFor === mode) { return undefined }
    return "primary";
  }
  return (<div className="d-flex-row w-100 mt-1">
    <div className="d-flex-column w-100 mb-2">
      <Button color={buttonColor("search")} onClick={() => setMode("search")} className="w-49">Search</Button>
      <Button color={buttonColor("gallery")} onClick={() => setMode("gallery")} className="w-49 ml-2">Directory</Button>
    </div>
    {inner}
  </div>)
}
