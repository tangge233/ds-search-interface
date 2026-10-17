/**
 * 接口地址与拼接。
 * 搜索与凭据校验必须落在同一个 base 上，所以常量和拼接只在这里写一次，
 * 避免「改了一处、漏了另一处」导致校验与搜索打到不同网关。
 */

export const DEFAULT_BASE_URL = 'https://api.deepseek.com'
export const SEARCH_PATH = '/v1/tools/search'
export const MODELS_PATH = '/models'

/** 用户填写的地址可能带尾斜杠，拼接前统一去掉，避免出现 `//v1/...`。 */
export function endpoint(baseUrl: string, path: string): string {
  return `${baseUrl.trim().replace(/\/+$/, '')}${path}`
}
