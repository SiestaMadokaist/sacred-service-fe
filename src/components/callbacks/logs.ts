export interface ICallbackLog {
  query?: Record<string, any>;
  params?: Record<string, any>;
  createdAt: number;
  url: string;
  headers?: Record<string, any>;
  body?: Record<string, any>;
  room: string;
}

export type LogRenderFlag = 'query' | 'params' | 'headers' | 'body' | 'url' | 'createdAt';

export class CallbackLog {
  constructor(private props: ICallbackLog) { }

  url(): string {
    return this.props.url;
  }

  createdAt(): string {
    return new Date(this.props.createdAt).toLocaleString();
  }

  headers(): string {
    return JSON.stringify(this.props.headers, null, 2);
  }

  body(): string {
    return JSON.stringify(this.props.body, null, 2);
  }

  query(): string {
    return JSON.stringify(this.props.query, null, 2);
  }

  params(): string {
    return JSON.stringify(this.props.params, null, 2);
  }

}


export type CallbackLogs = CallbackLog[]