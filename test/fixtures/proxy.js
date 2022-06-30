'use strict'

const { randomBytes } = require('crypto')
const { EventEmitter, once } = require('events')
const { join } = require('path')
const { readFileSync } = require('fs')
const http = require('http')
const https = require('https')
const net = require('net')

const OK_MSG = Buffer.from('HTTP/1.1 200 Connection Established\r\n\r\n')
const FAIL_MSG = Buffer.from('HTTP/1.1 500 Internal Server Error\r\n\r\n')
const NO_AUTH_MSG = Buffer.from('HTTP/1.1 401 Unauthorized\r\n\r\n')
const _onConnect = Symbol('proxy._onConnect')

class Proxy extends EventEmitter {
  constructor ({ auth, tls, failConnect, failTimeout } = {}) {
    super()
    this.failConnect = !!failConnect
    this.failTimeout = !!failTimeout
    this.auth = !!auth
    if (this.auth) {
      this.username = randomBytes(8).toString('hex')
      this.password = randomBytes(8).toString('hex')
    }
    this.tls = !!tls
    this.server = this.tls
      ? https.createServer({
        key: readFileSync(join(__dirname, 'fake-key.pem')),
        cert: readFileSync(join(__dirname, 'fake-cert.pem')),
      })
      : http.createServer({})
    this.server.on('connect', (...args) => this[_onConnect](...args))
    this.server.on('connection', (socket) => this.sockets.push(socket))
    this.sockets = []
  }

  async start () {
    this.server.listen(0, 'localhost')
    await once(this.server, 'listening')

    const address = this.server.address()
    this.address = `http${this.tls ? 's' : ''}://`
    if (this.auth) {
      this.address += `${this.username}:${this.password}@`
    }
    this.address += `localhost:${address.port}`

    return this
  }

  stop () {
    this.server.close()
    return once(this.server, 'close')
  }

  [_onConnect] (req, socket) {
    if (this.failConnect) {
      return socket.end(FAIL_MSG)
    }

    // if we want a timeout, just do nothing at all
    if (this.failTimeout) {
      return
    }

    if (this.username && this.password) {
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

    const proxy = net.connect(connectOptions, () => {
      socket.write(OK_MSG, () => {
        proxy.on('end', () => proxy.destroy())
        socket.pipe(proxy)
        proxy.pipe(socket)
      })
    })
  }
}

module.exports = Proxy
