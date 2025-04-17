import { useEffect, useState } from "react";
import { usePromptContext } from "./context";
import assert from "assert";
import { useDebounce } from "use-debounce";
import { Input, InputGroup, InputGroupText, Row } from "reactstrap";

export interface IVariableEditor {
  k: string;
}
const VariableEditor = (props: IVariableEditor): JSX.Element => {
  const ctx = usePromptContext();
  assert(ctx, 'PromptContext is not defined');

  const [value, setValue] = useState<string>(ctx.variables[props.k] ?? '');
  const [debouncedValue] = useDebounce(value, 1000);

  const valid = value.endsWith(',');

  useEffect(() => {
    if (!valid) {
      ctx.showToast({ title: 'Invalid Variable', message: 'Variable must end with a comma', level: 'danger', show: true });
      return;
    }
    const newVars = { ...ctx.variables, [props.k]: value };
    ctx.setVariables(newVars);
  }, [debouncedValue]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
  }

  const bgColor = !valid ? '#813' : 'white';
  return (<div className="w-100">
    <InputGroup className="mb-2 w-100">
      <InputGroupText style={{ fontSize: '0.8em' }} className="w-30">{props.k}</InputGroupText>
      <Input style={{ backgroundColor: bgColor }} type="text" value={value} onChange={onChange} />
    </InputGroup>
  </div>)

}

export const VariableEditors = (): JSX.Element => {
  const ctx = usePromptContext();
  assert(ctx, 'PromptContext is not defined');
  const { variables } = ctx;
  const keys = Object.keys(variables);
  return <div className="d-flex flex-column w-100">
    {keys.map((k) => (<VariableEditor k={k} key={k} />))}
  </div>
}