import { SAMPLING_METHODS, SAMPLING_SCHEDULES, usePromptContext } from "./context";
import { Button, Input, InputGroup, InputGroupText } from "reactstrap";
import { TemplateEditor } from "./template-editor";
// import { TemplateInverter } from "./template-inverter";
// import { IconCopy } from "@tabler/icons-react";

export const TemplateEditors = (): JSX.Element => {
  const ctx = usePromptContext();

  const { templates } = ctx;
  const randSeed = () => {
    const seed = Math.floor(Math.random() * 999999999);
    ctx.setSeed(seed);
  };
  return (
    <div>
      <div style={{ maxHeight: '75vh', overflow: 'auto', scrollbarWidth: 'none' }} className="w-100 h-100">
        {templates.map((x, i) => (<TemplateEditor key={`prompt-${i}`} index={i} template={ctx.templates[i]} />))}
      </div>
      <div className="w-100 d-flex flex-wrap mt-3 gap-2">
        <InputGroup style={{ width: '74%' }}>
          <InputGroupText onClick={randSeed} style={{ cursor: 'pointer' }}>Seed:</InputGroupText>
          <Input min="-1" max="999999999" type="number" defaultValue={-1} placeholder="Seed" value={ctx.seed} onChange={(e) => ctx.setSeed(parseInt(e.target.value))} />
          <InputGroupText>Repeat:</InputGroupText>
          <Input min="1" max="5" type="number" placeholder="nIter" value={ctx.nIter} onChange={(e) => ctx.setNIter(parseInt(e.target.value))} />
          <InputGroupText>Step:</InputGroupText>
          <Input min="1" max="100" type="number" placeholder="Step Count" value={ctx.stepCount} onChange={(e) => ctx.setStepCount(parseInt(e.target.value))} />
        </InputGroup>
        <Button onClick={() => ctx.pushQueue(ctx.templates)} color="warning" style={{ width: '24%' }}>Queue</Button>
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
    </div>
)}