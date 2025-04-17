import { Col, Input, Row } from "reactstrap"
import { usePromptContext } from "./context"
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

export interface ITemplateInverter {
}
export const TemplateInverter = (): JSX.Element => {
  const ctx = usePromptContext();
  const { variables } = ctx;
  const keys = Object.keys(variables);
  const [inverted, setInverted] = useState<string>('');
  const [template, setTemplate] = useState<string>('');
  const [debouncedInverted] = useDebounce(inverted, 1000);

  useEffect(() => {
    let currentTemplate = debouncedInverted;
    for (const key of keys) {
      const value = variables[key];
      if (value.length <= 0) { continue; }
      currentTemplate = currentTemplate.replaceAll(value, `{${key}}`);
    }
    setTemplate(currentTemplate);
  }, [debouncedInverted]);

  const [flash, setFlash] = useState(false);
  
  const copy = async () => {
    await navigator.clipboard.writeText(template);
    setFlash(true);
    setTimeout(() => {
      setFlash(false);
    }, 1000);
  }
  const fontColor = flash ? '#07bdff' : 'white';
  return (
    <div className="d-flex flex-column w-100">
      <Input style={{ minHeight: '5em', fontFamily: 'monospace', fontSize: '0.875rem', }} className="w-100" type="textarea" value={inverted} onChange={(e) => setInverted(e.target.value)} />
      <div style={{ border: '1px white dotted' }} className="bg-white mt-2" />
      <div onClick={copy}>
        <pre style={{ fontSize: '0.875em', cursor: 'pointer', color: fontColor, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }} className="w-100 mt-2">
          {template}
        </pre>
      </div>
    </div>
    )

}