import { readErrorStatus, readServerMessage } from '~/utils/fetch-error'

/** 契约错误的原因码：具体文案由 i18n 的 `errors.contract.*` 决定。 */
export type ContractErrorReason = 'missingResults' | 'resultsNotArray' | 'itemsMissingUrl'

/** 响应结构不符合接口契约时抛出（例如自建网关返回了别的 JSON）。 */
export class SearchContractError extends Error {
  readonly reason: ContractErrorReason

  constructor(reason: ContractErrorReason) {
    super(reason)
    this.name = 'SearchContractError'
    this.reason = reason
  }
}

/**
 * 一次失败搜索的可读解释：状态码 + 四段式说明，直接投喂 UAlert。
 * 标题与建议保存的是 i18n key 而不是成品文案——语言可以在错误展示期间切换，
 * 成品文案做不到这一点；服务端原文则原样透传，它本来是哪种语言就是哪种。
 */
export interface SearchFailure {
  /** HTTP 状态码；网络层失败（离线 / DNS / CORS）时为 null。 */
  status: number | null
  titleKey: string
  titleParams?: Record<string, unknown>
  /** 服务端返回的原文，或浏览器给出的错误信息。 */
  serverMessage?: string
  /** 没有原文时展示的本地兜底说明。 */
  detailKey?: string
  /** 可操作的下一步。 */
  hintKey: string
  hintParams?: Record<string, unknown>
  retryable: boolean
  /** 缺少 API Key 时置位，用于自动唤起设置面板。 */
  needsApiKey?: boolean
}

/**
 * 有专门文案的状态码：https://api-docs.deepseek.com/zh-cn/guides/search#错误
 * 标题与建议的文案放在 `errors.status.<code>.*`，这里只记录是否值得重试。
 */
const STATUS_GUIDE: Record<number, { retryable: boolean }> = {
  400: { retryable: false },
  401: { retryable: false },
  402: { retryable: false },
  403: { retryable: false },
  404: { retryable: false },
  408: { retryable: true },
  413: { retryable: false },
  429: { retryable: true },
  500: { retryable: true },
  504: { retryable: true }
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
      titleKey: 'errors.contract.title',
      detailKey: `errors.contract.${error.reason}`,
      hintKey: 'errors.contract.hint',
      retryable: false
    }
  }

  const status = readErrorStatus(error)
  const serverMessage = readServerMessage(error)

  if (status === null) {
    return {
      status: null,
      titleKey: 'errors.networkTitle',
      serverMessage: error instanceof Error ? error.message : String(error),
      hintKey: 'errors.networkHint',
      retryable: true
    }
  }

  const guide = STATUS_GUIDE[status]
  if (guide) {
    return {
      status,
      titleKey: `errors.status.${status}.title`,
      serverMessage,
      detailKey: serverMessage ? undefined : 'errors.statusDetailMissing',
      hintKey: `errors.status.${status}.hint`,
      retryable: guide.retryable
    }
  }

  return {
    status,
    titleKey: 'errors.httpTitle',
    titleParams: { status },
    serverMessage,
    detailKey: serverMessage ? undefined : 'errors.unexpectedStatusDetail',
    hintKey: 'errors.unknownStatusHint',
    retryable: status >= 500
  }
}
