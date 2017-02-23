import { Container, Registry } from '@glimmer/di';

class Resolver {
  retrieve(specifier) {
    let [type, name] = specifier.split(':');
 
    return require(`./${type}s/${name}.js`);
  }
}
 
export let registry = new Registry();
export let resolver = new Resolver();
export let container = new Container(registry, resolver);

registry.registerOption('model', 'singleton', true);