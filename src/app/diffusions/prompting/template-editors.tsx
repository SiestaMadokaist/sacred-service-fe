import { ITemplate, SAMPLING_METHODS, SAMPLING_SCHEDULES, usePromptContext } from "./context";
import { Button, Input, InputGroup, InputGroupText } from "reactstrap";
import { TemplateEditor } from "./template-editor";
import { StartStopSlider } from "../../../components/start-stop-slider";
import useLocalStorage from "use-local-storage";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTemplateEditorProps {
  id: string;
  index: number;
  template: ITemplate;
}

const SortableTemplateEditor = ({ id, index, template }: SortableTemplateEditorProps) => {
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
      <div style={{ flex: 1 }}>
        <TemplateEditor index={index} template={template} />
      </div>
    </div>
  );
};

export const TemplateEditors = (): JSX.Element => {
  const ctx = usePromptContext();

  const { templates } = ctx;
  const randSeed = () => {
    const seed = Math.floor(Math.random() * 999999999);
    ctx.setSeed(seed);
  };

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

  const [startStop, setStartStop] = useLocalStorage<[number, number]>('diffusion.startstop', [1, templates.length]);
  return (
    <div>
      <div style={{ maxHeight: '70vh', overflow: 'auto', scrollbarWidth: 'none' }} className="w-100 h-100">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={templates.map((_, i) => `template-${i}`)} strategy={verticalListSortingStrategy}>
            {templates.map((_, i) => (
              <SortableTemplateEditor key={`template-${i}`} id={`template-${i}`} index={i} template={ctx.templates[i]} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <div className="w-100 d-flex flex-wrap mt-3 gap-2">
        <InputGroup style={{ width: '99%' }}>
          <InputGroupText onClick={randSeed} style={{ cursor: 'pointer' }}>Seed:</InputGroupText>
          <Input min="-1" max="999999999" type="number" defaultValue={-1} placeholder="Seed" value={ctx.seed} onChange={(e) => ctx.setSeed(parseInt(e.target.value))} />
          <InputGroupText>Repeat:</InputGroupText>
          <Input min="1" max="5" type="number" placeholder="nIter" value={ctx.nIter} onChange={(e) => ctx.setNIter(parseInt(e.target.value))} />
          <InputGroupText>Step:</InputGroupText>
          <Input min="1" max="100" type="number" placeholder="Step Count" value={ctx.stepCount} onChange={(e) => ctx.setStepCount(parseInt(e.target.value))} />
        </InputGroup>
      </div>
      <div className="w-100 d-flex flex-wrap mt-2 gap-2">
        <InputGroup style={{ width: '49%' }}>
          <InputGroupText>Method:</InputGroupText>
          <Input type="select" value={ctx.samplingMethod} onChange={(e) => ctx.setSamplingMethod(e.target.value as any)}>
            {SAMPLING_METHODS.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </Input>
        </InputGroup>
        <InputGroup style={{ width: '49%' }}>
          <InputGroupText>Schedule:</InputGroupText>
          <Input type="select" value={ctx.samplingSchedule} onChange={(e) => ctx.setSamplingSchedule(e.target.value as any)}>
            {SAMPLING_SCHEDULES.map((schedule) => (
              <option key={schedule} value={schedule}>{schedule}</option>
            ))}
          </Input>
        </InputGroup>
      </div>
      <div className="w-100 d-flex flex-wrap mt-2 gap-2">
        <div className="w-80">
          <StartStopSlider
            start={startStop[0]}
            stop={startStop[1]}
            min={1}
            max={templates.length}
            onChange={(start, stop) => setStartStop([start, stop])}
          />
        </div>
        <div className="w-18">
          <Button onClick={() => ctx.pushQueue(ctx.templates.slice(startStop[0] - 1, startStop[1] - 1))} color="warning" style={{ width: '100%' }}>Queue</Button>
        </div>
      </div>
    </div>
)}