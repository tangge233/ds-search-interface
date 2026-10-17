import { describe, expect, it } from 'vitest'
import { describeSearchError, SearchContractError } from '~/utils/search-error'

/** 模拟 $fetch 抛出的错误：一个带 status / data 的普通对象。 */
function fetchError(status?: number, message?: string) {
  return {
    status,
    data: message ? { error: { message, type: 'invalid_request_error' } } : undefined
  }
}

describe('describeSearchError', () => {
  it('已知状态码映射到文案 key 与可重试标记', () => {
    expect(describeSearchError(fetchError(401, 'Auth fails'))).toMatchObject({
      status: 401,
      titleKey: 'errors.status.401.title',
      hintKey: 'errors.status.401.hint',
      serverMessage: 'Auth fails',
      retryable: false
    })

    expect(describeSearchError(fetchError(429))).toMatchObject({
      status: 429,
      serverMessage: undefined,
      detailKey: 'errors.statusDetailMissing',
      retryable: true
    })

    // 400 与 500 的可重试判断不同，且 500 属于已知状态码。
    expect(describeSearchError(fetchError(400)).retryable).toBe(false)
    expect(describeSearchError(fetchError(500)).retryable).toBe(true)
  })

  it('未预期的状态码用带参数的通用标题', () => {
    expect(describeSearchError(fetchError(418))).toMatchObject({
      status: 418,
      titleKey: 'errors.httpTitle',
      titleParams: { status: 418 },
      detailKey: 'errors.unexpectedStatusDetail',
      hintKey: 'errors.unknownStatusHint',
      retryable: false
    })
    expect(describeSearchError(fetchError(502)).retryable).toBe(true)
  })

  it('没有状态码时按网络层失败处理', () => {
    expect(describeSearchError(new Error('Failed to fetch'))).toMatchObject({
      status: null,
      titleKey: 'errors.networkTitle',
      serverMessage: 'Failed to fetch',
      hintKey: 'errors.networkHint',
      retryable: true
    })
  })

  it('契约错误按原因码给出对应说明', () => {
    expect(describeSearchError(new SearchContractError('itemsMissingUrl'))).toMatchObject({
      status: null,
      titleKey: 'errors.contract.title',
      detailKey: 'errors.contract.itemsMissingUrl',
      hintKey: 'errors.contract.hint',
      retryable: false
    })
  })

  it('data 不是预期形状时不误取说明', () => {
    expect(describeSearchError({ status: 400, data: 'plain text' }).serverMessage).toBeUndefined()
    expect(describeSearchError({ status: 400, data: { error: { message: 42 } } }).serverMessage).toBeUndefined()
  })
})
