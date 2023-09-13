'use strict'

const urlify = (url) => typeof url === 'string' ? new URL(url) : url

const appendPort = (host, port) => {
  // all our tests use a port
  // istanbul ignore next
  if (port) {
    host += `:${port}`
  }
  return host
}

module.exports = {
  urlify,
  appendPort,
}
