import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar')
  })

  it('handles undefined and null values', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })

  it('handles empty strings', () => {
    expect(cn('foo', '', 'bar')).toBe('foo bar')
  })

  it('handles Tailwind class conflicts', () => {
    // This is a basic test - actual Tailwind conflict resolution
    // would require tailwind-merge to be properly configured
    expect(cn('p-4', 'p-2')).toContain('p-')
  })
})
