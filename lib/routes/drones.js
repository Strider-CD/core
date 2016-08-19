import config from 'config'
import web from 'hapi-decorators'
import Bluebird from 'bluebird'
import Drone from '../models/drone'
import uuid from 'node-uuid'
import _JWT from 'jsonwebtoken'

const JWT = Bluebird.promisifyAll(_JWT)

@web.controller(`${config.apiPrefix}drones`)
export default class Drones {
  /*
   * Returns all drones
   */
  @web.get('/')
  async all (request, reply) {
    try {
      let list = await Drone.findByQuery({})
      let returnList = clone(list)

      returnList.slice().map((item) => {
        if (item.session) delete item.session // filter out session before replying
      })

      reply(returnList)
    } catch (err) {
      reply(err).code(503)
    }
  }

  /*
   * Saves a drone and replies a token
   */
  @web.post('/')
  async create (request, reply) {
    let payload = request.payload

    if (!payload.name) return reply('malformed request').code(400)

    let id = await Drone.save(payload)
    let list = await Drone.findByQuery({'id': id})

    if (!list.length) return reply('').code(503)

    let drone = list[0]
    let session = generateSession(id)
    let token = await JWT.sign(session, config.jwtSecret)

    drone.session = session
    drone.token = token

    await Drone.update(drone.id, drone)
    reply(drone)
  }

  /*
   * Return a single drone by id
   */
  @web.get('/{id}')
  async single (request, reply) {
    let drone = await Drone.findOneById(request.params.id)
    reply(drone)
  }

  /*
   * Refresh session and token information for a drone
   */
  @web.get('/session/refresh')
  async login (request, reply) {
    let id = request.auth.credentials.parent
    let list = await Drone.findByQuery({'id': id})

    if (!list.length) return reply('').code(503)

    let drone = list[0]
    let session = generateSession(id)
    let token = await JWT.sign(session, config.jwtSecret)

    drone.session = session

    await Drone.update(drone.id, drone)

    reply({text: 'Check auth headers for your token'})
      .header('Authorization', token)
  }

  @web.post('/checkin/{token}')
  async checkIn (request, reply) {
    var token = request.params.token

    if (token) {
      let decoded

      try {
        decoded = await JWT.verify(token, config.jwtSecret)
      } catch (err) {
        return reply(err).code(401)
      }

      await Drone.update(decoded.parent, { status: 'active' })
      reply()
    } else {
      reply('missing token').code(400)
    }
  }
}

function generateSession (id) {
  return {
    parent: id,
    id: uuid.v1(),
    type: 'drone',
    valid: true,
    exp: new Date().getTime() + 5 * 365 * 24 * 60 * 60 * 1000 // expires in 5 years
  }
}

function clone (obj) {
  return JSON.parse(JSON.stringify(obj))
}
