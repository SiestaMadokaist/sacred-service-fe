import axios, { AxiosInstance } from "axios";
import { IToast, useToast } from "../../../hooks/useToast";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { apiHub, initShowHub, ShowHub } from "../../../api/hub";
import { useApi } from "../../../hooks/useApi";
import { SYSTEM_ENV } from "../../../helper/env";
import useLocalStorage from "use-local-storage";
import { IVariables } from "@/api/dto/variables";
import { Controlnet, IRegionalPrompterArgs, Template, compilePrompt } from "./template";

export type SamplingMethod =
  | 'Euler'
  | 'Euler a'
  | 'DPM++ 2M'
  | 'DPM++ SDE'
  | 'DPM++ 2M Karras'
  | 'DPM++ SDE Karras'
  | 'DPM++ 2M SDE'
  | 'DPM++ 2M SDE Karras'
  | 'DDIM'
  | 'PLMS'
  | 'UniPC';

export type SamplingSchedule =
  | 'Automatic'
  | 'Karras'
  | 'Exponential'
  | 'Polyexponential'
  | 'SGM Uniform';

export const SAMPLING_METHODS: SamplingMethod[] = [
  'Euler',
  'Euler a',
  'DPM++ 2M',
  'DPM++ SDE',
  'DPM++ 2M Karras',
  'DPM++ SDE Karras',
  'DPM++ 2M SDE',
  'DPM++ 2M SDE Karras',
  'DDIM',
  'PLMS',
  'UniPC'
];

export const SAMPLING_SCHEDULES: SamplingSchedule[] = [
  'Automatic',
  'Karras',
  'Exponential',
  'Polyexponential',
  'SGM Uniform'
];



export interface IGenerate {
  negative_prompt: string;
  prompt: string;
  height: 1200 | 1000;
  width: 1000 | 1200;
  sampler_name: "DPM++ 2M Karras";
  seed: number;
  steps: 20 | 25 | 30;
  alwayson_scripts?: {
    controlnet?: Controlnet;
    "Regional Prompter"?: IRegionalPrompterArgs;
  }

}

// export interface IGenerateLandscape {
//   negative_prompt: string;
//   prompt: string;
//   sampler_name: "DPM++ 2M Karras";
//   seed: number;
//   steps: 20 | 25 | 30;
//   height: 1000;
//   width: 1200;
//   alwayson_scripts?: {
//     controlnet?: ITemplate['controlnet'];
//     "Regional Prompter"?: IRegionalPrompterArgs;
//   }
// }


interface IPromptingContext {
  variables: IVariables;
  promptPrefix: string;
  activeIndex: number;
  nIter: number;
  stepCount: number;
  subseedStrength: number;
  samplingMethod: SamplingMethod;
  samplingSchedule: SamplingSchedule;
  showImage: (imgURL: string) => void;
  setNIter: (nIter: number) => void;
  setSeed: (seed: number) => void;
  titles: string[];
  seed: number;
  setStepCount: (stepCount: number) => void;
  setSubseedStrength: (strength: number) => void;
  setSamplingMethod: (method: SamplingMethod) => void;
  setSamplingSchedule: (schedule: SamplingSchedule) => void;
  setVariables: (variables: Record<string, string>) => void;
  getPrompts: () => string;
  setTemplate: (index: number, template: Template) => void;
  addTemplate: (after: number, template: Template) => void;
  deleteTemplate: (index: number) => void;
  reorderTemplates: (oldIndex: number, newIndex: number) => void;
  templates: Template[];
  pushQueue: (ts: Template[]) => Promise<void>;
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
watermark, text, extra digits, extra finger, blood`;

export function PromptProvider(props: IPromptProvider): JSX.Element {
  const [hub] = useState(apiHub());
  const promptAPI = useApi(hub, '/prompts');
  const computeAPI = useApi(hub, '/computes/ap-southeast-2');
  const collectionAPI = useApi(hub, '/collections');
  const { toastElement, showToast } = useToast({ duration: 3000 });
  const [subseed] = useState<number>(-1);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [varCounts, setVarCounts] = useState<Record<string, number>>({});

  const [templates, _setTemplates] = useState<Template[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [nIter, setNIter] = useLocalStorage<number>('diffusions.nIter', 2);
  const [stepCount, setStepCount] = useLocalStorage<number>('diffusions.stepCount', 30);
  const [subseedStrength, setSubseedStrength] = useLocalStorage<number>('diffusions.subseedStrength', 0.2);
  const [samplingMethod, setSamplingMethod] = useLocalStorage<SamplingMethod>('diffusions.method', 'DPM++ 2M');
  const [samplingSchedule, setSamplingSchedule] = useLocalStorage<SamplingSchedule>('diffusions.schedule', 'Automatic');

  // Build sampler name: combine method and schedule, but only add schedule if it's not "Automatic"
  const samplerName = samplingSchedule === 'Automatic'
    ? samplingMethod
    : `${samplingMethod} ${samplingSchedule}`;

  const setTitle = () => {
    const globalCount: Record<string, number> = {};
    for (const template of templates) {
      template.tags().forEach((tag) => {
        globalCount[tag] = (globalCount[tag] ?? 0) + 1;
      });
    }
    setTitles(templates.map((template) => template.title(globalCount)));
  }

  useEffect(() => {
    setTitle();
  }, [templates]);

  const buildAlwaysOnScripts = (controlnet?: Controlnet, regPrompt?: IRegionalPrompterArgs): undefined | { controlnet?: Controlnet, "Regional Prompter"?: IRegionalPrompterArgs } => {
    if (controlnet && regPrompt) {
      return {
        controlnet, 
        "Regional Prompter": regPrompt
      }
    } else if (controlnet) {
      return { controlnet }
    } else if (regPrompt) {
      return { "Regional Prompter": regPrompt }
    } else {
      return undefined;
    }
  }
  const pushQueue = async (ts: Template[]) => {
    const prompts: Partial<IGenerate>[] = ts.map((x, index) => {
      const { positive, negative } = x.compiled(variables);
      const regPrompt = x.regionalPrompter();
      const alwayson_scripts = buildAlwaysOnScripts(x.controlnet(), regPrompt);
      const initialSeed = x.seed() ?? seed ?? -1;
      const finalSubseed = initialSeed === -1 ? -1 : (subseed + index);
      return {
        ...x.serialize(),
        ...x.size(),
        prompt: positive,
        negative_prompt: `${negative}\n${negativePrompt}`,
        alwayson_scripts,
        n_iter: nIter,
        seed: initialSeed,
        subseed: finalSubseed === -1 ? undefined : finalSubseed,
      };
    });
    const defaultConfig = {
      negative_prompt: negativePrompt,
      width: 1000,
      height: 1200,
      steps: stepCount,
      subseed: undefined,
      subseed_strength: subseedStrength,
      sampler_name: samplerName,
      seed: seed ?? Math.floor(Math.random() * 10_000_000),
    };
    const actionId = compilePrompt(templateId, variables);
    const params = {
      jobId: `${actionId}-${Date.now()}`,
      actionId,
      defaultConfig,
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

  const setTemplates = (newTemplates: Template[]) => {
    _setTemplates(newTemplates);
    const vars = updateVariables(newTemplates);
    const localVarCounts: Record<string, number> = {}
    for (const template of newTemplates) {
      const varKeys = Object.keys(vars);
      for (const v of varKeys) {
        if (template.source().includes(`{${v}}`)) {
          localVarCounts[v] = (localVarCounts[v] ?? 0) + 1;
        }
      }
    }
    setVarCounts(localVarCounts);
  }

  const updateVariables = (templates: Template[]): Record<string, string> => {
    const tplVars = detectVariables(templates.map((x) => x.source()).join('\n'));
    const oldVars = variables;
    const newVars: Record<string, string> = {};
    const sortedKeys = Object.keys(tplVars).sort((a, b) => a.localeCompare(b));
    for (const key of sortedKeys) {
      newVars[key] = oldVars[key] ?? '??';
    }
    setVariables(newVars);
    return newVars;
  }

  const addTemplate = (after: number, template: Template) => {
    if (after === templates.length) {
      setTemplates([...templates, template]);
      return;
    }
    const newTemplates = [...templates];
    newTemplates.splice(after, 0, template);
    setTemplates(newTemplates);
  }

  const setTemplate = (index: number, template: Template) => {
    if (index === templates.length) {
      setTemplates([...templates, template]);
      return;
    }
    setActiveIndex(index);
    const newTemplates = [...templates];
    newTemplates[index] = template;
    setTemplates(newTemplates);
  }

  const deleteTemplate = (index: number) => {
    const newTemplates = [...templates];
    newTemplates.splice(index, 1);
    setTemplates(newTemplates);
  }

  const reorderTemplates = (oldIndex: number, newIndex: number) => {
    const newTemplates = [...templates];
    const [removed] = newTemplates.splice(oldIndex, 1);
    newTemplates.splice(newIndex, 0, removed);
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
      const resp = await axios.get<{ templateId: string, templates: unknown[], variables: Record<string, string> }>(promptPath);
      const { data } = resp
      const vars = data.variables ?? {};
      const templates = (data.templates ?? []).map((t) => Template.deserialize(t));
      _setTemplates(templates);
      setVariables(vars);
    }
    action();
  }, [templateId])

  const [showHub, _] = useState<ShowHub>(initShowHub());
  const [seed, setSeed] = useState<number>(-1);
  const getPrompts = (): string => {
    return templates.map((x) => x.compiled(variables).positive).join('\n\n');
  }
  return (
    <PromptContext.Provider value={{
      variables,
      seed,
      setSeed,
      pushQueue,
      showImage: (imgURL: string) => {
        showHub.emit('show', imgURL);
      },
      varCounts,
      stepCount,
      subseedStrength,
      nIter,
      samplingMethod,
      samplingSchedule,
      setStepCount,
      setSubseedStrength,
      setNIter,
      setSamplingMethod,
      setSamplingSchedule,
      promptPrefix: PROMPT_PREFIX,
      activeIndex,
      templateId,
      setTemplate,
      addTemplate,
      deleteTemplate,
      titles,
      reorderTemplates,
      templates,
      setTemplateId,
      setVariables,
      getPrompts,
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