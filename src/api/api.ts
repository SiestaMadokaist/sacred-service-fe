import axios, { AxiosError, AxiosInstance } from 'axios'
import Cookies from 'universal-cookie';
import { ApiHub, HTTPStatusCode } from './hub';
import { SYSTEM_ENV } from '../helper/env';
const AUTH_TOKEN = 'AUTH_TOKEN';
export type Resource = '/collections'
  | '/users'
  | '/investments'
  | '/computes'
  | '/trades'
  | '/prompts';
export type JWT = never;
export type ENV = 'production' | 'staging' | 'development';

export interface IAuth {
  token: string;
  exp: number;
  iat: number;
  sub: string;
  claim: any;
  sessionId: string;
}

const cookies = new Cookies(null, { path: '/' });

export const EsignAPI = (env: ENV, token: string) => {
  if (env === 'development') {
    const baseURL = SYSTEM_ENV.ESIGN_API_DEV;
    return axios.create({ baseURL, headers: { 'x-api-token': token } })
  } else if (env === 'production') {
    const baseURL = SYSTEM_ENV.ESIGN_API_PROD;
    return axios.create({ baseURL, headers: { 'x-api-token': token } })
  }
  throw new Error(`Invalid environment: ${env}`);
}

export const getAuth = (): IAuth => {
  const token: string = cookies.get(AUTH_TOKEN);
  const exp = parseInt(cookies.get('user.exp') ?? 0);
  const iat = parseInt(cookies.get('user.iat') ?? 0);
  const sub = cookies.get('user.sub') ?? '';
  const sessionId = cookies.get('user.sessionId') ?? '';
  return { token, exp, iat, sub, claim: {}, sessionId };
}

export const setAuth = (auth: IAuth) => {
  const token = auth?.token ?? '';
  if (token === '') {
    cookies.remove(AUTH_TOKEN);
    return;
  }
  cookies.set(AUTH_TOKEN, auth.token);
  cookies.set('user.exp', auth.exp.toString());
  cookies.set('user.iat', auth.iat.toString());
  cookies.set('user.sub', auth.sub);
  cookies.set('user.claim', JSON.stringify(auth.claim));
  cookies.set('user.sessionId', auth.sessionId);
}

export const apiLambda = (prefix: Resource, hub: ApiHub, auth: IAuth): AxiosInstance => {
  const hostURL = SYSTEM_ENV.HORNY_API;
  const instance = axios.create({
    baseURL: `${hostURL}${prefix}`,
    headers: { Authorization: auth.token }
  });
  instance.interceptors.request.use((config) => {
    const token = auth.token;
    config.headers.Authorization = token;
    return config;
  });
  instance.interceptors.response.use((config) => {
    const statusCode = config.status as HTTPStatusCode;
    const endpoint = config.config.url ?? '/???';
    const message: string = `${config.config.method} ${prefix}${endpoint}: ${statusCode}`
    hub.emit('api-success', { statusCode, endpoint, message });
    return config;
  }, (err: AxiosError) => {
    const statusCode = (err?.response?.status ?? 0) as HTTPStatusCode;
    const endpoint = err?.config?.url ?? '/???';
    const data = err?.response?.data ?? {};
    hub.emit('api-error', { statusCode, endpoint, data });
    throw err;
  })
  return instance;
} 