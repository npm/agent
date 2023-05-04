'use strict'

const normalizeOptions = (_options) => {
  const options = { ..._options }

  if (typeof options.keepAlive === 'undefined') {
    options.keepAlive = true
  }

  if (!options.timeouts) {
    options.timeouts = {}
  }

  if (options.timeout) {
    options.timeouts.idle = options.timeout
    delete options.timeout
  }

  return options
}

module.exports = {
  normalizeOptions,
}
