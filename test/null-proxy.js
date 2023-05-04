'use strict'

const net = require('net')
const tls = require('tls')
const t = require('tap')

const Client = require('./fixtures/client.js')
const Server = require('./fixtures/server.js')

t.test('http destination', (t) => {
  const HttpAgent = require('../lib/http.js')

  t.test('single request', async (t) => {
    const server = new Server()
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpAgent()
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

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpAgent({ keepAlive: false })
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

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpAgent({ maxSockets: 1 })
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

    t.equal(server.sockets.size, 1, 'only made 1 connection to the server')
  })

  t.test('invalid server auth resolves with 401', async (t) => {
    const server = new Server({ auth: true })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpAgent()
    const badServer = server.address.replace('@', 'broken@')
    const client = new Client(agent, badServer)

    // NOTE this does not cause the promise to reject, only to receive a 401 response
    const res = await client.get('/')
    t.equal(res.statusCode, 401)
    t.equal(res.req.agent, agent)
  })

  t.test('connection timeout rejects', async (t) => {
    const server = new Server()
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    class MockSocket extends net.Socket {
      // this looks strange, but it's because the socket receives a write
      // immediately after being created, and if the socket is not connected
      // or trying to connect, then we get an ERR_SOCKET_CLOSED. by making this
      // function a no-op we prevent the connection _and_ the error
      _writeGeneric () {}
    }

    const MockedAgent = t.mock('../lib/http.js', {
      net: {
        ...net,
        connect: (...args) => {
          return new MockSocket(...args)
        },
      },
    })
    const agent = new MockedAgent({ timeouts: { connection: 100 } })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), { code: 'ECONNECTIONTIMEOUT' })
  })

  t.end()
})

t.test('https destination', (t) => {
  const HttpsAgent = require('../lib/https.js')

  t.test('single request', async (t) => {
    const server = new Server({ tls: true })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpsAgent()
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.statusCode, 200)
    t.equal(res.headers.connection, 'keep-alive', 'keep-alive by default')
    t.equal(res.body, 'OK!')
    t.equal(res.req.agent, agent)
  })

  t.test('can disable keep-alive', async (t) => {
    const server = new Server({ tls: true })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpsAgent({ keepAlive: false })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.statusCode, 200)
    t.equal(res.headers.connection, 'close', 'keep-alive disabled')
    t.equal(res.body, 'OK!')
    t.equal(res.req.agent, agent)
  })

  t.test('can limit sockets', async (t) => {
    const server = new Server({ tls: true })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpsAgent({ maxSockets: 1 })
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

    t.equal(server.sockets.size, 1, 'only made 1 connection to the server')
  })

  t.test('invalid server auth resolves with 401', async (t) => {
    const server = new Server({ auth: true, tls: true })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpsAgent()
    const badServer = server.address.replace('@', 'broken@')
    const client = new Client(agent, badServer)

    // NOTE this does not cause the promise to reject, only to receive a 401 response
    const res = await client.get('/')
    t.equal(res.statusCode, 401)
    t.equal(res.req.agent, agent)
  })

  t.test('connection timeout rejects', async (t) => {
    const server = new Server({ tls: true })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    class MockSocket extends net.Socket {
      // this looks strange, but it's because the socket receives a write
      // immediately after being created, and if the socket is not connected
      // or trying to connect, then we get an ERR_SOCKET_CLOSED. by making this
      // function a no-op we prevent the connection _and_ the error
      _writeGeneric () {}
    }

    const MockedAgent = t.mock('../lib/https.js', {
      tls: {
        ...tls,
        connect: (...args) => {
          return new MockSocket(...args)
        },
      },
    })
    const agent = new MockedAgent({ timeouts: { connection: 100 } })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), { code: 'ECONNECTIONTIMEOUT' })
  })

  t.end()
})
