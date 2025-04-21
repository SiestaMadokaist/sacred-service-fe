"use client";
import { LoraManager } from "../../../components/LoraManager";
import { SYSTEM_ENV } from "../../../helper/env";
import { useShowcase } from "../../../hooks/useShowcase";
import { useTitle } from "../../../hooks/useTitle";
import { PromptProvider, usePromptContext } from "./context";
import { TemplateEditors } from "./template-editors";
import { TemplateInverter } from "./template-inverter";
import { TemplateSelector } from "./template-selector";
import { VariableEditors } from "./variable-editor";

function InnerPage(): JSX.Element {
  const { showcaseElement } = useShowcase({
    duration: 30_000,
    fetchInterval: 10_000,
    refURL: `${SYSTEM_ENV.IMAGE_PREFIX}/public/latest.json`,
  });
  return (<div className="d-flex flex-wrap w-100 mt-2 justify-content-center">
    {showcaseElement}
    <div className="w-70">
      <TemplateSelector />
      <div className="mt-2 h-80vh">
        <TemplateEditors />
      </div>
    </div>
    <div className="w-1" />
    <div className="w-25 d-flex flex-wrap">
      <div style={{ overflow: 'auto', scrollbarWidth: 'none' }} className="w-100 h-30vh">
        <TemplateInverter />
      </div>
      <div style={{ scrollbarWidth: 'none' }} className="w-100 h-62vh d-flex flex-wrap mt-2 overflow-auto">
        <VariableEditors />
      </div>
    </div>
  </div>)
}

export default function WrappedPage(): JSX.Element {
  useTitle("📝 Prompting Page ");
  return (
    <PromptProvider>
      <InnerPage />
    </PromptProvider>
  )
}