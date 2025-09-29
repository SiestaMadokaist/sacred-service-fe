"use client";
import { useEffect } from "react";
import { Showcase } from "../../../components/showcase";
import { useTitle } from "../../../hooks/useTitle";
import { PromptProvider, usePromptContext } from "./context";
import { TemplateEditors } from "./template-editors";
import { TemplateSelector } from "./template-selector";
import { VariableEditors } from "./variable-editor";

function InnerPage(): JSX.Element {
  const ctx = usePromptContext();
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      await ctx.promptAPI.post(`/`, {
        templateId: ctx.templateId,
        templates: ctx.templates.filter((x) => x.prompt.length > 0),
        variables: ctx.variables,
      });
      event.preventDefault();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [])
  return (<div className="d-flex flex-wrap w-100 mt-2 justify-content-center">
    <div className="w-70">
      <TemplateSelector />
      <div className="mt-2 h-90vh">
        <TemplateEditors />
      </div>
    </div>
    <div className="w-1" />
    <div className="w-25 d-flex flex-wrap">
      <div style={{ scrollbarWidth: 'none' }} className="w-100 h-40vh d-flex flex-wrap mt-2 overflow-auto">
        <VariableEditors />
      </div>
      <div className="w-100 h-55vh">
        <Showcase onViewChanged={() => {}} collectionAPI={ctx.collectionAPI} onReport={() => {}} />
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