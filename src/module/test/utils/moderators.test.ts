import { describe, it, expect } from 'vitest'
import { isGoogleModerator, parseModeratorsRegex } from '../../src/runtime/server/utils/moderators'

describe('parseModeratorsRegex', () => {
  it('should treat blank values as unset', () => {
    expect(parseModeratorsRegex(undefined)).toBeUndefined()
    expect(parseModeratorsRegex(null)).toBeUndefined()
    expect(parseModeratorsRegex('')).toBeUndefined()
    expect(parseModeratorsRegex('   ')).toBeUndefined()
  })

  it('should throw on invalid patterns', () => {
    expect(() => parseModeratorsRegex('[')).toThrow(SyntaxError)
  })

  it('should coerce non-string values', () => {
    expect(parseModeratorsRegex(123)?.source).toBe('123')
  })

  it('should compile a case-insensitive, non-global regex', () => {
    const regex = parseModeratorsRegex('@foo\\.com$')
    expect(regex?.flags).toBe('i')
  })
})

describe('isGoogleModerator', () => {
  const regex = parseModeratorsRegex('@foo\\.com$')

  it('should authorize emails from the list', () => {
    expect(isGoogleModerator({ email: 'admin@bar.com' }, ['admin@bar.com'])).toBe(true)
  })

  it('should authorize verified emails matching the regex', () => {
    expect(isGoogleModerator({ email: 'jane@foo.com', email_verified: true }, [], regex)).toBe(true)
  })

  it('should match the regex case-insensitively', () => {
    expect(isGoogleModerator({ email: 'Jane@FOO.com', email_verified: true }, [], regex)).toBe(true)
  })

  it('should reject unverified emails matching the regex', () => {
    expect(isGoogleModerator({ email: 'jane@foo.com', email_verified: false }, [], regex)).toBe(false)
    expect(isGoogleModerator({ email: 'jane@foo.com' }, [], regex)).toBe(false)
  })

  it('should still authorize unverified emails from the list', () => {
    expect(isGoogleModerator({ email: 'jane@foo.com', email_verified: false }, ['jane@foo.com'], regex)).toBe(true)
  })

  it('should not match lookalike domains with an anchored regex', () => {
    expect(isGoogleModerator({ email: 'a@foo.com.evil.io', email_verified: true }, [], regex)).toBe(false)
  })

  it('should match lookalike domains with an unanchored regex', () => {
    const unanchored = parseModeratorsRegex('foo.com')
    expect(isGoogleModerator({ email: 'a@foo.com.evil.io', email_verified: true }, [], unanchored)).toBe(true)
  })

  it('should reject users without email', () => {
    const matchAll = parseModeratorsRegex('.*')
    expect(isGoogleModerator({ email_verified: true }, [], matchAll)).toBe(false)
    expect(isGoogleModerator({ email: '', email_verified: true }, [''], matchAll)).toBe(false)
  })

  it('should reject everyone when nothing is configured', () => {
    expect(isGoogleModerator({ email: 'jane@foo.com', email_verified: true }, [])).toBe(false)
  })

  it('should reject emails neither listed nor matching', () => {
    expect(isGoogleModerator({ email: 'jane@bar.com', email_verified: true }, ['admin@bar.com'], regex)).toBe(false)
  })
})
