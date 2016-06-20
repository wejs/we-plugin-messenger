# We.js messenger plugin

[![Dependency Status](https://david-dm.org/wejs/we-plugin-messenger.png)](https://david-dm.org/wejs/we-plugin-messenger)
[![Build Status](https://travis-ci.org/wejs/we-plugin-messenger.svg?branch=0.3.x)](https://travis-ci.org/wejs/we-plugin-messenger)

## Installation

```sh
we i we-plugin-messenger
```

## Has suport to:

 - user to user talk
 - public chat
 - user to room!

## Helpers

### we-messenger-room :
```hbs
{{we-messenger-room roomId=1 heigth=300 iframeHeigth=400 width='100%'}}
```

### How to test

after clone and install npm packages:

```sh
we test
```

##### For run only 'Chat' test use:

```sh
we-test -g 'Chat'
```

##### For run the javascript linter

```sh
npm run lint
```

#### NPM Info:
[![NPM](https://nodei.co/npm/we-plugin-messenger.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/we-plugin-messenger/)

## License

Under [the MIT license](https://github.com/wejs/we/blob/master/LICENSE.md).