'use strict'

const net = require('net')
const tls = require('tls')

const {
  ConnectionTimeoutError,
  IdleTimeoutError,
} = require('../errors.js')

class NullProxy {
  constructor ({ agent, secure }) {
    this.agent = agent
    this.secure = secure
  }

  createConnection (options, callback) {
    const socket = this.secure
      ? tls.connect(options)
      : net.connect(options)

    socket.setKeepAlive(this.agent.keepAlive, this.agent.keepAliveMsecs)
    socket.setNoDelay(this.agent.keepAlive)

    let connectionTimeout

    if (options.timeouts.connection) {
      connectionTimeout = setTimeout(() => {
        callback(new ConnectionTimeoutError())
      }, options.timeouts.connection)
    }

    if (options.timeouts.idle) {
      socket.setTimeout(options.timeouts.idle)
      socket.once('timeout', () => {
        socket.destroy(new IdleTimeoutError())
      })
    }

    socket.once('connect', () => {
      clearTimeout(connectionTimeout)
      callback(null, socket)
    })
  }
}

module.exports = NullProxy
