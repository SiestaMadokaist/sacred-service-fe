import { Card, CardBody } from "reactstrap";
import { Draggable } from "../../../components/DragNDrop/ImageURLDropzone";
export interface IDestinationPreview {
  destinations: Set<string>;
  onImageClicked: (url: string) => void;
}

// export function DestinationPreview(props: IDestinationPreview): JSX.Element {
//   const { destinations} = props;
//   const destinationUrls = Array.from(destinations);
//   // return (<div className="d-flex flex-wrap w-100 h-100" style={{ border: '1px white solid', overflowY: 'auto' }}>
//   //   {destinationUrls.map((url) => (
//   //     <div onClick={() => props.onImageClicked(url)} style={{ width: '20%'}} key={url}>
//   //       <img style={{ width: '100%'}} src={url} alt="" />
//   //     </div>
//   //   ))}
//   // </div>);
//   return (<DndContext >

//   </DndContext>) 
// }

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useState } from "react";

const IMAGES_PER_ROW = 5;
const MAX_DISPLAY = 20;

interface ISortableImage {
  id: string;
  clickAt: number;
  // tolerance: number;
}

function SortableImage(props: ISortableImage): JSX.Element {
  const { id } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: `${100 / IMAGES_PER_ROW}%`,
    opacity: isDragging ? 1 : 0.5,
    padding: '4px',
    boxSizing: 'border-box' as 'border-box',
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <img
        src={id}
        alt="preview"
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '8px',
          objectFit: 'cover',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  );
}

export interface IDstPreview {
  destinations: string[];
  onReorder: (urls: string[]) => void;
  onRemove: (url: string) => void;
}

export function DstPreview(props: IDstPreview): JSX.Element {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const urls = [...props.destinations]
  const [clickAt, setClickAt] = useState<number>(0);

  const handleDragStart = () => {
    setClickAt(Date.now());
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const now = Date.now();
    if (clickAt + 300 > now) {
      props.onRemove(active.id as string);
      return;
    }
    if (active.id !== over?.id) {
      const oldIndex = urls.indexOf(active.id as string);
      const newIndex = urls.indexOf(over?.id as string);
      const newUrls = arrayMove(urls, oldIndex, newIndex);
      props.onReorder(newUrls);
    }
  };
  const visibleUrls = urls;

  return (
    <div className="w-100 h-100" style={{}}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleUrls} strategy={rectSortingStrategy}>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {visibleUrls.map((url) => (
              <SortableImage clickAt={clickAt} key={url} id={url} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
