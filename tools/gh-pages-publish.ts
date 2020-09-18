const { cd, exec, echo, touch } = require('shelljs')
const { readFileSync } = require('fs')
const url = require('url')

let repoUrl
let pkg = JSON.parse(readFileSync('package.json'))
if (typeof pkg.repository === 'object') {
  if (!pkg.repository.hasOwnProperty('ssh')) {
    throw new Error('URL does not exist in repository section')
  }
  repoUrl = pkg.repository.ssh
}

echo('Deploying docs!!!')
cd('docs')
touch('.nojekyll')
exec('git init')
exec('git add .')
exec('git config user.name "Ahmad Al Haddad"')
exec('git config user.email "haddad@ah.sa"')
exec('git commit -m "docs(docs): update gh-pages"')
exec(`git push --force --quiet "${repoUrl}" master:gh-pages`)
echo('Docs deployed!!')
