# core

[![Greenkeeper badge](https://badges.greenkeeper.io/Strider-CD/core.svg)](https://greenkeeper.io/)

Strider Core - API connecting projects and drones for continuous integration/deployment

[![Build Status](https://travis-ci.org/Strider-CD/core.svg)](https://travis-ci.org/Strider-CD/core)
[![Code Climate](https://codeclimate.com/github/Strider-CD/core/badges/gpa.svg)](https://codeclimate.com/github/Strider-CD/core)
[![Test Coverage](https://codeclimate.com/github/Strider-CD/core/badges/coverage.svg)](https://codeclimate.com/github/Strider-CD/core/coverage)

Requires Node 6 or greater.

## Related Modules

* [drone](https://github.com/Strider-CD/drone) - Drones are lightweight plugin
  runners that are triggered by a project's environments.

## Contributing

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

### Building Documentation

```no-highlight
npm run docs
```

### Testing

Tests are written with [tape] and Hapi's internal injection system.

```sh
npm test
```

Also see https://github.com/phiros/inject-github-pr for easy testing during dev.

[tape]: https://github.com/substack/tape
