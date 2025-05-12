import React, { useEffect, useState } from "react"
import { ITemplate, usePromptContext } from "./context";
import { Button, Col, Input, Label, Row } from "reactstrap";
import { useDebounce } from "use-debounce";
import { ImageUrlDropzone } from "../../../components/DragNDrop/ImageURLDropzone";
import { IconSquare } from "@tabler/icons-react";

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

  useEffect(() => {
    setOrientation(props.template.orientation ?? 'portrait');
  }, [ctx.templateId])

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
    ctx.setTemplate(props.index, { prompt: debouncedTemplate, ...resolution(), orientation, });
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
      nIter: 1,
      seed: -1,
    }
    const prompts: ITemplate[] = [...new Array(ctx.nIter)].map((x) => (updated))
    await ctx.pushQueue(prompts);
  }

  // const fuzzySearch = async () => {
  //   const prompt = ctx.buildPrompt(localTemplate);
  //   const qualifier = ctx.variables['qualifier'] ?? '';
  //   const promptWithoutQualifier = prompt.replace(qualifier, '');
  //   const cleanedPrompts = promptWithoutQualifier.replace(/[\n\r]/g, ' ').replace(/\s+/g, ' ');
  //   const resp = await ctx.collectionAPI.post('/fuzzy-filter', {
  //     tags: cleanedPrompts.split(',').map((x) => x.trim()),
  //   });
  //   if (resp.data.length > 0) {
  //     ctx.showImage(resp.data[0])
  //   }
  // }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      pushQueue();
    }
  }

  const onClick = (o: typeof orientation) => {
    return (e: React.MouseEvent) => {
      setOrientation(o);
      ctx.setTemplate(props.index, { ...ctx.templates[props.index], orientation, ...resolution(o) });
    }
  }

  return (<div className="d-flex w-100 flex-wrap">
    <Row className="mt-2 d-flex flex-wrap w-100" style={{ borderBottom: '2px solid #2c3e3f', paddingBottom: '0.5rem' }}>
      <Col>
        <Input onKeyDown={onKeyDown} style={{ fontFamily: 'monospace', fontSize: '0.875rem', ...colorProperties }} className="h-80" type="textarea" value={localTemplate} onChange={(e) => setLocalTemplate(e.target.value)} />
        <Button onClick={pushQueue} style={{ color: 'yellow' }} className="mt-2 w-100" color="success">Queue Single</Button>
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