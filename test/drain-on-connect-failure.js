'use strict'

const t = require('tap')
const http = require('http')
const { Agent } = require('../lib/index.js')

// Start an http server on a random port and return it once it is listening.
const startServer = async (t) => {
  const server = http.createServer((req, res) => res.end('OK!'))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.teardown(() => new Promise((resolve) => server.close(resolve)))
  return server.address().port
}

// Find a port that nothing is listening on, so every connect() rejects with ECONNREFUSED.
const closedPort = async () => {
  return new Promise((resolve) => {
    const probe = http.createServer()
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address()
      probe.close(() => resolve(port))
    })
  })
}

t.test('queued requests are dispatched when connections fail (npm/cli#9386)', async (t) => {
  const port = await closedPort()

  const agent = new Agent({ maxSockets: 2 })
  const TOTAL = 6
  const errors = []

  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('requests queued past maxSockets were never dispatched (hang)')),
      10000
    )
    for (let i = 0; i < TOTAL; i++) {
      const req = http.request({ host: '127.0.0.1', port, agent })
      req.on('error', (err) => {
        errors.push(err)
        if (errors.length === TOTAL) {
          // brief grace period to catch any double-dispatch (a 7th error)
          setTimeout(() => {
            clearTimeout(timer)
            resolve()
          }, 200)
        }
      })
      req.end()
    }
  })

  t.equal(errors.length, TOTAL, 'every queued request settled exactly once')
})

t.test('a queued request whose connection succeeds is assigned a socket', async (t) => {
  const port = await startServer(t)

  const agent = new Agent({ maxSockets: 1 })
  t.teardown(() => agent.destroy())

  // Fail only the first connection: A fails, the queued B is drained and succeeds.
  const realConnect = agent.connect.bind(agent)
  let connectCalls = 0
  agent.connect = function (request, options) {
    connectCalls += 1
    if (connectCalls === 1) {
      return Promise.reject(Object.assign(new Error('refused'), { code: 'ECONNREFUSED' }))
    }
    return realConnect(request, options)
  }

  const request = (label) => new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port, agent })
    req.on('error', (err) => resolve({ label, error: err }))
    req.on('response', (res) => {
      res.resume()
      res.on('end', () => resolve({ label, status: res.statusCode }))
    })
    req.end()
  })

  const [a, b] = await Promise.all([request('A'), request('B')])
  t.equal(a.error?.code, 'ECONNREFUSED', 'the request whose connection failed errors')
  t.equal(b.status, 200, 'the queued request is dispatched and completes')
})

t.test('a failed request picked by removeSocket is not dispatched twice', async (t) => {
  const port = await startServer(t)

  // keepAlive is off so A's socket closes after its response, triggering removeSocket() to pick queued request B.
  const agent = new Agent({ maxSockets: 1, keepAlive: false })
  t.teardown(() => agent.destroy())

  // Request A succeeds; the connection removeSocket() makes for B then fails.
  const realConnect = agent.connect.bind(agent)
  let connectCalls = 0
  agent.connect = function (request, options) {
    connectCalls += 1
    if (connectCalls === 1) {
      return realConnect(request, options)
    }
    return Promise.reject(Object.assign(new Error('refused'), { code: 'ECONNREFUSED' }))
  }

  let bErrors = 0
  const aDone = new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port, agent })
    req.on('error', resolve)
    req.on('response', (res) => {
      res.resume()
      res.on('end', resolve)
    })
    req.end()
  })
  const bDone = new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port, agent })
    req.on('error', () => {
      bErrors += 1
      // brief grace period to catch a double-dispatch erroring B a second time
      setTimeout(resolve, 300)
    })
    req.end()
  })

  await Promise.all([aDone, bDone])
  t.equal(bErrors, 1, 'the queued request that fails errors exactly once')
})

t.test('a connection failure does not dispatch a request when no slot is free', async (t) => {
  const port = await closedPort()

  const agent = new Agent({ maxSockets: 1 })
  const options = { host: '127.0.0.1', port }
  const name = agent.getName(options)

  // The single maxSockets slot is already taken, with a request queued behind it.
  // A connection failure must not dispatch that request, since no slot is free.
  let dispatched = false
  const queuedRequest = {
    onSocket: () => {
      dispatched = true
    },
  }
  agent.requests[name] = [queuedRequest]
  agent.sockets[name] = [{}]

  const err = await new Promise((resolve) => {
    agent.createSocket({}, options, (e) => resolve(e))
  })

  t.equal(err?.code, 'ECONNREFUSED', 'the connection failed')
  t.equal(dispatched, false, 'the queued request was not dispatched')
  t.equal(agent.requests[name]?.length, 1, 'the queued request is left in the queue')
})
