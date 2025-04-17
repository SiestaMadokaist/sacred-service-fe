import { usePromptContext } from "./context";
import { Button } from "reactstrap";
import { TemplateEditor } from "./template-editor";
import { TemplateInverter } from "./template-inverter";

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
  return (
    <div>
      <div style={{ maxHeight: '80vh', overflow: 'auto', scrollbarWidth: 'none' }} className="w-100 h-100">
        <TemplateInverter />
      </div>
      <div style={{ maxHeight: '80vh', overflow: 'auto', scrollbarWidth: 'none' }} className="w-100 h-100">
        {templates.map((x, i) => (<TemplateEditor key={`prompt-${i}`} index={i} template={ctx.templates[i]}/>))}
      </div>
      <div className="w-100 d-flex flex-wrap justify-content-center align-items-center mt-2">
        <Button onClick={save} color="success" className="w-100">Save</Button>
      </div>
    </div>
)
}