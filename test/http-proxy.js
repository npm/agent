'use strict'

const http = require('http')
const t = require('tap')

const Client = require('./fixtures/client.js')
const Proxy = require('./fixtures/proxy.js')
const Server = require('./fixtures/server.js')

t.test('http destination', (t) => {
  const HttpAgent = require('../lib/http.js')

  t.test('single request', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new Proxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.statusCode, 200)
    t.equal(res.headers.connection, 'keep-alive', 'keep-alive by default')
    t.equal(res.body, 'OK!')
    t.equal(res.req.agent, agent)
  })

  t.test('can disable keep-alive', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new Proxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ keepAlive: false, proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.statusCode, 200)
    t.equal(res.headers.connection, 'close', 'keep-alive disabled')
    t.equal(res.body, 'OK!')
    t.equal(res.req.agent, agent)
  })

  t.test('can limit sockets', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new Proxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ maxSockets: 1, proxy: proxy.address })
    const client = new Client(agent, server.address)

    // sockets are created asynchronously, so we have to send a single request first
    const initialRes = await client.get('/')
    t.equal(initialRes.statusCode, 200)
    t.equal(initialRes.headers.connection, 'keep-alive')
    t.equal(initialRes.body, 'OK!')
    t.equal(initialRes.req.agent, agent)

    const results = await Promise.all([
      client.get('/'),
      client.get('/'),
      client.get('/'),
      client.get('/'),
    ])

    for (const res of results) {
      t.equal(res.statusCode, 200)
      t.equal(res.headers.connection, 'keep-alive')
      t.equal(res.body, 'OK!')
      t.equal(res.req.agent, agent)
    }

    t.equal(proxy.sockets.size, 1, 'only made 1 connection to the proxy')
    t.equal(server.sockets.size, 1, 'only made 1 connection to the server')
  })

  t.test('invalid server auth resolves with 401', async (t) => {
    const server = new Server({ auth: true })
    await server.start()

    const proxy = new Proxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ proxy: proxy.address })
    const badServer = server.address.replace('@', 'broken@')
    const client = new Client(agent, badServer)

    // NOTE this does not cause the promise to reject, only to receive a 401 response
    const res = await client.get('/')
    t.equal(res.statusCode, 401)
    t.equal(res.req.agent, agent)
  })

  t.test('invalid proxy auth rejects', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new Proxy({ auth: true })
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    // proxy.address has credentials in it, intentionally break them
    const badProxy = proxy.address.replace('@', 'broken@')
    const agent = new HttpAgent({ proxy: badProxy })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), { code: 'EINVALIDRESPONSE' })
  })

  t.test('can send auth to proxy', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new Proxy({ auth: true })
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.statusCode, 200)
    t.equal(res.headers.connection, 'keep-alive', 'keep-alive by default')
    t.equal(res.body, 'OK!')
    t.equal(res.req.agent, agent)
  })

  t.test('can send auth to both proxy and server', async (t) => {
    const server = new Server({ auth: true })
    await server.start()

    const proxy = new Proxy({ auth: true })
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.statusCode, 200)
    t.equal(res.headers.connection, 'keep-alive', 'keep-alive by default')
    t.equal(res.body, 'OK!')
    t.equal(res.req.agent, agent)
  })

  t.test('non-200 response from proxy rejects', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new Proxy({ failConnect: true })
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ proxy: proxy.address })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), { code: 'EINVALIDRESPONSE' })
  })

  t.test('connection timeout rejects', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new Proxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    class MockRequest extends http.ClientRequest {
      // hijack end to be a no-op and the socket will never do anything
      end () {}
    }

    const MockedAgent = t.mock('../lib/http.js', {
      '../lib/proxy/index.js': t.mock('../lib/proxy/index.js', {
        '../lib/proxy/http.js': t.mock('../lib/proxy/http.js', {
          http: {
            ...http,
            request: (...opts) => {
              console.error('called mocked http.request')
            },
          },
        }),
      }),
    })

    const agent = new MockedAgent({ timeouts: { connection: 100 } })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), { code: 'ECONNECTIONTIMEOUT' })
  })

  t.end()
})

t.test('https destination', (t) => {
  t.end()
})
