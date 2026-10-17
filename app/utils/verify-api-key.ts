import { readErrorStatus, readServerMessage } from '~/utils/fetch-error'
import { endpoint, MODELS_PATH } from '~/utils/endpoint'

/** 校验结果：valid 表示 Key 可用，unknown 表示网络/代理等无法判定。 */
export type ApiKeyVerdict = 'valid' | 'invalid' | 'unknown'

/** 本地兜底说明的 i18n key；有服务端原文时优先展示原文。 */
export type VerifyDetailKey =
  | 'verify.valid'
  | 'verify.invalidKey'
  | 'verify.insufficient'
  | 'verify.httpError'
  | 'verify.network'
  | 'verify.enterKeyFirst'
  | 'verify.failed'

export interface ApiKeyCheck {
  verdict: ApiKeyVerdict
  detailKey: VerifyDetailKey
  /** HTTP 状态码，`verify.httpError` 需要它插值。 */
  status?: number
  /** 服务端返回的原文，保留它本来的语言。 */
  serverMessage?: string
}

/**
 * 校验 API Key 是否可用。
 * 走 GET /models（与 Search 共用 Bearer 鉴权）：只验证账号凭据，
 * 不触发搜索，因此不会产生搜索计费——这是设计上的取舍，不是省一次请求。
 */
export async function verifyApiKey(key: string, baseUrl: string): Promise<ApiKeyCheck> {
  try {
    await $fetch(endpoint(baseUrl, MODELS_PATH), {
      headers: { Authorization: `Bearer ${key.trim()}` }
    })
    return { verdict: 'valid', detailKey: 'verify.valid' }
  } catch (error) {
    const status = readErrorStatus(error)
    const serverMessage = readServerMessage(error)

    if (status === 401) return { verdict: 'invalid', detailKey: 'verify.invalidKey', status, serverMessage }
    if (status === 402) return { verdict: 'invalid', detailKey: 'verify.insufficient', status, serverMessage }
    if (status !== null) return { verdict: 'unknown', detailKey: 'verify.httpError', status, serverMessage }
    return { verdict: 'unknown', detailKey: 'verify.network' }
  }
}
