'use strict'

const t = require('tap')

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

  t.test('ignores http_proxy for https target', (t) => {
    process.env.http_proxy = 'http://localhost'
    t.teardown(() => {
      delete process.env.http_proxy
    })

    const { getAgent: getEnvAgent, HttpsAgent: EnvHttpsAgent } = t.mock('../lib/index.js')

    const agent = getEnvAgent('https://localhost', { proxy: null })
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

t.test('http agent', (t) => {
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
