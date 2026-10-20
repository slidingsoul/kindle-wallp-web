import { describe, expect, it } from 'vitest'
import { parseLocation } from '../src/lib/route'

describe('parseLocation', () => {
  it('treats an empty hash as the home page', () => {
    expect(parseLocation('')).toEqual({ route: 'home', section: null })
  })

  it('treats plain anchors as home-page sections', () => {
    expect(parseLocation('#tool')).toEqual({ route: 'home', section: 'tool' })
    expect(parseLocation('#faq')).toEqual({ route: 'home', section: 'faq' })
  })

  it('recognises the legal routes', () => {
    expect(parseLocation('#/privacy')).toEqual({
      route: 'privacy',
      section: null,
    })
    expect(parseLocation('#/terms')).toEqual({ route: 'terms', section: null })
  })

  it('accepts trailing slashes', () => {
    expect(parseLocation('#/privacy/')).toEqual({
      route: 'privacy',
      section: null,
    })
  })

  it('keeps the section after a second hash', () => {
    expect(parseLocation('#/privacy#rights')).toEqual({
      route: 'privacy',
      section: 'rights',
    })
    expect(parseLocation('#/terms#liability')).toEqual({
      route: 'terms',
      section: 'liability',
    })
  })

  it('falls back to home for unknown paths', () => {
    expect(parseLocation('#/unknown')).toEqual({ route: 'home', section: null })
  })
})
