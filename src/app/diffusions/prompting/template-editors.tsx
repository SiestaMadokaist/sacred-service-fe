import { usePromptContext } from "./context";
import { Button, Input, InputGroup, InputGroupText } from "reactstrap";
import { TemplateEditor } from "./template-editor";
// import { TemplateInverter } from "./template-inverter";
// import { IconCopy } from "@tabler/icons-react";

export const TemplateEditors = (): JSX.Element => {
  const ctx = usePromptContext();

  const { templates } = ctx;

  return (
    <div>
      <div style={{ maxHeight: '80vh', overflow: 'auto', scrollbarWidth: 'none' }} className="w-100 h-100">
        {templates.map((x, i) => (<TemplateEditor key={`prompt-${i}`} index={i} template={ctx.templates[i]} />))}
      </div>
      <div className="w-100 d-flex flex-wrap justify-content-center align-items-center mt-3">
        <InputGroup className="w-50 ml-5">
          <InputGroupText>Repeat Count:</InputGroupText>
          <Input min="1" max="5" type="number" placeholder="nIter" value={ctx.nIter} onChange={(e) => ctx.setNIter(parseInt(e.target.value))} />
          <InputGroupText>Step Count:</InputGroupText>
          <Input min="1" max="100" type="number" placeholder="Step Count" value={ctx.stepCount} onChange={(e) => ctx.setStepCount(parseInt(e.target.value))} />
        </InputGroup>
        <Button onClick={() => ctx.pushQueue(ctx.templates)} color="warning" className="w-40 ml-5">Queue</Button>
      </div>
    </div>
)
}