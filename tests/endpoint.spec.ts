import { describe, expect, it } from 'vitest'
import { DEFAULT_BASE_URL, endpoint, MODELS_PATH, SEARCH_PATH } from '~/utils/endpoint'

describe('endpoint', () => {
  it('拼接默认地址与接口路径', () => {
    expect(endpoint(DEFAULT_BASE_URL, SEARCH_PATH)).toBe('https://api.deepseek.com/v1/tools/search')
    expect(endpoint(DEFAULT_BASE_URL, MODELS_PATH)).toBe('https://api.deepseek.com/models')
  })

  it('去掉用户填写的尾斜杠与空格，避免出现 //v1', () => {
    expect(endpoint('https://gw.example.com/', SEARCH_PATH)).toBe('https://gw.example.com/v1/tools/search')
    expect(endpoint('  https://gw.example.com///  ', MODELS_PATH)).toBe('https://gw.example.com/models')
  })
})
