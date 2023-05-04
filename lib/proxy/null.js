'use strict'

const net = require('net')
const tls = require('tls')

const {
  ConnectionTimeoutError,
  IdleTimeoutError,
  ResponseTimeoutError,
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

  addRequest (request, options) {
    if (this.agent.options.timeouts.response) {
      let responseTimeout

      const onFinish = () => {
        responseTimeout = setTimeout(() => {
          request.destroy(new ResponseTimeoutError())
        }, this.agent.options.timeouts.response)
      }

      const onResponse = () => {
        clearTimeout(responseTimeout)
      }

      request.once('finish', onFinish)
      request.once('response', onResponse)
    }
  }
}

module.exports = NullProxy
