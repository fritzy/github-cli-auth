'use strict';

const GitHubApi = require("github");
const async = require('async');
const unicons = require('unicons');
const read = require('read');

module.exports = function githubCliAuth(config, callback) {
  
  if (typeof config === 'undefined') {
    config = {};
  }
  config.tokenFile = config.tokenFile || '.github-cli-auth';
  config.note = config.note || 'node-github-cli-auth';
  config.noteUrl = config.noteUrl || 'https://github.com/fritzy/github-cli-auth';
  config.scopes = config.scopes || ["user", "public_repo", "repo", "repo:status", "gist"];
  config.host = config.host || 'api.github.com';
  config.pathPrefix = config.pathPrefix || '';
  config.userAgent = config.userAgent || 'Node-Github-CLI-Auth';

  let github = new GitHubApi({
    version: "3.0.0",
    debug: false,
    protocol: "https",
    host: config.host, // should be api.github.com for GitHub
    pathPrefix: config.pathPrefix, // for some GHEs; none for GitHub
    timeout: 5000,
    headers: {
      "user-agent": config.pathPrefix // GitHub is happy with a unique user agent
    }
  });

  const tokenInfo = require('home-config').load(config.tokenFile, {token: '', user: ''});

  function authBasic(user, pass) {
    github.authenticate({
        type: "basic",
        username: user,
        password: pass,
    });
    tokenInfo.user = user;
    github.authorization.create({
      scopes: config.scopes,
      note: config.note,
      note_url: config.noteUrl,
    }, function(err, res) {
      if (err && JSON.parse(err.message).documentation_url === 'https://developer.github.com/v3/auth#working-with-two-factor-authentication') {
        read({
          prompt: "Two-Factor Code:",
        }, (err, otp) => {
          github.authorization.create({
            scopes: config.scopes,
            note: config.note,
            note_url: config.noteUrl,
            headers: {
              "X-GitHub-OTP": parseInt(otp, 10)
            }
          }, function(err, res) {
            if (err) {
              let errMsg = JSON.parse(err.message);
              console.log("Error:", errMsg.message, errMsg.documentation_url);
              if (errMsg.documentation_url === 'https://developer.github.com/v3/oauth_authorizations/#create-a-new-authorization') {
                console.log(`You may already have a token named ${config.note} at https://github.com/settings/tokens`);
              }
              return callback(err, github);
            }
            tokenInfo.token = res.token;
            tokenInfo.save();
            authToken();
          });
        });
      } else {
        if (err) {
          let errMsg = JSON.parse(err.message);
          console.log("Error:", errMsg.message, errMsg.documentation_url);
          if (errMsg.documentation_url === 'https://developer.github.com/v3/oauth_authorizations/#create-a-new-authorization') {
            console.log(`You may already have a token named ${config.note} at https://github.com/settings/tokens`);
          }
          return callback(err, github);
        }
        tokenInfo.token = res.token;
        tokenInfo.save();
        authToken();
      }
    });
  }

  function authToken() {
    github.authenticate({
        type: "oauth",
        token: tokenInfo.token
    });
    callback(null, github);
  }

  if (!tokenInfo.token.length) {
    read({
      prompt: "Github Username:",
    }, (err, user, isDefault) => {
      read({
        prompt: "Password:",
        silent: true,
        replace: unicons.dot
      }, (err, pass) => {
        authBasic(user, pass);
      });
    });
  } else {
    authToken();
  }
};
