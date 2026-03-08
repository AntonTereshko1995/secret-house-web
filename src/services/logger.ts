import { Logtail } from '@logtail/browser'

const SOURCE_TOKEN = import.meta.env.VITE_SOURCE_TOKEN as string
const APP_ID = 'tsh_web'
const isDev = import.meta.env.DEV

const logtail = new Logtail(SOURCE_TOKEN)

const baseCtx = {
  app: APP_ID,
  env: isDev ? 'development' : 'production',
}

type Ctx = Record<string, unknown>

export const logger = {
  info: (message: string, ctx?: Ctx) =>
    logtail.info(message, { ...baseCtx, ...ctx }),

  warn: (message: string, ctx?: Ctx) =>
    logtail.warn(message, { ...baseCtx, ...ctx }),

  error: (message: string, ctx?: Ctx) =>
    logtail.error(message, { ...baseCtx, ...ctx }),

  debug: (message: string, ctx?: Ctx) =>
    isDev ? logtail.debug(message, { ...baseCtx, ...ctx }) : Promise.resolve(),

  /** Flush pending logs — call before page unload */
  flush: () => logtail.flush(),
}
