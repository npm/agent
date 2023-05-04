'use strict'

class InvalidProxyProtocolError extends Error {
  constructor (url) {
    super(`Invalid Proxy protocol: ${url.protocol}`)
    this.code = 'EINVALIDPROXY'
  }
}

class InvalidProxyResponseError extends Error {
  constructor (statusCode) {
    super(`Invalid Proxy response: ${statusCode}`)
    this.code = 'EINVALIDRESPONSE'
  }
}

class ConnectionTimeoutError extends Error {
  constructor (host) {
    super(`Timeout connecting to host: ${host}`)
    this.code = 'ECONNECTIONTIMEOUT'
  }
}

class IdleTimeoutError extends Error {
  constructor (host) {
    super(`Idle timeout reached for host: ${host}`)
    this.code = 'EIDLETIMEOUT'
  }
}

class ResponseTimeoutError extends Error {
  constructor (host) {
    super(`Response timeout from proxy: ${host}`)
    this.code = 'ERESPONSETIMEOUT'
  }
}

class TransferTimeoutError extends Error {
  constructor (host) {
    super(`Transfer timeout from proxy: ${host}`)
    this.code = 'ETRANSFERTIMEOUT'
  }
}

module.exports = {
  InvalidProxyProtocolError,
  InvalidProxyResponseError,
  ConnectionTimeoutError,
  IdleTimeoutError,
  ResponseTimeoutError,
  TransferTimeoutError,
}
