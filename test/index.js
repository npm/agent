'use strict'

const t = require('tap')
const { createSetup } = require('./fixtures/setup.js')

const {
  getAgent,
  Agent,
  HttpAgent,
  HttpsAgent,
} = require('../lib/index.js')

t.test('getAgent', (t) => {
  t.test('returns HttpAgent for http url', (t) => {
    const agent = getAgent('http://localhost')
    t.type(agent, HttpAgent)
    t.type(agent, Agent)
    t.end()
  })

  t.test('returns HttpsAgent for https url', (t) => {
    const agent = getAgent('https://localhost')
    t.type(agent, HttpsAgent)
    t.type(agent, Agent)
    t.end()
  })

  t.test('returns false when agent is false', (t) => {
    const agent = getAgent('http://localhost', { agent: false })
    t.equal(agent, false)
    t.end()
  })

  t.test('maxSockets defaults to 15', (t) => {
    const agent = getAgent('http://localhost', {})
    t.equal(agent.options.maxSockets, 15)
    t.end()
  })

  t.test('respects provided proxy option', (t) => {
    const agent = getAgent('http://localhost', { proxy: 'http://localhost:8080' })
    t.type(agent, HttpAgent)
    t.hasStrict(agent, {
      proxy: {
        url: {
          protocol: 'http:',
          hostname: 'localhost',
          port: '8080',
        },
      },
    })
    t.end()
  })

  t.test('respects https_proxy for https target', (t) => {
    process.env.https_proxy = 'https://localhost'
    t.teardown(() => {
      delete process.env.https_proxy
    })

    const { getAgent: getEnvAgent, HttpsAgent: EnvHttpsAgent } = t.mock('../lib/index.js')

    const agent = getEnvAgent('https://localhost')
    t.type(agent, EnvHttpsAgent)
    t.hasStrict(agent, {
      proxy: {
        url: {
          protocol: 'https:',
          hostname: 'localhost',
          port: '',
        },
      },
    })

    t.end()
  })

  t.test('respects https_proxy for http target', (t) => {
    process.env.https_proxy = 'https://localhost'
    t.teardown(() => {
      delete process.env.https_proxy
    })

    const { getAgent: getEnvAgent, HttpAgent: EnvHttpAgent } = t.mock('../lib/index.js')

    const agent = getEnvAgent('http://localhost')
    t.type(agent, EnvHttpAgent)
    t.hasStrict(agent, {
      proxy: {
        url: {
          protocol: 'https:',
          hostname: 'localhost',
          port: '',
        },
      },
    })

    t.end()
  })

  t.test('respects http_proxy for http target', (t) => {
    process.env.http_proxy = 'http://localhost'
    t.teardown(() => {
      delete process.env.http_proxy
    })

    const { getAgent: getEnvAgent, HttpAgent: EnvHttpAgent } = t.mock('../lib/index.js')

    const agent = getEnvAgent('http://localhost')
    t.type(agent, EnvHttpAgent)
    t.hasStrict(agent, {
      proxy: {
        url: {
          protocol: 'http:',
          hostname: 'localhost',
          port: '',
        },
      },
    })

    t.end()
  })

  t.test('respects proxy for http target', (t) => {
    process.env.proxy = 'http://localhost'
    t.teardown(() => {
      delete process.env.proxy
    })

    const { getAgent: getEnvAgent, HttpAgent: EnvHttpAgent } = t.mock('../lib/index.js')

    const agent = getEnvAgent('http://localhost')
    t.type(agent, EnvHttpAgent)
    t.hasStrict(agent, {
      proxy: {
        url: {
          protocol: 'http:',
          hostname: 'localhost',
          port: '',
        },
      },
    })

    t.end()
  })

  t.test('respects proxy for http target if proxy=null is passed in', (t) => {
    process.env.proxy = 'http://localhost'
    t.teardown(() => {
      delete process.env.proxy
    })

    const { getAgent: getEnvAgent, HttpAgent: EnvHttpAgent } = t.mock('../lib/index.js')

    const agent = getEnvAgent('http://localhost', { proxy: null })
    t.type(agent, EnvHttpAgent)
    t.hasStrict(agent, {
      proxy: {
        url: {
          protocol: 'http:',
          hostname: 'localhost',
          port: '',
        },
      },
    })

    t.end()
  })

  t.test('ignores http_proxy for https target', (t) => {
    process.env.http_proxy = 'http://localhost'
    t.teardown(() => {
      delete process.env.http_proxy
    })

    const { getAgent: getEnvAgent, HttpsAgent: EnvHttpsAgent } = t.mock('../lib/index.js')

    const agent = getEnvAgent('https://localhost')
    t.type(agent, EnvHttpsAgent)
    t.notOk(agent.proxy.url)

    t.end()
  })

  t.test('ignores proxy for https target', (t) => {
    process.env.proxy = 'http://localhost'
    t.teardown(() => {
      delete process.env.proxy
    })

    const { getAgent: getEnvAgent, HttpsAgent: EnvHttpsAgent } = t.mock('../lib/index.js')

    const agent = getEnvAgent('https://localhost')
    t.type(agent, EnvHttpsAgent)
    t.notOk(agent.proxy.url)

    t.end()
  })

  t.test('respects noProxy option when passed', (t) => {
    const agentOne = getAgent('http://google.com', {
      proxy: 'http://localhost',
      noProxy: 'google.com',
    })
    t.type(agentOne, HttpAgent)
    t.notOk(agentOne.proxy.url)

    const agentTwo = getAgent('http://localhost', {
      proxy: 'http://localhost',
      noProxy: 'google.com',
    })
    t.type(agentTwo, HttpAgent)
    t.ok(agentTwo.proxy.url)

    // this ensures that an empty string in noProxy has no negative effect
    const agentThree = getAgent('http://localhost', {
      proxy: 'http://localhost',
      noProxy: [''],
    })
    t.type(agentThree, HttpAgent)
    t.ok(agentThree.proxy.url)

    t.end()
  })

  t.test('respects no_proxy env var', (t) => {
    process.env.no_proxy = 'google.com'
    t.teardown(() => {
      delete process.env.no_proxy
    })

    const { getAgent: getEnvAgent, HttpsAgent: EnvHttpsAgent } = t.mock('../lib/index.js')

    const agentOne = getEnvAgent('https://google.com', {
      proxy: 'https://localhost',
    })
    t.type(agentOne, EnvHttpsAgent)
    t.notOk(agentOne.proxy.url)

    const agentTwo = getEnvAgent('https://localhost', {
      proxy: 'https://localhost',
    })
    t.type(agentTwo, EnvHttpsAgent)
    t.ok(agentTwo.proxy.url)

    t.end()
  })

  t.test('returns same agent for same proxy and destination type', (t) => {
    const agentOne = getAgent('http://localhost', { proxy: 'http://user1:pass1@localhost' })
    t.type(agentOne, HttpAgent)

    const agentTwo = getAgent('http://localhost', { proxy: 'http://user1:pass1@localhost' })
    t.type(agentTwo, HttpAgent)

    t.equal(agentOne, agentTwo)
    t.end()
  })

  t.test('returns different agents when auth differs', (t) => {
    const agentOne = getAgent('http://localhost', { proxy: 'http://user1:pass1@localhost' })
    t.type(agentOne, HttpAgent)

    const agentTwo = getAgent('http://localhost', { proxy: 'http://user2:pass2@localhost' })
    t.type(agentTwo, HttpAgent)

    t.not(agentOne, agentTwo)
    t.end()
  })

  t.end()
})

for (const serverTls of [false, true]) {
  t.test(`getAgent preserves noProxy for ${serverTls ? 'https' : 'http'} requests`, async (t) => {
    const previousNoProxy = process.env.no_proxy
    process.env.no_proxy = 'localhost'
    t.teardown(() => {
      if (previousNoProxy === undefined) {
        delete process.env.no_proxy
      } else {
        process.env.no_proxy = previousNoProxy
      }
    })

    const { getAgent: getEnvAgent, cache } = t.mock('../lib/index.js')
    t.teardown(() => cache.clear())
    const { setup } = createSetup({ serverTls, proxyTls: false })
    const { server, proxy, createClient } = await setup(t)

    for (const noProxy of ['example.com', ['example.com'], []]) {
      cache.clear()
      const agent = getEnvAgent(server.address, {
        proxy: proxy.address,
        noProxy,
        rejectUnauthorized: false,
      })
      const connections = proxy.sockets
      const res = await createClient(agent).get('/')
      t.equal(res.status, 200)
      t.equal(res.result, 'OK!')
      t.equal(proxy.sockets, connections + 1, 'explicit noProxy overrides the environment')
    }
  })

  t.test(`getAgent caches separate noProxy policies for ${serverTls ? 'https' : 'http'}`, async (t) => {
    const previousNoProxy = process.env.no_proxy
    process.env.no_proxy = 'localhost'
    t.teardown(() => {
      if (previousNoProxy === undefined) {
        delete process.env.no_proxy
      } else {
        process.env.no_proxy = previousNoProxy
      }
    })

    const { getAgent: getEnvAgent, cache } = t.mock('../lib/index.js')
    t.teardown(() => cache.clear())
    const { setup } = createSetup({ serverTls, proxyTls: false })
    const { server, proxy, createClient } = await setup(t)
    const options = { proxy: proxy.address, rejectUnauthorized: false }
    const url = `${serverTls ? 'https' : 'http'}://example.org`
    for (const [directNoProxy, proxyNoProxy] of [['localhost', 'example.com'], ['', []]]) {
      cache.clear()
      const directAgent = getEnvAgent(url, { ...options, noProxy: directNoProxy })
      const proxyAgent = getEnvAgent(url, { ...options, noProxy: proxyNoProxy })
      const connections = proxy.sockets

      const direct = await createClient(directAgent, server.address).get('/')
      t.equal(direct.result, 'OK!')
      t.equal(proxy.sockets, connections, 'the first policy bypasses localhost')

      const proxied = await createClient(proxyAgent, server.address).get('/')
      t.equal(proxied.result, 'OK!')
      t.equal(proxy.sockets, connections + 1, 'the second policy still proxies localhost')
    }
  })
}

t.test('http agent', (t) => {
  t.test('does not throw with no args', async (t) => {
    t.ok(new HttpAgent())
  })

  t.test('throws for incompatible proxy protocols', async (t) => {
    t.throws(() => {
      new HttpAgent({ proxy: 'foo://not-supported' })
    }, { code: 'EINVALIDPROXY' })
  })

  t.end()
})

t.test('https agent', (t) => {
  t.test('throws for incompatible proxy protocols', async (t) => {
    t.throws(() => {
      new HttpsAgent({ proxy: 'foo://not-supported' })
    }, { code: 'EINVALIDPROXY' })
  })

  t.end()
})
