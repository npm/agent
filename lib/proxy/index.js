'use strict'

const { InvalidProxyProtocolError } = require('../errors.js')
const HttpProxy = require('./http.js')
const NullProxy = require('./null.js')

const createProxy = ({ agent, proxy, secure }) => {
  if (!proxy) {
    return new NullProxy({ agent, secure })
  }

  const parsed = new URL(proxy)
  if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
    return new HttpProxy({ agent, url: parsed, secure })
  }

  throw new InvalidProxyProtocolError(parsed)
}

module.exports = createProxy
