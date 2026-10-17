import type { LocalizationMode } from '~/utils/search-presets'

/**
 * 本地化 IP 的两种来源：自定义（手填）与自动获取（myip.ipip.net）。
 * 自动获取只在启动与切到「自动获取」时各请求一次，不重试、不轮询：
 * 公网 IP 很少变，反复请求只增加第三方流量。
 * 请求失败时保留原有 IP 继续用，不把用户已有的值清空。
 */

const detecting = ref(false)
const failed = ref(false)
let inFlight: Promise<void> | null = null

export function useLocalizationIp() {
  const { prefs } = useSearchSettings()

  /** 自动模式下刷新本机 IP 并写入配置；并发调用共享同一个请求。 */
  function syncAutoIp(): Promise<void> {
    if (prefs.localizationMode !== 'auto') return Promise.resolve()
    if (inFlight) return inFlight

    detecting.value = true
    failed.value = false
    inFlight = fetchPublicIp()
      .then((info) => {
        prefs.localization = info.ip
      })
      .catch(() => {
        failed.value = true
      })
      .finally(() => {
        detecting.value = false
        inFlight = null
      })
    return inFlight
  }

  /** 切换来源：切到自动立刻取一次；切回自定义时保留当前值当起点。 */
  async function setMode(mode: LocalizationMode) {
    prefs.localizationMode = mode
    if (mode === 'auto') {
      await syncAutoIp()
      return
    }
    failed.value = false
  }

  return { detecting, failed, syncAutoIp, setMode }
}
