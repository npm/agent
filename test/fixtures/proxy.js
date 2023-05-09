'use strict'

const { randomBytes } = require('crypto')
const { EventEmitter, once } = require('events')
const { join } = require('path')
const { readFileSync } = require('fs')
const http = require('http')
const https = require('https')
const net = require('net')
const tls = require('tls')

const OK_MSG = Buffer.from('HTTP/1.1 200 Connection Established\r\n\r\n')
const FAIL_MSG = Buffer.from('HTTP/1.1 500 Internal Server Error\r\n\r\n')
const NO_AUTH_MSG = Buffer.from('HTTP/1.1 401 Unauthorized\r\n\r\n')

const _onConnect = Symbol('Proxy._onConnect')
const _onConnection = Symbol('Proxy._onConnection')

class Proxy extends EventEmitter {
  constructor ({ auth, tls: _tls, family, failConnect } = {}) {
    super()
    this.family = typeof family === 'number' ? family : 0
    this.failConnect = !!failConnect
    this.auth = !!auth
    if (this.auth) {
      this.username = randomBytes(8).toString('hex')
      this.password = randomBytes(8).toString('hex')
    }
    this.tls = !!_tls
    this.server = this.tls
      ? https.createServer({
        key: readFileSync(join(__dirname, 'fake-key.pem')),
        cert: readFileSync(join(__dirname, 'fake-cert.pem')),
      })
      : http.createServer({})
    this.server.on('connect', (...args) => this[_onConnect](...args))
    if (this.tls) {
      this.server.on('secureConnection', (socket) => this[_onConnection](socket))
    } else {
      this.server.on('connection', (socket) => this[_onConnection](socket))
    }
    this.sockets = new Set()
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
    this.address = `http${this.tls ? 's' : ''}://`
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

  [_onConnect] (req, socket) {
    if (this.failConnect) {
      return socket.end(FAIL_MSG)
    }

    if (this.auth) {
      const auth = req.headers['proxy-authentication']
      const [username, password] = Buffer.from(auth, 'base64').toString().split(':')
      if (username !== this.username || password !== this.password) {
        return socket.end(NO_AUTH_MSG)
      }
    }

    const url = new URL(`http://${req.url}`)
    const connectOptions = {
      host: url.hostname,
      port: url.port,
      rejectUnauthorized: false,
    }

    const onConnect = () => {
      socket.write(OK_MSG, () => {
        socket.pipe(proxy)
        proxy.pipe(socket)
        socket.once('error', () => {
          proxy.end()
        })

        proxy.once('error', () => {
          socket.end()
        })
      })
    }

    const proxy = url.protocol === 'https:'
      ? tls.connect(connectOptions, onConnect)
      : net.connect(connectOptions, onConnect)
  }

  [_onConnection] (socket) {
    this.sockets.add(socket)
    socket.once('close', () => {
      this.sockets.delete(socket)
    })
  }
}

module.exports = Proxy
