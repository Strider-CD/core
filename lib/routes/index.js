import Drones from './drones'
import Users from './users'
import Environments from './environments'
import jobs from './jobs'
import projects from './projects'
import { container } from '../di';

export default function (emitter) {
  var drones = new Drones(container)
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
