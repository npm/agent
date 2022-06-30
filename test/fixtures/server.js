'use strict'

const { randomBytes } = require('crypto')
const { EventEmitter, once } = require('events')
const { readFileSync } = require('fs')
const { join } = require('path')
const http = require('http')
const https = require('https')

const _onRequest = Symbol('Server._onRequest')

class Server extends EventEmitter {
  constructor ({ auth, tls } = {}) {
    super()
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
    this.server.keepAlive = true
    this.server.keepAliveTimeout = 10
    this.server.on('request', (req, res) => this[_onRequest](req, res))
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

  [_onRequest] (req, res) {
    res.writeHead(200)
    res.end('OK!')
  }
}

module.exports = Server
