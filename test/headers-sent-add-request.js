'use strict'

const t = require('tap')
const http = require('http')
const { Agent: AgentBase } = require('agent-base')
const { Agent } = require('../lib/index.js')

const startServer = async (t) => {
  const server = http.createServer((req, res) => res.end('OK!'))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.teardown(() => new Promise((resolve) => server.close(resolve)))
  return server.address().port
}

t.test('addRequest does not throw after headers are sent (npm/npm-registry-fetch#244)', async (t) => {
  const port = await startServer(t)
  const agent = new Agent()
  t.teardown(() => agent.destroy())

  const res = await new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port,
      agent: false,
    }, resolve)
    req.on('error', reject)
    req.end()
    t.equal(req.headersSent, true, 'headers already flushed')
    agent.addRequest(req, {
      host: '127.0.0.1',
      hostname: '127.0.0.1',
      port,
      protocol: 'http:',
      path: '/',
    })
  })

  t.equal(res.statusCode, 200)
  res.resume()
  await new Promise((resolve) => res.on('end', resolve))
})

t.test('wrapping agent-base can re-enter addRequest after headers are sent', async (t) => {
  const port = await startServer(t)
  const inner = new Agent()
  t.teardown(() => inner.destroy())

  class Wrapper extends AgentBase {
    connect () {
      return inner
    }
  }

  const wrapper = new Wrapper()
  t.teardown(() => wrapper.destroy())

  const res = await new Promise((resolve, reject) => {
    const req = http.get({
      host: '127.0.0.1',
      port,
      agent: wrapper,
    }, resolve)
    req.on('error', reject)
  })

  t.equal(res.statusCode, 200)
  res.resume()
  await new Promise((resolve) => res.on('end', resolve))
})
