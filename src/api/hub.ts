import { EventEmitter } from 'events';

export type HTTPStatusCode = 0 | 400 | 401 | 403 | 404 | 422 | 500 | 502 | 503;
export interface HubError<T = any> {
  statusCode: HTTPStatusCode;
  endpoint: string;
  data: T;
}

export interface HubSuccess {
  statusCode: HTTPStatusCode;
  endpoint: string;
  message: string;
}

export interface ApiHub extends EventEmitter {
  on(event: 'api-error', cb: (error: HubError) => void): this;
  on(event: 'api-success', cb: (success: HubSuccess) => void): this;
  emit(event: 'api-error', error: HubError): boolean;
  emit(event: 'api-success', data: HubSuccess): boolean;
}

export const apiHub = () => new EventEmitter() as ApiHub;