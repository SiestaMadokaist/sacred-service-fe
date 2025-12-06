import React, { useEffect, useState } from "react"
import { ITemplate, usePromptContext } from "./context";
import { Button, Col, Input, Label, Row } from "reactstrap";
import { useDebounce } from "use-debounce";
import { ImageUrlDropzone } from "../../../components/DragNDrop/ImageURLDropzone";
import { AutocompleteTextarea } from "@/components/autocomplete";
import OpenAI from "openai";
import useLocalStorage from "use-local-storage";

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

  const [openAIKey] = useLocalStorage("openai_api", "");
  const [selectedModel] = useLocalStorage("openai_model", "gpt-4o-mini");
  const [systemPrompt] = useLocalStorage("openai_system_prompt", "");

  useEffect(() => {
    setOrientation(props.template.orientation ?? 'portrait');
  }, [ctx.templateId])

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
    setControlnetImage(props.template.controlnet?.source)
  }, [props.template])

  const validateTemplate = (template: string) => {
    return !template.includes('},');
  }

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

      const builtPrompt = ctx.buildPrompt(localTemplate);

      const completion = await client.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: builtPrompt
          }
        ],
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || "";
      setLocalTemplate(response);
      ctx.setTemplate(props.index, { ...ctx.templates[props.index], prompt: response });
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
          onSubmit={pushQueue}
          onChange={setLocalTemplate}
          suggestions={Object.keys(ctx.variables).map((k) => `{${k}}`)}
          style={{ ...colorProperties }}
        >
          <div className="d-flex w-100 mt-2 gap-2">
            <Button onClick={pushQueue} style={{ color: 'yellow', width: '80%' }} color="success">Queue Single</Button>
            <Button onClick={enhanceWithAI} disabled={aiLoading} style={{ width: '20%' }} color="primary">
              {aiLoading ? "..." : "AI"}
            </Button>
          </div>
        </AutocompleteTextarea>
      </Col>
      <Col sm="2" className="d-flex flex-wrap justify-content-center align-items-center">
        <ImageUrlDropzone onUrlDrop={(imageURL) => setControlnetImage(imageURL)} />
        <div style={{ cursor: 'pointer' }} className="d-flex bg-white w-100 justify-content-center align-items-center flex-row h-10">
          <Button onClick={onClick('portrait')} disabled={orientation === 'portrait'} color="primary" style={{ fontSize: '0.8em' }} className="w-40">P</Button>
          <Button onClick={onClick('landscape')} disabled={orientation === 'landscape'} color="primary" style={{ fontSize: '0.8em' }} className="w-40 ml-2">L</Button>
        </div>
      </Col>
      <Col>
        <p onClick={addTemplate} style={{ cursor: 'pointer', textAlign: 'center' }} className="w-100 color-white">{props.index + 1} : {orientation.toUpperCase()}</p>
        <pre>
          <PromptViewer prompt={ctx.buildPrompt(localTemplate)} />
        </pre>
      </Col>
    </Row>
  </div>
  )
}