"use client"
import { Picture } from "./Picture";
import { useGallery } from "./context";

export function Artbox() {
  const {
    urls,
    offset,
    setOffset,
  } = useGallery();
  const onKeyDown = async (e: React.KeyboardEvent<HTMLDivElement>) => {
    console.log(e.key);
    if (e.key === 'ArrowLeft') {
      setOffset(offset - 1);
      e.preventDefault()
    }
    if (e.key === 'ArrowRight') {
      setOffset(offset + 1);
      e.preventDefault()
    }
  }

  const next = () => {
    setOffset(offset + 1);
  }

  const url = urls[offset];
  return (<div className="h-100 w-100" tabIndex={1} onKeyDown={onKeyDown}>
    <Picture onClick={next} src={url}></Picture>
  </div>)
}