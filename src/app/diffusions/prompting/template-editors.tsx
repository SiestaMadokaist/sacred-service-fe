import { IGeneratePortrait, usePromptContext } from "./context";
import { Button } from "reactstrap";
import { TemplateEditor } from "./template-editor";
// import { TemplateInverter } from "./template-inverter";
import { IconCopy } from "@tabler/icons-react";

const negativePrompt = `lowres, worst aesthetic, bad quality, worst quality, bad anatomy, jpeg artifacts, scan artifacts, 
lossy-lossless, unfinished, ugly, poorly drawn, greyscale, 
(illustration, 2d, 2.5D, 3d, painting \(medium\), toon \(style\), sketch, comic, anime,flat color,outline,smooth skin:1.2) 
watermark, text, extra digits, female face out of frame`;
export const TemplateEditors = (): JSX.Element => {
  const ctx = usePromptContext();

  const save = async () => {
    const { promptAPI, showToast } = ctx;
    const { templateId } = ctx;
    if (!templateId) {
      showToast({ title: 'Save Failed', message: 'TemplateID is blank', level: 'danger', show: true });
      return;
    }
    await promptAPI.post(`/`, {
      templateId,
      templates: templates.filter((x) => x.prompt.length > 0),
      variables: ctx.variables,
    });
    showToast({ title: 'Save Success', message: 'Template Saved', level: 'success', show: true });
  }
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

  const pushQueue = async () => {
    const { templates } = ctx;
    const prompts: IGeneratePortrait[] = templates.map((x) => ({
      prompt: ctx.buildPrompt(x.prompt),
      controlnet: x.controlnet,
      negative_prompt: negativePrompt,
      width: 1000,
      height: 1200,
      steps: 20,
      sampler_name: 'DPM++ 2M Karras',
      seed: -1,
    }));
    const params = {
      jobId: `${ctx.templateId}-${Date.now()}`,
      actionId: `${ctx.templateId}`,
      resource: prompts,
    }
    const { promptAPI } = ctx;
    await promptAPI.post('/queue', params);
    const test = await promptAPI.get(`/queue`);
  }

  return (
    <div>
      <div style={{ maxHeight: '80vh', overflow: 'auto', scrollbarWidth: 'none' }} className="w-100 h-100">
        {templates.map((x, i) => (<TemplateEditor key={`prompt-${i}`} index={i} template={ctx.templates[i]} />))}
      </div>
      <div className="w-100 d-flex flex-wrap justify-content-center align-items-center mt-2">
        <Button onClick={save} color="success" className="w-40">Save</Button>
        <Button onClick={pushQueue} color="success" className="w-40 ml-5">Queue</Button>
        <Button onClick={copy} color="primary" className="w-5 ml-5">
          <IconCopy className="bg-transparent" size={16} />
        </Button>
      </div>
    </div>
)
}