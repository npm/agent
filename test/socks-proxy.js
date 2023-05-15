'use strict'

const { SocksClient } = require('socks')
const dns = require('dns')
const t = require('tap')

const Client = require('./fixtures/client.js')
const Server = require('./fixtures/server.js')
const SocksProxy = require('./fixtures/socks-proxy.js')
const RealSocksProxy = require('../lib/proxy/socks.js')

t.test('constructor', (t) => {
  t.hasStrict(new RealSocksProxy({ url: new URL('socks4://localhost') }),
    { type: 4, shouldLookup: true, url: { port: '1080' } })

  t.hasStrict(new RealSocksProxy({ url: new URL('socks4a://localhost') }),
    { type: 4, shouldLookup: false, url: { port: '1080' } })

  t.hasStrict(new RealSocksProxy({ url: new URL('socks5://localhost') }),
    { type: 5, shouldLookup: true, url: { port: '1080' } })

  t.hasStrict(new RealSocksProxy({ url: new URL('socks5h://localhost') }),
    { type: 5, shouldLookup: false, url: { port: '1080' } })

  t.hasStrict(new RealSocksProxy({ url: new URL('socks://localhost') }),
    { type: 5, shouldLookup: false, url: { port: '1080' } })

  t.throws(() => new RealSocksProxy({ url: new URL('socks17://localhost') }),
    { code: 'EINVALIDPROXY' })

  t.end()
})

t.test('http destination', (t) => {
  const HttpAgent = require('../lib/http.js')

  t.test('single request', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.headers.get('connection'), 'keep-alive')
    t.equal(res.result, 'OK!')
  })

  t.test('single request with client side lookup', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new SocksProxy({ protocol: 'socks5:' })
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.headers.get('connection'), 'keep-alive')
    t.equal(res.result, 'OK!')
  })

  t.test('single request with failing client side lookup', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new SocksProxy({ protocol: 'socks5:' })
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const MockedAgent = t.mock('../lib/http.js', {
      dns: {
        ...dns,
        lookup: (host, options, cb) => {
          process.nextTick(cb, new Error('kaboom'))
        },
      },
    })

    const agent = new MockedAgent({ proxy: proxy.address })
    const client = new Client(agent, server.address)

    // TODO this should reject with the same error lookup responded with
    await t.rejects(client.get('/'))
  })

  t.test('single request ipv4 only', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new SocksProxy({ family: 4 })
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ family: 4, proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.result, 'OK!')

    const mismatchAgent = new HttpAgent({ family: 6, proxy: proxy.address })
    const mismatchClient = new Client(mismatchAgent, server.address)
    // TODO this should reject with ECONNREFUSED
    await t.rejects(mismatchClient.get('/'))
  })

  t.test('single request ipv6 only', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new SocksProxy({ family: 6 })
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ family: 6, proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.result, 'OK!')

    const mismatchAgent = new HttpAgent({ family: 4, proxy: proxy.address })
    const mismatchClient = new Client(mismatchAgent, server.address)
    // TODO this should reject with ECONNREFUSED
    await t.rejects(mismatchClient.get('/'))
  })

  t.test('can disable keep-alive', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ keepAlive: false, proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.headers.get('connection'), 'close', 'keep-alive disabled')
    t.equal(res.result, 'OK!')
  })

  t.test('can limit sockets', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ maxSockets: 1, proxy: proxy.address })
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

    t.equal(proxy.sockets.size, 1, 'only made 1 connection to the proxy')
    t.equal(server.sockets.size, 1, 'only made 1 connection to the server')
  })

  t.test('invalid server auth resolves with 401', async (t) => {
    const server = new Server({ auth: true })
    await server.start()

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ proxy: proxy.address })
    const badServer = server.address.replace('@', 'broken@')
    const client = new Client(agent, badServer)

    const res = await client.get('/')
    t.equal(res.status, 401)
  })

  t.test('invalid proxy auth rejects', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new SocksProxy({ auth: true })
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const badProxy = proxy.address.replace('@', 'broken@')
    const agent = new HttpAgent({ proxy: badProxy })
    const client = new Client(agent, server.address)

    // TODO this should reject with EINVALIDRESPONSE
    await t.rejects(client.get('/'))
  })

  t.test('can send auth to proxy', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new SocksProxy({ auth: true })
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.result, 'OK!')
  })

  t.test('connection timeout rejects', async (t) => {
    const server = new Server()
    await server.start()

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    class MockSocksClient extends SocksClient {
      // hijack the connect method to do nothing
      connect () {}
    }

    const MockedAgent = t.mock('../lib/http.js', {
      socks: {
        SocksClient: MockSocksClient,
      },
    })

    const agent = new MockedAgent({ timeouts: { connection: 100 }, proxy: proxy.address })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), {
      code: 'ECONNECTIONTIMEOUT',
      host: (new URL(proxy.address).hostname),
    })
  })

  t.test('idle timeout rejects', async (t) => {
    const server = new Server({ idleDelay: 150 })
    await server.start()

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ timeouts: { idle: 100 }, proxy: proxy.address })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), {
      code: 'EIDLETIMEOUT',
      host: (new URL(proxy.address).hostname),
    })
  })

  t.test('response timeout rejects', async (t) => {
    const server = new Server({ responseDelay: 150 })
    await server.start()

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ timeouts: { response: 100 }, proxy: proxy.address })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), {
      code: 'ERESPONSETIMEOUT',
      proxy: new URL(proxy.address),
      request: {
        host: (new URL(server.address).hostname),
        path: '/',
      },
    })
  })

  t.test('transfer timeout rejects', async (t) => {
    const server = new Server({ transferDelay: 150 })
    await server.start()

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpAgent({ timeouts: { transfer: 100 }, proxy: proxy.address })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), {
      code: 'ETRANSFERTIMEOUT',
      proxy: new URL(proxy.address),
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

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpsAgent({ proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.headers.get('connection'), 'keep-alive')
    t.equal(res.result, 'OK!')
  })

  t.test('single request with client side lookup', async (t) => {
    const server = new Server({ tls: true })
    await server.start()

    const proxy = new SocksProxy({ protocol: 'socks5:' })
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpsAgent({ proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.headers.get('connection'), 'keep-alive')
    t.equal(res.result, 'OK!')
  })

  t.test('single request ipv4 only', async (t) => {
    const server = new Server({ tls: true })
    await server.start()

    const proxy = new SocksProxy({ family: 4 })
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpsAgent({ family: 4, proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.result, 'OK!')

    const mismatchAgent = new HttpsAgent({ family: 6, proxy: proxy.address })
    const mismatchClient = new Client(mismatchAgent, server.address)
    // TODO this should reject with ECONNREFUSED
    await t.rejects(mismatchClient.get('/'))
  })

  t.test('single request ipv6 only', async (t) => {
    const server = new Server({ tls: true })
    await server.start()

    const proxy = new SocksProxy({ family: 6 })
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpsAgent({ family: 6, proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.result, 'OK!')

    const mismatchAgent = new HttpsAgent({ family: 4, proxy: proxy.address })
    const mismatchClient = new Client(mismatchAgent, server.address)
    // TODO this should reject with ECONNREFUSED
    await t.rejects(mismatchClient.get('/'))
  })

  t.test('can disable keep-alive', async (t) => {
    const server = new Server({ tls: true })
    await server.start()

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpsAgent({ keepAlive: false, proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.headers.get('connection'), 'close', 'keep-alive disabled')
    t.equal(res.result, 'OK!')
  })

  t.test('can limit sockets', async (t) => {
    const server = new Server({ tls: true })
    await server.start()

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpsAgent({ maxSockets: 1, proxy: proxy.address })
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

    t.equal(proxy.sockets.size, 1, 'only made 1 connection to the proxy')
    t.equal(server.sockets.size, 1, 'only made 1 connection to the server')
  })

  t.test('invalid server auth resolves with 401', async (t) => {
    const server = new Server({ auth: true, tls: true })
    await server.start()

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpsAgent({ proxy: proxy.address })
    const badServer = server.address.replace('@', 'broken@')
    const client = new Client(agent, badServer)

    const res = await client.get('/')
    t.equal(res.status, 401)
  })

  t.test('invalid proxy auth rejects', async (t) => {
    const server = new Server({ tls: true })
    await server.start()

    const proxy = new SocksProxy({ auth: true })
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const badProxy = proxy.address.replace('@', 'broken@')
    const agent = new HttpsAgent({ proxy: badProxy })
    const client = new Client(agent, server.address)

    // TODO this should reject with EINVALIDRESPONSE
    await t.rejects(client.get('/'))
  })

  t.test('can send auth to proxy', async (t) => {
    const server = new Server({ tls: true })
    await server.start()

    const proxy = new SocksProxy({ auth: true })
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpsAgent({ proxy: proxy.address })
    const client = new Client(agent, server.address)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.result, 'OK!')
  })

  t.test('connection timeout rejects', async (t) => {
    const server = new Server({ tls: true })
    await server.start()

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    class MockSocksClient extends SocksClient {
      // hijack the connect method to do nothing
      connect () {}
    }

    const MockedAgent = t.mock('../lib/https.js', {
      socks: {
        SocksClient: MockSocksClient,
      },
    })

    const agent = new MockedAgent({ timeouts: { connection: 100 }, proxy: proxy.address })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), {
      code: 'ECONNECTIONTIMEOUT',
      host: (new URL(proxy.address).hostname),
    })
  })

  t.test('idle timeout rejects', async (t) => {
    const server = new Server({ idleDelay: 150, tls: true })
    await server.start()

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpsAgent({ timeouts: { idle: 100 }, proxy: proxy.address })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), {
      code: 'EIDLETIMEOUT',
      host: (new URL(proxy.address).hostname),
    })
  })

  t.test('response timeout rejects', async (t) => {
    const server = new Server({ responseDelay: 150, tls: true })
    await server.start()

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpsAgent({ timeouts: { response: 100 }, proxy: proxy.address })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), {
      code: 'ERESPONSETIMEOUT',
      proxy: new URL(proxy.address),
      request: {
        host: (new URL(server.address).hostname),
        path: '/',
      },
    })

    const longerAgent = new HttpsAgent({ timeouts: { response: 200 }, proxy: proxy.address })
    const longerClient = new Client(longerAgent, server.address)

    const res = await longerClient.get('/')
    t.equal(res.status, 200)
    t.equal(res.result, 'OK!')
  })

  t.test('transfer timeout rejects', async (t) => {
    const server = new Server({ transferDelay: 150, tls: true })
    await server.start()

    const proxy = new SocksProxy()
    await proxy.start()

    t.teardown(async () => {
      await server.stop()
      await proxy.stop()
    })

    const agent = new HttpsAgent({ timeouts: { transfer: 100 }, proxy: proxy.address })
    const client = new Client(agent, server.address)

    await t.rejects(client.get('/'), {
      code: 'ETRANSFERTIMEOUT',
      proxy: new URL(proxy.address),
      request: {
        host: (new URL(server.address).hostname),
        path: '/',
      },
    })
  })

  t.end()
})
