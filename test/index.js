'use strict'

const t = require('tap')

const HttpAgent = require('../lib/http.js')
const HttpsAgent = require('../lib/https.js')

t.test('http destination', (t) => {
  t.test('throws for incompatible proxy protocols', async (t) => {
    t.throws(() => {
      new HttpAgent({ proxy: 'foo://not-supported' })
    }, { code: 'EINVALIDPROXY' })
  })

  t.end()
})

t.test('https destination', (t) => {
  t.test('throws for incompatible proxy protocols', async (t) => {
    t.throws(() => {
      new HttpsAgent({ proxy: 'foo://not-supported' })
    }, { code: 'EINVALIDPROXY' })
  })

  t.end()
})
