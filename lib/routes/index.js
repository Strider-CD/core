'use strict'

import Drones from './drones'
import Users from './users'
import Environments from './environments'
import jobs from './jobs'
import projects from './projects'

export default function (emitter) {
  var drones = new Drones()
  var users = new Users()
  var environments = new Environments()

  return [].concat(
    projects(emitter),
    drones.routes(),
    jobs(emitter),
    users.routes(),
    environments.routes()
  )
}
