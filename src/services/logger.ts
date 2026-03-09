import { Logtail } from '@logtail/browser'
import { getEnv } from '../utils/env'

const APP_ID = 'tsh_web'
const isDev = import.meta.env.DEV

let _logtail: Logtail | null = null
function getLogtail(): Logtail | null {
  if (!_logtail) {
    const token = getEnv('VITE_SOURCE_TOKEN')
    if (token) _logtail = new Logtail(token)
  }
  return _logtail
}

const baseCtx = {
  app: APP_ID,
  env: isDev ? 'development' : 'production',
}

type Ctx = Record<string, unknown>

export const logger = {
  info: (message: string, ctx?: Ctx) =>
    getLogtail()?.info(message, { ...baseCtx, ...ctx }) ?? Promise.resolve(),

  warn: (message: string, ctx?: Ctx) =>
    getLogtail()?.warn(message, { ...baseCtx, ...ctx }) ?? Promise.resolve(),

  error: (message: string, ctx?: Ctx) =>
    getLogtail()?.error(message, { ...baseCtx, ...ctx }) ?? Promise.resolve(),

  debug: (message: string, ctx?: Ctx) =>
    isDev ? getLogtail()?.debug(message, { ...baseCtx, ...ctx }) ?? Promise.resolve() : Promise.resolve(),

  /** Flush pending logs — call before page unload */
  flush: () => getLogtail()?.flush() ?? Promise.resolve(),
}
