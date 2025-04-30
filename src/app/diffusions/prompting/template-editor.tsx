import React, { useEffect, useState } from "react"
import { ITemplate, usePromptContext } from "./context";
import { Button, Col, Input, Label, Row } from "reactstrap";
import { useDebounce } from "use-debounce";
import { ImageUrlDropzone } from "../../../components/DragNDrop/ImageURLDropzone";

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
  const valueLeak = (t: string, vars: Record<string, string>): [string, string] | [null, null] => {
    const keys = Object.keys(vars);
    for (const key of keys) {
      const value = vars[key];
      if (value.length > 0 && t.includes(value)) {
        return [key, value];
      }
    }
    return [null, null];
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
  }, [props.template])

  const validateTemplate = (template: string) => {
    return !template.includes('},');
  }

  const [valid, setValid] = useState(true);
  const [controlnetImage, setControlnetImage] = useState<string | undefined>();

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
    const [leakingKey, leakingValue] = valueLeak(debouncedTemplate, ctx.variables);
    if (leakingKey && leakingValue) {
      setValid(false);
      ctx.showToast({ title: 'Value Leak', message: `Template is leaking value ${leakingKey}`, level: 'danger', show: true });
      return;
    }
    setValid(true);
    ctx.setTemplate(props.index, { prompt: debouncedTemplate });
  }, [debouncedTemplate])

  const addTemplate = () => {
    const newTemplate: ITemplate = {
      prompt: localTemplate,
    }
    ctx.addTemplate(props.index + 1, newTemplate);
  }

  const pushQueue = async () => {
    const ref = ctx.templates[props.index];
    const updated: ITemplate = {
      ...ref,
      nIter: 1,
      seed: -1,
    }
    const prompts: ITemplate[] = [...new Array(ctx.nIter)].map((x) => (updated))
    await ctx.pushQueue(prompts);
  }

  const fuzzySearch = async () => {
    const prompt = ctx.buildPrompt(localTemplate);
    const qualifier = ctx.variables['qualifier'] ?? '';
    const promptWithoutQualifier = prompt.replace(qualifier, '');
    const cleanedPrompts = promptWithoutQualifier.replace(/[\n\r]/g, ' ').replace(/\s+/g, ' ');
    const resp = await ctx.collectionAPI.post('/fuzzy-filter', {
      tags: cleanedPrompts.split(',').map((x) => x.trim()),
    });
    if (resp.data.length > 0) {
      ctx.showImage(resp.data[0])
    }
  }

  return (<div className="d-flex w-100 flex-wrap">
    <Row className="mt-2 d-flex flex-wrap w-100" style={{ borderBottom: '2px solid #2c3e3f', paddingBottom: '0.5rem' }}>
      <Col>
        <Input style={{ fontFamily: 'monospace', fontSize: '0.875rem', ...colorProperties }} className="h-80" type="textarea" value={localTemplate} onChange={(e) => setLocalTemplate(e.target.value)} />
        <Button onClick={fuzzySearch} style={{ color: 'yellow' }} className="mt-2 w-100" color="success">Fuzzy Preview</Button>
      </Col>
      <Col onClick={() => console.log('test')} sm="2" className="d-flex flex-wrap justify-content-center align-items-center">
        <ImageUrlDropzone onUrlDrop={(imageURL) => setControlnetImage(imageURL)} />
        <Button style={{ maxHeight: '40px' }} className="w-100 h-50 mt-2" color="primary" onClick={pushQueue}>Try</Button>
      </Col>
      <Col>
        <p onClick={addTemplate} style={{ cursor: 'pointer', textAlign: 'center' }} className="w-100 color-white">{props.index + 1}</p>
        <pre>
          <PromptViewer prompt={ctx.buildPrompt(localTemplate)} />
        </pre>
      </Col>
    </Row>
  </div>
  )
}