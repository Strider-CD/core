'use strict';

var GitHubApi = require('github');
var config = require('config');
var logger = require('../util/log')(module);

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
      'user-agent': 'strider-cd2' // GitHub is happy with a unique user agent
    }
  });

  var authDetails = null;

  if (config.get('github.token')) {
    authDetails = {
      type: 'oauth',
      token: config.get('github.token')
    };
  } else {
    authDetails = {
      type: 'oauth',
      key: config.get('github.key'),
      secret: config.get('github.secret')
    };
  }

  emitter.on('github.webhooks.list', webhooksList);
  emitter.on('github.webhooks.set', webhooksSet);
  emitter.on('github.webhooks.handle', webhooksHandle);
  emitter.on('github.pr.setStatus', prSetStatus);

  function webhooksList(data, cb) {
    github.authenticate(authDetails);
    github.repos.getHooks({ user: data.user, repo: data.repo }, cb);
  }

  function webhooksSet(data, cb) {
    github.authenticate(authDetails);
    github.repos.setHook({
      name: 'web',
      user: data.user,
      repo: data.repo,
      events: ['push', 'pull_request'],
      config: {
        // set STRIDER_URL_BASE to something like "http://foo.bar" (not that
        // there is no trailing slash)
        url: `${ config.baseUrl }${ config.apiPrefix }github`,
        content_type: 'json'
      }
    }, cb);
  }

  function prSetStatus(data, cb) {
    github.authenticate(authDetails);
    data.state = githubStatusFromJobStatusAndResult(data.state);
    data.context = 'continous-integration/strider-cd2';
    data.description = commitStateToDescription(data.state);
    github.statuses.create(data, cb);
  }

  function webhooksHandle(pr, cb) {
    // we are only handling pull requests for now
    if (pr.event !== 'pull_request') {
      cb();
      return;
    }

    /*
    * For details regarding actions see:
    * https://developer.github.com/v3/activity/events/types/#pullrequestevent
    *
    * List of possible actions:
    * “assigned”, “unassigned”, “labeled”, “unlabeled”, “opened”, “closed”,
    * “reopened”, “synchronize”.
    */
    var action = pr.action;

    if (action === 'opened' || action === 'reopened' || action === 'synchronize') {
      logger.info('got new job: ', pr.event);
      createJobFromGithubPr(pr, pr.event, cb);
      return;
    } else if (action === 'closed') {
      // TODO: check if we have enqueued / running jobs for this PR and stop them
      cb(undefined, {});
      return;
    }

    cb(undefined, {}); // the API server is not interested in any answer
    return;
  }

  function createJobFromGithubPr(pr, type, cb) {
    var job = {
      project: pr.project,
      hasChildren: false,
      requiredResource: 'linux',
      allowedToFail: false,
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
    };
    emitter.emit('jobs.queue.insert', job, function (err, res) {
      if (err) cb(err);else {
        notifyProvider(job, emitter);
        cb();
      }
    });
  }

  function githubStatusFromJobStatusAndResult(statusResult) {
    // can be either: pending, success, error or failure
    var state = 'pending';
    if (statusResult.result === 'success') state = 'success';
    if (statusResult.result === 'failed') state = 'failure';
    return state;
  }

  function commitStateToDescription(state) {
    let stateDesc = {
      'pending': 'Awaiting results',
      'success': 'The Strider CD build passed ',
      'failure': 'The Strider CD build failed!'
    };
    return stateDesc[state];
  }

  function notifyProvider(job, emitter) {
    if (job.trigger === 'github') {
      let owner = job.triggerInfo.data.branchBase.split('/')[0];
      let baseRepo = job.triggerInfo.data.branchBase.split('/')[1];
      let notification = {
        user: owner,
        repo: baseRepo,
        sha: job.triggerInfo.data.sha,
        state: {
          status: job.status,
          result: job.result
        },
        target_url: `${ config.striderUrl }/projects/${ job.project }/jobs/${ job.id }`
      };
      emitter.emit('github.pr.setStatus', notification, function (err, res) {
        if (err) logger.debug('notifyProvider setting PR status failed', err);else logger.debug('notifyProvider success', res);
      });
    }
  }
};
//# sourceMappingURL=github.js.map