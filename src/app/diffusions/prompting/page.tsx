"use client";
import { LoraManager } from "../../../components/LoraManager";
import { useTitle } from "../../../hooks/useTitle";
import { PromptProvider, usePromptContext } from "./context";
import { TemplateEditors } from "./template-editors";
import { TemplateSelector } from "./template-selector";
import { VariableEditors } from "./variable-editor";

function InnerPage(): JSX.Element {
  const { computeAPI } = usePromptContext();
  return (<div className="d-flex flex-wrap w-100 mt-2 justify-content-center">
    <div className="w-60">
      <TemplateSelector />
      <div className="mt-2 h-80vh">
        <TemplateEditors />
      </div>
    </div>
    <div className="w-1" />
    <div className="w-25 d-flex flex-wrap">
      <div className="w-100">
        <div style={{ maxHeight: '50vh' }} className="w-100">
          <LoraManager computeAPI={computeAPI} />
        </div>
        <div className="mt-2"></div>
        <VariableEditors />
      </div>
    </div>
  </div>)
}

export default function WrappedPage(): JSX.Element {
  useTitle("Prompting Page");
  return (
    <PromptProvider>
      <InnerPage />
    </PromptProvider>
  )
}