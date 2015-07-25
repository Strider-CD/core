var seneca = require('seneca')()

seneca.use('lib/microservices/index')
seneca.listen()
