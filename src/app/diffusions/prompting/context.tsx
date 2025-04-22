import axios, { AxiosInstance } from "axios";
import { IToast, useToast } from "../../../hooks/useToast";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { apiHub } from "../../../api/hub";
import { useApi } from "../../../hooks/useApi";
import { SYSTEM_ENV } from "../../../helper/env";

export interface IGeneratePortrait {
  controlnet: {
    model: "illustriousXLCanny_v10 [40f566e5]";
    module: "canny";
    source: string;
  } | {};
  negative_prompt: string;
  prompt: string;
  sampler_name: "DPM++ 2M Karras";
  seed: number;
  steps: 20 | 25 | 30;
  height: 1200;
  width: 1000;
}

export interface IGenerateLandscape {
  controlnet?: {
    model: "illustriousXLCanny_v10 [40f566e5]";
    module: "canny";
    source: string;
  }
  negative_prompt: string;
  prompt: string;
  sampler_name: "DPM++ 2M Karras";
  seed: number;
  steps: 20 | 25 | 30;
  height: 1000;
  width: 1200;
}

export interface ITemplate {
  prompt: string;
  controlnet?: {
    source: string;
    module: "canny";
    model: "illustriousXLCanny_v10 [40f566e5]",
  }
  size?: {
    width: number;
    height: number;
  }
}

interface IPromptingContext {
  variables: Record<string, string>;
  promptPrefix: string;
  activeIndex: number;
  nIter: number;
  setNIter: (nIter: number) => void;
  setVariables: (variables: Record<string, string>) => void;
  getPrompts: () => string;
  buildPrompt: (template: string) => string;
  setTemplate: (index: number, template: ITemplate) => void;
  addTemplate: (after: number, template: ITemplate) => void;
  templates: ITemplate[];
  pushQueue: (ts: ITemplate[]) => Promise<void>;
  varCounts: Record<string, number>;
  collectionAPI: AxiosInstance;
  computeAPI: AxiosInstance;
  promptAPI: AxiosInstance;
  toastElement: JSX.Element;
  showToast: (params: IToast) => void;
  templateId: string;
  setTemplateId: (templateId: string) => void;
}
export const PromptContext = createContext<IPromptingContext | null>(null);

const { PROMPT_PREFIX } = SYSTEM_ENV
interface IPromptProvider {
  children: ReactNode;
}

const negativePrompt = `lowres, worst aesthetic, bad quality, worst quality, bad anatomy, jpeg artifacts, scan artifacts, 
lossy-lossless, unfinished, ugly, poorly drawn, greyscale, 
(illustration, 2d, 2.5D, 3d, painting \(medium\), toon \(style\), sketch, comic, anime,flat color,outline,smooth skin:1.2) 
watermark, text, extra digits, female face out of frame`;

export function PromptProvider(props: IPromptProvider): JSX.Element {
  const [hub] = useState(apiHub());
  const promptAPI = useApi(hub, '/prompts');
  const computeAPI = useApi(hub, '/computes');
  const collectionAPI = useApi(hub, '/collections');
  const { toastElement, showToast } = useToast({ duration: 3000 });
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [varCounts, setVarCounts] = useState<Record<string, number>>({});

  const [templates, _setTemplates] = useState<ITemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [nIter, setNIter] = useState<number>(1);

  const pushQueue = async (ts: ITemplate[]) => {
    const prompts: IGeneratePortrait[] = ts.map((x) => ({
      prompt: buildPrompt(x.prompt),
      controlnet: x.controlnet ?? {},
      negative_prompt: negativePrompt,
      width: 1000,
      height: 1200,
      steps: 20,
      sampler_name: 'DPM++ 2M Karras',
      seed: -1,
      n_iter: nIter,
    }));
    const params = {
      jobId: `${templateId}-${Date.now()}`,
      actionId: `${templateId}`,
      resource: prompts,
    }
    await promptAPI.post('/queue', params);
  }

  const detectVariables = (tpl: string) => {
    const matches = tpl.match(/{(.*?)}/g) || [];
    const keys = matches.map((v) => v.replace(/[{}]/g, "").trim());
    const tplVars: Record<string, string> = {};
    for (const key of keys) {
      tplVars[key] = '??';
    }
    return tplVars;
  };

  const setTemplates = (templates: ITemplate[]) => {
    const localVarCounts: Record<string, number> = {}
    for (const template of templates) {
      const varKeys = Object.keys(variables);
      for (const v of varKeys) {
        if (template.prompt.includes(`{${v}}`)) {
          localVarCounts[v] = (localVarCounts[v] ?? 0) + 1;
        }
      }
    }
    setVarCounts(localVarCounts);
    _setTemplates(templates);
    updateVariables();
  }

  const updateVariables = () => {
    const tplVars = detectVariables(templates.map((x) => x.prompt).join('\n'));
    const oldVars = variables;
    const newVars: Record<string, string> = {};
    const sortedKeys = Object.keys(tplVars).sort((a, b) => a.localeCompare(b));
    for (const key of sortedKeys) {
      newVars[key] = oldVars[key] ?? '??';
    }
    console.log({ newVars, oldVars })
    setVariables(newVars);
  }

  const addTemplate = (after: number, template: ITemplate) => {
    if (after === templates.length) {
      setTemplates([...templates, template]);
      return;
    }
    const newTemplates = [...templates];
    newTemplates.splice(after, 0, template);
    setTemplates(newTemplates);
  }

  const setTemplate = (index: number, template: ITemplate) => {
    if (index === templates.length) {
      setTemplates([...templates, template]);
      return;
    }
    setActiveIndex(index);
    const newTemplates = [...templates];
    newTemplates[index] = template;
    setTemplates(newTemplates);
  }

  useEffect(() => {
    hub.on('api-error', (err) => {
      showToast({ level: 'danger', show: true, title: `Error Code: ${err.statusCode}`, message: JSON.stringify(err.data) });
    })
    hub.on('api-success', (msg) => {
      showToast({ level: 'success', show: true, title: `Success`, message: msg.message });
    })
  }, [])

  useEffect(() => {
    const action = async () => {
      if (!templateId) {
        return;
      }
      const promptPath = `${PROMPT_PREFIX}/${templateId}`;
      const resp = await axios.get<{ templateId: string, templates: ITemplate[], variables: Record<string, string> }>(promptPath);
      const { data } = resp
      const vars = data.variables ?? {};
      const templates = data.templates as ITemplate[];
      _setTemplates(templates);
      setVariables(vars);
    }
    action();
  }, [templateId])


  const buildPrompt = (template: string): string => {
    const prompts = template.replace(/{(.*?)}/g, (_, p1) => {
      const key = p1.trim();
      const value = variables[key];
      return value ?? `{${key}}`;
    });
    return prompts;
  }

  const getPrompts = (): string => {
    return templates.map((x) => x.prompt).map(buildPrompt).join('\n\n');
  }

  return (
    <PromptContext.Provider value={{
      variables,
      pushQueue,
      varCounts,
      nIter,
      setNIter,
      promptPrefix: PROMPT_PREFIX,
      activeIndex,
      templateId,
      setTemplate,
      addTemplate,
      templates,
      setTemplateId,
      setVariables,
      getPrompts,
      buildPrompt,
      promptAPI,
      computeAPI,
      collectionAPI,
      toastElement,
      showToast
    }}>
      {toastElement}
      {props.children}
    </PromptContext.Provider>
  )
}

export const usePromptContext = (): IPromptingContext => {
  const ctx = useContext(PromptContext);
  if (!ctx) {
    throw new Error('PromptContext is not defined');
  }
  return ctx;
}