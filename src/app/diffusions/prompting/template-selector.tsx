import { useEffect, useState } from "react";
import { usePromptContext } from "./context";
import CreatableSelect from "react-select/creatable";
import { Button } from "reactstrap";
import { IconCopy } from "@tabler/icons-react";

export const TemplateSelector = (): JSX.Element => {
  const ctx = usePromptContext();
  const [templateIds, setTemplateIds] = useState<string[]>([]);
  const fetchTemplates = async () => {
    const { data: templates } = await ctx.promptAPI.get<string[]>('/');
    setTemplateIds(templates);
  }

  useEffect(() => {
    fetchTemplates();
  }, [])

  const copy = async () => {
    const { templates } = ctx;
    const tagged = templates.map((x) => {
      return `(batch-${ctx.templateId}-${Date.now()}):(0.0001)\n${x}`;
    })
    const combined = tagged.map((x) => x.split('\n').join(',')).join('\n\n');
    await navigator.clipboard.writeText(ctx.buildPrompt(combined));
    ctx.showToast({ title: 'Copy Success', message: 'Prompt Copied', level: 'success', show: true });
  }

  return (<div className="w-100 d-flex flex-wrap flex-row">
    <div className="w-90">
      <CreatableSelect
        className="w-100"
        options={templateIds.map((x) => ({ label: x, value: x }))}
        onChange={(e) => {
          if (e) {
            ctx.setTemplateId(e.value);
          }
        }}
        isClearable
        isSearchable
        placeholder="Select or create a template"
      />
    </div>
    <Button onClick={copy} className="ml-5 w-5" color="primary">
      <IconCopy className="bg-transparent" size={16} />
    </Button>
  </div>);
}