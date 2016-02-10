## Github-CLI-Auth

`npm i --save github-cli-auth`

```js
require('github-cli-auth')({
  //config
}, (err, github) => {
  //err, or you're authed.
  //github is npm github package instance
});
```

Config Defaults:

```js
{
  tokenFile: '.github-cli-auth',
  note: 'node-github-cli-auth',
  noteUrl: 'https://github.com/fritzy/github-cli-auth',
  scopes: ['user', 'public_repo', 'repo', 'repo:status', 'gist'],
  pathPrefix: '',
  userAgent: 'Node-Github-CLI-Auth'
}
```
