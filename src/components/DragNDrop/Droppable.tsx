import React from 'react';
import {useDroppable} from '@dnd-kit/core';

export interface IDroppableProps {
  id: string;
  children: React.ReactNode;
}

export function Droppable(props: IDroppableProps) {
  const {isOver, setNodeRef} = useDroppable({
    id: props.id,
  });

  return (
    <div ref={setNodeRef} >
      {props.children}
    </div>
  );
}
  