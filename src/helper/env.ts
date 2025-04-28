const systemENV = {
  PRIMARY_API: process.env.NEXT_PUBLIC_PRIMARY_API,
  HORNY_API: process.env.NEXT_PUBLIC_HORNY_API,
  ESIGN_API_DEV: process.env.NEXT_PUBLIC_ESIGN_API_DEV,
  ESIGN_API_PROD: process.env.NEXT_PUBLIC_ESIGN_API_PROD,
  OSS_API: process.env.NEXT_PUBLIC_OSS_API,
  PROMPT_PREFIX: process.env.NEXT_PUBLIC_PROMPT_PREFIX,
  IMAGE_PREFIX: process.env.NEXT_PUBLIC_IMAGE_PREFIX,
  WS_ENDPOINT: process.env.NEXT_PUBLIC_WS_ENDPOINT,
}

type keys = keyof typeof systemENV;
const SystemENV = systemENV as Record<string, string>;
export const SYSTEM_ENV = SystemENV as Record<keys, string>;