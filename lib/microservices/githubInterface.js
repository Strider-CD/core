var GitHubApi = require('github')
var config = require('config')
var logger = require('../../lib/log.js')(module)
var senecaForwarder = require('../senecaForwarder.js')

module.exports = function (options) {
  var seneca = this
  var github = new GitHubApi({
    // required
    version: '3.0.0',
    // optional
    debug: true,
    protocol: 'https',
    host: process.env.STRIDER_GITHUB_API_SERVER, // should be api.github.com for GitHub
    //  pathPrefix: null, // for some GHEs; none for GitHub
    timeout: 5000,
    headers: {
      'user-agent': 'strider-cd' // GitHub is happy with a unique user agent
    }
  })
  var authDetails = {
    type: 'oauth',
    key: process.env.STRIDER_GITHUB_KEY,
    secret: process.env.STRIDER_GITHUB_SECRET
  }

  seneca.add({role: 'github', cmd: 'listWebhook'}, listWebhook)
  seneca.add({role: 'github', cmd: 'setWebhook'}, setWebhook)
  seneca.add({role: 'github', cmd: 'setPrStatus'}, setPrStatus)
  seneca.add({role: 'github', cmd: 'handleWebhook'}, handleGenericWebhook)
  seneca.add({role: 'github', cmd: 'handleWebhook', 'event': 'pull_request'}, handlePullrequest)

  function listWebhook (data, done) {
    if (env_variables_not_set()) {
      logger.warn('Cannot list webhook due to missing environment variable!')
      done('Strider is misconfigured', null)
      return
    }
    github.authenticate(authDetails)
    github.repos.getHooks({user: data.user, repo: data.repo}, done)
  }

  function setWebhook (data, done) {
    if (env_variables_not_set()) {
      logger.warn('Cannot set webhook due to missing environment variable!')
      done('Strider is misconfigured', null)
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
        url: process.env.STRIDER_URL_BASE + config.apiPrefix + 'github',
        content_type: 'json'
      }
    }, done)
  }

  function setPrStatus (data, done) {
    if (env_variables_not_set()) {
      logger.warn('Cannot set webhook due to missing environment variable!')
      done('Strider is misconfigured', null)
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
    }, done)
  }

  function handleGenericWebhook (data, done) {
    logger.warn('Got a webhook from Github with unhandled event type: ', data.event)
  }

  function handlePullrequest (data, done) {
    var forwarder = senecaForwarder.bind(undefined, 'jobs')
    /*
    * For details regarding actions see:
    * https://developer.github.com/v3/activity/events/types/#pullrequestevent
    *
    * List of possible actions:
    * “assigned”, “unassigned”, “labeled”, “unlabeled”, “opened”, “closed”,
    * “reopened”, “synchronize”.
    */
    var action = data.action
    if (action === 'opened' || action === 'reopened' || action === 'synchronize') {
      forwarder('new', data,
        function (err, results) {
          if (err) {
            logger.warn('Could not create new job for: ', data)
          }
        })
    } else if (action === 'closed') {
      forwarder('stop', data,
        function (err, results) {
          if (err) {
            logger.warn('Could not stop job: ', data)
          }
        })
    }
    done(null, null) // the API server is not interested in any answer
  }

  function env_variables_not_set () {
    if (!((process.env.STRIDER_GITHUB_KEY) && (process.env.STRIDER_GITHUB_KEY) && (process.env.STRIDER_URL_BASE))) {
      return false
    } else {
      return true
    }
  }

  return 'githubInterface'
}
