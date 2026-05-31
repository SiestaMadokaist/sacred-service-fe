import { useState } from "react";
import { usePromptContext } from "./context";
import { Template } from "./prompt-template";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { TemplateEditor } from "./template-editor";
import { DiffusionConfiguration } from "./diffusion-configuration";
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTemplateEditorProps {
  id: string;
  index: number;
  template: Template;
  minimized: boolean;
}

const SortableTemplateEditor = ({ id, index, template, minimized }: SortableTemplateEditorProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, setActivatorNodeRef } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="d-flex align-items-start">
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        style={{
          cursor: 'grab',
          padding: '0.5rem',
          marginTop: '0.5rem',
          userSelect: 'none',
          color: '#888',
        }}
      >
        ⋮⋮
      </div>
      <div style={{ flex: 1, maxHeight: minimized ? '3em' : undefined, overflow: 'hidden' }}>
        <TemplateEditor index={index} template={template} />
      </div>
    </div>
  );
};

export const TemplateEditors = (): JSX.Element => {
  const ctx = usePromptContext();
  const [minimized, setMinimized] = useState(false);

  const { templates } = ctx;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = templates.findIndex((_, i) => `template-${i}` === active.id);
      const newIndex = templates.findIndex((_, i) => `template-${i}` === over.id);
      ctx.reorderTemplates(oldIndex, newIndex);
    }
  };

  return (
    <div className="d-flex flex-column" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 4px', borderBottom: '1px solid #333' }}>
        <button
          onClick={() => setMinimized(m => !m)}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.75em', padding: '0 4px' }}
        >
          {minimized ? '▼ expand all' : '▲ minimize all'}
        </button>
      </div>
      <div style={{ flex: '0 0 80%', overflow: 'auto', scrollbarWidth: 'none' }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={templates.map((_, i) => `template-${i}`)} strategy={verticalListSortingStrategy}>
            {templates.map((_, i) => (
              <SortableTemplateEditor key={`template-${i}`} id={`template-${i}`} index={i} template={ctx.templates[i]} minimized={minimized} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <div style={{ flex: '0 0 20%' }}>
        <DiffusionConfiguration />
      </div>
    </div>
)}