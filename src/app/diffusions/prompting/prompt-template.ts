import { IVariables } from "@/api/dto/variables";
import { Memoizer } from "@/pkg/endfield/memoizer";

interface ITemplate {
  orientation: "landscape" | "portrait";
  prompt: string;
  taskRepeat: number;
  seed?: number;
  controlnet?: {
    source: string;
    module: "canny";
    model: "canny-il [a74daa41]",
  }
}

// Controlnet is the public shape of a template's controlnet config. ITemplate
// itself stays private; consumers that need to reference the controlnet type
// (e.g. API payload types) import this instead.
export type Controlnet = NonNullable<ITemplate['controlnet']>;

type RATIO = `${number}${string|","}${number}`
export interface IRegionalPrompterArgs {
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

interface ISize {
    width: 1000 | 1200;
    height: 1000 | 1200;
}

const isTag = (x: string): boolean => {
    return x.match(/^[\w _]+$/) !== null;
}

export class Template {
    private _memo = new Memoizer<{
        raw: [string, string, string];
    }>();

    constructor(private props: ITemplate) {}

    private raw(): [string, string, string] {
        const { prompt } = this.props;
        return this._memo.memoize('raw', () => {
            // regional prompter format: (r|c):1,1;1,1
            // e.g: r:1,1 or c:1,1o r c:1;1 etc
            const [positive, negative, regionalPrompter] = prompt.split('---');
            return [positive ?? '', negative ?? '', regionalPrompter ?? ''];
        })
    }

    positive(): string {
        const [p] = this.raw();
        return p;
    }

    negative(): string {
        const [_, n,] = this.raw();
        return n;
    };

    // source returns the raw authored prompt (all sections, before compiling).
    source(): string {
        return this.props.prompt;
    }

    orientation(): "landscape" | "portrait" {
        return this.props.orientation ?? 'portrait';
    }

    taskRepeat(): number {
        return this.props.taskRepeat ?? 1;
    }

    seed(): number | undefined {
        return this.props.seed;
    }

    private _regionalPrompter(): string {
        const [_, __, c] = this.raw();
        return c;
    }

    update(p: Partial<ITemplate>): Template {
        return new Template({ ...this.props, ...p, });
    }

    controlnet(): ITemplate['controlnet'] {
        return this.props.controlnet;
    }

    regionalPrompter(): IRegionalPrompterArgs | undefined {
        const regPrompt = this._regionalPrompter();
        if (!regPrompt) {
            return undefined;
        }
        // sample format: (r|c):1,1;1,1
        const [orientation, ratio] = regPrompt.split(':').map((x) => x.trim());
        // @todo: check if typecasting is justified
        const [selectedOrientation] = ["Horizontal", "Vertical", "Rows", "Columns"]
            .filter((x) => x[0].toLowerCase() === orientation[0].toLowerCase()) as ["Horizontal"];
        const args: IRegionalPrompterArgs['args'] = [
            true, // active
            false, // debug
            "Matrix",
            selectedOrientation,
            null, // mask
            "Prompt", // prompt
            // @todo: check if typecasting is justified
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
            // @todo: check if typecasting is justified
            "0" as '', // mask ?
        ];
        return { args };
    }

    gptUserPrompt(): string {
        return this.positive();
    }

    // tags returns the unique tag set parsed from the positive section.
    tags(): Set<string> {
        const parsed = this.positive().split(/[,\n]+/).map((x) => x.trim()).filter(isTag);
        return new Set(parsed);
    }

    // title picks the 7 rarest tags (by cross-template frequency) as a label.
    // globalCount maps each tag to how many templates contain it.
    title(globalCount: Record<string, number>): string {
        const tags = Array.from(this.tags());
        tags.sort((a, b) => (globalCount[a] ?? 0) - (globalCount[b] ?? 0));
        return tags.slice(0, 7).join(', ');
    }

    compiled(vars: IVariables): { positive: string, negative: string } {
        return {
            positive: compilePrompt(this.positive(), vars),
            negative: compilePrompt(this.negative(), vars),
        };
    }

    size(): ISize {
        if (this.props.orientation === 'landscape') {
            return { width: 1200, height: 1000 };
        }
        return { width: 1000, height: 1200 };
    }

    serialize(): ITemplate {
        return { ...this.props };
    }

    static deserialize(raw: unknown): Template {
        // @todo: check if typecasting is justified
        return new Template(raw as ITemplate);
    }
}

// compilePrompt applies variable substitution and tag de-duplication to a
// single prompt section (positive/negative). It is intentionally section-less
// so it can be reused for non-template strings (e.g. templateId / actionId).
export function compilePrompt(text: string, vars: IVariables): string {
    const t = text.split('\n').filter((x) => x.trim().startsWith('#') === false).join('\n');
    const prompts = t.replace(/<(.*?)>/g, (_, p1) => {
        const key = p1.trim();
        const value = vars[key];
        const name = value ?? `<${key}>`;
        return name.split(',').map((v) => v.trim())[0];
    }).replace(/{(.*?)}/g, (_, p1) => {
        const key = p1.trim();
        const value = vars[key];
        return value ? `(( ${value} ))` : `{${key}}`;
    });
    // split by comma or newline, trim spaces, to lower case, remove duplicates
    const lines = prompts.split('\n');
    const tagLines = lines.map((line) => line.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0));
    const tagset = new Set<string>();
    const simplified: string[] = [];
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
    return simplified.join(', ').replaceAll(`\n, `, '\n').replaceAll(/,\s*\n/g, '\n').trim();
}