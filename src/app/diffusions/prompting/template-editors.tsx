import { IGeneratePortrait, usePromptContext } from "./context";
import { Button, Input, InputGroup, InputGroupText } from "reactstrap";
import { TemplateEditor } from "./template-editor";
// import { TemplateInverter } from "./template-inverter";
import { IconCopy } from "@tabler/icons-react";

export const TemplateEditors = (): JSX.Element => {
  const ctx = usePromptContext();

  const { templates } = ctx;

  const copy = async () => {
    const { templates } = ctx;
    const tagged = templates.map((x) => {
      return `(batch-${ctx.templateId}-${Date.now()}):(0.0001)\n${x.prompt}`;
    })
    const combined = tagged.map((x) => x.split('\n').join(',')).join('\n\n');
    await navigator.clipboard.writeText(ctx.buildPrompt(combined));
    ctx.showToast({ title: 'Copy Success', message: 'Prompt Copied', level: 'success', show: true });
  }

  // const pushQueue = async () => {
  //   const { templates } = ctx;
  //   const prompts: IGeneratePortrait[] = templates.map((x) => ({
  //     prompt: ctx.buildPrompt(x.prompt),
  //     controlnet: x.controlnet ?? {},
  //     negative_prompt: negativePrompt,
  //     width: 1000,
  //     height: 1200,
  //     steps: 20,
  //     sampler_name: 'DPM++ 2M Karras',
  //     seed: -1,
  //     n_iter: ctx.nIter,
  //   }));
  //   const params = {
  //     jobId: `${ctx.templateId}-${Date.now()}`,
  //     actionId: `${ctx.templateId}`,
  //     resource: prompts,
  //   }
  //   const { promptAPI } = ctx;
  //   await promptAPI.post('/queue', params);
  //   const test = await promptAPI.get(`/queue`);
  // }

  return (
    <div>
      <div style={{ maxHeight: '70vh', overflow: 'auto', scrollbarWidth: 'none' }} className="w-100 h-100">
        {templates.map((x, i) => (<TemplateEditor key={`prompt-${i}`} index={i} template={ctx.templates[i]} />))}
      </div>
      <div className="w-100 d-flex flex-wrap justify-content-center align-items-center mt-2">
        <Button onClick={copy} color="primary" className="w-10">
          <IconCopy className="bg-transparent" size={16} />
        </Button>
        <InputGroup className="w-40 ml-5">
          <InputGroupText>Repeat Count:</InputGroupText>
          <Input min="1" max="5" type="number" placeholder="nIter" value={ctx.nIter} onChange={(e) => ctx.setNIter(parseInt(e.target.value))} />
        </InputGroup>
        <Button onClick={() => ctx.pushQueue(ctx.templates)} color="warning" className="w-40 ml-5">Queue</Button>
      </div>
    </div>
)
}