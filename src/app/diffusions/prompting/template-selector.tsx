import { useEffect, useState } from "react";
import { usePromptContext } from "./context";
import CreatableSelect from "react-select/creatable";
import { Button } from "reactstrap";
import { IconCopy, IconTrash } from "@tabler/icons-react";

export const TemplateSelector = (): JSX.Element => {
  const ctx = usePromptContext();
  const [templateIds, setTemplateIds] = useState<string[]>([]);
  const fetchTemplates = async () => {
    const { data: templateIds } = await ctx.promptAPI.get<string[]>('/');
    setTemplateIds(templateIds);
  }

  useEffect(() => {
    fetchTemplates();
  }, [ctx.templateId]);

  const callDelete = async () => {
    const { templateId } = ctx;
    if (!templateId) {
      return;
    }
    const resp = await ctx.promptAPI.delete(`/${templateId}`);
    if (resp.status === 200) {
      ctx.showToast({ title: 'Delete Success', message: 'Template Deleted', level: 'success', show: true });
      fetchTemplates();
    } else {
      ctx.showToast({ title: 'Delete Failed', message: 'Failed to delete template', level: 'danger', show: true });
    }
  }

  return (<div className="w-100 d-flex flex-wrap flex-row">
    <div className="w-100 d-flex flex-row">
      <CreatableSelect
        className="w-90"
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
      <Button onClick={callDelete} className="ml-5 w-5" color="danger">
        <IconTrash className="bg-transparent" size={16} />
      </Button>
    </div>
  </div>);
}