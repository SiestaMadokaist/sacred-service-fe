import { useEffect, useState } from "react";

export interface ICoordinate {
  x: number;
  y: number;
  page: number;
}

export interface ICanvas {
  width: number;
  height: number;
}

export interface IStamp {
  coordinate: ICoordinate;
  canvas: ICanvas;
  stampType: 'VIDA' | 'IMAGE' | 'TEXT';
  codeDocument?: string;
  name: string;
  source?: string;
  trigger: 'AUTO' | 'MANUAL';
  style?: {
    size?: number;
    width?: number;
    height?: number;
  }
}
export interface IPDFPage {
  page: number;
  src: string;
  stamps: IStamp[];
  addStamp: (coordinate: ICoordinate, canvas: ICanvas) => void;
  removeStamp: (name: string) => void;
}

const stampBG: Record<IStamp['stampType'], string> = {
  VIDA: 'red',
  IMAGE: 'blue',
  TEXT: 'green',
}

export function StampLocation(props: { stamp: IStamp; onClick: () => void }): JSX.Element {
  const { stamp, onClick } = props;
  const { coordinate, canvas } = stamp;
  return (<div
    style={{
      height: '50px',
      width: '50px',
      backgroundColor: stampBG[stamp.stampType],
      position: 'absolute',
      zIndex: 2,
      marginTop: canvas.height - coordinate.y - 50,
      marginLeft: coordinate.x,
      fontSize: '0.8em',
    }}
    onClick={onClick}>
    {stamp.stampType}
  </div>)
}

export function PDFPage(props: IPDFPage): JSX.Element {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const onClick = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    const x = e.nativeEvent.offsetX
    const { width, height } = imageSize;
    const y = height - e.nativeEvent.offsetY
    const coordinate: ICoordinate = { x, y, page: props.page }
    const canvas: ICanvas = { width, height }
    props.addStamp(coordinate, canvas)
  }

  useEffect(() => {
    const image = new Image();
    image.src = props.src;
    image.onload = () => {
      setImageSize({ width: image.width, height: image.height })
    }
  }, [props.src]);
  const stampsInPage = props.stamps.filter((s) => s.coordinate.page === props.page);
  return (<div>
    <div style={{ position: 'relative' }}>
      {stampsInPage.map((s) => (<StampLocation key={s.name} stamp={s} onClick={() => props.removeStamp(s.name)} />))}
    </div>

    <img src={props.src} alt="" style={{ position: 'relative' }} onClick={onClick}></img>
  </div>)
}