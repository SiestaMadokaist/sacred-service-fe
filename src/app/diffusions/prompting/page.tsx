"use client";
import { SYSTEM_ENV } from "../../../helper/env";
import { ShowcaseProvider } from "../../../hooks/useShowcase";
import { useTitle } from "../../../hooks/useTitle";
import { PromptProvider } from "./context";
import { TemplateEditors } from "./template-editors";
import { TemplateInverter } from "./template-inverter";
import { TemplateSelector } from "./template-selector";
import { VariableEditors } from "./variable-editor";

function InnerPage(): JSX.Element {
  return (<div className="d-flex flex-wrap w-100 mt-2 justify-content-center">
    <div className="w-70">
      <TemplateSelector />
      <div className="mt-2 h-90vh">
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
    <ShowcaseProvider fetchInterval={10_000} duration={20_000} refURL={`${SYSTEM_ENV.IMAGE_PREFIX}/public/latest.json`}>
      <PromptProvider>
        <InnerPage />
      </PromptProvider>
    </ShowcaseProvider>
  )
}