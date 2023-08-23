'use strict'

const t = require('tap')

const { normalizeOptions } = require('../lib/options.js')

t.test('normalizeOptions', (t) => {
  t.test('family', (t) => {
    t.hasStrict(normalizeOptions({}), { family: 0 })
    t.hasStrict(normalizeOptions({ family: 4 }), { family: 4 })
    t.hasStrict(normalizeOptions({ family: '6' }), { family: 6 })
    t.end()
  })

  t.test('replaces timeout with timeouts.idle', (t) => {
    const options = normalizeOptions({ timeout: 100 })
    t.hasStrict(options, { timeouts: { idle: 100 } })

    t.end()
  })

  t.end()
})
