var curry = require('../../fn/curry');

function tap(f, s) {
  return s.on(f);
}
module.exports = curry(2, tap);
