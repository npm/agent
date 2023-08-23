'use strict'

const net = require('net')
const tls = require('tls')
const { Server, Proxy, Client } = require('./server.js')

const tlsType = (isTls) => `Http${isTls ? 's' : ''}`

const omit = (obj, ...keys) => {
  const res = {}
  for (const [k, v] of Object.entries(obj)) {
    if (!keys.includes(k)) {
      res[k] = v
    }
  }
  return res
}

class MockSocket extends net.Socket {
  // this looks strange, but it's because the socket receives a write
  // immediately after being created, and if the socket is not connected
  // or trying to connect, then we get an ERR_SOCKET_CLOSED. by making this
  // function a no-op we prevent the connection _and_ the error
  _writeGeneric () {}
}

const createSetup = ({ serverTls, proxyTls, ...baseOpts }) => {
  const hasProxy = typeof proxyTls === 'boolean' || Object.keys(baseOpts.proxy ?? {}).length
  const isSocks = baseOpts.proxy?.type === 'Socks'
  return {
    hasProxy,
    isSocks,
    setup: async (t, opts = {}) => {
      if (!opts.mock) {
        opts.mock = {}
      }

      let socket
      if (opts.mock.mockSocket) {
        t.comment('mock socket')
        delete opts.mock.mockSocket
        socket = new MockSocket()
        opts.mock[serverTls ? 'tls' : 'net'] = {
          ...[serverTls ? tls : net],
          connect: () => {
            return socket
          },
        }
      }

      const { cache, HttpsAgent, HttpAgent } = t.mock('../../lib/index.js', opts.mock)

      const serverType = tlsType(serverTls)
      const server = new Server[serverType](t, { ...baseOpts.server, ...opts.server })
      await server.start()
      t.comment(`Server: ${server.address}`)

      const agentOpts = { ...baseOpts.agent, ...opts.agent, rejectUnauthorized: false }

      let proxy
      if (hasProxy) {
        proxy = new Proxy[baseOpts.proxy?.type ?? `${tlsType(proxyTls)}To${serverType}`](t, {
          ...baseOpts.proxy,
          ...opts.proxy,
          httpAgent: new HttpAgent(omit(agentOpts, 'timeouts')),
          httpsAgent: new HttpsAgent(omit(agentOpts, 'timeouts')),
        })
        await proxy.start()
        t.comment(`Proxy: ${proxy.address}`)
      }

      const createAgent = (o) => new (serverTls ? HttpsAgent : HttpAgent)({
        ...(proxy && { proxy: proxy.address }),
        ...agentOpts,
        ...o,
      })
      const agent = createAgent()

      const createClient = (a = agent, address = server.address) => new Client(a, address, t)
      const client = createClient()

      t.teardown(async () => {
        await server.stop()
        if (proxy) {
          await proxy.stop()
        }
        cache.clear()
      })

      return {
        socket,
        server,
        proxy,
        agent,
        client,
        createAgent,
        createClient,
      }
    },
  }
}

module.exports = {
  createSetup,
}
