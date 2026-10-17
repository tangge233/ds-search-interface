/**
 * IP 文本地址判定。`localization` 参数只接受 IP 字面量，
 * 手动输入与自动获取（myip.ipip.net）共用这一套规则，避免两处判定不一致。
 */

/** 每段 0～255，且不接受前导零（`01` 在不同系统里会被当成八进制或直接拒绝）。 */
const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/

/**
 * IPv6 交给 URL 解析器判定：方括号里只接受 IPv6 字面量，
 * 非法地址（`::::`、超过 8 段、单段超过 4 位）构造时就会抛出，
 * 比手写正则可靠，也不用额外依赖。
 */
function isIPv6(value: string): boolean {
  if (!value.includes(':')) return false
  try {
    new URL(`http://[${value}]/`)
    return true
  } catch {
    return false
  }
}

export function isIpAddress(value: string): boolean {
  return IPV4.test(value) || isIPv6(value)
}
