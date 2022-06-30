'use strict'

const t = require('tap')

const { HttpAgent, HttpsAgent } = require('../')

const Client = require('./fixtures/client.js')
const Proxy = require('./fixtures/proxy.js')
const Server = require('./fixtures/server.js')

// if we were started without any extra parameters, then we're the root test and we need to
// spawn the matrix of child tests. these are written in this specific way because the goal
// of this package is for the behavior to be as similar as possible regardless of proxy usage

// our matrix of test conditions looks like:
// no proxy, http server
// no proxy, https server
// http proxy, http server
// http proxy, https server
// https proxy, http server
// https proxy, https server
if (process.argv.length <= 2) {
  for (const proxyType of ['null', 'http', 'https']) {
    for (const serverType of ['http', 'https']) {
      t.spawn(process.execPath,
        [__filename, proxyType, serverType],
        `proxy = ${proxyType}, server = ${serverType}`)
    }
  }
  return
}

const [,, proxyType, serverType] = process.argv

const agentGenerator = {
  http: (options) => new HttpAgent({ ...options, rejectUnauthorized: false }),
  https: (options) => new HttpsAgent({ ...options, rejectUnauthorized: false }),
}

// returned when proxyType is 'null'
const nullProxy = {
  start: () => nullProxy,
  stop: () => {},
  sockets: [],
  address: false,
  fake: true,
}

const proxyGenerator = {
  null: () => nullProxy,
  http: (options) => new Proxy(options),
  https: (options) => new Proxy({ ...options, tls: true }),
}

const serverGenerator = {
  http: (options) => new Server(options),
  https: (options) => new Server({ ...options, tls: true }),
}

t.test('single request', async (t) => {
  const proxy = await proxyGenerator[proxyType]().start()
  const server = await serverGenerator[serverType]().start()
  const agent = agentGenerator[serverType]({ proxy: proxy.address })
  const client = new Client(agent, server.address)

  t.teardown(() => {
    agent.destroy()
    return Promise.all([
      server.stop(),
      proxy.stop(),
    ])
  })

  const res = await client.get('/')
  t.equal(res.statusCode, 200)
  t.equal(res.headers.connection, 'keep-alive', 'keep-alive by default')
  t.equal(res.body, 'OK!')
  t.equal(res.req.agent, agent)
})

t.test('can disable keep-alive', async (t) => {
  const proxy = await proxyGenerator[proxyType]().start()
  const server = await serverGenerator[serverType]().start()
  const agent = agentGenerator[serverType]({ proxy: proxy.address, keepAlive: false })
  const client = new Client(agent, server.address)

  t.teardown(() => {
    // no need to call agent.destroy() on this one, the connections are already closed
    return Promise.all([
      server.stop(),
      proxy.stop(),
    ])
  })

  const res = await client.get('/')
  t.equal(res.statusCode, 200)
  t.equal(res.headers.connection, 'close', 'keep-alive can be disabled')
  t.equal(res.body, 'OK!')
  t.equal(res.req.agent, agent)
})

t.test('can limit sockets', async (t) => {
  const proxy = await proxyGenerator[proxyType]().start()
  const server = await serverGenerator[serverType]().start()
  const agent = agentGenerator[serverType]({ proxy: proxy.address, maxSockets: 1 })
  const client = new Client(agent, server.address)

  t.teardown(() => {
    agent.destroy()
    return Promise.all([
      server.stop(),
      proxy.stop(),
    ])
  })

  if (!proxy.fake) {
    // when a proxy is in use, the createConnection method of the agent becomes
    // async. in order to limit sockets appropriately, they can't all come on the
    // same tick, so we send one request by itself, then a batch after the socket
    // has been established
    const initialRes = await client.get('/')
    t.equal(initialRes.statusCode, 200)
    t.equal(initialRes.headers.connection, 'keep-alive', 'keep-alive by default')
    t.equal(initialRes.body, 'OK!')
    t.equal(initialRes.req.agent, agent)
  }

  const results = await Promise.all([
    client.get('/'),
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

  if (!proxy.fake) {
    t.equal(proxy.sockets.length, 1, 'only made 1 connection to proxy')
  }
  t.equal(server.sockets.length, 1, 'only made 1 connection to server')
})

// all tests after this point are for specific behaviors found in a proxy, so if this run is not
// using a proxy, we're done and we can just return right now
if (proxyType === 'null') {
  return
}

t.test('can send auth to proxy', async (t) => {
  const proxy = await proxyGenerator[proxyType]({ auth: true }).start()
  const server = await serverGenerator[serverType]().start()
  const agent = agentGenerator[serverType]({ proxy: proxy.address })
  const client = new Client(agent, server.address)

  t.teardown(() => {
    agent.destroy()
    return Promise.all([
      server.stop(),
      proxy.stop(),
    ])
  })

  const res = await client.get('/')
  t.equal(res.statusCode, 200)
  t.equal(res.headers.connection, 'keep-alive', 'keep-alive by default')
  t.equal(res.body, 'OK!')
  t.equal(res.req.agent, agent)
})

t.test('can send auth to both proxy and server', async (t) => {
  const proxy = await proxyGenerator[proxyType]({ auth: true }).start()
  const server = await serverGenerator[serverType]({ auth: true }).start()
  const agent = agentGenerator[serverType]({ proxy: proxy.address })
  const client = new Client(agent, server.address)

  t.teardown(() => {
    agent.destroy()
    return Promise.all([
      server.stop(),
      proxy.stop(),
    ])
  })

  const res = await client.get('/')
  t.equal(res.statusCode, 200)
  t.equal(res.headers.connection, 'keep-alive', 'keep-alive by default')
  t.equal(res.body, 'OK!')
  t.equal(res.req.agent, agent)
})

t.test('invalid proxy auth rejects', async (t) => {
  const proxy = await proxyGenerator[proxyType]({ auth: true }).start()
  const server = await serverGenerator[serverType]().start()
  const agent = agentGenerator[serverType]({ proxy: proxy.address.replace('@', 'broken@') })
  const client = new Client(agent, server.address)

  t.teardown(() => {
    agent.destroy()
    return Promise.all([
      server.stop(),
      proxy.stop(),
    ])
  })

  await t.rejects(client.get('/'), { code: 'EINVALIDRESPONSE' })
})

t.test('rejects if proxy does not return 200', async (t) => {
  const proxy = await proxyGenerator[proxyType]({ failConnect: true }).start()
  const server = await serverGenerator[serverType]().start()
  const agent = agentGenerator[serverType]({ proxy: proxy.address })
  const client = new Client(agent, server.address)

  t.teardown(() => {
    agent.destroy()
    return Promise.all([
      server.stop(),
      proxy.stop(),
    ])
  })

  await t.rejects(client.get('/'), { code: 'EINVALIDRESPONSE' })
})

t.test('rejects if proxy connection times out', async (t) => {
  // proxy will send a 500 after 150ms, set our timeout to less than that
  const proxy = await proxyGenerator[proxyType]({ failTimeout: true }).start()
  const server = await serverGenerator[serverType]().start()
  const agent = agentGenerator[serverType]({ proxy: proxy.address, timeout: 100 })
  const client = new Client(agent, server.address)

  t.teardown(() => {
    agent.destroy()
    return Promise.all([
      server.stop(),
      proxy.stop(),
    ])
  })

  await t.rejects(client.get('/'), { code: 'ETIMEDOUT' })
})
