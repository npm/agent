'use strict'

const t = require('tap')

const { normalizeOptions } = require('../lib/util.js')

t.test('normalizeOptions', (t) => {
  t.test('replaces timeout with timeouts.idle', (t) => {
    const options = normalizeOptions({ timeout: 100 })
    t.hasStrict(options, { timeouts: { idle: 100 } })

    t.end()
  })

  t.end()
})
