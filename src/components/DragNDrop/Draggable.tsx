
import React from 'react';
import {useDraggable} from '@dnd-kit/core';
import {CSS} from '@dnd-kit/utilities';

export interface IDraggableProps {
  id: string;
  children: React.ReactNode;
  style: React.CSSProperties;
}
export function Draggable(props: IDraggableProps) {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: props.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    ...props.style,
  };

  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  );
}
