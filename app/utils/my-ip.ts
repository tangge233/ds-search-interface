import { isIpAddress } from '~/utils/ip-address'

/**
 * 本机公网 IP 查询（myip.ipip.net）。
 * 只在用户点「自动获取」时调用：请求发往第三方服务，不该在启动或每次搜索时悄悄进行，
 * 因此这里既不缓存也不轮询。
 */

const ENDPOINT = 'https://myip.ipip.net/json'
const TIMEOUT_MS = 8000

export interface PublicIp {
  ip: string
  /** 地区描述，例如「中国 江苏 南京」；接口没给出时为空字符串。 */
  location: string
}

/**
 * 解析响应。字段不符或 IP 不合法都算失败，
 * 避免把脏数据写进配置、再被搜索请求带出去。
 */
export function parsePublicIp(payload: unknown): PublicIp {
  if (typeof payload !== 'object' || payload === null || !('ret' in payload) || payload.ret !== 'ok') {
    throw new Error('myip: unexpected response')
  }

  const data = 'data' in payload ? payload.data : undefined
  if (typeof data !== 'object' || data === null || !('ip' in data) || typeof data.ip !== 'string') {
    throw new Error('myip: missing ip')
  }

  const ip = data.ip
  if (!isIpAddress(ip)) throw new Error('myip: invalid ip')

  const location = 'location' in data && Array.isArray(data.location)
    ? data.location.filter((part): part is string => typeof part === 'string' && part !== '').join(' ')
    : ''

  return { ip, location }
}

export async function fetchPublicIp(): Promise<PublicIp> {
  return parsePublicIp(await $fetch<unknown>(ENDPOINT, { timeout: TIMEOUT_MS }))
}
