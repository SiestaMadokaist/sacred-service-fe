export interface ILabelize<T, K extends keyof T, V extends keyof T> {
  label?: K | ((t: T) => string);
  value?: V | ((t: T) => string);
}
export interface ILabbeling<T = string> {
  label: string;
  value: string;
  original: T
}
export type LabellingFn<T> = (t: T) => ILabbeling<T>
const defaultProps = { label: 'name', value: 'id' }

export function label<T, K extends keyof T, V extends keyof T>(props: ILabelize<T, K, V>): LabellingFn<T> {
  const normalizedProps = { ...defaultProps, ...props }
  return (t: T) => ({
    label: typeof props.label === 'function' ? props.label(t) : t[normalizedProps.label as keyof T] as string,
    value: typeof props.value === 'function' ? props.value(t) : t[normalizedProps.value as keyof T] as string,
    original: t
  })
}

