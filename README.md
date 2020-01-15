# bb-model

Automate model tasks

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@dussan/bb-model.svg)](https://npmjs.org/package/@dussan/bb-model)
[![Downloads/week](https://img.shields.io/npm/dw/@dussan/bb-model.svg)](https://npmjs.org/package/@dussan/bb-model)
[![License](https://img.shields.io/npm/l/@dussan/bb-model.svg)](https://github.com/milanovic-dusan/bb-model/blob/master/package.json)

<!-- toc -->
* [bb-model](#bb-model)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g @dussan/bb-model
$ bb-model COMMAND
running command...
$ bb-model (-v|--version|version)
@dussan/bb-model/0.2.0 darwin-x64 node-v10.17.0
$ bb-model --help [COMMAND]
USAGE
  $ bb-model COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`bb-model help [COMMAND]`](#bb-model-help-command)
* [`bb-model sync`](#bb-model-sync)

## `bb-model help [COMMAND]`

display help for bb-model

```
USAGE
  $ bb-model help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

## `bb-model sync`

Syncronizes remote model with local.

```
USAGE
  $ bb-model sync

OPTIONS
  --out-file=out-file                  [default: app-model]
  --portal-auth-path=portal-auth-path  [default: gateway/api/auth/login]
  --portal-context=portal-context      [default: gateway/api]
  --portal-host=portal-host            [default: localhost]
  --portal-name=portal-name            [default: retail-banking-demo-wc3]
  --portal-page-name=portal-page-name  [default: index]
  --portal-password=portal-password    [default: admin]
  --portal-port=portal-port            [default: 8080]
  --portal-protocol=(http|https)       [default: http]
  --portal-username=portal-username    [default: admin]

DESCRIPTION
  ...
  Produces 'app-model.json'.
  Supports .bbconfig file in the current working directory

EXAMPLE
  $ bb-model sync --portal-name=<experience-name>
     ✔ Reading configuration
     ✔ Authenticating
     ✔ Processing model
```

_See code: [src/commands/sync.ts](https://github.com/milanovic-dusan/bb-model/blob/v0.2.0/src/commands/sync.ts)_
<!-- commandsstop -->
