import type { ApiErrorBody } from '~/types/search'

/** 响应结构不符合接口契约时抛出（例如自建网关返回了别的 JSON）。 */
export class SearchContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SearchContractError'
  }
}

/** 一次失败搜索的可读解释：状态码 + 四段式说明，直接投喂 UAlert。 */
export interface SearchFailure {
  /** HTTP 状态码；网络层失败（离线 / DNS / CORS）时为 null。 */
  status: number | null
  title: string
  /** 服务端返回的原文，或本地兜底说明。 */
  detail: string
  /** 可操作的下一步。 */
  hint: string
  retryable: boolean
  /** 缺少 API Key 时置位，用于自动唤起设置面板。 */
  needsApiKey?: boolean
}

/** 官方错误码表：https://api-docs.deepseek.com/zh-cn/guides/search#错误 */
const STATUS_GUIDE: Record<number, { title: string; hint: string; retryable: boolean }> = {
  400: {
    title: '请求不合法',
    hint: '检查搜索词是否为 1～128 字符、搜索语法是否符合文档写法。',
    retryable: false
  },
  401: {
    title: 'API Key 无效',
    hint: '在设置中重新填写 API Key，确认它属于当前账号且未被删除。',
    retryable: false
  },
  402: {
    title: '账号余额不足',
    hint: 'Search 按成功请求计费（5 元 / 1000 次），充值后可直接重试。',
    retryable: false
  },
  403: {
    title: '请求被拒绝',
    hint: '接口安全策略拦下了本次请求，换个搜索词再试。',
    retryable: false
  },
  404: {
    title: '没有可用内容',
    hint: '目标资源不可用，调整搜索词后重试。',
    retryable: false
  },
  408: {
    title: '请求超时',
    hint: '等待几秒后重试。',
    retryable: true
  },
  413: {
    title: '请求体过大',
    hint: '精简搜索词与参数后重试。',
    retryable: false
  },
  429: {
    title: '请求过于频繁',
    hint: 'Search 限速为每账号 5 QPS，稍等片刻再搜索。',
    retryable: true
  },
  500: {
    title: '服务端内部错误',
    hint: '等待后重试；持续失败说明服务端异常。',
    retryable: true
  },
  504: {
    title: '下游请求超时',
    hint: '等待后重试。',
    retryable: true
  }
}

/**
 * 把 $fetch 抛出的错误统一翻译成用户能照做的提示。
 * 优先使用官方错误体里的 message（例如 401 会带上被拒的 Key 尾号），
 * 无状态码时按网络层失败处理——这是纯前端直连 API 最常见的故障（离线 / 代理 / CORS）。
 */
export function describeSearchError(error: unknown): SearchFailure {
  // 契约错误没有 HTTP 状态码，若不单独处理会被误判成网络层失败。
  if (error instanceof SearchContractError) {
    return {
      status: null,
      title: '接口响应格式异常',
      detail: error.message,
      hint: '确认 API 地址指向 DeepSeek Search 兼容接口，或让自建网关原样转发 results 字段。',
      retryable: false
    }
  }

  const rawStatus = (error as { status?: unknown } | null)?.status
  const status = typeof rawStatus === 'number' ? rawStatus : null
  const serverMessage = (error as { data?: ApiErrorBody } | null)?.data?.error?.message
  const guide = status === null ? undefined : STATUS_GUIDE[status]

  if (guide) {
    return {
      status,
      title: guide.title,
      detail: serverMessage || '接口未返回更详细的说明。',
      hint: guide.hint,
      retryable: guide.retryable
    }
  }

  if (status === null) {
    return {
      status: null,
      title: '无法连接到 DeepSeek API',
      detail: error instanceof Error ? error.message : String(error),
      hint: '确认网络可用；若经过代理或自定义 API 地址，该地址需允许浏览器跨域访问（CORS）。',
      retryable: true
    }
  }

  return {
    status,
    title: `请求失败（HTTP ${status}）`,
    detail: serverMessage || '接口返回了未预期的状态码。',
    hint: '稍后重试；若持续失败，可在设置中更换 API 地址。',
    retryable: status >= 500
  }
}
