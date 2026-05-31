import { Memoizer } from "@/pkg/endfield/helper";

interface ITemplate {
  orientation?: "landscape" | "portrait";
  prompt: string;
  taskRepeat?: number;
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

export class Template {
    #memo = new Memoizer<{
        raw: [string, string, string];
    }>();
    constructor(private props: ITemplate) {}

    private raw(): [string, string, string] {
        const { prompt } = this.props;
        return this.#memo.memoize('raw', () => {
            // controlnet format: (r|c):1,1;1,1
            // e.g: r:1,1 or c:1,1o r c:1;1 etc
            const [positive, negative, controlnet] = prompt.split('---');
            return [positive ?? '', negative ?? '', controlnet ?? ''];
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

    private _controlnet(): string {
        const [_, __, c] = this.raw();
        return c;
    }

    controlnet(): ITemplate['controlnet'] {
        // buildAlwaysOnScripts(this._controlnet());
    }
}