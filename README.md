# core

Strider Core - API connecting drones and providing an in for user plugins.

[![Build Status](https://travis-ci.org/Strider-CD/core.svg)](https://travis-ci.org/Strider-CD/core)
[![Coverage Status](https://coveralls.io/repos/Strider-CD/core/badge.svg?branch=master&service=github)](https://coveralls.io/github/Strider-CD/core?branch=master)  
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## Related Modules

* [drone](https://github.com/Strider-CD/drone) - Drones are lightweight plugin
  runners that are triggered by a project's environments.

## Testing

Tests are written with [tape] and Hapi's internal injection system.

```sh
npm test
```

[tape]: https://github.com/substack/tape
