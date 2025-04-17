"use client";

export interface IArtbox {
  src: string;
  onClick?: () => void;
}

export function Picture(props: IArtbox) {
  const doNothing = () => { };
  const onClick = props.onClick ?? doNothing;
  return (<div onClick={onClick} id="image-wrap" className="w-100 h-100 position-relative">
      <img
        className="mw-100 mh-100 margin-auto d-block"
        src={props.src}
        alt={props.src}
        ></img>
    </div>
  )
}