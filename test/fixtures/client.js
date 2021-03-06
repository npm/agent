'use strict'

const { once } = require('events')
const http = require('http')
const https = require('https')

class Client {
  constructor (agent, base) {
    this.agent = agent
    this.base = base
  }

  async get (url) {
    const parsed = new URL(url, this.base)
    const req = parsed.protocol === 'https:'
      ? https.get(parsed.href, { agent: this.agent, rejectUnauthorized: false })
      : http.get(parsed.href, { agent: this.agent })

    const [res] = await once(req, 'response')
    const chunks = []
    res.on('data', (chunk) => chunks.push(chunk))
    await once(res, 'end')

    res.body = Buffer.concat(chunks).toString()
    return res
  }
}

module.exports = Client
