import { useEffect, useState } from "react";
import { usePromptContext } from "./context";
import CreatableSelect from "react-select/creatable";
import { Button, Input, InputGroup, InputGroupText } from "reactstrap";
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

  const save = async () => {
    const { promptAPI, showToast } = ctx;
    const { templateId } = ctx;
    if (!templateId) {
      showToast({ title: 'Save Failed', message: 'TemplateID is blank', level: 'danger', show: true });
      return;
    }
    await promptAPI.post(`/`, {
      templateId,
      templates: ctx.templates.filter((x) => x.prompt.length > 0),
      variables: ctx.variables,
    });
    showToast({ title: 'Save Success', message: 'Template Saved', level: 'success', show: true });
  }


  return (<div className="w-100 d-flex flex-wrap flex-row">
    <div className="w-100 d-flex flex-row justify-content-center align-items-center mt-2">
      <Button onClick={callDelete} className="w-10" color="danger">
        <IconTrash className="bg-transparent" size={16} />
      </Button>
      <CreatableSelect
        className="w-40 ml-5"
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
      <Button onClick={save} color="success" className="w-40 ml-5">Save</Button>
    </div>
  </div>);
}