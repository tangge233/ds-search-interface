/**
 * localStorage 读写助手。
 * 隐私模式、企业策略或存储配额都可能让 localStorage 直接抛错，
 * 因此所有访问都降级为「读失败给默认值 / 写失败静默丢弃」，绝不打断搜索流程。
 */

export function readString(key: string, fallback = ''): string {
  if (!import.meta.client) return fallback
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export function writeString(key: string, value: string): void {
  if (!import.meta.client) return
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    // 存储不可用时保持内存态即可。
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = readString(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    writeString(key, JSON.stringify(value))
  } catch {
    // 值不可序列化时忽略。
  }
}
