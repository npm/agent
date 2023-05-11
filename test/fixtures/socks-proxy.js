'use strict'

const { randomBytes } = require('crypto')
const { EventEmitter, once } = require('events')
const simpleSocks = require('simple-socks')

const _onHandshake = Symbol('SocksProxy._onHandshake')
const _onProxyConnect = Symbol('SocksProxy._onProxyConnect')

class SocksProxy extends EventEmitter {
  constructor ({ auth, tls: _tls, family, protocol, failConnect } = {}) {
    super()
    this.protocol = protocol || 'socks:'
    this.family = typeof family === 'number' ? family : 0
    this.failConnect = !!failConnect
    this.auth = !!auth
    if (this.auth) {
      this.username = randomBytes(8).toString('hex')
      this.password = randomBytes(8).toString('hex')
    }
    this.tls = !!_tls
    this.sockets = new Set()

    this.server = simpleSocks.createServer({
      authenticate: (username, password, socket, callback) => {
        if (!this.auth) {
          return callback()
        }

        if (username === this.username && password === this.password) {
          return callback()
        }

        return callback(new Error('Invalid auth'))
      },
    })

    this.server.on('handshake', (...args) => this[_onHandshake](...args))
    this.server.on('proxyConnect', (...args) => this[_onProxyConnect](...args))
  }

  async start () {
    let host
    if (this.family === 0) {
      host = 'localhost'
    } else if (this.family === 4) {
      host = '127.0.0.1'
    } else if (this.family === 6) {
      host = '::1'
    }

    this.server.listen({
      port: 0,
      host,
    })
    await once(this.server, 'listening')

    const address = this.server.address()
    this.address = `${this.protocol}//`
    if (this.auth) {
      this.address += `${this.username}:${this.password}@`
    }
    this.address += `localhost:${address.port}`

    return this
  }

  async stop () {
    this.server.close()
    for (const socket of this.sockets) {
      socket.destroy()
    }

    const check = async () => {
      if (this.sockets.size) {
        await new Promise((resolve) => setImmediate(resolve))
        return check()
      }
    }

    return check()
  }

  [_onHandshake] (socket) {
    this.sockets.add(socket)
    socket.once('close', () => {
      this.sockets.delete(socket)
    })
  }

  [_onProxyConnect] (info, destination) {
  }
}

module.exports = SocksProxy
