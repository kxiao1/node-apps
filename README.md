# Applications of Node.js

## Installing Node.js and npm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22
```

Now check that ``Node`` works:

```console
$ node hello-world.js
Hello World
```

## Initializing a project

```console
$ npm init
This utility will walk you through creating a package.json file.
It only covers the most common items, and tries to guess sensible defaults.

See `npm help init` for definitive documentation on these fields
and exactly what they do.

Use `npm install <pkg>` afterwards to install a package and
save it as a dependency in the package.json file.

Press ^C at any time to quit.
...

```

This creates a ``package.json`` file. Now go ahead and install other packages.
