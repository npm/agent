'use strict'

const https = require('https')

const { normalizeOptions } = require('./util.js')
const createProxy = require('./proxy/index.js')

class HttpsAgent extends https.Agent {
  constructor (_options) {
    const options = normalizeOptions(_options)
    super(options)
    this.proxy = createProxy({ agent: this, proxy: options.proxy, secure: true })
  }

  createConnection (options, callback) {
    return this.proxy.createConnection(options, callback)
  }
}

module.exports = HttpsAgent
