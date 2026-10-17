import { describe, expect, it } from 'vitest'
import { isIpAddress } from '~/utils/ip-address'
import { parsePublicIp } from '~/utils/my-ip'

describe('parsePublicIp', () => {
  it('取出 ip 与地区，跳过接口里的空占位', () => {
    expect(
      parsePublicIp({ ret: 'ok', data: { ip: '222.94.33.225', location: ['中国', '江苏', '南京', '', '电信'] } })
    ).toEqual({ ip: '222.94.33.225', location: '中国 江苏 南京 电信' })
  })

  it('地区缺失或不是数组时留空', () => {
    expect(parsePublicIp({ ret: 'ok', data: { ip: '::1' } })).toEqual({ ip: '::1', location: '' })
    expect(parsePublicIp({ ret: 'ok', data: { ip: '::1', location: '中国' } })).toEqual({ ip: '::1', location: '' })
  })

  it('ret 不是 ok、缺 ip、ip 不合法时抛错', () => {
    const payloads = [
      { ret: 'fail' },
      { ret: 'ok', data: {} },
      { ret: 'ok', data: { ip: 'not-an-ip' } },
      { ret: 'ok', data: null },
      null,
      'text',
      { data: { ip: '1.2.3.4' } }
    ]
    for (const payload of payloads) {
      expect(() => parsePublicIp(payload)).toThrow()
    }
  })
})

describe('isIpAddress', () => {
  it('接受 IPv4 与 IPv6', () => {
    expect(isIpAddress('203.0.113.10')).toBe(true)
    expect(isIpAddress('::1')).toBe(true)
    expect(isIpAddress('2001:db8::1')).toBe(true)
  })

  it('拒绝主机名与畸形地址', () => {
    for (const value of ['example.com', '999.1.1.1', '::::', '1.2.3', '']) {
      expect(isIpAddress(value), value).toBe(false)
    }
  })
})
