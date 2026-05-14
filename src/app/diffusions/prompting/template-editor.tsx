import React, { useEffect, useState } from "react"
import { ITemplate, usePromptContext } from "./context";
import { Button, Col, Input, Label, Row } from "reactstrap";
import { useDebounce } from "use-debounce";
import { ImageUrlDropzone } from "../../../components/DragNDrop/ImageURLDropzone";
import { HoldToDelete } from "../../../components/HoldToDelete";
// import { AutocompleteTextarea } from "@/components/autocomplete";
import OpenAI from "openai";
import useLocalStorage from "use-local-storage";
import { AutocompleteTextarea } from "../../../components/autocomplete";

export interface ITemplateEditor {
  index: number;
  template: ITemplate;
}

export interface ISinglePrompt {
  prompt: string;
}

const PromptViewer = (props: ISinglePrompt): JSX.Element => {
  const [flash, setFlash] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(props.prompt);
    setFlash(true);
    setTimeout(() => {
      setFlash(false);
    }, 1000);
  }
  const fontColor = flash ? '#07bdff' : 'white';
  return (<div className="w-100 ">
    <pre onClick={copy} style={{ fontSize: '1em', cursor: 'pointer', color: fontColor, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }} className="w-100 mt-2">
      {props.prompt}
    </pre>
  </div>)
}


export const TemplateEditor = (props: ITemplateEditor): JSX.Element => {
  const ctx = usePromptContext();
  const [localTemplate, setLocalTemplate] = useState<string>(props.template.prompt);
  const [debouncedTemplate] = useDebounce(localTemplate, 1000);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(props.template.orientation ?? 'portrait');
  const [valid, setValid] = useState(true);
  const [controlnetImage, setControlnetImage] = useState<string | undefined>();
  const [aiLoading, setAiLoading] = useState(false);

  const normalizeNIter = (v: number | undefined) => (v === undefined || v === -1 ? undefined : v);
  const [localNIter, setLocalNIter] = useState<number | undefined>(normalizeNIter(props.template.nIter ?? -1));

  const [openAIKey] = useLocalStorage("openai_api", "");
  const [selectedModel] = useLocalStorage("openai_model", "gpt-4o-mini");
  const [systemPrompt] = useLocalStorage("openai_system_prompt", "");
  const [customParamsText] = useLocalStorage("openai_custom_params", "{}");

  useEffect(() => {
    setOrientation(props.template.orientation ?? 'portrait');
  }, [ctx.templateId])

  const onSave = () => {
    const { promptAPI, showToast } = ctx;
    const { templateId } = ctx;
    if (!templateId) {
      showToast({ title: 'Save Failed', message: 'TemplateID is blank', level: 'danger', show: true });
      return;
    }
    promptAPI.post(`/`, {
      templateId,
      templates: ctx.templates.filter((x) => x.prompt.length > 0),
      variables: ctx.variables,
    });
  }

  const valueLeak = (t: string, vars: Record<string, string>): [string, string][] => {
    const keys = Object.keys(vars);
    const leaks: [string, string][] = [];
    for (const key of keys) {
      const value = vars[key];
      if (value.length > 0 && t.includes(value)) {
        leaks.push([key, value]);
      }
    }
    return leaks;
  }

  const validateBracket = (template: string) => {
    const stack = [];
    const chars = template.split('');
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      if (char === '{') {
        if (stack.length > 0) {
          return false;
        }
        stack.push(i);
      } else if (char === '}') {
        const start = stack.pop();
        if (start === undefined) {
          return false;
        }
      }
    }
    if (stack.length > 0) {
      return false;
    }
    return true;
  }

  useEffect(() => {
    setLocalTemplate(props.template.prompt);
    setOrientation(props.template.orientation ?? 'portrait');
    setControlnetImage(props.template.controlnet?.source);
    setLocalNIter(normalizeNIter(props.template.nIter));
  }, [props.template])

  const validateTemplate = (template: string) => {
    return !template.includes('},');
  }

  // const templateHash = (localTemplate.split('').reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0) >>> 0).toString(16);

  const templateHash = ctx.titles[props.index] ?? '';
  const colorProperties: React.CSSProperties = (() => {
    if (!valid) {
      return { backgroundColor: "#6b1f1f", color: "#f8d1d1" };
    } else if (ctx.activeIndex === props.index) {
      return { backgroundColor: "#02223a", color: "wheat" };
    }
    return { backgroundColor: "#2c3e3f", color: "#cfe9e4" };
  })();

  useEffect(() => {
    const validTemplate = validateTemplate(debouncedTemplate);
    if (!validTemplate) {
      setValid(false);
      ctx.showToast({ title: 'Invalid Template', message: '} must not be followed by,', level: 'danger', show: true });
      return;
    }
    const validBracket = validateBracket(debouncedTemplate);
    if (!validBracket) {
      setValid(false);
      ctx.showToast({ title: 'Invalid Template', message: 'template bracket is invalid', level: 'danger', show: true });
      return;
    }
    const leaks = valueLeak(debouncedTemplate, ctx.variables);
    let updatedTemplate = debouncedTemplate;
    for (const [leakingKey, leakingValue] of leaks) {
      const regex = new RegExp(leakingValue, 'g');
      updatedTemplate = updatedTemplate.replace(regex, `{${leakingKey}}\n`);
    }
    setValid(true);
    ctx.setTemplate(props.index, { prompt: updatedTemplate, ...resolution(), orientation, });
  }, [debouncedTemplate])

  const addTemplate = () => {
    const newTemplate: ITemplate = {
      prompt: localTemplate,
      orientation,
      ...resolution(),
    }
    ctx.addTemplate(props.index + 1, newTemplate);
  }

  const resolution = ($o?: (typeof orientation)) => {
    const o = $o ?? orientation;
    if (o === 'landscape') {
      return { width: 1200, height: 1000 };
    } else if (o === 'portrait') {
      return { width: 1000, height: 1200 };
    }
    return { width: 1000, height: 1200 };
  }

  const pushQueue = async () => {
    const ref = ctx.templates[props.index];
    const updated: ITemplate = {
      ...ref,
      prompt: `(experimental):(0.001)\n${localTemplate}`,
      nIter: 1
    }
    const prompts: ITemplate[] = [...new Array(ctx.nIter)].map((x) => (updated))
    await ctx.pushQueue(prompts);
  }

  const onClick = (o: typeof orientation) => {
    return (e: React.MouseEvent) => {
      setOrientation(o);
      ctx.setTemplate(props.index, { ...ctx.templates[props.index], orientation: o, ...resolution(o) });
    }
  }

  const enhanceWithAI = async () => {
    setAiLoading(true);
    try {
      if (!openAIKey) {
        ctx.showToast({ title: 'Error', message: 'OpenAI API key not found in localStorage', level: 'danger', show: true });
        return;
      }

      const client = new OpenAI({
        apiKey: openAIKey,
        dangerouslyAllowBrowser: true
      });

      // const builtPrompt = ctx.buildPrompt(localTemplate);
      const tags: Set<string> = new Set(localTemplate.split(/[,\n]/).map(t => t.trim()).filter(t => t.length > 0));
      const completion = await client.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: localTemplate,
          }
        ],
        ...JSON.parse(customParamsText || "{}")
      });

      const response = completion.choices[0]?.message?.content || "";
      const responseTags = new Set(response.split(/[,\n]/).map(t => t.trim()).filter(t => t.length > 0));
      const removedTags = Array.from(tags).filter(t => !responseTags.has(t));
      const cleanedResponse = `${response}\n\n#Removed Tags:\n${removedTags.join(', ')}`;
      console.log({ tags, responseTags, removedTags, cleanedResponse });
      setLocalTemplate(cleanedResponse);
      ctx.setTemplate(props.index, { ...ctx.templates[props.index], prompt: cleanedResponse });
    } catch (err: any) {
      ctx.showToast({ title: 'AI Error', message: err.message || 'Failed to enhance prompt', level: 'danger', show: true });
    } finally {
      setAiLoading(false);
    }
  }

  return (<div className="d-flex w-100 flex-wrap">
    <Row className="mt-2 d-flex flex-wrap w-100" style={{ borderBottom: '2px solid #2c3e3f', paddingBottom: '0.5rem' }}>
      <Col>
        <AutocompleteTextarea
          className="h-80"
          value={localTemplate}
          onSave={onSave}
          onSubmit={pushQueue}
          onChange={setLocalTemplate}
          suggestions={Object.keys(ctx.variables).map((k) => `{${k}}`)}
          style={{ ...colorProperties }}
        >
          <div className="d-flex w-100 mt-2 gap-2">
            <Input
              type="number"
              min={-1}
              value={localNIter ?? ''}
              placeholder={String(ctx.nIter)}
              style={{ width: '20%' }}
              onChange={(e) => {
                const parsed = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                const val = normalizeNIter(parsed);
                setLocalNIter(val);
                ctx.setTemplate(props.index, { ...ctx.templates[props.index], nIter: val });
              }}
            />
            <Button onClick={pushQueue} style={{ color: 'yellow', width: '60%' }} color="success">Queue Single</Button>
            <Button onClick={enhanceWithAI} disabled={aiLoading} style={{ width: '20%' }} color="primary">
              {aiLoading ? "..." : "AI"}
            </Button>
          </div>
        </AutocompleteTextarea>
      </Col>
      <Col sm="2" className="d-flex justify-content-center align-items-start">
        <div className="d-flex flex-column align-items-center gap-2" style={{ paddingTop: '0.5rem' }}>
          <HoldToDelete onDelete={() => ctx.deleteTemplate(props.index)} />
          <ImageUrlDropzone onUrlDrop={(imageURL) => setControlnetImage(imageURL)} />
          <div className="d-flex justify-content-center gap-1">
            <Button onClick={onClick('portrait')} disabled={orientation === 'portrait'} color="primary" style={{ fontSize: '0.8em' }} className="w-40">P</Button>
            <Button onClick={onClick('landscape')} disabled={orientation === 'landscape'} color="primary" style={{ fontSize: '0.8em' }} className="w-40">L</Button>
          </div>
        </div>
      </Col>
      <Col>
        <div onClick={addTemplate} style={{ cursor: 'pointer', textAlign: 'center', borderBottom: '1px silver dashed' }} className="w-100 color-white">
          <div style={{ fontSize: '0.85em', opacity: 0.7 }}>{props.index + 1} : {orientation.toUpperCase()}</div>
          <div>{templateHash}</div>
        </div>
        <pre>
          <PromptViewer prompt={ctx.buildPrompt(localTemplate)} />
        </pre>
      </Col>
    </Row>
  </div>
  )
}