/**
 * $fetch（ofetch）抛出的错误在类型上只是 unknown。
 * 搜索请求与凭据校验都要读同一组字段，收窄逻辑放这里一份，
 * 免得各处对未校验数据下断言。
 */

/** HTTP 状态码；网络层失败（离线 / DNS / CORS）时为 null。 */
export function readErrorStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('status' in error)) return null
  return typeof error.status === 'number' ? error.status : null
}

/** 取 OpenAI 兼容错误体里的 `error.message`；不是这个形状就当没有说明。 */
export function readServerMessage(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('data' in error)) return undefined
  const { data } = error
  if (typeof data !== 'object' || data === null || !('error' in data)) return undefined
  const body = data.error
  if (typeof body !== 'object' || body === null || !('message' in body)) return undefined
  return typeof body.message === 'string' ? body.message : undefined
}
