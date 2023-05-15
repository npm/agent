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
    t.equal(res.status, 200)
    t.equal(res.headers.get('connection'), 'keep-alive', 'keep-alive by default')
    t.equal(res.result, 'OK!')
  })

  t.test('single request ipv4 only', async (t) => {
    const server = new Server({ family: 4 })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpAgent({ family: 4 })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.result, 'OK!')

    const mismatchAgent = new HttpAgent({ family: 6 })
    const mismatchClient = new Client(mismatchAgent, server.address)
    await t.rejects(mismatchClient.get('/'), { code: 'ECONNREFUSED' })
  })

  t.test('single request ipv6 only', async (t) => {
    const server = new Server({ family: 6 })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpAgent({ family: 6 })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.result, 'OK!')

    const mismatchAgent = new HttpAgent({ family: 4 })
    const mismatchClient = new Client(mismatchAgent, server.address)
    await t.rejects(mismatchClient.get('/'), { code: 'ECONNREFUSED' })
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
    t.equal(res.status, 200)
    t.equal(res.headers.get('connection'), 'close', 'keep-alive disabled')
    t.equal(res.result, 'OK!')
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
    t.equal(initialRes.status, 200)
    t.equal(initialRes.headers.get('connection'), 'keep-alive')
    t.equal(initialRes.result, 'OK!')

    const results = await Promise.all([
      client.get('/'),
      client.get('/'),
      client.get('/'),
      client.get('/'),
    ])

    for (const res of results) {
      t.equal(res.status, 200)
      t.equal(res.headers.get('connection'), 'keep-alive')
      t.equal(res.result, 'OK!')
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
    t.equal(res.status, 401)
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
    const mockSocket = new MockSocket()

    const MockedAgent = t.mock('../lib/http.js', {
      net: {
        ...net,
        connect: (...args) => {
          return mockSocket
        },
      },
    })
    const agent = new MockedAgent({ timeouts: { connection: 100 } })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), {
      code: 'ECONNECTIONTIMEOUT',
      host: (new URL(server.address).hostname),
    })

    // this ensures that an error event on the socket before the
    // connect event occurs gets raised
    const secondFetch = client.get('/')
    mockSocket.emit('error', { code: 'KABOOM' })
    await t.rejects(secondFetch, { code: 'KABOOM' })
  })

  t.test('idle timeout rejects', async (t) => {
    const server = new Server({ idleDelay: 150 })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpAgent({ timeouts: { idle: 100 } })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), {
      code: 'EIDLETIMEOUT',
      host: (new URL(server.address).hostname),
    })
  })

  t.test('response timeout rejects', async (t) => {
    const server = new Server({ responseDelay: 150 })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const workingAgent = new HttpAgent({ timeouts: { response: 200 } })
    const workingClient = new Client(workingAgent, server.address)
    const res = await workingClient.get('/')
    t.equal(res.status, 200)

    const agent = new HttpAgent({ timeouts: { response: 100 } })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), {
      code: 'ERESPONSETIMEOUT',
      proxy: undefined,
      request: {
        host: (new URL(server.address).hostname),
        path: '/',
      },
    })
  })

  t.test('transfer timeout rejects', async (t) => {
    const server = new Server({ transferDelay: 150 })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const workingAgent = new HttpAgent({ timeouts: { transfer: 300 } })
    const workingClient = new Client(workingAgent, server.address)
    const res = await workingClient.get('/')
    t.equal(res.status, 200)

    const agent = new HttpAgent({ timeouts: { transfer: 100 } })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), {
      code: 'ETRANSFERTIMEOUT',
      proxy: undefined,
      request: {
        host: (new URL(server.address).hostname),
        path: '/',
      },
    })
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
    t.equal(res.status, 200)
    t.equal(res.headers.get('connection'), 'keep-alive', 'keep-alive by default')
    t.equal(res.result, 'OK!')
  })

  t.test('single request ipv4 only', async (t) => {
    const server = new Server({ tls: true, family: 4 })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpsAgent({ family: 4 })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.result, 'OK!')

    const mismatchAgent = new HttpsAgent({ family: 6 })
    const mismatchClient = new Client(mismatchAgent, server.address)
    await t.rejects(mismatchClient.get('/'), { code: 'ECONNREFUSED' })
  })

  t.test('single request ipv6 only', async (t) => {
    const server = new Server({ tls: true, family: 6 })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpsAgent({ family: 6 })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.result, 'OK!')

    const mismatchAgent = new HttpsAgent({ family: 4 })
    const mismatchClient = new Client(mismatchAgent, server.address)
    await t.rejects(mismatchClient.get('/'), { code: 'ECONNREFUSED' })
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
    t.equal(res.status, 200)
    t.equal(res.headers.get('connection'), 'close', 'keep-alive disabled')
    t.equal(res.result, 'OK!')
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
    t.equal(initialRes.status, 200)
    t.equal(initialRes.headers.get('connection'), 'keep-alive')
    t.equal(initialRes.result, 'OK!')

    const results = await Promise.all([
      client.get('/'),
      client.get('/'),
      client.get('/'),
      client.get('/'),
    ])

    for (const res of results) {
      t.equal(res.status, 200)
      t.equal(res.headers.get('connection'), 'keep-alive')
      t.equal(res.result, 'OK!')
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
    t.equal(res.status, 401)
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

    await t.rejects(client.get('/'), {
      code: 'ECONNECTIONTIMEOUT',
      host: (new URL(server.address).hostname),
    })
  })

  t.test('idle timeout rejects', async (t) => {
    const server = new Server({ tls: true, idleDelay: 150 })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpsAgent({ timeouts: { idle: 100 } })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), {
      code: 'EIDLETIMEOUT',
      host: (new URL(server.address).hostname),
    })
  })

  t.test('response timeout rejects', async (t) => {
    const server = new Server({ tls: true, responseDelay: 150 })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpsAgent({ timeouts: { response: 100 } })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), {
      code: 'ERESPONSETIMEOUT',
      proxy: undefined,
      request: {
        host: (new URL(server.address).hostname),
        path: '/',
      },
    })
  })

  t.test('transfer timeout rejects', async (t) => {
    const server = new Server({ tls: true, transferDelay: 150 })
    await server.start()

    t.teardown(async () => {
      await server.stop()
    })

    const agent = new HttpsAgent({ timeouts: { transfer: 100 } })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), {
      code: 'ETRANSFERTIMEOUT',
      proxy: undefined,
      request: {
        host: (new URL(server.address).hostname),
        path: '/',
      },
    })
  })

  t.end()
})
