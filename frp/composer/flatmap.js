var R = require('../rstream');
var curry = require('../../fn/curry');
var map = require('./map');

function flatmap(f, s) {
  return R.combine(function(s, self) {
    map(self, f(s()));
  }, [s]);
}
module.exports = curry(2, flatmap);
