'use strict'

const { randomBytes } = require('crypto')
const { EventEmitter, once } = require('events')
const { readFileSync } = require('fs')
const { join } = require('path')
const http = require('http')
const https = require('https')

const _onConnection = Symbol('Server._onConnection')
const _onRequest = Symbol('Server._onRequest')

class Server extends EventEmitter {
  constructor ({ auth, tls, responseDelay, idleDelay, transferDelay } = {}) {
    super()
    this.responseDelay = responseDelay || 0
    this.idleDelay = idleDelay || 0
    this.transferDelay = transferDelay || 0
    // this.failIdle = !!failIdle
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
        rejectUnauthorized: false,
      })
      : http.createServer({})
    if (this.tls) {
      this.server.on('secureConnection', (socket) => this[_onConnection](socket))
    } else {
      this.server.on('connection', (socket) => this[_onConnection](socket))
    }
    this.server.on('request', (req, res) => this[_onRequest](req, res))
    this.sockets = new Set()
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

  async stop () {
    this.server.close()
    for (const socket of this.sockets) {
      socket.destroySoon()
    }

    const check = async () => {
      if (this.sockets.size) {
        await new Promise((resolve) => setImmediate(resolve))
        return check()
      }
    }

    return check()
  }

  [_onConnection] (socket) {
    this.sockets.add(socket)
    socket.once('close', () => {
      this.sockets.delete(socket)
    })
  }

  [_onRequest] (req, res) {
    if (this.auth) {
      const _auth = req.headers.authorization.slice('Basic '.length)
      const [username, password] = Buffer.from(_auth, 'base64').toString().split(':')
      if (username !== this.username || password !== this.password) {
        res.writeHead(401)
        return res.end()
      }
    }

    setTimeout(() => {
      if (!res.destroyed) {
        res.writeHead(200)
        setTimeout(() => {
          if (!res.destroyed) {
            res.write('O')
            setTimeout(() => {
              if (!res.destroyed) {
                res.end('K!')
              }
            }, this.transferDelay)
          }
        }, this.idleDelay)
      }
    }, this.responseDelay)
    // // failIdle tells us to never respond, which can trip all the types of timeouts
    // if (!this.failIdle) {
    //   res.writeHead(200)
    //   res.end('OK!')
    // }
  }
}

module.exports = Server
