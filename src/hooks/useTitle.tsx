import { useEffect } from "react";

export const useTitle = (title: string) => {
  const defaultTitle = "Ramadoka Home Page";
  const fullTitle = title ? `${title}` : defaultTitle;
  useEffect(() => {
    document.title = fullTitle;
  }, [title])
}