'use strict'

var GitHubApi = require('github')
var config = require('config')
var logger = require('../util/log')(module)

module.exports = function (emitter, client) {
  var github = new GitHubApi({
    // required
    version: '3.0.0',
    // optional
    debug: true,
    protocol: 'https',
    host: config.get('github.apiServer'),
    // pathPrefix: null, // for some GHEs; none for GitHub
    timeout: 5000,
    headers: {
      'user-agent': 'strider-cd' // GitHub is happy with a unique user agent
    }
  })
  var authDetails = {
    type: 'oauth',
    key: config.get('github.key'),
    secret: config.get('github.secret')
  }

  emitter.on('github.webhooks.list', webhooksList)
  emitter.on('github.webhooks.set', webhooksSet)
  emitter.on('github.webhooks.handle', webhooksHandle)
  emitter.on('github.pr.setStatus', prSetStatus)

  function webhooksList (data, cb) {
    if (env_variables_not_set()) {
      cb('cannot list webhook due to missing environment variable!')
      return
    }
    github.authenticate(authDetails)
    github.repos.getHooks({user: data.user, repo: data.repo}, cb)
  }

  function webhooksSet (data, cb) {
    if (env_variables_not_set()) {
      cb('Cannot set webhook due to missing environment variable!')
      return
    }
    github.authenticate(authDetails)
    github.repos.setHook({
      name: 'web',
      user: data.user,
      repo: data.repo,
      events: [
        'push',
        'pull_request'
      ],
      config: {
        // set STRIDER_URL_BASE to something like "http://foo.bar" (not that
        // there is no trailing slash)
        url: `${config.baseUrl}${config.apiPrefix}github`,
        content_type: 'json'
      }
    }, cb)
  }

  function prSetStatus (data, cb) {
    if (env_variables_not_set()) {
      cb('Cannot set webhook due to missing environment variable!')
      return
    }
    github.authenticate(authDetails)
    github.statuses.create({
      user: data.user,
      repo: data.repo,
      sha: data.sha,
      state: data.state, // can be either: pending, success, error or failure
      target_url: data.url,
      context: data.context, // e.g. 'continous-integration/strider-cd'
      description: data.description // the meaning of the status (keep it short)
    }, cb)
  }

  function webhooksHandle (pr, cb) {
    // we are only handling pull requests for now
    if (pr.event !== 'pull_request') {
      cb()
      return
    }

    /*
    * For details regarding actions see:
    * https://developer.github.com/v3/activity/events/types/#pullrequestevent
    *
    * List of possible actions:
    * “assigned”, “unassigned”, “labeled”, “unlabeled”, “opened”, “closed”,
    * “reopened”, “synchronize”.
    */
    var action = pr.action

    if (action === 'opened' || action === 'reopened' || action === 'synchronize') {
      logger.info('got new job: ', pr.event)
      createJobFromGithubPr(pr, pr.event, cb)
      return
    } else if (action === 'closed') {
      // TODO: check if we have enqueued / running jobs for this PR and stop them
      cb(undefined, {})
      return
    }

    cb(undefined, {}) // the API server is not interested in any answer
    return
  }

  function env_variables_not_set () {
    if (config.get('github.secret') && config.get('github.key') && config.get('baseUrl')) {
      return false
    } else {
      return true
    }
  }

  function createJobFromGithubPr (pr, type, cb) {
    var job = {
      project: pr.project,
      hasChildren: false,
      children: {},
      parent: '',
      status: 'received',
      result: 'pending',
      stdout: {},
      stderr: {},
      trigger: 'github',
      triggerInfo: {
        'type': type,
        'action': pr.action,
        general: {
          author: {
            username: pr[type].user.login,
            image: pr[type].user.avatar_url
          },
          url: pr[type].html_url,
          message: pr[type].title
        },
        data: {
          branch: pr[type].base.ref,
          branchBase: pr[type].base.repo.full_name,
          ref: pr[type].head.ref,
          fetch: 'refs/pull/' + pr[type].number + '/merge',
          user: pr[type].head.repo.owner.login,
          repo: pr[type].head.repo.name,
          sha: pr[type].head.sha,
          number: pr[type].number
        }
      }
    }
    emitter.emit('jobs.queue.insert', job, function (err, res) {
      if (err) cb(err)
      else cb()
    })
  }
}
