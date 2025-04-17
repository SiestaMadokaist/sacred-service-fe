import { useGallery } from "./context";
import { Picture } from "./Picture";

interface IThumbs {
  size: number;
}

export function Thumbs(props: IThumbs): JSX.Element {
  const ctx = useGallery();
  const { urls, offset, setOffset } = ctx;
  const elmWidth = `${100 / props.size}%`;

  const onSelected = (index: number) => {
    setOffset(offset + index);
  }

  console.log({ urls, offset, elmWidth });
  const shownUrls = (urls ?? []).slice(offset, offset + props.size);
  return (<div className="d-flex">
    {shownUrls.map((url, index) => {
      return (<div style={{ width: elmWidth }} className="p-1" key={url}>
        <Picture key={url} src={url} onClick={() => onSelected(index)}/>
    </div>)})}
  </div>)
}