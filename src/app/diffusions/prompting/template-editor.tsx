import React, { useEffect, useState } from "react"
import { usePromptContext } from "./context";
import { Col, Input, Row } from "reactstrap";
import { useDebounce } from "use-debounce";

export interface ITemplateEditor {
  index: number;
  template: string;
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
  const [localTemplate, setLocalTemplate] = useState<string>(props.template);
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
    setLocalTemplate(props.template);
  }, [props.template])

  const validateTemplate = (template: string) => {
    return !template.includes('},');
  }

  const [valid, setValid] = useState(true);
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
    ctx.setTemplate(props.index, localTemplate);
  }, [debouncedTemplate])
  const addTemplate = () => {
    const [firstLine] = localTemplate.split('\n');
    ctx.addTemplate(props.index + 1, firstLine ?? '--');
  }
  return (<Row className="mt-2 d-flex flex-wrap w-100">
    <Col onClick={addTemplate} sm="1" xs="1" style={{ width: '3ch', paddingRight: '0.5rem', color: 'white' }}>{props.index + 1}</Col>
    <Col>
      <Input style={{ fontFamily: 'monospace', fontSize: '0.875rem', ...colorProperties }} className="h-100" type="textarea" value={localTemplate} onChange={(e) => setLocalTemplate(e.target.value)} />
    </Col>
    <Col>
      <pre>
        <PromptViewer prompt={ctx.buildPrompt(localTemplate)} />
      </pre>
    </Col>
  </Row>)
}