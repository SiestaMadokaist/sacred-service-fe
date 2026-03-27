import axios, { AxiosInstance } from "axios";
import { IToast, useToast } from "../../../hooks/useToast";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { apiHub, initShowHub, ShowHub } from "../../../api/hub";
import { useApi } from "../../../hooks/useApi";
import { SYSTEM_ENV } from "../../../helper/env";
import useLocalStorage from "use-local-storage";
import { IVariables } from "@/api/dto/variables";

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

type RATIO = `${number}${string|","}${number}`
interface IRegionalPrompterArgs {
  args: [
      true, // active
      false, // debug
      "Matrix" | "Mask" | "Prompt",
      "Horizontal" | "Vertical" | "Columns" | "Rows",
      "Mask" | null,
      "Prompt" | "Prompt-Ex",
      RATIO,
      "", // base ratio,
      false, // use base
      true, // use common
      boolean, // use neg-common
      "Attention" | "Latent", // prefer Attention,
      boolean, // change AND and BREAK
      "0", // lora text encoder (?)
      "0", // lora u-net
      "0",  // threshold
      "", // mask ?
      // "0", // lora stop step
      // "0", // lora hires stop step
      // false // flip 
  ]
}

// interface IControlnet {
//     model: "illustriousXLCanny_v10 [40f566e5]";
//     module: "canny";
//     source: string;
// }
export interface IGeneratePortrait {
  negative_prompt: string;
  prompt: string;
  sampler_name: "DPM++ 2M Karras";
  seed: number;
  steps: 20 | 25 | 30;
  height: 1200;
  width: 1000;
  alwayson_scripts?: {
    controlnet?: ITemplate['controlnet'];
    "Regional Prompter"?: IRegionalPrompterArgs;
  }

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
  alwayson_scripts?: {
    controlnet?: ITemplate['controlnet'];
    "Regional Prompter"?: IRegionalPrompterArgs;
  }
}

export interface ITemplate {
  orientation?: "landscape" | "portrait";
  prompt: string;
  nIter?: number;
  seed?: number;
  controlnet?: {
    source: string;
    module: "canny";
    model: "canny-il [a74daa41]",
  }
  size?: {
    width: number;
    height: number;
  }
}

interface IPromptingContext {
  variables: IVariables;
  promptPrefix: string;
  activeIndex: number;
  nIter: number;
  stepCount: number;
  samplingMethod: SamplingMethod;
  samplingSchedule: SamplingSchedule;
  showImage: (imgURL: string) => void;
  setNIter: (nIter: number) => void;
  setSeed: (seed: number) => void;
  seed: number;
  setStepCount: (stepCount: number) => void;
  setSamplingMethod: (method: SamplingMethod) => void;
  setSamplingSchedule: (schedule: SamplingSchedule) => void;
  setVariables: (variables: Record<string, string>) => void;
  getPrompts: () => string;
  buildPrompt: (template: string) => string;
  setTemplate: (index: number, template: ITemplate) => void;
  addTemplate: (after: number, template: ITemplate) => void;
  reorderTemplates: (oldIndex: number, newIndex: number) => void;
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

  const [templates, _setTemplates] = useState<ITemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [nIter, setNIter] = useLocalStorage<number>('diffusions.nIter', 2);
  const [stepCount, setStepCount] = useLocalStorage<number>('diffusions.stepCount', 30);
  const [samplingMethod, setSamplingMethod] = useLocalStorage<SamplingMethod>('diffusions.method', 'DPM++ 2M');
  const [samplingSchedule, setSamplingSchedule] = useLocalStorage<SamplingSchedule>('diffusions.schedule', 'Automatic');

  // Build sampler name: combine method and schedule, but only add schedule if it's not "Automatic"
  const samplerName = samplingSchedule === 'Automatic'
    ? samplingMethod
    : `${samplingMethod} ${samplingSchedule}`;

  const buildAlwaysOnScripts = (controlnet?: ITemplate['controlnet'], regPrompt?: IRegionalPrompterArgs): undefined | { controlnet?: ITemplate['controlnet'], "Regional Prompter"?: IRegionalPrompterArgs } => {
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
  const pushQueue = async (ts: ITemplate[]) => {
    const prompts: Partial<IGeneratePortrait>[] = ts.map((x, index) => {
      const prompt = buildPrompt(x.prompt);
      const negative = buildPrompt(x.prompt, { negative: true });
      const regPrompt = buildRegPrompt(x.prompt);
      const alwayson_scripts = buildAlwaysOnScripts(x.controlnet, regPrompt);
      const initialSeed = x.seed ?? seed ?? -1;
      const finalSubseed = initialSeed === -1 ? -1 : (subseed + index);
      return {
        ...x,
        prompt,
        negative_prompt: `${negative}\n${negativePrompt}`,
        alwayson_scripts,
        n_iter: x.nIter ?? nIter,
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
      subseed_strength: 0.2,
      sampler_name: samplerName,
      seed: seed ?? Math.floor(Math.random() * 10_000_000),
    };
    const actionId = buildPrompt(templateId);
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

  const setTemplates = (newTemplates: ITemplate[]) => {
    _setTemplates(newTemplates);
    const vars = updateVariables(newTemplates);
    const localVarCounts: Record<string, number> = {}
    for (const template of newTemplates) {
      const varKeys = Object.keys(vars);
      for (const v of varKeys) {
        if (template.prompt.includes(`{${v}}`)) {
          localVarCounts[v] = (localVarCounts[v] ?? 0) + 1;
        }
      }
    }
    setVarCounts(localVarCounts);
  }

  const updateVariables = (templates: ITemplate[]): Record<string, string> => {
    const tplVars = detectVariables(templates.map((x) => x.prompt).join('\n'));
    const oldVars = variables;
    const newVars: Record<string, string> = {};
    const sortedKeys = Object.keys(tplVars).sort((a, b) => a.localeCompare(b));
    for (const key of sortedKeys) {
      newVars[key] = oldVars[key] ?? '??';
    }
    setVariables(newVars);
    return newVars;
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
      const resp = await axios.get<{ templateId: string, templates: ITemplate[], variables: Record<string, string> }>(promptPath);
      const { data } = resp
      const vars = data.variables ?? {};
      const templates = data.templates as ITemplate[];
      _setTemplates(templates);
      setVariables(vars);
    }
    action();
  }, [templateId])

  const buildPrompt = (template: string, args: { negative: boolean } = { negative: false }): string => {
    const [tPos, tNeg, _regPrompt] = template.split('---');
    const t0 = args?.negative ? (tNeg ?? '') : tPos;
    const t = t0.split('\n').filter((x) => x.trim().startsWith('#') === false).join('\n');
    const prompts = t.replace(/<(.*?)>/g, (_, p1) => {
      const key = p1.trim();
      const value = variables[key];
      const name = value ?? `<${key}>`;
      return name.split(',').map((v) => v.trim())[0];
    }).replace(/{(.*?)}/g, (_, p1) => {
      const key = p1.trim();
      const value = variables[key];
      return value ? `(( ${value} ))` : `{${key}}`;
    });
    // split by comma or newline, trim spaces, to lower case, remove duplicates
    const lines = prompts.split('\n')
    const tagLines = lines.map(line => line.split(',').map((tag) => tag.trim()).filter(tag => tag.length > 0))
    const tagset = new Set<string>()
    const simplified: string[] = []
    const exceptions = ['addcol', 'addrow', 'addcomm'];
    for (const tags of tagLines) {
      for (const tag of tags) {
        const tl = tag.toLowerCase();
        if (exceptions.includes(tl)) {
          simplified.push(tag);
        } else if (!tagset.has(tl)) {
          tagset.add(tl);
          simplified.push(tag);
        }
      }
      simplified.push('\n');
    }
    const joined = simplified.join(', ').replaceAll(`\n, `, '\n').replaceAll(/,\s*\n/g, '\n').trim();
    return joined;
  }

  const buildRegPrompt = (template: string): IRegionalPrompterArgs | undefined => {
    const [_tPos, _tNeg, regPrompt] = template.split('---');
    if (!regPrompt) { return undefined; }
    if (regPrompt === '') { return undefined; }
    // sample format: (H|V|R|C):1,1;1,1
    const [orientation, ratio] = regPrompt.split(':').map((x) => x.trim())
    const [selectedOrientation] = ["Horizontal", "Vertical", "Rows", "Columns"]
      .filter((x) => x[0].toLowerCase() === orientation[0].toLowerCase()) as ["Horizontal"];
    console.log({ orientation, ratio, selectedOrientation })
    const args: IRegionalPrompterArgs['args'] = [
      true, // active
      false, // debug
      "Matrix",
      selectedOrientation,
      null, // mask
      "Prompt", // prompt
      ratio as "1,1", // ratio
      "", // base ratio
      false, // use base
      true, // use common
      false, // use neg-common
      "Attention", // prefer Attention
      true, // change AND and BREAK
      "0", // lora text encoder (?)
      "0", // lora u-net
      "0",  // threshold
      "0" as '', // mask ?
      // "0", // lora stop step
      // "0", // lora hires stop step
      // false // flip
    ]
    return { args };
  }

  const [showHub, _] = useState<ShowHub>(initShowHub());
  const [seed, setSeed] = useState<number>(-1);
  const getPrompts = (): string => {
    return templates.map((x) => x.prompt).map((x) => buildPrompt(x)).join('\n\n');
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
      nIter,
      samplingMethod,
      samplingSchedule,
      setStepCount,
      setNIter,
      setSamplingMethod,
      setSamplingSchedule,
      promptPrefix: PROMPT_PREFIX,
      activeIndex,
      templateId,
      setTemplate,
      addTemplate,
      reorderTemplates,
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