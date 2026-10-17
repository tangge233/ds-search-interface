import { endpoint, MODELS_PATH } from '~/utils/endpoint'

/** 校验结果：valid 表示 Key 可用，unknown 表示网络/代理等无法判定。 */
export type ApiKeyVerdict = 'valid' | 'invalid' | 'unknown'

export interface ApiKeyCheck {
  verdict: ApiKeyVerdict
  detail: string
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
    return { verdict: 'valid', detail: '凭据有效，可以开始搜索。' }
  } catch (error) {
    const status = (error as { status?: number } | null)?.status
    const message = (error as { data?: { error?: { message?: string } } } | null)?.data?.error?.message

    if (status === 401) return { verdict: 'invalid', detail: message || 'API Key 无效或已被删除。' }
    if (status === 402) return { verdict: 'invalid', detail: message || '账号余额不足，充值后即可搜索。' }
    if (typeof status === 'number') {
      return { verdict: 'unknown', detail: `接口返回 HTTP ${status}${message ? `：${message}` : ''}，无法确认 Key 状态。` }
    }
    return {
      verdict: 'unknown',
      detail: '请求没能发出（离线、代理或跨域被拒），可以直接尝试搜索。'
    }
  }
}
