import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('middleware Permissions-Policy header', () => {
  const middlewarePath = resolve(__dirname, '../../middleware.ts')
  const source = readFileSync(middlewarePath, 'utf-8')
  const permissionsLine = source
    .split('\n')
    .find((l) => l.includes('Permissions-Policy'))

  it('must allow geolocation for self origin', () => {
    expect(permissionsLine).toBeDefined()
    // `geolocation=()` blocks the API entirely, preventing the app from
    // requesting location even if the user grants permission in the browser.
    // Must be `geolocation=(self)` to allow the app's own origin.
    expect(permissionsLine).not.toContain('geolocation=()')
    expect(permissionsLine).toContain('geolocation=(self)')
  })

  it('must still restrict camera and microphone', () => {
    expect(permissionsLine).toContain('camera=()')
    expect(permissionsLine).toContain('microphone=()')
  })
})
