import { useEffect, useState } from "react";
import { usePromptContext } from "./context";
import assert from "assert";
import { useDebounce } from "use-debounce";
import { Input, InputGroup, InputGroupText, Row } from "reactstrap";
import { VariablePreview } from "./variable-preview";

export interface IVariableEditor {
  k: string;
  v: string;
}
const VariableEditor = (props: IVariableEditor): JSX.Element => {
  const ctx = usePromptContext();
  assert(ctx, 'PromptContext is not defined');

  const [value, setValue] = useState<string>(props.v ?? '');
  const [debouncedValue] = useDebounce(value, 1000);


  useEffect(() => {
    // const endWithComma = value.endsWith(',');
    const newValue = value.trim().replace(/\,$/, "");
    const newVars = { ...ctx.variables, [props.k]: newValue };
    ctx.setVariables(newVars);
  }, [debouncedValue]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
  }

  useEffect(() => {
    if (props.v !== value) {
      setValue(props.v);
    }
  }, [props.v]);

  const autoInsert = (key: string) => {
    const index = ctx.activeIndex;
    const template0 = ctx.templates[index];
    const template1 = template0.prompt.replaceAll(`{${key}}`, '');
    const newTemplate = `${template1}{${key}}`;
    ctx.setTemplate(index, { prompt: newTemplate, taskRepeat: template0.taskRepeat ?? 1 });
  }

  const [showPreview, setShowPreview] = useState(false);

  const onCountClicked = () => {
    setShowPreview(!showPreview);
  }

  // const bgColor = !endWithComma ? '#813' : 'white';
  return (<div className="w-100">
    <InputGroup className="mb-2 w-100">
      <InputGroupText className="w-15" onClick={onCountClicked} style={{ backgroundColor: '#ffc107', fontSize: '0.8em', cursor: 'pointer' }} >{ctx.varCounts[props.k]}x</InputGroupText>
      <InputGroupText onClick={() => autoInsert(props.k)} style={{ fontSize: '0.8em' }} className="w-30">
        <VariablePreview hide={() => setShowPreview(false)} name={props.k} value={value} isShown={showPreview} />
      </InputGroupText>
      <Input style={{ backgroundColor: 'white', color: 'black' }} type="text" value={value} onChange={onChange} />
    </InputGroup>
  </div>)

}

export const VariableEditors = (): JSX.Element => {
  const ctx = usePromptContext();
  assert(ctx, 'PromptContext is not defined');
  const { variables } = ctx;
  const keys = Object.keys(variables);
  return <div className="d-flex flex-column w-100">
    {keys.map((k) => (<VariableEditor k={k} key={k} v={variables[k]} />))}
  </div>
}