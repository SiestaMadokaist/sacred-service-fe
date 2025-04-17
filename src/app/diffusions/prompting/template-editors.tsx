import { usePromptContext } from "./context";
import { Button } from "reactstrap";
import { TemplateEditor } from "./template-editor";
import { TemplateInverter } from "./template-inverter";
import { IconCopy } from "@tabler/icons-react";

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
      templates: templates.filter((x) => x.length > 0),
      variables: ctx.variables,
    });
    showToast({ title: 'Save Success', message: 'Template Saved', level: 'success', show: true });
  }
  const { templates } = ctx;

  const copy = async () => {
    const { templates } = ctx;
    const tagged = templates.map((x) => {
      return `(batch-${ctx.templateId}-${Date.now()}):(0.0001)\n${x}`;
    })
    const combined = tagged.map((x) => x.split('\n').join(',')).join('\n\n');
    await navigator.clipboard.writeText(ctx.buildPrompt(combined));
    ctx.showToast({ title: 'Copy Success', message: 'Prompt Copied', level: 'success', show: true });
  }

  return (
    <div>
      <div style={{ maxHeight: '80vh', overflow: 'auto', scrollbarWidth: 'none' }} className="w-100 h-100">
        {templates.map((x, i) => (<TemplateEditor key={`prompt-${i}`} index={i} template={ctx.templates[i]}/>))}
      </div>
      <div className="w-100 d-flex flex-wrap justify-content-center align-items-center mt-2">
        <Button onClick={save} color="success" className="w-90">Save</Button>
        <Button onClick={copy} color="primary" className="w-5 ml-5">
          <IconCopy className="bg-transparent" size={16} />
        </Button>
      </div>
    </div>
)
}