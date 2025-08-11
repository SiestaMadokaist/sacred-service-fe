export interface ISourcePreview {
  sources: Set<string>;
  destinations: Set<string>;
  column: number;
  row: number;
  onImageClicked: (url: string) => void;
}

export function SrcPreview(props: ISourcePreview): JSX.Element {
  const { sources, destinations} = props;
  const imgWidth = 100 / props.column;
  const imgHeight = 100 / props.row;
  const sourceUrls = Array.from(sources).filter((x) => !destinations.has(x));
  return (<div className="d-flex flex-wrap w-100 h-100" style={{ overflowY: 'auto' }}>
    {sourceUrls.map((url) => (
      <div onClick={() => props.onImageClicked(url)} style={{ width: `${imgWidth}%`, height: `${imgHeight}%`, cursor: 'pointer'}} key={url}>
        <img style={{ width: '100%'}} src={url} alt="" />
      </div>
    ))}
  </div>);
}