export default class Controller {
  constructor(container) {
    this.container = container
  }

  modelFor(name) {
    return this.container.lookup(`model:${name}`)
  }
}
