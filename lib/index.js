'use strict'

const { Agent: CoreHttpAgent, request: httpRequest } = require('http')
const { Agent: CoreHttpsAgent, request: httpsRequest } = require('https')

class TimeoutError extends Error {
  constructor (host) {
    super(`Timeout connecting to host: ${host}`)
    this.code = 'ETIMEDOUT'
  }
}

class InvalidProxyResponseError extends Error {
  constructor (statusCode) {
    super(`Invalid Proxy response: ${statusCode}`)
    this.code = 'EINVALIDRESPONSE'
  }
}

const applyMixin = (secure, base) => {
  return class extends base {
    constructor (options) {
      if (typeof options.keepAlive === 'undefined') {
        options.keepAlive = true
      }

      super(options)
      this.proxy = options.proxy && new URL(options.proxy)
    }

    createConnection (options, callback) {
      if (!this.proxy) {
        const socket = super.createConnection(options)
        if (this.keepAlive) {
          socket.setNoDelay(true)
        }
        return socket
      }

      const requestOptions = {
        method: 'CONNECT',
        host: this.proxy.hostname,
        port: this.proxy.port,
        servername: this.proxy.hostname,
        path: `${options.host}:${options.port}`,
        setHost: false,
        agent: false,
        timeout: this.options.timeout,
        headers: {
          connection: this.keepAlive ? 'keep-alive' : 'close',
          host: `${options.host}:${options.port}`,
        },
        rejectUnauthorized: this.options.rejectUnauthorized,
      }

      if (this.proxy.username || this.proxy.password) {
        const username = decodeURIComponent(this.proxy.username)
        const password = decodeURIComponent(this.proxy.password)
        requestOptions.headers['proxy-authentication'] =
          Buffer.from(`${username}:${password}`).toString('base64')
      }

      const onConnect = (res, socket) => {
        req.removeListener('error', onError)
        req.removeListener('timeout', onTimeout)
        if (res.statusCode === 200) {
          if (secure) {
            socket = super.createConnection({ ...options, socket })
          }
          if (this.keepAlive) {
            socket.setNoDelay(true)
          }
          return callback(null, socket)
        }

        return callback(new InvalidProxyResponseError(res.statusCode))
      }

      const onError = (err) => {
        req.removeListener('connect', onConnect)
        req.removeListener('timeout', onTimeout)
        return callback(err)
      }

      const onTimeout = () => {
        req.removeListener('connect', onConnect)
        // do not clear the error handler, it will catch this timeout and propagate the error
        return req.destroy(new TimeoutError(this.proxy.host))
      }

      const req = this.proxy.protocol === 'https:'
        ? httpsRequest(requestOptions)
        : httpRequest(requestOptions)

      req.once('connect', onConnect)
      req.once('error', onError)
      req.once('timeout', onTimeout)
      req.end()
    }
  }
}

const HttpAgent = applyMixin(false, CoreHttpAgent)
const HttpsAgent = applyMixin(true, CoreHttpsAgent)

module.exports = {
  HttpAgent,
  HttpsAgent,
}
