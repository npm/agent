const { createServer } = require('./server.js')
const { NoneAuthHandlers, UserPasswordAuthHandlers } = require('./auth.js')

exports.createServer = createServer
exports.auth = {
  None: NoneAuthHandlers,
  UserPassword: UserPasswordAuthHandlers,
}
