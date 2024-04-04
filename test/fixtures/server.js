'use strict'

const { randomBytes } = require('crypto')
const { EventEmitter, once } = require('events')
const net = require('net')
const { readFileSync } = require('fs')
const { join } = require('path')
const http = require('http')
const https = require('https')
const timers = require('timers/promises')
const fetch = require('minipass-fetch')
const socks = require('socksv5')

const parseAuthHeader = (header) => {
  const reqAuth = header.slice('Basic '.length)
  return Buffer.from(reqAuth, 'base64').toString().split(':')
}

class Server extends EventEmitter {
  #host
  #protocol
  #port
  #auth = ''
  #tls
  #sockets = new Set()
  #socketsCount = 0

  constructor (t, {
    auth,
    family,
    connectionEvent,
    tls: _tls,
    protocol = _tls ? 'https:' : 'http:',
    createServer = _tls ? (o) => https.createServer(o.tls) : () => http.createServer(),
  } = {}) {
    super()

    this.t = t
    this.t.comment(`created ${this.constructor.name}`)

    this.#protocol = protocol
    this.#host = {
      0: 'localhost',
      4: '127.0.0.1',
      6: '::1',
    }[family ?? 0]

    if (auth) {
      const username = randomBytes(8).toString('hex')
      const password = randomBytes(8).toString('hex')
      this.#auth = `${username}:${password}@`
      this.auth = (u, pw) => u === username && pw === password
    }

    this.#tls = !_tls ? null : {
      key: readFileSync(join(__dirname, 'fake-key.pem')),
      cert: readFileSync(join(__dirname, 'fake-cert.pem')),
    }

    this.server = createServer({ tls: this.#tls, auth: this.auth })
    const onConnection = connectionEvent ?? (this.#tls ? 'secureConnection' : 'connection')
    this.server.on(onConnection, this.#onConnection)
  }

  get sockets () {
    return this.#socketsCount
  }

  get address () {
    if (!this.#port) {
      throw new Error('server has not been started')
    }
    return `${this.#protocol}//${this.#auth}localhost:${this.#port}`
  }

  get hostAddress () {
    const ipv6 = net.isIPv6(this.#host)
    const host = ipv6 ? 'localhost' : this.#host
    return `${this.#protocol}//${this.#auth}${host}:${this.#port}`
  }

  async start () {
    this.server.listen(0, this.#host)
    await once(this.server, 'listening')
    this.#port = this.server.address().port
  }

  async stop () {
    this.server.close()

    for (const socket of this.#sockets) {
      socket.destroySoon()
    }

    while (this.#sockets.size) {
      await timers.setImmediate()
    }
  }

  #onConnection = (socket) => {
    this.t.comment(`${this.address} new socket tls:${!!this.#tls}`)
    if (!this.#sockets.has(socket)) {
      this.#socketsCount++
      this.#sockets.add(socket)
      socket.on('close', () => this.#sockets.delete(socket))
    }
  }
}

class HttpServer extends Server {
  #responseDelay
  #idleDelay
  #transferDelay

  constructor (t, { responseDelay, idleDelay, transferDelay, ...options } = {}) {
    super(t, options)

    this.#responseDelay = responseDelay ?? 0
    this.#idleDelay = idleDelay ?? 0
    this.#transferDelay = transferDelay ?? 0

    this.server.on('request', this.#onRequest)
  }

  #onRequest = async (req, res) => {
    this.t.comment(this.constructor.name, 'on request')

    if (this.auth && !this.auth(...parseAuthHeader(req.headers.authorization))) {
      res.writeHead(401)
      return res.end()
    }

    await timers.setTimeout(this.#responseDelay)
    if (!res.destroyed) {
      res.writeHead(200, {
        'X-Echo-Headers': JSON.stringify(req.rawHeaders),
      })
    }

    await timers.setTimeout(this.#idleDelay)
    if (!res.destroyed) {
      res.write('O')
    }

    await timers.setTimeout(this.#transferDelay)
    if (!res.destroyed) {
      res.end('K!')
    }
  }
}

class HttpsServer extends HttpServer {
  constructor (t, options) {
    super(t, { ...options, tls: true })
  }
}

class HttpProxy extends Server {
  #OK_MSG = Buffer.from('HTTP/1.1 200 Connection Established\r\n\r\n')
  #FAIL_MSG = Buffer.from('HTTP/1.1 500 Internal Server Error\r\n\r\n')
  #NO_AUTH_MSG = Buffer.from('HTTP/1.1 401 Unauthorized\r\n\r\n')

  #agent
  #failConnect
  #secure

  constructor (t, { agent, failConnect, secure, ...options } = {}) {
    super(t, options)

    if (this.auth) {
      const _auth = this.auth
      this.auth = (req) => _auth(...parseAuthHeader(req.headers['proxy-authorization']))
    }

    this.#agent = agent
    this.#failConnect = failConnect
    this.#secure = secure

    this.server.on('request', this.#onRequest)
    this.server.on('connect', this.#onConnect)
  }

  #onRequest = async (req, res) => {
    if (this.#failConnect) {
      res.writeHead(500)
      return res.end()
    }

    if (this.auth && !this.auth(req)) {
      res.writeHead(401)
      return res.end()
    }

    const [host, port] = req.headers.host.split(':')

    this.t.comment(`onRequest proxy request to ${host}:${port}`)

    const clientReq = (this.#secure ? https : http).request({
      agent: this.#agent,
      host,
      port,
      headers: req.headers,
      method: req.method,
    })

    let clientRes
    try {
      clientRes = await once(clientReq.end(), 'response').then(r => r[0])
    } catch (err) {
      res.writeHead(501)
      return res.end('proxy request error: ' + err.message)
    }

    res.writeHead(clientRes.statusCode, clientRes.headers)
    clientRes.pipe(res)
    clientRes.once('error', () => res.end())
  }

  #onConnect = async (req, socket) => {
    if (this.#failConnect) {
      return socket.end(this.#FAIL_MSG)
    }

    if (this.auth && !this.auth(req)) {
      return socket.end(this.#NO_AUTH_MSG)
    }

    const url = new URL(`http://${req.url}`)
    this.t.comment(`onConnect proxy request to ${url.hostname}:${url.port}`)

    // initial connection needs to use net socket to avoid TLS errors
    // https-proxy-agent then upgrades the socket to tls
    const proxy = net.connect({
      host: url.hostname,
      port: url.port,
      ...this.#agent.options,
    })

    try {
      await once(proxy, 'connect')
    } catch (err) {
      this.t.comment(err)
      return socket.end('whoops')
    }

    await new Promise((res) => socket.write(this.#OK_MSG, res))

    socket.pipe(proxy)
    proxy.pipe(socket)
    socket.once('error', () => proxy.end())
    proxy.once('error', () => socket.end())
  }
}

class HttpsToHttpProxy extends HttpProxy {
  constructor (t, options) {
    super(t, { ...options, tls: true, secure: false })
  }
}

class HttpToHttpsProxy extends HttpProxy {
  constructor (t, options) {
    super(t, { ...options, tls: false, secure: true })
  }
}

class HttpsProxy extends HttpProxy {
  constructor (t, options) {
    super(t, { ...options, tls: true, secure: true })
  }
}

class SocksProxy extends Server {
  constructor (t, { protocol = 'socks:', failConnect, ...options } = {}) {
    super(t, {
      ...options,
      protocol,
      createServer: ({ auth }) => socks.createServer({
        auths: [auth
          ? socks.auth.UserPassword((user, password, cb) => cb(auth(user, password)))
          : socks.auth.None()],
      }, (_, accept, deny) => failConnect ? deny() : accept())._srv,
    })
  }
}

class Client {
  constructor (agent, base, tap) {
    this.agent = agent
    this.base = base
    this.t = tap
  }

  async get (url) {
    const parsed = new URL(url, this.base)
    this.t.comment('client get', parsed.href)
    const res = await fetch(parsed.href, { agent: this.agent, rejectUnauthorized: false })
    res.result = await res.text()
    return res
  }
}

module.exports = {
  Server: {
    Http: HttpServer,
    Https: HttpsServer,
  },
  Proxy: {
    HttpToHttp: HttpProxy,
    HttpToHttps: HttpToHttpsProxy,
    HttpsToHttp: HttpsToHttpProxy,
    HttpsToHttps: HttpsProxy,
    Socks: SocksProxy,
  },
  Client,
}
