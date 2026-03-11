import { describe, it, expect } from 'vitest'
import { cn } from '../lib/utils'

describe('cn', () => {
  it('handles a single string class', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('handles multiple string classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible')
  })

  it('merges conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles array input', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('handles object input', () => {
    expect(cn({ 'bg-red': true, 'bg-blue': false })).toBe('bg-red')
  })

  it('returns empty string for empty call', () => {
    expect(cn()).toBe('')
  })
})
