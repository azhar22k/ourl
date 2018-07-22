# out-url
Cross platform Node.js Utility to open urls in browser

[![NPM](https://nodei.co/npm/out-url.svg?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/out-url/)

## Supported platforms
- Android
- Windows
- MacOS
- Linux

### Example
```javascript
// Plain example
const { open } = require('out-url');
open('http://itz-azhar.github.io');
//or
require('o-url').open('http://itz-azhar.github.io');
```

```javascript
// With error handling
const { open } = require('out-url');
open('http://itz-azhar.github.io')
  .then(res => console.log('RES', res)) // Resolves with Done!
  .catch(err => console.log('ERR', err));
```
