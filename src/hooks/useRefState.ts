import { useRef, useState, useCallback } from 'react';

export function useRefState<T>(defaultValue: T): [T, (value: T) => void, React.MutableRefObject<T>] {
  const [state, setState] = useState<T>(defaultValue);
  const ref = useRef<T>(defaultValue);

  const setBoth = useCallback((value: T) => {
    ref.current = value;
    setState(value);
  }, []);

  return [state, setBoth, ref];
}
