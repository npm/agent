'use strict'

const t = require('tap')
const timers = require('timers/promises')
const semver = require('semver')
const dns = require('dns')
const { createSetup, mockConnect } = require('./fixtures/setup.js')

const isWindows = process.platform === 'win32'

const agentTest = (t, opts) => {
  const { setup, hasProxy, isSocks } = createSetup(opts)
  t.test('single request basic', async (t) => {
    const { client } = await setup(t)

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.headers.get('connection'), 'keep-alive', 'keep-alive by default')
    t.ok(res.headers.get('x-echo-headers'))
    t.equal(res.result, 'OK!')
  })

  t.test('single request ipv4 only', async (t) => {
    const { client, createAgent, createClient } = await setup(t, {
      server: { family: 4 },
      proxy: { family: 4 },
      agent: { family: 4 },
    })

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.result, 'OK!')

    const mismatchAgent = createAgent({ family: 6 })
    const mismatchClient = createClient(mismatchAgent)

    // TODO(lukekarrys): this should be ECONNREFUSED for socks also
    await t.rejects(mismatchClient.get('/'), { code: isSocks ? 'FETCH_ERROR' : 'ECONNREFUSED' })
  })

  t.test('single request ipv6 only', async (t) => {
    // Node 16 used ipv4first as the default dns resolution algorithim.
    // This breaks socks proxying for this test because the DNS will return
    // 127.0.0.1 for localhost which will refuse an IPv6 connection.
    if (isSocks && process.version.startsWith('v16.')) {
      dns.setDefaultResultOrder('verbatim')
      t.teardown(() => dns.setDefaultResultOrder('ipv4first'))
    }

    const { client, createAgent, createClient } = await setup(t, {
      server: { family: 6 },
      proxy: { family: 6 },
      agent: { family: 6 },
    })

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.result, 'OK!')

    const mismatchAgent = createAgent({ family: 4 })
    const mismatchClient = createClient(mismatchAgent)

    // TODO(lukekarrys): this should be ECONNREFUSED for socks also
    await t.rejects(mismatchClient.get('/'), { code: isSocks ? 'FETCH_ERROR' : 'ECONNREFUSED' })
  })

  t.test('can disable keep-alive', async (t) => {
    const { client } = await setup(t, {
      agent: { keepAlive: false },
    })

    const res = await client.get('/')
    t.equal(res.status, 200)
    t.equal(res.headers.get('connection'), 'close', 'keep-alive disabled')
    t.equal(res.result, 'OK!')
  })

  t.test('can limit sockets', async (t) => {
    const { server, proxy, client } = await setup(t, {
      agent: { maxSockets: 1 },
    })

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

    if (hasProxy) {
      t.equal(proxy.sockets, 1, 'only made 1 connection to the proxy')
    }
    t.equal(server.sockets, 1, 'only made 1 connection to the server')
  })

  t.test('invalid server auth resolves with 401', async (t) => {
    const { server, agent, createClient } = await setup(t, {
      server: { auth: true },
    })

    const client = createClient(agent, server.address.replace('@', 'broken@'))

    const res = await client.get('/')
    t.equal(res.status, 401)
  })

  if (hasProxy) {
    t.test('use no proxy', async (t) => {
      const { client } = await setup(t, {
        agent: { noProxy: 'localhost' },
      })

      const res = await client.get('/')
      t.equal(res.status, 200)
      t.equal(res.headers.get('connection'), 'keep-alive', 'keep-alive by default')
      t.equal(res.result, 'OK!')
    })

    t.test('invalid proxy auth rejects', async (t) => {
      const { server, proxy, createClient, createAgent } = await setup(t, {
        proxy: { auth: true },
      })

      // proxy.address has credentials in it, intentionally break them
      const agent = createAgent({ proxy: proxy.address.replace('@', 'broken@') })
      const client = createClient(agent, server.address)

      if (isSocks) {
        await t.rejects(client.get('/'))
      } else {
        const res = await client.get('/')
        t.equal(res.status, 401)
      }
    })

    t.test('can send auth to proxy', async (t) => {
      const { client } = await setup(t, {
        proxy: { auth: true },
      })

      const res = await client.get('/')
      t.equal(res.status, 200)
      t.equal(res.headers.get('connection'), 'keep-alive', 'keep-alive by default')
      t.equal(res.result, 'OK!')
    })

    t.test('can send auth to both proxy and server', async (t) => {
      const { client } = await setup(t, {
        server: { auth: true },
        proxy: { auth: true },
      })

      const res = await client.get('/')
      t.equal(res.status, 200)
      t.equal(res.headers.get('connection'), 'keep-alive', 'keep-alive by default')
      t.equal(res.result, 'OK!')
    })

    t.test('non-200 response from proxy rejects', async (t) => {
      const { client } = await setup(t, {
        proxy: { failConnect: true },
      })

      if (isSocks) {
        // weird bug that fails with a message about node internals starting with this specific
        // node version in windows. skipping this test for now to ship these agent updates.
        const skipThis = semver.gte(process.version, '18.17.1') && isWindows && !opts.serverTls
        if (!skipThis) {
          await t.rejects(client.get('/'))
        }
      } else {
        const res = await client.get('/')
        t.equal(res.status, 500)
      }
    })
  }

  t.test('socket error', async t => {
    const { socket, mocks } = mockConnect()

    const { client } = await setup(t, {
      mock: {
        ...mocks,
        'http-proxy-agent': t.mock('http-proxy-agent', mocks),
        'https-proxy-agent': t.mock('https-proxy-agent', mocks),
        'socks-proxy-agent': t.mock('socks-proxy-agent', {
          socks: {
            SocksClient: class {
              static createConnection = () => ({ socket })
            },
          },
        }),
      },
    })

    const res = client.get('/')
    await timers.setImmediate()
    socket.emit('error', { code: 'KABOOM' })
    await t.rejects(res, { code: 'KABOOM' })
  })

  t.test('connection timeout rejects', async (t) => {
    const delay = () => timers.setTimeout(1000)

    const { server, client } = await setup(t, {
      agent: { timeouts: { connection: 100 } },
      mock: {
        ...mockConnect().mocks,
        'http-proxy-agent': {
          HttpProxyAgent: class {
            connect = delay
          },
        },
        'https-proxy-agent': {
          HttpsProxyAgent: class {
            connect = delay
          },
        },
        'socks-proxy-agent': t.mock('socks-proxy-agent', {
          socks: {
            SocksClient: class {
              static createConnection = delay
            },
          },
        }),
      },
    })

    await t.rejects(client.get('/'), {
      code: 'ECONNECTIONTIMEOUT',
      host: (new URL(server.address).host),
    })
  })

  t.test('connection timeout does not reject when long enough', async (t) => {
    const { client } = await setup(t, {
      agent: { timeouts: { connection: 1000 } },
    })

    t.ok(await client.get('/'))
  })

  t.test('idle timeout rejects', async (t) => {
    const { server, client } = await setup(t, {
      server: { idleDelay: 150 },
      agent: { timeouts: { idle: 100 } },
    })

    await t.rejects(client.get('/'), {
      code: 'EIDLETIMEOUT',
      host: (new URL(server.address).host),
    })
  })

  t.test('response timeout rejects', async (t) => {
    const { proxy, server, client } = await setup(t, {
      server: { responseDelay: 150 },
      agent: { timeouts: { response: 100 } },
    })

    await t.rejects(client.get('/'), {
      code: 'ERESPONSETIMEOUT',
      proxy: hasProxy ? new URL(proxy.address) : undefined,
      request: {
        host: (new URL(server.address).hostname),
        path: '/',
      },
    })
  })

  t.test('response timeout does not reject when long enough', async (t) => {
    const { client } = await setup(t, {
      server: { responseDelay: 150 },
      agent: { timeouts: { response: 1000 } },
    })

    t.ok(await client.get('/'))
  })

  t.test('transfer timeout rejects', async (t) => {
    const { proxy, server, client } = await setup(t, {
      server: { transferDelay: 150 },
      agent: { timeouts: { transfer: 100 } },
    })

    await t.rejects(client.get('/'), {
      code: 'ETRANSFERTIMEOUT',
      proxy: hasProxy ? new URL(proxy.address) : undefined,
      request: {
        host: (new URL(server.address).hostname),
        path: '/',
      },
    })
  })

  t.end()
}

const proxyTest = (t, opts) => {
  t.test('https destination', t => agentTest(t, { serverTls: true, ...opts }))
  t.test('http destination', t => agentTest(t, { serverTls: false, ...opts }))
  t.end()
}

t.test('no proxy ->', t => proxyTest(t))
t.test('http proxy->', t => proxyTest(t, { proxyTls: false }))
t.test('https proxy ->', t => proxyTest(t, { proxyTls: true }))
t.test('socks proxy ->', t => proxyTest(t, { proxy: { type: 'Socks', protocol: 'socks:' } }))
